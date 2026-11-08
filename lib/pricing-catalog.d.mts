export declare const PRICING_ANCHOR: Readonly<{ date: string; refs: ReadonlyArray<{ code: string; label: string; weight: number; anchor: number }> }>
export type CatalogEntry = {
  sku: string
  lookupKey: string
  mode: 'payment' | 'subscription'
  unit: string
  anchorGrossCents: number
  minGrossCents: number
  maxGrossCents: number
  unitCostCents: number | null
  minMarginPercent: number
}
export declare const PRICING_CATALOG: ReadonlyArray<CatalogEntry>
