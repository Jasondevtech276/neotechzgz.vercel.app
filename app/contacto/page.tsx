import type { Metadata } from 'next'
import { Mail, Phone, MapPin, ShieldCheck } from 'lucide-react'
import { InnerPage } from '@/components/inner-page'

export const metadata: Metadata = {
  title: 'Contacto | NeoTech ZGZ',
  description: 'Contacta con NeoTech ZGZ para soporte IT, desarrollo web o consultoría en Zaragoza.',
}

export default function ContactoPage() {
  return (
    <InnerPage eyebrow="04 / Contacto" title="Empecemos por el problema que quieres resolver." description="Describe tu objetivo y el contexto. Te ayudaremos a identificar el siguiente paso técnico más razonable.">
      <div className="contact-grid inner-contact-grid">
        <div>
          <p className="lede">El contacto inicial sirve para aclarar necesidades y alcance. No se inicia ningún trabajo ni cobro hasta acordar los términos.</p>
          <div className="contact-list">
            <a href="mailto:larbimhed260796@gmail.com"><Mail size={17} aria-hidden="true" />larbimhed260796@gmail.com</a>
            <a href="tel:+34684798569"><Phone size={17} aria-hidden="true" />+34 684 798 569</a>
            <span><MapPin size={17} aria-hidden="true" />Zaragoza y asistencia remota</span>
          </div>
        </div>
        <aside className="form-card">
          <ShieldCheck size={22} aria-hidden="true" />
          <h2>Antes de enviar información</h2>
          <p>Incluye solo los datos necesarios para describir la consulta. No envíes contraseñas, códigos de verificación, datos bancarios ni información sensible.</p>
          <a className="button button-primary" href="mailto:larbimhed260796@gmail.com?subject=Consulta%20NeoTech%20ZGZ">Escribir un correo</a>
        </aside>
      </div>
    </InnerPage>
  )
}
