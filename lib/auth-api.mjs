import { PASSWORD_RECOVERY_COOKIE } from './auth-recovery.mjs'

const recoveryMessage = 'Si existe una cuenta asociada a esa dirección, recibirás un email con instrucciones para continuar.'

function json(body, status = 200, headers = {}) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  })
}

function getRedirectUrl(requestUrl, siteUrl) {
  const redirectUrl = new URL('/auth/callback', siteUrl || requestUrl.origin)
  redirectUrl.searchParams.set('next', '/reset-password')
  return redirectUrl
}

function logError(logger, message, error, includeProviderDetails = false) {
  if (includeProviderDetails && error && typeof error === 'object') {
    logger.error(message, {
      status: error.status,
      code: error.code,
    })
    return
  }

  logger.error(message, error instanceof Error ? error.name : 'Unknown error')
}

export function createAuthPostHandler({ createClient, checkRateLimit, getCookies, siteUrl, logger = console }) {
  return async function POST(request) {
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rate = await checkRateLimit(`auth:${forwarded}`)
    if (!rate.success) {
      return json(
        { error: 'Demasiados intentos. Inténtalo de nuevo más tarde.' },
        429,
        { 'Retry-After': String(Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000))) },
      )
    }

    let body
    try {
      body = await request.json()
    } catch {
      return json({ error: 'Solicitud no válida.' }, 400)
    }

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return json({ error: 'Datos de acceso no válidos' }, 400)
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const action = body.action

    try {
      if (action === 'request-reset') {
        if (!email || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return json({ error: 'Introduce un email válido.' }, 400)
        }

        const redirectUrl = getRedirectUrl(new URL(request.url), siteUrl)
        try {
          const supabase = await createClient()
          const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl.toString() })
          if (error) logError(logger, '[auth] Password recovery provider error', error, true)
        } catch (error) {
          logError(logger, '[auth] Password recovery request failed', error)
        }

        return json({ message: recoveryMessage }, 202)
      }

      if (action === 'update-password') {
        if (password.length < 6) {
          return json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, 400)
        }

        const cookieStore = await getCookies()
        if (cookieStore.get(PASSWORD_RECOVERY_COOKIE)?.value !== '1') {
          return json({ error: 'El enlace ha caducado o ya se ha utilizado.' }, 401)
        }

        const supabase = await createClient()
        const { data: { user }, error: sessionError } = await supabase.auth.getUser()
        if (sessionError || !user) {
          cookieStore.delete(PASSWORD_RECOVERY_COOKIE)
          return json({ error: 'El enlace ha caducado o ya se ha utilizado.' }, 401)
        }

        const { error } = await supabase.auth.updateUser({ password })
        if (error) {
          logError(logger, '[auth] Password update failed', error, true)
          return json({ error: 'No se pudo actualizar la contraseña. Comprueba los requisitos e inténtalo de nuevo.' }, 400)
        }

        cookieStore.delete(PASSWORD_RECOVERY_COOKIE)
        try {
          const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
          if (signOutError) logError(logger, '[auth] Could not clear password recovery session', signOutError, true)
        } catch (error) {
          logError(logger, '[auth] Could not clear password recovery session', error)
        }
        return json({ success: true })
      }

      if (action !== 'register' && action !== 'login') {
        return json({ error: 'Operación de autenticación no válida.' }, 400)
      }

      if (!email || password.length < 6) {
        return json({ error: 'Datos de acceso no válidos' }, 400)
      }

      const supabase = await createClient()
      const requestUrl = new URL(request.url)
      const redirectOrigin = siteUrl || requestUrl.origin || 'https://neotechzgz.vercel.app'
      const result = action === 'register'
        ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${redirectOrigin.replace(/\/$/, '')}/auth/callback`, data: { display_name: email.split('@')[0] } } })
        : await supabase.auth.signInWithPassword({ email, password })
      if (result.error) return json({ error: result.error.message }, 400)
      return json({ session: Boolean(result.data.session), needsConfirmation: action === 'register' && !result.data.session })
    } catch (error) {
      logError(logger, '[auth] Authentication request failed', error)
      return json({ error: 'No se pudo completar la operación' }, 500)
    }
  }
}
