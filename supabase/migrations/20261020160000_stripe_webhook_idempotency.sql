-- Durable Stripe event idempotency and out-of-order state protection.
-- Restricted to server-side service_role; no customer/API-role access.
BEGIN;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_event_created bigint,
  ADD COLUMN IF NOT EXISTS subscription_event_created bigint;

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  event_created bigint NOT NULL,
  status text NOT NULL CHECK (status IN ('processing', 'processed', 'failed')),
  attempts integer NOT NULL DEFAULT 1 CHECK (attempts > 0),
  processing_started_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  last_error_category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.stripe_webhook_events FROM PUBLIC, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.stripe_webhook_events TO service_role;

CREATE OR REPLACE FUNCTION public.claim_stripe_webhook_event(
  p_event_id text,
  p_event_type text,
  p_event_created bigint
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_status text;
BEGIN
  IF p_event_id IS NULL OR p_event_id = '' OR p_event_type IS NULL OR p_event_created IS NULL THEN
    RAISE EXCEPTION 'Invalid Stripe event identity' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.stripe_webhook_events (
    event_id, event_type, event_created, status, attempts,
    processing_started_at, created_at, updated_at
  ) VALUES (
    p_event_id, p_event_type, p_event_created, 'processing', 1,
    now(), now(), now()
  )
  ON CONFLICT (event_id) DO UPDATE
  SET event_type = EXCLUDED.event_type,
      event_created = EXCLUDED.event_created,
      status = 'processing',
      attempts = public.stripe_webhook_events.attempts + 1,
      processing_started_at = now(),
      processed_at = NULL,
      last_error_category = NULL,
      updated_at = now()
  WHERE public.stripe_webhook_events.status = 'failed'
     OR (
       public.stripe_webhook_events.status = 'processing'
       AND public.stripe_webhook_events.processing_started_at < now() - interval '5 minutes'
     )
  RETURNING status INTO v_status;

  IF FOUND THEN
    RETURN 'claimed';
  END IF;

  SELECT status INTO v_status
  FROM public.stripe_webhook_events
  WHERE event_id = p_event_id;

  IF v_status = 'processed' THEN
    RETURN 'processed';
  END IF;

  RETURN 'busy';
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_stripe_webhook_event(
  p_event_id text,
  p_status text,
  p_error_category text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF p_status NOT IN ('processed', 'failed') THEN
    RAISE EXCEPTION 'Invalid Stripe event terminal status' USING ERRCODE = '22023';
  END IF;

  UPDATE public.stripe_webhook_events
  SET status = p_status,
      processed_at = CASE WHEN p_status = 'processed' THEN now() ELSE NULL END,
      last_error_category = CASE WHEN p_status = 'failed' THEN left(coalesce(p_error_category, 'processing_failed'), 100) ELSE NULL END,
      updated_at = now()
  WHERE event_id = p_event_id AND status = 'processing';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stripe event is not currently claimed' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_stripe_payment_event(
  p_event_type text,
  p_event_created bigint,
  p_user_id uuid,
  p_product_id text,
  p_session_id text,
  p_customer_id text,
  p_subscription_id text,
  p_payment_status text,
  p_amount_cents integer,
  p_invoice_id text,
  p_receipt_url text,
  p_subscription_status text,
  p_current_period_end timestamptz
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_event_created IS NULL THEN
    RAISE EXCEPTION 'Missing Stripe event timestamp' USING ERRCODE = '22023';
  END IF;

  IF p_event_type IN ('checkout.session.completed', 'checkout.session.async_payment_succeeded') THEN
    IF p_user_id IS NULL OR p_product_id IS NULL OR p_session_id IS NULL OR p_payment_status <> 'paid' OR coalesce(p_amount_cents, -1) < 0 THEN
      RETURN 'ignored';
    END IF;

    INSERT INTO public.payments (
      user_id, stripe_session_id, stripe_customer_id, stripe_subscription_id,
      product_id, status, amount_cents, payment_event_created, updated_at
    ) VALUES (
      p_user_id, p_session_id, p_customer_id, p_subscription_id,
      p_product_id, 'paid', coalesce(p_amount_cents, 0), p_event_created, now()
    )
    ON CONFLICT (stripe_session_id) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        stripe_customer_id = EXCLUDED.stripe_customer_id,
        stripe_subscription_id = EXCLUDED.stripe_subscription_id,
        product_id = EXCLUDED.product_id,
        status = EXCLUDED.status,
        amount_cents = EXCLUDED.amount_cents,
        payment_event_created = EXCLUDED.payment_event_created,
        updated_at = now()
    WHERE public.payments.payment_event_created IS NULL
       OR public.payments.payment_event_created <= EXCLUDED.payment_event_created
    RETURNING id INTO v_id;

    IF FOUND THEN RETURN 'applied'; END IF;
    RETURN 'ignored';
  END IF;

  IF p_event_type IN ('customer.subscription.updated', 'customer.subscription.deleted') THEN
    IF p_subscription_id IS NULL OR p_subscription_status IS NULL THEN RETURN 'ignored'; END IF;

    UPDATE public.payments
    SET subscription_status = p_subscription_status,
        current_period_end = p_current_period_end,
        subscription_event_created = p_event_created,
        updated_at = now()
    WHERE stripe_subscription_id = p_subscription_id
      AND (subscription_event_created IS NULL OR subscription_event_created <= p_event_created)
    RETURNING id INTO v_id;

    IF FOUND THEN RETURN 'applied'; END IF;
    IF EXISTS (SELECT 1 FROM public.payments WHERE stripe_subscription_id = p_subscription_id) THEN RETURN 'ignored'; END IF;
    RETURN 'not_found';
  END IF;

  IF p_event_type IN ('invoice.paid', 'invoice.payment_failed') THEN
    IF p_subscription_id IS NULL OR p_payment_status NOT IN ('paid', 'failed') THEN RETURN 'ignored'; END IF;

    UPDATE public.payments
    SET status = p_payment_status,
        invoice_id = p_invoice_id,
        receipt_url = p_receipt_url,
        payment_event_created = p_event_created,
        updated_at = now()
    WHERE stripe_subscription_id = p_subscription_id
      AND (payment_event_created IS NULL OR payment_event_created <= p_event_created)
    RETURNING id INTO v_id;

    IF FOUND THEN RETURN 'applied'; END IF;
    IF EXISTS (SELECT 1 FROM public.payments WHERE stripe_subscription_id = p_subscription_id) THEN RETURN 'ignored'; END IF;
    RETURN 'not_found';
  END IF;

  RETURN 'ignored';
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.claim_stripe_webhook_event(text, text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON FUNCTION public.finish_stripe_webhook_event(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON FUNCTION public.apply_stripe_payment_event(text, bigint, uuid, text, text, text, text, text, integer, text, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_stripe_webhook_event(text, text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_stripe_webhook_event(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_stripe_payment_event(text, bigint, uuid, text, text, text, text, text, integer, text, text, text, timestamptz) TO service_role;

COMMIT;
