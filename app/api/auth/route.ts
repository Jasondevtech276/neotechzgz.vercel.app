import { cookies } from 'next/headers'
import { createAuthPostHandler } from '@/lib/auth-api.mjs'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

export const POST = createAuthPostHandler({
  createClient,
  checkRateLimit,
  getCookies: cookies,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
})
