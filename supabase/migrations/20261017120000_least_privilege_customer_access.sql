-- NeoTech ZGZ: least-privilege access for customer data.
-- This migration changes grants and RLS policies only; it does not update,
-- copy, delete, or transform customer rows.
-- Apply only after validation in an isolated, non-production database.
-- RLS governs rows; SQL grants independently govern permitted operations.

BEGIN;

-- Fail closed if supabase_admin still grants CRUD on future public tables.
-- This migration is not guaranteed to have authority to alter that role's
-- defaults. Resolve this with an authorized owner/platform procedure first;
-- do not elevate postgres or bypass this guard.
DO $
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_default_acl d
    CROSS JOIN LATERAL aclexplode(d.defaclacl) acl
    LEFT JOIN pg_roles grantee ON grantee.oid = acl.grantee
    WHERE d.defaclobjtype = 'r'
      AND d.defaclnamespace = 'public'::regnamespace
      AND d.defaclrole = (SELECT oid FROM pg_roles WHERE rolname = 'supabase_admin')
      AND (acl.grantee = 0 OR grantee.rolname IN ('anon', 'authenticated'))
      AND acl.privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER')
  ) THEN
    RAISE EXCEPTION
      'Unsafe supabase_admin default table privileges remain; resolve with an authorized owner/platform procedure before applying this migration';
  END IF;
END $;

-- Remove both table-level and column-level privileges. REVOKE on a table does
-- not remove independently granted column privileges, so handle both layers.
DO $$
DECLARE
  target_table text;
  column_list text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'profiles',
    'quotes',
    'quote_status_history',
    'payments',
    'support_tickets'
  ] LOOP
    SELECT string_agg(format('%I', column_name), ', ' ORDER BY ordinal_position)
      INTO column_list
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = target_table;

    IF column_list IS NULL THEN
      RAISE EXCEPTION 'Required table public.% does not exist', target_table;
    END IF;

    EXECUTE format(
      'REVOKE ALL PRIVILEGES (%s) ON TABLE public.%I FROM PUBLIC, anon, authenticated',
      column_list,
      target_table
    );
  END LOOP;
END $$;

REVOKE ALL PRIVILEGES ON TABLE
  public.profiles,
  public.quotes,
  public.quote_status_history,
  public.payments,
  public.support_tickets
FROM PUBLIC, anon, authenticated;

-- Read permissions are available only to authenticated sessions and remain
-- constrained by each table's RLS policies.
GRANT SELECT ON TABLE
  public.profiles,
  public.quotes,
  public.quote_status_history,
  public.payments,
  public.support_tickets
TO authenticated;

-- Profile self-service: only the display name may be changed.
GRANT UPDATE (display_name) ON TABLE public.profiles TO authenticated;

-- Customer support ticket creation: users cannot set status, timestamps or ID.
-- RLS's support_tickets_insert_own policy also requires user_id = auth.uid().
GRANT INSERT (user_id, subject, message)
  ON TABLE public.support_tickets TO authenticated;

-- Admin quote workflow: status only; RLS's admin_update_solo restricts the row.
GRANT UPDATE (status) ON TABLE public.quotes TO authenticated;

-- Admins append history; quote_history_insert_admin is the row-level boundary.
GRANT INSERT (quote_id, status, note, changed_by)
  ON TABLE public.quote_status_history TO authenticated;

-- Customers can read their own quotes; admins retain access via admin_select_solo.
CREATE POLICY quotes_select_own
  ON public.quotes
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Existing own-row payment/ticket policies remain. These additional policies
-- preserve admin dashboards when table grants are narrowed.
CREATE POLICY payments_select_admin
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
    )
  );

CREATE POLICY support_tickets_select_admin
  ON public.support_tickets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
    )
  );

-- Future application tables created by postgres remain closed by default.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL PRIVILEGES ON TABLES FROM PUBLIC, anon, authenticated;

COMMIT;
