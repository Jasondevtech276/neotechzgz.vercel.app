# Revisión de residencia de datos y preparación normativa

**Fecha de revisión:** 27 de noviembre de 2026  
**Ámbito:** NeoTech ZGZ, actividad desde España, clientes potenciales en UE y mercados internacionales.  
**Naturaleza:** revisión técnica de preparación; no constituye dictamen jurídico ni certificación.

## 1. Ubicación y transferencias de datos

### Supabase

- Proyecto canónico: región `eu-west-2` (London, Reino Unido).
- Proyecto aislado: `eu-central-1` (Frankfurt, UE).
- Londres no es territorio de la UE, aunque el Reino Unido dispone de una decisión de adecuación de la Comisión Europea para transferencias cubiertas por el RGPD. La Comisión renovó las decisiones de adecuación del Reino Unido el 19-12-2025.
- La base jurídica de transferencia y la exigencia de residencia física en la UE son cuestiones distintas.
- Supabase indica que la región elegida determina la ubicación principal de Postgres, Auth, Storage y backups, pero la selección regional no demuestra por sí sola el cumplimiento regulatorio. La región de un proyecto no se puede cambiar in situ: un traslado a Frankfurt, Irlanda o París requiere un proyecto nuevo y migración controlada.

**Decisión pendiente:** mantener Londres bajo la base de transferencia aplicable o planificar una migración a una región UE si un contrato, política corporativa o requisito sectorial exige residencia estricta en la UE. No migrar sin plan de backup, restauración, corte y rollback.

### Cloudflare R2

- El bucket actual `neotechzgz-db-backups` está en WEUR, Standard, jurisdicción `default`, y no contiene objetos.
- WEUR es una ubicación; no equivale a una garantía de residencia exclusiva en la UE.
- Cloudflare documenta que las restricciones jurisdiccionales garantizan almacenamiento y procesamiento de objetos dentro de la jurisdicción seleccionada. La jurisdicción no se puede cambiar después de crear el bucket.
- Si se requiere garantía UE, crear un bucket nuevo con jurisdicción `eu` y migrar el flujo de backup antes de subir datos personales. No borrar el bucket actual hasta completar una restauración verificada.

### Vercel y proveedores externos

La región de funciones Vercel observada es Frankfurt. Esto no demuestra que todos los datos de todos los proveedores, telemetría, soporte, logs, subprocesadores o transferencias permanezcan en esa región.

Antes de ofrecer servicios a clientes internacionales, mantener un inventario de proveedor y entidad contractual, rol, categorías de datos, finalidad, región de almacenamiento y soporte, subencargados, DPA, mecanismo de transferencia, retención, borrado y procedimiento de ejercicio de derechos.

Para transferencias fuera del EEE sin decisión de adecuación aplicable, evaluar las garantías del capítulo V del RGPD, incluidas las Cláusulas Contractuales Tipo y, cuando proceda, la evaluación de impacto de transferencia.

## 2. Cookies y analítica

La implementación revisada presenta:
- botones de aceptar y rechazar opcionales visibles en la misma capa;
- configuración granular para analítica y marketing;
- persistencia local de la elección durante 180 días;
- carga de Google Analytics, PostHog y Meta Pixel solo después de la categoría de consentimiento correspondiente;
- retirada de consentimiento con recarga y limpieza de cookies conocidas.

La AEPD exige que aceptar y rechazar se ofrezcan al mismo tiempo, nivel y visibilidad, y que exista una vía para configurar finalidades. La duración actual de 180 días está por debajo de los 24 meses que la guía de la AEPD contempla como buena práctica máxima.

**Pendiente:** prueba real en navegador de ausencia de cookies/scripts antes del consentimiento, rechazo, granularidad, retirada, teclado y lector de pantalla. La revisión de código no demuestra el comportamiento de todas las dependencias externas.

## 3. Pagos y PCI DSS

La aplicación usa Stripe Checkout y mantiene `CHECKOUT_ENABLED=false` en producción. La intención técnica es delegar el tratamiento de datos de tarjeta al proveedor de pago, sin almacenar PAN/CVC en NeoTech ZGZ.

Una redirección a una página de pago alojada por el proveedor puede reducir el alcance PCI DSS y puede ser compatible con SAQ A si se cumplen todos los criterios de elegibilidad. No debe declararse SAQ A automáticamente: el comerciante mantiene obligaciones sobre su web, scripts, redirecciones, seguridad y, cuando corresponda, escaneos ASV.

**Condición:** no activar pagos live hasta completar pruebas TEST, revisión de webhook/idempotencia, controles de scripts/CSP, contrato/DPA con Stripe y confirmación del cuestionario PCI aplicable.

## 4. Sistemas de IA

Si el asistente o agente remoto se ofrece a clientes:
- clasificar el sistema y su finalidad conforme al Reglamento (UE) 2024/1689;
- identificar si NeoTech ZGZ actúa como proveedor, responsable del despliegue o integrador;
- preparar transparencia sobre interacción con IA cuando corresponda;
- documentar supervisión humana, límites, registro de incidentes y tratamiento de datos;
- no introducir datos personales de clientes en proveedores/modelos sin base jurídica, DPA, configuración de retención y evaluación de transferencias.

El Reglamento de IA se aplica con carácter general desde el 02-08-2026, con calendarios diferidos para determinadas obligaciones de sistemas de alto riesgo (entre otras fechas, 02-12-2027 para ciertos sistemas del Anexo III y 02-08-2028 para los vinculados a productos del Anexo I). La clasificación concreta del agente debe hacerse por uso real, no solo por el nombre del modelo.

## 5. Documentación contractual y operativa pendiente

Antes de comercializar internacionalmente:
1. Registro de actividades de tratamiento y mapa de datos.
2. Aviso de privacidad, política de cookies y mecanismo de retirada.
3. DPA con clientes empresariales cuando NeoTech ZGZ actúe como encargado.
4. DPAs y revisión de subencargados de Supabase, Vercel, Cloudflare, Stripe, EmailJS y proveedores de IA.
5. Base de transferencia y SCC cuando proceda.
6. Retención por categoría de dato, borrado, backups y excepciones legales.
7. Procedimiento de derechos RGPD y gestión de brechas.
8. Términos B2B/B2C, SLA, límites de soporte, garantías, responsabilidad y jurisdicción.
9. Facturación, IVA, obligaciones fiscales y normativa española aplicable.
10. Evaluación de aplicabilidad de NIS2 u otras normas sectoriales según tamaño, actividad y clientes; no asumir inclusión ni exclusión sin comprobar criterios.

La situación fiscal y los contratos comerciales definitivos siguen siendo la fase final prevista del proyecto. Este documento no los sustituye.

## Fuentes oficiales

- Comisión Europea — decisiones de adecuación: https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en
- Comisión Europea — Cláusulas Contractuales Tipo: https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/standard-contractual-clauses-scc_en
- Supabase — regiones y residencia: https://supabase.com/docs/guides/platform/regions
- Supabase — FAQ de residencia y transferencias: https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq
- Cloudflare — R2 Data Location y jurisdicciones: https://developers.cloudflare.com/r2/reference/data-location/
- AEPD — Guía de cookies: https://www.aepd.es/guias/guia-cookies.pdf
- PCI Security Standards Council — SAQ A y scripts: https://www.pcisecuritystandards.org/faqs/1588/
- PCI Security Standards Council — ASV en SAQ A: https://www.pcisecuritystandards.org/faqs/1604/
- EUR-Lex — Reglamento (UE) 2024/1689, versión consolidada: https://eur-lex.europa.eu/eli/reg/2024/1689/2026-07-27/eng

**Criterio:** la conformidad legal depende de contratos, procesos y uso real de datos, no únicamente de la región de alojamiento o de pasar pruebas técnicas.