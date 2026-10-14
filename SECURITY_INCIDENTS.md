# NeoTech ZGZ — registro de incidencias

Última revisión: 14 de octubre de 2026. Este registro distingue evidencia comprobada, cambios preparados y tareas que requieren acceso o validación operativa. «Corregido» significa que existe una modificación comprobable; no equivale a producción validada.

## Inventario

| ID | Severidad | Incidencia / evidencia | Estado | Siguiente acción |
|---|---|---|---|---|
| NT-01 | Crítica operativa | La versión endurecida de `main` está compilada en Vercel, pero la última publicación comprobada no la tiene como destino de producción. La promoción anterior falló con HTTP 403 por permisos del equipo. | **Bloqueada por permisos** | Autorizar acceso al equipo/proyecto Vercel y promover el despliegue READY correcto; verificar commit activo y dominio público. |
| NT-02 | Alta | Supabase Auth tiene desactivada la protección contra contraseñas filtradas, según la revisión previa del Security Advisor. | **Pendiente de configuración** | Activar la protección en Supabase Auth y volver a revisar el Security Advisor. |
| NT-03 | Alta | La consulta actual de metadatos Vercel confirma 12 variables con la marca `readable-secret`. No se han recuperado ni mostrado valores. | **Pendiente de revisión** | Revisar variable por variable en Vercel; convertir a sensible/write-only cuando proceda y rotar credenciales afectadas de forma coordinada. |
| NT-04 | Alta | Hay tres destinos de webhook live habilitados: dos a la ruta de Vercel y uno a una función de Supabase. No se ha confirmado el destino autoritativo ni el historial de entregas. | **Pendiente de autorización y evidencia** | Revisar eventos/entregas en Stripe Dashboard y confirmar propiedad, firmas, reintentos y modo de pruebas. No borrar destinos todavía. |
| NT-05 | Alta | El manejador de Stripe registraba una suscripción eliminada como pago `refunded`; cancelación y reembolso no son estados equivalentes. | **Corrección preparada en rama; migración pendiente** | Aplicar la migración `20261014210501_fix_payment_retention_and_subscription_state.sql` en Supabase y validar eventos de suscripción y factura en modo test antes del despliegue. |
| NT-06 | Alta | La ruta administrativa de vista previa devolvió 401 por la protección de despliegue; no se ha probado el control de autorización interno de la aplicación. | **No verificada** | Probar con una sesión de administrador autorizada y otra cuenta sin privilegios; confirmar denegación por defecto. |
| NT-07 | Alta | No se pudo establecer protección de la rama principal con las herramientas conectadas. | **Bloqueada por permisos/herramientas** | Activar protección de `main`, requerir CI verde y revisión antes de fusionar. |
| NT-08 | Media | Falta una batería automatizada suficiente para autorización de perfiles, reintentos de webhook y flujos de pago. | **Pendiente** | Añadir pruebas de regresión y ejecutarlas en CI antes de cambiar los flujos de producción. |
| NT-09 | Media | Faltan evidencias de revisión integral de RLS, políticas de Storage, funciones privilegiadas, MFA de administradores, auditoría y recuperación de copias. | **Pendiente de auditoría** | Revisar tablas/políticas/grants y probar restauración con procedimiento documentado. |
| NT-10 | Media | La política CSP aún requiere inventario de integraciones reales; activarla sin pruebas podría romper Stripe, analítica o correo. | **Pendiente de validación** | Preparar CSP en modo de reporte, analizar violaciones y después valorar enforcement. |
| NT-11 | Media | El flujo de presupuesto no mostraba el código de seguimiento y el texto de éxito no reflejaba el resultado real del envío de email. | **Corrección en main; validación funcional pendiente** | La API devuelve `sent`/`failed` sin exponer detalles; la interfaz muestra el código y el estado del email. Validar con EmailJS configurado y sin configurar antes de cerrar. |
| NT-12 | Media | La interfaz de seguimiento hablaba de acceso con cuenta, pero el formulario consulta con código y email. | **Texto corregido en main; prueba funcional pendiente** | Confirmar que solo revela solicitudes asociadas al código/email correctos. |
| NT-13 | Baja | Faltaban páginas dedicadas de navegación manteniendo la estética actual. | **Implementadas en main; revisión visual pendiente** | Revisar Servicios, Planes, Proyectos, Contacto y Sobre NeoTech en móvil/desktop; publicar solo tras validar. |
| NT-14 | Media | El presupuesto multiplicaba por horas tarifas fijas o planes mensuales. | **Lógica corregida en main; prueba funcional pendiente** | Verificar importes, cálculo y persistencia en preview antes de usar presupuestos reales. |
| NT-15 | Crítica operativa | Vercel no devuelve el valor de variables marcadas como sensitive por esta conexión; no se puede confirmar desde la API si las variables de Production están rellenadas correctamente. | **Requiere verificación manual** | En el Dashboard, comprobar que la URL y la publishable key corresponden al proyecto Supabase correcto y que STRIPE_WEBHOOK_SECRET coincide con el signing secret del endpoint autoritativo. Si falta o no coincide, establecerlo en el Dashboard y hacer redeploy. No copiar secretos al chat. |
| NT-16 | Media | Hay una discrepancia entre el esquema inicial del repositorio (ambas columnas `NOT NULL`) y la base Supabase de producción consultada (ambas aparecen nullable). No se ha demostrado un bloqueo actual de la purga en producción; falta una migración versionada para mantener esa compatibilidad y separar el estado de suscripción. | **Migración preparada en rama; no aplicada** | Aplicar la migración nueva tras autorización y validar esquema y flujo con datos sintéticos. No ejecutar purga manual sobre usuarios reales. |

## Corregido y comprobado anteriormente

- Las actualizaciones de perfil están limitadas a `display_name` en API y privilegios de base de datos.
- Las escrituras de perfil tienen limitación de frecuencia.
- Los fallos al persistir eventos de Stripe devuelven error reintentable sin exponer detalles sensibles en la respuesta.
- El proyecto usa `npm ci`, actualizaciones programadas de dependencias y CI con build y `npm audit --audit-level=high`.
- La migración de seguridad de perfiles se registró aplicada en producción y la inspección de privilegios confirmó el alcance de actualización esperado.
- La página principal y `/api/health` respondieron HTTP 200 en comprobaciones previas; esto no sustituye pruebas autenticadas ni pruebas de pagos.
- La última ejecución consultada de GitHub Actions para `main`, commit `55d417c347c47a0a550320e3ebbf6c70bf25ec1a`, terminó con resultado `success`.

## Correcciones nuevas preparadas en la rama `fix/stripe-subscription-state`

- El webhook deja de convertir cancelaciones de suscripción en reembolsos. Ahora persiste `subscription_status` por separado del estado financiero `status`.
- La migración nueva garantiza que `payments.user_id` y `payments.stripe_session_id` sean nullable, alineándose con el esquema de producción observado y permitiendo anonimizar filas conservadas durante la purga. La base actual ya los expone como nullable; el problema detectado es de deriva entre migraciones versionadas y el esquema live, no un fallo de purga confirmado en producción.
- La migración incorpora una columna restringida `subscription_status` y un índice parcial.
- **Dependencia:** estos cambios no deben desplegarse a producción hasta aplicar la migración de Supabase y probar el flujo con datos sintéticos. El cambio de código no demuestra por sí solo que la migración se haya aplicado ni que los webhooks reales funcionen.

## No debe marcarse como resuelto todavía

- Publicación de los cambios endurecidos en el dominio de producción.
- Aplicación de la migración nueva de pagos y prueba end-to-end de Stripe, entregas firmadas, persistencia, reintentos y suscripciones.
- Configuración de secretos/variables y protección contra contraseñas filtradas.
- Autorización real del panel administrativo, auditoría completa de Supabase y protección de rama.
- Pruebas visuales, accesibilidad, rendimiento y responsive de las páginas nuevas.
- Prueba del cron de purga con cuentas sintéticas con pagos, sin pagos y con cancelación de Stripe fallida.

## Regla de cierre

Cada incidencia se cierra solo con evidencia: cambio revisado, CI verde cuando aplique, verificación funcional y comprobación de producción si afecta al sitio público. Los secretos no deben copiarse a issues, commits ni conversaciones.
