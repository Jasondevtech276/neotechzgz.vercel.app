import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const checkout = readFileSync(new URL('../app/api/stripe/checkout/route.ts', import.meta.url), 'utf8')
const webhook = readFileSync(new URL('../app/api/stripe/webhook/route.ts', import.meta.url), 'utf8')
const migration = readFileSync(new URL('../supabase/migrations/20261024150000_stripe_webhook_idempotency.sql', import.meta.url), 'utf8')
const account = readFileSync(new URL('../app/account/page.tsx', import.meta.url), 'utf8')

test('checkout fails closed and requires terms, tax and explicit idempotency', () => {
  assert.match(checkout, /CHECKOUT_ENABLED !== 'true'/)
  assert.match(checkout, /STRIPE_AUTOMATIC_TAX_ENABLED !== 'true'/)
  assert.match(checkout, /body\.acceptedTerms !== true/)
  assert.match(checkout, /body\.termsVersion !== TERMS_VERSION/)
  assert.match(checkout, /request\.headers\.get\('idempotency-key'\)/)
  assert.match(checkout, /automatic_tax: \{ enabled: true \}/)
  assert.match(checkout, /idempotencyKey:/)
  assert.match(account, /checked=\{acceptedTerms\}/)
  assert.match(account, /Idempotency-Key/)
  assert.match(account, /sessionStorage/)
})

test('webhook persists and deduplicates Stripe event IDs', () => {
  assert.match(webhook, /stripe_webhook_events/)
  assert.match(webhook, /event_id: event\.id/)
  assert.match(webhook, /status: 'processed'/)
  assert.match(webhook, /status: 'failed'/)
  assert.match(migration, /event_id text primary key/)
  assert.match(migration, /enable row level security/)
  assert.match(migration, /revoke all on table public\.stripe_webhook_events from public, anon, authenticated/)
})
