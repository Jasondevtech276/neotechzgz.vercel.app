import 'server-only'
import Stripe from 'stripe'

export type StripeMode = 'test' | 'live'

/**
 * Payments must use a dedicated Stripe API key. STRIPE_MCP_KEY is deliberately
 * not a fallback: an integration-management key must never silently become
 * the application's payment credential.
 */
export function getStripeMode(): StripeMode {
  const secret = process.env.STRIPE_SECRET_KEY ?? ''
  const match = /^(?:sk|rk)_(test|live)_/.exec(secret)
  if (!match) throw new Error('A valid dedicated STRIPE_SECRET_KEY is required')

  const mode = match[1] as StripeMode
  const deployment = process.env.VERCEL_ENV
  if (deployment === 'production' && mode !== 'live') {
    throw new Error('Production requires a live-mode Stripe key')
  }
  if (deployment === 'preview' && mode !== 'test') {
    throw new Error('Preview requires a test-mode Stripe key')
  }
  return mode
}

export function getStripe() {
  getStripeMode()
  const secret = process.env.STRIPE_SECRET_KEY!
  return new Stripe(secret, { maxNetworkRetries: 2, timeout: 15_000 })
}
