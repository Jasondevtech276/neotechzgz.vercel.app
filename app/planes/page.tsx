import type { Metadata } from 'next'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { InnerPage } from '@/components/inner-page'

export const metadata: Metadata = {
  title: 'Planes de soporte IT | NeoTech ZGZ',
  description: 'Planes de soporte IT para autónomos y empresas, con alcance y tiempos de respuesta definidos.',
  alternates: { canonical: 'https://neotechzgz.vercel.app/planes' },
}

const plans = [
  { name: 'STARTER', price: '99 €', description: 'Para necesidades puntuales y pequeños equipos.', features: ['3 horas de soporte al mes', 'Atención por email y teléfono', 'Respuesta objetivo en 24 h'] },
  { name: 'PROFESSIONAL', price: '179 €', description: 'Para negocios que necesitan continuidad.', features: ['8 horas de soporte al mes', 'Una visita presencial incluida', 'Respuesta objetivo en 12 h'] },
  { name: 'ENTERPRISE', price: '399 €', description: 'Para operaciones que requieren acompañamiento prioritario.', features: ['Soporte prioritario', 'Visitas incluidas según alcance', 'Consultoría continua'] },
]

export default function PlanesPage() {
  return (
    <InnerPage eyebrow="02 / Soporte continuo" title="Acompañamiento que encaja con tu negocio." description="Planes mensuales para ordenar el soporte técnico, reducir interrupciones y tener un punto de contacto estable.">
      <div className="plan-grid">
        {plans.map((plan, index) => (
          <article className={`plan-card ${index === 1 ? 'featured' : ''}`} key={plan.name}>
            <p className="plan-name">{plan.name}</p>
            <strong>{plan.price}<small> / mes</small></strong>
            <p>{plan.description}</p>
            <ul>{plan.features.map(feature => <li key={feature}><Check size={16} aria-hidden="true" />{feature}</li>)}</ul>
            <Link className={`button ${index === 1 ? 'button-primary' : 'button-quiet'}`} href="/contacto">Consultar plan</Link>
          </article>
        ))}
      </div>
      <p className="inner-disclaimer">Los tiempos indicados son objetivos de primera respuesta, no una garantía de resolución. Los importes y su tratamiento fiscal están pendientes de verificación: antes de contratar se facilitará el precio total aplicable. La propuesta de servicio prevé renovación mensual automática, sin permanencia y con cancelación antes del siguiente cobro; estas condiciones deberán figurar expresamente en la contratación y no se activará ningún cobro recurrente por esta página.</p>
    </InnerPage>
  )
}
