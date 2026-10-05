import 'server-only'
import Stripe from 'stripe'

export function getStripe() {
  const secret = process.env.STRIPE_SECRET_KEY ?? process.env.STRIPE_MCP_KEY
  if (!secret) throw new Error('Stripe is not configured')
  return new Stripe(secret, { apiVersion: '2026-09-30.endive' })
}
