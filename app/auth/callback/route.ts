import { NextResponse } from 'next/server'
import { getAuthCallbackDestination, PASSWORD_RECOVERY_COOKIE } from '@/lib/auth-recovery.mjs'
import { createClient } from '@/lib/supabase/server'

function redirect(url: URL, destination: string, recoveryVerified = false) {
  const response = NextResponse.redirect(new URL(destination, url.origin))
  response.headers.set('Cache-Control', 'no-store')
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
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

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (!code || url.searchParams.has('error') || url.searchParams.has('error_code') || url.searchParams.has('error_description')) {
    return redirect(url, getAuthCallbackDestination(url, false))
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[auth] Callback code exchange failed', { status: error.status, code: error.code })
    }
    const isPasswordRecovery = url.searchParams.get('next') === '/reset-password'
    const succeeded = !error && (!isPasswordRecovery || Boolean(data.session && data.user))
    return redirect(url, getAuthCallbackDestination(url, succeeded), succeeded && isPasswordRecovery)
  } catch (error) {
    console.error('[auth] Callback code exchange failed', error instanceof Error ? error.name : 'Unknown error')
    return redirect(url, getAuthCallbackDestination(url, false))
  }
}
