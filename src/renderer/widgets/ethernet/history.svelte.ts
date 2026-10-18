import type { EtherCounters, EtherLink, EtherPoint } from '@shared/ethernet'
import { toEtherPoint } from '@shared/ethernet'
import type { MetricSample } from '@shared/metrics'
import { pushPoint } from '@shared/netpath'

const NONE: readonly EtherPoint[] = []
const NO_MARKS: readonly CounterMark[] = []
/** Counter marks kept: enough for a rate over the last minute. */
const MARKS_MS = 90_000

/** Counters as they stood at a moment, for rates over the last minute. */
export interface CounterMark {
  at: number
  counters: EtherCounters
}

/**
 * Each counter's increase per minute, from the mark nearest a minute ago to the
 * latest; null for a counter not kept, with under ten seconds between the marks,
 * or across a reset.
 */
export function perMinute(
  marks: readonly CounterMark[],
): Partial<Record<keyof EtherCounters, number | null>> | null {
  const last = marks[marks.length - 1]
  if (last === undefined) return null
  const target = last.at - 60_000
  let first: CounterMark | undefined
  for (const m of marks)
    if (first === undefined || Math.abs(m.at - target) < Math.abs(first.at - target)) first = m
  if (first === undefined || last.at - first.at < 10_000) return null
  const minutes = (last.at - first.at) / 60_000
  const out: Partial<Record<keyof EtherCounters, number | null>> = {}
  for (const key of Object.keys(last.counters) as (keyof EtherCounters)[]) {
    const a = first.counters[key]
    const b = last.counters[key]
    out[key] = a === null || b === null || b < a ? null : (b - a) / minutes
  }
  return out
}

/**
 * The Ethernet pane's last hour, one point a second for every wired adapter,
 * kept in the page rather than in the pane: moving a pane remounts it (CLAUDE.md,
 * Remounts happen), and the timeline should not start over when it does. Each
 * adapter apart, so choosing another one shows its own history at once.
 *
 * It also keeps the best speed each adapter has had while watched: a link that
 * falls below it has downshifted, which is a fault; one that was always slower
 * than the adapter could go is the other end's, which is not.
 *
 * Fed only while a pane is seen - the source is not in `keepWhileHidden` - so the
 * time it was not seen stays a gap. Nothing is written to disk.
 */
class EtherHistory {
  /** Points by adapter id; replaced whole on each push, so readers see one change a second. */
  byLink = $state.raw<Record<string, EtherPoint[]>>({})
  /** The best speed each adapter has had while watched, Mb/s. */
  best = $state.raw<Record<string, number>>({})
  /** Each adapter's counters, the last minute and a half. */
  marksByLink = $state.raw<Record<string, CounterMark[]>>({})
  private readonly previous = new Map<string, { link: EtherLink; at: number }>()
  private lastAt = 0

  /** Adds the second a sample stands for, once, for every adapter in it. */
  push(sample: MetricSample<'net.ethernet'>): void {
    const { links, probe } = sample.data
    const at = probe?.at ?? Math.floor(sample.at / 1000) * 1000
    if (at <= this.lastAt) return
    this.lastAt = at
    const points = { ...this.byLink }
    let best = this.best
    const marks = { ...this.marksByLink }
    for (const link of links) {
      marks[link.id] =
        link.counters === null
          ? []
          : [
              ...(marks[link.id] ?? []).filter((m) => m.at > at - MARKS_MS),
              { at, counters: link.counters },
            ]
      points[link.id] = pushPoint(
        points[link.id] ?? [],
        toEtherPoint(link, probe, at, this.previous.get(link.id) ?? null),
      )
      this.previous.set(link.id, { link, at })
      const speed = link.state === 'up' ? link.speedMbps : null
      if (speed !== null && speed > (best[link.id] ?? 0)) best = { ...best, [link.id]: speed }
    }
    this.byLink = points
    this.best = best
    this.marksByLink = marks
  }

  marks(link: string | null): readonly CounterMark[] {
    return link === null ? NO_MARKS : (this.marksByLink[link] ?? NO_MARKS)
  }

  points(link: string | null): readonly EtherPoint[] {
    return link === null ? NONE : (this.byLink[link] ?? NONE)
  }

  bestSpeed(link: string | null): number | null {
    return link === null ? null : (this.best[link] ?? null)
  }

  /** For tests. */
  reset(): void {
    this.byLink = {}
    this.best = {}
    this.marksByLink = {}
    this.previous.clear()
    this.lastAt = 0
  }
}

export const etherHistory = new EtherHistory()
