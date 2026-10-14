import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Proyectos web | NeoTech ZGZ',
  description: 'Una selección de proyectos web y soluciones digitales realizadas por NeoTech ZGZ.',
  alternates: { canonical: 'https://neotechzgz.vercel.app/proyectos' },
  openGraph: { title: 'Proyectos web | NeoTech ZGZ', description: 'Una selección de experiencias web y proyectos digitales.', url: 'https://neotechzgz.vercel.app/proyectos', type: 'website' },
}

const projects = [
  { index: '01', name: "Ella's Details", type: 'E-commerce / landing', location: 'Dayton, Ohio', detail: 'Web para una marca de decoraciones y desayunos.', url: 'https://ellasdetails.netlify.app' },
  { index: '02', name: 'You Portfolio Danza', type: 'Portfolio', location: 'Universidad de Lyon', detail: 'Portfolio trilingüe para una bailarina profesional.', url: 'https://youdance.netlify.app' },
  { index: '03', name: 'Mariano Patines ZGZ', type: 'Negocio local', location: 'Zaragoza', detail: 'Sitio de negocio local con acceso directo al contacto.', url: 'https://zgzpatinesnano.netlify.app' },
  { index: '04', name: 'ASOCEMIR', type: 'Asociación', location: 'Zaragoza / Argentina', detail: 'Sitio bilingüe para una asociación cultural.', url: 'https://asocemir.netlify.app' },
]

export default function ProjectsPage() {
  return <main className="site">
    <header className="site-header"><nav><a href="/" className="brand"><span className="brand-mark">N</span><span>NeoTech <em>ZGZ</em></span></a><div className="desktop-nav"><a href="/servicios">Servicios</a><a href="/sobre-neotech">Sobre NeoTech</a><a href="/legal">Información legal</a></div><a href="/#contacto" className="button button-primary">Hablemos</a></nav></header>
    <section className="hero"><div className="hero-copy"><p className="eyebrow">NEOTECH ZGZ / PROYECTOS</p><h1>Ideas convertidas en experiencias digitales.</h1><p className="lede">Una muestra de proyectos web con necesidades diferentes: desde presencia de marca hasta portfolios y sitios para negocios y asociaciones.</p><div className="hero-actions"><a className="button button-primary" href="/#contacto">Crear un proyecto</a><a className="button button-quiet" href="/servicios">Ver servicios</a></div></div><aside className="hero-panel"><p className="panel-label">Principios de diseño</p><div className="process-row"><span>01</span><p>Contenido fácil de entender</p></div><div className="process-row"><span>02</span><p>Experiencia adaptada a móvil</p></div><div className="process-row"><span>03</span><p>Objetivos claros para cada web</p></div></aside></section>
    <section className="section"><div className="section-inner"><p className="eyebrow">01 / Selección</p><h2>Cada proyecto tiene su propio propósito.</h2><div className="project-grid">{projects.map(project => <article className="project-card" key={project.index}><span className="project-index">{project.index} / CASE</span><p>{project.type} · {project.location}</p><h3>{project.name}</h3><span>{project.detail}</span><a href={project.url} target="_blank" rel="noreferrer">Visitar proyecto ↗</a></article>)}</div></div></section>
    <section className="tracking"><div className="section-inner tracking-grid"><div><p className="eyebrow">02 / Tu idea</p><h2>La siguiente historia puede ser la tuya.</h2><p className="lede">Cuéntame qué quieres conseguir y lo convertimos en un alcance realista.</p></div><div className="hero-panel"><p className="panel-label">Siguiente paso</p><div className="process-row"><span>01</span><p>Objetivo y audiencia</p></div><div className="process-row"><span>02</span><p>Propuesta y presupuesto</p></div><div className="process-row"><span>03</span><p>Diseño, desarrollo y revisión</p></div><a className="button button-primary" href="/#contacto">Contactar con NeoTech ↗</a></div></div></section>
    <footer><div><a href="/" className="brand"><span className="brand-mark">N</span><span>NeoTech <em>ZGZ</em></span></a><p>Diseño útil. Tecnología clara.</p></div><div className="footer-links"><a href="/servicios">Servicios</a><a href="/sobre-neotech">Sobre NeoTech</a><a href="/legal">Legal y privacidad</a></div></footer>
  </main>
}
