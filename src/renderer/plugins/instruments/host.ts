import type { Voice } from '@shared/plugin-api'
import { BUSES, INSTRUMENTS, OUTPUTS, ROOM_SEND } from './catalog.js'
import { PeakLimiter } from './limiter.js'

/**
 * The instruments of one pane on the audio thread (docs/plugins.md section 13.8): a physical
 * piano, a guitar and its amplifier, and the rest, each an `Instrument` made the first time
 * its voice is asked for (or ahead of time, in a quiet block). The page posts strikes,
 * releases and the pedal by voice; the host passes each to its instrument and writes them to
 * the processor's outputs (catalog.ts), which the page passes through the soundboard, the
 * cabinet and the room.
 *
 * Pure, and free of the page and of Web Audio: the worklet, the tests and a script that
 * writes WAV files run the same code.
 */

/** A playable instrument: strikes, lets go of, and sounds the notes it is given. */
export interface Instrument {
  strike(id: number, pitch: number, level: number, pan: number, at: number): void
  release(id: number, at: number): void
  stop(id: number, at: number): void
  pedal(on: boolean, at: number): void
  stopAll(): void
  /** Adds `frames` samples from frame `from` into left and right. */
  render(left: Float32Array, right: Float32Array, frames: number, from: number): void
  readonly busy: boolean
}

export type InstrumentMaker = (sampleRate: number) => Instrument

/** What the page posts to the audio thread; times are the AudioContext's seconds. */
export type InstrumentMessage =
  | { t: 'strike'; voice: Voice; id: number; pitch: number; level: number; pan: number; at: number }
  | { t: 'release' | 'stop'; id: number; at: number }
  | { t: 'pedal'; on: boolean; at: number }
  | { t: 'silence' }

/**
 * Each output's ceiling: the piano's lower, as its soundboard can raise a spike a little
 * after the processor has limited it. The rest leave room for the room and the other panes.
 */
const CEILINGS = [0.8, 0.9, 0.9, 0.9] as const

/** Strikes remembered for their release: far more than can sound at once. */
const REMEMBERED = 4096

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

export class InstrumentHost {
  readonly sampleRate: number
  private readonly makers: Partial<Record<Voice, InstrumentMaker>>
  private readonly playing = new Map<Voice, Instrument>()
  /** Which voice each strike went to, for its release. */
  private readonly voiceOf = new Map<number, Voice>()
  private pedalDown = false
  private scratchL = new Float32Array(128)
  private scratchR = new Float32Array(128)
  /** A look-ahead limiter on each output, all with the same delay, so they stay in time. */
  private readonly limiters: PeakLimiter[]

  constructor(sampleRate: number, makers: Partial<Record<Voice, InstrumentMaker>>) {
    this.sampleRate = sampleRate
    this.makers = makers
    this.limiters = Array.from(
      { length: OUTPUTS },
      (_, i) => new PeakLimiter(sampleRate, CEILINGS[i] ?? 0.9),
    )
  }

  /** Carries out a message from the page, whatever the page sent: the thread must not throw. */
  receive(message: unknown): void {
    if (typeof message !== 'object' || message === null) return
    const m = message as Record<string, unknown>
    const at = Math.round(num(m.at) * this.sampleRate)
    if (m.t === 'strike')
      this.strike(m.voice, num(m.id), num(m.pitch), num(m.level), num(m.pan), at)
    else if (m.t === 'release' || m.t === 'stop') this.letGo(m.t, num(m.id), at)
    else if (m.t === 'pedal') this.setPedal(m.on === true, at)
    else if (m.t === 'silence') this.silence()
  }

  /** Whether anything sounds or waits to. */
  get busy(): boolean {
    for (const instrument of this.playing.values()) if (instrument.busy) return true
    return false
  }

  /** The instrument of a voice, if it has been made: for the tests. */
  instrument(voice: Voice): Instrument | undefined {
    return this.playing.get(voice)
  }

  /**
   * Writes `frames` samples from frame `from` to the outputs, each a pair of channels in the
   * order of BUSES; the room's output takes each plain instrument's share.
   */
  render(
    outputs: readonly (readonly [Float32Array, Float32Array])[],
    frames: number,
    from: number,
  ): void {
    if (this.scratchL.length < frames) {
      this.scratchL = new Float32Array(frames)
      this.scratchR = new Float32Array(frames)
    }
    const room = outputs[BUSES.room]
    for (const [voice, instrument] of this.playing) {
      const traits = INSTRUMENTS[voice]
      const bus = outputs[BUSES[traits?.bus ?? 'plain']]
      if (bus === undefined) continue
      if (traits?.bus !== 'plain' || room === undefined) {
        instrument.render(bus[0], bus[1], frames, from)
        continue
      }
      // A plain instrument is written once and shared between the dry output and the room's.
      const [l, r] = [this.scratchL, this.scratchR]
      l.fill(0, 0, frames)
      r.fill(0, 0, frames)
      instrument.render(l, r, frames, from)
      const send = ROOM_SEND[voice]
      for (let k = 0; k < frames; k++) {
        bus[0][k] = (bus[0][k] as number) + (l[k] as number)
        bus[1][k] = (bus[1][k] as number) + (r[k] as number)
        room[0][k] = (room[0][k] as number) + (l[k] as number) * send
        room[1][k] = (room[1][k] as number) + (r[k] as number) * send
      }
    }
    outputs.forEach(([l, r], i) => {
      this.limiters[i]?.process(l, r, frames)
    })
  }

  /** Makes one more voice's instrument, ahead of its first note: a quiet block's work. */
  warm(): void {
    for (const voice of Object.keys(this.makers) as Voice[]) {
      if (!this.playing.has(voice)) {
        this.instrumentFor(voice)
        return
      }
    }
  }

  private strike(
    voice: unknown,
    id: number,
    pitch: number,
    level: number,
    pan: number,
    at: number,
  ): void {
    if (typeof voice !== 'string' || !(voice in this.makers)) return
    const instrument = this.instrumentFor(voice as Voice)
    if (instrument === undefined) return
    this.voiceOf.set(id, voice as Voice)
    // Strikes are never told apart once their sound has gone, so the oldest are forgotten.
    if (this.voiceOf.size > REMEMBERED)
      this.voiceOf.delete(this.voiceOf.keys().next().value as number)
    instrument.strike(id, pitch, level, pan, at)
  }

  private letGo(kind: 'release' | 'stop', id: number, at: number): void {
    const voice = this.voiceOf.get(id)
    const instrument = voice === undefined ? undefined : this.playing.get(voice)
    if (instrument === undefined) return
    if (kind === 'release') instrument.release(id, at)
    else {
      instrument.stop(id, at)
      this.voiceOf.delete(id)
    }
  }

  private setPedal(on: boolean, at: number): void {
    this.pedalDown = on
    for (const instrument of this.playing.values()) instrument.pedal(on, at)
  }

  private silence(): void {
    for (const instrument of this.playing.values()) instrument.stopAll()
    this.voiceOf.clear()
  }

  private instrumentFor(voice: Voice): Instrument | undefined {
    let instrument = this.playing.get(voice)
    if (instrument === undefined) {
      instrument = this.makers[voice]?.(this.sampleRate)
      if (instrument === undefined) return undefined
      // An instrument made while the pedal is down starts with it down.
      if (this.pedalDown) instrument.pedal(true, 0)
      this.playing.set(voice, instrument)
    }
    return instrument
  }
}
