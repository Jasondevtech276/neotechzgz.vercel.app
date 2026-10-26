import Stripe from "npm:stripe@23.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

type StoredEvent = {
  event_id: string;
  event_type: string;
  stripe_object_id: string | null;
  payload_sha256: string;
  status: "processed";
  processed_at: string;
};

type HandlerDependencies = {
  getEnv?: (name: string) => string | undefined;
  persistEvent?: (event: StoredEvent) => Promise<{ code?: string } | null>;
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

export function createHandler(dependencies: HandlerDependencies = {}) {
  const getEnv = dependencies.getEnv ?? ((name: string) => Deno.env.get(name));
  const persistEvent = dependencies.persistEvent ?? (async (row: StoredEvent) => {
    const supabaseUrl = getEnv("SUPABASE_URL") ?? "";
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase.from("stripe_webhook_test_events").insert(row);
    return error ? { code: error.code } : null;
  });

  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") {
      return json({ error: "method_not_allowed" }, 405);
    }

    const signature = request.headers.get("stripe-signature");
    const stripeTestSecret = getEnv("STRIPE_TEST_SECRET_KEY") ?? "";
    const webhookSecret = getEnv("STRIPE_TEST_WEBHOOK_SECRET") ?? "";
    const supabaseUrl = getEnv("SUPABASE_URL") ?? "";
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY") ?? "";

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

    let persistenceError: { code?: string } | null;
    try {
      persistenceError = await persistEvent({
        event_id: event.id,
        event_type: event.type,
        stripe_object_id: object?.id ?? null,
        payload_sha256: payloadSha256,
        status: "processed",
        processed_at: new Date().toISOString(),
      });
    } catch {
      // Treat unexpected storage failures as retryable; never log payloads or credentials.
      return json({ error: "persistence_failed" }, 500);
    }

    if (persistenceError?.code === "23505") {
      return json({ received: true, duplicate: true }, 200);
    }
    if (persistenceError) {
      console.error("[stripe-webhook-test] persistence_failed", { code: persistenceError.code });
      return json({ error: "persistence_failed" }, 500);
    }

    return json({ received: true, duplicate: false, testMode: true }, 200);
  };
}

if (import.meta.main) {
  Deno.serve(createHandler());
}
