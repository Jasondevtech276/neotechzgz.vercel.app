import Stripe from "npm:stripe@23.0.0";
import { createHandler } from "./index.ts";

const webhookSecret = "whsec_ci_placeholder";
const env: Record<string, string> = {
  STRIPE_TEST_SECRET_KEY: "sk_test_ci_placeholder",
  STRIPE_TEST_WEBHOOK_SECRET: webhookSecret,
  SUPABASE_URL: "https://example.invalid",
  SUPABASE_SERVICE_ROLE_KEY: "placeholder",
};
const getEnv = (name: string) => env[name];
const payload = (livemode = false) => JSON.stringify({
  id: "evt_ci_001", object: "event", api_version: "2025-09-30.clover",
  created: Math.floor(Date.now() / 1000),
  data: { object: { id: "pi_ci_001", object: "payment_intent" } },
  livemode, pending_webhooks: 1, request: { id: null, idempotency_key: null },
  type: "payment_intent.succeeded",
});
async function signedRequest(body: string, signature?: string) {
  const stripe = new Stripe(env.STRIPE_TEST_SECRET_KEY);
  return new Request("https://example.invalid", {
    method: "POST",
    headers: { "stripe-signature": signature ??
      await stripe.webhooks.generateTestHeaderStringAsync({ payload: body, secret: webhookSecret }) },
    body,
  });
}

Deno.test("method and configuration fail closed", async () => {
  const handler = createHandler({ getEnv: () => undefined });
  if ((await handler(new Request("https://example.invalid", { method: "GET" }))).status !== 405) {
    throw new Error("Expected 405 for non-POST");
  }
  if ((await handler(new Request("https://example.invalid", {
    method: "POST", headers: { "stripe-signature": "invalid" }, body: "{}",
  }))).status !== 503) throw new Error("Expected 503 for missing configuration");
});

Deno.test("invalid signature is rejected without persistence", async () => {
  let calls = 0;
  const handler = createHandler({ getEnv, persistEvent: async () => { calls++; return null; } });
  const response = await handler(await signedRequest(payload(), "t=1,v1=invalid"));
  if (response.status !== 400 || calls !== 0) throw new Error("Invalid signature reached persistence");
});

Deno.test("live event is rejected even with valid signature", async () => {
  let calls = 0;
  const handler = createHandler({ getEnv, persistEvent: async () => { calls++; return null; } });
  const response = await handler(await signedRequest(payload(true)));
  if (response.status !== 400 || calls !== 0) throw new Error("Live event reached persistence");
});

Deno.test("valid test event stores metadata and digest without raw payload", async () => {
  let saved: Record<string, unknown> | undefined;
  const handler = createHandler({ getEnv, persistEvent: async row => { saved = row; return null; } });
  const response = await handler(await signedRequest(payload()));
  if (response.status !== 200 || saved?.event_id !== "evt_ci_001") throw new Error("Event not stored");
  if (typeof saved?.payload_sha256 !== "string" || !/^[a-f0-9]{64}$/.test(saved.payload_sha256)) {
    throw new Error("Digest missing");
  }
  if ("payload" in (saved ?? {}) || "raw_payload" in (saved ?? {})) throw new Error("Raw payload stored");
});

Deno.test("duplicate and storage failures have safe responses", async () => {
  const duplicate = createHandler({ getEnv, persistEvent: async () => ({ code: "23505" }) });
  const dup = await duplicate(await signedRequest(payload()));
  if (dup.status !== 200 || (await dup.json()).duplicate !== true) throw new Error("Duplicate not idempotent");
  for (const persistEvent of [
    async () => ({ code: "08006" }),
    async () => { throw new Error("synthetic failure"); },
  ]) {
    const handler = createHandler({ getEnv, persistEvent });
    if ((await handler(await signedRequest(payload()))).status !== 500) throw new Error("Expected retryable 500");
  }
});

Deno.test("oversized payload is rejected before signature verification or persistence", async () => {
  let calls = 0;
  const handler = createHandler({ getEnv, persistEvent: async () => { calls++; return null; } });
  const response = await handler(new Request("https://example.invalid", {
    method: "POST",
    headers: { "stripe-signature": "t=1,v1=invalid" },
    body: "x".repeat(1_048_577),
  }));
  if (response.status !== 413 || calls !== 0) {
    throw new Error("Oversized payload was not rejected safely");
  }
});
