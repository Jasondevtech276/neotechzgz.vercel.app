import assert from 'node:assert/strict'
import test from 'node:test'
import { createAuthCallbackHandler } from '../lib/auth-callback.mjs'
import { PASSWORD_RECOVERY_COOKIE } from '../lib/auth-recovery.mjs'

function createHarness(exchange = async () => ({
  data: { session: { id: 'session-1' }, user: { id: 'user-1' } },
  error: null,
})) {
  const calls = { exchange: [], cookieWrites: [], logs: [] }
  const handler = createAuthCallbackHandler({
    async createClient() {
      return {
        auth: {
          async exchangeCodeForSession(code) {
            calls.exchange.push(code)
            return exchange()
          },
        },
      }
    },
    NextResponse: {
      redirect(url) {
        const headers = new Headers({ Location: url.toString() })
        return {
          headers,
          cookies: {
            set(name, value, options) {
              calls.cookieWrites.push({ name, value, options })
            },
          },
        }
      },
    },
    logger: { error(...args) { calls.logs.push(args) } },
  })

  return { handler, calls }
}

test('exchanges a recovery code and sets a short-lived secure marker', async () => {
  const { handler, calls } = createHarness()

  const response = await handler(new Request(
    'https://preview.example/auth/callback?code=recovery-code&next=%2Freset-password',
  ))

  assert.equal(response.headers.get('Location'), 'https://preview.example/reset-password')
  assert.equal(response.headers.get('Cache-Control'), 'no-store')
  assert.deepEqual(calls.exchange, ['recovery-code'])
  assert.deepEqual(calls.cookieWrites, [{
    name: PASSWORD_RECOVERY_COOKIE,
    value: '1',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 600,
    },
  }])
})

test('does not exchange a provider-declared expired link and clears any marker', async () => {
  const { handler, calls } = createHarness()

  const response = await handler(new Request(
    'https://preview.example/auth/callback?error_code=otp_expired&next=%2Freset-password',
  ))

  assert.equal(response.headers.get('Location'), 'https://preview.example/reset-password?error=invalid-link')
  assert.deepEqual(calls.exchange, [])
  assert.equal(calls.cookieWrites[0].name, PASSWORD_RECOVERY_COOKIE)
  assert.equal(calls.cookieWrites[0].value, '')
  assert.equal(calls.cookieWrites[0].options.maxAge, 0)
})

test('clears recovery marker after an unsuccessful code exchange', async () => {
  const { handler, calls } = createHarness(async () => ({
    data: { session: null, user: null },
    error: { status: 400, code: 'invalid_token' },
  }))

  const response = await handler(new Request(
    'https://preview.example/auth/callback?code=invalid&next=%2Freset-password',
  ))

  assert.equal(response.headers.get('Location'), 'https://preview.example/reset-password?error=invalid-link')
  assert.equal(calls.cookieWrites[0].options.maxAge, 0)
  assert.deepEqual(calls.logs, [['[auth] Callback code exchange failed', { status: 400, code: 'invalid_token' }]])
})

test('redirects to a safe failure state if code exchange throws', async () => {
  const { handler, calls } = createHarness(async () => {
    throw new Error('private exchange detail')
  })

  const response = await handler(new Request(
    'https://preview.example/auth/callback?code=invalid&next=%2Freset-password',
  ))

  assert.equal(response.headers.get('Location'), 'https://preview.example/reset-password?error=invalid-link')
  assert.equal(calls.cookieWrites[0].options.maxAge, 0)
  assert.deepEqual(calls.logs, [['[auth] Callback code exchange failed', 'Error']])
})

test('does not mark ordinary signup sessions as password recovery', async () => {
  const { handler, calls } = createHarness()

  const response = await handler(new Request('https://preview.example/auth/callback?code=signup-code'))

  assert.equal(response.headers.get('Location'), 'https://preview.example/')
  assert.equal(calls.cookieWrites[0].value, '')
  assert.equal(calls.cookieWrites[0].options.maxAge, 0)
})
