import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock3, Laptop, MapPin, ShieldCheck } from 'lucide-react'
import { InnerPage } from '@/components/inner-page'

const siteUrl = 'https://neotechzgz.vercel.app'

export const metadata: Metadata = {
  title: 'Soporte informático en Zaragoza | NeoTech ZGZ',
  description: 'Asistencia informática remota y presencial en Zaragoza para autónomos y pequeños negocios. Diagnóstico, mantenimiento y presupuestos claros antes de empezar.',
  alternates: { canonical: siteUrl + '/soporte-informatico-zaragoza' },
  openGraph: {
    title: 'Soporte informático en Zaragoza | NeoTech ZGZ',
    description: 'Soporte IT remoto y presencial para profesionales y pequeños negocios de Zaragoza.',
    url: siteUrl + '/soporte-informatico-zaragoza',
    type: 'website',
  },
}

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Soporte informático en Zaragoza',
  serviceType: 'Soporte informático remoto y presencial',
  description: 'Diagnóstico, asistencia informática y mantenimiento para profesionales y pequeños negocios.',
  provider: {
    '@type': 'Organization',
    name: 'NeoTech ZGZ',
    url: siteUrl,
    email: 'larbimhed260796@gmail.com',
    telephone: '+34684798569',
  },
  areaServed: { '@type': 'City', name: 'Zaragoza', containedInPlace: { '@type': 'AdministrativeArea', name: 'Aragón, España' } },
  availableChannel: [
    { '@type': 'ServiceChannel', serviceType: 'Soporte remoto' },
    { '@type': 'ServiceChannel', serviceType: 'Asistencia presencial en Zaragoza, sujeta a disponibilidad' },
  ],
}

const steps = [
  { title: 'Cuéntanos qué ocurre', text: 'Describe el equipo, el problema y la urgencia sin enviar contraseñas ni datos sensibles.', Icon: Laptop },
  { title: 'Recibe una propuesta clara', text: 'Confirmamos el alcance, el precio orientativo, la disponibilidad y cualquier coste antes de intervenir.', Icon: CheckCircle2 },
  { title: 'Resolvemos y documentamos', text: 'Realizamos las tareas acordadas y te explicamos qué se ha hecho y qué conviene revisar después.', Icon: ShieldCheck },
]

export default function SoporteInformaticoZaragozaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema).replace(/</g, '\\u003c') }} />
      <InnerPage
        eyebrow="Soporte informático / Zaragoza"
        title="Soporte informático claro para tu negocio en Zaragoza."
        description="Ayuda técnica para autónomos, profesionales y pequeños negocios: resolvemos incidencias, revisamos equipos y explicamos las opciones antes de hacer cambios."
      >
        <div className="trust-grid">
          <article className="trust-card">
            <Laptop size={22} aria-hidden="true" />
            <h3>Asistencia remota</h3>
            <p>Diagnóstico guiado y resolución de incidencias de software y configuración cuando el problema puede tratarse a distancia.</p>
            <strong>55 € / hora</strong>
          </article>
          <article className="trust-card">
            <MapPin size={22} aria-hidden="true" />
            <h3>Asistencia presencial</h3>
            <p>Instalación, configuración y mantenimiento en Zaragoza, con cita y según disponibilidad.</p>
            <strong>75 € / hora</strong>
          </article>
          <article className="trust-card">
            <Clock3 size={22} aria-hidden="true" />
            <h3>Alcance acordado</h3>
            <p>Antes de empezar confirmamos tareas, tiempos previstos, posibles limitaciones y precio aplicable.</p>
            <strong>Sin sorpresas evitables</strong>
          </article>
        </div>

        <section aria-labelledby="casos-soporte" style={{ marginTop: 42 }}>
          <p className="eyebrow">En qué podemos ayudarte</p>
          <h2 id="casos-soporte">Incidencias y tareas habituales</h2>
          <ul className="service-detail-list" style={{ display: 'grid', gap: 10, listStyleType: 'disc', paddingLeft: '1.4rem', color: 'var(--muted)', lineHeight: 1.7 }}>
            <li>Diagnóstico de problemas de equipos, software y conectividad.</li>
            <li>Configuración de ordenadores, aplicaciones, impresoras y periféricos.</li>
            <li>Revisión de actualizaciones, rendimiento y mantenimiento preventivo.</li>
            <li>Orientación sobre copias de seguridad, accesos y prácticas básicas de seguridad.</li>
            <li>Recomendaciones técnicas para mejorar procesos y reducir interrupciones.</li>
          </ul>
          <p className="inner-disclaimer">No todas las incidencias pueden resolverse en remoto. Los trabajos presenciales requieren confirmar ubicación y disponibilidad. Los precios publicados son orientativos; los impuestos aplicables y el presupuesto final se confirmarán antes de contratar.</p>
        </section>

        <section aria-labelledby="proceso-soporte" style={{ marginTop: 42 }}>
          <p className="eyebrow">Cómo trabajamos</p>
          <h2 id="proceso-soporte">Tres pasos, con las condiciones claras.</h2>
          <div className="trust-grid">
            {steps.map(({ title, text, Icon }, index) => (
              <article className="trust-card" key={title}>
                <Icon size={22} aria-hidden="true" />
                <p className="project-index">0{index + 1}</p>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="faq-soporte" style={{ marginTop: 42 }}>
          <p className="eyebrow">Preguntas frecuentes</p>
          <h2 id="faq-soporte">Antes de solicitar soporte</h2>
          <div className="hero-panel">
            <h3>¿Trabajáis solo en Zaragoza?</h3>
            <p className="lede">La asistencia presencial se ofrece en Zaragoza según disponibilidad. El soporte remoto puede valorarse para clientes de otras zonas.</p>
            <h3>¿Cuánto cuesta una intervención?</h3>
            <p className="lede">Las tarifas orientativas son 55 €/hora en remoto y 75 €/hora en presencial. Confirmaremos el alcance, impuestos aplicables y cualquier gasto adicional antes de iniciar el trabajo.</p>
            <h3>¿Puedo enviar contraseñas para acelerar el diagnóstico?</h3>
            <p className="lede">No. No envíes contraseñas, códigos de verificación, datos bancarios ni información sensible por el formulario o correo. Si se requiere acceso remoto, acordaremos un método seguro y limitado.</p>
            <h3>¿Se empieza al enviar la consulta?</h3>
            <p className="lede">No. El formulario inicia una conversación; el trabajo comienza solo después de acordar y aceptar el presupuesto y las condiciones.</p>
          </div>
        </section>

        <div className="hero-panel" style={{ marginTop: 42 }}>
          <p className="panel-label">Siguiente paso</p>
          <h2>Explícanos el problema y te orientamos.</h2>
          <p className="lede">Indica qué necesitas, qué equipo está afectado y cómo te gustaría resolverlo. No incluyas datos confidenciales.</p>
          <Link className="button button-primary" href="/contacto">Solicitar valoración <ArrowRight size={16} aria-hidden="true" /></Link>
          <Link className="text-link" href="/servicios">Ver todos los servicios <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
      </InnerPage>
    </>
  )
}
