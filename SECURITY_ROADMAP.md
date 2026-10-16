# NeoTech ZGZ — registro de incidencias y plan de seguridad

**Última revisión:** 16 de octubre de 2026  
**Alcance:** GitHub, Vercel, Supabase, Stripe y páginas públicas.  
**Criterio:** solo se marcan como corregidos los cambios con evidencia verificable. Un build o una respuesta HTTP 200 no certifican el flujo completo ni la seguridad integral.

## Resumen ejecutivo

- La aplicación ya tiene controles de seguridad en el código, migraciones de base de datos y un workflow de build/auditoría.
- La publicación actual está completada en `neotechzgz.vercel.app`: deployment `dpl_4uUtoszXD29fpoY81dwPrVLtwVrB`, commit `515ff435a5108cb0088941ec81037a31b8ea4cce`, estado `READY`, target `production`. Se verificaron en producción la portada, las páginas de servicios, planes, proyectos, contacto, Sobre NeoTech, las tres páginas de detalle, sitemap, robots y `/api/health` con HTTP 200 y cabeceras de seguridad. El alias `www.neotechzgz.eu.org` sigue con DNS externo `misconfigured` y requiere reparación independiente.
- Supabase Auth tiene activados los controles gratuitos de cambio seguro de contraseña y contraseña actual obligatoria. La protección contra contraseñas filtradas sigue desactivada: el proveedor exige plan Pro y no se intenta eludirlo.
- Vercel marca 12 variables como `readable-secret`; además, hay variables de entorno con prefijo `NEXT_PUBLIC_` cuyos nombres sugieren credenciales de servidor. No se ha confirmado que se hayan expuesto al navegador, pero deben revisarse y sanearse.
- Stripe conserva tres webhooks activos; no se han retirado. Los dos endpoints Vercel usan Basil y el código publicado lee un campo de factura retirado por Basil; el arreglo está en la rama de revisión.
- PR #27, PR #29 y PR #32 están fusionadas. La build de producción y el workflow de seguridad del commit publicado han terminado con éxito; los flujos autenticados de pago, presupuesto y correo siguen sujetos a pruebas controladas.

## Registro de incidencias

| ID | Prioridad | Incidencia | Estado verificado | Acción requerida |
|---|---|---|---|---|
| DEP-01 | Crítica | El dominio de producción no está confirmado en el último commit de seguridad | Corregido para neotechzgz.vercel.app; DNS de www.eu.org pendiente en NT-16 | Deployment dpl_5yjsked6GRLqs9KfgCEo2TznKvqa READY en commit 55d417c; confirmar el alias y monitorizar health. |
| ENV-01 | Crítica | Vercel señala 12 variables con `readable-secret`: `CRON_SECRET`, `EMAILJS_PRIVATE_KEY`, `STRIPE_MCP_KEY`, `STRIPE_SECRET_KEY`, `VERCEL_AI_GATEWAY_KEY`, `REDIS_URL`, `KV_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`, `SUPABASE_SECRET_KEY_2`, `SUPABASE_SECRET_KEY` y `SERVICE_ROLE` | Pendiente | Revisar accesos y clasificación en Vercel. Rotar claves de servidor expuestas o compartidas, una por una, tras confirmar consumidores y plan de reversión. No copiar valores a GitHub ni al chat. |
| ENV-02 | Alta | Existen variables llamadas `NEXT_PUBLIC_POSTGRES_PASSWORD`, `NEXT_PUBLIC_POSTGRES_URL`, `NEXT_PUBLIC_POSTGRES_URL_NON_POOLING`, `NEXT_PUBLIC_POSTGRES_PRISMA_URL`, `NEXT_PUBLIC_POSTGRES_USER`, `NEXT_PUBLIC_POSTGRES_HOST`, `NEXT_PUBLIC_POSTGRES_DATABASE` y `NEXT_PUBLIC_SUPABASE_JWT_SECRET`, además de nombres duplicados `NEXT_PUBLIC_NEXT_PUBLIC_*` | Pendiente de saneamiento | El código consultado no referencia directamente esas variables de Postgres/JWT. Confirmar que son residuos de integración, eliminar o renombrar de forma controlada y rotar cualquier contraseña/secret real que haya podido ser expuesto. No eliminar variables usadas por la app sin probar antes. |
| ENV-03 | Alta | Variables de Supabase duplicadas y con diferentes targets/nombres | Pendiente | Mantener una configuración única y consistente para Production, Preview y Development: URL del proyecto `qkzmpxyefuqdhyxwfjcw` y una publishable/anon key pública vigente. No usar service-role/JWT secret en variables públicas. |
| AUTH-01 | Alta | Protección de contraseñas filtradas desactivada en Supabase Auth; el proveedor rechaza activarla en el plan actual porque requiere Pro. Los controles de cambio seguro y contraseña actual obligatoria sí están activos. | Parcial por límite del plan | Mantener controles gratuitos; habilitar protección filtrada solo si el proyecto pasa a un plan que la incluye. |
| STRIPE-01 | Crítica | Tres webhooks live habilitados: dos destinos a la ruta de Vercel y uno a una Edge Function de Supabase | Pendiente de arquitectura | Revisar en Stripe Dashboard los eventos entregados, errores y reintentos; acordar un procesador autoritativo. No desactivar destinos ni regenerar firmas antes de verificar dependencias. |
| STRIPE-02 | Alta | El webhook marcaba una suscripción cancelada como `refunded`; cancelación y reembolso son estados distintos | Código corregido y desplegado; prueba end-to-end pendiente | `payments.subscription_status` separa el ciclo de vida de la suscripción del estado financiero. Validar eventos duplicados, retrasados y fuera de orden en modo test antes de cerrar. |
| STRIPE-03 | Alta | API `2025-05-28.basil` deja de exponer `invoice.subscription`; el código publicado no encuentra el ID de suscripción en facturas. | Corrección preparada en `fix/stripe-basil-invoice-webhooks`; pruebas y CI pendientes | Leer `parent.subscription_details.subscription`, conservar compatibilidad legacy y validar en CI antes del despliegue. |
| DB-01 | Baja / revisión periódica | Función public.handle_new_user usa SECURITY DEFINER; la inspección confirma SET search_path TO '' y referencia public.profiles de forma cualificada | Control seguro observado; privilegios/trigger pendientes de revisión completa | Mantener el search_path vacío y verificar que solo roles previstos pueden ejecutar la función y que el trigger está asociado a la tabla correcta. No cambiarlo a ciegas. |
| DB-02 | Media | RLS activo en las cinco tablas públicas revisadas; no hay buckets ni políticas de Storage. | Revisado parcialmente | Confirmar si Storage se utiliza. Mantener denegación por defecto si no hay uso; si hay uso, definir políticas mínimas por bucket/propietario y probar acceso anónimo y entre usuarios. |
| DB-03 | Media | El asesor de rendimiento señala 7 índices no utilizados | Informativo | No borrar automáticamente: varios pueden ser nuevos o proteger operaciones futuras. Revisar métricas de uso tras un periodo suficiente y conservar índices de seguridad/retención salvo evidencia. |
| DB-04 | Media | Revisión parcial de metadatos: RLS habilitado en las cinco tablas públicas; Storage sin buckets ni políticas; dos funciones SECURITY DEFINER revisadas no ejecutables por `public`, `anon` o `authenticated`. | Parcial | Revisar triggers, restauración de backups y flujos autenticados; no hay cambios DDL pendientes de esta auditoría. |
| OPS-01 | Alta | `main` carecía de reglas de protección | Corregido y verificado | Regla activa: PR obligatorio, conversaciones resueltas, check `build` estricto, aplicación a administradores, sin force-push ni borrado. |
| OPS-02 | Alta | Falta verificar MFA de administradores, backups y recuperación | Pendiente | Verificar MFA en cuentas privilegiadas y documentar/probar restauración de backups. |
| APP-01 | Alta | Flujos completos de checkout, portal, webhooks, cancelación y persistencia no están verificados end-to-end | Pendiente | Ejecutar eventos y pagos sintéticos solo en Stripe test mode cuando haya un contexto de prueba; no tocar pagos ni clientes reales. |
| APP-02 | Media | CSP no está aplicada en modo enforcement | Pendiente de análisis | Definir una CSP compatible con Stripe, fuentes y analítica; probar primero en Report-Only y pasar a enforcement tras resolver violaciones. |
| APP-03 | Media | Página 404 usaba una paleta distinta del sistema visual principal | Corregido y desplegado | Mantener revisión visual y de teclado en móvil/escritorio. |
| WEB-01 | Media | Faltaban páginas de detalle para servicios clave y navegación transversal completa | Corregido y desplegado; revisión visual manual pendiente | Las rutas /servicios, /planes, /proyectos, /contacto, /sobre-neotech, /desarrollo-web, /ciberseguridad, /mantenimiento, portada, sitemap.xml, robots.txt y /api/health devuelven HTTP 200. |

## Cambios preparados en la rama de revisión

- Rama `fix/stripe-basil-invoice-webhooks`: extrae el ID de suscripción del formato Basil (`invoice.parent.subscription_details.subscription`) y mantiene compatibilidad con eventos antiguos.
- Añade pruebas con `node:test` para los formatos anidados, legacy, expandidos y no aplicables; CI ejecutará `npm test` antes del build. Aún no está desplegado: falta CI verde y merge.

## Correcciones verificadas previamente

- PR #18 endureció la actualización de perfiles: el usuario autenticado solo puede actualizar `display_name` desde la API y la base de datos.
- Migración `20261013132826_restrict_profile_updates` aplicada en Supabase; la inspección de privilegios confirmó que `authenticated` solo puede actualizar `display_name`.
- Eliminación de cuenta con borrado lógico, exclusión de administradores, límite de solicitudes y purga explícita posterior a 60 días, con controles de Stripe y autorización de cron.
- Rutas administrativas con comprobación de perfil y rol `is_admin=true`.
- Validación y limitación de solicitudes de soporte/contacto; respuestas de error de Stripe más seguras y persistencia fallida con respuesta reintentable.
- Headers de seguridad presentes en `next.config.mjs`: HSTS, nosniff, frame denial, Referrer-Policy y Permissions-Policy.
- CI: el workflow de seguridad del commit publicado (run 38638486638) pasó `npm ci`, `npm audit --audit-level=high` y `npm run build`. El deployment de producción dpl_4uUtoszXD29fpoY81dwPrVLtwVrB está READY; se comprobaron las rutas públicas con HTTP 200 y las cabeceras de seguridad.
- Asesor de Supabase: sin avisos de seguridad adicionales al aviso de protección de contraseñas filtradas.
- Health endpoint y homepage devolvieron HTTP 200 en comprobaciones previas; esto no sustituye pruebas autenticadas ni pruebas de pagos.

## Cambios de producto desplegados en PR #27, PR #29 y PR #32

- `/servicios`: catálogo de servicios con precios orientativos y CTA.
- `/planes`: planes de soporte y notas de alcance.
- `/proyectos`: portfolio con enlaces a los proyectos ya declarados en la página principal.
- `/contacto`: canales de contacto y recordatorio de no enviar datos sensibles.
- `/sobre-neotech`: enfoque, valores y alcance de servicio.
- `/desarrollo-web`, `/ciberseguridad` y `/mantenimiento`: páginas de detalle con metadatos SEO, enlaces desde el catálogo y contenido alineado con la plantilla actual.
- `payments.subscription_status` y el estado de pago están separados; la migración `20261014210501_fix_payment_retention_and_subscription_state` está aplicada y verificada en producción.
- Navegación compartida, página 404, sitemap y metadatos SEO actualizados.
- Cálculo de presupuesto separado entre servicios por hora, precio inicial web y planes mensuales; requiere pruebas funcionales.

PR #27: https://github.com/Jasondevtech276/neotechzgz.vercel.app/pull/27
PR #29: https://github.com/Jasondevtech276/neotechzgz.vercel.app/pull/29

## Acciones que requieren acceso/autorización del titular

1. Dar al operador de publicación el acceso correcto al equipo/proyecto Vercel, o promover el despliegue desde el Dashboard.
2. Activar la protección contra contraseñas filtradas en Supabase Auth.
3. Revisar, renombrar/eliminar variables residuales y rotar los secretos señalados desde el Dashboard de Vercel, con pruebas tras cada cambio.
4. Revisar el historial de eventos de los tres webhooks Stripe y decidir cuál debe ser autoritativo antes de retirar duplicados.
5. Configurar la protección de `main` y MFA para administradores.
6. Autorizar pruebas de pagos en modo test y pruebas de eliminación/retención con usuarios sintéticos.

## Criterio de cierre

Una incidencia solo pasa a «corregida» cuando existe evidencia reproducible (CI verde, configuración confirmada, prueba funcional o revisión del proveedor). No se promete invulnerabilidad ni se declara una publicación exitosa hasta comprobar el dominio de producción y su commit activo.
