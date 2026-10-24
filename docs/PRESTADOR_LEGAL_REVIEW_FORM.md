# Formulario interno de revisión del prestador — NeoTech ZGZ
**Versión:** 2026-10-25  
**Uso:** interno; no se publica ni sustituye a los modelos oficiales de AEAT/TGSS.

No se necesitan enviar documentos de identidad ni claves por el chat. Cuando llegue el cierre fiscal, adjunta los certificados por un canal seguro y facilita solo los datos necesarios.

## Identidad pública y contacto
- Nombre y apellidos del titular: [confirmar]
- Nombre comercial: NeoTech ZGZ
- Email de contacto y privacidad: [confirmar que sigue siendo el correcto]
- Ubicación orientativa pública: Zaragoza, Aragón, España 50001
- Dirección legal completa para requerimientos y contratación: [pendiente; no publicar domicilio particular por defecto]
- Teléfono de contacto efectivo, si se publicará: [pendiente]
- Canal y dirección para reclamaciones: [pendiente]

## Forma de ejercicio y situación fiscal (bloqueado hasta el cierre)
- Forma jurídica: persona física/autónomo u otra [confirmar]
- Fecha efectiva de inicio de actividad: [pendiente]
- Epígrafe IAE / actividad declarada: [pendiente de gestoría]
- Alta censal y régimen IVA/IRPF: [pendiente; no activar cobros]
- Número de identificación fiscal y certificado: [entregar solo cuando corresponda, no insertar en repositorio]
- Alta RETA u otro régimen aplicable: [pendiente]
- IBAN de cobro y titularidad verificada en Stripe: [validar dentro de Stripe; no pegar en el repositorio]

## Catálogo y condiciones por SKU
Para cada producto/servicio confirmar:
- Naturaleza: soporte humano, consultoría, desarrollo web, servicio digital automatizado, contenido digital, licencia o bien físico.
- Unidad de precio y alcance; horas, entregables, exclusiones y dependencias del cliente.
- Precio anunciado al consumidor con impuestos incluidos, o tratamiento B2B aplicable.
- Código fiscal de Stripe, tax behavior (inclusive/exclusive), moneda y periodicidad.
- Fecha de inicio, plazo de ejecución, renovación, cancelación y reembolso.
- Si puede comenzar dentro de los 14 días: consentimiento expreso separado y registro auditable; sin consentimiento, retrasar el inicio cuando sea necesario para respetar el derecho de desistimiento.
- Garantía/soporte, propiedad intelectual y licencias de terceros.
- Retención IRPF en facturas B2B españolas, si procede según actividad y cliente.

## Mercados a habilitar
- España peninsular/Baleares: [primero, una vez regularizado]
- Canarias/Ceuta/Melilla: [no habilitar hasta configurar IGIC/IPSI y reglas territoriales]
- UE B2B: validar NIF-IVA/VIES, reglas de localización, inversión del sujeto pasivo y obligaciones informativas.
- UE B2C: clasificar si cada SKU es servicio general o servicio electrónico; determinar umbral OSS y registro cuando proceda.
- Reino Unido / Estados Unidos / Canadá / otros: habilitar uno por uno, solo tras revisión de VAT/GST/sales tax, umbrales, consumo, privacidad y registros.

## Proveedores y seguridad
- Stripe: cuenta correcta, modo test y live, precios existentes, Tax registrations, tax codes, Adaptive Pricing, facturas y reembolsos.
- Supabase: proyecto canónico, tabla de pagos y factura, retención, permisos RLS, webhook service role.
- Email/analítica/publicidad: contratos de encargado, transferencias, consentimiento, DPA y configuración de cookies.
- HubSpot: reautorización, base jurídica de marketing, consentimiento y baja.
- Search Console, Business Profile y Bing: verificación de titularidad y permisos mínimos.

## Aprobaciones previas a reabrir Checkout
- [ ] Confirmación de identidad/domicilio legal por el titular.
- [ ] Situación censal y fiscal completada por el titular/gestor.
- [ ] Precios y facturas revisados por asesor fiscal.
- [ ] Condiciones finales y formulario de desistimiento revisados.
- [ ] Registro fiscal y Stripe Tax configurados solo para jurisdicciones aplicables.
- [ ] Pruebas de test: B2C España, B2B España, B2B intracomunitario, B2C UE, internacional seleccionado.
- [ ] Webhooks: firma por endpoint, deduplicación, reintentos, orden de facturas, cancelaciones y reembolsos.
- [ ] Revisión de navegador: consentimiento de cookies y solicitudes de red antes/después de aceptar/rechazar.
- [ ] CI protegido y despliegue de producción verificado.
- [ ] Aprobación expresa para reabrir ventas.
