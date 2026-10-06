import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const approvedEmail = 'larbimhed260796@gmail.com'

async function authorize() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, allowed: false }
  const { data: profile, error } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
  return { supabase, allowed: !error && (profile?.is_admin === true || user.email?.toLowerCase() === approvedEmail) }
}

export async function GET() {
  const { supabase, allowed } = await authorize()
  if (!allowed) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [payments, tickets] = await Promise.all([
    supabase.from('payments').select('id,user_id,product_id,status,amount_cents,invoice_id,receipt_url,current_period_end,created_at,updated_at').order('created_at', { ascending: false }).limit(100),
    supabase.from('support_tickets').select('id,user_id,subject,message,status,created_at,updated_at').order('created_at', { ascending: false }).limit(100),
  ])

  if (payments.error || tickets.error) {
    console.error('[v0] admin overview query failed', { payments: payments.error, tickets: tickets.error })
    return NextResponse.json({ error: 'No se pudo cargar el resumen administrativo' }, { status: 500 })
  }

  return NextResponse.json({ payments: payments.data ?? [], tickets: tickets.data ?? [] })
}
