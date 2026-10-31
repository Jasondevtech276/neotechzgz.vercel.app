import 'server-only'
import Stripe from 'stripe'

// Only STRIPE_SECRET_KEY is accepted. STRIPE_MCP_KEY is a tooling credential and
// must never be used as the application's charging key.
export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

export function getStripe() {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) throw new Error('Stripe is not configured')
  return new Stripe(secret)
}
