# NeoTech ZGZ — registro de incidencias

Última revisión: 14 de octubre de 2026. Este registro distingue evidencia comprobada, cambios preparados y tareas que requieren acceso o validación operativa. «Corregido» significa que existe una modificación comprobable; no equivale a producción validada.

## Inventario

| ID | Severidad | Incidencia / evidencia | Estado | Siguiente acción |
|---|---|---|---|---|
| NT-01 | Crítica operativa | El despliegue de producción dpl_4uUtoszXD29fpoY81dwPrVLtwVrB (commit 515ff435a5108cb0088941ec81037a31b8ea4cce) está READY con target `production` y el alias `neotechzgz.vercel.app` apunta a él. Se verificaron rutas públicas y cabeceras. | **Corregido y verificado** | Mantener monitorización y completar las acciones de seguridad pendientes. El DNS de `www.neotechzgz.eu.org` sigue siendo una incidencia separada (NT-16). |
| NT-02 | Alta | Supabase Auth tiene desactivada la protección contra contraseñas filtradas, según la revisión previa del Security Advisor. | **Pendiente de configuración** | Activar la protección en Supabase Auth y volver a revisar el Security Advisor. |
| NT-03 | Alta | Vercel marca 12 variables como `readable-secret`: `CRON_SECRET`, `EMAILJS_PRIVATE_KEY`, `STRIPE_MCP_KEY`, `STRIPE_SECRET_KEY`, `VERCEL_AI_GATEWAY_KEY`, `REDIS_URL`, `KV_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`, `SUPABASE_SECRET_KEY_2`, `SUPABASE_SECRET_KEY` y `SERVICE_ROLE`. No se han leído ni expuesto sus valores. | **Pendiente de revisión y rotación controlada** | Confirmar consumidores y targets, convertir a sensible/write-only cuando el plan lo permita y rotar cada secreto de servidor con plan de reversión. No copiar valores a GitHub ni al chat. |
| NT-04 | Alta | Stripe live confirma tres endpoints activos: `we_1UPo3RA7BXgq9bhYPsOyyaJq` y `we_1UNOPAA7BXgq9bhY38XgfxRu` apuntan ambos a `/api/stripe/webhook`; `we_1UPJmNA7BXgq9bhYyIxo63vy` apunta a la Edge Function de otro proyecto Supabase (`rxbwwzweqehjemblvdwu`). | **Pendiente de revisión antes de retirar duplicados** | Revisar entregas fallidas/recientes y confirmar cuál sistema debe escribir en la base actual (`qkzmpxyefuqdhyxwfjcw`). No desactivar endpoints hasta acordar y verificar la ruta autoritativa; hay riesgo de doble procesamiento y de escribir en un proyecto antiguo. |
| NT-15 | Crítica operativa | Vercel no devuelve el valor de variables marcadas como sensitive por esta conexión; por tanto, no se puede confirmar desde la API si las variables de Production están rellenadas correctamente. La metadata sí confirma que existen y están asignadas a Production. | **Requiere verificación manual** | En el Dashboard, comprobar que la URL y la publishable key corresponden al proyecto Supabase correcto y que STRIPE_WEBHOOK_SECRET coincide con el signing secret del endpoint autoritativo. Si falta o no coincide, establecerlo en el Dashboard y hacer redeploy. No copiar secretos al chat. |
| NT-05 | Alta | El manejador de Stripe marcaba una suscripción eliminada como pago `refunded`; cancelación y reembolso no son estados equivalentes. | **Corregido y desplegado; prueba end-to-end pendiente** | Probar en modo test los eventos `customer.subscription.updated/deleted`, `invoice.paid` e `invoice.payment_failed`; confirmar persistencia y reintentos antes de cerrar por completo. |
| NT-06 | Alta | La ruta administrativa de vista previa devolvió 401 por la protección de despliegue; no se ha probado el control de autorización interno de la aplicación. | **No verificada** | Probar con una sesión de administrador autorizada y otra cuenta sin privilegios; confirmar denegación por defecto. |
| NT-07 | Alta | No se pudo establecer protección de la rama principal con las herramientas conectadas. | **Bloqueada por permisos/herramientas** | Activar protección de `main`, requerir CI verde y revisión antes de fusionar. |
| NT-08 | Media | Falta una batería automatizada suficiente para autorización de perfiles, reintentos de webhook y flujos de pago. | **Pendiente** | Añadir pruebas de regresión y ejecutarlas en CI antes de cambiar los flujos de producción. |
| NT-09 | Media | Faltan evidencias de revisión integral de RLS, políticas de Storage, funciones privilegiadas, MFA de administradores, auditoría y recuperación de copias. | **Pendiente de auditoría** | Revisar tablas/políticas/grants y probar restauración con procedimiento documentado. |
| NT-10 | Media | La política CSP aún requiere inventario de integraciones reales; activarla sin pruebas podría romper Stripe, analítica o correo. | **Pendiente de validación** | Preparar CSP en modo de reporte, analizar violaciones y después valorar enforcement. |
| NT-11 | Media | El flujo de presupuesto no mostraba el código de seguimiento y el texto de éxito no reflejaba el resultado real del envío de email. | **Código corregido y desplegado; prueba funcional pendiente** | La API devuelve sent/failed sin exponer detalles; la interfaz muestra el código y el estado del email. Validar con EmailJS configurado y sin configurar antes de cerrar. |
| NT-12 | Media | La interfaz de seguimiento hablaba de acceso con cuenta, pero el formulario consulta con código y email. | **Texto corregido y desplegado; prueba funcional pendiente** | Confirmar que solo revela solicitudes asociadas al código/email correctos. |
| NT-13 | Baja | Faltaban páginas dedicadas de navegación manteniendo la estética actual y páginas específicas para servicios clave. | **Corregido y publicado** | Las páginas Servicios, Planes, Proyectos, Contacto, Sobre NeoTech, Desarrollo Web, Ciberseguridad y Mantenimiento IT responden HTTP 200 en producción; se verificaron sitemap y robots. La revisión visual manual en distintos dispositivos sigue siendo recomendable. |
| NT-14 | Media | El presupuesto multiplicaba por horas tarifas fijas o planes mensuales. | **Lógica corregida, desplegada y compilada; prueba funcional pendiente** | El frontend y la API distinguen servicios por hora de Desarrollo Web (precio inicial) y planes mensuales; las horas son nulas en los casos no horarios. Probar importes y persistencia con una cuenta de test. |

| NT-17 | Media | El esquema inicial del repositorio declaraba `payments.user_id` y `payments.stripe_session_id` como `NOT NULL`, mientras que producción ya los expone como nullable. Faltaba una migración versionada que garantizara esa compatibilidad y añadiera el estado de suscripción. | **Migración aplicada; código versionado y desplegado** | Ejecutar pruebas sintéticas de retención y webhooks en entorno controlado; no ejecutar purga manual sobre usuarios reales. |

## Corregido y comprobado anteriormente

- Las actualizaciones de perfil están limitadas a `display_name` en API y privilegios de base de datos.
- Las escrituras de perfil tienen limitación de frecuencia.
- Los fallos al persistir eventos de Stripe devuelven error reintentable sin exponer detalles sensibles en la respuesta.
- El proyecto usa `npm ci`, actualizaciones programadas de dependencias y CI con build y `npm audit --audit-level=high`.
- La migración de seguridad de perfiles se registró aplicada en producción y la inspección de privilegios confirmó el alcance de actualización esperado.
- La migración `20261014210501_fix_payment_retention_and_subscription_state` se aplicó al proyecto Supabase `qkzmpxyefuqdhyxwfjcw`; el esquema verificado muestra `payments.subscription_status` con restricción de valores y `payments.user_id`/`stripe_session_id` nullable. El webhook corregido está desplegado en el commit `515ff435a5108cb0088941ec81037a31b8ea4cce`; CI y build de producción pasaron. El end-to-end con eventos reales/test aún no se ha completado.
- Se prepararon páginas de detalle para Desarrollo Web, Ciberseguridad y Mantenimiento IT, con metadatos SEO, enlaces desde el catálogo y entradas en sitemap. La validación de rutas está pendiente del preview de la versión final.
- La revisión previa encontró la página principal y `/api/health` respondiendo HTTP 200; una consulta reciente de Vercel no encontró errores de ejecución durante siete días.

## No debe marcarse como resuelto todavía

- Publicación de los cambios endurecidos en el dominio de producción.
- Prueba end-to-end de Stripe, entregas firmadas, persistencia, reintentos y suscripciones.
- Configuración de secretos/variables y protección contra contraseñas filtradas.
- Autorización real del panel administrativo, auditoría completa de Supabase y protección de rama.
- Pruebas visuales, accesibilidad, rendimiento y responsive de las páginas nuevas.

## Regla de cierre

Cada incidencia se cierra solo con evidencia: cambio revisado, CI verde cuando aplique, verificación funcional y comprobación de producción si afecta al sitio público. Los secretos no deben copiarse a issues, commits ni conversaciones.

| NT-16 | Media | Vercel detecta la configuración DNS de www.neotechzgz.eu.org como misconfigured; la consulta de la web no pudo confirmar que el host sirva el despliegue. | **Pendiente de DNS externo** | En el proveedor que gestiona el DNS de EU.org, comprobar el CNAME de www hacia 87e2547736c30796.vercel-dns-017.com (alternativa indicada por Vercel: cname.vercel-dns.com.) y confirmar propagación. No afecta al dominio neotechzgz.vercel.app. |