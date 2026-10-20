import { median } from '../netpath.js'
import type { EtherPoint } from './points.js'

/**
 * Small helpers the figures, the events and the timeline share. Not part of the
 * pane's face: index.ts does not export this file.
 */

export const isUp = (p: EtherPoint): boolean => p.state === 'up'

export function sum(values: readonly (number | null)[]): number {
  return values.reduce<number>((a, v) => a + (v ?? 0), 0)
}

export function medianOf(values: readonly (number | null)[]): number | null {
  const got = values.filter((v): v is number => v !== null).sort((a, b) => a - b)
  return median(got)
}

/** The gateway answering and the internet not, by this adapter: the way out gone. */
export function wayOutLost(p: EtherPoint): boolean {
  return p.route === 'default' && p.internet === null && typeof p.gateway === 'number'
}

export function maxOf(values: readonly (number | null)[]): number | null {
  const got = values.filter((v): v is number => v !== null)
  return got.length === 0 ? null : Math.max(...got)
}
