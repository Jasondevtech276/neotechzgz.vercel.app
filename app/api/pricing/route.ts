import { NextResponse } from 'next/server'
import { getPublicPrices } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

export async function GET() {
  const prices = await getPublicPrices()
  return NextResponse.json(
    { source: 'stripe_catalog', prices },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } },
  )
}
