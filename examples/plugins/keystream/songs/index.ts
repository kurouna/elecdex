import type { SongSource } from '../notation'
import { song as afterglow } from './afterglow'
import { song as bootSequence } from './boot-sequence'
import { song as frogChorus } from './frog-chorus'
import { song as galopInfernal } from './galop-infernal'
import { song as heartProtocol } from './heart-protocol'
import { song as loopback } from './loopback'
import { song as mountainKing } from './mountain-king'
import { song as neonCircuit } from './neon-circuit'
import { song as odeToJoy } from './ode-to-joy'
import { song as overclock } from './overclock'
import { song as packetStorm } from './packet-storm'
import { song as pixelRush } from './pixel-rush'
import { song as sakuraSignal } from './sakura-signal'
import { song as swanLake } from './swan-lake'
import { song as symphony40 } from './symphony-40'
import { song as turkishMarch } from './turkish-march'
import { song as twinkle } from './twinkle'
import { song as zeroGravity } from './zero-gravity'

/**
 * The tracks, easiest first: in order of their stars on NORMAL (difficulty.ts, which a unit
 * test holds the list to), and within a star as they were placed. Ten are elecdex's own;
 * eight are tunes in the public domain in arrangements of elecdex's own. A new song is a
 * file here and a line in this list, with its genre (genres.ts) for the menu's tabs; its band
 * is written with it (arrange.ts), from the bars in parts.ts.
 */
export const SONGS: readonly SongSource[] = [
  twinkle,
  afterglow,
  frogChorus,
  odeToJoy,
  bootSequence,
  sakuraSignal,
  swanLake,
  overclock,
  neonCircuit,
  loopback,
  heartProtocol,
  symphony40,
  galopInfernal,
  zeroGravity,
  packetStorm,
  mountainKing,
  turkishMarch,
  pixelRush,
]
