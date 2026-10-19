-- Disposable PostgreSQL fixture for least-privilege migration CI.
-- Never run this against production. GitHub Actions creates a fresh database.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
GRANT EXECUTE ON FUNCTION auth.uid() TO PUBLIC;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY, display_name text, is_admin boolean NOT NULL DEFAULT false,
  deleted_at timestamptz, created_at timestamptz DEFAULT now()
);
CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  status varchar NOT NULL DEFAULT 'recibida', name text, budget_calculated numeric,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE public.quote_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), quote_id uuid NOT NULL REFERENCES public.quotes(id),
  status text NOT NULL, note text, changed_by uuid, created_at timestamptz DEFAULT now()
);
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  amount numeric, status text, created_at timestamptz DEFAULT now()
);
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  subject text NOT NULL, message text NOT NULL, status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated USING ((SELECT auth.uid()) = id);
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);
CREATE POLICY admin_select_solo ON public.quotes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin));
CREATE POLICY admin_update_solo ON public.quotes FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin)) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin));
CREATE POLICY admin_delete_solo ON public.quotes FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin));
CREATE POLICY quote_history_select_own_or_admin ON public.quote_status_history FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND (q.user_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin))));
CREATE POLICY quote_history_insert_admin ON public.quote_status_history FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin));
CREATE POLICY payments_select_own ON public.payments FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY support_tickets_select_own ON public.support_tickets FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY support_tickets_insert_own ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));

CREATE FUNCTION public.prevent_client_deleted_at_changes() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
