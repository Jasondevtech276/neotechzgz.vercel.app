# NeoTech ZGZ — registro de incidencias

Última revisión: 14 de octubre de 2026. Este registro distingue evidencia comprobada, cambios preparados y tareas que requieren acceso o validación operativa. «Corregido» significa que existe una modificación comprobable; no equivale a producción validada.

## Inventario

| ID | Severidad | Incidencia / evidencia | Estado | Siguiente acción |
|---|---|---|---|---|
| NT-01 | Crítica operativa | La versión endurecida de `main` está compilada en Vercel, pero la última publicación comprobada no la tiene como destino de producción. La promoción anterior falló con HTTP 403 por permisos del equipo. | **Bloqueada por permisos** | Autorizar acceso al equipo/proyecto Vercel y promover el despliegue READY correcto; verificar commit activo y dominio público. |
| NT-02 | Alta | Supabase Auth tiene desactivada la protección contra contraseñas filtradas, según la revisión previa del Security Advisor. | **Pendiente de configuración** | Activar la protección en Supabase Auth y volver a revisar el Security Advisor. |
| NT-03 | Alta | Se detectaron 12 variables de Vercel marcadas como secretos legibles en metadatos. Sus valores no se expusieron ni se modificaron. | **Pendiente de revisión** | Revisar variable por variable en Vercel; convertir a sensible/write-only cuando proceda y rotar credenciales afectadas de forma coordinada. |
| NT-15 | Crítica operativa | Vercel no devuelve el valor de variables marcadas como sensitive por esta conexión; por tanto, no se puede confirmar desde la API si las variables de Production están rellenadas correctamente. La metadata sí confirma que existen y están asignadas a Production. | **Requiere verificación manual** | En el Dashboard, comprobar que la URL y la publishable key corresponden al proyecto Supabase correcto y que STRIPE_WEBHOOK_SECRET coincide con el signing secret del endpoint autoritativo. Si falta o no coincide, establecerlo en el Dashboard y hacer redeploy. No copiar secretos al chat. |
| NT-05 | Alta | El manejador actual registra una suscripción eliminada como pago `refunded`; cancelación y reembolso no son estados equivalentes. | **Pendiente de corrección segura** | Diseñar estado de suscripción separado del estado de pago; probar eventos duplicados y fuera de orden en entorno aislado antes de migrar o cambiar el webhook. |
| NT-06 | Alta | La ruta administrativa de vista previa devolvió 401 por la protección de despliegue; no se ha probado el control de autorización interno de la aplicación. | **No verificada** | Probar con una sesión de administrador autorizada y otra cuenta sin privilegios; confirmar denegación por defecto. |
| NT-07 | Alta | No se pudo establecer protección de la rama principal con las herramientas conectadas. | **Bloqueada por permisos/herramientas** | Activar protección de `main`, requerir CI verde y revisión antes de fusionar. |
| NT-08 | Media | Falta una batería automatizada suficiente para autorización de perfiles, reintentos de webhook y flujos de pago. | **Pendiente** | Añadir pruebas de regresión y ejecutarlas en CI antes de cambiar los flujos de producción. |
| NT-09 | Media | Faltan evidencias de revisión integral de RLS, políticas de Storage, funciones privilegiadas, MFA de administradores, auditoría y recuperación de copias. | **Pendiente de auditoría** | Revisar tablas/políticas/grants y probar restauración con procedimiento documentado. |
| NT-10 | Media | La política CSP aún requiere inventario de integraciones reales; activarla sin pruebas podría romper Stripe, analítica o correo. | **Pendiente de validación** | Preparar CSP en modo de reporte, analizar violaciones y después valorar enforcement. |
| NT-11 | Media | La página principal comunicaba que se enviaba un presupuesto por correo, pero el flujo guarda la solicitud y descarga un PDF. | **Texto corregido en rama; CI/UX pendientes** | Confirmar en CI y en preview que el mensaje informa correctamente y no promete email automático. |
| NT-12 | Media | La interfaz de seguimiento hablaba de acceso con cuenta, pero el formulario consulta con código y email. | **Texto corregido en rama; prueba funcional pendiente** | Confirmar que solo revela solicitudes asociadas al código/email correctos. |
| NT-13 | Baja | Faltaban páginas dedicadas de navegación manteniendo la estética actual. | **Implementadas en rama; CI/visual pendiente** | Revisar Servicios, Planes, Proyectos y Contacto en móvil/desktop; publicar solo tras validar. |
| NT-14 | Media | El presupuesto multiplicaba por horas tarifas fijas o planes mensuales. | **Lógica corregida en rama; CI y prueba funcional pendientes** | El frontend y la API ahora distinguen servicios por hora de Desarrollo Web (precio inicial) y planes mensuales; las horas son nulas en los casos no horarios. Verificar los importes y la persistencia en preview antes de usar presupuestos reales. |

## Corregido y comprobado anteriormente

- Las actualizaciones de perfil están limitadas a `display_name` en API y privilegios de base de datos.
- Las escrituras de perfil tienen limitación de frecuencia.
- Los fallos al persistir eventos de Stripe devuelven error reintentable sin exponer detalles sensibles en la respuesta.
- El proyecto usa `npm ci`, actualizaciones programadas de dependencias y CI con build y `npm audit --audit-level=high`.
- La migración de seguridad de perfiles se registró aplicada en producción y la inspección de privilegios confirmó el alcance de actualización esperado.
- La revisión previa encontró la página principal y `/api/health` respondiendo HTTP 200; una consulta reciente de Vercel no encontró errores de ejecución durante siete días.

## No debe marcarse como resuelto todavía

- Publicación de los cambios endurecidos en el dominio de producción.
- Prueba end-to-end de Stripe, entregas firmadas, persistencia, reintentos y suscripciones.
- Configuración de secretos/variables y protección contra contraseñas filtradas.
- Autorización real del panel administrativo, auditoría completa de Supabase y protección de rama.
- Pruebas visuales, accesibilidad, rendimiento y responsive de las páginas nuevas.

## Regla de cierre

Cada incidencia se cierra solo con evidencia: cambio revisado, CI verde cuando aplique, verificación funcional y comprobación de producción si afecta al sitio público. Los secretos no deben copiarse a issues, commits ni conversaciones.
