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

      <section className="hero-panel" style={{ marginTop: 28 }}>
        <p className="eyebrow">Checklist orientativo</p>
        <h2>Seis comprobaciones que merece la pena programar</h2>
        <ul>
          <li><strong>Inventario:</strong> equipos, aplicaciones críticas, responsables y fechas de garantía.</li>
          <li><strong>Actualizaciones:</strong> sistema operativo, navegador y aplicaciones, con una ventana de mantenimiento y plan de recuperación.</li>
          <li><strong>Copias de seguridad:</strong> comprobar que terminan correctamente y probar restauraciones; no basta con ver que existe una copia.</li>
          <li><strong>Accesos:</strong> activar MFA cuando esté disponible, limitar privilegios de administrador y retirar cuentas que ya no se necesiten.</li>
          <li><strong>Red y dispositivos:</strong> revisar router, Wi-Fi, protección de equipos y firmware siguiendo las indicaciones del fabricante.</li>
          <li><strong>Continuidad:</strong> documentar contactos, prioridades de recuperación y pasos para aislar un equipo sospechoso.</li>
        </ul>
        <p>Registra la fecha, el resultado, las incidencias y la persona responsable de cada acción. No guardes contraseñas ni claves privadas en la documentación de mantenimiento.</p>
        <p className="inner-disclaimer">Esta lista es una orientación general, no una auditoría de seguridad ni una garantía de ausencia de incidentes. Las medidas concretas dependen del entorno y de los riesgos identificados.</p>
      </section>

      <section className="hero-panel" style={{ marginTop: 28 }}>
        <p className="eyebrow">Preguntas frecuentes</p>
        <h2>Cómo organizar el mantenimiento informático</h2>
        <h3>¿Cada cuánto hay que revisar los equipos?</h3>
        <p>Depende del número de equipos, su uso, la criticidad de los datos y los cambios del entorno. Define una periodicidad inicial y ajústala con los resultados de cada revisión.</p>
        <h3>¿Una copia de seguridad garantiza la recuperación?</h3>
        <p>No por sí sola. Hay que probar restauraciones, proteger las credenciales de acceso y conservar copias separadas de los equipos que podrían verse afectados por un incidente.</p>
        <h3>¿El mantenimiento incluye soporte ilimitado?</h3>
        <p>No necesariamente. El alcance, las horas incluidas, las visitas, los tiempos objetivo y las exclusiones deben quedar por escrito en la propuesta o el plan contratado.</p>
        <p>Consulta también los <Link href="/servicios">servicios IT</Link> y los <Link href="/planes">planes de soporte</Link>, o <Link href="/contacto">contacta para definir el alcance</Link>.</p>
      </section>
    </InnerPage>
  )
}
