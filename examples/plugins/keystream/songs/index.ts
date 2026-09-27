import type { SongSource } from '../notation'
import { song as bootSequence } from './boot-sequence'
import { song as galopInfernal } from './galop-infernal'
import { song as mountainKing } from './mountain-king'
import { song as neonCircuit } from './neon-circuit'
import { song as odeToJoy } from './ode-to-joy'
import { song as overclock } from './overclock'
import { song as packetStorm } from './packet-storm'
import { song as symphony40 } from './symphony-40'

/**
 * The tracks, easiest first. Four are elecdex's own; four are tunes in the public domain in
 * arrangements of elecdex's own. A new song is a file here and a line in this list.
 */
export const SONGS: readonly SongSource[] = [
  odeToJoy,
  bootSequence,
  galopInfernal,
  neonCircuit,
  symphony40,
  mountainKing,
  packetStorm,
  overclock,
]
