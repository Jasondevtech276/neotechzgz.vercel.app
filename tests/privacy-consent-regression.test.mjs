import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('cookie rejection and acceptance have equal button prominence', () => {
  const banner = readFileSync(new URL('../components/cookie-consent.tsx', import.meta.url), 'utf8')
  const reject = banner.match(/className="([^"]+)" onClick=\{\(\) => choose\('essential'\)\}>Rechazar opcionales/)
  const accept = banner.match(/className="([^"]+)" onClick=\{\(\) => choose\('all'\)\}>Aceptar todas/)
  assert.ok(reject, 'reject button must exist')
  assert.ok(accept, 'accept button must exist')
  assert.equal(reject[1], accept[1], 'reject and accept buttons must share the same styling')
})

test('third-party fonts are not fetched before consent', () => {
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
  assert.doesNotMatch(css, /fonts\.googleapis\.com/)
})

test('analytics and advertising scripts are consent-gated', () => {
  const analytics = readFileSync(new URL('../components/consented-analytics.tsx', import.meta.url), 'utf8')
  assert.match(analytics, /analyticsEnabled = consent === 'all' \|\| consent === 'analytics'/)
  assert.match(analytics, /marketingEnabled = consent === 'all' \|\| consent === 'marketing'/)
  assert.match(analytics, /if \(analyticsEnabled && !document\.querySelector/)
  assert.match(analytics, /if \(marketingEnabled && !document\.querySelector/)
})
