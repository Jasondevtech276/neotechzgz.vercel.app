-- Preview-only follow-up: collapse equivalent customer/admin SELECT predicates.
-- This preserves the same access rules while avoiding multiple permissive SELECT policies.
BEGIN;
DROP POLICY IF EXISTS quotes_select_own ON public.quotes;
DROP POLICY IF EXISTS quotes_select_admin ON public.quotes;
CREATE POLICY quotes_select_own_or_admin ON public.quotes
  FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );
DROP POLICY IF EXISTS payments_select_own ON public.payments;
DROP POLICY IF EXISTS payments_select_admin ON public.payments;
CREATE POLICY payments_select_own_or_admin ON public.payments
  FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );
DROP POLICY IF EXISTS support_tickets_select_own ON public.support_tickets;
DROP POLICY IF EXISTS support_tickets_select_admin ON public.support_tickets;
CREATE POLICY support_tickets_select_own_or_admin ON public.support_tickets
  FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
  );
COMMIT;