export type Product = {
  id: string
  name: string
  description: string
  mode: 'payment' | 'subscription'
  stripePriceId: string | null
}

const PRICE_ENV_KEYS: Record<string, string> = {
  'remote-support': 'STRIPE_PRICE_ID_REMOTE_SUPPORT',
  'onsite-support': 'STRIPE_PRICE_ID_ONSITE_SUPPORT',
  'web-development': 'STRIPE_PRICE_ID_WEB_DEVELOPMENT',
  'it-consulting': 'STRIPE_PRICE_ID_IT_CONSULTING',
  'systems-analysis': 'STRIPE_PRICE_ID_SYSTEMS_ANALYSIS',
  starter: 'STRIPE_PRICE_ID_STARTER',
  professional: 'STRIPE_PRICE_ID_PROFESSIONAL',
  enterprise: 'STRIPE_PRICE_ID_ENTERPRISE',
}

const CATALOG: Omit<Product, 'stripePriceId'>[] = [
  { id: 'remote-support', name: 'Soporte remoto', description: 'Asistencia técnica, diagnóstico y optimización por hora.', mode: 'payment' },
  { id: 'onsite-support', name: 'Soporte presencial', description: 'Instalación y mantenimiento en tu empresa por hora.', mode: 'payment' },
  { id: 'web-development', name: 'Desarrollo web', description: 'Web profesional y e-commerce básico.', mode: 'payment' },
  { id: 'it-consulting', name: 'Consultoría IT', description: 'Análisis, planificación y decisiones técnicas por hora.', mode: 'payment' },
  { id: 'systems-analysis', name: 'Análisis de sistemas', description: 'Revisión técnica y propuesta de mejora por hora.', mode: 'payment' },
  { id: 'starter', name: 'Plan STARTER', description: '3 horas de soporte al mes y respuesta en 24h.', mode: 'subscription' },
  { id: 'professional', name: 'Plan PROFESSIONAL', description: '8 horas al mes, visita presencial y respuesta en 12h.', mode: 'subscription' },
  { id: 'enterprise', name: 'Plan ENTERPRISE', description: 'Soporte prioritario y consultoría continua.', mode: 'subscription' },
]

export function getProduct(id: string): Product | undefined {
  const product = CATALOG.find(item => item.id === id)
  if (!product) return undefined
  const envKey = PRICE_ENV_KEYS[product.id]
  const configuredPriceId = envKey ? process.env[envKey]?.trim() : ''
  return {
    ...product,
    // No hard-coded/stale Price IDs: missing environment configuration is a
    // deliberate closed state until a reviewed Stripe catalog is configured.
    stripePriceId: configuredPriceId && /^price_[A-Za-z0-9]+$/.test(configuredPriceId) ? configuredPriceId : null,
  }
}
