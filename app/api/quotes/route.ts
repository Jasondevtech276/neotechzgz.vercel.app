import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
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
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase server configuration is missing')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const company = typeof body.company === 'string' ? body.company.trim() : null
    const service = typeof body.service === 'string' ? body.service : ''
    const description = typeof body.description === 'string' ? body.description.trim() : null
    const hours = Number(body.hours)
    const budget = Number(body.budget_calculated)

    if (name.length < 2 || name.length > 120 || !emailPattern.test(email) || email.length > 254) {
      return NextResponse.json({ error: 'Datos de contacto no válidos' }, { status: 400 })
    }
    if (!allowedServices.has(service) || !Number.isInteger(hours) || hours < 1 || hours > 1000 || !Number.isFinite(budget) || budget < 0 || budget > 10000000) {
      return NextResponse.json({ error: 'Datos de solicitud no válidos' }, { status: 400 })
    }
    if ((company && company.length > 160) || (description && description.length > 5000)) {
      return NextResponse.json({ error: 'La solicitud supera el tamaño permitido' }, { status: 400 })
    }

    const { data, error } = await getServerClient()
      .from('quotes')
      .insert({ name, email, company, service, hours, description, budget_calculated: budget })
      .select('client_code,status')
      .single()

    if (error) {
      console.error('[v0] quote insert failed', error)
      return NextResponse.json({ error: 'No se pudo guardar la solicitud' }, { status: 500 })
    }

    return NextResponse.json({ clientCode: data.client_code, status: data.status }, { status: 201 })
  } catch (error) {
    console.error('[v0] quote route failed', error)
    return NextResponse.json({ error: 'Solicitud no válida' }, { status: 400 })
  }
}
