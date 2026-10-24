-- NeoTech ZGZ: least-privilege Data API grants for the canonical application database.
-- RLS remains the row-level boundary; grants independently restrict which operations
-- anon/authenticated can invoke. Apply only to the canonical project qkzmpxyefuqdhyxwfjcw.
-- Reversible by restoring the prior table grants, but do not restore broad DML without review.

BEGIN;

REVOKE ALL PRIVILEGES ON TABLE
  public.profiles, public.payments, public.quotes,
  public.quote_status_history, public.support_tickets
FROM anon, authenticated;

REVOKE UPDATE (id, display_name, is_admin, created_at, deleted_at)
  ON TABLE public.profiles FROM anon, authenticated;
REVOKE UPDATE (id, name, email, company, service, hours, description,
               budget_calculated, created_at, status, client_code, user_id, updated_at)
  ON TABLE public.quotes FROM anon, authenticated;
REVOKE UPDATE (id, user_id, stripe_session_id, stripe_customer_id,
               stripe_subscription_id, product_id, status, amount_cents,
               created_at, invoice_id, receipt_url, current_period_end,
               updated_at, subscription_status)
  ON TABLE public.payments FROM anon, authenticated;
REVOKE UPDATE (id, quote_id, status, note, changed_by, created_at)
  ON TABLE public.quote_status_history FROM anon, authenticated;
REVOKE UPDATE (id, user_id, subject, message, status, created_at, updated_at)
  ON TABLE public.support_tickets FROM anon, authenticated;

-- Anonymous direct table access is not needed; quote submission is authenticated
-- and written server-side. Authenticated clients receive only required operations.
GRANT SELECT ON TABLE public.profiles, public.payments, public.quotes,
  public.quote_status_history, public.support_tickets TO authenticated;
GRANT UPDATE (display_name) ON TABLE public.profiles TO authenticated;
GRANT UPDATE (status) ON TABLE public.quotes TO authenticated;
GRANT INSERT ON TABLE public.quote_status_history, public.support_tickets TO authenticated;

-- The account page reads a user's own quotes, but the prior policy set lacked this.
DROP POLICY IF EXISTS quotes_select_own ON public.quotes;
CREATE POLICY quotes_select_own ON public.quotes FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Admin overview uses the user-scoped client, so explicit administrator read policies are needed.
DROP POLICY IF EXISTS payments_select_admin ON public.payments;
CREATE POLICY payments_select_admin ON public.payments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p
                 WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true));

DROP POLICY IF EXISTS support_tickets_select_admin ON public.support_tickets;
CREATE POLICY support_tickets_select_admin ON public.support_tickets FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p
                 WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true));

-- Future public tables should be opt-in rather than automatically reachable by client roles.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;

COMMIT;
