-- CI-ONLY canonical schema fixture.
-- The workflow copies this file into a temporary Supabase project as the
-- earliest migration. It is never placed in supabase/migrations in the repo
-- and must never be pushed to a hosted Supabase project.

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar NOT NULL,
  name varchar NOT NULL,
  company varchar,
  service varchar NOT NULL,
  hours integer,
  description text,
  budget_generated numeric,
  budget_calculated numeric(12,2),
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT now(),
  status varchar DEFAULT 'pending',
  client_code text NOT NULL DEFAULT ('NTZ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX quotes_client_code_uidx ON public.quotes(client_code);
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.quote_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quote_status_history ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject varchar(160) NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_session_id text UNIQUE,
  stripe_customer_id text,
  stripe_subscription_id text,
  product_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('paid', 'pending', 'failed', 'refunded')),
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  invoice_id text,
  receipt_url text,
  current_period_end timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  latest_invoice_created_at bigint,
  latest_invoice_id text,
  subscription_status text CHECK (
    subscription_status IS NULL OR subscription_status IN (
      'active','trialing','past_due','canceled','incomplete',
      'incomplete_expired','unpaid','paused'
    )
  )
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  livemode boolean NOT NULL,
  status text NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'processed', 'failed')),
  attempts integer NOT NULL DEFAULT 1 CHECK (attempts > 0),
  received_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  last_error text
);
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.stripe_invoices (
  stripe_invoice_id text PRIMARY KEY,
  stripe_subscription_id text,
  stripe_customer_id text,
  status text NOT NULL,
  amount_due bigint NOT NULL DEFAULT 0 CHECK (amount_due >= 0),
  amount_paid bigint NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  currency text NOT NULL,
  invoice_created_at bigint NOT NULL,
  hosted_invoice_url text,
  livemode boolean NOT NULL,
  last_event_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stripe_invoices ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Existing Auth trigger function referenced by the earliest hardening migration.
-- The canonical implementation and trigger are installed by the later account
-- reconciliation migration. This stub only makes the migration order explicit.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN NEW;
END;
$$;

-- Legacy RLS auto-enable helper referenced by the first hardening migration.
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN;
END;
$$;
