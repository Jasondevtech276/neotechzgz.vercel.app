import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSupabaseAdminConfig } from '@/lib/supabase/server-env'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rate = await checkRateLimit(`quotes:lookup:${forwarded}`)
  if (!rate.success) return NextResponse.json({ error: 'Demasiadas consultas. Inténtalo de nuevo más tarde.' }, { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000))) } })
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')?.trim().toUpperCase()
  const email = searchParams.get('email')?.trim().toLowerCase()
  if (!code || !email || code.length > 40 || email.length > 254) {
    return NextResponse.json({ error: 'Código y email requeridos' }, { status: 400 })
  }
  const { data: { user } } = await createServerClient().then(client => client.auth.getUser())
  if (!user) return NextResponse.json({ error: 'Inicia sesión para consultar tus solicitudes' }, { status: 401 })
  if (!getSupabaseAdminConfig()) return NextResponse.json({ error: 'Servicio no configurado' }, { status: 500 })
  const serviceClient = createAdminClient()
  const { data, error } = await serviceClient.from('quotes').select('id,client_code,status,service,created_at').eq('client_code', code).eq('email', email).eq('user_id', user.id).maybeSingle()
  if (error) return NextResponse.json({ error: 'No se pudo consultar la solicitud' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'No encontramos una solicitud con esos datos' }, { status: 404 })
  const { data: history } = await serviceClient.from('quote_status_history').select('status,note,created_at').eq('quote_id', data.id).order('created_at', { ascending: true })
  return NextResponse.json({ ...data, history: history || [] })
}
