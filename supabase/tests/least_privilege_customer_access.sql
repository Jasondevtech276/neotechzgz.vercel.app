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
END $$;

-- Required authenticated integration tests with synthetic customer A,
-- customer B, and an admin:
-- * A can read only A's quotes/payments/tickets/history; never B's rows.
-- * A cannot write quotes, payments, history, ticket status or timestamps.
-- * A can update only profiles.display_name and create own support tickets.
-- * Admin can read all quotes/payments/tickets and update quote status/history.
-- * Admin quote status change + history append are tested for partial failure;
--   if either fails, the workflow must report/repair inconsistency.
