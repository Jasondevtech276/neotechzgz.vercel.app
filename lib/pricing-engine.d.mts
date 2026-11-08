export declare const VAT_RATE_ES: number
export declare const STRIPE_FEES_ES: Readonly<{ cardPercent: number; cardFixedCents: number; billingPercent: number; taxPercent: number }>
export declare const DEFAULT_RULES: Readonly<{ maxStepPercent: number; maxYearPercent: number; deadbandPercent: number; minDaysBetweenChanges: number }>
export type MarketRef = { code: string; weight: number; anchor: number; latest: number }
export type SkuState = {
  sku: string
  mode: 'payment' | 'subscription'
  anchorGrossCents: number
  currentGrossCents: number
  minGrossCents: number
  maxGrossCents: number
  unitCostCents: number | null
  minMarginPercent: number
  stripeTax?: boolean
  lastChangedAt?: string | null
  yearAgoGrossCents?: number | null
}
export type PriceDecision = {
  sku: string
  currentGrossCents: number
  action: 'skip' | 'keep' | 'change' | 'block'
  reason: string
  proposedGrossCents: number
  proposedNetCents?: number
  changePercent?: number
  factor: number | null
  clamps: string[]
}
export declare function grossFromNet(netCents: number, vatRate?: number): number
export declare function netFromGross(grossCents: number, vatRate?: number): number
export declare function costFloorGross(sku: Pick<SkuState, 'unitCostCents' | 'minMarginPercent' | 'mode' | 'stripeTax'>): number
export declare function roundGross(grossCents: number): number
export declare function marketFactor(refs: MarketRef[]): number | null
export declare function computePrice(sku: SkuState, refs: MarketRef[], options?: { now?: Date; rules?: Partial<typeof DEFAULT_RULES> }): PriceDecision
export declare function idempotencyKey(sku: string, now?: Date): string
export declare function subscriptionIndexation(input: { currentGrossCents: number; ipcAnnualPercent: number | null; ipsAnnualPercent: number | null; capPercent?: number }):
  | { action: 'skip'; reason: string }
  | { action: 'keep'; reason: string; percent: number }
  | { action: 'change'; percent: number; proposedGrossCents: number }
export declare function earliestEffectiveDate(noticeSentAt: string | Date, periodEnd: string | Date, noticeDays?: number): Date | null
export declare function parseIneSeries(json: unknown): { value: number; year: number; period: number; provisional: boolean } | null
