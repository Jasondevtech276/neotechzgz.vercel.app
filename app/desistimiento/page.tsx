import Link from 'next/link'

export const metadata = {
  title: 'Desistimiento y solicitud de inicio anticipado | NeoTech ZGZ',
  description: 'Información sobre el desistimiento y el inicio de servicios durante su plazo legal.',
  robots: { index: false, follow: false },
}

export default function WithdrawalPage() {
  return (
    <main className="legal-shell public-legal">
      <a href="/" className="account-brand"><span className="brand-mark">N</span><span>NeoTech <em>ZGZ</em></span></a>
      <p className="eyebrow">CONSUMIDORES / DESISTIMIENTO</p>
      <h1>Desistimiento y comienzo del servicio</h1>
      <p className="legal-lede">Versión de trabajo 25 de octubre de 2026. La contratación está temporalmente pausada mientras se completan las comprobaciones fiscales y técnicas.</p>
      <div className="legal-grid">
        <section>
          <h2>1. Plazo general</h2>
          <p>Cuando la normativa de consumidores aplicable reconoce el derecho de desistimiento en un contrato a distancia, el plazo general en España y la UE es de 14 días naturales, con reglas distintas según se trate de servicios, bienes o contenido digital y con excepciones previstas legalmente. El cómputo comienza en la fecha que establezca la normativa para el tipo de contrato concreto.</p>
        </section>
        <section>
          <h2>2. Cómo comunicarlo</h2>
          <p>Para comunicar el desistimiento, escribe al correo de contacto indicado en el <Link href="/legal">aviso legal</Link>, identifica el pedido y expresa de forma inequívoca que deseas desistir. No es necesario utilizar una frase concreta. Se facilitará un formulario normalizado y una dirección de contacto operativa antes de activar la contratación.</p>
        </section>
        <section>
          <h2>3. Solicitud de inicio anticipado</h2>
          <p>La casilla de inicio anticipado es independiente de la aceptación de las condiciones. Si un consumidor solicita que el servicio empiece durante el plazo de desistimiento, se conservará la versión del texto, fecha y hora, producto y pedido asociados al consentimiento. En servicios, cualquier pago proporcional por la parte ya ejecutada o pérdida del derecho tras ejecución completa solo se aplicará si se han cumplido todos los requisitos legales de información y consentimiento. No se presume una renuncia general.</p>
        </section>
        <section>
          <h2>4. Contenido digital</h2>
          <p>Si en el futuro se ofrecen contenidos digitales no suministrados en soporte material, se recogerá el consentimiento expreso específico y el reconocimiento que exija la normativa antes de iniciar el suministro. No se utilizará una casilla genérica de aceptación de condiciones para sustituir ese requisito.</p>
        </section>
        <section>
          <h2>5. Reembolso</h2>
          <p>Cuando proceda el reembolso, se tramitará sin demora indebida y dentro del plazo legal aplicable, utilizando el mismo medio de pago salvo acuerdo válido en contrario. El importe que corresponda dependerá del tipo de contrato, de la ejecución ya realizada y de las reglas imperativas aplicables.</p>
        </section>
        <section>
          <h2>6. Clientes fuera de España y de la UE</h2>
          <p>Para consumidores de terceros países se revisará la normativa imperativa local y la disponibilidad de mecanismos de reclamación. No se afirmará que el plazo español de 14 días sea universal en todos los países. La información específica de cada mercado se publicará antes de habilitar ventas en ese territorio.</p>
        </section>
      </div>
      <div className="inner-disclaimer">BORRADOR: el formulario normalizado, los datos legales completos del prestador y las condiciones específicas por producto deben aprobarse antes de habilitar pagos.</div>
      <p><Link href="/condiciones" className="button button-primary">Consultar condiciones de contratación</Link></p>
    </main>
  )
}
