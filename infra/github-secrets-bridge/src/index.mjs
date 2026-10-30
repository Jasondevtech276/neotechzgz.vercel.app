import sodium from "libsodium-wrappers-sumo";
import {
  PROBE_SECRET_NAME,
  REPOSITORY,
  constantTimeEqual,
  isAllowedProbeName,
  parseBearer,
} from "./policy.mjs";

const GITHUB_API = "https://api.github.com";
const API_VERSION = "2022-11-28";
const MCP_VERSION = "2025-03-26";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

function base64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function pemToBytes(pem) {
  const encoded = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const binary = atob(encoded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function createAppJwt(env) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const payload = base64Url(new TextEncoder().encode(JSON.stringify({
    iat: now - 60,
    exp: now + 540,
    iss: env.GITHUB_APP_ID,
  })));
  const unsigned = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToBytes(env.GITHUB_APP_PRIVATE_KEY),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  return `${unsigned}.${base64Url(new Uint8Array(signature))}`;
}

async function githubFetch(path, token, init = {}) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "x-github-api-version": API_VERSION,
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = null; }
  if (!response.ok) {
    const error = new Error(`GitHub API returned HTTP ${response.status}`);
    error.status = response.status;
    error.githubMessage = typeof body?.message === "string" ? body.message : "Unspecified GitHub API error";
    throw error;
  }
  return body;
}

async function installationToken(env) {
  const appJwt = await createAppJwt(env);
  const result = await githubFetch(
    `/app/installations/${encodeURIComponent(env.GITHUB_INSTALLATION_ID)}/access_tokens`,
    appJwt,
    { method: "POST" },
  );
  if (!result?.token) throw new Error("GitHub App installation token was not issued");
  return result.token;
}

async function getPublicKey(token) {
  const result = await githubFetch(`/repos/${REPOSITORY}/actions/secrets/public-key`, token);
  if (!result?.key || !result?.key_id) throw new Error("GitHub repository public key response is incomplete");
  return result;
}

async function putEncryptedSecret(token, name, value) {
  await sodium.ready;
  const publicKey = await getPublicKey(token);
  const keyBytes = sodium.from_base64(publicKey.key, sodium.base64_variants.ORIGINAL);
  const sealed = sodium.crypto_box_seal(sodium.from_string(value), keyBytes);
  const encryptedValue = sodium.to_base64(sealed, sodium.base64_variants.ORIGINAL);
  await githubFetch(`/repos/${REPOSITORY}/actions/secrets/${encodeURIComponent(name)}`, token, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      encrypted_value: encryptedValue,
      key_id: publicKey.key_id,
    }),
  });
}

async function deleteSecret(token, name) {
  await githubFetch(`/repos/${REPOSITORY}/actions/secrets/${encodeURIComponent(name)}`, token, {
    method: "DELETE",
  });
}

async function getSecretMetadata(token, name) {
  try {
    return await githubFetch(`/repos/${REPOSITORY}/actions/secrets/${encodeURIComponent(name)}`, token);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

async function listSecretNames(token) {
  const result = await githubFetch(`/repos/${REPOSITORY}/actions/secrets?per_page=100`, token);
  return {
    total_count: result.total_count ?? 0,
    secrets: (result.secrets ?? []).map(({ name, created_at, updated_at }) => ({ name, created_at, updated_at })),
  };
}

function appConfigured(env) {
  return Boolean(env.GITHUB_APP_ID && env.GITHUB_APP_PRIVATE_KEY && env.GITHUB_INSTALLATION_ID);
}

function status(env) {
  return {
    service: "neotechzgz-github-secrets-bridge",
    mode: "fail-closed",
    repository: REPOSITORY,
    api_token_configured: Boolean(env.BRIDGE_API_TOKEN),
    github_app_configured: appConfigured(env),
    test_probe_enabled: env.ENABLE_TEST_SECRET_PROBE === "true",
    production_secret_mutations_enabled: false,
    secret_values_are_returned: false,
  };
}

const toolDefinitions = [
  {
    name: "bridge_status",
    description: "Returns non-sensitive bridge configuration and security state. Never returns credentials.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "list_secret_names",
    description: "Lists GitHub Actions secret names and timestamps for the fixed repository. Never returns secret values.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "test_secret_roundtrip",
    description: "Creates a reserved harmless probe secret, verifies its metadata, then deletes it. Refuses to overwrite an existing probe. Requires explicit test-probe enablement.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
];

async function callTool(name, env) {
  if (name === "bridge_status") return status(env);
  if (name === "list_secret_names") {
    if (!appConfigured(env)) throw new Error("GitHub App is not configured");
    const token = await installationToken(env);
    return await listSecretNames(token);
  }
  if (name === "test_secret_roundtrip") {
    if (env.ENABLE_TEST_SECRET_PROBE !== "true") throw new Error("Test secret probe is disabled");
    if (!appConfigured(env)) throw new Error("GitHub App is not configured");
    const token = await installationToken(env);
    const existing = await getSecretMetadata(token, PROBE_SECRET_NAME);
    if (existing) throw new Error("Reserved probe secret already exists; refusing to overwrite it");
    let created = false;
    let deleted = false;
    try {
      await putEncryptedSecret(token, PROBE_SECRET_NAME, `neotechzgz-probe-${crypto.randomUUID()}`);
      created = true;
      const listing = await listSecretNames(token);
      const visible = listing.secrets.some((secret) => secret.name === PROBE_SECRET_NAME);
      if (!visible) throw new Error("Probe secret was not visible in metadata listing");
      await deleteSecret(token, PROBE_SECRET_NAME);
      deleted = true;
      const afterDelete = await getSecretMetadata(token, PROBE_SECRET_NAME);
      if (afterDelete) throw new Error("Probe secret still exists after deletion");
      return { created: true, listed: visible, deleted: true, repository: REPOSITORY };
    } finally {
      if (created && !deleted) {
        try { await deleteSecret(token, PROBE_SECRET_NAME); } catch { /* fail closed; never log secret data */ }
      }
    }
  }
  throw new Error("Unknown tool");
}

function rpcResult(id, result) {
  return json({ jsonrpc: "2.0", id, result });
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST" || new URL(request.url).pathname !== "/mcp") {
      return json({ error: "Not found" }, 404);
    }

    const expected = env.BRIDGE_API_TOKEN;
    const supplied = parseBearer(request.headers.get("authorization"));
    if (!expected || !supplied || !constantTimeEqual(supplied, expected)) {
      return json({ error: "Unauthorized" }, 401);
    }

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 16_384) return json({ error: "Request too large" }, 413);

    let message;
    try { message = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
    if (!message || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
      return json({ error: "Invalid JSON-RPC request" }, 400);
    }

    if (message.method === "notifications/initialized" || message.method.startsWith("notifications/")) {
      return new Response(null, { status: 202, headers: { "cache-control": "no-store" } });
    }
    if (message.method === "initialize") {
      return rpcResult(message.id, {
        protocolVersion: message.params?.protocolVersion ?? MCP_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: "neotechzgz-github-secrets-bridge", version: "0.1.0" },
      });
    }
    if (message.method === "ping") return rpcResult(message.id, {});
    if (message.method === "tools/list") return rpcResult(message.id, { tools: toolDefinitions });
    if (message.method === "tools/call") {
      const name = message.params?.name;
      try {
        const result = await callTool(name, env);
        return rpcResult(message.id, {
          content: [{ type: "text", text: JSON.stringify(result) }],
          isError: false,
        });
      } catch (error) {
        return rpcResult(message.id, {
          content: [{ type: "text", text: error instanceof Error ? error.message : "Operation failed" }],
          isError: true,
        });
      }
    }
    return json({ jsonrpc: "2.0", id: message.id ?? null, error: { code: -32601, message: "Method not found" } }, 404);
  },
};
