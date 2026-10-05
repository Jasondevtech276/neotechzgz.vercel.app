alter function public.update_updated_at_column() set search_path = public;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
create index if not exists quote_status_history_changed_by_idx on public.quote_status_history (changed_by);

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists quote_history_select_own_or_admin on public.quote_status_history;
create policy quote_history_select_own_or_admin on public.quote_status_history for select to authenticated using (exists (select 1 from public.quotes q where q.id = quote_id and (q.user_id = (select auth.uid()) or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true))));
drop policy if exists quote_history_insert_admin on public.quote_status_history;
create policy quote_history_insert_admin on public.quote_status_history for insert to authenticated with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true));

drop policy if exists admin_select_solo on public.quotes;
create policy admin_select_solo on public.quotes for select to authenticated using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true));
drop policy if exists admin_update_solo on public.quotes;
create policy admin_update_solo on public.quotes for update to authenticated using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true)) with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true));
drop policy if exists admin_delete_solo on public.quotes;
create policy admin_delete_solo on public.quotes for delete to authenticated using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true));
