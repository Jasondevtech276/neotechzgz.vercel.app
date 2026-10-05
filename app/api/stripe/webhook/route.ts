import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!signature || !secret) return NextResponse.json({ error: 'Webhook no configurado' }, { status: 400 })
  let event: Stripe.Event
  try { event = getStripe().webhooks.constructEvent(await request.text(), signature, secret) } catch { return NextResponse.json({ error: 'Firma inválida' }, { status: 400 }) }
  const session = event.data.object as Stripe.Checkout.Session
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    if (session.payment_status === 'paid' || event.type.includes('async')) {
      const admin = createAdminClient()
      await admin.from('payments').upsert({ user_id: session.client_reference_id, stripe_session_id: session.id, stripe_customer_id: typeof session.customer === 'string' ? session.customer : null, stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null, product_id: session.metadata?.product_id, status: 'paid', amount_cents: session.amount_total ?? 0 }, { onConflict: 'stripe_session_id' })
    }
  }
  return NextResponse.json({ received: true })
}
