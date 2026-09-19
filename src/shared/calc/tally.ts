import { parseNumbersInText } from '@calc/numbers'
import { type CalcStatistics, summarize } from '@calc/statistics'
import { type CalcValue, calcValue } from './evaluate.js'

/**
 * The tally: numbers pulled out of pasted text and summarised.
 *
 * The reading and the summary are the vendor's, with their own tests - a date is
 * not torn into signed parts, digits inside identifiers are not counted. What is
 * added here is the shape the pane draws: the values already formatted, and the
 * histogram bins, which are a drawing decision and do not belong in the summary.
 */

/** Numbers beyond this are ignored: a paste that large is not something to tally. */
export const TALLY_MAX_NUMBERS = 20_000

export interface TallyReport {
  /** How many numbers were read; never zero (an empty read gives null instead). */
  count: number
  /** True when the text held more numbers than were read. */
  truncated: boolean
  stats: CalcStatistics
  /** The named figures the pane prints, in the order it prints them. */
  figures: readonly { label: string; value: CalcValue }[]
  /** Counts per bin, left to right, for the histogram. Empty when every value is equal. */
  bins: readonly number[]
  /** The values the five-number summary marks, as fractions of min..max. */
  box: { q1: number; median: number; q3: number } | null
}

/**
 * How many bins the histogram gets.
 *
 * Sturges' rule, clamped. Below 8 the shape of anything is a rectangle; above 32
 * the bars are thinner than the peak-hold line at the sizes a pane is opened at.
 */
function binCount(n: number): number {
  return Math.max(8, Math.min(32, Math.ceil(Math.log2(n) + 1)))
}

function histogram(values: readonly number[], min: number, max: number): readonly number[] {
  if (max === min) return []
  const count = binCount(values.length)
  const bins = new Array<number>(count).fill(0)
  const span = max - min
  for (const value of values) {
    // The maximum would land one past the last bin.
    const index = Math.min(count - 1, Math.floor(((value - min) / span) * count))
    bins[index] = (bins[index] ?? 0) + 1
  }
  return bins
}

/** Where a value sits between min and max, 0 to 1. */
const fraction = (value: number, min: number, max: number): number =>
  max === min ? 0.5 : (value - min) / (max - min)

/** Reads every number in `text` and summarises them, or null when there are none. */
export function tally(text: string): TallyReport | null {
  const all = parseNumbersInText(text)
  const values = all.length > TALLY_MAX_NUMBERS ? all.slice(0, TALLY_MAX_NUMBERS) : all
  const stats = summarize(values)
  if (stats === null) return null

  const figures = [
    { label: 'sum', value: calcValue(stats.sum) },
    { label: 'mean', value: calcValue(stats.mean) },
    { label: 'median', value: calcValue(stats.median) },
    { label: 'sd', value: calcValue(stats.stdev) },
    { label: 'min', value: calcValue(stats.min) },
    { label: 'max', value: calcValue(stats.max) },
    ...(stats.mode === null ? [] : [{ label: 'mode', value: calcValue(stats.mode) }]),
  ]

  return {
    count: stats.count,
    truncated: all.length > values.length,
    stats,
    figures,
    bins: histogram(values, stats.min, stats.max),
    box:
      stats.min === stats.max
        ? null
        : {
            q1: fraction(stats.q1, stats.min, stats.max),
            median: fraction(stats.median, stats.min, stats.max),
            q3: fraction(stats.q3, stats.min, stats.max),
          },
  }
}
