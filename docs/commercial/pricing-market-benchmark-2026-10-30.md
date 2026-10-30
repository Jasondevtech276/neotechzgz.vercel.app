# NEOTECHZGZ — benchmark de precios y reglas de actualización

Fecha de consulta: 2026-10-30  
Ámbito: mercado español, referencia operativa Zaragoza; catálogo Stripe exclusivamente TEST.  
Estado: propuesta comercial provisional; no autoriza ventas ni modifica Stripe Live.

## 1. Catálogo TEST observado

La cuenta Stripe consultada fue `acct_1Rb6nfPOVrgZ5y4y`, con `livemode=false`. Ya existen ocho productos con ocho precios activos y las ocho `lookup_keys` que espera `lib/products.ts`. No se han creado duplicados en esta revisión.

| Servicio | Precio TEST observado | Modalidad | Lookup key |
|---|---:|---|---|
| Soporte remoto | 45 €/hora | Pago único | `neotech_remote_support` |
| Soporte presencial | 60 €/hora | Pago único | `neotech_onsite_support` |
| Desarrollo web | 1.500 € base | Pago único | `neotech_web_development` |
| Consultoría IT | 75 €/hora | Pago único | `neotech_it_consulting` |
| Análisis de sistemas | 85 €/hora | Pago único | `neotech_systems_analysis` |
| STARTER | 149 €/mes | Suscripción mensual | `neotech_plan_starter` |
| PROFESSIONAL | 399 €/mes | Suscripción mensual | `neotech_plan_professional` |
| ENTERPRISE | 899 €/mes | Suscripción mensual | `neotech_plan_enterprise` |

Los ocho precios consultados están activos, en EUR, en modo TEST, con el tipo de recurrencia esperado y sin duplicidad de `lookup_key` observada. Los productos y precios de prueba llevan metadata `environment=preview_test_only`. Los dos productos históricos no pertenecientes al catálogo NeoTech se excluyen del catálogo de aplicación.

## 2. Comparación de mercado (España, 2026)

Referencias públicas consultadas el 30-10-2026:

- Soporte remoto: DOMISYS publica 35 €/h y bonos equivalentes a 30–33 €/h; Retrosistemas publica 25 €/h; islaPC publica 45 €/h. El precio TEST de 45 €/h se sitúa en el extremo alto de esta muestra.
  - https://domisys.es/informatico-por-horas/
  - https://www.retrosistemas.es/tarifas
  - https://islapc.com/tarifas/
- Soporte presencial: Retrosistemas publica 45 € la primera hora y 35 € las siguientes; Infotécnicos indica 40–90 €/h más desplazamiento. Los 60 €/h TEST son plausibles para asistencia especializada, pero el transporte debe presupuestarse aparte.
  - https://www.retrosistemas.es/tarifas
  - https://infotecnicos.es/tarifas
- Desarrollo web: referencias españolas de 2026 sitúan webs corporativas sencillas aproximadamente en 600–2.500 € para freelance y ecommerce básico en rangos superiores según alcance. Los 1.500 € TEST son defendibles únicamente como precio inicial de un paquete con alcance estricto, no como precio universal de ecommerce.
  - https://www.adimenai.com/blog/cuanto-cuesta-pagina-web-espana-2026
  - https://www.n1soluciones.com/es/blog/cuanto-cuesta-pagina-web-espana/
- Consultoría IT: referencias españolas consultadas oscilan aproximadamente entre 45–90 €/h para consultoría informática, con niveles senior y especialización superiores. Los 75 €/h TEST están en el tramo medio-alto.
  - https://seisunos.com/services
  - https://redenet.es/blog/que-es-consultoria-informatica-pymes/
  - https://www.freelancermap.com/blog/es/freelance-espana/
- Análisis de sistemas: una tarifa pública de InfoTelecom Cloud recoge 90 €/h para sistemas/asesoría/analista; la tarifa pública de INECO 2026 recoge referencias de analista en torno a 50 €/h antes de complementos de desplazamiento. Los 85 €/h TEST son una posición especializada alta, justificable sólo con entregables, metodología y seniority definidos.
  - https://infotelecom.cloud/tarifas-vigentes/
  - https://www.ineco.com/ineco/sites/default/files/2026-03/2_Tarifas%20Ineco%202026_Resoluci%C3%B3n_vi.pdf
- Planes mensuales: las referencias generalistas publican planes básicos desde 30 €/mes y planes premium desde 150 €/mes; otros proveedores muestran 8 horas de soporte por 200 €/mes y planes de empresa más amplios desde 590 €/mes. No son comparables sin normalizar horas, equipos, SLA, disponibilidad, monitorización, licencias y visitas.
  - https://www.cronoshare.com/cuanto-cuesta/mantenimiento-informatico-empresas
  - https://www.forgenex.com/soporte-informatico-empresas
  - https://apply.es/tarifas

Las páginas de proveedores son precios anunciados, no una encuesta representativa ni ofertas vinculantes. La incertidumbre del benchmark es media. No se ha verificado que todos los importes incluyan/excluyan IVA en idénticas condiciones.

## 3. Dictamen por producto

- **Soporte remoto — 45 €/h:** mantener como hipótesis TEST. Está en el extremo superior de la muestra; justificar por especialización, informe de intervención, tiempo mínimo y SLA.
- **Soporte presencial — 60 €/h:** mantener como hipótesis TEST. Añadir siempre desplazamiento, aparcamiento, dietas y alojamiento como partidas previamente aceptadas y justificadas; no ocultarlas dentro de un precio fijo nacional.
- **Desarrollo web — 1.500 €:** sólo como “desde”. Definir entregables máximos (plantilla/páginas, idiomas, CMS, SEO, contenidos, formularios, integraciones, ecommerce, revisiones, hosting y mantenimiento). Un ecommerce no debe contratarse automáticamente por ese importe sin valoración.
- **Consultoría IT — 75 €/h:** mantener como hipótesis TEST, con bloques facturables, alcance y entregable definidos.
- **Análisis de sistemas — 85 €/h:** mantener como hipótesis TEST premium. Debe producir inventario, diagramas, riesgos, arquitectura objetivo y hoja de ruta; separar auditoría de seguridad especializada.
- **STARTER — 149 €/mes:** el paquete declara 3 horas/mes y respuesta objetivo en 24 h. Definir si las horas no usadas caducan, horario, severidad, canales, exclusiones y si el tiempo de diagnóstico consume bolsa.
- **PROFESSIONAL — 399 €/mes:** declara 8 horas/mes, visita presencial y respuesta objetivo en 12 h. Definir si la visita está incluida dentro de las 8 horas, radio geográfico, desplazamiento, horas extra, horario y SLA medible.
- **ENTERPRISE — 899 €/mes:** mantener el precio sólo en TEST. El alcance “soporte prioritario y consultoría continua” no define horas, usuarios, sedes, cobertura ni SLA. No habilitar Checkout de este producto hasta definir límites y exclusiones. Preferir “solicitar propuesta” o un contrato con precio personalizado.

## 4. Reglas de repricing seguras

No se recomienda actualizar precios automáticamente en producción a partir de scraping de competidores. Los precios de mercado son incompletos, heterogéneos y no representan el coste de prestación de NeoTechZGZ.

Modelo recomendado:
1. Recopilar fuentes públicas una vez al mes, con URL, fecha, moneda, unidad, IVA conocido/desconocido, alcance y nivel de confianza.
2. Normalizar €/hora, €/mes por usuario/equipo, horas incluidas, desplazamiento y servicios excluidos.
3. Calcular una recomendación combinando benchmark, coste interno, capacidad, gastos de transporte/alojamiento, riesgo, margen y carga fiscal estimada.
4. Crear una nueva versión de Price en Stripe TEST; nunca sobrescribir el historial ni cambiar silenciosamente una suscripción existente.
5. Requerir aprobación humana antes de publicar cualquier precio Live y antes de notificar cambios a clientes.
6. No aplicar aumentos automáticos a suscripciones vigentes. Cualquier cambio contractual requiere análisis de condiciones, preaviso y consentimiento cuando proceda.

Límites iniciales recomendados para propuestas (no para cambios automáticos):
- Revisión mensual; publicación comercial como máximo trimestral.
- Variación recomendada máxima de ±5 % por trimestre y ±10 % acumulado por año respecto al precio aprobado, salvo revisión extraordinaria documentada.
- Fuera de ese rango: bloquear propuesta y exigir aprobación explícita y justificación de costes.
- Nunca reducir el precio por debajo del coste directo + coste de desplazamiento/terceros + margen mínimo aprobado.
- Nunca aumentar un precio ya contratado mediante una actualización silenciosa de Stripe.

## 5. Viajes y costes fuera de Zaragoza

- Zaragoza urbano: definir zona base y si el desplazamiento está incluido.
- Fuera de Zaragoza: cotizar kilómetros/tiempo de viaje, transporte público, peajes, aparcamiento y dietas por separado.
- Fuera de España: cotizar transporte, alojamiento, visados/permisos cuando proceda, seguro, cambio de divisa y días de viaje.
- Obtener aceptación previa del presupuesto total y conservar justificantes; no capturar un importe variable desde el navegador.
- No añadir cargos posteriores sin consentimiento y base contractual.

## 6. Estado de seguridad y publicación

- Los ocho precios son TEST y no están aprobados para venta.
- Checkout sigue cerrado por las tres condiciones de entorno `CHECKOUT_ENABLED`, `STRIPE_AUTOMATIC_TAX_ENABLED` y `STRIPE_ADAPTIVE_PRICING_ENABLED`.
- Stripe Live, webhooks Live y secretos de producción no se modifican.
- No se ha ejecutado una compra alojada ni una entrega real de webhook al runtime Preview.
- El tratamiento de IVA/Stripe Tax permanece pendiente de revisión fiscal y jurídica final.
