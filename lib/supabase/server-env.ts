import 'server-only'
import { getSupabasePublicConfig } from './env'

// Server-only Supabase secret. Exactly one variable is accepted: SUPABASE_SECRET_KEY.
// SERVICE_ROLE, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_SECRET_KEY_2 are no longer read.
// The admin client always uses the same project URL as the public clients.
export function getSupabaseAdminConfig(): { url: string; secretKey: string } | null {
  const publicConfig = getSupabasePublicConfig()
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!publicConfig || !secretKey) return null
  return { url: publicConfig.url, secretKey }
}
