import type { KeyNote, KeyPress, ViewContext, Voice } from '../elecdex-plugin'
import type { Settings } from './app'
import type { Chart } from './chart'
import { keyOf, NOTE_KEYS, noteName } from './keyboard'
import { loopBetween, nextWindow } from './schedule'

/**
 * FREE mode: the keyboard as an instrument, nothing falling and nothing judged. A key sounds
 * while it is held, Space is the sustain pedal, the arrows move the keys an octave and change
 * the tone, and any track's band can play underneath, going round, to play over.
 *
 * What is played rises from the keys as trails and is named as a chord where it makes one;
 * the drawing is draw/free.ts, and this holds only the state and what the keys do to it.
 */

export const TONES: readonly { voice: Voice; name: string }[] = [
  { voice: 'epiano', name: 'E.PIANO' },
  { voice: 'piano', name: 'PIANO' },
  { voice: 'lead', name: 'SYNTH LEAD' },
  { voice: 'chip', name: 'CHIP' },
  { voice: 'pluck', name: 'PLUCK' },
  { voice: 'pad', name: 'PAD' },
  { voice: 'bass', name: 'BASS' },
]

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
  tone?: string
  octave?: number
}

export class FreePlay {
  tone = 0
  octave = 0
  pedal = false
  backing: Backing | null = null
  trails: Trail[] = []
  played: PlayedNote[] = []
  private readonly held = new Map<string, Trail>()
  private readonly ctx: ViewContext<Settings, unknown>
  private readonly chartOf: (index: number) => Chart | null
  private readonly tracks: number

  constructor(
    ctx: ViewContext<Settings, unknown>,
    chartOf: (index: number) => Chart | null,
    tracks: number,
  ) {
    this.ctx = ctx
    this.chartOf = chartOf
    this.tracks = tracks
    const lead = TONES.findIndex((t) => t.voice === ctx.settings.lead)
    this.tone = Math.max(0, lead)
  }

  restore(saved: FreeSaved | undefined): void {
    const tone = TONES.findIndex((t) => t.voice === saved?.tone)
    if (tone >= 0) this.tone = tone
    if (typeof saved?.octave === 'number') this.octave = clampOctave(saved.octave)
  }

  saved(): FreeSaved {
    return { tone: TONES[this.tone]?.voice ?? 'epiano', octave: this.octave }
  }

  get toneName(): string {
    return TONES[this.tone]?.name ?? ''
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

  /** Every key held while down, in the chosen tone and octave. */
  bind(): void {
    const volume = Math.min(1, Math.max(0, this.ctx.settings.volume / 100))
    const voice = TONES[this.tone]?.voice ?? 'epiano'
    const note = (pitch: number): KeyNote => ({
      voice,
      pitch: pitch + 12 * this.octave,
      level: 0.85 * volume,
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
    if (code.startsWith('Arrow')) return this.shift(code)
    this.band(code, at)
    return null
  }

  /** The arrows: left and right move the keys an octave, up and down change the tone. */
  private shift(code: string): 'changed' | null {
    if (code === 'ArrowLeft' || code === 'ArrowRight') {
      this.octave = clampOctave(this.octave + (code === 'ArrowLeft' ? -1 : 1))
    } else {
      const by = code === 'ArrowUp' ? -1 : 1
      this.tone = (this.tone + by + TONES.length) % TONES.length
    }
    this.bind()
    return 'changed'
  }

  /**
   * Enter starts or stops the band; a digit picks one of the first nine tracks' bands, 0
   * stops it; comma and period (< and >) step to the track before or after, round the list.
   */
  private band(code: string, at: number): void {
    if (code === 'Enter') {
      if (this.backing === null) this.startBacking(0, at)
      else this.stopBacking()
      return
    }
    if (code === 'Comma' || code === 'Period') {
      this.stepBacking(code === 'Period' ? 1 : -1, at)
      return
    }
    const digit = /^Digit(\d)$/.exec(code)?.[1]
    if (digit === '0') this.stopBacking()
    else if (digit !== undefined) this.startBacking(Number(digit) - 1, at)
  }

  /** The next or the previous track's band; with none playing, the first or the last. */
  private stepBacking(by: 1 | -1, at: number): void {
    if (this.tracks === 0) return
    const from = this.backing?.index ?? (by === 1 ? -1 : this.tracks)
    this.startBacking((from + by + this.tracks) % this.tracks, at)
  }

  private press(code: string, pitch: number, at: number): void {
    const trail = { code, pitch: pitch + 12 * this.octave, start: at, end: null }
    this.held.set(code, trail)
    this.trails.push(trail)
    const label = this.ctx.keys.labels[code] ?? code
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

const clampOctave = (octave: number): number =>
  Math.min(OCTAVES, Math.max(-OCTAVES, Math.round(octave)))
