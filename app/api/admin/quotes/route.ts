import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const adminEmail = 'larbimhed260796@gmail.com'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email?.toLowerCase() !== adminEmail) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { data, error } = await supabase.from('quotes').select('id,client_code,name,email,company,service,hours,description,budget_calculated,status,created_at').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'No se pudieron cargar las solicitudes' }, { status: 500 })
  return NextResponse.json({ quotes: data })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email?.toLowerCase() !== adminEmail) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await request.json()
  const id = typeof body.id === 'string' ? body.id : ''
  const status = typeof body.status === 'string' ? body.status : ''
  const allowed = ['recibida','en revisión','presupuesto enviado','aceptada','en curso','completada','cancelada']
  if (!id || !allowed.includes(status)) return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 })
  const { error } = await supabase.from('quotes').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: 'No se pudo actualizar el estado' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
