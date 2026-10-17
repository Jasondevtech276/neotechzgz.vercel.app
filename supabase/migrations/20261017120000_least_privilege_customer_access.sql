-- NeoTech ZGZ: least-privilege grants for customer data.
-- Apply through the reviewed migration workflow; this file is not executed by Vercel.
-- RLS remains the row-level boundary. SQL grants are a separate, necessary boundary.

REVOKE ALL PRIVILEGES ON TABLE
  public.profiles,
  public.quotes,
  public.quote_status_history,
  public.payments,
  public.support_tickets
FROM PUBLIC, anon, authenticated;

-- Customer-facing reads are filtered by existing RLS ownership policies.
GRANT SELECT ON TABLE
  public.profiles,
  public.quotes,
  public.quote_status_history,
  public.payments,
  public.support_tickets
TO authenticated;

-- Profile self-service: only the non-privileged display name is writable.
GRANT UPDATE (display_name) ON TABLE public.profiles TO authenticated;

-- Ticket creation is permitted only through the existing INSERT policy
-- requiring user_id = auth.uid(). No direct update/delete for customers.
GRANT INSERT ON TABLE public.support_tickets TO authenticated;

-- Quotes are created by the authenticated server route using a server-only
-- service credential; do not grant direct table inserts to browser roles.
-- Payment and quote-history writes are server-controlled.

-- New tables are closed by default for browser roles. Any future access must
-- be granted explicitly in a reviewed migration and protected by RLS.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL PRIVILEGES ON TABLES FROM PUBLIC, anon, authenticated;

-- Verification after applying:
-- SELECT tablename, policyname, roles, cmd, qual, with_check
-- FROM pg_policies WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
-- SELECT grantee, table_name, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE table_schema = 'public' AND grantee IN ('anon','authenticated')
-- ORDER BY table_name, grantee, privilege_type;
