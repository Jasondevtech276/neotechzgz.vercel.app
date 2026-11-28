import { getAuthCallbackDestination, PASSWORD_RECOVERY_COOKIE } from './auth-recovery.mjs'

function logError(logger, message, error) {
  if (error instanceof Error) {
    logger.error(message, error.name)
  } else if (error && typeof error === 'object') {
    logger.error(message, { status: error.status, code: error.code })
  } else {
    logger.error(message, 'Unknown error')
  }
}

export function createAuthCallbackHandler({ createClient, NextResponse, logger = console }) {
  function redirect(url, destination, recoveryVerified = false) {
    const response = NextResponse.redirect(new URL(destination, url.origin))
    response.headers.set('Cache-Control', 'no-store')
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
      secure: url.protocol === 'https:',
      path: '/',
    }

    if (recoveryVerified) {
      response.cookies.set(PASSWORD_RECOVERY_COOKIE, '1', { ...cookieOptions, maxAge: 10 * 60 })
    } else {
      response.cookies.set(PASSWORD_RECOVERY_COOKIE, '', { ...cookieOptions, maxAge: 0 })
    }

    return response
  }

  return async function GET(request) {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')

    if (!code || url.searchParams.has('error') || url.searchParams.has('error_code') || url.searchParams.has('error_description')) {
      return redirect(url, getAuthCallbackDestination(url, false))
    }

    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) logError(logger, '[auth] Callback code exchange failed', error)
      const isPasswordRecovery = url.searchParams.get('next') === '/reset-password'
      const succeeded = !error && (!isPasswordRecovery || Boolean(data.session && data.user))
      return redirect(url, getAuthCallbackDestination(url, succeeded), succeeded && isPasswordRecovery)
    } catch (error) {
      logError(logger, '[auth] Callback code exchange failed', error)
      return redirect(url, getAuthCallbackDestination(url, false))
    }
  }
}
