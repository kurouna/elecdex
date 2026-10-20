import { type CounterMark, type PathProbe, pushPoint } from '@shared/netpath'

/** Counter marks kept: enough for a rate over the last minute. */
const MARKS_MS = 90_000

/** The answer for no adapter: one array, so a reader's derived value does not change for it. */
const NONE: readonly never[] = []

/** What the history needs of an adapter: its id, and the counters its rates come from. */
export interface HistoryLink<C> {
  id: string
  counters: C | null
}

/** A sample of the pane's source: every adapter, and the echo round they share. */
export interface HistorySample<L> {
  at: number
  data: { links: readonly L[]; probe: PathProbe | null }
}

/** The reading before, of the same adapter, and the second it stood for. */
export interface Previous<L> {
  link: L
  at: number
}

/**
 * A network pane's last hour, one point a second for every adapter, kept in the
 * page rather than in the pane: moving a pane remounts it (CLAUDE.md, Remounts
 * happen), and the timeline should not start over when it does. Kept for each
 * adapter apart, so choosing another one in the pane shows its own history at
 * once, with its own gateway's echoes. The Wi-Fi and Ethernet panes each have
 * one; what a point is, is theirs (`toPoint`).
 *
 * Fed only while a pane is seen - the sources are not in `keepWhileHidden`, by
 * the user's choice (2026-09-25) - so the time it was not seen stays a gap on
 * the timeline rather than being filled in. Nothing is written to disk.
 */
export class PathHistory<C, L extends HistoryLink<C>, P extends { at: number }> {
  /** Points by adapter id; replaced whole on each push, so readers see one change a second. */
  byLink = $state.raw<Record<string, P[]>>({})
  /** Each adapter's counters, the last minute and a half. */
  marksByLink = $state.raw<Record<string, CounterMark<C>[]>>({})
  private readonly toPoint: (
    link: L,
    probe: PathProbe | null,
    at: number,
    before: Previous<L> | null,
  ) => P
  private readonly previous = new Map<string, Previous<L>>()
  private lastAt = 0

  constructor(
    toPoint: (link: L, probe: PathProbe | null, at: number, before: Previous<L> | null) => P,
  ) {
    this.toPoint = toPoint
  }

  /** Adds the second a sample stands for, once, for every adapter in it. */
  push(sample: HistorySample<L>): void {
    const { links, probe } = sample.data
    const at = probe?.at ?? Math.floor(sample.at / 1000) * 1000
    if (at <= this.lastAt) return
    this.lastAt = at
    const points = { ...this.byLink }
    const marks = { ...this.marksByLink }
    for (const link of links) {
      points[link.id] = pushPoint(
        points[link.id] ?? [],
        this.toPoint(link, probe, at, this.previous.get(link.id) ?? null),
      )
      marks[link.id] =
        link.counters === null
          ? []
          : [
              ...(marks[link.id] ?? []).filter((m) => m.at > at - MARKS_MS),
              { at, counters: link.counters },
            ]
      this.previous.set(link.id, { link, at })
    }
    this.byLink = points
    this.marksByLink = marks
    this.took(links)
  }

  /** What a pane keeps besides, from the adapters of a second taken. */
  protected took(_links: readonly L[]): void {}

  points(link: string | null): readonly P[] {
    return link === null ? NONE : (this.byLink[link] ?? NONE)
  }

  marks(link: string | null): readonly CounterMark<C>[] {
    return link === null ? NONE : (this.marksByLink[link] ?? NONE)
  }

  /** For tests. */
  reset(): void {
    this.byLink = {}
    this.marksByLink = {}
    this.previous.clear()
    this.lastAt = 0
  }
}
