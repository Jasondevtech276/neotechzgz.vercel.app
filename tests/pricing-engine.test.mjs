import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { computePrice, costFloorGross, roundGross, marketFactor, idempotencyKey, subscriptionIndexation, earliestEffectiveDate, parseIneSeries, grossFromNet, netFromGross } from '../lib/pricing-engine.mjs'
import { PRICING_CATALOG, PRICING_ANCHOR } from '../lib/pricing-catalog.mjs'

const sku = { sku: 'remote-support', mode: 'payment', anchorGrossCents: 4_800, currentGrossCents: 4_800, minGrossCents: 3_600, maxGrossCents: 6_000, unitCostCents: null, minMarginPercent: 0.2 }
const ref = latest => [{ code: 'IPS376', weight: 1, anchor: 108.898, latest }]

test('IVA: neto ↔ bruto al 21 %', () => {
  assert.equal(grossFromNet(10_000), 12_100)
  assert.equal(netFromGross(12_100), 10_000)
})

test('sin datos de mercado no cambia nada (falla cerrado)', () => {
  const d = computePrice(sku, ref(Number.NaN))
  assert.equal(d.action, 'skip')
  assert.equal(d.proposedGrossCents, 4_800)
})

test('cambio < 1 % queda en banda muerta', () => {
  assert.equal(computePrice(sku, ref(108.898 * 1.004)).action, 'keep')
})

test('subida moderada por IPS se aplica redondeada a euro', () => {
  const d = computePrice(sku, ref(108.898 * 1.03))
  assert.equal(d.action, 'change')
  assert.equal(d.proposedGrossCents, 4_900)
})

test('salto de mercado se limita a +5 % por ciclo', () => {
  const d = computePrice(sku, ref(108.898 * 1.5))
  assert.ok(d.clamps.includes('step_max'))
  assert.equal(d.proposedGrossCents, 5_000)
})

test('nunca baja del mínimo ni supera el máximo', () => {
  const low = computePrice({ ...sku, currentGrossCents: 3_700 }, ref(50), { rules: { maxStepPercent: 1, maxYearPercent: 1 } })
  assert.equal(low.proposedGrossCents, 3_600)
  const high = computePrice({ ...sku, currentGrossCents: 5_900 }, ref(500), { rules: { maxStepPercent: 1, maxYearPercent: 1 } })
  assert.equal(high.proposedGrossCents, 6_000)
})

test('respeta el ritmo mínimo entre cambios', () => {
  const now = new Date('2026-11-02T06:00:00Z')
  const d = computePrice({ ...sku, lastChangedAt: '2026-10-01T06:00:00Z' }, ref(120), { now })
  assert.equal(d.reason, 'ritmo_minimo_no_cumplido')
})

test('suelo de costes incluye IVA y comisiones Stripe', () => {
  const floor = costFloorGross({ unitCostCents: 3_000, minMarginPercent: 0.2, mode: 'payment' })
  const net = floor / 1.21 - floor * 0.028 - 25
  assert.ok(net >= 3_600 - 1)
  const d = computePrice({ ...sku, unitCostCents: 3_500, currentGrossCents: 4_800 }, ref(108.898 * 0.9))
  assert.ok(d.proposedGrossCents >= costFloorGross({ unitCostCents: 3_500, minMarginPercent: 0.2, mode: 'payment' }))
})

test('bloquea si el coste exige superar el techo', () => {
  const d = computePrice({ ...sku, unitCostCents: 10_000 }, ref(120))
  assert.equal(d.action, 'block')
})

test('redondeo comercial por tramos', () => {
  assert.equal(roundGross(4_849), 4_800)
  assert.equal(roundGross(39_640), 39_500)
  assert.equal(roundGross(146_400), 146_000)
})

test('factor de mercado ponderado ignora pesos 0 y valores inválidos', () => {
  assert.equal(marketFactor([{ code: 'A', weight: 1, anchor: 100, latest: 110 }, { code: 'B', weight: 0, anchor: 100, latest: 200 }]), 1.1)
  assert.equal(marketFactor([{ code: 'A', weight: 1, anchor: 100, latest: Number.NaN }]), null)
})

test('clave de idempotencia por SKU y mes', () => {
  assert.equal(idempotencyKey('starter', new Date('2026-11-02T06:00:00Z')), 'pricing:starter:2026-11')
})

test('indexación de suscripciones usa el menor índice con tope y nunca baja', () => {
  assert.deepEqual(subscriptionIndexation({ currentGrossCents: 14_900, ipcAnnualPercent: 4.9, ipsAnnualPercent: 1.7 }), { action: 'change', percent: 1.7, proposedGrossCents: 15_200 })
  assert.equal(subscriptionIndexation({ currentGrossCents: 14_900, ipcAnnualPercent: 12, ipsAnnualPercent: null }).percent, 5)
  assert.equal(subscriptionIndexation({ currentGrossCents: 14_900, ipcAnnualPercent: -1, ipsAnnualPercent: -0.5 }).action, 'keep')
})

test('preaviso mínimo de 30 días antes del fin de periodo', () => {
  assert.equal(earliestEffectiveDate('2026-11-01T00:00:00Z', '2026-11-20T00:00:00Z'), null)
  assert.ok(earliestEffectiveDate('2026-11-01T00:00:00Z', '2026-12-05T00:00:00Z'))
})

test('parser INE toma el último dato no secreto', () => {
  assert.deepEqual(parseIneSeries({ Data: [{ Valor: 107.8, Anyo: 2026, FK_Periodo: 19, FK_TipoDato: 2 }, { Valor: 108.898, Anyo: 2026, FK_Periodo: 20, FK_TipoDato: 2 }] }), { value: 108.898, year: 2026, period: 20, provisional: true })
  assert.equal(parseIneSeries({}), null)
})

test('catálogo: anclas dentro de [mín, máx] y lookup keys únicas', () => {
  const keys = new Set()
  for (const e of PRICING_CATALOG) {
    assert.ok(e.minGrossCents <= e.anchorGrossCents && e.anchorGrossCents <= e.maxGrossCents, e.sku)
    keys.add(e.lookupKey)
  }
  assert.equal(keys.size, PRICING_CATALOG.length)
  assert.ok(PRICING_ANCHOR.refs.some(r => r.code === 'IPS376' && r.weight > 0))
})

test('runner: sólo TEST, modo off por defecto, precios con IVA incluido e idempotencia', () => {
  const src = readFileSync(new URL('../lib/pricing-runner.ts', import.meta.url), 'utf8')
  assert.match(src, /getStripeMode\(\) !== 'test'/)
  assert.match(src, /PRICING_AUTOMATION_MODE \?\? 'off'/)
  assert.match(src, /tax_behavior: 'inclusive'/)
  assert.match(src, /transfer_lookup_key: true/)
  assert.match(src, /idempotencyKey: idempotencyKey\(/)
  const route = readFileSync(new URL('../app/api/cron/pricing/route.ts', import.meta.url), 'utf8')
  assert.match(route, /timingSafeEqual/)
  const idx = readFileSync(new URL('../lib/subscription-indexation.ts', import.meta.url), 'utf8')
  assert.match(idx, /getStripeMode\(\) !== 'test'/)
  assert.match(idx, /approvedBy/)
})

test('migración: RLS activo y sin acceso anon/authenticated', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20261031120000_dynamic_pricing_tables.sql', import.meta.url), 'utf8')
  for (const t of ['price_runs', 'market_references', 'price_history']) assert.match(sql, new RegExp(`alter table public\\.${t} enable row level security`))
  assert.match(sql, /revoke all on .* from anon, authenticated/)
  assert.match(sql, /check \(stripe_mode = 'test'\)/)
})
