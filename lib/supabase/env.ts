// Single source of truth for the public Supabase configuration.
// Only these two variables are read. No legacy aliases (SUPABASE_URL, *_2, *_3,
// NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_NEXT_PUBLIC_*) are accepted, so the
// browser, proxy, server and admin clients always target the same project.
// Literal `process.env.NEXT_PUBLIC_*` access is required for Next.js inlining.

export function getSupabasePublicConfig(): { url: string; publishableKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !publishableKey) return null
  return { url, publishableKey }
}

export function requireSupabasePublicConfig() {
  const config = getSupabasePublicConfig()
  if (!config) throw new Error('Supabase public configuration is missing')
  return config
}
