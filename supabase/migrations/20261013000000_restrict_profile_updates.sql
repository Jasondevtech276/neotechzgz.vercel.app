-- Authenticated users can edit their display name only. The previous row-level
-- policy allowed a user to update every column on their own profile, including
-- the is_admin privilege flag.
revoke update on table public.profiles from public, anon, authenticated;
grant update (display_name) on table public.profiles to authenticated;
