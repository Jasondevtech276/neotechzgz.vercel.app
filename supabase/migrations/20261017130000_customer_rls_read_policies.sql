-- NeoTech ZGZ: restore explicit row-level access required by account/admin views.
-- This migration is intentionally separate so the original least-privilege
-- grant migration remains auditable. Apply only in a non-production branch
-- after reviewing the complete migration sequence.

-- Customer account page: users can read only their own quote rows.
CREATE POLICY quotes_select_own
  ON public.quotes
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Admin APIs use the authenticated session client, so their database grants
-- must exist; existing admin-only RLS policies remain the actual row boundary.
GRANT UPDATE, DELETE ON TABLE public.quotes TO authenticated;
GRANT INSERT ON TABLE public.quote_status_history TO authenticated;

CREATE POLICY payments_select_admin
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.is_admin = true
    )
  );

CREATE POLICY support_tickets_select_admin
  ON public.support_tickets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.is_admin = true
    )
  );
