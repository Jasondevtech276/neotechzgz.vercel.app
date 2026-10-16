-- The app exposes these tables through PostgREST with RLS.
-- These table-wide/DDL privileges are not required by application requests.
REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
  ON TABLE public.payments, public.profiles, public.quote_status_history,
           public.quotes, public.support_tickets
  FROM anon, authenticated;

-- Apply the same least-privilege rule to future application tables created by migrations.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
  ON TABLES FROM anon, authenticated;

-- Rollback, if a verified dependency is discovered:
-- GRANT TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
--   ON TABLE public.payments, public.profiles, public.quote_status_history,
--            public.quotes, public.support_tickets
--   TO anon, authenticated;
-- ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
--   GRANT TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
--   ON TABLES TO anon, authenticated;
