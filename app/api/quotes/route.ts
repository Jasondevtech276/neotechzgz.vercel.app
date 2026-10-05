import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/emailjs'
import { checkRateLimit } from '@/lib/rate-limit'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const serviceRates: Record<string, number> = {
  'Soporte Remoto': 55,
  'Soporte Presencial': 75,
  'Desarrollo Web': 950,
  'Consultoría IT': 85,
  'Análisis de Sistemas': 75,
  'Plan STARTER': 99,
  'Plan PROFESSIONAL': 179,
  'Plan ENTERPRISE': 399,
}
const allowedServices = new Set([
  'Soporte Remoto',
  'Soporte Presencial',
  'Desarrollo Web',
  'Consultoría IT',
  'Análisis de Sistemas',
  'Plan STARTER',
  'Plan PROFESSIONAL',
  'Plan ENTERPRISE',
])

function getServerClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE
  if (!url || !key) throw new Error('Supabase server configuration is missing')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function POST(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rate = await checkRateLimit(`quotes:create:${forwarded}`)
  if (!rate.success) return NextResponse.json({ error: 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.' }, { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000))) } })
  try {
    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const company = typeof body.company === 'string' ? body.company.trim() : null
    const service = typeof body.service === 'string' ? body.service : ''
    const description = typeof body.description === 'string' ? body.description.trim() : null
    const hours = Number(body.hours)
    const budget = serviceRates[service] * hours

    if (name.length < 2 || name.length > 120 || !emailPattern.test(email) || email.length > 254) {
      return NextResponse.json({ error: 'Datos de contacto no válidos' }, { status: 400 })
    }
    if (!allowedServices.has(service) || !Number.isInteger(hours) || hours < 1 || hours > 1000 || !Number.isFinite(budget) || budget < 0 || budget > 10000000) {
      return NextResponse.json({ error: 'Datos de solicitud no válidos' }, { status: 400 })
    }
    if ((company && company.length > 160) || (description && description.length > 5000)) {
      return NextResponse.json({ error: 'La solicitud supera el tamaño permitido' }, { status: 400 })
    }

    const { data: { user } } = await createServerClient().then(client => client.auth.getUser())
    if (!user) return NextResponse.json({ error: 'Inicia sesión para solicitar un presupuesto' }, { status: 401 })
    if (user.email?.toLowerCase() !== email) return NextResponse.json({ error: 'Usa el email de tu cuenta para crear la solicitud' }, { status: 403 })
    const { data, error } = await getServerClient()
      .from('quotes')
      .insert({ name, email, company, service, hours, description, budget_calculated: budget, user_id: user.id })
      .select('client_code,status')
      .single()

    if (error) {
      console.error('[v0] quote insert failed', error)
      return NextResponse.json({ error: 'No se pudo guardar la solicitud' }, { status: 500 })
    }

    const requestUrl = new URL(request.url)
    try {
      await sendEmail({ to_email: email, to_name: name, client_code: data.client_code, status: data.status, service, message: `Hemos recibido tu solicitud ${data.client_code}. Te avisaremos cuando cambie su estado.`, tracking_url: `${requestUrl.origin}/#seguimiento` })
    } catch (emailError) {
      console.error('[v0] quote confirmation email failed', emailError)
    }

    return NextResponse.json({ clientCode: data.client_code, status: data.status, notification: 'queued' }, { status: 201 })
  } catch (error) {
    console.error('[v0] quote route failed', error)
    return NextResponse.json({ error: 'Solicitud no válida' }, { status: 400 })
  }
}
