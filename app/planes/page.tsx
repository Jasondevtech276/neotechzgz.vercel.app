import type { Metadata } from 'next'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { InnerPage } from '@/components/inner-page'
import { getPublicPrices } from '@/lib/pricing'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Planes de soporte IT | NeoTech ZGZ',
  description: 'Planes de soporte IT para autónomos y empresas, con alcance y tiempos de respuesta definidos.',
  alternates: { canonical: 'https://neotechzgz.vercel.app/planes' },
}

const plans = [
  { name: 'STARTER', productId: 'starter', description: 'Para necesidades puntuales y pequeños equipos.', features: ['3 horas de soporte al mes', 'Atención por email y teléfono', 'Respuesta objetivo en 24 h'] },
  { name: 'PROFESSIONAL', productId: 'professional', description: 'Para negocios que necesitan continuidad.', features: ['8 horas de soporte al mes', 'Una visita presencial incluida', 'Respuesta objetivo en 12 h'] },
  { name: 'ENTERPRISE', productId: 'enterprise', description: 'Para operaciones que requieren acompañamiento prioritario.', features: ['Soporte prioritario', 'Visitas incluidas según alcance', 'Consultoría continua'] },
]

export default async function PlanesPage() {
  const prices = await getPublicPrices()
  const formatPrice = (productId: string) => {
    const price = prices[productId]
    return price ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: price.currency.toUpperCase(), maximumFractionDigits: 2 }).format(price.amount / 100) : 'Consultar'
  }
  return (
    <InnerPage eyebrow="02 / Soporte continuo" title="Acompañamiento que encaja con tu negocio." description="Planes mensuales para ordenar el soporte técnico, reducir interrupciones y tener un punto de contacto estable.">
      <div className="plan-grid">
        {plans.map((plan, index) => (
          <article className={`plan-card ${index === 1 ? 'featured' : ''}`} key={plan.name}>
            <p className="plan-name">{plan.name}</p>
            <strong>{formatPrice(plan.productId)}<small> / {prices[plan.productId]?.interval === 'year' ? 'año' : 'mes'}</small></strong>
            <p>{plan.description}</p>
            <ul>{plan.features.map(feature => <li key={feature}><Check size={16} aria-hidden="true" />{feature}</li>)}</ul>
            <Link className={`button ${index === 1 ? 'button-primary' : 'button-quiet'}`} href="/contacto">Consultar plan</Link>
          </article>
        ))}
      </div>
      <p className="inner-disclaimer">Los tiempos indicados son objetivos de primera respuesta, no una garantía de resolución. Los importes visibles son referencias provisionales y la contratación online permanece pausada: no realices pagos. Antes de reabrirla se confirmará el precio total aplicable, el tratamiento del IVA u otros impuestos, la moneda de cobro y las condiciones específicas según el cliente y su ubicación. Para servicios tecnológicos ordinarios sujetos al IVA español, el tipo general de referencia es el 21 %, pero no es aplicable universalmente a todas las operaciones.</p>
    </InnerPage>
  )
}
