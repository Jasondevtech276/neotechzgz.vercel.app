import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

type InnerPageProps = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}

export function InnerPage({ eyebrow, title, description, children }: InnerPageProps) {
  return (
    <main className="site">
      <header className="site-header">
        <nav aria-label="Navegación principal">
          <Link href="/" className="brand" aria-label="NeoTech ZGZ, inicio">
            <span className="brand-mark">N</span>
            <span>NeoTech <em>ZGZ</em></span>
          </Link>
          <div className="desktop-nav">
            <Link href="/servicios">Servicios</Link>
            <Link href="/planes">Planes</Link>
            <Link href="/proyectos">Proyectos</Link>
            <Link href="/contacto">Contacto</Link>
            <Link href="/login">Acceder</Link>
          </div>
        </nav>
      </header>
      <section className="hero inner-hero">
        <div className="hero-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lede">{description}</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/#contacto">Hablar de mi proyecto <ArrowRight size={16} /></Link>
            <Link className="button button-quiet" href="/"><ArrowLeft size={16} /> Volver al inicio</Link>
          </div>
        </div>
        <aside className="hero-panel inner-note">
          <p className="eyebrow">NeoTech ZGZ / Zaragoza</p>
          <h2>Tecnología clara. Decisiones con criterio.</h2>
          <p className="lede">Diagnóstico, propuesta y acompañamiento con alcance y próximos pasos explicados desde el principio.</p>
          <Link className="text-link" href="/#contacto">Cuéntanos qué necesitas <ArrowRight size={16} /></Link>
        </aside>
      </section>
      <section className="section inner-content">
        <div className="section-inner">{children}</div>
      </section>
      <footer>
        <div>
          <Link href="/" className="brand"><span className="brand-mark">N</span><span>NeoTech <em>ZGZ</em></span></Link>
          <p>Soporte, desarrollo y consultoría IT desde Zaragoza.</p>
        </div>
        <div className="footer-links">
          <Link href="/servicios">Servicios</Link>
          <Link href="/planes">Planes</Link>
          <Link href="/proyectos">Proyectos</Link>
          <Link href="/contacto">Contacto</Link>
          <Link href="/login">Acceder</Link>
        </div>
      </footer>
    </main>
  )
}
