-- Atomic admin quote status + history operation.
-- This function is SECURITY INVOKER: grants and RLS policies still apply.
-- Apply only after the complete migration sequence is validated in isolation.

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_update_quote_status(
  p_quote_id uuid,
  p_status text
)
RETURNS TABLE (quote_id uuid, previous_status text, current_status text)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_actor uuid;
  v_previous_status text;
BEGIN
  v_actor := auth.uid();

  IF v_actor IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_actor AND p.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Not authorized to change quote status'
      USING ERRCODE = '42501';
  END IF;

  IF p_status IS NULL OR p_status NOT IN (
    'recibida', 'en revisión', 'presupuesto enviado',
    'aceptada', 'en curso', 'completada', 'cancelada'
  ) THEN
    RAISE EXCEPTION 'Invalid quote status'
      USING ERRCODE = '22023';
  END IF;

  SELECT q.status::text
    INTO v_previous_status
  FROM public.quotes q
  WHERE q.id = p_quote_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not found'
      USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.quotes q
    SET status = p_status
  WHERE q.id = p_quote_id;

  INSERT INTO public.quote_status_history (quote_id, status, changed_by)
    VALUES (p_quote_id, p_status, v_actor);

  RETURN QUERY
    SELECT p_quote_id, v_previous_status, p_status;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_quote_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_quote_status(uuid, text) TO authenticated;

COMMIT;
