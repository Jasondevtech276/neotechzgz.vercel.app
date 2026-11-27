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


test('critical dependency fixes remain pinned in manifest and lockfile', async () => {
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'))
  assert.equal(manifest.dependencies.next, '16.4.6')
  assert.equal(manifest.overrides?.dompurify, '3.4.17')
  assert.equal(manifest.scripts.test, 'node --test')
  assert.equal(lock.packages['node_modules/next']?.version, '16.4.6')
  assert.equal(lock.packages['node_modules/dompurify']?.version, '3.4.17')
})

const supportTicketMigration = readFileSync(
  new URL('../supabase/migrations/20261127142545_secure_support_ticket_insert_columns.sql', import.meta.url),
  'utf8',
)

test('support ticket inserts cannot override server-managed lifecycle fields', () => {
  assert.match(supportTicketMigration, /REVOKE INSERT ON TABLE public\.support_tickets FROM authenticated;/)
  assert.match(supportTicketMigration, /GRANT INSERT \(user_id, subject, message\)\s+ON TABLE public\.support_tickets TO authenticated;/)
  assert.doesNotMatch(supportTicketMigration, /GRANT INSERT ON TABLE public\.support_tickets TO authenticated;/)
})

const consolidatedReadPoliciesMigration = readFileSync(
  new URL('../supabase/migrations/20261127142557_consolidate_read_policies_final.sql', import.meta.url),
  'utf8',
)

test('owner/admin SELECT policies are consolidated without changing access predicates', () => {
  assert.ok(consolidatedReadPoliciesMigration.includes('CREATE POLICY quotes_select_own_or_admin ON public.quotes'))
  assert.ok(consolidatedReadPoliciesMigration.includes('CREATE POLICY payments_select_own_or_admin ON public.payments'))
  assert.ok(consolidatedReadPoliciesMigration.includes('CREATE POLICY support_tickets_select_own_or_admin ON public.support_tickets'))
  assert.ok(consolidatedReadPoliciesMigration.includes('auth.uid()'))
  assert.ok(consolidatedReadPoliciesMigration.includes('user_id'))
  assert.ok(consolidatedReadPoliciesMigration.includes('p.is_admin = true'))
})
