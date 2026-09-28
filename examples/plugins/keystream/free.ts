import type { KeyNote, KeyPress, ViewContext, Voice } from '../elecdex-plugin'
import type { Settings } from './app'
import type { Chart } from './chart'
import { keyOf, labelOf, NOTE_KEYS, noteName } from './keyboard'
import { loopBetween, nextWindow } from './schedule'

/**
 * FREE mode: the keyboard as an instrument, nothing falling and nothing judged. A key sounds
 * while it is held and Space is the sustain pedal. The row under the letters is a DAW's
 * musical typing: Z and X move the keys an octave, C and V play softer and harder. The
 * instrument is the number row's, as everywhere (instruments.ts). Any track's band can play
 * underneath, going round, to play over: the arrows (or < >) pick one, Enter starts and stops it.
 *
 * What is played rises from the keys as trails and is named as a chord where it makes one;
 * the drawing is draw/free.ts, and this holds only the state and what the keys do to it.
 */

/** How hard a key plays, softest to hardest: C and V step through them, as a DAW's do. */
export const STRENGTHS = [0.4, 0.55, 0.7, 0.85, 1] as const
const STRENGTH_AT_FIRST = 3

/** How many octaves the keys move each way. */
export const OCTAVES = 2
/** Milliseconds a trail takes to rise across the field. */
export const RISE_MS = 4000
const PLAYED_KEPT = 60

/** A note played: rising from its key while held, then floating up and away. */
export interface Trail {
  code: string
  pitch: number
  start: number
  end: number | null
}

export interface PlayedNote {
  label: string
  name: string
}

interface Backing {
  index: number
  chart: Chart
  /** When, on the view's clock, the loop began. */
  startAt: number
  /** How far into the loop what it plays has been sent. */
  sentTo: number
}

export interface FreeSaved {
  /** The instrument FREE PLAY once had of its own (before it became the whole game's). */
  tone?: string
  octave?: number
  strength?: number
}

export class FreePlay {
  octave = 0
  /** Which of STRENGTHS the keys play at. */
  strength = STRENGTH_AT_FIRST
  /** The band the arrows are on: the one playing, or the one Enter will start. */
  cursor = 0
  pedal = false
  backing: Backing | null = null
  trails: Trail[] = []
  played: PlayedNote[] = []
  private readonly held = new Map<string, Trail>()
  private readonly ctx: ViewContext<Settings, unknown>
  private readonly chartOf: (index: number) => Chart | null
  private readonly tracks: number
  private readonly voice: () => Voice

  constructor(
    ctx: ViewContext<Settings, unknown>,
    chartOf: (index: number) => Chart | null,
    tracks: number,
    voice: () => Voice,
  ) {
    this.ctx = ctx
    this.chartOf = chartOf
    this.tracks = tracks
    this.voice = voice
  }

  restore(saved: FreeSaved | undefined): void {
    if (typeof saved?.octave === 'number') this.octave = clampOctave(saved.octave)
    if (typeof saved?.strength === 'number') {
      this.strength = Math.min(STRENGTHS.length - 1, Math.max(0, Math.round(saved.strength)))
    }
  }

  saved(): FreeSaved {
    return { octave: this.octave, strength: this.strength }
  }

  /** The pitches held down now, lowest first. */
  get holding(): number[] {
    return [...this.held.values()].map((t) => t.pitch).sort((a, b) => a - b)
  }

  enter(): void {
    this.bind()
  }

  /** Leaves the mode: the band stops, the pedal comes up, the trails go. */
  leave(): void {
    this.stopBacking()
    this.setPedal(false)
    this.held.clear()
    this.trails = []
  }

  /** Every key held while down, on the instrument, in the octave and at the strength chosen. */
  bind(): void {
    const volume = Math.min(1, Math.max(0, this.ctx.settings.volume / 100))
    const voice = this.voice()
    const level = (STRENGTHS[this.strength] ?? 0.85) * volume
    const note = (pitch: number): KeyNote => ({
      voice,
      pitch: pitch + 12 * this.octave,
      level,
      hold: true,
    })
    this.ctx.keys.play(Object.fromEntries(NOTE_KEYS.map((k) => [k.code, note(k.pitch ?? 60)])))
  }

  /** A key: answers 'leave' when it asks to go back to the menu, and whether anything changed. */
  key(key: KeyPress): 'leave' | 'changed' | null {
    const played = keyOf(key.code)
    if (played?.pitch != null) {
      if (key.down) this.press(key.code, played.pitch, key.at)
      else this.lift(key.code, key.at)
      return null
    }
    if (key.code === 'Space') {
      this.setPedal(key.down)
      return null
    }
    return key.down ? this.command(key.code, key.at) : null
  }

  private command(code: string, at: number): 'leave' | 'changed' | null {
    if (code === 'Escape') return 'leave'
    const touch = TOUCH[code]
    if (touch !== undefined) return this.play(touch)
    this.band(code, at)
    return null
  }

  /** The row under the letters, as a DAW has it: the octave, and how hard the keys play. */
  private play(touch: Touch): 'changed' {
    if (touch.octave) this.octave = clampOctave(this.octave + touch.octave)
    if (touch.strength) {
      this.strength = Math.min(STRENGTHS.length - 1, Math.max(0, this.strength + touch.strength))
    }
    this.bind()
    return 'changed'
  }

  /**
   * The band: up and down (or < and >) move along the tracks, and change the band on the
   * way if one is playing; Enter starts the one chosen, or stops it.
   */
  private band(code: string, at: number): void {
    if (code === 'Enter') {
      if (this.backing === null) this.startBacking(this.cursor, at)
      else this.stopBacking()
      return
    }
    const by = STEP[code]
    if (by !== undefined) this.stepBacking(by, at)
  }

  /** The next or the previous track, round the list; its band plays if one was playing. */
  private stepBacking(by: 1 | -1, at: number): void {
    if (this.tracks === 0) return
    this.cursor = (this.cursor + by + this.tracks) % this.tracks
    if (this.backing !== null) this.startBacking(this.cursor, at)
  }

  private press(code: string, pitch: number, at: number): void {
    const trail = { code, pitch: pitch + 12 * this.octave, start: at, end: null }
    this.held.set(code, trail)
    this.trails.push(trail)
    const label = labelOf(this.ctx.keys.labels, code)
    this.played = [...this.played.slice(1 - PLAYED_KEPT), { label, name: noteName(trail.pitch) }]
  }

  private lift(code: string, at: number): void {
    const trail = this.held.get(code)
    if (trail === undefined) return
    trail.end = at
    this.held.delete(code)
  }

  setPedal(on: boolean): void {
    if (this.pedal === on) return
    this.pedal = on
    this.ctx.keys.sustain(on)
  }

  /** A track's band, going round from the next moment. Another track replaces it. */
  startBacking(index: number, now: number): void {
    const chart = index < this.tracks ? this.chartOf(index) : null
    if (chart === null) return
    this.cursor = index
    this.stopBacking()
    this.backing = { index, chart, startAt: now + 150, sentTo: 0 }
  }

  /** Stops the band. Stopping the pane's sound lets the pedal go too, so it is put back. */
  stopBacking(): void {
    if (this.backing === null) return
    this.backing = null
    this.ctx.sound.stop()
    if (this.pedal) this.ctx.keys.sustain(true)
  }

  /** Where the loop is, in milliseconds since it began; null with no band. */
  loopTime(now: number): number | null {
    return this.backing === null ? null : now - this.backing.startAt
  }

  /** Each frame: sends the band's next window, and lets trails that have risen away go. */
  frame(now: number): void {
    this.trails = this.trails.filter((t) => t.end === null || now - t.end < RISE_MS)
    const backing = this.backing
    if (backing === null) return
    const to = nextWindow(now - backing.startAt, backing.sentTo)
    if (to === null) return
    const volume = Math.min(1, Math.max(0, this.ctx.settings.volume / 100))
    const notes = loopBetween(backing.chart, backing.sentTo, to, {
      volume,
      heardAt: (time) => backing.startAt + time,
    })
    backing.sentTo = to
    if (notes.length > 0) this.ctx.sound.play(notes)
  }

  /** Whether anything moves: a key held, a trail rising, the band playing. */
  moving(): boolean {
    return this.backing !== null || this.held.size > 0 || this.trails.length > 0
  }
}

interface Touch {
  octave?: 1 | -1
  strength?: 1 | -1
}

/** What the row under the letters does: Z and X the octave, C and V the strength. */
const TOUCH: Readonly<Record<string, Touch>> = {
  KeyZ: { octave: -1 },
  KeyX: { octave: 1 },
  KeyC: { strength: -1 },
  KeyV: { strength: 1 },
}

/** The keys that move along the bands. */
const STEP: Readonly<Record<string, 1 | -1>> = {
  ArrowUp: -1,
  ArrowDown: 1,
  Comma: -1,
  Period: 1,
}

const clampOctave = (octave: number): number =>
  Math.min(OCTAVES, Math.max(-OCTAVES, Math.round(octave)))
