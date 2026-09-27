/**
 * The wall clock's grid, for work main does on a timer (architecture.md §4.4):
 * one timer, armed for the next boundary after each run, never an interval, so
 * everything on a period lands on the same instants and a run that took long
 * does not push the next one off the grid.
 */

/** The next boundary of `period` strictly after `now`. */
export function nextBoundary(now: number, period: number): number {
  return (Math.floor(now / period) + 1) * period
}
