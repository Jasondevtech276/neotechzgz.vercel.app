# Precios automáticos según mercado — diseño propuesto

**Fecha:** 31-oct-2026 · **Estado:** propuesta de diseño, sin implementar · **Requisito previo:** PR #69 fusionado (catálogo por *lookup key*).

## Objetivo

Recalcular los precios del catálogo de forma automática (sin edición manual), con una cadencia fija, a partir de señales de mercado verificables y con límites que eviten errores, abusos o incumplimientos.

## Restricciones verificadas

1. **Stripe no permite editar el importe de un Price.** Para cambiarlo se crea un Price nuevo y se le transfiere la *lookup key* con `transfer_lookup_key=true` (de forma atómica). Las suscripciones existentes siguen con su Price anterior hasta que se migren de forma explícita. Fuentes: https://docs.stripe.com/products-prices/manage-prices y https://docs.stripe.com/api/prices/create
2. **Consumidores (España):** son abusivas las cláusulas que permiten al empresario subir el precio sin razones objetivas ni derecho a resolver. Sí se admite adaptar el precio a un **índice legal** si el contrato describe explícitamente el modo de variación (art. 85.3 y 85.10 del TRLGDCU). Fuente: https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555
3. **Anuncios de rebaja:** si se anuncia una reducción, hay que mostrar el precio más bajo aplicado en los 30 días anteriores (art. 20 de la Ley 7/1996, según el RDL 24/2021; art. 6 bis de la Directiva 98/6/CE). Hay que **guardar el historial de precios**. Fuente: https://comercio.gob.es/ComercioInterior/EjercicioActividadComercial/Paginas/Actividades-de-promoci%C3%B3n-de-ventas.aspx
4. **No existe una API pública fiable de tarifas de servicios IT en Zaragoza.** Recoger automáticamente datos de webs de la competencia tiene riesgos legales (condiciones de uso, base de datos) y de calidad. Por eso no se propone como entrada automática.

## Señales de entrada

| Señal | Fuente | Frecuencia | Uso |
|---|---|---|---|
| IPC de servicios (índice legal) | API JSON del INE, `servicios.ine.es/wstempus/js/ES/DATOS_SERIE/{serie}` — https://ine.es/dyngs/DAB/index.htm?cid=1100 | Mensual | Indexación base: es el único factor válido para suscripciones vigentes |
| Referencia de mercado | Tabla `market_references` revisada cada trimestre (p. ej., informes de Malt, tarifas publicadas que se citen con su URL y fecha) | Trimestral | Define **suelo y techo** por SKU; no mueve el precio directamente |
| Demanda | Solicitudes de presupuesto/semana (`quotes`) | Semanal | Factor de demanda acotado |
| Capacidad | Horas comprometidas / horas disponibles | Semanal | Factor de ocupación acotado |
| Coste | Coste/hora interno + margen mínimo | Manual (raro) | Suelo absoluto |

## Algoritmo

Para cada SKU \(i\) en el ciclo \(t\):

\[
P^{*}_{i,t} = P^{base}_{i} \cdot \frac{IPC_t}{IPC_0} \cdot f_{dem} \cdot f_{cap}
\]

- \(f_{dem} = 1 + k_d \cdot \tanh\big((D_t - \bar D)/\bar D\big)\), con \(k_d \le 0{,}05\)
- \(f_{cap} = 1 + k_c \cdot (U_t - 0{,}75)\), con \(k_c \le 0{,}10\) y la ocupación \(U_t\) acotada en \([0,1]\)
- Límites: \(P_{i,t} = \mathrm{clamp}\big(P^{*}_{i,t},\ \max(\text{suelo}_{mercado}, \text{coste}\cdot(1+m_{min})),\ \text{techo}_{mercado}\big)\)
- Variación máxima por ciclo: ±5 % frente a \(P_{i,t-1}\)
- Redondeo comercial: al múltiplo de 5 € (horas) o de 1 € (planes); evitar cambios menores de 2 %, que solo generan ruido

## Cadencia recomendada

- **Servicios sueltos (por hora, desarrollo web):** **mensual**. Una cadencia semanal complica la regla de los 30 días cuando hay rebajas y puede confundir a quien pide un presupuesto.
- **Suscripciones nuevas:** mensual (el Price nuevo solo se aplica a altas nuevas).
- **Suscripciones vigentes:** solo indexación por IPC, **una vez al año**, con aviso previo al cliente (≥ 30 días) y derecho a cancelar sin penalización. La cláusula tiene que estar en las condiciones.
- **Presupuestos emitidos:** se respetan durante su periodo de validez (p. ej., 30 días).

## Implementación (Vercel + Supabase + Stripe)

1. **Tablas (migración):** `pricing_config` (base, suelo, techo, coste, margen, `k_d`, `k_c`), `market_references`, `price_history` (SKU, importe, `price_id`, desde/hasta, motivo, entradas usadas) y `price_runs` (registro de cada ejecución).
2. **Cron de Vercel:** `0 6 2 * *` (día 2 de cada mes, después de que el INE publique el IPC adelantado). Protegido con `CRON_SECRET`, igual que la purga.
3. **Ejecución:** lee las señales → calcula → guarda la propuesta en `price_runs`.
4. **Modo** (`PRICING_AUTOMATION_MODE`): `off` (por defecto) · `propose` (avisa por email y un administrador aprueba en `/admin`) · `auto` (aplica dentro de los límites).
5. **Aplicar:** `stripe.prices.create({ product, unit_amount, currency: 'eur', lookup_key, transfer_lookup_key: true, tax_behavior })` → desactivar el Price anterior (`active=false`) → insertar en `price_history`. Clave de idempotencia = `pricing:{sku}:{yyyy-mm}`.
6. **Web:** las páginas `/servicios` y `/planes` leen el precio por *lookup key* (con caché e ISR, revalidando al aplicar).
7. **Protecciones:** si falta una señal o está desactualizada (IPC con más de 60 días), se mantiene el precio anterior; ningún cambio supera ±5 %; existe un interruptor de corte; primero se ejecuta solo en Stripe **test**.

## Lo que no hace

- No sube los precios de suscripciones vigentes sin aviso ni derecho a resolver.
- No recoge automáticamente precios de competidores.
- No decide el IVA: el precio mostrado debe ser el **final** para consumidores, según la configuración fiscal pendiente (FIS-01).

## Pasos

1. Fusionar el PR #69 (*lookup keys*).
2. Fijar los precios base, suelos y techos (decisión comercial) y su fuente de referencia.
3. Elegir la serie del IPC (servicios / grupo ECOICOP) y \(IPC_0\).
4. Implementar en un PR aparte, en modo `propose` y Stripe test, durante 2 ciclos.
5. Revisar las condiciones de contratación (cláusula de indexación) con un asesor antes de pasar a `auto` en live.
