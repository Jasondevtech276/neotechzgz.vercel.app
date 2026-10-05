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

  const response = await fetch('/api/quotes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: quote.name,
      email: quote.email,
      company: quote.company || null,
      service: quote.service,
      hours: quote.hours,
      description: quote.notes || null,
      budget_calculated: quote.budget,
    }),
  })

  const data = await response.json().catch(() => ({}))
  return { data, error: response.ok ? null : new Error(data.error || 'No se pudo guardar la solicitud') }
}
