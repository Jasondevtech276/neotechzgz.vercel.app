import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { getInvoiceSubscriptionId } from '@/lib/stripe-invoice-subscription.mjs'

function requirePersistedRows(result: { error: { message: string } | null; data: Array<{ id: string }> | null }) {
  if (result.error || !result.data?.length) throw new Error('Stripe event persistence failed')
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!signature || !secret) return NextResponse.json({ error: 'Webhook no configurado' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret)
  } catch {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
  }

  const admin = createAdminClient()
  let claimed = false
  try {
    const inserted = await admin.from('stripe_webhook_events').insert({
      event_id: event.id,
      event_type: event.type,
      livemode: event.livemode,
      status: 'processing',
      attempts: 1,
      updated_at: new Date().toISOString(),
    }).select('event_id')

    if (!inserted.error && inserted.data?.length) {
      claimed = true
    } else if (inserted.error?.code === '23505') {
      const existing = await admin.from('stripe_webhook_events')
        .select('status,attempts,updated_at')
        .eq('event_id', event.id)
        .maybeSingle()
      if (existing.error || !existing.data) throw new Error('Stripe event ledger lookup failed')
      if (existing.data.status === 'processed') {
        return NextResponse.json({ received: true, duplicate: true }, { headers: { 'Cache-Control': 'no-store' } })
      }

      const now = new Date().toISOString()
      const retryable = existing.data.status === 'failed'
      const staleCutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      if (retryable) {
        const reclaimed = await admin.from('stripe_webhook_events')
          .update({ status: 'processing', attempts: Number(existing.data.attempts) + 1, updated_at: now, last_error: null })
          .eq('event_id', event.id).eq('status', 'failed').select('event_id')
        claimed = !reclaimed.error && Boolean(reclaimed.data?.length)
      } else if (existing.data.status === 'processing' && existing.data.updated_at < staleCutoff) {
        const reclaimed = await admin.from('stripe_webhook_events')
          .update({ status: 'processing', attempts: Number(existing.data.attempts) + 1, updated_at: now, last_error: null })
          .eq('event_id', event.id).eq('status', 'processing').lt('updated_at', staleCutoff).select('event_id')
        claimed = !reclaimed.error && Boolean(reclaimed.data?.length)
      }
      if (!claimed) return NextResponse.json({ error: 'Evento en procesamiento; Stripe debe reintentarlo' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
    } else {
      throw new Error('Stripe event claim failed')
    }

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id ?? session.client_reference_id
      const productId = session.metadata?.product_id
      if (userId && productId && (session.payment_status === 'paid' || event.type.includes('async'))) {
        const result = await admin.from('payments')
          .upsert({
            user_id: userId,
            stripe_session_id: session.id,
            stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
            stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null,
            product_id: productId,
            status: 'paid',
            amount_cents: session.amount_total ?? 0,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'stripe_session_id' }).select('id')
        requirePersistedRows(result)
      }
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      const result = await admin.from('payments')
        .update({
          subscription_status: subscription.status,
          current_period_end: subscription.items.data[0]?.current_period_end ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id).select('id')
      requirePersistedRows(result)
    } else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = getInvoiceSubscriptionId(invoice)
      if (subscriptionId) {
        const result = await admin.from('payments')
          .update({
            status: event.type === 'invoice.paid' ? 'paid' : 'failed',
            invoice_id: invoice.id,
            receipt_url: invoice.hosted_invoice_url ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId).select('id')
        requirePersistedRows(result)
      }
    }

    const completed = await admin.from('stripe_webhook_events')
      .update({ status: 'processed', processed_at: new Date().toISOString(), updated_at: new Date().toISOString(), last_error: null })
      .eq('event_id', event.id).eq('status', 'processing').select('event_id')
    if (completed.error || !completed.data?.length) throw new Error('Stripe event completion persistence failed')
  } catch (error) {
    if (claimed) {
      await admin.from('stripe_webhook_events')
        .update({ status: 'failed', updated_at: new Date().toISOString(), last_error: error instanceof Error ? error.name : 'UnknownError' })
        .eq('event_id', event.id).eq('status', 'processing')
    }
    console.error('[stripe-webhook] Persistence failed', { eventType: event.type, errorName: error instanceof Error ? error.name : 'UnknownError' })
    return NextResponse.json({ error: 'No se pudo sincronizar el evento' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
  return NextResponse.json({ received: true }, { headers: { 'Cache-Control': 'no-store' } })
}
