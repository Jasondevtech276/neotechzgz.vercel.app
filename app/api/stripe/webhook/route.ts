import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe, getStripeMode } from '@/lib/stripe'
import { getProduct } from '@/lib/products'
import { createAdminClient } from '@/lib/supabase/admin'
import { getInvoiceSubscriptionId } from '@/lib/stripe-invoice-subscription.mjs'

const MAX_WEBHOOK_BODY_BYTES = 1_048_576

function requirePersistedRows(result: { error: { message: string } | null; data: Array<{ id: string }> | null }) {
  if (result.error || !result.data?.length) throw new Error('Stripe event persistence failed')
}

async function readBodyLimited(request: Request): Promise<string | null> {
  if (!request.body) return null
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > MAX_WEBHOOK_BODY_BYTES) {
        await reader.cancel()
        return null
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return null
  }
}

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!signature || !webhookSecret) return json({ error: 'Webhook no configurado' }, 503)

  let stripe: ReturnType<typeof getStripe>
  let stripeMode: ReturnType<typeof getStripeMode>
  try {
    stripeMode = getStripeMode()
    stripe = getStripe()
  } catch {
    return json({ error: 'Webhook no configurado correctamente' }, 503)
  }

  const declaredLength = Number(request.headers.get('content-length') ?? 0)
  if (declaredLength > MAX_WEBHOOK_BODY_BYTES) return json({ error: 'Payload demasiado grande' }, 413)
  const rawBody = await readBodyLimited(request)
  if (rawBody === null) return json({ error: 'Payload no válido o demasiado grande' }, 413)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch {
    return json({ error: 'Firma inválida' }, 400)
  }

  // A valid signature alone is not enough: test events must never update live state,
  // and live events must never be accepted by a preview deployment.
  if (event.livemode !== (stripeMode === 'live')) {
    return json({ error: 'Modo de evento incompatible con el entorno' }, 400)
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
        return json({ received: true, duplicate: true })
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
      if (!claimed) return json({ error: 'Evento en procesamiento; Stripe debe reintentarlo' }, 500)
    } else {
      throw new Error('Stripe event claim failed')
    }

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const eventSession = event.data.object as Stripe.Checkout.Session
      const userId = eventSession.metadata?.user_id ?? eventSession.client_reference_id
      const productId = eventSession.metadata?.product_id

      if (userId && productId) {
        const product = getProduct(productId)
        if (!product) throw new Error('Unknown checkout product')

        // Re-read current Stripe state instead of trusting an old event snapshot.
        const session = await stripe.checkout.sessions.retrieve(eventSession.id)
        if (session.livemode !== event.livemode || session.mode !== product.mode) {
          throw new Error('Checkout session mode mismatch')
        }

        const [price, lineItems] = await Promise.all([
          stripe.prices.retrieve(product.stripePriceId),
          stripe.checkout.sessions.listLineItems(session.id, { limit: 10 }),
        ])
        const line = lineItems.data.length === 1 ? lineItems.data[0] : null
        const linePriceId = line ? (typeof line.price === 'string' ? line.price : line.price?.id) : undefined
        if (
          price.livemode !== event.livemode ||
          (product.mode === 'subscription' && !price.recurring) ||
          (product.mode === 'payment' && Boolean(price.recurring)) ||
          linePriceId !== session.metadata?.stripe_price_id ||
          line?.quantity !== 1 ||
          !session.currency ||
          (line?.amount_subtotal ?? 0) <= 0 ||
          (session.amount_total ?? 0) <= 0
        ) {
          throw new Error('Checkout line item does not match configured Stripe Price')
        }

        // checkout.session.completed can be unpaid for asynchronous payment methods.
        // Never mark it paid unless Stripe's current session confirms payment.
        if (session.payment_status === 'paid') {
          const result = await admin.from('payments')
            .upsert({
              user_id: userId,
              stripe_session_id: session.id,
              stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
              stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null,
              product_id: product.id,
              status: 'paid',
              amount_cents: session.amount_total ?? 0,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'stripe_session_id' }).select('id')
          requirePersistedRows(result)
        } else if (event.type === 'checkout.session.async_payment_succeeded') {
          throw new Error('Stripe reports async success but current session is not paid')
        }
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
      const eventInvoice = event.data.object as Stripe.Invoice
      // Webhook events can arrive out of order; Stripe's current invoice is authoritative.
      const invoice = await stripe.invoices.retrieve(eventInvoice.id)
      const subscriptionId = getInvoiceSubscriptionId(invoice)
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? null
      const invoiceResult = await admin.from('stripe_invoices').upsert({
        stripe_invoice_id: invoice.id,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId,
        status: invoice.status ?? 'unknown',
        amount_due: invoice.amount_due,
        amount_paid: invoice.amount_paid,
        currency: invoice.currency,
        invoice_created_at: invoice.created,
        hosted_invoice_url: invoice.hosted_invoice_url ?? null,
        livemode: event.livemode,
        last_event_id: event.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'stripe_invoice_id' }).select('stripe_invoice_id')
      if (invoiceResult.error || !invoiceResult.data?.length) throw new Error('Stripe invoice persistence failed')

      if (subscriptionId && (invoice.status === 'paid' || invoice.status === 'open')) {
        const result = await admin.from('payments')
          .update({
            status: invoice.status === 'paid' ? 'paid' : 'failed',
            invoice_id: invoice.id,
            latest_invoice_id: invoice.id,
            latest_invoice_created_at: invoice.created,
            receipt_url: invoice.hosted_invoice_url ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId)
          .or(`latest_invoice_created_at.is.null,latest_invoice_created_at.lt.${invoice.created},and(latest_invoice_created_at.eq.${invoice.created},latest_invoice_id.lt.${invoice.id}),and(latest_invoice_created_at.eq.${invoice.created},latest_invoice_id.eq.${invoice.id})`)
          .select('id')
        // No matching payment can mean checkout.session.completed has not arrived yet.
        // Throw so Stripe retries and the ledger records a retryable failure.
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
    return json({ error: 'No se pudo sincronizar el evento' }, 500)
  }
  return json({ received: true })
}
