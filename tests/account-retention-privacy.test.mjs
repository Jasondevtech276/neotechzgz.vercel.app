import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const retentionRoute = await readFile(
  new URL('../app/api/cron/purge-accounts/route.ts', import.meta.url),
  'utf8',
)

test('account retention remains 60 days', () => {
  assert.match(retentionRoute, /const RETENTION_DAYS = 60/)
})

test('quote anonymization does not retain the account UUID in the email field', () => {
  assert.ok(retentionRoute.includes("email: 'deleted@example.invalid'"))
  assert.ok(!retentionRoute.includes('deleted+${account.id}@example.invalid'))
})
