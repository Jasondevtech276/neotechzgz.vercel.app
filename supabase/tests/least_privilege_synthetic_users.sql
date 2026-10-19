-- Synthetic-user authorization and atomicity tests.
-- Run only after the disposable fixture and both migrations.
\set ON_ERROR_STOP on
BEGIN;

INSERT INTO public.profiles (id, display_name, is_admin) VALUES
 ('00000000-0000-0000-0000-00000000000a', 'Customer A', false),
 ('00000000-0000-0000-0000-00000000000b', 'Customer B', false),
 ('00000000-0000-0000-0000-00000000000c', 'Test Admin', true);
INSERT INTO public.quotes (id, user_id, status, name, budget_calculated) VALUES
 ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'recibida', 'A quote', 100),
 ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000b', 'recibida', 'B quote', 200);
INSERT INTO public.payments (user_id, amount, status) VALUES
 ('00000000-0000-0000-0000-00000000000a', 10, 'pending'),
 ('00000000-0000-0000-0000-00000000000b', 20, 'pending');
INSERT INTO public.support_tickets (user_id, subject, message) VALUES
 ('00000000-0000-0000-0000-00000000000a', 'A ticket', 'Synthetic'),
 ('00000000-0000-0000-0000-00000000000b', 'B ticket', 'Synthetic');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);

DO $$
BEGIN
  IF (SELECT count(*) FROM public.quotes) <> 1 THEN RAISE EXCEPTION 'Customer A quote isolation failed'; END IF;
  IF (SELECT count(*) FROM public.payments) <> 1 THEN RAISE EXCEPTION 'Customer A payment isolation failed'; END IF;
  IF (SELECT count(*) FROM public.support_tickets) <> 1 THEN RAISE EXCEPTION 'Customer A ticket isolation failed'; END IF;
  IF (SELECT count(*) FROM public.quote_status_history) <> 0 THEN RAISE EXCEPTION 'Unexpected customer history rows'; END IF;

  UPDATE public.profiles SET display_name = 'A Updated' WHERE id = auth.uid();
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND display_name = 'A Updated') THEN
    RAISE EXCEPTION 'Own display-name update failed';
  END IF;

  BEGIN
    UPDATE public.profiles SET is_admin = true WHERE id = auth.uid();
    RAISE EXCEPTION 'Customer unexpectedly updated is_admin';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  DECLARE affected_rows integer;
  BEGIN
    UPDATE public.quotes SET status = 'cancelada' WHERE id = '10000000-0000-0000-0000-00000000000a';
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    IF affected_rows <> 0 THEN
      RAISE EXCEPTION 'Customer unexpectedly updated quote status (% rows)', affected_rows;
    END IF;
  END;
  IF (SELECT status FROM public.quotes WHERE id = '10000000-0000-0000-0000-00000000000a') <> 'recibida' THEN
    RAISE EXCEPTION 'Customer changed quote status despite RLS';
  END IF;
  BEGIN
    INSERT INTO public.support_tickets (user_id, subject, message, status)
    VALUES (auth.uid(), 'Escalation', 'Denied', 'closed');
    RAISE EXCEPTION 'Customer unexpectedly set ticket status';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO public.payments (user_id, amount, status) VALUES (auth.uid(), 999, 'paid');
    RAISE EXCEPTION 'Customer unexpectedly inserted payment';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO public.quote_status_history (quote_id, status, changed_by)
    VALUES ('10000000-0000-0000-0000-00000000000a', 'cancelada', auth.uid());
    RAISE EXCEPTION 'Customer unexpectedly inserted quote history';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;

RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE result record;
BEGIN
  IF (SELECT count(*) FROM public.quotes) <> 2 THEN RAISE EXCEPTION 'Admin quote visibility failed'; END IF;
  IF (SELECT count(*) FROM public.payments) <> 2 THEN RAISE EXCEPTION 'Admin payment visibility failed'; END IF;
  IF (SELECT count(*) FROM public.support_tickets) <> 2 THEN RAISE EXCEPTION 'Admin ticket visibility failed'; END IF;
  SELECT * INTO result FROM public.admin_update_quote_status(
    '10000000-0000-0000-0000-00000000000a', 'en curso'
  );
  IF result.previous_status <> 'recibida' OR result.current_status <> 'en curso' THEN
    RAISE EXCEPTION 'Unexpected RPC transition: % -> %', result.previous_status, result.current_status;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.quote_status_history
    WHERE quote_id = '10000000-0000-0000-0000-00000000000a'
      AND status = 'en curso' AND changed_by = auth.uid()) THEN
    RAISE EXCEPTION 'RPC did not append history';
  END IF;
END $$;
RESET ROLE;

-- Inject a synthetic failure into history insertion and prove the status update rolls back.
CREATE FUNCTION public.test_fail_history_insert() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'cancelada' THEN RAISE EXCEPTION 'synthetic history failure'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER test_fail_history_insert BEFORE INSERT ON public.quote_status_history
FOR EACH ROW EXECUTE FUNCTION public.test_fail_history_insert();

SET LOCAL ROLE authenticated;
DO $$
DECLARE actual_status text;
BEGIN
  BEGIN
    PERFORM public.admin_update_quote_status('10000000-0000-0000-0000-00000000000a', 'cancelada');
    RAISE EXCEPTION 'Expected synthetic history failure was not raised';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'Expected synthetic history failure was not raised' THEN RAISE; END IF;
    IF SQLERRM <> 'synthetic history failure' THEN RAISE; END IF;
  END;
  SELECT status INTO actual_status FROM public.quotes
  WHERE id = '10000000-0000-0000-0000-00000000000a';
  IF actual_status <> 'en curso' THEN
    RAISE EXCEPTION 'Atomicity failure: quote status persisted as %', actual_status;
  END IF;
END $$;
RESET ROLE;

-- Trigger execution must remain effective even after direct EXECUTE is revoked
-- from client roles. Simulate a request identity while executing as table owner.
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
DO $$
BEGIN
  BEGIN
    UPDATE public.profiles SET deleted_at = now()
    WHERE id = '00000000-0000-0000-0000-00000000000a';
    RAISE EXCEPTION 'Retention trigger failed to block client deletion-state change';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'Retention trigger failed to block client deletion-state change' THEN RAISE; END IF;
    IF SQLERRM <> 'Account deletion state can only be changed by the account deletion service' THEN RAISE; END IF;
  END;
  IF EXISTS (SELECT 1 FROM public.profiles
    WHERE id = '00000000-0000-0000-0000-00000000000a' AND deleted_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Retention trigger left a client-requested deleted_at change in place';
  END IF;
END $$;

ROLLBACK;
