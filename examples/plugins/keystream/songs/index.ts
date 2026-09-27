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
 * The tracks, easiest first. Ten are elecdex's own; eight are tunes in the public domain in
 * arrangements of elecdex's own. A new song is a file here and a line in this list; its band
 * is written with it (arrange.ts), from the bars in parts.ts.
 */
export const SONGS: readonly SongSource[] = [
  twinkle,
  frogChorus,
  odeToJoy,
  bootSequence,
  sakuraSignal,
  swanLake,
  galopInfernal,
  neonCircuit,
  afterglow,
  loopback,
  heartProtocol,
  symphony40,
  zeroGravity,
  mountainKing,
  packetStorm,
  turkishMarch,
  pixelRush,
  overclock,
]
