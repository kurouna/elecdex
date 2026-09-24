import type { MetricSample } from '@shared/metrics'
import { type CounterMark, pushPoint, toPoint, type WifiLink, type WifiPoint } from '@shared/wifi'

/** Counter marks kept: enough for a rate over the last minute. */
const MARKS_MS = 90_000

const NONE: readonly WifiPoint[] = []
const NO_MARKS: readonly CounterMark[] = []

/**
 * The Wi-Fi pane's last hour, one point a second for every adapter, kept in the
 * page rather than in the pane: moving a pane remounts it (CLAUDE.md, Remounts
 * happen), and the timeline should not start over when it does. Kept for each
 * adapter apart, so choosing another one in the pane shows its own history at
 * once, with its own gateway's echoes.
 *
 * Fed only while a pane is seen - the sources are not in `keepWhileHidden`, by
 * the user's choice (2026-09-25) - so the time it was not seen stays a gap on
 * the timeline rather than being filled in. Nothing is written to disk.
 */
class WifiHistory {
  /** Points by adapter id; replaced whole on each push, so readers see one change a second. */
  byLink = $state.raw<Record<string, WifiPoint[]>>({})
  /** Each adapter's frame counters, the last minute and a half. */
  marksByLink = $state.raw<Record<string, CounterMark[]>>({})
  private readonly previous = new Map<string, WifiLink>()
  private lastAt = 0

  /** Adds the second a sample stands for, once, for every adapter in it. */
  push(sample: MetricSample<'net.wifi'>): void {
    const { links, probe } = sample.data
    const at = probe?.at ?? Math.floor(sample.at / 1000) * 1000
    if (at <= this.lastAt) return
    this.lastAt = at
    const points = { ...this.byLink }
    const marks = { ...this.marksByLink }
    for (const link of links) {
      points[link.id] = pushPoint(
        points[link.id] ?? [],
        toPoint(link, probe, at, this.previous.get(link.id) ?? null),
      )
      marks[link.id] =
        link.counters === null
          ? []
          : [
              ...(marks[link.id] ?? []).filter((m) => m.at > at - MARKS_MS),
              { at, counters: link.counters },
            ]
      this.previous.set(link.id, link)
    }
    this.byLink = points
    this.marksByLink = marks
  }

  points(link: string | null): readonly WifiPoint[] {
    return link === null ? NONE : (this.byLink[link] ?? NONE)
  }

  marks(link: string | null): readonly CounterMark[] {
    return link === null ? NO_MARKS : (this.marksByLink[link] ?? NO_MARKS)
  }

  /** For tests. */
  reset(): void {
    this.byLink = {}
    this.marksByLink = {}
    this.previous.clear()
    this.lastAt = 0
  }
}

export const wifiHistory = new WifiHistory()
