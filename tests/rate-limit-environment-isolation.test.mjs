import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(
  new URL('../lib/rate-limit.ts', import.meta.url),
  'utf8',
)

test('rate-limit counters are separated by Vercel environment', () => {
  assert.match(source, /process\.env\.VERCEL_ENV/)
  assert.match(source, /process\.env\.NODE_ENV/)
  assert.match(source, /prefix: limiterPrefix/)
})

test('Preview counters are separated by sanitized Git branch', () => {
  assert.match(source, /process\.env\.VERCEL_GIT_COMMIT_REF/)
  assert.match(source, /replace\(\/\[\^a-zA-Z0-9_-/)
  assert.match(source, /slice\(0, 64\)/)
})
