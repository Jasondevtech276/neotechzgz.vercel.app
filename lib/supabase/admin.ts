import 'server-only'
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', process.env.SUPABASE_SECRET_KEY ?? process.env.SERVICE_ROLE ?? '', { auth: { autoRefreshToken: false, persistSession: false } })
}
