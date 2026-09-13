/**
 * Chart data types, in a plain module so `.ts` files can import them - tsc does
 * not see types exported from a Svelte component's module script.
 */

/** One reading at a moment in time. */
export interface TimedValue {
  /** Epoch milliseconds. */
  at: number
  v: number
}

export interface ChartSeries {
  points: readonly TimedValue[]
  /** 'accent' draws at full strength, 'dim' at half. */
  tone?: 'accent' | 'dim'
  /**
   * Plot the negated values - the download half of eDEX-UI's traffic graph,
   * drawn below the zero axis while upload is drawn above it.
   */
  inverted?: boolean
}
