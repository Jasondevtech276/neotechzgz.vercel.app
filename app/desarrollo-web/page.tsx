import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Gauge, PanelsTopLeft, SearchCheck } from 'lucide-react'
import { InnerPage } from '@/components/inner-page'

export const metadata: Metadata = {
  title: 'Desarrollo web profesional | NeoTech ZGZ',
  description: 'Diseño y desarrollo web para negocios, con estructura clara, rendimiento, accesibilidad y SEO técnico básico.',
  alternates: { canonical: 'https://neotechzgz.vercel.app/desarrollo-web' },
  openGraph: { title: 'Desarrollo web | NeoTech ZGZ', description: 'Una web coherente con tu negocio, diseñada para ser clara, rápida y mantenible.', url: 'https://neotechzgz.vercel.app/desarrollo-web', type: 'website' },
}

const deliverables = [
  { title: 'Diseño coherente', text: 'Jerarquía visual, navegación consistente y una experiencia adaptable a móvil y escritorio.', Icon: PanelsTopLeft },
  { title: 'Rendimiento y accesibilidad', text: 'Buenas prácticas de carga, semántica, navegación por teclado y respeto a las preferencias de movimiento.', Icon: Gauge },
  { title: 'SEO técnico esencial', text: 'Metadatos, URLs claras, sitemap y estructura semántica según las necesidades del proyecto.', Icon: SearchCheck },
]

export default function DesarrolloWebPage() {
  return (
    <InnerPage eyebrow="Servicio / Desarrollo web" title="Una web profesional que comunica y funciona." description="Diseñamos y desarrollamos sitios web para presentar servicios, captar consultas y explicar tu propuesta con claridad, sin añadir complejidad innecesaria.">
      <p className="eyebrow">Diseño / Implementación</p>
      <h2>De la idea a una entrega mantenible.</h2>
      <div className="trust-grid">
        {deliverables.map(({ title, text, Icon }) => (
          <article className="trust-card" key={title}>
            <Icon size={22} aria-hidden="true" />
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <div className="hero-panel" style={{ marginTop: 28 }}>
        <p className="panel-label">Fases del proyecto</p>
        <div className="process-row"><span>01</span><p>Objetivos, contenidos, alcance y prioridades.</p></div>
        <div className="process-row"><span>02</span><p>Propuesta visual y estructura de navegación.</p></div>
        <div className="process-row"><span>03</span><p>Desarrollo, revisión responsive y entrega.</p></div>
        <p className="inner-disclaimer">El precio final depende del alcance, contenidos, integraciones y mantenimiento acordado. El importe inicial publicado es orientativo y se confirma por escrito antes de empezar.</p>
        <Link className="button button-primary" href="/contacto">Hablar de mi web <ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
    </InnerPage>
  )
}
