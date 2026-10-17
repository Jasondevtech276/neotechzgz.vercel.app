import type { Metadata } from 'next'
import Link from 'next/link'
import { InnerPage } from '@/components/inner-page'

export const metadata: Metadata = {
  title: 'Condiciones de contratación | NeoTech ZGZ',
  description: 'Estado de revisión de las condiciones de contratación de los servicios de NeoTech ZGZ.',
  robots: { index: false, follow: true },
}

export default function ConditionsPage() {
  return (
    <InnerPage eyebrow="Información legal / Contratación" title="Condiciones en revisión." description="NeoTech ZGZ presta servicios a particulares, autónomos y empresas. Las condiciones completas se están preparando para reflejar el funcionamiento real de cada servicio y los derechos aplicables.">
      <div className="legal-grid">
        <section><h2>Antes de contratar</h2><p>El servicio, alcance, entregables, calendario, soporte, precio total, impuestos aplicables y cualquier coste adicional deben facilitarse claramente antes de aceptar un presupuesto o realizar una compra. Los precios publicados son orientativos hasta que se confirme por escrito el precio final aplicable.</p></section>
        <section><h2>Planes mensuales: criterio previsto</h2><p>La propuesta comercial prevista es una renovación mensual automática, sin permanencia y con posibilidad de cancelar antes del siguiente cobro. Estas condiciones deberán incorporarse al flujo contractual y de pago de forma visible, junto con el alcance del plan, fecha de cobro, procedimiento de cancelación y consecuencias de cancelar. Esta página no activa una suscripción ni autoriza un cobro recurrente.</p></section>
        <section><h2>Servicios y desistimiento</h2><p>En contrataciones a distancia con consumidores se facilitará la información precontractual y sobre el derecho de desistimiento, sus plazos y las excepciones legalmente aplicables. Si se solicita comenzar un servicio durante el plazo de desistimiento, se recogerán previamente las solicitudes, el consentimiento expreso y las confirmaciones que exija la ley para el servicio concreto. No se establece una renuncia genérica al desistimiento.</p></section>
        <section><h2>Presupuestos y aceptación</h2><p>Una solicitud de información o presupuesto no supone por sí sola la aceptación de un contrato. Antes de comenzar, el cliente deberá recibir y aceptar el alcance, el precio y las condiciones particulares aplicables. Las condiciones específicas de cada proyecto prevalecerán únicamente en la medida permitida por la ley.</p></section>
        <section><h2>Reclamaciones y derechos</h2><p>Los derechos imperativos de consumidores y usuarios no se limitan mediante esta página. Se completarán los procedimientos de reclamación, desistimiento, cancelación, garantías y resolución de controversias antes de publicar unas condiciones contractuales definitivas.</p></section>
      </div>
      <p className="inner-disclaimer">BORRADOR INFORMATIVO — NO ES UNAS CONDICIONES GENERALES DE CONTRATACIÓN NI DEBE UTILIZARSE COMO DOCUMENTO CONTRACTUAL DEFINITIVO. Pendiente de confirmar el domicilio para notificaciones, el tratamiento fiscal de los precios, las condiciones técnicas de los planes y los flujos de contratación, facturación, cancelación y desistimiento.</p>
      <p><Link className="button button-quiet" href="/legal">Aviso legal</Link> <Link className="button button-quiet" href="/privacidad">Política de privacidad</Link></p>
    </InnerPage>
  )
}
