import type { Metadata } from 'next'
import { ExternalLink, MapPin } from 'lucide-react'
import { InnerPage } from '@/components/inner-page'

export const metadata: Metadata = {
  title: 'Proyectos web | NeoTech ZGZ',
  description: 'Selección de proyectos web y digitales realizados por NeoTech ZGZ.',
}

const projects = [
  { name: "Ella's Details", url: 'https://ellasdetails.netlify.app', type: 'Landing e-commerce', place: 'Dayton, Ohio', description: 'Web para una marca de decoraciones y desayunos.' },
  { name: 'You Portfolio Danza', url: 'https://youdance.netlify.app', type: 'Portfolio', place: 'Universidad de Lyon', description: 'Portfolio trilingüe para una bailarina profesional.' },
  { name: 'Mariano Patines ZGZ', url: 'https://zgzpatinesnano.netlify.app', type: 'Negocio local', place: 'Zaragoza', description: 'Sitio para negocio local con acceso directo a contacto.' },
  { name: 'ASOCEMIR', url: 'https://asocemir.netlify.app', type: 'Asociación', place: 'Zaragoza / Argentina', description: 'Sitio bilingüe para una asociación cultural.' },
]

export default function ProyectosPage() {
  return (
    <InnerPage eyebrow="03 / Proyectos" title="Trabajo digital diseñado para personas reales." description="Una selección de proyectos web con objetivos distintos: presentar una marca, facilitar el contacto y explicar una propuesta con claridad.">
      <div className="project-grid">
        {projects.map((project, index) => (
          <article className="project-card" key={project.name}>
            <span className="project-index">{String(index + 1).padStart(2, '0')}</span>
            <p>{project.type}</p>
            <h3>{project.name}</h3>
            <span>{project.description}</span>
            <small><MapPin size={14} aria-hidden="true" />{project.place}</small>
            <a href={project.url} target="_blank" rel="noopener noreferrer" aria-label={`Visitar el proyecto ${project.name} (se abre en una pestaña nueva)`}>Visitar proyecto <ExternalLink size={14} /></a>
          </article>
        ))}
      </div>
    </InnerPage>
  )
}
