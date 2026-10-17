import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { PASSWORD_RECOVERY_COOKIE } from '@/lib/auth-recovery.mjs'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

const recoveryMessage = 'Si existe una cuenta asociada a esa dirección, recibirás un email con instrucciones para continuar.'

export async function POST(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rate = await checkRateLimit(`auth:${forwarded}`)
  if (!rate.success) return NextResponse.json({ error: 'Demasiados intentos. Inténtalo de nuevo más tarde.' }, { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000))) } })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'Datos de acceso no válidos' }, { status: 400 })
  }

  const payload = body as Record<string, unknown>
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : ''
  const password = typeof payload.password === 'string' ? payload.password : ''
  const action = payload.action

  try {
    if (action === 'request-reset') {
      if (!email || email.length > 320) {
        return NextResponse.json({ error: 'Introduce un email válido.' }, { status: 400 })
      }

      const supabase = await createClient()
      const requestUrl = new URL(request.url)
      const redirectOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || requestUrl.origin || 'https://neotechzgz.vercel.app'
      const redirectUrl = new URL('/auth/callback', redirectOrigin)
      redirectUrl.searchParams.set('next', '/reset-password')

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl.toString() })
        if (error) {
          console.error('[auth] Password recovery provider error', { status: error.status, code: error.code })
        }
      } catch (error) {
        console.error('[auth] Password recovery request failed', error instanceof Error ? error.name : 'Unknown error')
      }

      return NextResponse.json(
        { message: recoveryMessage },
        { status: 202, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    if (action === 'update-password') {
      if (password.length < 6) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 })
      }

      const cookieStore = await cookies()
      if (cookieStore.get(PASSWORD_RECOVERY_COOKIE)?.value !== '1') {
        return NextResponse.json({ error: 'El enlace ha caducado o ya se ha utilizado.' }, { status: 401 })
      }

      const supabase = await createClient()
      const { data: { user }, error: sessionError } = await supabase.auth.getUser()
      if (sessionError || !user) {
        cookieStore.delete(PASSWORD_RECOVERY_COOKIE)
        return NextResponse.json({ error: 'El enlace ha caducado o ya se ha utilizado.' }, { status: 401 })
      }

      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        console.error('[auth] Password update failed', { status: error.status, code: error.code })
        return NextResponse.json({ error: 'No se pudo actualizar la contraseña. Comprueba los requisitos e inténtalo de nuevo.' }, { status: 400 })
      }

      cookieStore.delete(PASSWORD_RECOVERY_COOKIE)
      try {
        const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
        if (signOutError) {
          console.error('[auth] Could not clear password recovery session', { status: signOutError.status })
        }
      } catch (error) {
        console.error('[auth] Could not clear password recovery session', error instanceof Error ? error.name : 'Unknown error')
      }
      return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
    }

    if (action !== 'register' && action !== 'login') {
      return NextResponse.json({ error: 'Operación de autenticación no válida.' }, { status: 400 })
    }

    if (!email || password.length < 6) {
      return NextResponse.json({ error: 'Datos de acceso no válidos' }, { status: 400 })
    }

    const supabase = await createClient()
    const requestUrl = new URL(request.url)
    const redirectOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || requestUrl.origin || 'https://neotechzgz.vercel.app'
    const result = action === 'register'
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${redirectOrigin}/auth/callback`, data: { display_name: email.split('@')[0] } } })
      : await supabase.auth.signInWithPassword({ email, password })
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 })
    return NextResponse.json({ session: Boolean(result.data.session), needsConfirmation: action === 'register' && !result.data.session })
  } catch (error) {
    console.error('[auth] Authentication request failed', error instanceof Error ? error.name : 'Unknown error')
    return NextResponse.json({ error: 'No se pudo completar la operación' }, { status: 500 })
  }
}
