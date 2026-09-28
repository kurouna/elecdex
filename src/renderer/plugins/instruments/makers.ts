import type { Voice } from '@shared/plugin-api'
import { drumMakers } from '../drums/machine.js'
import { EPianoEngine } from '../epiano/engine.js'
import { GuitarEngine } from '../guitar/engine.js'
import { PianoEngine } from '../piano/engine.js'
import type { InstrumentMaker } from './host.js'

/**
 * The instrument each voice on the audio thread is played by (instruments/catalog.ts names
 * which voices those are), made afresh for each host: instruments of one pane may share
 * something (the closed hi-hat chokes the open one), those of two panes never.
 */
export function makers(): Partial<Record<Voice, InstrumentMaker>> {
  return {
    piano: (rate) => new PianoEngine(rate),
    guitar: (rate) => new GuitarEngine(rate),
    epiano: (rate) => new EPianoEngine(rate),
    ...drumMakers(),
  }
}
