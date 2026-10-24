import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('account-retention cron uses only the rotated production secret', () => {
  const route = readFileSync(new URL('../app/api/cron/purge-accounts/route.ts', import.meta.url), 'utf8')
  assert.match(route, /process\.env\.CRON_SECRET\b/)
  assert.doesNotMatch(route, /CRON_SECRET_NEXT/)
  assert.match(route, /status: 401/)
  assert.match(route, /status: 503/)
})
