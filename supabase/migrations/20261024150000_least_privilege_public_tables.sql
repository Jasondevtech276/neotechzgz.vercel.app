-- NeoTech ZGZ: least-privilege Data API grants for the canonical application database.
-- RLS remains the row-level boundary; grants independently restrict which operations
-- anon/authenticated can invoke. Apply only to the canonical project qkzmpxyefuqdhyxwfjcw.
-- Reversible by restoring the prior table grants, but do not restore broad DML without review.

BEGIN;

-- Remove broad default table-level DML grants for public clients.
REVOKE ALL PRIVILEGES ON TABLE
  public.profiles,
  public.payments,
  public.quotes,
  public.quote_status_history,
  public.support_tickets
FROM anon, authenticated;

-- Remove any column-level UPDATE grants before granting only the intended columns.
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

-- No direct anonymous table access is needed: public quote submission already
-- requires a verified signed-in user and is written server-side with a secret key.
-- Authenticated clients get only operations used by the application.
GRANT SELECT ON TABLE
  public.profiles,
  public.payments,
  public.quotes,
  public.quote_status_history,
  public.support_tickets
TO authenticated;

GRANT UPDATE (display_name) ON TABLE public.profiles TO authenticated;
GRANT UPDATE (status) ON TABLE public.quotes TO authenticated;
GRANT INSERT ON TABLE public.quote_status_history, public.support_tickets TO authenticated;

-- The account page reads a user's own quotes directly through the user-scoped client.
-- The existing policy set lacked this SELECT policy, so that intended flow could fail.
DROP POLICY IF EXISTS quotes_select_own ON public.quotes;
CREATE POLICY quotes_select_own
  ON public.quotes
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Future public tables should be opt-in rather than automatically reachable by client roles.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;

COMMIT;
