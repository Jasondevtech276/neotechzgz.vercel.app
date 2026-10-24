import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('checkout fails closed unless explicitly enabled', () => {
  const route = readFileSync(new URL('../app/api/stripe/checkout/route.ts', import.meta.url), 'utf8')
  const gate = route.indexOf("process.env.CHECKOUT_ENABLED !== 'true'")
  const client = route.indexOf('await createClient()')
  assert.notEqual(gate, -1, 'explicit checkout feature gate must exist')
  assert.ok(client > gate, 'checkout gate must run before creating an authenticated client')
  assert.match(route, /status: 503/)
  assert.match(route, /Cache-Control': 'no-store'/)
})
