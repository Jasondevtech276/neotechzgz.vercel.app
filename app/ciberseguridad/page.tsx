import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Fingerprint, LockKeyhole, ShieldCheck } from 'lucide-react'
import { InnerPage } from '@/components/inner-page'

export const metadata: Metadata = {
  title: 'Ciberseguridad para profesionales y negocios | NeoTech ZGZ',
  description: 'Revisión de accesos, configuración segura, copias de seguridad y reducción de riesgos para equipos y pequeños negocios.',
  alternates: { canonical: 'https://neotechzgz.vercel.app/ciberseguridad' },
  openGraph: { title: 'Ciberseguridad | NeoTech ZGZ', description: 'Medidas prácticas para reducir riesgos tecnológicos, con alcance definido.', url: 'https://neotechzgz.vercel.app/ciberseguridad', type: 'website' },
}

const controls = [
  { title: 'Accesos y cuentas', text: 'Revisamos permisos, cuentas administrativas, autenticación multifactor disponible y accesos que ya no se necesitan.', Icon: Fingerprint },
  { title: 'Configuración segura', text: 'Evaluamos actualizaciones, exposición de servicios, configuración de equipos y medidas básicas de protección.', Icon: LockKeyhole },
  { title: 'Copias y recuperación', text: 'Comprobamos la estrategia de copias y definimos una prueba de restauración adecuada al entorno.', Icon: ShieldCheck },
]

export default function CiberseguridadPage() {
  return (
    <InnerPage eyebrow="Servicio / Ciberseguridad" title="Reduce riesgos antes de que se conviertan en incidentes." description="Medidas de seguridad prácticas para profesionales y pequeños negocios. Empezamos por el contexto, priorizamos lo importante y dejamos claros los límites de cada intervención.">
      <p className="eyebrow">Evaluación / Protección</p>
      <h2>Seguridad que se puede explicar y verificar.</h2>
      <div className="trust-grid">
        {controls.map(({ title, text, Icon }) => (
          <article className="trust-card" key={title}>
            <Icon size={22} aria-hidden="true" />
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <div className="hero-panel" style={{ marginTop: 28 }}>
        <p className="panel-label">Cómo trabajamos</p>
        <div className="process-row"><span>01</span><p>Delimitamos sistemas, objetivos y permisos.</p></div>
        <div className="process-row"><span>02</span><p>Priorizamos riesgos según impacto y probabilidad.</p></div>
        <div className="process-row"><span>03</span><p>Aplicamos cambios acordados y verificamos el resultado.</p></div>
        <p className="inner-disclaimer">Una revisión no garantiza seguridad absoluta ni sustituye auditorías reglamentarias, pruebas de penetración especializadas o asesoramiento legal cuando sean necesarios.</p>
        <Link className="button button-primary" href="/contacto">Solicitar una valoración <ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
    </InnerPage>
  )
}
