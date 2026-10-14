-- Align the payment ledger schema with the account-retention anonymization workflow.
-- NULL values are required to detach retained ledger rows from deleted identities.
ALTER TABLE public.payments
  ALTER COLUMN user_id DROP NOT NULL,
  ALTER COLUMN stripe_session_id DROP NOT NULL;

-- Subscription lifecycle is independent from the financial state of a payment.
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS subscription_status text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.payments'::regclass
      AND conname = 'payments_subscription_status_check'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_subscription_status_check
      CHECK (
        subscription_status IS NULL OR
        subscription_status IN (
          'active',
          'trialing',
          'past_due',
          'canceled',
          'incomplete',
          'incomplete_expired',
          'unpaid',
          'paused'
        )
      );
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS payments_subscription_status_idx
  ON public.payments (subscription_status)
  WHERE subscription_status IS NOT NULL;
