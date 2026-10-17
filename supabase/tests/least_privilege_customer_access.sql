-- Structural assertions for least_privilege_customer_access.sql.
-- Run only against a disposable/local database after applying the migration.
-- This script is read-only apart from raising an exception on failed assertions.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles',
    'quotes',
    'quote_status_history',
    'payments',
    'support_tickets'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = t
        AND c.relkind = 'r'
        AND c.relrowsecurity
    ) THEN
      RAISE EXCEPTION 'RLS must be enabled on public.%', t;
    END IF;

    IF has_table_privilege('anon', format('public.%I', t), 'SELECT')
       OR has_table_privilege('anon', format('public.%I', t), 'INSERT')
       OR has_table_privilege('anon', format('public.%I', t), 'UPDATE')
       OR has_table_privilege('anon', format('public.%I', t), 'DELETE') THEN
      RAISE EXCEPTION 'anon must have no table-level CRUD on public.%', t;
    END IF;
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
     OR has_table_privilege('authenticated', 'public.quotes', 'INSERT')
     OR has_table_privilege('authenticated', 'public.quotes', 'DELETE') THEN
    RAISE EXCEPTION 'Quote grants do not match least-privilege expectations';
  END IF;

  IF NOT has_table_privilege('authenticated', 'public.support_tickets', 'INSERT')
     OR has_table_privilege('authenticated', 'public.support_tickets', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.support_tickets', 'DELETE')
     OR NOT has_table_privilege('authenticated', 'public.quote_status_history', 'INSERT')
     OR has_table_privilege('authenticated', 'public.quote_status_history', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.quote_status_history', 'DELETE') THEN
    RAISE EXCEPTION 'Ticket/history grants do not match least-privilege expectations';
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

-- These structural assertions do not replace authenticated integration tests.
-- Test separately with synthetic customer A, customer B, and an admin:
-- customer A can read only A's quotes/payments/tickets/history;
-- customer A cannot read B's rows or write quotes/payments/history;
-- customer A can update only profiles.display_name and create own tickets;
-- admin can read all quotes/payments/tickets and update quote status/history.
