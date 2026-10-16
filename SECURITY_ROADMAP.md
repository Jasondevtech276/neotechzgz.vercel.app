# NeoTech ZGZ — registro de incidencias y plan de seguridad

**Última revisión:** 16 de octubre de 2026  
**Alcance:** GitHub, Vercel, Supabase, Stripe y páginas públicas.  
**Criterio:** solo se marcan como corregidos los cambios con evidencia verificable. Un build o una respuesta HTTP 200 no certifican el flujo completo ni la seguridad integral.

## Resumen ejecutivo

- La aplicación ya tiene controles de seguridad en el código, migraciones de base de datos y un workflow de build/auditoría.
- El alias público `neotechzgz.vercel.app` sigue en el deployment anterior `dpl_4uUtoszXD29fpoY81dwPrVLtwVrB` (commit `515ff435a5108cb0088941ec81037a31b8ea4cce`). El commit `26b99a2cfb0bf833db676b03c510e6bc1871dafd` tiene un deployment target `production` READY (`dpl_9ByGJNMo2RjDtoFmmuWpTJks2ZZQ`), pero Vercel rechazó asignarle el alias público; ese alias aún no sirve el arreglo Stripe. `www.neotechzgz.eu.org` sigue pendiente por la delegación externa de EU.org.
- Supabase Auth tiene activados los controles gratuitos de cambio seguro de contraseña y contraseña actual obligatoria. La protección contra contraseñas filtradas sigue desactivada: el proveedor exige plan Pro y no se intenta eludirlo.
- Vercel marca 12 variables como `readable-secret`; además, hay variables de entorno con prefijo `NEXT_PUBLIC_` cuyos nombres sugieren credenciales de servidor. No se ha confirmado que se hayan expuesto al navegador, pero deben revisarse y sanearse.
- Stripe conserva tres webhooks live; no se han retirado. El arreglo para la forma Basil de facturas está fusionado en `main`, pero falta asignar el alias público al deployment READY, así que el dominio público continúa sirviendo el handler anterior.
- PR #27, PR #29 y PR #32 están fusionadas. La build de producción y el workflow de seguridad del commit publicado han terminado con éxito; los flujos autenticados de pago, presupuesto y correo siguen sujetos a pruebas controladas.

## Registro de incidencias

| ID | Prioridad | Incidencia | Estado verificado | Acción requerida |
|---|---|---|---|---|
| DEP-01 | Crítica | El alias de producción no está en el último commit con la corrección Stripe | **Pendiente de asignar el alias** | El deployment `dpl_9ByGJNMo2RjDtoFmmuWpTJks2ZZQ` está READY, pero el intento de asignar `neotechzgz.vercel.app` fue rechazado por la revisión de aprobación. El alias sigue en `dpl_4uUtoszXD29fpoY81dwPrVLtwVrB`; verificar HTTP, health y rutas tras la asignación.
| ENV-01 | Crítica | Vercel señala 12 variables con `readable-secret`: `CRON_SECRET`, `EMAILJS_PRIVATE_KEY`, `STRIPE_MCP_KEY`, `STRIPE_SECRET_KEY`, `VERCEL_AI_GATEWAY_KEY`, `REDIS_URL`, `KV_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`, `SUPABASE_SECRET_KEY_2`, `SUPABASE_SECRET_KEY` y `SERVICE_ROLE` | Pendiente | Revisar accesos y clasificación en Vercel. Rotar claves de servidor expuestas o compartidas, una por una, tras confirmar consumidores y plan de reversión. No copiar valores a GitHub ni al chat. |
| ENV-02 | Alta | Existen variables llamadas `NEXT_PUBLIC_POSTGRES_PASSWORD`, `NEXT_PUBLIC_POSTGRES_URL`, `NEXT_PUBLIC_POSTGRES_URL_NON_POOLING`, `NEXT_PUBLIC_POSTGRES_PRISMA_URL`, `NEXT_PUBLIC_POSTGRES_USER`, `NEXT_PUBLIC_POSTGRES_HOST`, `NEXT_PUBLIC_POSTGRES_DATABASE` y `NEXT_PUBLIC_SUPABASE_JWT_SECRET`, además de nombres duplicados `NEXT_PUBLIC_NEXT_PUBLIC_*` | Pendiente de saneamiento | El código consultado no referencia directamente esas variables de Postgres/JWT. Confirmar que son residuos de integración, eliminar o renombrar de forma controlada y rotar cualquier contraseña/secret real que haya podido ser expuesto. No eliminar variables usadas por la app sin probar antes. |
| ENV-03 | Alta | Variables de Supabase duplicadas y con diferentes targets/nombres | Pendiente | Mantener una configuración única y consistente para Production, Preview y Development: URL del proyecto `qkzmpxyefuqdhyxwfjcw` y una publishable/anon key pública vigente. No usar service-role/JWT secret en variables públicas. |
| AUTH-01 | Alta | Protección de contraseñas filtradas desactivada en Supabase Auth; el proveedor rechaza activarla en el plan actual porque requiere Pro. Los controles de cambio seguro y contraseña actual obligatoria sí están activos. | Parcial por límite del plan | Mantener controles gratuitos; habilitar protección filtrada solo si el proyecto pasa a un plan que la incluye. |
| STRIPE-01 | Crítica | Tres webhooks live habilitados: dos destinos a la ruta de Vercel y uno a una Edge Function de Supabase | Pendiente de arquitectura | Revisar en Stripe Dashboard los eventos entregados, errores y reintentos; acordar un procesador autoritativo. No desactivar destinos ni regenerar firmas antes de verificar dependencias. |
| STRIPE-02 | Alta | El webhook marcaba una suscripción cancelada como `refunded`; cancelación y reembolso son estados distintos | Código corregido y desplegado; prueba end-to-end pendiente | `payments.subscription_status` separa el ciclo de vida de la suscripción del estado financiero. Validar eventos duplicados, retrasados y fuera de orden en modo test antes de cerrar. |
| STRIPE-03 | Alta | API `2025-05-28.basil` deja de exponer `invoice.subscription`; el handler anterior no encontraba el ID de suscripción en facturas. | **Arreglo fusionado y CI/build verdes; alias público pendiente** | PR #33 incorporó `parent.subscription_details.subscription` y compatibilidad legacy. Cinco pruebas, `npm audit` y build pasaron; el deployment READY no se asignó al alias público.
| DB-01 | Baja / revisión periódica | Función public.handle_new_user usa SECURITY DEFINER; la inspección confirma SET search_path TO '' y referencia public.profiles de forma cualificada | Control seguro observado; privilegios/trigger pendientes de revisión completa | Mantener el search_path vacío y verificar que solo roles previstos pueden ejecutar la función y que el trigger está asociado a la tabla correcta. No cambiarlo a ciegas. |
| DB-02 | Media | RLS activo en las cinco tablas públicas revisadas; no hay buckets ni políticas de Storage. | Revisado parcialmente | Confirmar si Storage se utiliza. Mantener denegación por defecto si no hay uso; si hay uso, definir políticas mínimas por bucket/propietario y probar acceso anónimo y entre usuarios. |
| DB-03 | Media | El asesor de rendimiento señala 7 índices no utilizados | Informativo | No borrar automáticamente: varios pueden ser nuevos o proteger operaciones futuras. Revisar métricas de uso tras un periodo suficiente y conservar índices de seguridad/retención salvo evidencia. |
| DB-04 | Media | RLS está habilitado en las cinco tablas públicas; Storage no tiene buckets ni políticas; las dos funciones SECURITY DEFINER revisadas no conceden EXECUTE a roles públicos. | Parcial | Revisar triggers, restauración de backups y flujos autenticados. |
| DB-05 | Alta | `anon` y `authenticated` tenían `TRUNCATE`, `REFERENCES`, `TRIGGER` y `MAINTAIN` en las cinco tablas públicas; los permisos por defecto de `postgres` también los concedían a futuras tablas. | Corregido y verificado en migración `20261016130500_revoke_unsafe_public_table_privileges` (PR #37) | Se retiraron los cuatro permisos de las cinco tablas y del default ACL de `postgres`. RLS y privilegios de aplicación se conservaron; el plan de rollback está en la migración. No se alteró el default ACL de `supabase_admin` (rol del proveedor); las tablas de la app pertenecen a `postgres`. |
| OPS-01 | Alta | `main` carecía de reglas de protección | Corregido y verificado | Regla activa: PR obligatorio, conversaciones resueltas, check `build` estricto, aplicación a administradores, sin force-push ni borrado. |
| OPS-02 | Alta | Falta verificar MFA de administradores, backups y recuperación | Pendiente | Verificar MFA en cuentas privilegiadas y documentar/probar restauración de backups. |
| APP-01 | Alta | Flujos completos de checkout, portal, webhooks, cancelación y persistencia no están verificados end-to-end | Pendiente | Ejecutar eventos y pagos sintéticos solo en Stripe test mode cuando haya un contexto de prueba; no tocar pagos ni clientes reales. |
| APP-02 | Media | CSP no está aplicada en modo enforcement | Pendiente de análisis | Definir una CSP compatible con Stripe, fuentes y analítica; probar primero en Report-Only y pasar a enforcement tras resolver violaciones. |
| APP-03 | Media | Página 404 usaba una paleta distinta del sistema visual principal | Corregido y desplegado | Mantener revisión visual y de teclado en móvil/escritorio. |
| WEB-01 | Media | Faltaban páginas de detalle para servicios clave y navegación transversal completa | Corregido y desplegado; revisión visual manual pendiente | Las rutas /servicios, /planes, /proyectos, /contacto, /sobre-neotech, /desarrollo-web, /ciberseguridad, /mantenimiento, portada, sitemap.xml, robots.txt y /api/health devuelven HTTP 200. |

## Corrección Stripe Basil

- PR #33 está fusionado en `main` mediante el commit `26b99a2cfb0bf833db676b03c510e6bc1871dafd`.
- Se lee `invoice.parent.subscription_details.subscription` con compatibilidad para eventos legacy; las cinco pruebas nuevas, `npm audit` y `npm run build` pasaron en CI.
- El deployment target `production` `dpl_9ByGJNMo2RjDtoFmmuWpTJks2ZZQ` está READY. Vercel rechazó el cambio del alias `neotechzgz.vercel.app`; el alias público continúa en `dpl_4uUtoszXD29fpoY81dwPrVLtwVrB`.

## Correcciones verificadas previamente

- PR #18 endureció la actualización de perfiles: el usuario autenticado solo puede actualizar `display_name` desde la API y la base de datos.
- Migración `20261013132826_restrict_profile_updates` aplicada en Supabase; la inspección de privilegios confirmó que `authenticated` solo puede actualizar `display_name`.
- Eliminación de cuenta con borrado lógico, exclusión de administradores, límite de solicitudes y purga explícita posterior a 60 días, con controles de Stripe y autorización de cron.
- Rutas administrativas con comprobación de perfil y rol `is_admin=true`.
- Validación y limitación de solicitudes de soporte/contacto; respuestas de error de Stripe más seguras y persistencia fallida con respuesta reintentable.
- Headers de seguridad presentes en `next.config.mjs`: HSTS, nosniff, frame denial, Referrer-Policy y Permissions-Policy.
- CI: el workflow de seguridad del commit publicado (run 38638486638) pasó `npm ci`, `npm audit --audit-level=high` y `npm run build`. El deployment de producción dpl_4uUtoszXD29fpoY81dwPrVLtwVrB está READY; se comprobaron las rutas públicas con HTTP 200 y las cabeceras de seguridad.
- Asesor de Supabase: sin avisos de seguridad adicionales al aviso de protección de contraseñas filtradas.
- La migración `20261016130500_revoke_unsafe_public_table_privileges` se aplicó al proyecto `qkzmpxyefuqdhyxwfjcw`: los cuatro privilegios son `false` para `anon`/`authenticated` en las cinco tablas; las diez políticas RLS permanecen activas. La actualización de `display_name` sigue permitida y la de `is_admin` sigue denegada.
- PR #36 actualizó `@supabase/server` a 1.9.2 y PostCSS a 8.5.30; los checks obligatorios pasaron.
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

1. Asignar `neotechzgz.vercel.app` al deployment `dpl_9ByGJNMo2RjDtoFmmuWpTJks2ZZQ` desde una sesión autorizada de Vercel; el intento mediante el conector fue rechazado por la revisión de aprobación.
2. Activar la protección contra contraseñas filtradas en Supabase Auth.
3. Revisar, renombrar/eliminar variables residuales y rotar los secretos señalados desde el Dashboard de Vercel, con pruebas tras cada cambio.
4. Revisar el historial de eventos de los tres webhooks Stripe y decidir cuál debe ser autoritativo antes de retirar duplicados.
5. Verificar MFA en las cuentas administradoras; la protección de `main` ya está activa y verificada.
6. Autorizar pruebas de pagos en modo test y pruebas de eliminación/retención con usuarios sintéticos.

## Criterio de cierre

Una incidencia solo pasa a «corregida» cuando existe evidencia reproducible (CI verde, configuración confirmada, prueba funcional o revisión del proveedor). No se promete invulnerabilidad ni se declara una publicación exitosa hasta comprobar el dominio de producción y su commit activo.
