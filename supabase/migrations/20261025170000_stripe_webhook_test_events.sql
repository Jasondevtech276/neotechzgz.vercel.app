-- Test-only event ledger. Never stores the full Stripe payload or personal data.
-- Apply only to a dedicated Supabase development branch, never production by default.
create table if not exists public.stripe_webhook_test_events (
  event_id text primary key,
  event_type text not null,
  stripe_object_id text,
  payload_sha256 text not null,
  status text not null default 'processed' check (status in ('processed')),
  received_at timestamptz not null default now(),
  processed_at timestamptz not null default now()
);

alter table public.stripe_webhook_test_events enable row level security;
revoke all on table public.stripe_webhook_test_events from public, anon, authenticated;
grant all on table public.stripe_webhook_test_events to service_role;

comment on table public.stripe_webhook_test_events is
  'Isolated ledger for Stripe TEST-mode webhook delivery checks. No raw payloads; no production business state.';
