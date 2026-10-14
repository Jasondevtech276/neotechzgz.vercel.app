import type { Metadata } from 'next'
import { Code2, ShieldCheck, Wrench } from 'lucide-react'
import { InnerPage } from '@/components/inner-page'

export const metadata: Metadata = {
  title: 'Sobre NeoTech ZGZ | Tecnología clara',
  description: 'Conoce el enfoque de NeoTech ZGZ: soporte informático, desarrollo web y consultoría desde Zaragoza y en remoto.',
  alternates: { canonical: 'https://neotechzgz.vercel.app/sobre-neotech' },
  openGraph: { title: 'Sobre NeoTech ZGZ', description: 'Tecnología clara, soluciones prácticas y comunicación directa.', url: 'https://neotechzgz.vercel.app/sobre-neotech', type: 'website' },
}

export default function AboutPage() {
  return (
    <InnerPage eyebrow="NeoTech ZGZ / Sobre el proyecto" title="La tecnología debe ayudarte, no frenarte." description="NeoTech ZGZ ofrece soporte informático, desarrollo web y consultoría IT con una idea sencilla: explicar bien, priorizar lo importante y construir soluciones prácticas.">
      <p className="eyebrow">Enfoque / Principios</p>
      <h2>Menos complejidad. Más control.</h2>
      <div className="trust-grid">
        <article className="trust-card"><Code2 size={22} aria-hidden="true" /><h3>Explicaciones comprensibles</h3><p>Opciones, límites y costes explicados antes de tomar decisiones.</p></article>
        <article className="trust-card"><Wrench size={22} aria-hidden="true" /><h3>Soluciones mantenibles</h3><p>Elegimos herramientas y cambios que tengan sentido para el contexto del negocio.</p></article>
        <article className="trust-card"><ShieldCheck size={22} aria-hidden="true" /><h3>Seguridad desde el diseño</h3><p>Reducimos riesgos con permisos mínimos, validación, actualizaciones y verificaciones razonables.</p></article>
      </div>
      <div className="hero-panel" style={{ marginTop: 28 }}>
        <p className="panel-label">Ámbito de servicio</p>
        <div className="process-row"><span>↗</span><p>Soporte y mantenimiento IT</p></div>
        <div className="process-row"><span>↗</span><p>Desarrollo web y presencia digital</p></div>
        <div className="process-row"><span>↗</span><p>Consultoría y planificación técnica</p></div>
        <p className="lede">Base de operaciones en Zaragoza, Aragón, y atención remota según el servicio y la disponibilidad.</p>
        <a className="button button-primary" href="/contacto">Contactar con NeoTech</a>
      </div>
    </InnerPage>
  )
}
