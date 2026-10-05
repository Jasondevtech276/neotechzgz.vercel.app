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
  const admin = createAdminClient()
  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id ?? session.client_reference_id
      const productId = session.metadata?.product_id
      if (!userId || !productId || (session.payment_status !== 'paid' && !event.type.includes('async'))) return NextResponse.json({ received: true })
      await admin.from('payments').upsert({ user_id: userId, stripe_session_id: session.id, stripe_customer_id: typeof session.customer === 'string' ? session.customer : null, stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null, product_id: productId, status: 'paid', amount_cents: session.amount_total ?? 0, updated_at: new Date().toISOString() }, { onConflict: 'stripe_session_id' })
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      await admin.from('payments').update({ status: event.type.endsWith('deleted') ? 'refunded' : 'paid', current_period_end: subscription.items.data[0]?.current_period_end ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString() : null, updated_at: new Date().toISOString() }).eq('stripe_subscription_id', subscription.id)
    } else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice
      const invoiceData = invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }
      const subscriptionId = typeof invoiceData.subscription === 'string' ? invoiceData.subscription : null
      if (subscriptionId) await admin.from('payments').update({ status: event.type === 'invoice.paid' ? 'paid' : 'failed', invoice_id: invoice.id, receipt_url: invoice.hosted_invoice_url ?? null, updated_at: new Date().toISOString() }).eq('stripe_subscription_id', subscriptionId)
    }
  } catch (error) {
    console.error('[v0] stripe webhook persistence failed', error)
    return NextResponse.json({ error: 'No se pudo sincronizar el evento' }, { status: 500 })
  }
  return NextResponse.json({ received: true })
}
