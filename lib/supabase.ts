import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase public configuration is missing')
}

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
  if (!Number.isFinite(quote.hours) || quote.hours < 1 || quote.hours > 1000) {
    return { error: new Error('Invalid hours') }
  }
  if (!Number.isFinite(quote.budget) || quote.budget < 0) {
    return { error: new Error('Invalid budget') }
  }
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
