import Stripe from "npm:stripe@23.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { createHandler } from "./index.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const webhookSecret = Deno.env.get("STRIPE_TEST_WEBHOOK_SECRET") ?? "";
const stripeSecret = Deno.env.get("STRIPE_TEST_SECRET_KEY") ?? "";
if (!supabaseUrl || !serviceRoleKey || !webhookSecret.startsWith("whsec_") || !stripeSecret.startsWith("sk_test_")) {
  throw new Error("E2E test requires isolated, ephemeral test credentials");
}
const stripe = new Stripe(stripeSecret, { httpClient: Stripe.createFetchHttpClient() });
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const eventPayload = (id: string, livemode = false) => JSON.stringify({
  id, object: "event", api_version: "2025-09-30.clover",
  created: Math.floor(Date.now() / 1000),
  data: { object: { id: "pi_ephemeral_e2e", object: "payment_intent" } },
  livemode, pending_webhooks: 1, request: { id: null, idempotency_key: null },
  type: "payment_intent.succeeded",
});
async function postWebhook(baseUrl: string, body: string, validSignature = true) {
  const signature = validSignature
    ? await stripe.webhooks.generateTestHeaderStringAsync({ payload: body, secret: webhookSecret })
    : "t=1,v1=invalid";
  return await fetch(baseUrl, {
    method: "POST",
    headers: { "stripe-signature": signature, "content-type": "application/json" },
    body,
  });
}
function startReceiver(handler = createHandler()) {
  const server = Deno.serve({ hostname: "127.0.0.1", port: 0, onListen: () => {} }, handler);
  const address = server.addr as Deno.NetAddr;
  return { server, url: `http://127.0.0.1:${address.port}/functions/v1/stripe-webhook-test` };
}

Deno.test("E2E: signed test webhook persists minimal metadata and sequential retries are idempotent", async () => {
  const receiver = startReceiver();
  try {
    const eventId = "evt_e2e_isolated_001";
    const body = eventPayload(eventId);
    const first = await postWebhook(receiver.url, body);
    const firstJson = await first.json();
    if (first.status !== 200 || firstJson.duplicate !== false || firstJson.testMode !== true) {
      throw new Error("First signed event was not accepted");
    }

    const { data, error } = await supabase.from("stripe_webhook_test_events")
      .select("event_id,event_type,stripe_object_id,payload_sha256,status")
      .eq("event_id", eventId).maybeSingle();
    if (error) throw new Error("Could not verify persisted row: " + error.code);
    if (!data || data.event_type !== "payment_intent.succeeded" ||
        data.stripe_object_id !== "pi_ephemeral_e2e" || data.status !== "processed" ||
        !/^[a-f0-9]{64}$/.test(data.payload_sha256)) {
      throw new Error("Persisted row did not match expected minimal metadata");
    }
    if ("payload" in data || "raw_payload" in data) throw new Error("Raw payload unexpectedly persisted");

    const retry = await postWebhook(receiver.url, body);
    const retryJson = await retry.json();
    if (retry.status !== 200 || retryJson.duplicate !== true) {
      throw new Error("Sequential retry was not idempotent");
    }

    const { count, error: countError } = await supabase.from("stripe_webhook_test_events")
      .select("event_id", { count: "exact", head: true }).eq("event_id", eventId);
    if (countError || count !== 1) throw new Error("Duplicate delivery created more than one row");
  } finally {
    await receiver.server.shutdown();
  }
});

Deno.test("E2E: concurrent duplicate deliveries persist exactly one event", async () => {
  const receiver = startReceiver();
  try {
    const eventId = "evt_e2e_concurrent_001";
    const body = eventPayload(eventId);
    const responses = await Promise.all([
      postWebhook(receiver.url, body),
      postWebhook(receiver.url, body),
    ]);
    const results = await Promise.all(responses.map(async response => ({
      status: response.status,
      body: await response.json(),
    })));
    if (results.some(result => result.status !== 200)) {
      throw new Error("Concurrent duplicate delivery returned a non-2xx response");
    }
    if (results.filter(result => result.body.duplicate === false).length !== 1 ||
        results.filter(result => result.body.duplicate === true).length !== 1) {
      throw new Error("Concurrent delivery did not produce exactly one insert and one duplicate");
    }
    const { count, error } = await supabase.from("stripe_webhook_test_events")
      .select("event_id", { count: "exact", head: true }).eq("event_id", eventId);
    if (error || count !== 1) throw new Error("Concurrent deliveries created more than one row");
  } finally {
    await receiver.server.shutdown();
  }
});

Deno.test("E2E: persistence failure returns retryable 500 without leaking internals", async () => {
  const receiver = startReceiver(createHandler({
    persistEvent: async () => ({ code: "08006" }),
  }));
  try {
    const response = await postWebhook(receiver.url, eventPayload("evt_e2e_storage_failure_001"));
    const body = await response.json();
    if (response.status !== 500 || body.error !== "persistence_failed") {
      throw new Error("Persistence failure did not return a retryable safe response");
    }
    if ("detail" in body || "secret" in body || "payload" in body) {
      throw new Error("Persistence failure response leaked internal data");
    }
  } finally {
    await receiver.server.shutdown();
  }
});

Deno.test("E2E: invalid signature and signed live-mode event never reach persistence", async () => {
  const receiver = startReceiver();
  try {
    const invalid = await postWebhook(receiver.url, eventPayload("evt_e2e_invalid_001"), false);
    if (invalid.status !== 400) throw new Error("Invalid signature was not rejected");

    const liveBody = eventPayload("evt_e2e_live_001", true);
    const live = await postWebhook(receiver.url, liveBody);
    if (live.status !== 400) throw new Error("Live-mode event was not rejected");

    const { count, error } = await supabase.from("stripe_webhook_test_events")
      .select("event_id", { count: "exact", head: true })
      .in("event_id", ["evt_e2e_invalid_001", "evt_e2e_live_001"]);
    if (error || count !== 0) throw new Error("Rejected event unexpectedly reached persistence");
  } finally {
    await receiver.server.shutdown();
  }
});
