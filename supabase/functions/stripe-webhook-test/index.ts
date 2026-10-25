import Stripe from "npm:stripe@23.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const signature = request.headers.get("stripe-signature");
  const stripeTestSecret = Deno.env.get("STRIPE_TEST_SECRET_KEY") ?? "";
  const webhookSecret = Deno.env.get("STRIPE_TEST_WEBHOOK_SECRET") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  // Fail closed unless explicitly configured with test-mode credentials.
  if (
    !signature ||
    !stripeTestSecret.startsWith("sk_test_") ||
    !webhookSecret.startsWith("whsec_") ||
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    return json({ error: "test_receiver_not_configured" }, 503);
  }

  const rawBody = await request.text();
  const stripe = new Stripe(stripeTestSecret, {
    httpClient: Stripe.createFetchHttpClient(),
  });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch {
    return json({ error: "invalid_signature" }, 400);
  }

  // This endpoint must never accept or persist live-mode events.
  if (event.livemode !== false) {
    return json({ error: "live_mode_event_rejected" }, 400);
  }

  const payloadHash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(rawBody),
  );
  const payloadSha256 = Array.from(new Uint8Array(payloadHash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const object = event.data.object as { id?: string };

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from("stripe_webhook_test_events").insert({
    event_id: event.id,
    event_type: event.type,
    stripe_object_id: object?.id ?? null,
    payload_sha256: payloadSha256,
    status: "processed",
    processed_at: new Date().toISOString(),
  });

  if (error?.code === "23505") {
    return json({ received: true, duplicate: true }, 200);
  }
  if (error) {
    // Return 5xx so Stripe retries; do not log payloads or credentials.
    console.error("[stripe-webhook-test] persistence_failed", { code: error.code });
    return json({ error: "persistence_failed" }, 500);
  }

  return json({ received: true, duplicate: false, testMode: true }, 200);
});
