import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Servicios IT y desarrollo web | NeoTech ZGZ',
  description: 'Soporte técnico remoto y presencial, desarrollo web y consultoría IT para profesionales y negocios en Zaragoza y online.',
  alternates: { canonical: 'https://neotechzgz.vercel.app/servicios' },
  openGraph: { title: 'Servicios IT y desarrollo web | NeoTech ZGZ', description: 'Soluciones tecnológicas claras, con alcance y precios orientativos transparentes.', url: 'https://neotechzgz.vercel.app/servicios', type: 'website' },
}

const services = [
  { number: '01', title: 'Soporte remoto', price: '55 € / hora', description: 'Diagnóstico guiado, resolución de incidencias de software y optimización de equipos a distancia.' },
  { number: '02', title: 'Soporte presencial', price: '75 € / hora', description: 'Instalación, configuración y mantenimiento informático presencial en Zaragoza, sujeto a disponibilidad.' },
  { number: '03', title: 'Desarrollo web', price: 'Desde 950 €', description: 'Sitios web profesionales y experiencias digitales adaptadas al negocio, con foco en claridad, rendimiento y accesibilidad.' },
  { number: '04', title: 'Consultoría IT', price: '85 € / hora', description: 'Análisis técnico, planificación y recomendaciones para tomar decisiones tecnológicas con criterio.' },
]

export default function ServicesPage() {
  return <main className="site">
    <header className="site-header"><nav><a href="/" className="brand"><span className="brand-mark">N</span><span>NeoTech <em>ZGZ</em></span></a><div className="desktop-nav"><a href="/#servicios">Servicios</a><a href="/proyectos">Proyectos</a><a href="/sobre-neotech">Sobre NeoTech</a><a href="/legal">Información legal</a></div><a href="/#contacto" className="button button-primary">Contactar</a></nav></header>
    <section className="hero"><div className="hero-copy"><p className="eyebrow">NEOTECH ZGZ / SERVICIOS</p><h1>Tecnología que resuelve. Sin ruido.</h1><p className="lede">Soporte IT, desarrollo web y consultoría con explicaciones claras, alcance definido y soluciones pensadas para durar.</p><div className="hero-actions"><a className="button button-primary" href="/#contacto">Cuéntame tu necesidad ↗</a><a className="button button-quiet" href="/#contacto">Pedir presupuesto</a></div><div className="proof"><span><strong>01</strong> Diagnóstico</span><span><strong>02</strong> Plan claro</span><span><strong>03</strong> Ejecución</span></div></div><aside className="hero-panel"><p className="panel-label">Cómo trabajamos</p><div className="process-row"><span>01</span><p>Entendemos el problema</p><span aria-hidden="true">↗</span></div><div className="process-row"><span>02</span><p>Explicamos opciones y costes</p><span aria-hidden="true">↗</span></div><div className="process-row"><span>03</span><p>Implementamos y verificamos</p><span aria-hidden="true">↗</span></div><p className="lede">Los importes son orientativos; el alcance final se confirma antes de comenzar.</p></aside></section>
    <section className="section"><div className="section-inner"><p className="eyebrow">01 / Servicios</p><h2>El apoyo adecuado para cada reto.</h2><div className="service-grid">{services.map(item => <article className="service-card" key={item.number}><span className="project-index">{item.number}</span><h3>{item.title}</h3><p>{item.description}</p><strong>{item.price}</strong><a className="text-link" href="/#contacto">Consultar disponibilidad ↗</a></article>)}</div></div></section>
    <section className="tracking"><div className="section-inner tracking-grid"><div><p className="eyebrow">02 / Transparencia</p><h2>Primero claridad. Después, tecnología.</h2></div><div className="hero-panel"><div className="process-row"><span>✓</span><p>Presupuesto antes de ejecutar</p></div><div className="process-row"><span>✓</span><p>Alcance y prioridades explicados</p></div><div className="process-row"><span>✓</span><p>Seguimiento de la solicitud desde la web</p></div><a className="button button-primary" href="/#seguimiento">Consultar una solicitud</a></div></div></section>
    <footer><div><a href="/" className="brand"><span className="brand-mark">N</span><span>NeoTech <em>ZGZ</em></span></a><p>Tecnología clara para negocios que quieren avanzar.</p></div><div className="footer-links"><a href="/proyectos">Proyectos</a><a href="/sobre-neotech">Sobre NeoTech</a><a href="/legal">Legal y privacidad</a></div></footer>
  </main>
}
