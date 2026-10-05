create table if not exists public.payments (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete restrict, stripe_session_id text not null unique, stripe_customer_id text, stripe_subscription_id text, product_id text not null, status text not null check (status in ('paid','pending','failed','refunded')), amount_cents integer not null check (amount_cents >= 0), created_at timestamptz not null default now());
alter table public.payments enable row level security;
drop policy if exists payments_select_own on public.payments;
create policy payments_select_own on public.payments for select to authenticated using ((select auth.uid()) = user_id);
create index if not exists payments_user_id_idx on public.payments(user_id, created_at desc);
create index if not exists payments_subscription_idx on public.payments(stripe_subscription_id) where stripe_subscription_id is not null;
