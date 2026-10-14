# NeoTech ZGZ — registro de incidencias y plan de seguridad

**Última revisión:** 14 de octubre de 2026  
**Alcance:** GitHub, Vercel, Supabase, Stripe y páginas públicas.  
**Criterio:** solo se marcan como corregidos los cambios con evidencia verificable. Un build o una respuesta HTTP 200 no certifican el flujo completo ni la seguridad integral.

## Resumen ejecutivo

- La aplicación ya tiene controles de seguridad en el código, migraciones de base de datos y un workflow de build/auditoría.
- La publicación de los cambios de seguridad más recientes en el dominio de producción sigue siendo una puerta pendiente: el último despliegue de producción confirmado en la auditoría previa usa el commit `532706f28264b4ebe55b99d5e8ba243016e70a9a`. La promoción de un despliegue más reciente devolvió HTTP 403 por permisos del equipo Vercel.
- El asesor de Supabase sigue avisando de que la protección contra contraseñas filtradas está desactivada.
- Vercel marca 12 variables como `readable-secret`; además, hay variables de entorno con prefijo `NEXT_PUBLIC_` cuyos nombres sugieren credenciales de servidor. No se ha confirmado que se hayan expuesto al navegador, pero deben revisarse y sanearse.
- Stripe tiene varios destinos de webhook activos. No se debe borrar ni cambiar ningún destino hasta verificar el historial de entregas y qué sistema procesa cada evento.
- PR #27 incorpora páginas dedicadas de Servicios, Planes, Proyectos, Contacto y Sobre NeoTech, navegación, metadatos SEO y un registro de incidencias; sigue sujeta a CI y publicación.

## Registro de incidencias

| ID | Prioridad | Incidencia | Estado verificado | Acción requerida |
|---|---|---|---|---|
| DEP-01 | Crítica | El dominio de producción no está confirmado en el último commit de seguridad | Pendiente | Conceder al operador la función necesaria en el equipo Vercel o promover manualmente el despliegue validado; comprobar commit activo, homepage y health endpoint. |
| ENV-01 | Crítica | Vercel señala 12 variables con `readable-secret`: `CRON_SECRET`, `EMAILJS_PRIVATE_KEY`, `STRIPE_MCP_KEY`, `STRIPE_SECRET_KEY`, `VERCEL_AI_GATEWAY_KEY`, `REDIS_URL`, `KV_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`, `SUPABASE_SECRET_KEY_2`, `SUPABASE_SECRET_KEY` y `SERVICE_ROLE` | Pendiente | Revisar accesos y clasificación en Vercel. Rotar claves de servidor expuestas o compartidas, una por una, tras confirmar consumidores y plan de reversión. No copiar valores a GitHub ni al chat. |
| ENV-02 | Alta | Existen variables llamadas `NEXT_PUBLIC_POSTGRES_PASSWORD`, `NEXT_PUBLIC_POSTGRES_URL`, `NEXT_PUBLIC_POSTGRES_URL_NON_POOLING`, `NEXT_PUBLIC_POSTGRES_PRISMA_URL`, `NEXT_PUBLIC_POSTGRES_USER`, `NEXT_PUBLIC_POSTGRES_HOST`, `NEXT_PUBLIC_POSTGRES_DATABASE` y `NEXT_PUBLIC_SUPABASE_JWT_SECRET`, además de nombres duplicados `NEXT_PUBLIC_NEXT_PUBLIC_*` | Pendiente de saneamiento | El código consultado no referencia directamente esas variables de Postgres/JWT. Confirmar que son residuos de integración, eliminar o renombrar de forma controlada y rotar cualquier contraseña/secret real que haya podido ser expuesto. No eliminar variables usadas por la app sin probar antes. |
| ENV-03 | Alta | Variables de Supabase duplicadas y con diferentes targets/nombres | Pendiente | Mantener una configuración única y consistente para Production, Preview y Development: URL del proyecto `qkzmpxyefuqdhyxwfjcw` y una publishable/anon key pública vigente. No usar service-role/JWT secret en variables públicas. |
| AUTH-01 | Alta | Protección de contraseñas filtradas desactivada en Supabase Auth | Pendiente | Activar leaked-password protection en Auth settings y probar registro/cambio de contraseña. |
| STRIPE-01 | Crítica | Tres webhooks live habilitados: dos destinos a la ruta de Vercel y uno a una Edge Function de Supabase | Pendiente de arquitectura | Revisar en Stripe Dashboard los eventos entregados, errores y reintentos; acordar un procesador autoritativo. No desactivar destinos ni regenerar firmas antes de verificar dependencias. |
| STRIPE-02 | Alta | La ruta actual parece registrar una suscripción cancelada como `refunded`; cancelación y reembolso son estados distintos | Pendiente | Diseñar campo de estado de suscripción independiente de pagos/refunds; cubrir eventos duplicados, retrasados y fuera de orden en modo test antes de migrar producción. |
| DB-01 | Baja / revisión periódica | Función public.handle_new_user usa SECURITY DEFINER; la inspección confirma SET search_path TO '' y referencia public.profiles de forma cualificada | Control seguro observado; privilegios/trigger pendientes de revisión completa | Mantener el search_path vacío y verificar que solo roles previstos pueden ejecutar la función y que el trigger está asociado a la tabla correcta. No cambiarlo a ciegas. |
| DB-02 | Media | Tablas públicas principales tienen RLS activo; Storage también tiene RLS activo y no se observaron políticas de Storage | Revisado parcialmente | Confirmar si Storage se utiliza. Mantener denegación por defecto si no hay uso; si hay uso, definir políticas mínimas por bucket/propietario y probar acceso anónimo y entre usuarios. |
| DB-03 | Media | El asesor de rendimiento señala 7 índices no utilizados | Informativo | No borrar automáticamente: varios pueden ser nuevos o proteger operaciones futuras. Revisar métricas de uso tras un periodo suficiente y conservar índices de seguridad/retención salvo evidencia. |
| OPS-01 | Alta | No se pudo activar protección de rama principal con los conectores disponibles | Pendiente | En GitHub, proteger `main`, exigir el workflow de seguridad, impedir force-push y restringir bypasses. |
| OPS-02 | Alta | Falta verificar MFA de administradores, backups y recuperación | Pendiente | Exigir MFA para cuentas privilegiadas; documentar y probar restauración de base de datos y procedimientos de incidente. |
| APP-01 | Alta | Flujos completos de checkout, portal, webhooks, cancelación y persistencia no están verificados end-to-end | Pendiente | Ejecutar pruebas en modo test con eventos válidos e inválidos y comprobar filas resultantes en Supabase antes de anunciar pagos listos. |
| APP-02 | Media | CSP no está aplicada en modo enforcement | Pendiente de análisis | Definir una CSP compatible con Stripe, fuentes y analítica; probar primero en Report-Only y pasar a enforcement tras resolver violaciones. |
| APP-03 | Media | Página 404 usaba una paleta distinta del sistema visual principal | En corrección en esta rama | Unificarla con el tema NeoTech ZGZ y comprobar móvil/teclado. |
| WEB-01 | Media | Las páginas públicas nuevas y sus ajustes aún no están en producción | En revisión, PR #27 | Pasar CI, revisar preview y publicar solo cuando la compilación y el acceso a Vercel lo permitan. |

## Correcciones verificadas previamente

- PR #18 endureció la actualización de perfiles: el usuario autenticado solo puede actualizar `display_name` desde la API y la base de datos.
- Migración `20261013132826_restrict_profile_updates` aplicada en Supabase; la inspección de privilegios confirmó que `authenticated` solo puede actualizar `display_name`.
- Eliminación de cuenta con borrado lógico, exclusión de administradores, límite de solicitudes y purga explícita posterior a 60 días, con controles de Stripe y autorización de cron.
- Rutas administrativas con comprobación de perfil y rol `is_admin=true`.
- Validación y limitación de solicitudes de soporte/contacto; respuestas de error de Stripe más seguras y persistencia fallida con respuesta reintentable.
- Headers de seguridad presentes en `next.config.mjs`: HSTS, nosniff, frame denial, Referrer-Policy y Permissions-Policy.
- CI con `npm ci`, `npm audit --audit-level=high` y `npm run build`. El paso `npm audit --audit-level=high` pasó en la ejecución 38634338750; no se han modificado las dependencias desde entonces. La vista previa Vercel del commit 3c0b71216ff33bb49ce514ff974d93bc072f8e00 alcanzó READY y las rutas públicas principales comprobadas devolvieron HTTP 200. La ejecución más reciente de GitHub Actions permanece `pending` sin jobs asociados, por lo que no se declara un CI verde sobre el último commit documental.
- Asesor de Supabase: sin avisos de seguridad adicionales al aviso de protección de contraseñas filtradas.
- Health endpoint y homepage devolvieron HTTP 200 en comprobaciones previas; esto no sustituye pruebas autenticadas ni pruebas de pagos.

## Cambios de producto propuestos en PR #27

- `/servicios`: catálogo de servicios con precios orientativos y CTA.
- `/planes`: planes de soporte y notas de alcance.
- `/proyectos`: portfolio con enlaces a los proyectos ya declarados en la página principal.
- `/contacto`: canales de contacto y recordatorio de no enviar datos sensibles.
- `/sobre-neotech`: enfoque, valores y alcance de servicio.
- Navegación compartida, página 404, sitemap y metadatos SEO actualizados.
- Cálculo de presupuesto separado entre servicios por hora, precio inicial web y planes mensuales; requiere pruebas funcionales.

PR: https://github.com/Jasondevtech276/neotechzgz.vercel.app/pull/27

## Acciones que requieren acceso/autorización del titular

1. Dar al operador de publicación el acceso correcto al equipo/proyecto Vercel, o promover el despliegue desde el Dashboard.
2. Activar la protección contra contraseñas filtradas en Supabase Auth.
3. Revisar, renombrar/eliminar variables residuales y rotar los secretos señalados desde el Dashboard de Vercel, con pruebas tras cada cambio.
4. Revisar el historial de eventos de los tres webhooks Stripe y decidir cuál debe ser autoritativo antes de retirar duplicados.
5. Configurar la protección de `main` y MFA para administradores.
6. Autorizar pruebas de pagos en modo test y pruebas de eliminación/retención con usuarios sintéticos.

## Criterio de cierre

Una incidencia solo pasa a «corregida» cuando existe evidencia reproducible (CI verde, configuración confirmada, prueba funcional o revisión del proveedor). No se promete invulnerabilidad ni se declara una publicación exitosa hasta comprobar el dominio de producción y su commit activo.
