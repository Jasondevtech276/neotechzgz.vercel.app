import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabasePublicConfig } from './env'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const config = getSupabasePublicConfig()
  if (!config) {
    // Fail closed for admin routes when Supabase is not configured.
    if (request.nextUrl.pathname.startsWith('/admin') && request.nextUrl.pathname !== '/admin/login') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return response
  }
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (request.nextUrl.pathname.startsWith('/admin') && request.nextUrl.pathname !== '/admin/login') {
    const { data: profile } = user ? await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle() : { data: null }
    if (!user || !profile?.is_admin) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }
  return response
}
