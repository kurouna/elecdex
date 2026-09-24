import type { MetricSample } from '@shared/metrics'
import {
  type CounterMark,
  primaryLink,
  pushPoint,
  toPoint,
  type WifiLink,
  type WifiPoint,
} from '@shared/wifi'

/** Counter marks kept: enough for a rate over the last minute. */
const MARKS_MS = 90_000

/**
 * The Wi-Fi pane's last hour, one point a second, kept in the page rather than
 * in the pane: moving a pane remounts it (CLAUDE.md, Remounts happen), and the
 * timeline should not start over when it does.
 *
 * Fed only while a pane is seen - the sources are not in `keepWhileHidden`, by
 * the user's choice (2026-09-25) - so the time it was not seen stays a gap on
 * the timeline rather than being filled in. Nothing is written to disk.
 */
class WifiHistory {
  points = $state.raw<WifiPoint[]>([])
  /** The followed link's frame counters, the last minute and a half. */
  marks = $state.raw<CounterMark[]>([])
  private previous: WifiLink | null = null
  private lastAt = 0

  /** Adds the second a sample stands for, once. */
  push(sample: MetricSample<'net.wifi'>, chosen: string | null): void {
    const { links, probe } = sample.data
    const at = probe?.at ?? Math.floor(sample.at / 1000) * 1000
    if (at <= this.lastAt) return
    const link = primaryLink(links, chosen)
    const point = toPoint(link, probe, at, this.previous)
    const counters = link?.counters ?? null
    // A counter from another adapter is no baseline for this one.
    const sameLink = this.previous?.id === link?.id
    this.previous = link
    this.lastAt = at
    this.points = pushPoint(this.points, point)
    this.marks =
      counters === null
        ? []
        : [...(sameLink ? this.marks.filter((m) => m.at > at - MARKS_MS) : []), { at, counters }]
  }

  /** For tests. */
  reset(): void {
    this.points = []
    this.marks = []
    this.previous = null
    this.lastAt = 0
  }
}

export const wifiHistory = new WifiHistory()
