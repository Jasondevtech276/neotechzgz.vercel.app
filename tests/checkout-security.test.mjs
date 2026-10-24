import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const checkout = readFileSync(new URL('../app/api/stripe/checkout/route.ts', import.meta.url), 'utf8')
const webhook = readFileSync(new URL('../app/api/stripe/webhook/route.ts', import.meta.url), 'utf8')

test('checkout is closed by default and requires terms and idempotency', () => {
  assert.match(checkout, /CHECKOUT_ENABLED !== 'true'/)
  assert.match(checkout, /body\.acceptedTerms !== true/)
  assert.match(checkout, /request\.headers\.get\('idempotency-key'\)/)
  assert.match(checkout, /automatic_tax: \{ enabled: true \}/)
  assert.match(checkout, /idempotencyKey:/)
})

test('webhook processing uses a durable event ID claim', () => {
  assert.match(webhook, /claim_stripe_webhook_event/)
  assert.match(webhook, /status: 'processed'/)
  assert.match(webhook, /status: 'failed'/)
})
