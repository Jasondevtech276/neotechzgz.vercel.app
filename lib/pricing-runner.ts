import 'server-only'
import type Stripe from 'stripe'
import { getStripe, getStripeMode } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { computePrice, idempotencyKey, parseIneSeries, type MarketRef, type PriceDecision } from '@/lib/pricing-engine.mjs'
import { PRICING_ANCHOR, PRICING_CATALOG } from '@/lib/pricing-catalog.mjs'

export type PricingMode = 'off' | 'propose' | 'auto'

const INE_SERIES_URL = 'https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/'

export function getPricingMode(): PricingMode {
  const raw = (process.env.PRICING_AUTOMATION_MODE ?? 'off').trim()
  return raw === 'propose' || raw === 'auto' ? raw : 'off'
}

/**
 * Barrera dura: la automatización sólo opera en Stripe TEST. Pasar a Live exige
 * cambiar este código en un PR revisado, no basta con una variable de entorno.
 */
function assertTestModeOnly() {
  if (getStripeMode() !== 'test') throw new Error('La automatización de precios sólo está habilitada en Stripe TEST')
}

async function fetchIneSeries(code: string): Promise<number | null> {
  if (!/^[A-Z]{3}\d{3,6}$/.test(code)) return null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const response = await fetch(`${INE_SERIES_URL}${code}?nult=1`, {
      headers: { 'User-Agent': 'neotechzgz-pricing/1.0 (+https://neotechzgz.vercel.app)', Accept: 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!response.ok) return null
    const text = await response.text()
    if (!text.trim()) return null // el INE devuelve a veces cuerpo vacío: fallar cerrado
    return parseIneSeries(JSON.parse(text))?.value ?? null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function getMarketRefs(): Promise<MarketRef[]> {
  return Promise.all(PRICING_ANCHOR.refs.map(async ref => ({
    code: ref.code,
    weight: ref.weight,
    anchor: ref.anchor,
    latest: ref.weight > 0 ? (await fetchIneSeries(ref.code)) ?? Number.NaN : Number.NaN,
  })))
}

async function getActivePrice(stripe: Stripe, lookupKey: string) {
  const list = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 2 })
  if (list.data.length !== 1) return null
  const price = list.data[0]
  if (price.livemode || price.currency !== 'eur' || price.unit_amount == null) return null
  return price
}

export async function runPricingCycle(now = new Date()) {
  const mode = getPricingMode()
  if (mode === 'off') return { mode, status: 'disabled' as const, decisions: [] as PriceDecision[] }
  assertTestModeOnly()

  const stripe = getStripe()
  const db = createAdminClient()
  const refs = await getMarketRefs()

  const { data: run, error: runError } = await db
    .from('price_runs')
    .insert({ mode, stripe_mode: 'test', market_refs: refs, started_at: now.toISOString() })
    .select('id')
    .single()
  if (runError || !run) throw new Error('No se pudo registrar la ejecución de precios')

  await db.from('market_references').insert(refs.filter(r => Number.isFinite(r.latest)).map(r => ({
    run_id: run.id, source: 'INE', series_code: r.code, value: r.latest, anchor_value: r.anchor,
  })))

  const decisions: PriceDecision[] = []
  for (const entry of PRICING_CATALOG) {
    const price = await getActivePrice(stripe, entry.lookupKey)
    if (!price) {
      decisions.push({ sku: entry.sku, currentGrossCents: 0, action: 'skip', reason: 'precio_stripe_no_encontrado', proposedGrossCents: 0, factor: null, clamps: [] })
      continue
    }

    const { data: last } = await db.from('price_history').select('created_at').eq('sku', entry.sku).eq('stripe_mode', 'test').order('created_at', { ascending: false }).limit(1).maybeSingle()
    const yearAgo = new Date(now.getTime() - 365 * 86_400_000).toISOString()
    const { data: yearRow } = await db.from('price_history').select('gross_cents').eq('sku', entry.sku).eq('stripe_mode', 'test').lte('created_at', yearAgo).order('created_at', { ascending: false }).limit(1).maybeSingle()

    const decision = computePrice({
      ...entry,
      currentGrossCents: price.unit_amount!,
      lastChangedAt: last?.created_at ?? null,
      yearAgoGrossCents: yearRow?.gross_cents ?? null,
    }, refs, { now })
    decisions.push(decision)

    if (mode !== 'auto' || decision.action !== 'change') continue

    const created = await stripe.prices.create({
      product: typeof price.product === 'string' ? price.product : price.product.id,
      currency: 'eur',
      unit_amount: decision.proposedGrossCents,
      tax_behavior: 'inclusive',
      lookup_key: entry.lookupKey,
      transfer_lookup_key: true,
      ...(entry.mode === 'subscription' ? { recurring: { interval: 'month', interval_count: 1 } } : {}),
      metadata: {
        environment: 'preview_test_only',
        pricing_run: String(run.id),
        previous_price: price.id,
        reason: decision.reason,
        factor: String(decision.factor),
      },
    }, { idempotencyKey: idempotencyKey(entry.sku, now) })

    // Las suscripciones vigentes NO cambian: siguen en el precio antiguo (archivado).
    if (created.id !== price.id) await stripe.prices.update(price.id, { active: false })

    await db.from('price_history').insert({
      sku: entry.sku, stripe_mode: 'test', stripe_price_id: created.id, previous_stripe_price_id: price.id,
      gross_cents: decision.proposedGrossCents, previous_gross_cents: price.unit_amount, run_id: run.id, reason: decision.reason,
    })
  }

  await db.from('price_runs').update({ finished_at: new Date().toISOString(), decisions }).eq('id', run.id)
  return { mode, status: 'completed' as const, runId: run.id, decisions }
}
