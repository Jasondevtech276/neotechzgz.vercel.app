'use client'

import { useState } from 'react'
import { ArrowUpRight, Check, ChevronRight, Code2, Cpu, LifeBuoy, MapPin, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import styles from './conceptos.module.css'

type StyleKey = 'editorial' | 'neon' | 'atelier'

const concepts: { key: StyleKey; name: string; mood: string; description: string }[] = [
  { key: 'editorial', name: '01 / Editorial', mood: 'Impacto limpio', description: 'Blanco roto, tipografía contundente y naranja energético. Directo, humano y muy comercial.' },
  { key: 'neon', name: '02 / Neon lab', mood: 'Tecnología al límite', description: 'Negro tinta, verde ácido y paneles técnicos. Una identidad digital atrevida y memorable.' },
  { key: 'atelier', name: '03 / Atelier', mood: 'Premium minimal', description: 'Marfil, tinta y azul cobalto. Más sofisticado, ordenado y orientado a empresas.' },
]

const services = [
  { icon: LifeBuoy, name: 'Soporte remoto', copy: 'Diagnóstico, resolución de incidencias y optimización a distancia.', price: '55 €', unit: '/ hora' },
  { icon: MapPin, name: 'Soporte presencial', copy: 'Instalación, mantenimiento y asistencia técnica en Zaragoza.', price: '75 €', unit: '/ hora' },
  { icon: Code2, name: 'Desarrollo web', copy: 'Webs profesionales y tiendas online con una base sólida.', price: '950 €', unit: ' desde' },
  { icon: ShieldCheck, name: 'Consultoría IT', copy: 'Evaluación técnica, planificación y decisiones con criterio.', price: '85 €', unit: '/ hora' },
]

const plans = [
  { name: 'STARTER', price: '99 €', detail: 'Para empezar con soporte organizado', features: ['3 horas de soporte al mes', 'Email y teléfono', 'Respuesta objetivo en 24 h'] },
  { name: 'PROFESSIONAL', price: '179 €', detail: 'Para equipos que necesitan continuidad', features: ['8 horas de soporte al mes', 'Una visita presencial', 'Respuesta objetivo en 12 h'], featured: true },
  { name: 'ENTERPRISE', price: '399 €', detail: 'Para operaciones con más necesidades', features: ['Soporte prioritario', 'Visitas incluidas según alcance', 'Consultoría continua'] },
]

const projects = [
  { name: "Ella's Details", kind: 'E-commerce · Ohio', text: 'Experiencia web para una marca de detalles y regalos.' },
  { name: 'You Portfolio Danza', kind: 'Portfolio · Lyon', text: 'Portfolio profesional con contenido multilingüe.' },
  { name: 'Mariano Patines ZGZ', kind: 'Negocio local · Zaragoza', text: 'Presencia digital orientada a facilitar el contacto.' },
  { name: 'ASOCEMIR', kind: 'Asociación · Zaragoza / Argentina', text: 'Sitio bilingüe para una comunidad cultural.' },
]

export default function DesignConceptsPage() {
  const [active, setActive] = useState<StyleKey>('neon')
  const current = concepts.find((item) => item.key === active) ?? concepts[1]

  return (
    <main className={styles.shell} data-theme={active}>
      <div className={styles.topline}><span className={styles.brandMark}>N<span>.</span></span><span>NEOTECH ZGZ <i> / VISUAL LAB</i></span><a href="/" className={styles.back}>Volver a la web <ArrowUpRight size={15} /></a></div>
      <section className={styles.selector}>
        <div>
          <p className={styles.kicker}><Sparkles size={14} /> DIRECCIÓN CREATIVA · CONCEPTOS NO PUBLICADOS</p>
          <h1>La misma esencia.<br /><em>Tres nuevas actitudes.</em></h1>
          <p className={styles.intro}>Explora tres rutas visuales para NeoTech ZGZ. La estructura, los servicios y la información principal se mantienen; lo que cambia es la personalidad de la marca.</p>
        </div>
        <div className={styles.stylePicker} aria-label="Seleccionar estilo visual">
          {concepts.map((concept) => <button key={concept.key} type="button" onClick={() => setActive(concept.key)} className={active === concept.key ? styles.selected : ''} aria-pressed={active === concept.key}><span>{concept.name}</span><small>{concept.mood}</small><ChevronRight size={16} /></button>)}
        </div>
      </section>

      <section className={styles.preview} aria-live="polite">
        <div className={styles.previewNav}><a href="#" className={styles.previewLogo}>NeoTech<span>ZGZ</span><b>®</b></a><nav><a href="#servicios">Servicios</a><a href="#proyectos">Proyectos</a><a href="#planes">Planes</a></nav><a className={styles.navCta} href="/#contacto">Hablemos <ArrowUpRight size={15} /></a></div>
        <div className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span className={styles.liveDot} /> TECNOLOGÍA CON CRITERIO · ZARAGOZA + REMOTO</p>
            <h2>Tu tecnología.<br /><span>Sin complicaciones.</span></h2>
            <p className={styles.heroText}>Soluciones informáticas, desarrollo web y consultoría IT para particulares, autónomos y empresas que quieren avanzar con confianza.</p>
            <div className={styles.actions}><a href="/#contacto" className={styles.primaryButton}>Cuéntanos qué necesitas <ArrowUpRight size={17} /></a><a href="#servicios" className={styles.secondaryButton}>Explorar servicios</a></div>
            <div className={styles.proof}><div className={styles.proofIcon}><ShieldCheck size={18} /></div><p><strong>Soluciones a medida</strong><small>Trato directo. Alcance claro. Sin ruido.</small></p><span className={styles.proofLine} /></div>
          </div>
          <div className={styles.visual}>
            <div className={styles.visualOrb} />
            <div className={styles.visualGrid} />
            <div className={styles.visualLabel}><span>NT / 026</span><span>IT · WEB · SYSTEMS</span></div>
            <div className={styles.terminal}><div className={styles.terminalHead}><span /><span /><span /><small>neotech.systems</small></div><div className={styles.terminalBody}><p><i>01</i> Diagnóstico inteligente</p><p><i>02</i> Soluciones que encajan</p><p><i>03</i> Tecnología preparada</p><div className={styles.terminalStatus}><span /> SISTEMA LISTO <b>98.6%</b></div></div></div>
            <div className={styles.floatCard}><Zap size={16} /><span><strong>Menos fricción.</strong><small>Más posibilidades.</small></span></div>
            <div className={styles.visualFoot}>BUILT AROUND YOUR NEEDS <span>↗</span></div>
          </div>
        </div>
        <div className={styles.ticker}><span>ASISTENCIA TÉCNICA</span><b>✳</b><span>DESARROLLO WEB</span><b>✳</b><span>CONSULTORÍA IT</span><b>✳</b><span>TECNOLOGÍA CON CRITERIO</span></div>
        <section id="servicios" className={styles.section}>
          <div className={styles.sectionHeading}><div><p className={styles.kicker}>01 / QUÉ HACEMOS</p><h3>Tecnología útil.<br /><em>Resultados reales.</em></h3></div><p>Desde resolver una incidencia hasta construir tu próxima plataforma digital, cada servicio parte de tus necesidades.</p></div>
          <div className={styles.serviceGrid}>{services.map((service, index) => { const Icon = service.icon; return <article key={service.name} className={styles.serviceCard}><div className={styles.cardTop}><span className={styles.serviceIcon}><Icon size={19} /></span><span className={styles.index}>0{index + 1}</span></div><h4>{service.name}</h4><p>{service.copy}</p><div className={styles.price}>{service.price}<small>{service.unit}</small></div><a href="/#contacto" aria-label={'Consultar ' + service.name}>Consultar servicio <ArrowUpRight size={15} /></a></article> })}</div>
        </section>
        <section id="proyectos" className={styles.section + ' ' + styles.projectsSection}>
          <div className={styles.sectionHeading}><div><p className={styles.kicker}>02 / TRABAJO SELECCIONADO</p><h3>Ideas que ya están<br /><em>en movimiento.</em></h3></div><p>Una selección de proyectos web y digitales en contextos diferentes.</p></div>
          <div className={styles.projectGrid}>{projects.map((project, index) => <article className={styles.projectCard} key={project.name}><div className={styles.projectArt}><span>0{index + 1}</span><div className={styles.projectGlyph}>{index === 0 ? 'E.' : index === 1 ? 'Y/' : index === 2 ? 'M+' : 'A↗'}</div><ArrowUpRight size={18} /></div><small>{project.kind}</small><h4>{project.name}</h4><p>{project.text}</p></article>)}</div>
        </section>
        <section id="planes" className={styles.section}>
          <div className={styles.sectionHeading}><div><p className={styles.kicker}>03 / SOPORTE CONTINUO</p><h3>El plan que sigue<br /><em>tu ritmo.</em></h3></div><p>Opciones mensuales previstas, sin permanencia. Alcance, precio final e impuestos deben confirmarse antes de contratar.</p></div>
          <div className={styles.planGrid}>{plans.map((plan) => <article key={plan.name} className={styles.planCard + (plan.featured ? ' ' + styles.featuredPlan : '')}>{plan.featured && <span className={styles.recommended}>MÁS COMPLETO</span>}<p className={styles.planName}>{plan.name}</p><p className={styles.planDetail}>{plan.detail}</p><div className={styles.planPrice}>{plan.price}<small>/ mes · previsto</small></div><ul>{plan.features.map((feature) => <li key={feature}><Check size={15} />{feature}</li>)}</ul><a href="/#contacto">Consultar condiciones <ArrowUpRight size={15} /></a></article>)}</div>
          <p className={styles.disclaimer}>Diseño conceptual. Los importes y prestaciones se muestran como referencia y deben verificarse antes de publicar una oferta comercial.</p>
        </section>
        <section className={styles.finalCta}><div><p className={styles.kicker}>04 / EMPECEMOS</p><h3>Tu próximo paso<br /><em>empieza aquí.</em></h3></div><a href="/#contacto" className={styles.primaryButton}>Hablar con NeoTech <ArrowUpRight size={17} /></a><div className={styles.ctaShape}><Cpu size={42} /></div></section>
        <footer className={styles.footer}><a href="/" className={styles.previewLogo}>NeoTech<span>ZGZ</span></a><span>Zaragoza · Servicio remoto disponible</span><span>© NeoTech ZGZ · Concepto visual</span></footer>
      </section>
      <aside className={styles.conceptNote}><div><strong>{current.name} — {current.mood}</strong><p>{current.description}</p></div><span className={styles.palette}><i /><i /><i /><i /></span></aside>
      <p className={styles.notice}>Este laboratorio visual es una propuesta independiente. No cambia la web pública, sus estilos actuales ni sus datos de producción.</p>
    </main>
  )
}
