import type { Elec16 } from '@shared/elec16/machine'
import { createPark } from '../emu/park.ts'

/**
 * Where an ELEC-16 pane's machine waits while its pane is remounted (docs/emu.md): a moved
 * pane takes it back as it was, mid-program, its RAM and screen with it.
 */
export interface ParkedElec16 {
  machine: Elec16
  /** Paused by the player when it went (out of sight, it would pause anyway). */
  paused: boolean
  /** The unit it is: the pane still holds it while it waits here. */
  unit: string
}

export const { park, claim } = createPark<ParkedElec16>()
