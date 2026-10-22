import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { getInvoiceSubscriptionId } from '@/lib/stripe-invoice-subscription.mjs'

function isUuid(value: string | null | undefined): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
}

function rpcArgs(event: Stripe.Event) {
  return {
    p_event_type: event.type,
    p_event_created: event.created,
    p_user_id: null as string | null,
    p_product_id: null as string | null,
    p_session_id: null as string | null,
    p_customer_id: null as string | null,
    p_subscription_id: null as string | null,
    p_payment_status: null as string | null,
    p_amount_cents: null as number | null,
    p_invoice_id: null as string | null,
    p_receipt_url: null as string | null,
    p_subscription_status: null as string | null,
    p_current_period_end: null as string | null,
  }
}

async function applyPaymentEvent(
  admin: ReturnType<typeof createAdminClient>,
  args: ReturnType<typeof rpcArgs>,
) {
  const result = await admin.rpc('apply_stripe_payment_event', args)
  if (result.error) throw new Error('Stripe payment event persistence failed')
  if (result.data === 'not_found') throw new Error('Stripe event references a payment that is not persisted yet')
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

  const headers = { 'Cache-Control': 'no-store' }
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    console.error('[stripe-webhook] Admin client unavailable')
    return NextResponse.json({ error: 'Webhook no disponible' }, { status: 500, headers })
  }

  const claim = await admin.rpc('claim_stripe_webhook_event', {
    p_event_id: event.id,
    p_event_type: event.type,
    p_event_created: event.created,
  })
  if (claim.error) {
    console.error('[stripe-webhook] Event claim failed', { eventType: event.type, errorName: claim.error.name })
    return NextResponse.json({ error: 'No se pudo registrar el evento' }, { status: 500, headers })
  }
  if (claim.data === 'processed') return NextResponse.json({ received: true, duplicate: true }, { headers })
  if (claim.data !== 'claimed') {
    // Another request is processing this event, or a prior worker has not yet
    // reached the recovery lease. A non-2xx response asks Stripe to retry.
    return NextResponse.json({ error: 'Evento en proceso; reintentar' }, { status: 500, headers })
  }

  try {
    const args = rpcArgs(event)

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id ?? session.client_reference_id
      const productId = session.metadata?.product_id
      if (isUuid(userId) && productId && session.payment_status === 'paid') {
        args.p_user_id = userId
        args.p_product_id = productId
        args.p_session_id = session.id
        args.p_customer_id = typeof session.customer === 'string' ? session.customer : null
        args.p_subscription_id = typeof session.subscription === 'string' ? session.subscription : null
        args.p_payment_status = 'paid'
        args.p_amount_cents = session.amount_total ?? 0
        await applyPaymentEvent(admin, args)
      }
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      args.p_subscription_id = subscription.id
      args.p_subscription_status = subscription.status
      args.p_current_period_end = subscription.items.data[0]?.current_period_end
        ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
        : null
      await applyPaymentEvent(admin, args)
    } else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = getInvoiceSubscriptionId(invoice)
      if (subscriptionId) {
        args.p_subscription_id = subscriptionId
        args.p_payment_status = event.type === 'invoice.paid' ? 'paid' : 'failed'
        args.p_invoice_id = invoice.id
        args.p_receipt_url = invoice.hosted_invoice_url ?? null
        await applyPaymentEvent(admin, args)
      }
    }

    const finish = await admin.rpc('finish_stripe_webhook_event', {
      p_event_id: event.id,
      p_status: 'processed',
      p_error_category: null,
    })
    if (finish.error) throw new Error('Stripe event completion could not be persisted')
    return NextResponse.json({ received: true }, { headers })
  } catch (error) {
    const category = error instanceof Error ? error.name : 'UnknownError'
    const finish = await admin.rpc('finish_stripe_webhook_event', {
      p_event_id: event.id,
      p_status: 'failed',
      p_error_category: category,
    })
    if (finish.error) {
      console.error('[stripe-webhook] Failed to persist retry state', { eventType: event.type })
    }
    console.error('[stripe-webhook] Persistence failed', { eventType: event.type, errorName: category })
    return NextResponse.json({ error: 'No se pudo sincronizar el evento' }, { status: 500, headers })
  }
}
