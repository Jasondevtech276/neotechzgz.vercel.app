# Data Flow Mapping — MCP Connectors (LGPD / GDPR)

## Prioritized Recommendations (P0‑P2)

| Priority | Action |
|---|---|
| **P0** | **Crear política de privacidad y página de consentimiento de cookies** – Define bases legales, información sobre qué datos se recolectan y cómo se usan, y muestra un banner de consentimiento antes de cualquier procesamiento de datos personales. |
| **P1** | **Ejecutar auditoría RLS completa y corregir políticas que falten** – Revisar todas las políticas de Row‑Level Security en Supabase, asegurar que solo los roles autorizados vean/ modifiquen datos personales, y documentar la justificación de cada política. |
| **P1** | **Revisar y fijar webhooks con verificación de firma y evento mínimo** – Implementar HMAC (sha256) verification en los webhooks de Stripe, Resend y Cloudflare Workers, suscribirse solo a los eventos estrictamente necesarios y descartar cualquier payload que no pase la firma. |
| **P2** | **Mapear flujos de datos a conectores MCP y formalizar acuerdos/contratos (BAA)** – Identificar cada conector, el tipo de datos personales que fluyen, su origen, destino, procesamiento y tiempo de retención; y formalizar Business Associate Agreements (o equivalentes) donde proceda. |

---

## Connectors & Data Flow Diagrams

### 1. Supabase (PostgreSQL + RLS + Edge Functions)

| Elemento | Descripción |
|---|---|
| **Datos personales** | Correos electrónicos de usuario, perfiles de cliente, datos de suscripción, logs de actividad |
| **Origen** | Front‑end Next.js (formularios de contacto, login via Supabase Auth) |
| **Destino** | Supabase tables (`profiles`, `subscriptions`, `support_tickets`) |
| **Procesamiento** | RLS policies (audit‑recommended), Edge Functions `aggregate_events`, `generate_nightly_report` |
| **Almacenamiento** | PostgreSQL en Europa (región EU) – encriptado en reposo |
| **Compartición** | Solo con servicios propios (Vercel frontend, Stripe mediante webhooks) |
| **Retención** | Hasta que el usuario elimine su cuenta o se cumpla la política de conservación (máx. 3 años tras la última actividad) |
| **Base legal** | Consentimiento del usuario (banner P0) + ejecución de contrato (prestación de servicios) |
| **BAA / Contrato** | Acuerdo con Supabase (EE.UU.‑UE) – revisar cláusulas de transferencia internacional |
| **Mitigaciones** | • RLS audit (P1) • Anonimización IP en Sentry (ver abajo) • Filtrado de datos sensibles antes de enviar a Sentry |

### 2. Stripe (Payments & Subscriptions)

| Elemento | Descripción |
|---|---|
| **Datos personales** | Nombre, correo, dirección de facturación, últimos 4 dígitos de tarjeta, ID de cliente Stripe |
| **Origen** | Stripe Checkout (modo TEST / LIVE) |
| **Destino** | Tabla `stripe_customers` en Supabase (solo ID de cliente + metadatos mínimos) |
| **Procesamiento** | Webhooks `checkout.session.completed`, `invoice.payment_succeeded` – verificación de firma HMAC |
| **Almacenamiento** | Encriptado en reposo en Stripe; solo se persiste el *customer ID* en Supabase |
| **Compartición** | Con el backend de la aplicación (Node/TS) para actualizar estado de suscripción |
| **Retención** | Según política de retención de pagos (máx. 7 años para fines fiscales) |
| **Base legal** | Ejecución de contrato (compra de servicio) + consentimiento para almacenar datos de pago (obligatorio por normativa financiera) |
| **BAA / Contrato** | Stripe BAA activo (cubre datos de pago) |
| **Mitigaciones** | • Verificación de firma en webhooks (P1) • Modo TEST aislado, sin datos reales hasta aprobar P0/P1 • Rotación de claves y secreto CRON_SECRET |

### 3. Vercel (Hosting & Front‑End)

| Elemento | Descripción |
|---|---|
| **Datos personales** | Direcciones IP, preferencias de modo claro/oscuro, datos de sesión (Supabase JWT) |
| **Origen** | Cliente navegador (Next.js) |
| **Destino** | Edge functions de Vercel (opcional), CDN |
| **Procesamiento** | Middleware `security-headers.js` (HSTS, CSP) – modo TEST/PRODUCTION |
| **Almacenamiento** | CDN cache (sin persistencia de datos personales más allá de cookies de sesión) |
| **Compartición** | Con Supabase para recuperar contenido dinámico |
| **Retención** | Hasta la expiración de la sesión ( típicamente 15 min / 7 días para tokens) |
| **Base legal** | Interés legítimo para prestación del servicio + consentimiento de cookies (P0) |
| **BAA / Contrato** | No se considera un procesador de datos personales (solo hosting) – revisar política de privacidad de Vercel |
| **Mitigaciones** | • Headers de privacidad (P0) • Desactivar almacenamiento de IP en logs de análisis si no es necesario |

### 4. Sentry (Error Monitoring)

| Elemento | Descripción |
|---|---|
| **Datos personales** | Stack traces que pueden incluir correos, URLs, identificadores de usuario |
| **Origen** | Aplicación Next.js (capturas de error no controladas) |
| **Destino** | Dashboard Sentro (cloud) |
| **Procesamiento** | Enrutamiento automático, filtrado de datos sensibles (regex) |
| **Almacenamiento** | Servidores Sentry (EE.UU.) – encriptado en reposo |
| **Compartición** | Solo personal de desarrollo / soporte |
| **Retención** | 30 días por defecto (configurable) |
| **Base legal** | Consentimiento del usuario (banner P0) – anonimizar IP y filtrar datos sensibles |
| **BAA / Contrato** | Sentry ofrece un BAA para planes de pago – verificar cobertura |
| **Mitigaciones** | • Configurar `sendDefaultPii = false` • Anonimizar IP • Filtrar campos que contengan correo o ID de cliente antes de enviar (P2) |

### 5. Resend (Transactional E‑mail)

| Elemento | Descripción |
|---|---|
| **Datos personales** | Correos electrónicos de usuario, contenido del mensaje, posibles datos de perfil incluidos en el cuerpo |
| **Origen** | Aplicación (Node/TS) llama a la API de Resend al enviar welcome, password‑reset, facturas |
| **Destino** | Bandeja de entrada del usuario |
| **Procesamiento** | Enviado a través de API de Resend; opcional inclusion de pie de página con enlace “actualizar preferencias” |
| **Almacenamiento** | Resend conserva registros de envío (log) durante 30 días |
| **Compartición** | Solo el destinatario y el equipo de soporte (al responder) |
| **Retención** | 30 días (logs de envío) |
| **Base legal** | Consentimiento del usuario (relación contractual) + política de privacidad (P0) |
| **BAA / Contrato** | Resend no ofrece BAA estándar para datos de salud – revisar necesidad de cláusulas adicionales |
| **Mitigaciones** | • Footer con enlace de actualización de preferencias (P0) • Minimizar datos en el cuerpo del email • Registrar consentimiento previo antes de enviar correos transaccionales (P2) |

### 6. Cloudflare Workers (API‑Level Processing)

| Elemento | Descripción |
|---|---|
| **Datos personales** | Headers de petición, parámetros de query, cuerpo de JSON en rutas internas |
| **Origen** | Solicitudes entrantes a la API de NeoTechZGZ (proxy / enrutamiento) |
| **Destino** | Forward a Supabase Edge Functions o servicios externos |
| **Procesamiento** | Transformación, enriquecimiento, rate‑limit, headers de seguridad |
| **Almacenamiento** | No se persiste datos (solo en memoria de la ejecución) |
| **Compartición** | Con Supabase y Stripe (solo lo necesario) |
| **Retención** | Nula (stateless) |
| **Base legal** | Interés legítimo para routing y seguridad + cumplimiento de política de cookies (P0) |
| **BAA / Contrato** | Cloudflare no es un procesador de datos personales bajo LGPD/GDPR para este uso – revisar cláusulas de suscripción |
| **Mitigaciones** • Documentar gestión de consentimiento (P2) • Filtrar y eliminar datos personales antes de reenviar (P2) |

### 7. Linear / Airtable (Issue & Client Tracking)

| Elemento | Descripción |
|---|---|
| **Datos personales** | Nombre del cliente, correo, teléfono, descripción de solicitudes o tickets |
| **Origen** | Formularios de contacto, soporte por correo |
| **Destino** | Tickets en Linear / bases en Airtable |
| **Procesamiento** | Etiquetado, asignación a equipos, búsqueda |
| **Almacenamiento** | Servidores de Linear / Airtable (EE.UU.) – encriptado en reposo |
| **Compartición** | Equipos de soporte y clientes (cuando se comparte el ticket) |
| **Retención** | Según plan (hasta 1 año en Airtable free, ilimitado en pago) |
| **Base legal** | Consentimiento del usuario (P0) + interés legítimo para gestión de soporte |
| **BAA / Contrato** | No hay BAA estándar – revisar necesidad de añadir cláusulas de protección de datos |
| **Mitigaciones** • Minimizar datos enviados (solo lo estrictamente necesario) • Anonimizar identificadores cuando sea posible • Formalizar acuerdo de tratamiento de datos (P2) |

---

## Alignment of Actions with Connectors

| Connector | P0 – Política/consentimiento | P1 – RLS / Webhook audit | P2 – Data‑flow mapping & BAA |
|---|---|---|---|
| **Supabase** | Banner de cookies + política de privacidad en el front‑end | Auditoría completa de políticas RLS, corregir permisos excesivos | Mapear flujos de datos personales (auth, profiles, subscriptions) y firmar BAA/contrato de tratamiento |
| **Stripe** | Información sobre almacenamiento de datos de pago en la política de privacidad | Verificación HMAC de todos los webhooks, eventos mínimos suscritos | Documentar flujo de customer‑ID a Supabase, validar BAA de Stripe |
| **Vercel** | Añadir sección de cookies y tratamiento de IP en la política de privacidad | Revisar middleware `security-headers.js` para asegurar headers de privacidad | Mapear dirección IP y datos de sesión, definir periodo de retención y eliminación automática |
| **Sentry** | Configurar anonimización de IP y filtros de PII antes de enviar errores | Revisar políticas de retención (30 días) y confirmar `sendDefaultPii = false` | Mapear qué datos de error contienen información personal, decidir su eliminación o pseudonimización, formalizar BAA con Sentry |
| **Resend** | Footer de “actualizar preferencias” + enlace a política de privacidad | Auditar contenido de emails transaccionales para asegurar que no incluyan datos sensibles innecesarios | Mapear qué campos de usuario se incluyen en cada plantilla de email, firmar acuerdo de tratamiento con Resend |
| **Cloudflare Workers** | Documentar en la política de privacidad el tratamiento de direcciones IP y headers | Revisar rate‑limit y headers de seguridad, asegurar que no se almacene PII | Mapear cada worker que procesa datos personales, aplicar filtrado antes de reenviar, formalizar cláusulas de protección |
| **Linear / Airtable** | Informar al usuario sobre el uso de estas herramientas en la política de privacidad | Auditar permisos de los tickets, asegurar que solo personal autorizado ve datos personales | Mapear qué datos se comparten, minimizar la información, firmar BAA o cláusulas de protección de datos adicionales |

---

## next steps (post‑delivery)

1. **Create / update the privacy‑policy page** (P0) – include sections for each connector above.  
2. **Run the RLS audit** (P1) – script that queries `pg_policies` in Supabase and outputs a diff.  
3. **Implement webhook signature verification** (P1) – add HMAC check in `lib/webhook-handler.ts`.  
4. **Produce the final `mcp/data-flows.md`** (already delivered) and circulate to the legal/DPO review for BAA signatures (P2).  

---
*Generated from the LGPD/GDPR compliance audit of NeoTechZGZ, based on the 12 agency agents tested and the prioritized P0‑P2 recommendations from the updated `neotechzgz-project-context` skill.*