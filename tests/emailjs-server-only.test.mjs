import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(
  new URL('../lib/emailjs.ts', import.meta.url),
  'utf8',
)

test('EmailJS private key module is restricted to the server runtime', () => {
  assert.match(source, /^import ['"]server-only['"]/)
  assert.match(source, /process\.env\.EMAILJS_PRIVATE_KEY/)
})
