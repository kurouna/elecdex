import { columnsOf, meanOf, type Spread, spread } from '../netpath.js'
import { quickDropPoints } from './figures.js'
import { isUp, maxOf } from './parts.js'
import type { EtherPoint } from './points.js'

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

/** A stretch of the timeline drawn as one column. */
export interface EtherBucket {
  from: number
  to: number
  /** Points in the column; none is time the pane was not watched. */
  count: number
  /** The lowest speed in the column while up; null when it was never up. */
  speed: number | null
  /** The link was down at some second of the column. */
  down: boolean
  errors: number | null
  broadcast: number | null
  gateway: Spread | null
  internet: Spread | null
  /** Echoes lost to the internet, 0-100. */
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
  const width = (to - from) / Math.max(1, count)
  const quick = quickDropPoints(points)
  return columnsOf(points, from, to, count).map((column, i) => {
    const asked = column.filter((p) => p.internet !== undefined && p.route === 'default')
    const speeds = column
      .filter(isUp)
      .map((p) => p.speed)
      .filter((s): s is number => s !== null)
    return {
      from: from + i * width,
      to: from + (i + 1) * width,
      count: column.length,
      speed: speeds.length === 0 ? null : Math.min(...speeds),
      down: column.some((p) => p.state === 'no-carrier' || quick.has(p)),
      errors: maxOf(column.map((p) => p.errors)),
      broadcast: maxOf(column.map((p) => p.broadcast)),
      gateway: spread(column.map((p) => p.gateway)),
      internet: spread(column.map((p) => p.internet)),
      loss:
        asked.length === 0
          ? null
          : (asked.filter((p) => p.internet === null).length / asked.length) * 100,
      up: meanOf(column.map((p) => p.up)),
      downBytes: meanOf(column.map((p) => p.down)),
    }
  })
}
