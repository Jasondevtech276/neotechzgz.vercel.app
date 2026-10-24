import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('cookie rejection and acceptance have equal button prominence', () => {
  const banner = readFileSync(new URL('../components/cookie-consent.tsx', import.meta.url), 'utf8')
  assert.match(banner, /className="button button-primary" onClick=\{\(\) => choose\('essential'\)\}>Rechazar opcionales/)
  assert.match(banner, /className="button button-primary" onClick=\{\(\) => choose\('all'\)\}>Aceptar todas/)
})

test('third-party fonts are not fetched before consent', () => {
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
  assert.doesNotMatch(css, /fonts\.googleapis\.com/)
})

test('analytics and advertising scripts are consent-gated', () => {
  const analytics = readFileSync(new URL('../components/consented-analytics.tsx', import.meta.url), 'utf8')
  assert.match(analytics, /if \(analyticsEnabled\)/)
  assert.match(analytics, /if \(marketingEnabled\)/)
})
