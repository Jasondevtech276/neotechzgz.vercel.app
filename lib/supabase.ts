export type Quote = {
  name: string
  email: string
  company?: string
  service: string
  hours: number | null
  budget: number
  notes?: string
}

export async function saveQuote(quote: Quote) {
  const hourlyServices = new Set(['Soporte Remoto', 'Soporte Presencial', 'Consultoría IT', 'Análisis de Sistemas'])
  if (hourlyServices.has(quote.service)) {
    if (!Number.isInteger(quote.hours) || Number(quote.hours) < 1 || Number(quote.hours) > 1000) {
      return { error: new Error('Invalid hours') }
    }
  } else if (quote.hours !== null) {
    return { error: new Error('Hours must be omitted for fixed-price and monthly services') }
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
