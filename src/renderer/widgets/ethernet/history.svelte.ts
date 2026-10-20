import type { EtherCounters, EtherLink, EtherPoint } from '@shared/ethernet'
import { toEtherPoint } from '@shared/ethernet'
import type { CounterMark as Mark } from '@shared/netpath'
import { PathHistory } from '../netpath/history.svelte.ts'

/** Counters as they stood at a moment, for rates over the last minute (netpath's `perMinute`). */
export type CounterMark = Mark<EtherCounters>

/**
 * The Ethernet pane's last hour (netpath's `PathHistory`): a point a second for
 * every wired adapter, its rates counted over the seconds since the reading before.
 *
 * It also keeps the best speed each adapter has had while watched: a link that
 * falls below it has downshifted, which is a fault; one that was always slower
 * than the adapter could go is the other end's, which is not.
 */
class EtherHistory extends PathHistory<EtherCounters, EtherLink, EtherPoint> {
  /** The best speed each adapter has had while watched, Mb/s. */
  best = $state.raw<Record<string, number>>({})

  constructor() {
    super(toEtherPoint)
  }

  protected override took(links: readonly EtherLink[]): void {
    let best = this.best
    for (const link of links) {
      const speed = link.state === 'up' ? link.speedMbps : null
      if (speed !== null && speed > (best[link.id] ?? 0)) best = { ...best, [link.id]: speed }
    }
    this.best = best
  }

  bestSpeed(link: string | null): number | null {
    return link === null ? null : (this.best[link] ?? null)
  }

  /** For tests. */
  override reset(): void {
    super.reset()
    this.best = {}
  }
}

export const etherHistory = new EtherHistory()
