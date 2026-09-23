import type { OrbitElements } from '@shared/orbits'
import {
  degreesLat,
  degreesLong,
  eciToGeodetic,
  gstime,
  propagate,
  type SatRec,
  twoline2satrec,
} from '../../lib/sgp4.js'

/**
 * Where the Starlink satellites are, worked out a slice at a time.
 *
 * Measured over the 10,689 satellites CelesTrak listed on 2026-09-23: making
 * their SGP4 records takes 76 ms and placing them all 51 ms - a visible hitch
 * if done in one go. So each second's frame does a slice (SLICE satellites),
 * and each satellite is placed again every ten seconds or so; in ten seconds
 * one moves less than the width of its dot on any map this pane draws.
 *
 * A Web Worker was built first and dropped: the page's CSP admits only blob
 * workers, and in development Vite serves a worker by URL, and a blob worker
 * cannot import the modules it would need - so the dots were missing there.
 */

/** Satellites placed (or given records) per frame: about 5 ms of a second. */
export const SLICE = 1100

export class StarlinkField {
  readonly names: readonly string[]
  /** Latitude and longitude, two floats per satellite, in the order of `names`; NaN where not placed. */
  readonly positions: Float32Array
  private readonly records: (SatRec | null)[] = []
  private readonly elements: readonly OrbitElements[]
  private next = 0

  constructor(elements: readonly OrbitElements[]) {
    this.elements = elements.filter((e) => e.tle !== null)
    this.names = this.elements.map((e) => e.name)
    this.positions = new Float32Array(this.elements.length * 2).fill(Number.NaN)
  }

  /** Satellites with a position, for the tests and the title. */
  placed(): number {
    let n = 0
    for (let i = 0; i < this.positions.length; i += 2)
      if (!Number.isNaN(this.positions[i] ?? Number.NaN)) n += 1
    return n
  }

  get size(): number {
    return this.elements.length
  }

  /** The record behind satellite `i`, made on first use. */
  record(i: number): SatRec | null {
    if (i >= this.records.length) {
      for (let k = this.records.length; k <= i; k += 1) {
        const tle = this.elements[k]?.tle
        try {
          this.records.push(tle ? twoline2satrec(tle[0], tle[1]) : null)
        } catch {
          this.records.push(null)
        }
      }
    }
    return this.records[i] ?? null
  }

  /** Places the next slice of satellites at `now`, going round the list. */
  step(now: number, slice = SLICE): void {
    if (this.size === 0) return
    const at = new Date(now)
    const gmst = gstime(at)
    for (let n = 0; n < Math.min(slice, this.size); n += 1) {
      const i = this.next
      this.next = (this.next + 1) % this.size
      const satrec = this.record(i)
      const r = satrec === null ? null : propagate(satrec, at)?.position
      if (!r || typeof r === 'boolean') {
        this.positions[i * 2] = Number.NaN
        continue
      }
      const geo = eciToGeodetic(r, gmst)
      this.positions[i * 2] = degreesLat(geo.latitude)
      this.positions[i * 2 + 1] = degreesLong(geo.longitude)
    }
  }
}
