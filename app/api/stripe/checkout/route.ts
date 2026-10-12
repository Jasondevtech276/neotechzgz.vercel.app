import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getProduct } from '@/lib/products'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://neotechzgz.vercel.app').replace(/\/$/, '')

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })

  const rate = await checkRateLimit(`checkout:${user.id}`)
  if (!rate.success) return NextResponse.json({ error: 'Demasiadas solicitudes. Inténtalo más tarde.' }, { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000))), 'Cache-Control': 'no-store' } })

  const body = await request.json().catch(() => ({}))
  const productId = typeof body.productId === 'string' ? body.productId : ''
  const product = getProduct(productId)
  if (!product) return NextResponse.json({ error: 'Producto no válido' }, { status: 400 })

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: product.mode,
      line_items: [{ price: product.stripePriceId, quantity: 1 }],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: { user_id: user.id, product_id: product.id },
      ...(product.mode === 'subscription' ? { subscription_data: { metadata: { user_id: user.id, product_id: product.id } } } : {}),
      success_url: `${SITE_URL}/account?payment=success`,
      cancel_url: `${SITE_URL}/account?payment=cancelled`,
    })
    if (!session.url) return NextResponse.json({ error: 'Stripe no devolvió una URL de pago' }, { status: 502 })
    return NextResponse.json({ url: session.url }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[stripe-checkout] Session creation failed:', error instanceof Error ? error.name : 'UnknownError')
    return NextResponse.json({ error: 'No se pudo iniciar el pago. Inténtalo más tarde.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } })
  }
}
