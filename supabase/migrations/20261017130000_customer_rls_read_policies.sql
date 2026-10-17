-- NeoTech ZGZ: restore explicit row-level reads needed by account/admin views.
-- This migration is intentionally separate so the original least-privilege
-- grant migration can remain auditable. Apply only in a non-production branch
-- after reviewing the complete migration sequence.

CREATE POLICY quotes_select_own
  ON public.quotes
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

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
