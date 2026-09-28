import type { Voice } from '@shared/plugin-api'
import { PianoEngine } from '../piano/engine.js'
import type { InstrumentMaker } from './host.js'

/**
 * The instrument each voice on the audio thread is played by (instruments/catalog.ts names
 * which voices those are): the worklet's table, and the script's that writes WAV files.
 */
export const MAKERS: Partial<Record<Voice, InstrumentMaker>> = {
  piano: (rate) => new PianoEngine(rate),
}
