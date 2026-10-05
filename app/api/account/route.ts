import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const { data: profile, error } = await supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle()
  if (error) return NextResponse.json({ error: 'No se pudo cargar el perfil' }, { status: 500 })
  return NextResponse.json({ email: user.email ?? '', name: profile?.display_name ?? '' })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : ''
  const { error } = await supabase.from('profiles').update({ display_name: name }).eq('id', user.id)
  if (error) return NextResponse.json({ error: 'No se pudo guardar el perfil' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
