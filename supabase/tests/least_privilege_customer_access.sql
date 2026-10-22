-- Structural assertions for least_privilege_customer_access.sql.
-- Run only against a disposable/local database after applying the migration.
-- This test is read-only apart from raising an exception when an assertion fails.
-- It does not replace end-to-end tests with synthetic users.

DO $$
DECLARE
  target_table text;
  target_column text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'profiles',
    'quotes',
    'quote_status_history',
    'payments',
    'support_tickets'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = target_table
        AND c.relkind = 'r' AND c.relrowsecurity
    ) THEN
      RAISE EXCEPTION 'RLS must be enabled on public.%', target_table;
    END IF;

    IF has_table_privilege('anon', format('public.%I', target_table), 'SELECT')
       OR has_table_privilege('anon', format('public.%I', target_table), 'INSERT')
       OR has_table_privilege('anon', format('public.%I', target_table), 'UPDATE')
       OR has_table_privilege('anon', format('public.%I', target_table), 'DELETE') THEN
      RAISE EXCEPTION 'anon must have no table-level CRUD on public.%', target_table;
    END IF;

    -- Detect column grants too: table-level REVOKE alone is insufficient.
    FOR target_column IN
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = target_table
    LOOP
      IF has_column_privilege('anon', format('public.%I', target_table), target_column, 'SELECT')
         OR has_column_privilege('anon', format('public.%I', target_table), target_column, 'INSERT')
         OR has_column_privilege('anon', format('public.%I', target_table), target_column, 'UPDATE')
         OR has_column_privilege('anon', format('public.%I', target_table), target_column, 'REFERENCES') THEN
        RAISE EXCEPTION 'anon has column privileges on public.%.%', target_table, target_column;
      END IF;
    END LOOP;
  END LOOP;

  -- Check every authenticated write grant, including column-level grants.
  -- Table-level REVOKE does not remove independently granted column privileges.
  FOREACH target_table IN ARRAY ARRAY[
    'profiles',
    'quotes',
    'quote_status_history',
    'payments',
    'support_tickets'
  ] LOOP
    IF has_table_privilege('authenticated', format('public.%I', target_table), 'INSERT')
       OR has_table_privilege('authenticated', format('public.%I', target_table), 'UPDATE')
       OR has_table_privilege('authenticated', format('public.%I', target_table), 'DELETE')
       OR has_table_privilege('authenticated', format('public.%I', target_table), 'TRUNCATE')
       OR has_table_privilege('authenticated', format('public.%I', target_table), 'REFERENCES')
       OR has_table_privilege('authenticated', format('public.%I', target_table), 'TRIGGER') THEN
      RAISE EXCEPTION 'authenticated has an unexpected table-level write/DDL grant on public.%', target_table;
    END IF;

    FOR target_column IN
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = target_table
    LOOP
      IF has_column_privilege('authenticated', format('public.%I', target_table), target_column, 'INSERT')
         AND NOT (
           (target_table = 'support_tickets' AND target_column IN ('user_id', 'subject', 'message'))
           OR (target_table = 'quote_status_history' AND target_column IN ('quote_id', 'status', 'note', 'changed_by'))
         ) THEN
        RAISE EXCEPTION 'authenticated has unexpected INSERT on public.%.%', target_table, target_column;
      END IF;

      IF has_column_privilege('authenticated', format('public.%I', target_table), target_column, 'UPDATE')
         AND NOT (
           (target_table = 'profiles' AND target_column = 'display_name')
           OR (target_table = 'quotes' AND target_column = 'status')
         ) THEN
        RAISE EXCEPTION 'authenticated has unexpected UPDATE on public.%.%', target_table, target_column;
      END IF;

      IF has_column_privilege('authenticated', format('public.%I', target_table), target_column, 'REFERENCES') THEN
        RAISE EXCEPTION 'authenticated has unexpected REFERENCES on public.%.%', target_table, target_column;
      END IF;
    END LOOP;
  END LOOP;

  IF NOT has_table_privilege('authenticated', 'public.profiles', 'SELECT')
     OR NOT has_column_privilege('authenticated', 'public.profiles', 'display_name', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.profiles', 'is_admin', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.profiles', 'deleted_at', 'UPDATE') THEN
    RAISE EXCEPTION 'Profile grants do not match least-privilege expectations';
  END IF;

  IF NOT has_table_privilege('authenticated', 'public.quotes', 'SELECT')
     OR NOT has_column_privilege('authenticated', 'public.quotes', 'status', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.quotes', 'name', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.quotes', 'budget_calculated', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.quotes', 'INSERT')
     OR has_table_privilege('authenticated', 'public.quotes', 'DELETE') THEN
    RAISE EXCEPTION 'Quote grants do not match least-privilege expectations';
  END IF;

  IF NOT has_column_privilege('authenticated', 'public.support_tickets', 'user_id', 'INSERT')
     OR NOT has_column_privilege('authenticated', 'public.support_tickets', 'subject', 'INSERT')
     OR NOT has_column_privilege('authenticated', 'public.support_tickets', 'message', 'INSERT')
     OR has_column_privilege('authenticated', 'public.support_tickets', 'status', 'INSERT')
     OR has_column_privilege('authenticated', 'public.support_tickets', 'created_at', 'INSERT')
     OR has_table_privilege('authenticated', 'public.support_tickets', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.support_tickets', 'DELETE') THEN
    RAISE EXCEPTION 'Support-ticket grants do not match least-privilege expectations';
  END IF;

  IF NOT has_column_privilege('authenticated', 'public.quote_status_history', 'quote_id', 'INSERT')
     OR NOT has_column_privilege('authenticated', 'public.quote_status_history', 'status', 'INSERT')
     OR has_column_privilege('authenticated', 'public.quote_status_history', 'created_at', 'INSERT')
     OR has_table_privilege('authenticated', 'public.quote_status_history', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.quote_status_history', 'DELETE') THEN
    RAISE EXCEPTION 'Quote-history grants do not match least-privilege expectations';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'quotes'
      AND policyname = 'quotes_select_own' AND cmd = 'SELECT'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'payments'
      AND policyname = 'payments_select_admin' AND cmd = 'SELECT'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'support_tickets'
      AND policyname = 'support_tickets_select_admin' AND cmd = 'SELECT'
  ) THEN
    RAISE EXCEPTION 'Expected customer/admin read policies are missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'admin_update_quote_status'
      AND pg_get_function_identity_arguments(p.oid) = 'p_quote_id uuid, p_status text'
      AND NOT p.prosecdef
  ) THEN
    RAISE EXCEPTION 'Atomic quote-status function is missing or not SECURITY INVOKER';
  END IF;

  IF NOT has_function_privilege(
       'authenticated',
       'public.admin_update_quote_status(uuid,text)',
       'EXECUTE'
     )
     OR has_function_privilege(
       'anon',
       'public.admin_update_quote_status(uuid,text)',
       'EXECUTE'
     )
     OR EXISTS (
       SELECT 1
       FROM pg_proc p
       CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) acl
       WHERE p.proname = 'admin_update_quote_status'
         AND p.pronamespace = 'public'::regnamespace
         AND acl.privilege_type = 'EXECUTE'
         AND (acl.grantee = 0 OR acl.grantee = (SELECT oid FROM pg_roles WHERE rolname = 'anon'))
     ) THEN
    RAISE EXCEPTION 'Atomic quote-status function execution grants are too broad or missing';
  END IF;

  IF has_function_privilege(
       'anon',
       'public.prevent_client_deleted_at_changes()',
       'EXECUTE'
     )
     OR has_function_privilege(
       'authenticated',
       'public.prevent_client_deleted_at_changes()',
       'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'Client roles must not directly execute the account-retention trigger function';
  END IF;

  -- Check future table defaults for postgres, including PUBLIC and API roles.
  IF EXISTS (
    SELECT 1
    FROM pg_default_acl d
    CROSS JOIN LATERAL aclexplode(d.defaclacl) acl
    LEFT JOIN pg_roles grantee ON grantee.oid = acl.grantee
    WHERE d.defaclobjtype = 'r'
      AND d.defaclnamespace = 'public'::regnamespace
      AND d.defaclrole = (SELECT oid FROM pg_roles WHERE rolname = 'postgres')
      AND (acl.grantee = 0 OR grantee.rolname IN ('anon', 'authenticated'))
      AND acl.privilege_type IN (
        'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE',
        'REFERENCES', 'TRIGGER', 'MAINTAIN'
      )
  ) THEN
    RAISE EXCEPTION 'Unsafe postgres default table privileges remain for PUBLIC/anon/authenticated';
  END IF;

  -- Sequences are a separate object type; table-default revocations do not
  -- protect them. Check both PUBLIC and the API roles.
  IF EXISTS (
    SELECT 1
    FROM pg_default_acl d
    CROSS JOIN LATERAL aclexplode(d.defaclacl) acl
    LEFT JOIN pg_roles grantee ON grantee.oid = acl.grantee
    WHERE d.defaclobjtype = 'S'
      AND d.defaclnamespace = 'public'::regnamespace
      AND d.defaclrole = (SELECT oid FROM pg_roles WHERE rolname = 'postgres')
      AND (acl.grantee = 0 OR grantee.rolname IN ('anon', 'authenticated'))
      AND acl.privilege_type IN ('USAGE', 'SELECT', 'UPDATE')
  ) THEN
    RAISE EXCEPTION 'Unsafe postgres default sequence privileges remain for PUBLIC/anon/authenticated';
  END IF;

  -- Remove explicit API-role grants on future public functions and ensure
  -- the global PUBLIC EXECUTE default has been explicitly revoked.
  IF EXISTS (
    SELECT 1
    FROM pg_default_acl d
    CROSS JOIN LATERAL aclexplode(d.defaclacl) acl
    LEFT JOIN pg_roles grantee ON grantee.oid = acl.grantee
    WHERE d.defaclobjtype = 'f'
      AND d.defaclnamespace = 'public'::regnamespace
      AND d.defaclrole = (SELECT oid FROM pg_roles WHERE rolname = 'postgres')
      AND grantee.rolname IN ('anon', 'authenticated')
      AND acl.privilege_type = 'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'Unsafe postgres default function privileges remain for anon/authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_default_acl d
    WHERE d.defaclobjtype = 'f'
      AND d.defaclnamespace = 0
      AND d.defaclrole = (SELECT oid FROM pg_roles WHERE rolname = 'postgres')
  ) THEN
    RAISE EXCEPTION 'Global postgres function defaults must explicitly revoke PUBLIC EXECUTE';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_default_acl d
    CROSS JOIN LATERAL aclexplode(d.defaclacl) acl
    WHERE d.defaclobjtype = 'f'
      AND d.defaclnamespace = 0
      AND d.defaclrole = (SELECT oid FROM pg_roles WHERE rolname = 'postgres')
      AND acl.grantee = 0
      AND acl.privilege_type = 'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'PUBLIC still has EXECUTE by default on future postgres-created functions';
  END IF;

  -- supabase_admin has platform-managed defaults. This test intentionally
  -- does not treat that internal role's ACL as an application-schema blocker;
  -- verify effective privileges on user-facing objects independently.

END $$;

-- Required authenticated integration tests with synthetic customer A,
-- customer B, and an admin:
-- * A can read only A's quotes/payments/tickets/history; never B's rows.
-- * A cannot write quotes, payments, history, ticket status or timestamps.
-- * A can update only profiles.display_name and create own support tickets.
-- * Admin can read all quotes/payments/tickets and update quote status/history.
-- * Admin quote status change + history append are tested for partial failure;
--   if either fails, the workflow must report/repair inconsistency.
