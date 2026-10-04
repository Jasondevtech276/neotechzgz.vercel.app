import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Quote = {
  name: string
  email: string
  company?: string
  service: string
  hours: number
  budget: number
  notes?: string
}

export async function saveQuote(quote: Quote) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { error: null }
  return supabase.from('quotes').insert({
    client_name: quote.name,
    email: quote.email,
    company: quote.company || null,
    service: quote.service,
    hours: quote.hours,
    budget: quote.budget,
    notes: quote.notes || null,
  })
}
