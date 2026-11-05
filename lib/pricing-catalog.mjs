// Precios base, mínimos y máximos — PROPUESTA pendiente de aprobación.
// Céntimos de euro, IVA 21 % INCLUIDO (precio final al consumidor).
// Fuentes y justificación: docs/DYNAMIC_PRICING_TEST_MODE.md
// unitCostCents = null hasta que NEOTECHZGZ facilite su coste directo real;
// sin coste no hay suelo de costes, sólo el mínimo de mercado.
export const PRICING_ANCHOR = Object.freeze({
  date: '2026-10-31',
  // Valores de referencia del INE en la fecha ancla (último dato publicado).
  refs: Object.freeze([
    { code: 'IPS376', label: 'IPS CNAE 62 Programación y consultoría informática (índice, base 2021)', weight: 1, anchor: 108.898 },
    { code: 'IPC290751', label: 'IPC general nacional (índice, base 2025)', weight: 0, anchor: 104.978 },
  ]),
})

export const PRICING_CATALOG = Object.freeze([
  { sku: 'remote-support', lookupKey: 'neotech_remote_support', mode: 'payment', unit: 'hora', anchorGrossCents: 4_800, minGrossCents: 3_600, maxGrossCents: 6_000, unitCostCents: null, minMarginPercent: 0.2 },
  { sku: 'onsite-support', lookupKey: 'neotech_onsite_support', mode: 'payment', unit: 'hora (desplazamiento aparte)', anchorGrossCents: 6_600, minGrossCents: 5_400, maxGrossCents: 9_000, unitCostCents: null, minMarginPercent: 0.2 },
  { sku: 'web-development', lookupKey: 'neotech_web_development', mode: 'payment', unit: 'proyecto "desde"', anchorGrossCents: 145_000, minGrossCents: 90_000, maxGrossCents: 300_000, unitCostCents: null, minMarginPercent: 0.2 },
  { sku: 'it-consulting', lookupKey: 'neotech_it_consulting', mode: 'payment', unit: 'hora', anchorGrossCents: 8_500, minGrossCents: 6_000, maxGrossCents: 11_000, unitCostCents: null, minMarginPercent: 0.2 },
  { sku: 'systems-analysis', lookupKey: 'neotech_systems_analysis', mode: 'payment', unit: 'hora', anchorGrossCents: 9_500, minGrossCents: 7_000, maxGrossCents: 12_000, unitCostCents: null, minMarginPercent: 0.2 },
  { sku: 'starter', lookupKey: 'neotech_plan_starter', mode: 'subscription', unit: 'mes (3 h)', anchorGrossCents: 14_900, minGrossCents: 11_900, maxGrossCents: 17_900, unitCostCents: null, minMarginPercent: 0.2 },
  { sku: 'professional', lookupKey: 'neotech_plan_professional', mode: 'subscription', unit: 'mes (8 h + visita)', anchorGrossCents: 39_900, minGrossCents: 32_900, maxGrossCents: 47_900, unitCostCents: null, minMarginPercent: 0.2 },
  { sku: 'enterprise', lookupKey: 'neotech_plan_enterprise', mode: 'subscription', unit: 'mes (orientativo; checkout bloqueado)', anchorGrossCents: 89_900, minGrossCents: 79_900, maxGrossCents: 119_900, unitCostCents: null, minMarginPercent: 0.2 },
])
