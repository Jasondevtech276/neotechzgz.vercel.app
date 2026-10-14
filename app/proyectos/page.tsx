import type { Metadata } from 'next'
import { ExternalLink } from 'lucide-react'
import { InnerPage } from '@/components/inner-page'

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
  return (
    <InnerPage eyebrow="03 / Proyectos" title="Ideas convertidas en experiencias digitales." description="Una muestra de proyectos web con necesidades diferentes: desde presencia de marca hasta portfolios y sitios para negocios y asociaciones.">
      <p className="eyebrow">Selección / Casos</p>
      <h2>Cada proyecto tiene su propio propósito.</h2>
      <div className="project-grid">
        {projects.map(project => (
          <article className="project-card" key={project.index}>
            <span className="project-index">{project.index} / CASE</span>
            <p>{project.type} · {project.location}</p>
            <h3>{project.name}</h3>
            <span>{project.detail}</span>
            <a href={project.url} target="_blank" rel="noopener noreferrer">Visitar proyecto <ExternalLink size={14} aria-hidden="true" /></a>
          </article>
        ))}
      </div>
      <div className="hero-panel" style={{ marginTop: 28 }}>
        <p className="panel-label">Tu proyecto</p>
        <h2>La siguiente historia puede ser la tuya.</h2>
        <p className="lede">Cuéntanos qué quieres conseguir y definiremos un alcance realista antes de desarrollar.</p>
        <a className="button button-primary" href="/contacto">Crear un proyecto ↗</a>
      </div>
    </InnerPage>
  )
}
