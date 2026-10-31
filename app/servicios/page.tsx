import type { Metadata } from 'next'
import { ArrowRight, Code2, MapPin, Server, ShieldCheck, LockKeyhole, Wrench } from 'lucide-react'
import Link from 'next/link'
import { InnerPage } from '@/components/inner-page'
import { getPublicPrices } from '@/lib/pricing'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Servicios IT y desarrollo web | NeoTech ZGZ',
  description: 'Soporte técnico remoto y presencial, desarrollo web y consultoría IT para profesionales y negocios en Zaragoza y online.',
  alternates: { canonical: 'https://neotechzgz.vercel.app/servicios' },
  openGraph: { title: 'Servicios IT y desarrollo web | NeoTech ZGZ', description: 'Soluciones tecnológicas claras, con alcance y precios orientativos transparentes.', url: 'https://neotechzgz.vercel.app/servicios', type: 'website' },
}

const services = [
  { number: '01', title: 'Soporte remoto', productId: 'remote-support', unit: '/ hora', description: 'Diagnóstico guiado, resolución de incidencias de software y optimización de equipos a distancia.', Icon: Server, href: '/contacto' },
  { number: '02', title: 'Soporte presencial', productId: 'onsite-support', unit: '/ hora', description: 'Instalación, configuración y mantenimiento informático presencial en Zaragoza, sujeto a disponibilidad.', Icon: MapPin, href: '/contacto' },
  { number: '03', title: 'Desarrollo web', productId: 'web-development', unit: ' · desde', description: 'Sitios web profesionales y experiencias digitales adaptadas al negocio, con foco en claridad, rendimiento y accesibilidad.', Icon: Code2, href: '/desarrollo-web' },
  { number: '04', title: 'Consultoría IT', productId: 'it-consulting', unit: '/ hora', description: 'Análisis técnico, planificación y recomendaciones para tomar decisiones tecnológicas con criterio.', Icon: ShieldCheck, href: '/contacto' },
  { number: '05', title: 'Ciberseguridad', productId: '', unit: '', description: 'Revisión de accesos, configuración segura y medidas prácticas para reducir riesgos tecnológicos.', Icon: LockKeyhole, href: '/ciberseguridad' },
  { number: '06', title: 'Mantenimiento IT', productId: '', unit: '', description: 'Revisiones preventivas, actualizaciones y seguimiento de los equipos según el alcance acordado.', Icon: Wrench, href: '/mantenimiento' },
]

export default async function ServicesPage() {
  const prices = await getPublicPrices()
  const formatPrice = (productId: string) => {
    const price = prices[productId]
    return price ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: price.currency.toUpperCase(), maximumFractionDigits: 2 }).format(price.amount / 100) : 'Consultar'
  }
  return (
    <InnerPage eyebrow="01 / Servicios" title="Tecnología que resuelve. Sin ruido." description="Soporte IT, desarrollo web y consultoría con explicaciones claras, alcance definido y soluciones pensadas para durar.">
      <p className="eyebrow">Servicios / Alcance orientativo</p>
      <h2>El apoyo adecuado para cada reto.</h2>
      <div className="service-grid">
        {services.map(({ number, title, productId, unit, description, Icon, href }) => (
          <article className="service-card" key={number}>
            <Icon size={21} aria-hidden="true" />
            <p className="project-index">{number}</p>
            <h3>{title}</h3>
            <p>{description}</p>
            <strong>{formatPrice(productId)}{unit}</strong>
            <Link className="text-link" href={href}>{href === '/contacto' ? 'Consultar disponibilidad' : 'Ver servicio'} <ArrowRight size={15} aria-hidden="true" /></Link>
          </article>
        ))}
      </div>
      <p className="inner-disclaimer">Los importes son orientativos. El alcance, la disponibilidad, los impuestos aplicables y el presupuesto final se confirmarán antes de comenzar cualquier trabajo.</p>
      <div className="hero-panel" style={{ marginTop: 28 }}>
        <p className="panel-label">Proceso de trabajo</p>
        <div className="process-row"><span>01</span><p>Entendemos el problema</p></div>
        <div className="process-row"><span>02</span><p>Explicamos opciones y costes</p></div>
        <div className="process-row"><span>03</span><p>Implementamos y verificamos</p></div>
        <a className="text-link" href="/contacto">Cuéntanos qué necesitas <ArrowRight size={15} aria-hidden="true" /></a>
      </div>
    </InnerPage>
  )
}
