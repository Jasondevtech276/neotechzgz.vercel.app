# Precios dinámicos — implementación en modo TEST (2026-10-31)

Estado: **borrador, desactivado por defecto** (`PRICING_AUTOMATION_MODE=off`). Sólo opera contra Stripe TEST; la barrera Live está en código, no en una variable.

## 1. Tabla de precios propuesta (IVA 21 % incluido)

| SKU | Unidad | Mínimo | **Base** | Máximo | Base sin IVA |
|---|---|---:|---:|---:|---:|
| Soporte remoto | hora | 36 € | **48 €** | 60 € | 39,67 € |
| Soporte presencial | hora + desplazamiento aparte | 54 € | **66 €** | 90 € | 54,55 € |
| Desarrollo web | proyecto "desde" | 900 € | **1.450 €** | 3.000 € | 1.198,35 € |
| Consultoría IT | hora | 60 € | **85 €** | 110 € | 70,25 € |
| Análisis de sistemas | hora | 70 € | **95 €** | 120 € | 78,51 € |
| STARTER | mes (3 h) | 119 € | **149 €** | 179 € | 123,14 € |
| PROFESSIONAL | mes (8 h + visita) | 329 € | **399 €** | 479 € | 329,75 € |
| ENTERPRISE | mes, orientativo (Checkout bloqueado) | 799 € | **899 €** | 1.199 € | 742,98 € |

Impuestos:
- **IVA 21 %** (tipo general, servicios informáticos): incluido en el precio mostrado; obligatorio para consumidores (TRLGDCU art. 20 y 60).
- **Retención IRPF 15 % / 7 %** (sólo facturas B2B de profesional): no cambia el precio; se resta en factura como pago a cuenta.
- **IRPF / Impuesto sobre Sociedades** (directos): no se pueden "incluir" en un precio; se cubren con `minMarginPercent` (20 % por defecto) sobre el coste directo.
- **Comisiones Stripe** (peor caso: tarjeta premium EEE 2,8 % + 0,25 €, Billing 0,7 %, Tax 0,5 % si se activa): incluidas en el suelo de costes.
- `unitCostCents` = `null` hasta que NEOTECHZGZ aporte su coste real: sin ese dato no hay suelo de costes efectivo.

## 2. Algoritmo

```
factor   = Σ w_i · (índice_i actual / índice_i en ancla)       # por defecto 100 % IPS376 (INE CNAE 62)
objetivo = precio_base_con_IVA · factor
límites  = ±5 % por ciclo vs. precio vigente; ±10 % en 12 meses
redondeo = 1 € (<200 €), 5 € (<1.000 €), 10 € (resto)
clamp    = [mínimo, máximo]; nunca < suelo de costes (si coste > máximo → bloqueo)
banda    = cambios < 1 % se ignoran; máximo un cambio cada 85 días
```

Por qué IPS CNAE 62 y no el IPC: el IPC general sube un 4,9 % interanual (dato adelantado, oct-2026), pero los precios de "Programación y consultoría informática" sólo un 1,7 % (2T-2026). Indexar al IPC subiría precios por encima del mercado real del sector.

Ritmo: cron mensual (`0 6 2 * *`, día 2 a las 06:00 UTC). El IPS es trimestral, así que en la práctica los cambios son trimestrales.

Modos:
- `off`: no hace nada.
- `propose`: registra decisiones en Supabase sin tocar Stripe.
- `auto`: crea un Price nuevo en TEST (`tax_behavior=inclusive`, `transfer_lookup_key=true`, idempotencia `pricing:{sku}:{yyyy-mm}`) y archiva el anterior.

## 3. Suscripciones vigentes

- **Nunca** las modifica el cron: siguen en su Price antiguo (archivado).
- `lib/subscription-indexation.ts` propone una indexación anual con el **menor** entre IPC e IPS (tope 5 %, nunca negativa). La aplica sólo con aprobación humana explícita (`approvedBy`), mediante Subscription Schedule al final del periodo y con ≥30 días de preaviso.
- Requisito contractual: la cláusula de revisión debe describir el índice (TRLGDCU art. 85.3); si no, el cliente debe poder resolver sin penalización (art. 85.10 / 62).

## 4. Obligaciones al anunciar bajadas

Si se comunica una reducción ("antes/ahora"), debe mostrarse el precio más bajo de los 30 días anteriores (art. 20 Ley 7/1996, redacción RDL 24/2021). La vista `price_lowest_30d` lo calcula.

## 5. Antes de pasar a Live (no incluido aquí)

1. Aprobar la tabla del §1 y aportar costes reales.
2. Confirmar régimen fiscal (asesor) y registrar IVA en Stripe Tax.
3. Revisar condiciones de contratación (cláusula de indexación).
4. Ejecutar ≥1 ciclo en `propose` y ≥1 en `auto` en TEST, y revisar los registros.
5. Cambiar la barrera de código en un PR específico, con revisión.

## Fuentes

- INE IPS, tabla 79673 (IPS376 = 108,898 en 2T-2026; +1,7 % interanual): https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/79673 · nota de prensa: https://www.ine.es/dyngs/Prensa/IPS2T26.htm
- INE IPC base 2025 (IPC290751 = 104,978 en sep-2026; IPC290750 = +4,9 % en oct-2026, adelantado): https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/79181 · API: https://ine.es/dyngs/DAB/index.htm?cid=1100
- Mercado Zaragoza/España: https://www.cronoshare.com/servicios/informatico-domicilio/zaragoza/zaragoza · https://www.cronoshare.com/servicios/mantenimiento-informatico/zaragoza/zaragoza · https://baluidigital.es/shop/soporte-informatico/bolsa-horas-soporte-informatico/ · https://ics.com.es/blog/cuanto-cuesta-el-mantenimiento-informatico-para-empresas/ · https://kipmion.com/precio-soporte-informatico/ · https://lintagency.com/ · https://web-premium.es/precios.html · https://www.malt.es/t/barometro-tarifas · docs/audit/pricing-market-benchmark-2026-10-30.md
- Stripe: https://stripe.com/es/pricing · https://docs.stripe.com/products-prices/manage-prices · https://docs.stripe.com/billing/subscriptions/subscription-schedules
- Legal: TRLGDCU https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555 · reducción de precios https://comercio.gob.es/ComercioInterior/EjercicioActividadComercial/Paginas/Actividades-de-promoci%C3%B3n-de-ventas.aspx
