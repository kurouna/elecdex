import { DEFAULT_CLOCK_FACE } from '@shared/settings'
import AheadFace from './faces/ahead/AheadFace.svelte'
import DialFace from './faces/dial/DialFace.svelte'
import DigitalFace from './faces/digital/DigitalFace.svelte'
import KarmanFace from './faces/karman/KarmanFace.svelte'
import LongitudeFace from './faces/longitude/LongitudeFace.svelte'
import SegmentFace from './faces/segment/SegmentFace.svelte'
import TapeFace from './faces/tape/TapeFace.svelte'
import VectorFace from './faces/vector/VectorFace.svelte'
import WeekFace from './faces/week/WeekFace.svelte'
import type { ClockFace } from './types.js'

/**
 * Every face of the CLOCK pane, in the order the settings dialog lists them. A face is a folder
 * under faces/ and a row here: the pane and the dialog read only this table, so adding one
 * touches nothing else. The designs, and the faces not taken, are in docs/clock-faces-mock.
 */
export const CLOCK_FACES: readonly ClockFace[] = [
  { id: 'week', label: 'week', component: WeekFace },
  { id: 'ahead', label: 'ahead', component: AheadFace },
  { id: 'tape', label: 'tape', component: TapeFace },
  { id: 'longitude', label: 'longitude', component: LongitudeFace },
  { id: 'digital', label: 'digital', component: DigitalFace },
  { id: 'segment', label: 'segment', component: SegmentFace },
  { id: 'vector', label: 'vector', component: VectorFace },
  { id: 'dial', label: 'dial', component: DialFace },
  { id: 'karman', label: 'karman', heavy: true, component: KarmanFace },
]

const byId = new Map(CLOCK_FACES.map((face) => [face.id, face]))

/**
 * The face for an id from settings. One the page does not know - removed in a later version, or
 * a hand edit - is drawn as the default, and the setting is left as it is.
 */
export function clockFace(id: string): ClockFace {
  return byId.get(id) ?? byId.get(DEFAULT_CLOCK_FACE) ?? (CLOCK_FACES[0] as ClockFace)
}

/** The name in the settings dialog's list: a face that uses more CPU says so. */
export const clockFaceName = (face: ClockFace): string =>
  face.heavy ? `${face.label} (uses more CPU)` : face.label
