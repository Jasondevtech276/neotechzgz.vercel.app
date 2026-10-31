import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
function sourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx|mjs)$/.test(name) ? [path] : []
  })
}
const files = ['app', 'lib', 'components'].flatMap((dir) => sourceFiles(join(root, dir))).concat(join(root, 'proxy.ts'))
const code = files.map((file) => readFileSync(file, 'utf8').replace(/^\s*\/\/.*$/gm, '')).join('\n')

test('STRIPE_MCP_KEY is never used as an application Stripe key', () => {
  assert.doesNotMatch(code, /process\.env\.STRIPE_MCP_KEY/)
  const stripe = readFileSync(join(root, 'lib/stripe.ts'), 'utf8')
  assert.match(stripe, /const secret = process\.env\.STRIPE_SECRET_KEY\n/)
})

test('Supabase configuration has a single source of truth', () => {
  for (const legacy of ['SUPABASE_URL_2', 'SUPABASE_URL_3', 'SUPABASE_PUBLISHABLE_KEY_2', 'SUPABASE_SECRET_KEY_2', 'SERVICE_ROLE', 'SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']) {
    assert.doesNotMatch(code, new RegExp(`process\\.env\\.${legacy}\\b`), `${legacy} must not be read`)
  }
  assert.doesNotMatch(code, /process\.env\.SUPABASE_URL\b/, 'admin and public clients must share NEXT_PUBLIC_SUPABASE_URL')
  assert.doesNotMatch(code, /process\.env\.SUPABASE_PUBLISHABLE_KEY\b/)
  const reads = (name) => (code.match(new RegExp(`process\\.env\\.${name}\\b`, 'g')) || []).length
  assert.equal(reads('NEXT_PUBLIC_SUPABASE_URL'), 1, 'URL read only in lib/supabase/env.ts')
  assert.equal(reads('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'), 1)
  assert.equal(reads('SUPABASE_SECRET_KEY'), 1, 'secret read only in lib/supabase/server-env.ts')
})

test('Supabase secret key is server-only', () => {
  const serverEnv = readFileSync(join(root, 'lib/supabase/server-env.ts'), 'utf8')
  assert.match(serverEnv, /^import 'server-only'/)
  const publicEnv = readFileSync(join(root, 'lib/supabase/env.ts'), 'utf8')
  assert.doesNotMatch(publicEnv, /process\.env\.SUPABASE_SECRET_KEY/)
})
