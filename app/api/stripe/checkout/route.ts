import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getProduct } from '@/lib/products'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })
  const { productId } = await request.json().catch(() => ({}))
  const product = getProduct(productId)
  if (!product) return NextResponse.json({ error: 'Producto no válido' }, { status: 400 })
  const origin = request.headers.get('origin') ?? 'https://neotechzgz.vercel.app'
  const session = await getStripe().checkout.sessions.create({
    mode: product.mode,
    line_items: [{ price_data: { currency: 'eur', product_data: { name: product.name, description: product.description }, unit_amount: product.priceInCents, ...(product.mode === 'subscription' ? { recurring: { interval: 'month' as const } } : {}) }, quantity: 1 }],
    customer_email: user.email,
    client_reference_id: user.id,
    metadata: { user_id: user.id, product_id: product.id },
    success_url: `${origin}/account?payment=success`,
    cancel_url: `${origin}/account?payment=cancelled`,
    integration_identifier: `neotechzgz_${Math.random().toString(36).slice(2, 10)}`,
  })
  return NextResponse.json({ url: session.url })
}
