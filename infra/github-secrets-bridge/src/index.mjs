import sodium from "libsodium-wrappers-sumo";
import {
  PROBE_SECRET_NAME,
  REPOSITORY,
  constantTimeEqual,
  parseBearer,
} from "./policy.mjs";

const GITHUB_API = "https://api.github.com";
const API_VERSION = "2022-11-28";
const MCP_VERSION = "2025-11-25";

const json = (body, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      ...extraHeaders,
    },
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
    pemToPkcs8Bytes(env.GITHUB_APP_PRIVATE_KEY),
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
    body: JSON.stringify({ encrypted_value: encryptedValue, key_id: publicKey.key_id }),
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

function allowedNames(env) {
  return new Set(
    (env.ALLOWED_SECRET_NAMES ?? "")
      .split(",")
      .map((name) => name.trim())
      .filter((name) => /^[A-Z_][A-Z0-9_]{0,99}$/.test(name)),
  );
}

function status(env, requestUrl) {
  return {
    service: "neotechzgz-github-secrets-bridge",
    mode: "fail-closed",
    repository: REPOSITORY,
    api_token_configured: Boolean(env.BRIDGE_API_TOKEN),
    github_app_configured: appConfigured(env),
    test_probe_enabled: env.ENABLE_TEST_SECRET_PROBE === "true",
    production_secret_mutations_enabled: env.ENABLE_PRODUCTION_SECRET_OPS === "true",
    production_allowlist_size: allowedNames(env).size,
    secret_values_are_returned: false,
    secret_entry_url: new URL("/secret-entry", requestUrl).toString(),
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
    description: "Creates the reserved harmless probe secret, verifies its metadata, then deletes it. Refuses to overwrite an existing probe. Requires explicit test-probe enablement.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
];

async function callTool(name, env, requestUrl) {
  if (name === "bridge_status") return status(env, requestUrl);
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
        try { await deleteSecret(token, PROBE_SECRET_NAME); } catch { /* Never log secret material. */ }
      }
    }
  }
  throw new Error("Unknown tool");
}

function rpcResult(id, result) {
  return json({ jsonrpc: "2.0", id, result });
}

function htmlEscape(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function secretEntryPage(env) {
  const names = [...allowedNames(env)].sort();
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const options = names.map((name) => `<option value="${htmlEscape(name)}"></option>`).join("");
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>NEOTECHZGZ Secret Entry</title>
<style>
body{font:16px system-ui,sans-serif;max-width:42rem;margin:3rem auto;padding:0 1rem;color:#17202a}
label{display:block;margin:1rem 0 .35rem;font-weight:600}input{box-sizing:border-box;width:100%;padding:.75rem;border:1px solid #89939e;border-radius:.4rem}
button{margin-top:1rem;padding:.75rem 1rem;border:0;border-radius:.4rem;background:#17202a;color:white;font-weight:600}
small{color:#52616b}#result{white-space:pre-wrap;margin-top:1rem}
</style></head><body>
<h1>GitHub Actions secret entry</h1>
<p>Values entered here are sent directly to the bridge and encrypted for GitHub. They are not submitted to ChatGPT.</p>
<p><strong>Repository:</strong> ${REPOSITORY}</p>
<form id="secret-form" autocomplete="off">
<label for="token">Bridge bearer token</label><input id="token" type="password" required autocomplete="off">
<label for="name">Allowed secret name</label><input id="name" list="allowed" required pattern="[A-Z_][A-Z0-9_]{0,99}"><datalist id="allowed">${options}</datalist>
<label for="value">Secret value</label><input id="value" type="password" required autocomplete="new-password">
<small>Secret values are never displayed again or returned by this service.</small>
<button type="submit">Save / replace secret</button>
</form>
<hr>
<form id="delete-form" autocomplete="off">
<h2>Delete a secret</h2>
<label for="delete-token">Bridge bearer token</label><input id="delete-token" type="password" required autocomplete="off">
<label for="delete-name">Allowed secret name</label><input id="delete-name" list="allowed" required pattern="[A-Z_][A-Z0-9_]{0,99}">
<label for="confirm-name">Type the same name to confirm deletion</label><input id="confirm-name" required>
<button type="submit">Delete secret</button>
</form>
<div id="result" role="status" aria-live="polite"></div>
<script nonce="${nonce}">
const result=document.getElementById("result");
document.getElementById("secret-form").addEventListener("submit",async(e)=>{
 e.preventDefault();result.textContent="Saving…";
 const token=document.getElementById("token").value;
 const name=document.getElementById("name").value;
 const value=document.getElementById("value").value;
 try{
  const r=await fetch("/api/secret",{method:"POST",headers:{"content-type":"application/json","authorization":"Bearer "+token},body:JSON.stringify({name,value})});
  const d=await r.json();if(!r.ok)throw new Error(d.error||"Request failed");
  result.textContent="Saved: "+name;document.getElementById("value").value="";
 }catch(err){result.textContent="Error: "+err.message}
});
document.getElementById("delete-form").addEventListener("submit",async(e)=>{
 e.preventDefault();result.textContent="Deleting…";
 const token=document.getElementById("delete-token").value;
 const name=document.getElementById("delete-name").value;
 const confirmName=document.getElementById("confirm-name").value;
 try{
  const r=await fetch("/api/secret/delete",{method:"POST",headers:{"content-type":"application/json","authorization":"Bearer "+token},body:JSON.stringify({name,confirmName})});
  const d=await r.json();if(!r.ok)throw new Error(d.error||"Request failed");
  result.textContent="Deleted: "+name;document.getElementById("delete-form").reset();
 }catch(err){result.textContent="Error: "+err.message}
});
</script></body></html>`;
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "content-security-policy": `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src 'self'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'`,
    },
  });
}

async function handleSecretWrite(request, env, isDelete) {
  if (env.ENABLE_PRODUCTION_SECRET_OPS !== "true") return json({ error: "Production secret operations are disabled" }, 403);
  if (!appConfigured(env)) return json({ error: "GitHub App is not configured" }, 503);
  const size = Number(request.headers.get("content-length") ?? "0");
  if (size > 65_536) return json({ error: "Request too large" }, 413);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const { name, value, confirmName } = body ?? {};
  if (typeof name !== "string" || !allowedNames(env).has(name)) return json({ error: "Secret name is not in the configured allowlist" }, 403);
  if (isDelete && confirmName !== name) return json({ error: "Deletion confirmation does not match" }, 400);
  if (!isDelete && (typeof value !== "string" || value.length < 1 || value.length > 60_000)) {
    return json({ error: "Secret value must contain 1 to 60000 characters" }, 400);
  }
  const token = await installationToken(env);
  if (isDelete) {
    await deleteSecret(token, name);
    return json({ ok: true, operation: "deleted", name });
  }
  await putEncryptedSecret(token, name, value);
  return json({ ok: true, operation: "saved", name });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/secret-entry") {
      return secretEntryPage(env);
    }

    if (request.method === "POST" && (url.pathname === "/api/secret" || url.pathname === "/api/secret/delete")) {
      const supplied = parseBearer(request.headers.get("authorization"));
      if (!env.BRIDGE_API_TOKEN || !supplied || !constantTimeEqual(supplied, env.BRIDGE_API_TOKEN)) {
        return json({ error: "Unauthorized" }, 401);
      }
      try {
        return await handleSecretWrite(request, env, url.pathname.endsWith("/delete"));
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : "Operation failed" }, 502);
      }
    }

    if (request.method !== "POST" || url.pathname !== "/mcp") return json({ error: "Not found" }, 404);
    const supplied = parseBearer(request.headers.get("authorization"));
    if (!env.BRIDGE_API_TOKEN || !supplied || !constantTimeEqual(supplied, env.BRIDGE_API_TOKEN)) {
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
      try {
        const result = await callTool(message.params?.name, env, request.url);
        return rpcResult(message.id, { content: [{ type: "text", text: JSON.stringify(result) }], isError: false });
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
