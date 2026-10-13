import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const [{ data: profile, error: profileError }, { data: quotes, error: quotesError }, { data: payments, error: paymentsError }] = await Promise.all([
    supabase.from('profiles').select('display_name,deleted_at').eq('id', user.id).maybeSingle(),
    supabase.from('quotes').select('id,client_code,service,status,budget_calculated,created_at,description').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('payments').select('id,product_id,status,amount_cents,stripe_subscription_id,invoice_id,receipt_url,current_period_end,created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])
  if (profileError || quotesError || paymentsError) return NextResponse.json({ error: 'No se pudo cargar el espacio de trabajo' }, { status: 500 })
  if (profile?.deleted_at) return NextResponse.json({ error: 'Cuenta desactivada; la eliminación está pendiente' }, { status: 403 })
  const notifications = (quotes ?? []).flatMap(quote => [{ id: `${quote.id}-created`, title: `Solicitud ${quote.client_code} recibida`, text: `${quote.service} está registrada en tu espacio.`, date: quote.created_at }])
  return NextResponse.json({ email: user.email ?? '', name: profile?.display_name ?? '', quotes: quotes ?? [], payments: payments ?? [], notifications })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const rate = await checkRateLimit(`account-profile:${user.id}`)
  if (!rate.success) return NextResponse.json({ error: 'Demasiadas actualizaciones. Inténtalo más tarde.' }, { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000))), 'Cache-Control': 'no-store' } })
  const { data: profile, error: profileError } = await supabase.from('profiles').select('deleted_at').eq('id', user.id).maybeSingle()
  if (profileError) return NextResponse.json({ error: 'No se pudo comprobar el estado de la cuenta' }, { status: 500 })
  if (profile?.deleted_at) return NextResponse.json({ error: 'La cuenta está pendiente de eliminación' }, { status: 403 })
  const body = await request.json().catch(() => ({}))
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : ''
  const { error } = await supabase.from('profiles').update({ display_name: name }).eq('id', user.id)
  if (error) return NextResponse.json({ error: 'No se pudo guardar el perfil' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const rate = await checkRateLimit(`account-delete:${user.id}`)
  if (!rate.success) return NextResponse.json({ error: 'Demasiadas solicitudes. Inténtalo más tarde.' }, { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000))) } })
  const body = await request.json().catch(() => ({}))
  if (body.action !== 'delete') return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })

  // Use the service role so ordinary authenticated clients cannot set/reset deleted_at.
  const admin = createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id,deleted_at,is_admin')
    .eq('id', user.id)
    .maybeSingle()
  if (profileError || !profile) return NextResponse.json({ error: 'No se pudo comprobar la cuenta' }, { status: 500 })
  if (profile.is_admin) return NextResponse.json({ error: 'Las cuentas administrativas requieren un proceso de eliminación manual' }, { status: 403 })

  if (!profile.deleted_at) {
    const { error: requestError } = await admin
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', user.id)
      .is('deleted_at', null)
    if (requestError) return NextResponse.json({ error: 'No se pudo registrar la solicitud de eliminación' }, { status: 500 })
  }

  // Stop future recurring charges as soon as deletion is requested. If Stripe fails,
  // the request remains recorded and the retention cron retries before final deletion.
  let subscriptionCancellationPending = false
  const { data: payments, error: paymentsError } = await admin
    .from('payments')
    .select('stripe_subscription_id')
    .eq('user_id', user.id)
  if (paymentsError) {
    subscriptionCancellationPending = true
  } else {
    const subscriptionIds = Array.from(new Set((payments ?? [])
      .map((payment) => payment.stripe_subscription_id as string | null)
      .filter((id): id is string => Boolean(id))))
    if (subscriptionIds.length) {
      try {
        const stripe = getStripe()
        for (const subscriptionId of subscriptionIds) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          if (subscription.status !== 'canceled' && subscription.status !== 'incomplete_expired') {
            await stripe.subscriptions.cancel(subscriptionId)
          }
        }
      } catch (error) {
        subscriptionCancellationPending = true
        console.error('[account-retention] Subscription cancellation pending:', error instanceof Error ? error.name : 'UnknownError')
      }
    }
  }

  await supabase.auth.signOut()
  return NextResponse.json({ ok: true, retentionDays: 60, subscriptionCancellationPending }, { status: subscriptionCancellationPending ? 202 : 200 })
}

export async function DELETE() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
