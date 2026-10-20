import { bucketsOf, type Column, echoLoss, meanOf, type Spread, spread } from '../netpath.js'
import { quickDropPoints } from './figures.js'
import { isUp, maxOf } from './parts.js'
import type { EtherPoint } from './points.js'

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

/** A stretch of the timeline drawn as one column. */
export interface EtherBucket extends Column {
  /** The lowest speed in the column while up; null when it was never up. */
  speed: number | null
  /** The link was down at some second of the column. */
  down: boolean
  errors: number | null
  broadcast: number | null
  gateway: Spread | null
  internet: Spread | null
  /** Echoes lost to the internet by this adapter, 0-100. */
  loss: number | null
  up: number | null
  downBytes: number | null
}

export function etherBuckets(
  points: readonly EtherPoint[],
  from: number,
  to: number,
  count: number,
): EtherBucket[] {
  const quick = quickDropPoints(points)
  return bucketsOf(points, from, to, count, (column) => {
    const speeds = column
      .filter(isUp)
      .map((p) => p.speed)
      .filter((s): s is number => s !== null)
    return {
      speed: speeds.length === 0 ? null : Math.min(...speeds),
      down: column.some((p) => p.state === 'no-carrier' || quick.has(p)),
      errors: maxOf(column.map((p) => p.errors)),
      broadcast: maxOf(column.map((p) => p.broadcast)),
      gateway: spread(column.map((p) => p.gateway)),
      internet: spread(column.map((p) => p.internet)),
      // Only by this adapter: an echo with no way out known is drawn, never a loss.
      loss: echoLoss(column.filter((p) => p.route === 'default').map((p) => p.internet)),
      up: meanOf(column.map((p) => p.up)),
      downBytes: meanOf(column.map((p) => p.down)),
    }
  })
}
