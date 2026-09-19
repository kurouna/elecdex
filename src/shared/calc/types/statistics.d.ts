/** Contract for `@calc/statistics`; implemented in ../vendor/statistics.ts. */

export interface CalcStatistics {
  count: number
  sum: number
  mean: number
  median: number
  min: number
  max: number
  range: number
  variance: number
  stdev: number
  populationVariance: number
  populationStdev: number
  q1: number
  q3: number
  product: number
  mode: number | null
}

/** Summarises a list of numbers, or null when there are none. */
export declare function summarize(values: number[]): CalcStatistics | null
