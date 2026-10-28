import 'server-only'
import { getProducts } from '@/lib/products'
import { getStripe, getStripeMode } from '@/lib/stripe'

export type PublicPrice = {
  amount: number
  currency: string
  interval: string | null
}

export async function getPublicPrices(): Promise<Record<string, PublicPrice>> {
  try {
    const mode = getStripeMode()
    const stripe = getStripe()
    const products = getProducts()
    const entries = await Promise.all(products.map(async product => {
      if (!product.stripePriceId) return null
      try {
        const price = await stripe.prices.retrieve(product.stripePriceId)
        if (
          !price.active ||
          price.livemode !== (mode === 'live') ||
          price.currency !== 'eur' ||
          price.unit_amount == null ||
          price.unit_amount <= 0 ||
          (product.mode === 'subscription' && !price.recurring) ||
          (product.mode === 'payment' && Boolean(price.recurring))
        ) return null
        return [product.id, {
          amount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval ?? null,
        }] as const
      } catch {
        return null
      }
    }))
    return Object.fromEntries(entries.filter((entry): entry is NonNullable<typeof entry> => entry !== null))
  } catch {
    // Missing/mismatched keys or unconfigured prices must not expose stale estimates.
    return {}
  }
}
