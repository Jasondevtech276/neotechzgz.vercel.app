import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const migration = readFileSync(
  new URL('../supabase/migrations/20261024133121_least_privilege_public_tables_20261024150000.sql', import.meta.url),
  'utf8',
)

test('least-privilege migration removes broad client table grants', () => {
  assert.match(migration, /REVOKE ALL PRIVILEGES ON TABLE[\s\S]*FROM anon, authenticated;/)
  assert.doesNotMatch(migration, /GRANT\s+(?:ALL|INSERT|UPDATE|DELETE)\b[^;]*\bTO\s+anon\b/i)
})

test('client update grants are column-scoped', () => {
  assert.match(migration, /GRANT UPDATE \(display_name\) ON TABLE public\.profiles TO authenticated;/)
  assert.match(migration, /GRANT UPDATE \(status\) ON TABLE public\.quotes TO authenticated;/)
  assert.doesNotMatch(migration, /GRANT UPDATE ON TABLE public\.(?:profiles|quotes|payments|quote_status_history|support_tickets) TO authenticated;/i)
})

test('RLS policies match account and administrator read paths', () => {
  assert.match(migration, /CREATE POLICY quotes_select_own[\s\S]*auth\.uid\(\)[\s\S]*user_id/)
  assert.match(migration, /CREATE POLICY payments_select_admin[\s\S]*p\.is_admin = true/)
  assert.match(migration, /CREATE POLICY support_tickets_select_admin[\s\S]*p\.is_admin = true/)
})
