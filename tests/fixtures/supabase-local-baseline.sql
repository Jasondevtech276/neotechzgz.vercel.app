-- Test-only baseline for the pre-existing tables that are not represented
-- by initial migrations in this repository. Runs only in a disposable local stack.
CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar NOT NULL,
  name varchar NOT NULL,
  company varchar,
  service varchar NOT NULL,
  hours integer,
  description text,
  budget_generated numeric,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  status varchar DEFAULT 'pending'
);
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  stripe_session_id text NOT NULL UNIQUE,
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
  latest_invoice_id text
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
