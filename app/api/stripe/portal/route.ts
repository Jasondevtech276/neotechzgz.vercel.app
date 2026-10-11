import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://neotechzgz.vercel.app').replace(/\/$/, '')

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })

  const rate = await checkRateLimit(`billing-portal:${user.id}`)
  if (!rate.success) return NextResponse.json({ error: 'Demasiadas solicitudes. Inténtalo más tarde.' }, { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000))), 'Cache-Control': 'no-store' } })

  const { data: payment, error } = await supabase.from('payments').select('stripe_customer_id').eq('user_id', user.id).not('stripe_customer_id', 'is', null).order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (error) return NextResponse.json({ error: 'No se pudo comprobar la facturación' }, { status: 500 })
  if (!payment?.stripe_customer_id) return NextResponse.json({ error: 'Todavía no hay una suscripción facturada en Stripe' }, { status: 400 })

  try {
    const session = await getStripe().billingPortal.sessions.create({ customer: payment.stripe_customer_id, return_url: `${SITE_URL}/account` })
    return NextResponse.json({ url: session.url }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[stripe-portal] Session creation failed:', error instanceof Error ? error.name : 'UnknownError')
    return NextResponse.json({ error: 'No se pudo abrir el portal de facturación' }, { status: 502, headers: { 'Cache-Control': 'no-store' } })
  }
}
