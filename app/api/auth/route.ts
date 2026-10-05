import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const action = body.action === 'register' ? 'register' : 'login'
    if (!email || password.length < 6) return NextResponse.json({ error: 'Datos de acceso no válidos' }, { status: 400 })
    const supabase = await createClient()
    const result = action === 'register'
      ? await supabase.auth.signUp({ email, password, options: { data: { display_name: email.split('@')[0] } } })
      : await supabase.auth.signInWithPassword({ email, password })
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 })
    return NextResponse.json({ session: Boolean(result.data.session), needsConfirmation: action === 'register' && !result.data.session })
  } catch {
    return NextResponse.json({ error: 'No se pudo completar la operación' }, { status: 500 })
  }
}
