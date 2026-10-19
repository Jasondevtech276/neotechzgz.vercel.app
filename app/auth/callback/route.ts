import { NextResponse } from 'next/server'
import { createAuthCallbackHandler } from '@/lib/auth-callback.mjs'
import { createClient } from '@/lib/supabase/server'

export const GET = createAuthCallbackHandler({ createClient, NextResponse })
