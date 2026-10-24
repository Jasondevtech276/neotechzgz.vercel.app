import Link from 'next/link'

export const metadata = {
  title: 'Condiciones de contratación | NeoTech ZGZ',
  description: 'Condiciones generales propuestas para servicios tecnológicos de NeoTech ZGZ.',
  robots: { index: false, follow: false },
}

export default function ConditionsPage() {
  return (
    <main className="legal-shell public-legal">
      <a href="/" className="account-brand"><span className="brand-mark">N</span><span>NeoTech <em>ZGZ</em></span></a>
      <p className="eyebrow">CONTRATACIÓN / BORRADOR DE REVISIÓN</p>
      <h1>Condiciones generales de contratación</h1>
      <p className="legal-lede">Versión de trabajo 25 de octubre de 2026. Las nuevas compras están pausadas. Estas condiciones no deben considerarse definitivas hasta que se complete la revisión legal, fiscal y de los datos del prestador.</p>
      <div className="legal-grid">
        <section>
          <h2>1. Prestador y ámbito</h2>
          <p>NeoTech ZGZ es el nombre comercial bajo el que el titular presta servicios tecnológicos. La ubicación orientativa es Zaragoza, Aragón, España 50001. El nombre del titular y el correo de contacto se muestran en el <Link href="/legal">aviso legal</Link>. Antes de activar la contratación se facilitarán los datos de establecimiento y contacto que exija la normativa aplicable.</p>
        </section>
        <section>
          <h2>2. Servicios y alcance</h2>
          <p>Los servicios previstos incluyen soporte informático remoto o presencial, consultoría IT, análisis de sistemas, desarrollo web y planes recurrentes de soporte. El alcance concreto, entregables, horas incluidas, calendario, dependencias del cliente, criterios de aceptación y exclusiones deberán constar en la ficha del producto o en un presupuesto aceptado antes de contratar. Los tiempos de respuesta son objetivos y no equivalen a una garantía de resolución salvo pacto escrito expreso.</p>
        </section>
        <section>
          <h2>3. Precio, moneda e impuestos</h2>
          <p>Antes de reabrir las compras, cada producto deberá tener precio, moneda, periodicidad, tratamiento fiscal y código tributario revisados. El checkout mostrará el desglose aplicable según la ubicación del cliente, su condición B2B/B2C, el tipo de servicio y las reglas de localización. La conversión a moneda local solo se ofrecerá cuando esté habilitada y probada en Stripe. No se aplicará un porcentaje mundial único ni se presumirá que Stripe Tax registra al prestador ante una administración tributaria.</p>
          <p>En España, el tipo general de IVA es el 21 % cuando resulte aplicable, pero pueden existir reglas de localización, exenciones, inversión del sujeto pasivo y territorios con impuestos indirectos distintos. Las operaciones intracomunitarias B2B se tratarán como tales únicamente tras validar el NIF-IVA y cumplir los requisitos. El cliente recibirá el desglose fiscal que corresponda a su operación.</p>
        </section>
        <section>
          <h2>4. Pedido, pago y factura</h2>
          <p>El pedido solo quedará confirmado tras la validación del proveedor de pagos y el registro del evento de pago en el sistema de pedidos. La creación de una sesión de pago no equivale a un pago realizado. Se emitirá factura o justificante según corresponda y se conservará un historial de facturas por operación. No se solicitarán datos de tarjeta directamente en esta web; el pago se procesa en Stripe.</p>
        </section>
        <section>
          <h2>5. Planes, renovación y cancelación</h2>
          <p>Los planes mensuales recurrentes indicarán antes del pago el importe, impuestos, periodicidad, fecha de renovación, prestaciones incluidas, límites de uso y procedimiento de cancelación. La cancelación impedirá renovaciones futuras, pero no elimina importes ya devengados ni derechos imperativos del consumidor. No se aplicarán renovaciones ni penalizaciones no mostradas de forma clara antes de contratar.</p>
        </section>
        <section>
          <h2>6. Inicio del servicio y desistimiento</h2>
          <p>Cuando sea aplicable la normativa de consumidores de la UE, el plazo general de desistimiento para contratos a distancia es de 14 días naturales, sujeto a excepciones legales. El cliente podrá solicitar por separado el inicio del servicio durante ese plazo. La solicitud no constituye una renuncia general al desistimiento: cualquier pérdida del derecho o importe proporcional por servicios ya ejecutados dependerá de los requisitos y de la información exigidos por la ley. Consulta el <Link href="/desistimiento">procedimiento de desistimiento</Link>.</p>
        </section>
        <section>
          <h2>7. Obligaciones del cliente</h2>
          <p>El cliente facilitará información exacta, accesos autorizados, copias de seguridad cuando proceda y una persona de contacto. Solo facilitará credenciales por canales acordados y seguros. No se prestarán servicios que requieran acceso no autorizado, vulneración de sistemas o tratamiento de datos sin base jurídica. Las actuaciones sobre sistemas de terceros requieren autorización del titular.</p>
        </section>
        <section>
          <h2>8. Propiedad intelectual y entregables</h2>
          <p>La oferta o presupuesto especificará la titularidad o licencia de código, diseños, documentación y otros entregables, así como las licencias de terceros. Salvo acuerdo expreso, no se entenderá cedida la propiedad intelectual de herramientas preexistentes, componentes reutilizables ni software de terceros.</p>
        </section>
        <section>
          <h2>9. Incidencias, garantías y responsabilidad</h2>
          <p>Las incidencias se comunicarán al correo de contacto. Se aplicarán las garantías y derechos imperativos correspondientes al tipo de contrato y al cliente. Ninguna cláusula excluye derechos irrenunciables del consumidor ni limita responsabilidades que legalmente no puedan excluirse. Los límites de responsabilidad específicos deberán acordarse por escrito según el servicio y la legislación aplicable.</p>
        </section>
        <section>
          <h2>10. Clientes internacionales</h2>
          <p>Para clientes de otros Estados de la UE o de terceros países se determinarán por separado la ley imperativa de consumo, localización del servicio, impuestos indirectos, moneda, sanciones aplicables, privacidad y condiciones de facturación. Una elección de ley española no elimina la protección imperativa que corresponda al consumidor en su país. No se habilitarán jurisdicciones fiscales hasta revisar los requisitos de registro y cobro.</p>
        </section>
        <section>
          <h2>11. Privacidad, reclamaciones y cambios</h2>
          <p>El tratamiento de datos se describe en el <Link href="/legal#privacidad">aviso de privacidad</Link>. Las reclamaciones pueden enviarse al correo indicado en el aviso legal. Las modificaciones de estas condiciones se fecharán y no se aplicarán retroactivamente en perjuicio de derechos adquiridos.</p>
        </section>
      </div>
      <div className="inner-disclaimer">BORRADOR: antes de aceptar pagos deben completarse la identificación legal del prestador, la situación fiscal, los precios con impuestos, los términos específicos de cada servicio, las reglas de renovación y cancelación, el formulario de desistimiento y la revisión jurídica de ventas internacionales.</div>
      <p><Link href="/legal" className="button button-primary">Volver al aviso legal</Link></p>
    </main>
  )
}
