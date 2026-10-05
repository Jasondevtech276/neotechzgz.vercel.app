export type Product = {
  id: string
  name: string
  description: string
  priceInCents: number
  mode: 'payment' | 'subscription'
}

export const PRODUCTS: Product[] = [
  { id: 'remote-support', name: 'Soporte remoto', description: 'Asistencia técnica por horas.', priceInCents: 5500, mode: 'payment' },
  { id: 'web-development', name: 'Desarrollo web', description: 'Web profesional y e-commerce básico.', priceInCents: 95000, mode: 'payment' },
  { id: 'starter', name: 'Plan STARTER', description: '3 horas de soporte al mes y respuesta en 24h.', priceInCents: 9900, mode: 'subscription' },
  { id: 'professional', name: 'Plan PROFESSIONAL', description: '8 horas al mes, visita presencial y respuesta en 12h.', priceInCents: 17900, mode: 'subscription' },
  { id: 'enterprise', name: 'Plan ENTERPRISE', description: 'Soporte prioritario y consultoría continua.', priceInCents: 39900, mode: 'subscription' },
]

export function getProduct(id: string) {
  return PRODUCTS.find(product => product.id === id)
}
