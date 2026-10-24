alter table public.payments
  add column if not exists latest_invoice_created_at bigint,
  add column if not exists latest_invoice_id text;

create table if not exists public.stripe_invoices (
  stripe_invoice_id text primary key,
  stripe_subscription_id text,
  stripe_customer_id text,
  status text not null,
  amount_due bigint not null default 0 check (amount_due >= 0),
  amount_paid bigint not null default 0 check (amount_paid >= 0),
  currency text not null,
  invoice_created_at bigint not null,
  hosted_invoice_url text,
  livemode boolean not null,
  last_event_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stripe_invoices_subscription_created_idx
  on public.stripe_invoices (stripe_subscription_id, invoice_created_at desc, stripe_invoice_id desc);

alter table public.stripe_invoices enable row level security;
revoke all on table public.stripe_invoices from public, anon, authenticated;
grant select, insert, update on table public.stripe_invoices to service_role;
