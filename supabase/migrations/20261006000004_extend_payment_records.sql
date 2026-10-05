alter table public.payments add column if not exists invoice_id text;
alter table public.payments add column if not exists receipt_url text;
alter table public.payments add column if not exists current_period_end timestamptz;
alter table public.payments add column if not exists updated_at timestamptz not null default now();
create index if not exists payments_invoice_idx on public.payments(invoice_id) where invoice_id is not null;
