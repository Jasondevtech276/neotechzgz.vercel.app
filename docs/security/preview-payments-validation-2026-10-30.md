# NeoTechZGZ — validación de pagos en Preview (2026-10-30)

## Alcance y límites

- Repositorio: `Jasondevtech276/neotechzgz.vercel.app`
- Rama: `audit/stripe-webhook-test-harness`
- Proyecto Supabase Preview: `hdpikaqxeadqmckmmjfh`
- Cuenta Stripe utilizada: cuenta de pruebas `acct_1Rb6nfPOVrgZ5y4y` (`livemode=false`)
- Vercel project: `prj_iykDkWYrfpls0aVwdJYg8LhxQnH5`
- Ninguna operación de escritura se realizó contra Stripe Live ni contra Supabase Production.
- Los precios de este documento son valores provisionales de TEST, no tarifas comerciales aprobadas ni una autorización para habilitar ventas.

## Migraciones Preview aplicadas

1. `20261030005446_preview_reconcile_account_schema`
2. `20261030005545_preview_consolidate_read_policies`

Cambios:
- `quotes`: `budget_calculated`, `client_code`, `user_id`, índice único de código y relación opcional con Auth.
- Nuevas tablas `profiles`, `quote_status_history` y `support_tickets`.
- `payments`: `subscription_status`, retención compatible con borrado de identidad y relación `ON DELETE SET NULL`.
- Trigger Auth para crear perfiles con `is_admin=false` independientemente de metadatos editables.
- RLS en las ocho tablas de aplicación/ledger; roles cliente sin acceso anónimo y sin escrituras directas al ledger financiero.
- Lecturas combinadas de propietario/administrador para evitar políticas permisivas duplicadas.
- Tablas de Stripe internas sin políticas para clientes; sólo `service_role`.

## Evidencias de validación

- Consultas de esquema, grants, RLS, políticas y trigger verificadas en Supabase Preview.
- Prueba transaccional con identidades sintéticas: propietario sólo ve sus perfiles, presupuestos, pagos y tickets; administrador de prueba ve el conjunto; actualización del estado de presupuesto e inserción del historial permitidas al administrador.
- Prueba transaccional revertida con `ROLLBACK`; no dejó identidades ni filas de prueba persistentes.
- `anon` sin SELECT/INSERT en las tablas comprobadas.
- `authenticated` sin INSERT/UPDATE en el ledger de pagos y sin permiso para cambiar `profiles.is_admin`.
- CI PR run `40983283313`: PostgreSQL 17, Edge Function Deno, idempotencia y nueva prueba de migraciones/RLS — SUCCESS.
- CI PR run `40983283323`: npm ci, npm audit, npm test y Next.js build — SUCCESS.
- Vercel Preview deployment `dpl_Aov8Y6Wf1PXAFqP2mqpuxurpNBEc`, commit `0daafc1bfe8db853e53a4236322b43f6f0f87e27` — READY.

## Catálogo Stripe TEST provisional

Todos los productos y precios se crearon en la cuenta de pruebas, con metadata `environment=preview_test_only`, moneda EUR y `livemode=false`.

| Producto | Precio TEST | Tipo | Lookup key |
|---|---:|---|---|
| Soporte remoto | 45 €/hora | Pago único | `neotech_remote_support` |
| Soporte presencial | 60 €/hora | Pago único | `neotech_onsite_support` |
| Desarrollo web | 1.500 € desde / proyecto básico | Pago único | `neotech_web_development` |
| Consultoría IT | 75 €/hora | Pago único | `neotech_it_consulting` |
| Análisis de sistemas | 85 €/hora | Pago único | `neotech_systems_analysis` |
| Plan STARTER | 149 €/mes | Suscripción | `neotech_plan_starter` |
| Plan PROFESSIONAL | 399 €/mes | Suscripción | `neotech_plan_professional` |
| Plan ENTERPRISE | 899 €/mes | Suscripción | `neotech_plan_enterprise` |

Referencias de mercado consultadas:
- Frucomedia Zaragoza publica desde enero de 2026 62 €/hora para programación y análisis: https://www.frucomedia.com/tarifas/
- Malt publica en octubre de 2026 referencias medias diarias de 315 € para TI/desarrollo, 318 € para sistemas/redes y 307 € para back-end: https://www.malt.com/es-es/t/barometro-tarifas/tech
- Apply publica 75 €/hora fuera de plan y planes empresariales desde 590 €/mes para un alcance de hasta 10 usuarios: https://apply.es/tarifas

Estos datos son referencias, no equivalencias exactas de alcance. Los importes por hora de NeoTechZGZ son una posición de prueba intermedia. El precio de desarrollo web es una tarifa inicial de un paquete básico, no un presupuesto universal. Los planes de 149/399/899 € son hipótesis de paquete para probar Checkout; hay que cerrar horas, SLA, desplazamientos, exclusiones, soporte fuera de horario y límites de Enterprise antes de comercializarlos. No se ha fijado tratamiento de IVA ni `tax_behavior`; Stripe devuelve `unspecified` y la configuración fiscal se mantiene pendiente de la fase final.

## Webhook de prueba

- Endpoint Stripe TEST: `we_1UW49tPOVrgZ5y4yxRHYtow8`
- Destino: alias de la rama audit `/api/stripe/webhook`
- Eventos: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.
- Se añadió un `STRIPE_WEBHOOK_SECRET` nuevo, sensible y limitado a Preview + rama audit. No sustituye ni modifica el secreto Preview global, ni los secretos Production/Development.
- Endpoint `we_1UW49tPOVrgZ5y4yxRHYtow8` quedó **disabled** después de crearlo: la protección del deployment Preview impide certificar una entrega externa segura sin un método de acceso aprobado. No se ha debilitado esa protección.
- No se ha expuesto ni registrado el signing secret.
- La cuenta Stripe Live no apareció entre las cuentas accesibles al conector en esta sesión; no se intentó operar sobre ella.

## Gates que siguen cerrados

- `CHECKOUT_ENABLED`, `STRIPE_AUTOMATIC_TAX_ENABLED` y `STRIPE_ADAPTIVE_PRICING_ENABLED` no se han habilitado en Preview. La ruta de Checkout continúa fail-closed (503) por diseño mientras falten las validaciones fiscales/contractuales.
- No se ha completado una compra alojada end-to-end ni una entrega real de webhook desde Stripe al runtime de Preview. La protección del deployment no se ha debilitado para permitir tráfico externo.
- La autenticación real desde el runtime Vercel con los secretos actuales no se ha demostrado; los secretos no se descifraron.
- No se han rotado ni revocado credenciales existentes. La rotación queda en fase de preparación hasta disponer de claves nuevas emitidas por los proveedores y una ventana de sustitución/rollback.
- No se han modificado webhooks, precios, productos ni credenciales de Live.

## Próximos pasos de cierre

1. Probar el runtime de Preview bajo un método de acceso aprobado que no reduzca la protección del deployment.
2. Completar una sesión Checkout de prueba y la entrega de cada evento relevante; verificar el ledger y los registros `payments`/`stripe_invoices`.
3. Asignar un administrador Preview de forma explícita y fuera de metadatos editables.
4. Completar el inventario de consumidores de credenciales, emitir nuevas claves en cada proveedor y rotar una por una con solapamiento y rollback.
5. Revisar alcance y precios comerciales, IVA, condiciones y fiscalidad en la fase final.
