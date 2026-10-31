import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { getSupabaseAdminConfig } from '@/lib/supabase/server-env'
import type Stripe from 'stripe'
import { timingSafeEqual } from 'node:crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const RETENTION_DAYS = 60
const BATCH_SIZE = 10
const DAY_MS = 24 * 60 * 60 * 1000

function isAuthorized(request: Request, expected: string) {
  const authorization = request.headers.get('authorization') ?? ''
  const supplied = Buffer.from(authorization)
  const required = Buffer.from(`Bearer ${expected}`)
  return supplied.length === required.length && timingSafeEqual(supplied, required)
}

async function cancelOutstandingSubscriptions(
  stripe: Stripe,
  subscriptionIds: Array<string | null>,
  customerIds: Array<string | null>,
) {
  const ids = new Set(subscriptionIds.filter((id): id is string => Boolean(id)))
  const customers = new Set(customerIds.filter((id): id is string => Boolean(id)))

  // Discover subscriptions by customer as well: older/incomplete payment rows may
  // have a Stripe customer ID but no subscription ID. Fail closed if Stripe cannot
  // verify a customer; the account is deferred rather than erased unsafely.
  for (const customerId of Array.from(customers)) {
    let startingAfter: string | undefined
    while (true) {
      const page = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100, ...(startingAfter ? { starting_after: startingAfter } : {}) })
      for (const subscription of page.data) ids.add(subscription.id)
      if (!page.has_more || page.data.length === 0) break
      startingAfter = page.data[page.data.length - 1].id
    }
  }

  for (const subscriptionId of Array.from(ids)) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    if (subscription.status !== 'canceled' && subscription.status !== 'incomplete_expired') {
      await stripe.subscriptions.cancel(subscriptionId)
    }
  }
}

export async function GET(request: Request) {
  const expectedSecret = process.env.CRON_SECRET
  if (!expectedSecret) {
    console.error('[account-retention] CRON_SECRET is not configured')
    return NextResponse.json({ error: 'Cron is not configured' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
  if (!isAuthorized(request, expectedSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }

  if (!getSupabaseAdminConfig()) {
    console.error('[account-retention] Supabase admin environment is not configured')
    return NextResponse.json({ error: 'Cron is not configured' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }

  const now = new Date()
  const cutoff = new Date(now.getTime() - RETENTION_DAYS * DAY_MS).toISOString()
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    console.error('[account-retention] Failed to initialize Supabase admin client')
    return NextResponse.json({ error: 'Cron could not initialize its database client' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }

  const { data: accounts, error: selectionError } = await admin
    .from('profiles')
    .select('id, deleted_at, is_admin')
    .eq('is_admin', false)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (selectionError) {
    console.error('[account-retention] Failed to select eligible accounts')
    return NextResponse.json({ error: 'Could not select accounts for retention processing' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }

  let deleted = 0
  let pending = 0
  let skipped = 0
  const warnings = new Set<string>()

  for (const account of accounts ?? []) {
    try {
      const deletionRequestedAt = account.deleted_at ? new Date(account.deleted_at as string) : null
      if (!deletionRequestedAt || !Number.isFinite(deletionRequestedAt.getTime())) {
        skipped += 1
        warnings.add('An account had an invalid deletion timestamp and was skipped')
        continue
      }
      const { data: payments, error: paymentsError } = await admin
        .from('payments')
        .select('stripe_subscription_id, stripe_customer_id')
        .eq('user_id', account.id)

      if (paymentsError) throw new Error('Could not inspect subscription records')

      const subscriptionIds = (payments ?? []).map((payment) => payment.stripe_subscription_id as string | null)
      const customerIds = (payments ?? []).map((payment) => payment.stripe_customer_id as string | null)

      // Never erase an account if subscriptions cannot be checked/cancelled safely.
      if (subscriptionIds.some(Boolean) || customerIds.some(Boolean)) {
        if (!isStripeConfigured()) throw new Error('Stripe is not configured; account deletion deferred')
        await cancelOutstandingSubscriptions(getStripe(), subscriptionIds, customerIds)
      }

      // Retry subscription cancellation every day during the 60-day grace period,
      // but do not anonymize or remove the account until the original deadline.
      if (deletionRequestedAt.getTime() > new Date(cutoff).getTime()) {
        pending += 1
        continue
      }

      const { data: quotes, error: quotesSelectError } = await admin
        .from('quotes')
        .select('id')
        .eq('user_id', account.id)

      if (quotesSelectError) throw new Error('Could not inspect quote records')
      const quoteIds = (quotes ?? []).map((quote) => quote.id as string)

      if (quoteIds.length > 0) {
        const { error: historyError } = await admin
          .from('quote_status_history')
          .update({ note: null, changed_by: null })
          .in('quote_id', quoteIds)
        if (historyError) throw new Error('Could not anonymize quote history')

        const { error: quotesError } = await admin
          .from('quotes')
          .update({
            user_id: null,
            name: 'Cliente eliminado',
            email: `deleted+${account.id}@example.invalid`,
            company: null,
            description: null,
          })
          .eq('user_id', account.id)
        if (quotesError) throw new Error('Could not anonymize quote records')
      }

      const { error: ticketsError } = await admin
        .from('support_tickets')
        .update({
          user_id: null,
          subject: 'Solicitud de soporte anonimizada',
          message: 'Contenido eliminado conforme a la solicitud de eliminación de cuenta.',
        })
        .eq('user_id', account.id)
      if (ticketsError) throw new Error('Could not anonymize support records')

      // Preserve the minimum payment ledger, but remove account and Stripe identifiers.
      const { error: paymentAnonymizationError } = await admin
        .from('payments')
        .update({
          user_id: null,
          stripe_session_id: null,
          stripe_customer_id: null,
          stripe_subscription_id: null,
          invoice_id: null,
          receipt_url: null,
        })
        .eq('user_id', account.id)
      if (paymentAnonymizationError) throw new Error('Could not anonymize payment records')

      const { error: deleteUserError } = await admin.auth.admin.deleteUser(account.id)
      if (deleteUserError) throw new Error('Supabase could not delete the auth account')

      deleted += 1
    } catch (error) {
      skipped += 1
      warnings.add('One or more accounts were deferred; inspect server logs for the non-sensitive error category')
      // Avoid logging account IDs, email addresses, Stripe IDs, or error messages that may contain them.
      console.error('[account-retention] One account was deferred:', error instanceof Error ? error.name : 'UnknownError')
    }
  }

  return NextResponse.json({
    retentionDays: RETENTION_DAYS,
    cutoff,
    processed: (accounts ?? []).length,
    deleted,
    pending,
    skipped,
    ...(warnings.size ? { warnings: Array.from(warnings) } : {}),
  }, { headers: { 'Cache-Control': 'no-store' } })
}
