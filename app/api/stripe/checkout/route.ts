import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getProduct } from '@/lib/products'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://neotechzgz.vercel.app').replace(/\/$/, '')
const TERMS_VERSION = '2026-10-24'
const IDEMPOTENCY_KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function unavailable() {
  return NextResponse.json(
    { error: 'Las compras están temporalmente pausadas mientras completamos las comprobaciones de contratación e impuestos.' },
    { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '3600' } },
  )
}

export async function POST(request: Request) {
  // Fail closed until legal, tax, and Stripe test-mode checks have been completed.
  if (process.env.CHECKOUT_ENABLED !== 'true' || process.env.STRIPE_AUTOMATIC_TAX_ENABLED !== 'true') return unavailable()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })

  const rate = await checkRateLimit(`checkout:${user.id}`)
  if (!rate.success) return NextResponse.json({ error: 'Demasiadas solicitudes. Inténtalo más tarde.' }, { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000))), 'Cache-Control': 'no-store' } })

  const body = await request.json().catch(() => ({}))
  const productId = typeof body.productId === 'string' ? body.productId : ''
  const product = getProduct(productId)
  if (!product) return NextResponse.json({ error: 'Producto no válido' }, { status: 400 })

  const rawIdempotencyKey = request.headers.get('idempotency-key') ?? ''
  if (!IDEMPOTENCY_KEY_PATTERN.test(rawIdempotencyKey)) {
    return NextResponse.json({ error: 'Falta una clave de idempotencia válida. Actualiza la página e inténtalo de nuevo.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }
  if (body.acceptedTerms !== true || body.termsVersion !== TERMS_VERSION) {
    return NextResponse.json({ error: 'Debes aceptar las condiciones de contratación vigentes antes de continuar.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: product.mode,
      line_items: [{ price: product.stripePriceId, quantity: 1 }],
      automatic_tax: { enabled: true },
      billing_address_collection: 'required',
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        product_id: product.id,
        terms_accepted: 'true',
        terms_version: TERMS_VERSION,
      },
      ...(product.mode === 'subscription' ? {
        subscription_data: {
          metadata: {
            user_id: user.id,
            product_id: product.id,
            terms_accepted: 'true',
            terms_version: TERMS_VERSION,
          },
        },
      } : {}),
      success_url: `${SITE_URL}/account?payment=success`,
      cancel_url: `${SITE_URL}/account?payment=cancelled`,
    }, {
      idempotencyKey: `checkout:${user.id}:${rawIdempotencyKey}`,
    })
    if (!session.url) return NextResponse.json({ error: 'Stripe no devolvió una URL de pago' }, { status: 502, headers: { 'Cache-Control': 'no-store' } })
    return NextResponse.json({ url: session.url }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[stripe-checkout] Session creation failed:', error instanceof Error ? error.name : 'UnknownError')
    return NextResponse.json({ error: 'No se pudo iniciar el pago. Inténtalo más tarde.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } })
  }
}
