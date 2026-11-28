// Motor de precios dinámicos NEOTECHZGZ (lógica pura, sin red ni secretos).
//
// Todos los importes son céntimos de euro CON IVA incluido (precio final al
// consumidor, art. 20 y 60 TRLGDCU). El IVA se desglosa sólo para el suelo de
// costes. Los impuestos directos (IRPF/IS) no se "suman" al precio: se cubren
// con el margen mínimo configurado. La retención de IRPF B2B no altera el
// precio anunciado (es un pago a cuenta que se resta en la factura).

export const VAT_RATE_ES = 0.21

/** Comisiones Stripe España (stripe.com/es/pricing, consultado 2026-10-31). */
export const STRIPE_FEES_ES = Object.freeze({
  cardPercent: 0.028, // peor caso razonable: tarjeta premium EEE 2,8 %
  cardFixedCents: 25, // + 0,25 €
  billingPercent: 0.007, // Stripe Billing 0,7 % (sólo suscripciones)
  taxPercent: 0.005, // Stripe Tax Basic 0,5 % (si se activa)
})

export const DEFAULT_RULES = Object.freeze({
  maxStepPercent: 0.05, // ±5 % por ciclo respecto al precio vigente
  maxYearPercent: 0.10, // ±10 % acumulado en 12 meses respecto al ancla
  deadbandPercent: 0.01, // cambios < 1 % se ignoran (evita ruido)
  minDaysBetweenChanges: 85, // como máximo un cambio por trimestre
})

/**
 * @param {number} netCents
 * @param {number} [vatRate]
 */
export function grossFromNet(netCents, vatRate = VAT_RATE_ES) {
  return Math.round(netCents * (1 + vatRate))
}

/**
 * @param {number} grossCents
 * @param {number} [vatRate]
 */
export function netFromGross(grossCents, vatRate = VAT_RATE_ES) {
  return Math.round(grossCents / (1 + vatRate))
}

/**
 * Suelo de costes: precio bruto mínimo para que, tras IVA y comisiones Stripe,
 * quede el coste directo más el margen mínimo.
 * @param {{ unitCostCents: number | null, minMarginPercent: number, mode: 'payment' | 'subscription', stripeTax?: boolean }} sku
 */
export function costFloorGross(sku) {
  if (sku.unitCostCents == null) return 0
  const fees = STRIPE_FEES_ES
  const pct = fees.cardPercent + (sku.mode === 'subscription' ? fees.billingPercent : 0) + (sku.stripeTax ? fees.taxPercent : 0)
  const requiredNet = sku.unitCostCents * (1 + sku.minMarginPercent)
  // gross/(1+IVA) - gross*pct - fijo >= requiredNet
  const factor = 1 / (1 + VAT_RATE_ES) - pct
  if (factor <= 0) throw new Error('Comisiones incompatibles con el IVA configurado')
  return Math.ceil((requiredNet + fees.cardFixedCents) / factor)
}

/**
 * Redondeo comercial del precio final con IVA: a euros enteros (<200 €),
 * a 5 € (<1.000 €) o a 10 € (resto). Siempre hacia el valor más cercano.
 * @param {number} grossCents
 */
export function roundGross(grossCents) {
  const step = grossCents < 20_000 ? 100 : grossCents < 100_000 ? 500 : 1_000
  return Math.round(grossCents / step) * step
}

/**
 * Índice compuesto de mercado: media ponderada de los ratios índice actual /
 * índice en la fecha ancla. Por defecto sólo IPS CNAE 62 (INE), que mide los
 * precios de producción de servicios de programación y consultoría.
 * @param {Array<{ code: string, weight: number, anchor: number, latest: number }>} refs
 */
export function marketFactor(refs) {
  const valid = refs.filter(r => r.weight > 0 && Number.isFinite(r.anchor) && Number.isFinite(r.latest) && r.anchor > 0 && r.latest > 0)
  if (valid.length === 0) return null
  const total = valid.reduce((sum, r) => sum + r.weight, 0)
  return valid.reduce((sum, r) => sum + (r.latest / r.anchor) * (r.weight / total), 0)
}

/**
 * Calcula el nuevo precio de un SKU. Devuelve siempre un objeto auditable con
 * la razón de la decisión; nunca lanza por datos de mercado ausentes.
 *
 * @param {{
 *   sku: string,
 *   mode: 'payment' | 'subscription',
 *   anchorGrossCents: number,
 *   currentGrossCents: number,
 *   minGrossCents: number,
 *   maxGrossCents: number,
 *   unitCostCents: number | null,
 *   minMarginPercent: number,
 *   stripeTax?: boolean,
 *   lastChangedAt?: string | null,
 *   yearAgoGrossCents?: number | null,
 * }} sku
 * @param {Array<{ code: string, weight: number, anchor: number, latest: number }>} refs
 * @param {{ now?: Date, rules?: Partial<typeof DEFAULT_RULES> }} [options]
 */
export function computePrice(sku, refs, options = {}) {
  const rules = { ...DEFAULT_RULES, ...(options.rules ?? {}) }
  const now = options.now ?? new Date()
  const base = { sku: sku.sku, currentGrossCents: sku.currentGrossCents }
  validateSku(sku)

  const factor = marketFactor(refs)
  if (factor == null) return { ...base, action: 'skip', reason: 'sin_datos_de_mercado', proposedGrossCents: sku.currentGrossCents, factor: null, clamps: [] }

  if (sku.lastChangedAt) {
    const days = (now.getTime() - new Date(sku.lastChangedAt).getTime()) / 86_400_000
    if (days < rules.minDaysBetweenChanges) {
      return { ...base, action: 'skip', reason: 'ritmo_minimo_no_cumplido', proposedGrossCents: sku.currentGrossCents, factor, clamps: [] }
    }
  }

  const clamps = []
  let target = sku.anchorGrossCents * factor

  const stepMin = sku.currentGrossCents * (1 - rules.maxStepPercent)
  const stepMax = sku.currentGrossCents * (1 + rules.maxStepPercent)
  if (target < stepMin) { target = stepMin; clamps.push('step_min') }
  if (target > stepMax) { target = stepMax; clamps.push('step_max') }

  const yearRef = sku.yearAgoGrossCents ?? sku.anchorGrossCents
  const yearMin = yearRef * (1 - rules.maxYearPercent)
  const yearMax = yearRef * (1 + rules.maxYearPercent)
  if (target < yearMin) { target = yearMin; clamps.push('year_min') }
  if (target > yearMax) { target = yearMax; clamps.push('year_max') }

  let rounded = roundGross(target)
  if (rounded < sku.minGrossCents) { rounded = sku.minGrossCents; clamps.push('floor') }
  if (rounded > sku.maxGrossCents) { rounded = sku.maxGrossCents; clamps.push('ceiling') }

  const costFloor = costFloorGross(sku)
  if (rounded < costFloor) {
    if (costFloor > sku.maxGrossCents) {
      return { ...base, action: 'block', reason: 'coste_supera_techo', proposedGrossCents: sku.currentGrossCents, factor, clamps: [...clamps, 'cost_floor'] }
    }
    rounded = Math.ceil(costFloor / 100) * 100
    clamps.push('cost_floor')
  }

  const change = (rounded - sku.currentGrossCents) / sku.currentGrossCents
  if (Math.abs(change) < rules.deadbandPercent) {
    return { ...base, action: 'keep', reason: 'dentro_de_banda_muerta', proposedGrossCents: sku.currentGrossCents, factor, clamps }
  }
  return {
    ...base,
    action: 'change',
    reason: change > 0 ? 'subida_por_mercado' : 'bajada_por_mercado',
    proposedGrossCents: rounded,
    proposedNetCents: netFromGross(rounded),
    changePercent: Math.round(change * 10_000) / 100,
    factor,
    clamps,
  }
}

function validateSku(sku) {
  for (const key of ['anchorGrossCents', 'currentGrossCents', 'minGrossCents', 'maxGrossCents']) {
    if (!Number.isInteger(sku[key]) || sku[key] <= 0) throw new Error(`${sku.sku}: ${key} inválido`)
  }
  if (sku.minGrossCents > sku.maxGrossCents) throw new Error(`${sku.sku}: mínimo mayor que máximo`)
  if (sku.anchorGrossCents < sku.minGrossCents || sku.anchorGrossCents > sku.maxGrossCents) throw new Error(`${sku.sku}: ancla fuera de rango`)
}

/** Clave de idempotencia estable por SKU y mes: evita precios duplicados si el cron se repite. */
export function idempotencyKey(sku, now = new Date()) {
  const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  return `pricing:${sku}:${ym}`
}

/**
 * Indexación anual de suscripciones vigentes (art. 85.3 TRLGDCU: índice legal
 * descrito en el contrato). Usa el MENOR entre IPC general e IPS CNAE 62 para
 * no repercutir más que el mercado del sector, con tope propio y preaviso.
 * @param {{ currentGrossCents: number, ipcAnnualPercent: number | null, ipsAnnualPercent: number | null, capPercent?: number }} input
 */
export function subscriptionIndexation(input) {
  const candidates = [input.ipcAnnualPercent, input.ipsAnnualPercent].filter(v => typeof v === 'number' && Number.isFinite(v))
  if (candidates.length === 0) return { action: 'skip', reason: 'sin_indices' }
  const cap = input.capPercent ?? 5
  const pct = Math.max(Math.min(Math.min(...candidates), cap), 0) // nunca sube más del tope; no baja automáticamente
  if (pct === 0) return { action: 'keep', reason: 'indice_no_positivo', percent: 0 }
  const proposed = roundGross(input.currentGrossCents * (1 + pct / 100))
  if (proposed === input.currentGrossCents) return { action: 'keep', reason: 'redondeo_sin_cambio', percent: pct }
  return { action: 'change', percent: pct, proposedGrossCents: proposed }
}

/** Fecha mínima de efecto para cambios en suscripciones vigentes. */
export function earliestEffectiveDate(noticeSentAt, periodEnd, noticeDays = 30) {
  const minDate = new Date(new Date(noticeSentAt).getTime() + noticeDays * 86_400_000)
  const end = new Date(periodEnd)
  return end >= minDate ? end : null // si el periodo acaba antes del preaviso, se aplica en el siguiente
}

/** Lee la tabla DATOS_SERIE del INE (JSON Tempus3) y devuelve el último valor numérico. */
export function parseIneSeries(json) {
  const data = Array.isArray(json?.Data) ? json.Data : []
  const points = data.filter(d => typeof d?.Valor === 'number' && !d.Secreto)
  if (points.length === 0) return null
  const last = points[points.length - 1]
  return { value: last.Valor, year: last.Anyo, period: last.FK_Periodo, provisional: last.FK_TipoDato !== 1 }
}
