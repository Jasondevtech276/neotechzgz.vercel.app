-- NeoTech ZGZ: least-privilege access for customer data.
-- This single migration changes privileges and RLS policies only; it does not
-- update, copy, delete, or transform customer rows.
-- Apply only after validation in an isolated, non-production database.
-- RLS governs rows; SQL grants independently govern which operations are possible.

-- Remove broad browser-role grants, then restore only operations required by
-- reviewed application routes. This does not affect the service_role/server key.
REVOKE ALL PRIVILEGES ON TABLE
  public.profiles,
  public.quotes,
  public.quote_status_history,
  public.payments,
  public.support_tickets
FROM PUBLIC, anon, authenticated;

-- Account and admin reads. Existing RLS policies constrain each result set.
GRANT SELECT ON TABLE
  public.profiles,
  public.quotes,
  public.quote_status_history,
  public.payments,
  public.support_tickets
TO authenticated;

-- Profile self-service: the only client-writable profile field.
GRANT UPDATE (display_name) ON TABLE public.profiles TO authenticated;

-- Customer support ticket creation is constrained by support_tickets_insert_own.
GRANT INSERT ON TABLE public.support_tickets TO authenticated;

-- Admin quote workflow: the API updates status only; RLS's existing
-- admin_update_solo policy is the row-level authorization boundary.
GRANT UPDATE (status) ON TABLE public.quotes TO authenticated;

-- The admin quote workflow appends status history; RLS's existing
-- quote_history_insert_admin policy restricts inserts to administrators.
GRANT INSERT ON TABLE public.quote_status_history TO authenticated;

-- Customer account page: read only quotes belonging to the signed-in user.
CREATE POLICY quotes_select_own
  ON public.quotes
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Admin dashboards use the authenticated session client. Add admin-only reads
-- while preserving the existing own-row policies.
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

-- Future application tables created by postgres are closed to browser roles
-- unless a later reviewed migration grants explicit privileges.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL PRIVILEGES ON TABLES FROM PUBLIC, anon, authenticated;

-- Post-migration read-only checks (run in the isolated database):
-- 1. Verify RLS is enabled on all five tables.
-- 2. Verify authenticated has SELECT on all five; UPDATE(display_name) on
--    profiles; UPDATE(status) on quotes; INSERT on support_tickets and
--    quote_status_history; no other browser-role writes.
-- 3. Verify policies quotes_select_own, payments_select_admin, and
--    support_tickets_select_admin exist, and the pre-existing admin/own-row
--    policies remain unchanged.
-- 4. Exercise customer and admin routes with synthetic users; deny cross-user
--    reads and all customer writes to quotes, payments, and history.
