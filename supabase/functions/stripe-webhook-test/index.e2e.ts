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
async function requestFor(body: string, validSignature = true) {
  const signature = validSignature
    ? await stripe.webhooks.generateTestHeaderStringAsync({ payload: body, secret: webhookSecret })
    : "t=1,v1=invalid";
  return new Request("http://local.test/functions/v1/stripe-webhook-test", {
    method: "POST",
    headers: { "stripe-signature": signature, "content-type": "application/json" },
    body,
  });
}

Deno.test("E2E: signed test webhook persists only metadata through Supabase REST to isolated PostgreSQL; retries are idempotent", async () => {
  const handler = createHandler();
  const eventId = "evt_e2e_isolated_001";
  const body = eventPayload(eventId);
  const first = await handler(await requestFor(body));
  const firstJson = await first.json();
  if (first.status !== 200 || firstJson.duplicate !== false || firstJson.testMode !== true) {
    throw new Error("First signed event was not accepted: " + JSON.stringify({ status: first.status, body: firstJson }));
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

  const retry = await handler(await requestFor(body));
  const retryJson = await retry.json();
  if (retry.status !== 200 || retryJson.duplicate !== true) {
    throw new Error("Retry was not idempotent: " + JSON.stringify({ status: retry.status, body: retryJson }));
  }

  const { count, error: countError } = await supabase.from("stripe_webhook_test_events")
    .select("event_id", { count: "exact", head: true }).eq("event_id", eventId);
  if (countError || count !== 1) throw new Error("Duplicate delivery created more than one row");
});

Deno.test("E2E: invalid signature and signed live-mode event never reach persistence", async () => {
  const handler = createHandler();
  const invalid = await handler(await requestFor(eventPayload("evt_e2e_invalid_001"), false));
  if (invalid.status !== 400) throw new Error("Invalid signature was not rejected");

  const liveBody = eventPayload("evt_e2e_live_001", true);
  const live = await handler(await requestFor(liveBody));
  if (live.status !== 400) throw new Error("Live-mode event was not rejected");

  const { count, error } = await supabase.from("stripe_webhook_test_events")
    .select("event_id", { count: "exact", head: true })
    .in("event_id", ["evt_e2e_invalid_001", "evt_e2e_live_001"]);
  if (error || count !== 0) throw new Error("Rejected event unexpectedly reached persistence");
});
