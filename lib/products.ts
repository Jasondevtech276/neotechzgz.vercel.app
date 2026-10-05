export type Product = {
  id: string
  name: string
  description: string
  priceInCents: number
  mode: 'payment' | 'subscription'
  stripePriceId: string
}

export const PRODUCTS: Product[] = [
  { id: 'remote-support', name: 'Soporte remoto', description: 'Asistencia técnica, diagnóstico y optimización por hora.', priceInCents: 5500, mode: 'payment', stripePriceId: 'price_1UNKzQEogvsLJlT5gcZozK85' },
  { id: 'onsite-support', name: 'Soporte presencial', description: 'Instalación y mantenimiento en tu empresa por hora.', priceInCents: 7500, mode: 'payment', stripePriceId: 'price_1UNKzREogvsLJlT5X7AZEwCl' },
  { id: 'web-development', name: 'Desarrollo web', description: 'Web profesional y e-commerce básico.', priceInCents: 95000, mode: 'payment', stripePriceId: 'price_1UNKzSEogvsLJlT5DS8LepBK' },
  { id: 'it-consulting', name: 'Consultoría IT', description: 'Análisis, planificación y decisiones técnicas por hora.', priceInCents: 8500, mode: 'payment', stripePriceId: 'price_1UNKzSEogvsLJlT5aGaOwfUu' },
  { id: 'systems-analysis', name: 'Análisis de sistemas', description: 'Revisión técnica y propuesta de mejora por hora.', priceInCents: 7500, mode: 'payment', stripePriceId: 'price_1UNKzTEogvsLJlT56eKYv0kg' },
  { id: 'starter', name: 'Plan STARTER', description: '3 horas de soporte al mes y respuesta en 24h.', priceInCents: 9900, mode: 'subscription', stripePriceId: 'price_1UNKzTEogvsLJlT5fitB9CIo' },
  { id: 'professional', name: 'Plan PROFESSIONAL', description: '8 horas al mes, visita presencial y respuesta en 12h.', priceInCents: 17900, mode: 'subscription', stripePriceId: 'price_1UNKzUEogvsLJlT5nL0o9O0O' },
  { id: 'enterprise', name: 'Plan ENTERPRISE', description: 'Soporte prioritario y consultoría continua.', priceInCents: 39900, mode: 'subscription', stripePriceId: 'price_1UNKzUEogvsLJlT5OvwN2yRO' },
]

export function getProduct(id: string) {
  return PRODUCTS.find(product => product.id === id)
}
