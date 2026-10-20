import { bucketsOf, type Column, echoLoss, meanOf, type Spread, spread } from '../netpath.js'
import type { WifiPoint } from './points.js'

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

/** A stretch of the timeline drawn as one column: a lane's lowest, middle and highest. */
export interface Bucket extends Column {
  rssi: Spread | null
  retry: Spread | null
  gateway: Spread | null
  internet: Spread | null
  /** Echoes lost to the internet in the bucket, 0-100. */
  loss: number | null
  up: number | null
  down: number | null
}

/**
 * The points between `from` and `to` in `count` equal columns - one second each
 * for the short windows, several for the long ones, so a spike still shows as a
 * column's top however many seconds share it. A column with no points is null
 * throughout: the gap stays a gap.
 */
export function bucketize(
  points: readonly WifiPoint[],
  from: number,
  to: number,
  count: number,
): Bucket[] {
  return bucketsOf(points, from, to, count, (column) => ({
    rssi: spread(column.map((p) => p.rssi)),
    retry: spread(column.map((p) => p.retry)),
    gateway: spread(column.map((p) => p.gateway)),
    internet: spread(column.map((p) => p.internet)),
    loss: echoLoss(column.map((p) => p.internet)),
    up: meanOf(column.map((p) => p.up)),
    down: meanOf(column.map((p) => p.down)),
  }))
}
