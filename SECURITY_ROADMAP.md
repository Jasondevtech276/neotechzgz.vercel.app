# NeoTech ZGZ — estado de seguridad y plan

**Última revisión:** 31 de octubre de 2026 (sustituye a la revisión del 16-oct).
**Alcance:** GitHub, Vercel, Supabase, Stripe y Cloudflare.
**Criterio:** solo se marca «corregido» lo que tiene evidencia reproducible. Un HTTP 200 o un build verde no certifican la seguridad integral ni el flujo de pago.

## Resumen ejecutivo

- **Fase:** pre-lanzamiento comercial. La web pública está en producción. La contratación está **cerrada por diseño** (`/api/stripe/checkout` devuelve 503 mientras `CHECKOUT_ENABLED`, `STRIPE_AUTOMATIC_TAX_ENABLED` y `STRIPE_ADAPTIVE_PRICING_ENABLED` no sean `true`).
- **Producción = `main`:** el alias `neotechzgz.vercel.app` sirve el deployment `dpl_6n4ksect4PUbnLFi3x4hTAcwzARK` (24-oct-2026 22:28 UTC), creado por el merge de `294862e` (PR #68). **DEP-01 / NT-01 quedan cerrados.**
- **Nuevo crítico (SEC-21):** en Vercel existe una variable cuyo *nombre* es un token personal de Supabase (`sbp_fcb4…`, enmascarado aquí). Los nombres no se cifran.
- **Catálogo roto en `main` (STRIPE-04):** los `price_…` fijos en `lib/products.ts` no existen en la cuenta live (0 precios) ni en la de test. El PR #69 lo corrige con *lookup keys*.
- **El proyecto Supabase de producción (`qkzmpxyefuqdhyxwfjcw`) no está en la organización conectada a las herramientas de auditoría.** Solo se pudo revisar el proyecto de preview (`hdpikaqxeadqmckmmjfh`).

## Evidencia del 31-oct-2026

| Comprobación | Resultado |
|---|---|
| Rutas públicas `/`, `/servicios`, `/planes`, `/login`, `/account`, `/legal`, `/condiciones`, `/desistimiento` | HTTP 200 |
| `/admin` sin sesión | HTTP 307 → `/admin/login` |
| `/api/health` | `{"ok":true}` |
| Cabeceras | HSTS (2 años, includeSubDomains), `X-Frame-Options: DENY`, `Referrer-Policy`. **Sin CSP.** |
| `main` local | `npm audit --audit-level=high`: 0 · `npm run build`: OK · tests: todos OK en Node 22 |
| Stripe live `acct_1Rb6mp…` | 0 precios, 0 registros fiscales, 3 webhooks (2 → Vercel, 1 → Edge Function `rxbwwzweqehjemblvdwu`) |
| Stripe test `acct_1Rb6nf…` | 8 precios `neotech_*` (PR #69); webhooks → preview del PR #69 y Worker `ntz-stripe-exttest-20261026` |
| Supabase preview | 8 tablas con RLS, 0 filas; avisos solo INFO (tablas de ledger de Stripe accesibles solo con la clave de servicio, intencionado) |
| Bundle público | No contiene URL de Supabase, claves `pk_`/`sbp_` ni variables `NEXT_PUBLIC_POSTGRES_*` |

## Registro de incidencias

| ID | Prioridad | Incidencia | Estado (31-oct) | Siguiente acción |
|---|---|---|---|---|
| SEC-21 | **Crítica** | Token personal de Supabase usado como *nombre* de variable en Vercel (Production, Preview, Development) | **Abierto** | Titular: revocar el token en Supabase → Account → Access Tokens; borrar la variable; revisar el registro de auditoría de Supabase. |
| STRIPE-04 | **Crítica** | `lib/products.ts` usa `price_…` de una tercera cuenta; la cuenta live tiene 0 precios | Abierto · corrección en PR #69 (borrador) | Completar las puertas del PR #69. |
| STRIPE-01 | **Crítica** | Tres webhooks live; uno escribe en un proyecto Supabase antiguo | Abierto | Revisar las entregas en el Dashboard, elegir el endpoint autoritativo y retirar los demás tras verificarlo. |
| ENV-01 | **Crítica** | 12 variables `readable-secret` y el token de AI Gateway (NT-20) sin rotar | Abierto | Rotar en cada proveedor, de una en una, con plan de reversión. |
| ENV-04 | Alta | `STRIPE_MCP_KEY` aceptada como respaldo de `STRIPE_SECRET_KEY` | **Corrección en PR #74** | Fusionar tras comprobar `STRIPE_SECRET_KEY` en Production. |
| ENV-03 | Alta | Configuración de Supabase duplicada (`SUPABASE_URL`, `_2`, `_3`, varias claves); el cliente admin podía apuntar a otro proyecto | **Corrección en PR #74** | Antes de fusionar: confirmar que las 3 variables únicas apuntan al mismo proyecto. Después: borrar los alias. |
| ENV-02 | Alta | Variables `NEXT_PUBLIC_POSTGRES_*`, `NEXT_PUBLIC_SUPABASE_JWT_SECRET`, `NEXT_PUBLIC_NEXT_PUBLIC_*` | Abierto (el código no las lee; tras el PR #74 se comprueba con un test) | Borrarlas y rotar la contraseña de Postgres y el JWT secret si eran reales. |
| OPS-02 | Alta | Sin copia de seguridad propia ni restauración probada; MFA de administradores sin verificar | En curso (PR #71, borrador) | Credenciales R2 limitadas al bucket, fijar versiones y hacer una prueba de restauración completa. |
| OPS-03 | Media | Puente de secretos de GitHub: la build de Workers falla por falta de `package-lock.json` | En curso (PR #72, borrador) | Lockfile preparado; pendiente de autorizar su subida. Después: secretos del Worker en tiempo de ejecución. |
| APP-01 | Alta | Checkout, portal, webhooks y suscripciones sin prueba end-to-end | Abierto (issue #43, PR #69) | Prueba en el preview con Stripe test. |
| NT-06 | Alta | Autorización real del panel admin sin probar | Abierto | Probar con una cuenta admin sintética y otra normal. El PR #74 añade bloqueo de `/admin` si falta configuración. |
| AUTH-01 | Alta | Protección contra contraseñas filtradas desactivada (requiere plan Pro) | Limitación del plan | Mantener los controles gratuitos. |
| APP-02 | Media | Sin CSP | Abierto | Preparar en modo Report-Only (Stripe, EmailJS, GA, Meta, PostHog) → enforcement. |
| PRIV-01 | Media | Botones de cookies y datos del prestador | `main` ya iguala los botones y minimiza la dirección; **PR #66 sin conflictos**, solo añade el test de regresión | Fusionar el #66. |
| DEP-02 | Media | Dependabot propuso TypeScript 7.0.2 (rompe la build: TS5108 `target=ES5`) | **PR #70 cerrado; PR #73** fija TS 6.0.3, target ES2017 y Node 22–24 | Fusionar el #73. |
| DEP-03 | Media | React 18 obsoleto en Next.js 16 (se eliminará en Next 17) | Abierto | Planificar la migración a React 19 en un PR aparte. |
| COM-01 | Media | Precios incoherentes entre la web/`main` y el catálogo de test del PR #69 | Abierto | Ver `docs/DYNAMIC_PRICING_DESIGN.md`. |
| FIS-01 | Bloqueante comercial | 0 registros fiscales en Stripe; alta censal, IVA e IRPF sin confirmar | Abierto | Ver `docs/FISCAL_TAX_DESIGN_2026-10-25.md`; revisión por asesor. |
| DEP-01 / NT-01 | — | El alias de producción no estaba en el último commit | **Cerrado 31-oct** | Alias en `294862e` verificado por la API de Vercel. |
| DB-05, OPS-01, NT-05, NT-17, NT-19 | — | Privilegios de tabla, protección de `main`, estados de suscripción, nulabilidad de pagos | Cerrados previamente | Mantener. |

## PR abiertos (31-oct)

| PR | Tipo | Estado |
|---|---|---|
| #69 | Checkout, catálogo por *lookup key*, webhooks idempotentes, RLS de preview | Borrador · CI verde |
| #71 | Copia cifrada de Supabase a R2 | Borrador · no ejecutar hasta probar la restauración |
| #72 | Puente de secretos de GitHub (Cloudflare Worker) | Borrador · HOLD |
| #66 | Test de igualdad de los botones de cookies | Sin conflictos |
| #73 | TypeScript 6.0.3 + `engines` | Listo para revisión |
| #74 | Una sola clave de Stripe y una sola configuración de Supabase | Listo para revisión · requiere comprobar variables antes de fusionar |

## Acciones del titular (no automatizables con el acceso actual)

1. Revocar el token `sbp_…` y borrar esa variable (SEC-21).
2. Dar acceso a las herramientas a la organización de Supabase que contiene `qkzmpxyefuqdhyxwfjcw`, o hacer la auditoría desde su panel.
3. Confirmar las tres variables de Supabase y `STRIPE_SECRET_KEY` antes de fusionar el #74.
4. Decidir el webhook autoritativo (STRIPE-01).
5. Rotar los secretos de ENV-01 en cada proveedor.
6. Verificar MFA en GitHub, Vercel, Supabase, Stripe y Cloudflare.

## Regla de cierre

Una incidencia se cierra solo con evidencia: un cambio revisado, CI verde, una prueba funcional y, si afecta a producción, una comprobación del dominio. Los secretos nunca se copian en issues, commits ni conversaciones.
