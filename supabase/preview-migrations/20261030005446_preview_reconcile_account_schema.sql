-- NeoTechZGZ Preview only: reconcile account, quote, support and payment schema.
-- Apply only to Supabase Preview project hdpikaqxeadqmckmmjfh.
-- Additive/backfill migration; no production project, Stripe Live account or live webhook is touched.
BEGIN;

-- Quote model: preserve the legacy generated estimate while introducing the
-- canonical field used by the current application.
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS budget_calculated numeric(12,2),
  ADD COLUMN IF NOT EXISTS client_code text,
  ADD COLUMN IF NOT EXISTS user_id uuid;

UPDATE public.quotes
SET budget_calculated = budget_generated
WHERE budget_calculated IS NULL AND budget_generated IS NOT NULL;

UPDATE public.quotes
SET client_code = 'NTZ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
WHERE client_code IS NULL OR btrim(client_code) = '';

ALTER TABLE public.quotes
  ALTER COLUMN client_code SET DEFAULT ('NTZ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  ALTER COLUMN client_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS quotes_client_code_uidx ON public.quotes (client_code);
CREATE INDEX IF NOT EXISTS quotes_user_created_idx ON public.quotes (user_id, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.quotes'::regclass AND conname = 'quotes_user_id_fkey'
  ) THEN
    ALTER TABLE public.quotes
      ADD CONSTRAINT quotes_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- Account profile. Admin status is never sourced from user metadata.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS profiles_deleted_at_idx
  ON public.profiles (deleted_at)
  WHERE deleted_at IS NOT NULL;

-- Backfill existing Preview identities without granting administrator privileges.
INSERT INTO public.profiles (id, display_name, is_admin)
SELECT
  u.id,
  left(coalesce(nullif(btrim(u.raw_user_meta_data ->> 'name'), ''),
                nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''), ''), 80),
  false
FROM auth.users AS u
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name, is_admin)
  VALUES (
    NEW.id,
    left(coalesce(nullif(btrim(NEW.raw_user_meta_data ->> 'name'), ''),
                  nullif(btrim(NEW.raw_user_meta_data ->> 'full_name'), ''), ''), 80),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Quote status history is append-only for authenticated admins.
CREATE TABLE IF NOT EXISTS public.quote_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quote_status_history_quote_created_idx
  ON public.quote_status_history (quote_id, created_at ASC);
CREATE INDEX IF NOT EXISTS quote_status_history_changed_by_idx
  ON public.quote_status_history (changed_by);

-- Customer support tickets: ownership is detached, not deleted, during account retention.
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject varchar(160) NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_tickets_user_created_idx
  ON public.support_tickets (user_id, created_at DESC);

-- Align the payment ledger with retention and subscription webhook writes.
ALTER TABLE public.payments
  ALTER COLUMN user_id DROP NOT NULL,
  ALTER COLUMN stripe_session_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS subscription_status text;

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_user_id_fkey;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.payments'::regclass
      AND conname = 'payments_subscription_status_check'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_subscription_status_check
      CHECK (
        subscription_status IS NULL OR subscription_status IN (
          'active','trialing','past_due','canceled','incomplete',
          'incomplete_expired','unpaid','paused'
        )
      );
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS payments_subscription_status_idx
  ON public.payments (subscription_status)
  WHERE subscription_status IS NOT NULL;

-- Deny-by-default client grants. Service role remains the only direct writer
-- for financial ledgers; authenticated users receive only the operations used
-- by the application and are still constrained by RLS.
REVOKE ALL PRIVILEGES ON TABLE
  public.profiles, public.quotes, public.payments,
  public.quote_status_history, public.support_tickets,
  public.stripe_webhook_events, public.stripe_invoices,
  public.stripe_webhook_test_events
FROM PUBLIC, anon, authenticated;

GRANT ALL PRIVILEGES ON TABLE
  public.profiles, public.quotes, public.payments,
  public.quote_status_history, public.support_tickets,
  public.stripe_webhook_events, public.stripe_invoices,
  public.stripe_webhook_test_events
TO service_role;

GRANT SELECT ON TABLE public.profiles, public.quotes, public.payments,
  public.quote_status_history, public.support_tickets TO authenticated;
GRANT UPDATE (display_name) ON TABLE public.profiles TO authenticated;
GRANT UPDATE (status) ON TABLE public.quotes TO authenticated;
GRANT INSERT ON TABLE public.quote_status_history TO authenticated;
GRANT INSERT ON TABLE public.support_tickets TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_test_events ENABLE ROW LEVEL SECURITY;

-- Profiles: own profile only; only display_name is client-updatable by grant.
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = id);
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Quotes: customers can read only their own; admins can read and change status.
DROP POLICY IF EXISTS quotes_select_own ON public.quotes;
CREATE POLICY quotes_select_own ON public.quotes
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS quotes_select_admin ON public.quotes;
CREATE POLICY quotes_select_admin ON public.quotes
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
  ));
DROP POLICY IF EXISTS quotes_update_admin ON public.quotes;
CREATE POLICY quotes_update_admin ON public.quotes
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
  ));

-- Payment rows: read-own plus admin read; all writes stay server-side.
DROP POLICY IF EXISTS payments_select_own ON public.payments;
CREATE POLICY payments_select_own ON public.payments
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS payments_select_admin ON public.payments;
CREATE POLICY payments_select_admin ON public.payments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
  ));

-- History: visible to the owning customer or admin; only admins can append.
DROP POLICY IF EXISTS quote_history_select_own_or_admin ON public.quote_status_history;
CREATE POLICY quote_history_select_own_or_admin ON public.quote_status_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_id AND q.user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
    )
  );
DROP POLICY IF EXISTS quote_history_insert_admin ON public.quote_status_history;
CREATE POLICY quote_history_insert_admin ON public.quote_status_history
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
  ));

-- Support: customers read/create their own tickets; admins can read all.
DROP POLICY IF EXISTS support_tickets_select_own ON public.support_tickets;
CREATE POLICY support_tickets_select_own ON public.support_tickets
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS support_tickets_select_admin ON public.support_tickets;
CREATE POLICY support_tickets_select_admin ON public.support_tickets
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
  ));
DROP POLICY IF EXISTS support_tickets_insert_own ON public.support_tickets;
CREATE POLICY support_tickets_insert_own ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Stripe ledgers intentionally have no client policies or client grants.
-- Keep service-role-only access and RLS enabled.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;

COMMIT;
