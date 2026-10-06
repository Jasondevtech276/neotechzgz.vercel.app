import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET
  const authorization = request.headers.get('authorization')

  if (!expected || authorization !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('profiles')
    .update({ deleted_at: new Date().toISOString() })
    .is('deleted_at', null)
    .lt('created_at', cutoff)
    .select('id')

  if (error) {
    console.error('[v0] account purge failed', error)
    return NextResponse.json({ error: 'Purge failed' }, { status: 500 })
  }

  return NextResponse.json({ purged: data?.length ?? 0, cutoff })
}
