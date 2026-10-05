import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rate = await checkRateLimit(`auth:${forwarded}`)
  if (!rate.success) return NextResponse.json({ error: 'Demasiados intentos. Inténtalo de nuevo más tarde.' }, { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000))) } })
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const action = body.action === 'register' ? 'register' : 'login'
    if (!email || password.length < 6) return NextResponse.json({ error: 'Datos de acceso no válidos' }, { status: 400 })
    const supabase = await createClient()
    const requestUrl = new URL(request.url)
    const redirectOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || requestUrl.origin || 'https://neotechzgz.vercel.app'
    const result = action === 'register'
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${redirectOrigin}/auth/callback`, data: { display_name: email.split('@')[0] } } })
      : await supabase.auth.signInWithPassword({ email, password })
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 })
    return NextResponse.json({ session: Boolean(result.data.session), needsConfirmation: action === 'register' && !result.data.session })
  } catch {
    return NextResponse.json({ error: 'No se pudo completar la operación' }, { status: 500 })
  }
}
