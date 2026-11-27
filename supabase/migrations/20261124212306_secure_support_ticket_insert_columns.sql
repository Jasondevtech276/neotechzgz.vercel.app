-- Keep ticket lifecycle fields under server control.
-- Authenticated customers may provide only the owner, subject and message.
BEGIN;

REVOKE INSERT ON TABLE public.support_tickets FROM authenticated;
GRANT INSERT (user_id, subject, message)
  ON TABLE public.support_tickets TO authenticated;

COMMIT;
