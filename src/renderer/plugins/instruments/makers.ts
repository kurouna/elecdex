import type { Voice } from '@shared/plugin-api'
import { ChipEngine } from '../chip/engine.js'
import { drumMakers } from '../drums/machine.js'
import { BassEngine } from '../ebass/engine.js'
import { EPianoEngine } from '../epiano/engine.js'
import { GuitarEngine } from '../guitar/engine.js'
import { MarimbaEngine } from '../marimba/engine.js'
import { OrganEngine } from '../organ/engine.js'
import { PianoEngine } from '../piano/engine.js'
import { AnalogEngine } from '../synth/engine.js'
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
    chip: (rate) => new ChipEngine(rate),
    lead: (rate) => new AnalogEngine(rate, 'lead'),
    bass: (rate) => new AnalogEngine(rate, 'bass'),
    pad: (rate) => new AnalogEngine(rate, 'pad'),
    pluck: (rate) => new AnalogEngine(rate, 'pluck'),
    organ: (rate) => new OrganEngine(rate),
    marimba: (rate) => new MarimbaEngine(rate),
    ebass: (rate) => new BassEngine(rate),
    ...drumMakers(),
  }
}
