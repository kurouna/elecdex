import type { TimedValue } from '../widgets/common/chart-types.ts'

/**
 * A rolling window of readings for a chart.
 *
 * Raw state reassigned on each push, so a chart sees one change per sample
 * rather than one per array operation. Duplicate timestamps are ignored, which
 * matters because a re-subscription replays the last cached sample.
 */
export class TimeSeries {
  points = $state.raw<TimedValue[]>([])
  private readonly keepMs: number

  constructor(keepMs: number) {
    this.keepMs = keepMs
  }

  push(at: number, v: number): void {
    const last = this.points[this.points.length - 1]
    if (last !== undefined && at <= last.at) return
    const cutoff = at - this.keepMs
    const kept = this.points.filter((p) => p.at >= cutoff)
    kept.push({ at, v: Number.isFinite(v) ? v : 0 })
    this.points = kept
  }
}
