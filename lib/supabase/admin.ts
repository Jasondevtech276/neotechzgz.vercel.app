import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdminConfig } from './server-env'

export function createAdminClient() {
  const config = getSupabaseAdminConfig()
  if (!config) throw new Error('Supabase server configuration is missing')
  return createClient(config.url, config.secretKey, { auth: { autoRefreshToken: false, persistSession: false } })
}
