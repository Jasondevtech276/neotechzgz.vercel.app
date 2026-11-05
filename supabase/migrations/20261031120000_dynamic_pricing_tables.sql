-- Precios dinámicos (modo TEST). Sólo service_role escribe/lee; sin acceso anon/authenticated.
create table if not exists public.price_runs (
  id bigint generated always as identity primary key,
  mode text not null check (mode in ('propose', 'auto')),
  stripe_mode text not null check (stripe_mode = 'test'),
  market_refs jsonb not null default '[]'::jsonb,
  decisions jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.market_references (
  id bigint generated always as identity primary key,
  run_id bigint not null references public.price_runs(id) on delete cascade,
  source text not null check (source in ('INE', 'manual')),
  series_code text not null,
  value numeric not null check (value > 0),
  anchor_value numeric not null check (anchor_value > 0),
  observed_at timestamptz not null default now()
);

create table if not exists public.price_history (
  id bigint generated always as identity primary key,
  sku text not null,
  stripe_mode text not null check (stripe_mode = 'test'),
  stripe_price_id text not null unique,
  previous_stripe_price_id text,
  gross_cents integer not null check (gross_cents > 0),
  previous_gross_cents integer check (previous_gross_cents > 0),
  run_id bigint references public.price_runs(id) on delete set null,
  reason text not null,
  created_at timestamptz not null default now()
);
create index if not exists price_history_sku_created_idx on public.price_history (sku, stripe_mode, created_at desc);

-- Precio más bajo de los últimos 30 días (obligatorio al anunciar una reducción, art. 20 Ley 7/1996).
create or replace view public.price_lowest_30d with (security_invoker = true) as
  select sku, stripe_mode, min(gross_cents) as lowest_gross_cents_30d
  from public.price_history
  where created_at >= now() - interval '30 days'
  group by sku, stripe_mode;

alter table public.price_runs enable row level security;
alter table public.market_references enable row level security;
alter table public.price_history enable row level security;

revoke all on public.price_runs, public.market_references, public.price_history, public.price_lowest_30d from anon, authenticated;
grant all on public.price_runs, public.market_references, public.price_history to service_role;
grant select on public.price_lowest_30d to service_role;
