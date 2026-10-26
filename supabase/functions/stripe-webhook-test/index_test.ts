import Stripe from "npm:stripe@23.0.0";
import { createHandler } from "./index.ts";

const secret = "whsec_ci_placeholder_not_a_credential";
const env: Record<string, string> = {
  STRIPE_TEST_SECRET_KEY: "sk_test_ci_placeholder_not_a_credential",
  STRIPE_TEST_WEBHOOK_SECRET: secret,
  SUPABASE_URL: "https://example.invalid",
  SUPABASE_SERVICE_ROLE_KEY: "placeholder-not-a-credential",
};

const payloadFor = (livemode = false) => JSON.stringify({
  id: "evt_ci_001", object: "event", api_version: "2025-09-30.clover",
  created: Math.floor(Date.now() / 1000),
  data: { object: { id: "pi_ci_001", object: "payment_intent" } },
  livemode, pending_webhooks: 1, request: { id: null, idempotency_key: null },
  type: "payment_intent.succeeded",
});

const getEnv = (name: string) => env[name];

async function requestFor(payload: string, signature?: string) {
  const stripe = new Stripe(env.STRIPE_TEST_SECRET_KEY);
  return new Request("https://local.invalid", {
    method: "POST",
    headers: {
      "stripe-signature": signature ??
        stripe.webhooks.generateTestHeaderString({ payload, secret }),
    },
    body: payload,
  });
}

Deno.test("rejects methods other than POST", async () => {
  const response = await createHandler({ getEnv: () => undefined })(
    new Request("https://local.invalid", { method: "GET" }),
  );
  if (response.status !== 405) throw new Error("Expected 405");
});

Deno.test("fails closed when configuration is missing", async () => {
  const response = await createHandler({ getEnv: () => undefined })(
    new Request("https://local.invalid", {
      method: "POST", headers: { "stripe-signature": "invalid" }, body: "{}",
    }),
  );
  if (response.status !== 503) throw new Error("Expected 503");
});

Deno.test("rejects invalid signatures before persistence", async () => {
  let calls = 0;
  const handler = createHandler({ getEnv, persistEvent: async () => { calls++; return null; } });
  const response = await handler(await requestFor(payloadFor(), "t=1,v1=invalid"));
  if (response.status !== 400 || calls !== 0) throw new Error("Invalid signature was not rejected safely");
});

Deno.test("rejects live-mode events before persistence", async () => {
  let calls = 0;
  const handler = createHandler({ getEnv, persistEvent: async () => { calls++; return null; } });
  const response = await handler(await requestFor(payloadFor(true)));
  if (response.status !== 400 || calls !== 0) throw new Error("Live event was not rejected safely");
});

Deno.test("persists test event metadata and digest only", async () => {
  let saved: Record<string, unknown> | undefined;
  const handler = createHandler({ getEnv, persistEvent: async (row) => { saved = row; return null; } });
  const response = await handler(await requestFor(payloadFor()));
  if (response.status !== 200) throw new Error("Expected successful test event");
  if (saved?.event_id !== "evt_ci_001" || saved?.stripe_object_id !== "pi_ci_001") {
    throw new Error("Event metadata missing");
  }
  if (typeof saved?.payload_sha256 !== "string" || !/^[a-f0-9]{64}$/.test(saved.payload_sha256)) {
    throw new Error("Payload digest missing");
  }
  if ("payload" in (saved ?? {}) || "raw_payload" in (saved ?? {})) {
    throw new Error("Raw payload must not be stored");
  }
});

Deno.test("treats duplicates as idempotent success", async () => {
  const handler = createHandler({ getEnv, persistEvent: async () => ({ code: "23505" }) });
  const response = await handler(await requestFor(payloadFor()));
  const body = await response.json();
  if (response.status !== 200 || body.duplicate !== true) throw new Error("Duplicate not handled");
});

Deno.test("returns retryable server error for persistence failures", async () => {
  const cases = [
    createHandler({ getEnv, persistEvent: async () => ({ code: "08006" }) }),
    createHandler({ getEnv, persistEvent: async () => { throw new Error("synthetic failure"); } }),
  ];
  for (const handler of cases) {
    const response = await handler(await requestFor(payloadFor()));
    if (response.status !== 500) throw new Error("Expected retryable 500");
  }
});
