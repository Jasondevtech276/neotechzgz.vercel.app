import type { Metadata } from 'next'
import { Code2, MapPin, Server, ShieldCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { InnerPage } from '@/components/inner-page'

export const metadata: Metadata = {
  title: 'Servicios IT | NeoTech ZGZ',
  description: 'Soporte técnico remoto y presencial, desarrollo web y consultoría IT en Zaragoza.',
}

const services = [
  { icon: Server, title: 'Soporte remoto', price: '55 € / hora', description: 'Diagnóstico, resolución de incidencias, configuración y optimización de equipos y software.' },
  { icon: MapPin, title: 'Soporte presencial', price: '75 € / hora', description: 'Instalación, mantenimiento y asistencia técnica en Zaragoza, con alcance acordado previamente.' },
  { icon: Code2, title: 'Desarrollo web', price: 'Desde 950 €', description: 'Webs profesionales y experiencias digitales centradas en rendimiento, accesibilidad y conversión.' },
  { icon: ShieldCheck, title: 'Consultoría IT', price: '85 € / hora', description: 'Revisión de sistemas, planificación técnica y recomendaciones priorizadas por impacto y coste.' },
]

export default function ServiciosPage() {
  return (
    <InnerPage eyebrow="01 / Servicios" title="Soluciones técnicas sin complicaciones." description="Un servicio claro empieza por entender el problema, acordar el alcance y explicar las opciones antes de ejecutar.">
      <div className="service-grid">
        {services.map(({ icon: Icon, title, price, description }) => (
          <article className="service-card" key={title}>
            <Icon size={22} aria-hidden="true" />
            <h3>{title}</h3>
            <p>{description}</p>
            <strong>{price}</strong>
            <Link className="text-link" href="/contacto">Consultar servicio <ArrowRight size={15} /></Link>
          </article>
        ))}
      </div>
      <p className="inner-disclaimer">Precios orientativos publicados para facilitar la planificación. El presupuesto final depende del alcance, desplazamiento y necesidades confirmadas antes de empezar.</p>
    </InnerPage>
  )
}
