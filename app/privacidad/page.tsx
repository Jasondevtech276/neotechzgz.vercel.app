import type { Metadata } from 'next'
import Link from 'next/link'
import { InnerPage } from '@/components/inner-page'

export const metadata: Metadata = {
  title: 'Política de privacidad | NeoTech ZGZ',
  description: 'Información sobre el tratamiento de datos personales en NeoTech ZGZ.',
  alternates: { canonical: 'https://neotechzgz.vercel.app/privacidad' },
}

export default function PrivacyPage() {
  return (
    <InnerPage eyebrow="Información legal / Privacidad" title="Tus datos, tratados con criterio." description="Qué datos pueden tratarse, para qué se utilizan y cómo ejercer tus derechos al contactar o contratar con NeoTech ZGZ.">
      <div className="legal-grid">
        <section><h2>1. Responsable</h2><p>El responsable es Mohammed Jassem Larbi, que opera bajo el nombre comercial NeoTech ZGZ. Para consultas de privacidad o para ejercer derechos, escribe a <a href="mailto:larbimhed260796@gmail.com">larbimhed260796@gmail.com</a>. La dirección postal para notificaciones se publicará cuando el titular confirme la forma exacta.</p></section>
        <section><h2>2. Datos y finalidades</h2><p>Según el uso del sitio, pueden tratarse datos identificativos y de contacto, solicitudes y presupuestos, datos de cuenta, información necesaria para prestar soporte, datos de facturación y pago, y registros técnicos de seguridad. Se utilizan para responder consultas, gestionar presupuestos y cuentas, prestar servicios, tramitar pagos y facturación, proteger la plataforma y atender obligaciones legales.</p></section>
        <section><h2>3. Bases jurídicas</h2><p>Las solicitudes previas a una contratación se gestionan para adoptar medidas precontractuales; la prestación del servicio, sobre la base del contrato; la facturación, por obligación legal; y la seguridad o defensa de reclamaciones, cuando corresponda, sobre la base de un interés legítimo debidamente ponderado. Los tratamientos opcionales basados en consentimiento pueden rechazarse o retirarse sin afectar a la licitud del tratamiento previo.</p></section>
        <section><h2>4. Proveedores y destinatarios</h2><p>Según las funciones activadas, pueden intervenir proveedores de alojamiento y despliegue, autenticación y base de datos, pagos, correo electrónico, analítica o medición publicitaria. La lista efectiva, los roles de cada proveedor, los contratos y las transferencias internacionales deben verificarse frente a la configuración activa antes de dar por cerrada esta política. No vendemos datos personales.</p></section>
        <section><h2>5. Cookies y medición</h2><p>Las tecnologías no esenciales de analítica o publicidad solo deben activarse tras obtener el consentimiento correspondiente. Puedes revisar o cambiar tu elección mediante las preferencias de cookies del sitio. El inventario real de cookies y la carga efectiva de scripts deben comprobarse periódicamente y tras cambios técnicos.</p><p>Consulta también las políticas de <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google</a> y <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noreferrer">Meta</a> si se activan sus herramientas.</p></section>
        <section><h2>6. Conservación y eliminación</h2><p>Los datos se conservarán solo durante el tiempo necesario para cada finalidad, sin perjuicio de los plazos legales de facturación y de la defensa de reclamaciones. Los plazos efectivos de eliminación de cuentas, las tareas programadas y cualquier ventana técnica de recuperación deben verificarse contra el comportamiento real del sistema; no se promete un plazo fijo hasta completar esa comprobación.</p></section>
        <section><h2>7. Tus derechos</h2><p>Puedes solicitar acceso, rectificación, supresión, oposición, limitación y portabilidad cuando corresponda, así como retirar el consentimiento para los tratamientos basados en él. Contacta con <a href="mailto:larbimhed260796@gmail.com">larbimhed260796@gmail.com</a>. También puedes reclamar ante la <a href="https://www.aepd.es/" target="_blank" rel="noreferrer">Agencia Española de Protección de Datos</a>. Algunos datos pueden conservarse cuando exista una obligación legal o sean necesarios para reclamaciones.</p></section>
        <section><h2>8. Seguridad y servicios a clientes</h2><p>Se aplican medidas técnicas y organizativas proporcionales al riesgo, sin que ningún sistema pueda garantizar seguridad absoluta. Cuando NeoTech ZGZ trate datos personales por cuenta de un cliente, las funciones de responsable y encargado deben determinarse según el servicio y formalizarse mediante el acuerdo correspondiente cuando la normativa lo exija.</p></section>
      </div>
      <p className="inner-disclaimer">Revisión pendiente antes de publicación definitiva: inventario real de proveedores y cookies, contratos y transferencias internacionales, domicilio para notificaciones y plazos reales de eliminación. Esta información no acredita por sí sola el cumplimiento integral de la normativa aplicable.</p>
      <p><Link className="button button-quiet" href="/legal">Consultar aviso legal</Link> <Link className="button button-quiet" href="/condiciones">Ver estado de las condiciones</Link></p>
    </InnerPage>
  )
}
