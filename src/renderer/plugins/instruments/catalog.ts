import type { Voice } from '@shared/plugin-api'
import { ringOf } from '../epiano/engine.js'
import { afterDecay, damperTime, hasDamper } from '../piano/model.js'

/** The guitar's delay echoes on after its note, and the longest a held note may be (30 s). */
const GUITAR_ECHO = 1.8
const LONGEST = 31

/**
 * What the page and the audio thread both know of each voice (docs/plugins.md section 13.8):
 * which are instruments on the audio thread rather than a recipe of nodes, which output of
 * the instruments' processor each is written to, how much of it goes to the room, and how
 * long a note of it can be heard - which the synthesiser needs to keep voices and to know
 * when the context may sleep.
 */

/** The processor's outputs: each goes on through what that instrument is heard through. */
export const BUSES = {
  /** The piano's strings, on to the soundboard. */
  piano: 0,
  /** The guitar's amplifier, on to the cabinet and the delay. */
  guitar: 1,
  /** Every other instrument, as it is heard. */
  plain: 2,
  /** What every instrument on `plain` sends to the room. */
  room: 3,
} as const

export const OUTPUTS = 4

export interface VoiceTraits {
  bus: 'piano' | 'guitar' | 'plain'
  /** How long a note given no length is held before it is let go, seconds. */
  ownLength: number
  /** Seconds it can still be heard after it starts, held. */
  ring(pitch: number): number
  /** Seconds it can still be heard after it is let go. */
  settle(pitch: number): number
}

/** The voices played by instruments on the audio thread; the rest are recipes (voices.ts). */
export const INSTRUMENTS: Partial<Record<Voice, VoiceTraits>> = {
  piano: {
    bus: 'piano',
    ownLength: 1.4,
    ring: (pitch) => Math.min(40, afterDecay(pitch) * 1.2),
    settle: (pitch) =>
      hasDamper(pitch) ? damperTime(pitch) * 1.6 : Math.min(40, afterDecay(pitch)),
  },
  guitar: {
    bus: 'guitar',
    ownLength: 1,
    // A held note feeds back and sustains for as long as it is held.
    ring: () => LONGEST,
    settle: () => 0.5 + GUITAR_ECHO,
  },
  epiano: {
    bus: 'plain',
    ownLength: 1.4,
    ring: (pitch) => ringOf(pitch) * 1.2,
    settle: () => 0.35,
  },
  // Held at its sustain step until let go, then down a step a frame: a quarter second.
  chip: { bus: 'plain', ownLength: 0.3, ring: () => LONGEST, settle: () => 0.3 },
  // The analogue patches (synth/engine.ts): held as long as a key is, then their release.
  lead: { bus: 'plain', ownLength: 0.5, ring: () => LONGEST, settle: () => 0.3 },
  bass: { bus: 'plain', ownLength: 0.25, ring: () => LONGEST, settle: () => 0.2 },
  pad: { bus: 'plain', ownLength: 2, ring: () => LONGEST, settle: () => 1.6 },
  pluck: { bus: 'plain', ownLength: 0.4, ring: () => 1.6, settle: () => 0.4 },
  kick: drum(0.9),
  snare: drum(0.5),
  clap: drum(0.6),
  hat: drum(0.12),
  openhat: drum(1.2),
  crash: drum(2.6),
  tom: drum(0.9),
}

/** A drum rings for its own length, let go or not (drums/machine.ts). */
function drum(length: number): VoiceTraits {
  return { bus: 'plain', ownLength: length, ring: () => length, settle: () => length }
}

/**
 * How much of each voice the room hears (the rest is dry): the sustained and the soft more,
 * the drums and the bass little, so the low end stays tight and the beat stays in front.
 */
export const ROOM_SEND: Readonly<Record<Voice, number>> = {
  piano: 0.2,
  epiano: 0.18,
  lead: 0.16,
  guitar: 0.14,
  chip: 0.05,
  bass: 0.03,
  pluck: 0.2,
  pad: 0.32,
  kick: 0.03,
  snare: 0.12,
  clap: 0.14,
  hat: 0.06,
  openhat: 0.08,
  crash: 0.12,
  tom: 0.1,
}

/** Whether a voice is an instrument on the audio thread. */
export const isInstrument = (voice: Voice): boolean => INSTRUMENTS[voice] !== undefined
