import assert from 'node:assert/strict'
import test from 'node:test'
import { createAuthPostHandler } from '../lib/auth-api.mjs'
import { PASSWORD_RECOVERY_COOKIE } from '../lib/auth-recovery.mjs'

const okRateLimit = async () => ({ success: true, reset: 0 })

function createHarness({ auth = {}, rateLimit = okRateLimit, recoveryCookie } = {}) {
  const calls = { client: 0, rateLimit: [], cookieDeletes: [], logs: [] }
  const cookieStore = {
    get(name) {
      return name === PASSWORD_RECOVERY_COOKIE && recoveryCookie
        ? { value: recoveryCookie }
        : undefined
    },
    delete(name) {
      calls.cookieDeletes.push(name)
    },
  }
  const supabase = { auth }
  const handler = createAuthPostHandler({
    async createClient() {
      calls.client += 1
      return supabase
    },
    async checkRateLimit(key) {
      calls.rateLimit.push(key)
      return rateLimit()
    },
    async getCookies() {
      return cookieStore
    },
    siteUrl: 'https://neotech.example/',
    logger: { error(...args) { calls.logs.push(args) } },
  })

  return { handler, calls }
}

function post(body, headers = {}) {
  return new Request('https://preview.example/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

test('rejects malformed and non-object request bodies before accessing Supabase', async () => {
  const { handler, calls } = createHarness()

  const malformed = await handler(post('{'))
  assert.equal(malformed.status, 400)
  assert.deepEqual(await malformed.json(), { error: 'Solicitud no válida.' })

  const arrayBody = await handler(post([]))
  assert.equal(arrayBody.status, 400)
  assert.equal(calls.client, 0)
})

test('rate limits auth requests before parsing or accessing the provider', async () => {
  const { handler, calls } = createHarness({
    rateLimit: async () => ({ success: false, reset: Date.now() + 5000 }),
  })

  const response = await handler(post({ action: 'request-reset', email: 'person@example.com' }, {
    'x-forwarded-for': '198.51.100.3, 10.0.0.1',
  }))

  assert.equal(response.status, 429)
  assert.ok(Number(response.headers.get('Retry-After')) > 0)
  assert.deepEqual(calls.rateLimit, ['auth:198.51.100.3'])
  assert.equal(calls.client, 0)
})

test('requests recovery with a canonical callback and masks provider errors', async () => {
  const { handler, calls } = createHarness({
    auth: {
      async resetPasswordForEmail(email, options) {
        calls.resetRequest = { email, options }
        return { error: { status: 400, code: 'email_not_found', message: 'private provider detail' } }
      },
    },
  })

  const response = await handler(post({ action: 'request-reset', email: ' Person@Example.com ' }))
  const result = await response.json()

  assert.equal(response.status, 202)
  assert.deepEqual(result, {
    message: 'Si existe una cuenta asociada a esa dirección, recibirás un email con instrucciones para continuar.',
  })
  assert.equal(response.headers.get('Cache-Control'), 'no-store')
  assert.equal(calls.resetRequest.email, 'person@example.com')
  assert.equal(calls.resetRequest.options.redirectTo, 'https://neotech.example/auth/callback?next=%2Freset-password')
  assert.deepEqual(calls.logs, [['[auth] Password recovery provider error', { status: 400, code: 'email_not_found' }]])
  assert.equal(JSON.stringify(result).includes('private provider detail'), false)
})

test('returns the same recovery response if the provider request throws', async () => {
  const { handler, calls } = createHarness({
    auth: {
      async resetPasswordForEmail() {
        throw new Error('private network detail')
      },
    },
  })

  const response = await handler(post({ action: 'request-reset', email: 'person@example.com' }))

  assert.equal(response.status, 202)
  assert.match((await response.json()).message, /Si existe una cuenta/)
  assert.deepEqual(calls.logs, [['[auth] Password recovery request failed', 'Error']])
})

test('rejects malformed recovery email addresses before contacting the provider', async () => {
  const { handler, calls } = createHarness()

  const response = await handler(post({ action: 'request-reset', email: 'not-an-email' }))

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: 'Introduce un email válido.' })
  assert.equal(calls.client, 0)
})

test('rejects password updates without a recovery marker or a valid user session', async () => {
  const noMarker = createHarness()
  const markerMissingResponse = await noMarker.handler(post({ action: 'update-password', password: 'strong-password' }))
  assert.equal(markerMissingResponse.status, 401)
  assert.equal(noMarker.calls.client, 0)

  let updateCalls = 0
  const invalidSession = createHarness({
    recoveryCookie: '1',
    auth: {
      async getUser() {
        return { data: { user: null }, error: { status: 401 } }
      },
      async updateUser() {
        updateCalls += 1
        return { error: null }
      },
    },
  })
  const invalidSessionResponse = await invalidSession.handler(post({ action: 'update-password', password: 'strong-password' }))
  assert.equal(invalidSessionResponse.status, 401)
  assert.deepEqual(invalidSession.calls.cookieDeletes, [PASSWORD_RECOVERY_COOKIE])
  assert.equal(updateCalls, 0)
})

test('updates a verified recovery session, clears its marker and signs out locally', async () => {
  const { handler, calls } = createHarness({
    recoveryCookie: '1',
    auth: {
      async getUser() {
        return { data: { user: { id: 'user-1' } }, error: null }
      },
      async updateUser(attributes) {
        calls.updatedPassword = attributes.password
        return { error: null }
      },
      async signOut(options) {
        calls.signOut = options
        return { error: null }
      },
    },
  })

  const response = await handler(post({ action: 'update-password', password: 'new-password' }))

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { success: true })
  assert.equal(response.headers.get('Cache-Control'), 'no-store')
  assert.equal(calls.updatedPassword, 'new-password')
  assert.deepEqual(calls.cookieDeletes, [PASSWORD_RECOVERY_COOKIE])
  assert.deepEqual(calls.signOut, { scope: 'local' })
})

test('keeps password provider failures generic and allows safe retry', async () => {
  const { handler, calls } = createHarness({
    recoveryCookie: '1',
    auth: {
      async getUser() {
        return { data: { user: { id: 'user-1' } }, error: null }
      },
      async updateUser() {
        return { error: { status: 422, code: 'weak_password', message: 'private provider detail' } }
      },
    },
  })

  const response = await handler(post({ action: 'update-password', password: 'new-password' }))

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), {
    error: 'No se pudo actualizar la contraseña. Comprueba los requisitos e inténtalo de nuevo.',
  })
  assert.deepEqual(calls.cookieDeletes, [])
  assert.equal(JSON.stringify(calls.logs).includes('private provider detail'), false)
})

test('preserves the existing sign-in response contract', async () => {
  const { handler } = createHarness({
    auth: {
      async signInWithPassword(credentials) {
        assert.deepEqual(credentials, { email: 'person@example.com', password: 'secret1' })
        return { data: { session: { access_token: 'redacted-test-token' } }, error: null }
      },
    },
  })

  const response = await handler(post({
    action: 'login',
    email: ' Person@Example.com ',
    password: 'secret1',
  }))

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { session: true, needsConfirmation: false })
})

test('preserves the registration confirmation contract and callback URL', async () => {
  const { handler } = createHarness({
    auth: {
      async signUp(input) {
        assert.deepEqual(input, {
          email: 'person@example.com',
          password: 'secret1',
          options: {
            emailRedirectTo: 'https://neotech.example/auth/callback',
            data: { display_name: 'person' },
          },
        })
        return { data: { session: null }, error: null }
      },
    },
  })

  const response = await handler(post({
    action: 'register',
    email: 'person@example.com',
    password: 'secret1',
  }))

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { session: false, needsConfirmation: true })
})
