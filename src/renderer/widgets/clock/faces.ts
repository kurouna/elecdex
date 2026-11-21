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
  {
    id: 'longitude',
    label: 'longitude',
    summary:
      "The time, and the world's time zones lit where it is day, with cities and their times.",
    component: LongitudeFace,
  },
  {
    id: 'week',
    label: 'week',
    summary:
      "The time, and this week's days with their dates, today lit and each day filling as it goes.",
    component: WeekFace,
  },
  {
    id: 'ahead',
    label: 'ahead',
    summary:
      'The time, and the next 24 hours on a log scale with your alarms and tasks falling due.',
    component: AheadFace,
  },
  {
    id: 'tape',
    label: 'tape',
    summary: 'The time, and the day as a tape of ticks running ahead, the night as a band.',
    component: TapeFace,
  },
  {
    id: 'digital',
    label: 'digital',
    summary: 'Large rolling digits with the zone beside them: the face elecdex began with.',
    component: DigitalFace,
  },
  {
    id: 'segment',
    label: 'segment',
    summary: 'Seven-segment digits, like a vacuum fluorescent display.',
    component: SegmentFace,
  },
  {
    id: 'vector',
    label: 'vector',
    summary: 'Thin single-stroke digits, redrawn as if by a plotter as they change.',
    component: VectorFace,
  },
  {
    id: 'dial',
    label: 'dial',
    summary: 'An analogue dial, with the time, seconds and zone on one line beside it.',
    component: DialFace,
  },
  {
    id: 'karman',
    label: 'karman',
    summary:
      'A wind tunnel: smoke flows round the digits into vortices, solved ten times a second.',
    heavy: true,
    component: KarmanFace,
  },
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
