import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Activity, HardDrive, Wrench } from 'lucide-react'
import { InnerPage } from '@/components/inner-page'

export const metadata: Metadata = {
  title: 'Mantenimiento informático preventivo | NeoTech ZGZ',
  description: 'Mantenimiento informático, actualizaciones, revisión de equipos y planificación preventiva en Zaragoza y en remoto.',
  alternates: { canonical: 'https://neotechzgz.vercel.app/mantenimiento' },
  openGraph: { title: 'Mantenimiento informático | NeoTech ZGZ', description: 'Menos interrupciones con revisiones técnicas y prioridades claras.', url: 'https://neotechzgz.vercel.app/mantenimiento', type: 'website' },
}

const tasks = [
  { title: 'Revisión y rendimiento', text: 'Comprobación de estado, espacio, procesos y síntomas que afectan al rendimiento.', Icon: Activity },
  { title: 'Actualizaciones y configuración', text: 'Revisión de actualizaciones, aplicaciones y ajustes acordados para mantener los equipos al día.', Icon: Wrench },
  { title: 'Copias y continuidad', text: 'Verificación del estado de las copias y recomendaciones para mejorar la recuperación.', Icon: HardDrive },
]

export default function MantenimientoPage() {
  return (
    <InnerPage eyebrow="Servicio / Mantenimiento IT" title="Mantén tus sistemas estables, no solo encendidos." description="Mantenimiento preventivo para equipos y pequeños entornos de trabajo. Definimos qué se revisa, con qué frecuencia y qué queda fuera del servicio.">
      <p className="eyebrow">Prevención / Continuidad</p>
      <h2>Un plan claro para cuidar lo que ya utilizas.</h2>
      <div className="trust-grid">
        {tasks.map(({ title, text, Icon }) => (
          <article className="trust-card" key={title}>
            <Icon size={22} aria-hidden="true" />
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <div className="hero-panel" style={{ marginTop: 28 }}>
        <p className="panel-label">Alcance transparente</p>
        <div className="process-row"><span>01</span><p>Inventario y prioridades del entorno.</p></div>
        <div className="process-row"><span>02</span><p>Calendario de revisiones y tareas acordadas.</p></div>
        <div className="process-row"><span>03</span><p>Registro de incidencias, cambios y próximos pasos.</p></div>
        <p className="inner-disclaimer">La frecuencia, los tiempos de respuesta, las visitas y los importes se concretan en la propuesta. No se anuncian SLA ni disponibilidad que no estén contratados.</p>
        <Link className="button button-primary" href="/contacto">Definir mantenimiento <ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
    </InnerPage>
  )
}
