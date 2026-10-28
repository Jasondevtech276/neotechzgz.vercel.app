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
      if (!product.stripePriceLookupKey) return null
      try {
        const priceList = await stripe.prices.list({ lookup_keys: [product.stripePriceLookupKey], active: true, limit: 2 })
        if (priceList.data.length !== 1) return null
        const price = priceList.data[0]
        if (
          !price.active ||
          price.lookup_key !== product.stripePriceLookupKey ||
          price.livemode !== (mode === 'live') ||
          price.currency !== 'eur' ||
          price.unit_amount == null ||
          price.unit_amount <= 0 ||
          (product.mode === 'subscription' && (!price.recurring || price.recurring.interval !== 'month' || price.recurring.interval_count !== 1)) ||
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
    return Object.fromEntries(entries.filter(entry => entry !== null))
  } catch {
    // Missing/mismatched keys or unconfigured prices must not expose stale estimates.
    return {}
  }
}
