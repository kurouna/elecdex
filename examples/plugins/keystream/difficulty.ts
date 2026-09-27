/**
 * How hard a chart is, in stars from 1 to 5, worked out from its notes rather than written
 * by hand: how many a second on average, and how many in its busiest four seconds, half and
 * half - a track that is easy but for one run is harder than its average says. The window
 * of judgement is not counted: HARD has the notes of NORMAL, and its stars are the same.
 */

const BUSIEST_MS = 4000
/** Where each star begins, in notes a second (the mean of the average and the busiest). */
const STEPS = [2.0, 2.6, 3.3, 4.2] as const

/** Notes a second, the average and the busiest window's mean. */
export function busyness(times: readonly number[]): number {
  if (times.length < 2) return 0
  const span = ((times.at(-1) ?? 0) - (times[0] ?? 0)) / 1000
  const average = span > 0 ? times.length / span : 0
  let busiest = 0
  let from = 0
  for (let i = 0; i < times.length; i++) {
    while ((times[i] ?? 0) - (times[from] ?? 0) > BUSIEST_MS) from += 1
    busiest = Math.max(busiest, i - from + 1)
  }
  return (average + busiest / (BUSIEST_MS / 1000)) / 2
}

/** 1 to 5. */
export function starsOf(times: readonly number[]): number {
  const value = busyness(times)
  return 1 + STEPS.filter((step) => value >= step).length
}
