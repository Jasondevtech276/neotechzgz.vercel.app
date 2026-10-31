import { NextResponse } from 'next/server'
import { getStripe, getStripeMode } from '@/lib/stripe'
import { getProduct } from '@/lib/products'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

const TERMS_VERSION = '2026-10-25'
const EARLY_START_CONSENT_VERSION = '2026-10-25'
const IDEMPOTENCY_KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_CHECKOUT_BODY_BYTES = 8 * 1024

function unavailable() {
  return NextResponse.json(
    { error: 'La contratación está temporalmente pausada mientras completamos las comprobaciones de seguridad, contratación e impuestos.' },
    { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '3600' } },
  )
}

async function readJsonLimited(request: Request): Promise<unknown | null> {
  if (!request.body) return null
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > MAX_CHECKOUT_BODY_BYTES) {
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
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown
  } catch {
    return null
  }
}

function getCheckoutSiteUrl() {
  if (process.env.VERCEL_ENV === 'production') return 'https://neotechzgz.vercel.app'
  const deploymentUrl = process.env.VERCEL_URL
  if (process.env.VERCEL_ENV === 'preview' && deploymentUrl && /^[a-z0-9.-]+\.vercel\.app$/i.test(deploymentUrl)) {
    return `https://${deploymentUrl}`
  }
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) {
    try {
      const url = new URL(configured)
      if (url.protocol === 'https:' || (process.env.NODE_ENV !== 'production' && url.hostname === 'localhost')) {
        return url.origin
      }
    } catch {
      // Invalid URL configuration fails back to the known canonical origin.
    }
  }
  return process.env.NODE_ENV === 'production' ? 'https://neotechzgz.vercel.app' : 'http://localhost:3000'
}

export async function POST(request: Request) {
  // All three switches are deliberate launch gates; any missing, misspelled,
  // or false value keeps checkout unavailable.
  if (
    process.env.CHECKOUT_ENABLED !== 'true' ||
    process.env.STRIPE_AUTOMATIC_TAX_ENABLED !== 'true' ||
    process.env.STRIPE_ADAPTIVE_PRICING_ENABLED !== 'true'
  ) return unavailable()

  let stripe: ReturnType<typeof getStripe>
  let stripeMode: ReturnType<typeof getStripeMode>
  try {
    stripeMode = getStripeMode()
    stripe = getStripe()
  } catch {
    return unavailable()
  }

  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return NextResponse.json({ error: 'Formato de solicitud no válido' }, { status: 415, headers: { 'Cache-Control': 'no-store' } })
  }
  const declaredLength = Number(request.headers.get('content-length') ?? 0)
  if (declaredLength > MAX_CHECKOUT_BODY_BYTES) {
    return NextResponse.json({ error: 'Solicitud demasiado grande' }, { status: 413, headers: { 'Cache-Control': 'no-store' } })
  }
  const body = await readJsonLimited(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Solicitud no válida' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }

  const payload = body as Record<string, unknown>
  const productId = typeof payload.productId === 'string' ? payload.productId : ''
  const product = getProduct(productId)
  if (!product) return NextResponse.json({ error: 'Producto no válido' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  if (!product.stripePriceLookupKey) return unavailable()

  const rawIdempotencyKey = request.headers.get('idempotency-key') ?? ''
  if (!IDEMPOTENCY_KEY_PATTERN.test(rawIdempotencyKey)) {
    return NextResponse.json({ error: 'Falta una clave de idempotencia válida. Actualiza la página e inténtalo de nuevo.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }
  if (payload.acceptedTerms !== true || payload.termsVersion !== TERMS_VERSION) {
    return NextResponse.json({ error: 'Debes aceptar las condiciones de contratación vigentes antes de continuar.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }
  if (payload.acceptedEarlyStart !== true || payload.earlyStartConsentVersion !== EARLY_START_CONSENT_VERSION) {
    return NextResponse.json({ error: 'Debes confirmar expresamente la solicitud de inicio anticipado del servicio.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })

  const rate = await checkRateLimit(`checkout:${user.id}`)
  if (!rate.success) return NextResponse.json(
    { error: 'Demasiadas solicitudes. Inténtalo más tarde.' },
    { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000))), 'Cache-Control': 'no-store' } },
  )

  try {
    // Stripe's active Price object is authoritative; client-supplied amounts are never used.
    const priceList = await stripe.prices.list({ lookup_keys: [product.stripePriceLookupKey], active: true, limit: 2 })
    if (priceList.data.length !== 1) {
      console.error('[stripe-checkout] Price lookup key is missing or ambiguous', { productId: product.id })
      return unavailable()
    }
    const price = priceList.data[0]
    if (
      !price.active ||
      price.lookup_key !== product.stripePriceLookupKey ||
      price.livemode !== (stripeMode === 'live') ||
      price.currency !== 'eur' ||
      price.unit_amount == null ||
      price.unit_amount <= 0 ||
      (product.mode === 'subscription' && (!price.recurring || price.recurring.interval !== 'month' || price.recurring.interval_count !== 1)) ||
      (product.mode === 'payment' && Boolean(price.recurring))
    ) {
      console.error('[stripe-checkout] Price configuration rejected', { productId: product.id })
      return unavailable()
    }

    const consentedAt = new Date().toISOString()
    const metadata = {
      user_id: user.id,
      product_id: product.id,
      stripe_price_id: price.id,
      terms_accepted: 'true',
      terms_accepted_at: consentedAt,
      terms_version: TERMS_VERSION,
      early_start_consent: 'true',
      early_start_consent_version: EARLY_START_CONSENT_VERSION,
      early_start_consent_at: consentedAt,
    }
    const siteUrl = getCheckoutSiteUrl()
    const session = await stripe.checkout.sessions.create({
      mode: product.mode,
      line_items: [{ price: price.id, quantity: 1 }],
      automatic_tax: { enabled: true },
      adaptive_pricing: { enabled: true },
      billing_address_collection: 'required',
      customer_email: user.email,
      client_reference_id: user.id,
      metadata,
      ...(product.mode === 'subscription' ? { subscription_data: { metadata } } : {}),
      success_url: `${siteUrl}/account?payment=success`,
      cancel_url: `${siteUrl}/account?payment=cancelled`,
    }, { idempotencyKey: `checkout:${user.id}:${rawIdempotencyKey}` })

    if (!session.url) return NextResponse.json({ error: 'Stripe no devolvió una URL de pago' }, { status: 502, headers: { 'Cache-Control': 'no-store' } })
    return NextResponse.json({ url: session.url }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[stripe-checkout] Session creation failed:', error instanceof Error ? error.name : 'UnknownError')
    return NextResponse.json({ error: 'No se pudo iniciar el pago. Inténtalo más tarde.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } })
  }
}
