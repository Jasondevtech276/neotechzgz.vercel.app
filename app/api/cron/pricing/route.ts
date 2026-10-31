import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { getPricingMode, runPricingCycle } from '@/lib/pricing-runner'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function isAuthorized(request: Request, expected: string) {
  const supplied = Buffer.from(request.headers.get('authorization') ?? '')
  const required = Buffer.from(`Bearer ${expected}`)
  return supplied.length === required.length && timingSafeEqual(supplied, required)
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || secret.length < 32 || !isAuthorized(request, secret)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (getPricingMode() === 'off') return NextResponse.json({ status: 'disabled' })
  try {
    const result = await runPricingCycle()
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('pricing cycle failed', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ error: 'pricing_cycle_failed' }, { status: 500 })
  }
}
