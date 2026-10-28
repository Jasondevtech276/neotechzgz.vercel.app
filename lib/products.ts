export type Product = {
  id: string
  name: string
  description: string
  mode: 'payment' | 'subscription'
  stripePriceLookupKey: string
}

const CATALOG: Product[] = [
  { id: 'remote-support', name: 'Soporte remoto', description: 'Asistencia técnica, diagnóstico y optimización por hora.', mode: 'payment', stripePriceLookupKey: 'neotech_remote_support' },
  { id: 'onsite-support', name: 'Soporte presencial', description: 'Instalación y mantenimiento en tu empresa por hora.', mode: 'payment', stripePriceLookupKey: 'neotech_onsite_support' },
  { id: 'web-development', name: 'Desarrollo web', description: 'Web profesional y e-commerce básico.', mode: 'payment', stripePriceLookupKey: 'neotech_web_development' },
  { id: 'it-consulting', name: 'Consultoría IT', description: 'Análisis, planificación y decisiones técnicas por hora.', mode: 'payment', stripePriceLookupKey: 'neotech_it_consulting' },
  { id: 'systems-analysis', name: 'Análisis de sistemas', description: 'Revisión técnica y propuesta de mejora por hora.', mode: 'payment', stripePriceLookupKey: 'neotech_systems_analysis' },
  { id: 'starter', name: 'Plan STARTER', description: '3 horas de soporte al mes y respuesta en 24h.', mode: 'subscription', stripePriceLookupKey: 'neotech_plan_starter' },
  { id: 'professional', name: 'Plan PROFESSIONAL', description: '8 horas al mes, visita presencial y respuesta en 12h.', mode: 'subscription', stripePriceLookupKey: 'neotech_plan_professional' },
  { id: 'enterprise', name: 'Plan ENTERPRISE', description: 'Soporte prioritario y consultoría continua.', mode: 'subscription', stripePriceLookupKey: 'neotech_plan_enterprise' },
]

export function getProduct(id: string): Product | undefined {
  return CATALOG.find(product => product.id === id)
}

export function getProducts(): Product[] {
  return [...CATALOG]
}
