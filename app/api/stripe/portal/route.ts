import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })
  const { data: payment } = await supabase.from('payments').select('stripe_customer_id').eq('user_id', user.id).not('stripe_customer_id', 'is', null).limit(1).maybeSingle()
  if (!payment?.stripe_customer_id) return NextResponse.json({ error: 'Todavía no hay una suscripción facturada en Stripe' }, { status: 400 })
  const origin = request.headers.get('origin') ?? 'https://neotechzgz.vercel.app'
  const session = await getStripe().billingPortal.sessions.create({ customer: payment.stripe_customer_id, return_url: `${origin}/account` })
  return NextResponse.json({ url: session.url })
}
