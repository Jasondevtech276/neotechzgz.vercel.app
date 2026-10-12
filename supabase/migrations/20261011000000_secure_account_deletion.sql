-- Account deletion policy:
-- 1. Only an explicit request may set profiles.deleted_at.
-- 2. The timestamp is immutable to ordinary authenticated clients (the service role
--    may set it), so clients cannot shorten the 60-day recovery window themselves.
-- 3. The retention job anonymizes business records before deleting the auth user.

create index if not exists profiles_pending_deletion_idx
  on public.profiles (deleted_at)
  where deleted_at is not null and is_admin = false;

create or replace function public.prevent_client_deleted_at_changes()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is not null and new.deleted_at is distinct from old.deleted_at then
    raise exception 'Account deletion state can only be changed by the account deletion service';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_deleted_at on public.profiles;
create trigger profiles_protect_deleted_at
before update of deleted_at on public.profiles
for each row execute function public.prevent_client_deleted_at_changes();

-- Keep an anonymized payment ledger without retaining a live account foreign key.
alter table public.payments alter column user_id drop not null;
alter table public.payments alter column stripe_session_id drop not null;
alter table public.payments drop constraint if exists payments_user_id_fkey;
alter table public.payments
  add constraint payments_user_id_fkey foreign key (user_id)
  references auth.users(id) on delete set null;

-- Support content is scrubbed by the retention job before account removal.
alter table public.support_tickets alter column user_id drop not null;
alter table public.support_tickets drop constraint if exists support_tickets_user_id_fkey;
alter table public.support_tickets
  add constraint support_tickets_user_id_fkey foreign key (user_id)
  references auth.users(id) on delete set null;
