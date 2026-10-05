import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const [{ data: profile, error: profileError }, { data: quotes, error: quotesError }] = await Promise.all([
    supabase.from('profiles').select('display_name,deleted_at').eq('id', user.id).maybeSingle(),
    supabase.from('quotes').select('id,client_code,service,status,budget_calculated,created_at,description').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])
  if (profileError || quotesError) return NextResponse.json({ error: 'No se pudo cargar el espacio de trabajo' }, { status: 500 })
  if (profile?.deleted_at) return NextResponse.json({ error: 'Cuenta desactivada' }, { status: 403 })
  const notifications = (quotes ?? []).flatMap(quote => [{ id: `${quote.id}-created`, title: `Solicitud ${quote.client_code} recibida`, text: `${quote.service} está registrada en tu espacio.`, date: quote.created_at }])
  return NextResponse.json({ email: user.email ?? '', name: profile?.display_name ?? '', quotes: quotes ?? [], notifications })
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

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  if (body.action !== 'delete') return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  const { error } = await supabase.from('profiles').update({ deleted_at: new Date().toISOString() }).eq('id', user.id)
  if (error) return NextResponse.json({ error: 'No se pudo solicitar la eliminación' }, { status: 500 })
  await supabase.auth.signOut()
  return NextResponse.json({ ok: true, retentionDays: 60 })
}

export async function DELETE() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
