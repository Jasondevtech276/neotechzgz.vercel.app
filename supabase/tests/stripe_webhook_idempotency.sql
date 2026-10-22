-- Synthetic tests for Stripe event idempotency and out-of-order delivery.
-- Run only against the disposable CI database after all migrations.
\set ON_ERROR_STOP on
BEGIN;

DO $$$
DECLARE result text;
BEGIN
  result := public.claim_stripe_webhook_event('evt_test_duplicate', 'invoice.paid', 100);
  IF result <> 'claimed' THEN RAISE EXCEPTION 'First claim should be claimed, got %', result; END IF;

  result := public.claim_stripe_webhook_event('evt_test_duplicate', 'invoice.paid', 100);
  IF result <> 'busy' THEN RAISE EXCEPTION 'Concurrent duplicate should be busy, got %', result; END IF;

  PERFORM public.finish_stripe_webhook_event('evt_test_duplicate', 'processed', NULL);
  result := public.claim_stripe_webhook_event('evt_test_duplicate', 'invoice.paid', 100);
  IF result <> 'processed' THEN RAISE EXCEPTION 'Processed duplicate should be acknowledged, got %', result; END IF;

  result := public.claim_stripe_webhook_event('evt_test_retry', 'invoice.payment_failed', 200);
  IF result <> 'claimed' THEN RAISE EXCEPTION 'First retryable event claim failed'; END IF;
  PERFORM public.finish_stripe_webhook_event('evt_test_retry', 'failed', 'SyntheticFailure');
  result := public.claim_stripe_webhook_event('evt_test_retry', 'invoice.payment_failed', 200);
  IF result <> 'claimed' THEN RAISE EXCEPTION 'Failed event should be reclaimable, got %', result; END IF;
  PERFORM public.finish_stripe_webhook_event('evt_test_retry', 'processed', NULL);

  INSERT INTO public.stripe_webhook_events (
    event_id, event_type, event_created, status, attempts, processing_started_at
  ) VALUES ('evt_test_stale', 'invoice.paid', 300, 'processing', 1, now() - interval '6 minutes');
  result := public.claim_stripe_webhook_event('evt_test_stale', 'invoice.paid', 300);
  IF result <> 'claimed' THEN RAISE EXCEPTION 'Stale processing event should be reclaimable, got %', result; END IF;
  PERFORM public.finish_stripe_webhook_event('evt_test_stale', 'processed', NULL);
END $$;

DO $$$
DECLARE result text;
DECLARE payment_status text;
DECLARE v_subscription_status text;
BEGIN
  result := public.apply_stripe_payment_event(
    'checkout.session.completed', 100, '00000000-0000-0000-0000-00000000000a',
    'synthetic-product', 'cs_test_ordering', 'cus_test_ordering', 'sub_test_ordering',
    'paid', 1200, NULL, NULL, NULL, NULL
  );
  IF result <> 'applied' THEN RAISE EXCEPTION 'Checkout event should apply, got %', result; END IF;

  result := public.apply_stripe_payment_event(
    'invoice.payment_failed', 90, NULL, NULL, NULL, NULL, 'sub_test_ordering',
    'failed', NULL, 'in_old', NULL, NULL, NULL
  );
  IF result <> 'ignored' THEN RAISE EXCEPTION 'Older invoice event should be ignored, got %', result; END IF;
  SELECT status INTO payment_status FROM public.payments WHERE stripe_session_id = 'cs_test_ordering';
  IF payment_status <> 'paid' THEN RAISE EXCEPTION 'Older invoice regressed payment status to %', payment_status; END IF;

  result := public.apply_stripe_payment_event(
    'invoice.payment_failed', 110, NULL, NULL, NULL, NULL, 'sub_test_ordering',
    'failed', NULL, 'in_new', NULL, NULL, NULL
  );
  IF result <> 'applied' THEN RAISE EXCEPTION 'Newer invoice event should apply, got %', result; END IF;
  result := public.apply_stripe_payment_event(
    'invoice.paid', 105, NULL, NULL, NULL, NULL, 'sub_test_ordering',
    'paid', NULL, 'in_old_paid', NULL, NULL, NULL
  );
  IF result <> 'ignored' THEN RAISE EXCEPTION 'Out-of-order invoice.paid should be ignored, got %', result; END IF;
  SELECT status INTO payment_status FROM public.payments WHERE stripe_session_id = 'cs_test_ordering';
  IF payment_status <> 'failed' THEN RAISE EXCEPTION 'Older invoice.paid regressed payment status to %', payment_status; END IF;

  result := public.apply_stripe_payment_event(
    'customer.subscription.updated', 150, NULL, NULL, NULL, NULL, 'sub_test_ordering',
    NULL, NULL, NULL, NULL, 'active', now() + interval '30 days'
  );
  IF result <> 'applied' THEN RAISE EXCEPTION 'Newer subscription event should apply, got %', result; END IF;
  result := public.apply_stripe_payment_event(
    'customer.subscription.deleted', 140, NULL, NULL, NULL, NULL, 'sub_test_ordering',
    NULL, NULL, NULL, NULL, 'canceled', NULL
  );
  IF result <> 'ignored' THEN RAISE EXCEPTION 'Older subscription event should be ignored, got %', result; END IF;
  SELECT p.subscription_status INTO v_subscription_status FROM public.payments p WHERE p.stripe_session_id = 'cs_test_ordering';
  IF v_subscription_status <> 'active' THEN RAISE EXCEPTION 'Older subscription event regressed state to %', v_subscription_status; END IF;
END $$;


DO $$
DECLARE result text;
BEGIN
  result := public.apply_stripe_payment_event(
    'checkout.session.completed', 400, '00000000-0000-0000-0000-00000000000b',
    'synthetic-null-status', 'cs_test_null_status', 'cus_test_null_status', NULL,
    NULL, 100, NULL, NULL, NULL, NULL
  );
  IF result <> 'ignored' THEN RAISE EXCEPTION 'Checkout with NULL payment status must be ignored, got %', result; END IF;

  result := public.apply_stripe_payment_event(
    'invoice.payment_failed', 401, NULL, NULL, NULL, NULL, 'sub_test_ordering',
    NULL, NULL, 'in_null_status', NULL, NULL, NULL
  );
  IF result <> 'ignored' THEN RAISE EXCEPTION 'Invoice with NULL payment status must be ignored, got %', result; END IF;

  BEGIN
    PERFORM public.finish_stripe_webhook_event('evt_invalid_status', NULL, NULL);
    RAISE EXCEPTION 'NULL terminal status should have been rejected';
  EXCEPTION WHEN SQLSTATE '22023' THEN
    NULL;
  END;
END $$;

DO $$
BEGIN
  IF has_table_privilege('anon', 'public.stripe_webhook_events', 'SELECT') OR
     has_table_privilege('authenticated', 'public.stripe_webhook_events', 'SELECT') THEN
    RAISE EXCEPTION 'Client roles unexpectedly have access to Stripe event ledger';
  END IF;
  IF has_function_privilege('anon', 'public.claim_stripe_webhook_event(text,text,bigint)', 'EXECUTE') OR
     has_function_privilege('authenticated', 'public.claim_stripe_webhook_event(text,text,bigint)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Client roles unexpectedly can claim Stripe events';
  END IF;
  IF NOT has_function_privilege('service_role', 'public.claim_stripe_webhook_event(text,text,bigint)', 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role cannot claim Stripe events';
  END IF;
END $$;

ROLLBACK;
