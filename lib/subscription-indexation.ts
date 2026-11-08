import 'server-only'
import type Stripe from 'stripe'
import { getStripe, getStripeMode } from '@/lib/stripe'
import { earliestEffectiveDate, subscriptionIndexation } from '@/lib/pricing-engine.mjs'

/**
 * Indexación anual de suscripciones VIGENTES.
 * - Nunca se ejecuta desde el cron: requiere llamada manual y aprobación.
 * - Sólo Stripe TEST (barrera dura en código).
 * - El cambio se programa con una Subscription Schedule al final del periodo
 *   en curso y sólo si han pasado >= 30 días desde el preaviso al cliente.
 * - El cliente conserva su derecho a resolver (art. 85.3 TRLGDCU); el aviso
 *   debe describir el índice usado (menor entre IPC e IPS CNAE 62, tope 5 %).
 */
export type IndexationPlanItem = {
  subscriptionId: string
  priceId: string
  currentGrossCents: number
  proposedGrossCents?: number
  percent?: number
  effectiveAt?: string | null
  status: 'propose' | 'skip'
  reason?: string
}

export async function planSubscriptionIndexation(input: {
  lookupKey: string
  ipcAnnualPercent: number | null
  ipsAnnualPercent: number | null
  noticeSentAt: string
}): Promise<IndexationPlanItem[]> {
  if (getStripeMode() !== 'test') throw new Error('Indexación de suscripciones sólo en Stripe TEST')
  const stripe = getStripe()
  const items: IndexationPlanItem[] = []
  let startingAfter: string | undefined
  while (true) {
    const page = await stripe.subscriptions.list({ status: 'active', limit: 100, ...(startingAfter ? { starting_after: startingAfter } : {}), expand: ['data.items.data.price'] })
    for (const sub of page.data) {
      const item = sub.items.data.find(i => i.price.lookup_key === input.lookupKey)
      if (!item || item.price.unit_amount == null) continue
      const decision = subscriptionIndexation({ currentGrossCents: item.price.unit_amount, ipcAnnualPercent: input.ipcAnnualPercent, ipsAnnualPercent: input.ipsAnnualPercent })
      const periodEnd = new Date(item.current_period_end * 1000)
      const effective = earliestEffectiveDate(input.noticeSentAt, periodEnd)
      if (decision.action !== 'change') { items.push({ subscriptionId: sub.id, priceId: item.price.id, currentGrossCents: item.price.unit_amount, status: 'skip', reason: decision.reason }); continue }
      if (!effective) { items.push({ subscriptionId: sub.id, priceId: item.price.id, currentGrossCents: item.price.unit_amount, status: 'skip', reason: 'preaviso_insuficiente_para_este_periodo' }); continue }
      items.push({ subscriptionId: sub.id, priceId: item.price.id, currentGrossCents: item.price.unit_amount, proposedGrossCents: decision.proposedGrossCents, percent: decision.percent, effectiveAt: effective.toISOString(), status: 'propose' })
    }
    if (!page.has_more || page.data.length === 0) break
    startingAfter = page.data[page.data.length - 1].id
  }
  return items
}

/** Aplica UN elemento aprobado creando una fase nueva al final del periodo. */
export async function applyApprovedIndexation(item: IndexationPlanItem, newPriceId: string, approvedBy: string) {
  if (getStripeMode() !== 'test') throw new Error('Indexación de suscripciones sólo en Stripe TEST')
  if (item.status !== 'propose' || !item.effectiveAt) throw new Error('Elemento no aprobable')
  if (!approvedBy.trim()) throw new Error('Se requiere aprobación humana explícita')
  const stripe = getStripe()
  const schedule = await stripe.subscriptionSchedules.create({ from_subscription: item.subscriptionId }, { idempotencyKey: `indexation:${item.subscriptionId}:${item.effectiveAt.slice(0, 10)}` })
  const current = schedule.phases[schedule.phases.length - 1]
  const phases: Stripe.SubscriptionScheduleUpdateParams.Phase[] = [
    { items: current.items.map(i => ({ price: typeof i.price === 'string' ? i.price : i.price.id, quantity: i.quantity ?? 1 })), start_date: current.start_date, end_date: current.end_date },
    { items: [{ price: newPriceId, quantity: 1 }], metadata: { indexation_percent: String(item.percent), approved_by: approvedBy } },
  ]
  return stripe.subscriptionSchedules.update(schedule.id, { end_behavior: 'release', phases })
}
