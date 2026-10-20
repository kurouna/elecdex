import { meanOf, type Spread, spread } from '../netpath.js'
import type { WifiPoint } from './points.js'

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

/** A stretch of the timeline drawn as one column: a lane's lowest, middle and highest. */
export interface Bucket {
  from: number
  to: number
  /** Points in the column; none is time the pane was not watched. */
  count: number
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
  const width = (to - from) / Math.max(1, count)
  const columns: WifiPoint[][] = Array.from({ length: Math.max(1, count) }, () => [])
  for (const p of points) {
    if (p.at < from || p.at >= to) continue
    const i = Math.min(columns.length - 1, Math.floor((p.at - from) / width))
    columns[i]?.push(p)
  }
  return columns.map((column, i) => {
    const asked = column.filter((p) => p.internet !== undefined)
    return {
      from: from + i * width,
      to: from + (i + 1) * width,
      count: column.length,
      rssi: spread(column.map((p) => p.rssi)),
      retry: spread(column.map((p) => p.retry)),
      gateway: spread(column.map((p) => p.gateway)),
      internet: spread(column.map((p) => p.internet)),
      loss:
        asked.length === 0
          ? null
          : (asked.filter((p) => p.internet === null).length / asked.length) * 100,
      up: meanOf(column.map((p) => p.up)),
      down: meanOf(column.map((p) => p.down)),
    }
  })
}
