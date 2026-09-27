import type { Voice } from '../elecdex-plugin'
import { type Chord, lift, parseChord, voicing } from './harmony'
import { BEATS_PER_BAR, type Score } from './notation'

/**
 * The band: everything under the melody, written for each song. A song's `band` has a few
 * sections - a bar of drums, a bass line and chord hits, each sixteen sixteenths - and a
 * form that says which section every bar plays. The pitched parts follow the bar's chords.
 *
 * Written by hand for each song rather than made from a style, so the band leans on the
 * beats the tune leans on: a player finds the beat in it rather than fighting it.
 */

export type DrumVoice = 'kick' | 'snare' | 'clap' | 'hat' | 'openhat' | 'tom' | 'crash'
const DRUM_VOICES: readonly DrumVoice[] = [
  'kick',
  'snare',
  'clap',
  'hat',
  'openhat',
  'tom',
  'crash',
]

export interface Section {
  /** Drums: 'x' a hit, 'o' a softer one, '.' nothing; sixteen to a bar. */
  kick?: string
  snare?: string
  clap?: string
  hat?: string
  openhat?: string
  tom?: string
  crash?: string
  /** The bass: 'r' the chord's bass, 'o' an octave up, '5' its fifth, '3' its third, '-' holds, '.' rests. */
  bass?: string
  /** Chord hits: 'x' strikes the chord, 'o' softer, '-' holds, '.' rests. */
  comp?: string
  /** An arpeggio: each 'x' the chord's next note going up, '-' holds, '.' rests. */
  arp?: string
  /** The chord held under the whole bar. */
  pad?: boolean
}

export interface Band {
  sections: Readonly<Record<string, Section>>
  /**
   * The section each bar plays, one name a bar ('|' only for reading). A name followed by
   * '*' opens with a cymbal; by '!', its last beat is a snare roll into the next bar.
   */
  form: string
  /** The voice of the chord hits; an electric piano when left out. */
  comp?: Voice
  /** The tune again, `bars` later, as a round: the band sings it after the player. */
  round?: { bars: number; voice: Voice; level: number }
  /** What the tom is tuned to, as a MIDI note. */
  tom?: number
}

export interface Part {
  voice: Voice
  pitch: number
  beat: number
  /** Null for the voice's own length (drums). */
  beats: number | null
  level: number
  pan: number
}

interface BarPlan {
  section: Section
  crash: boolean
  roll: boolean
}

const STEPS = 16
const STEP = BEATS_PER_BAR / STEPS

const DRUM_LEVEL: Readonly<Record<DrumVoice, number>> = {
  kick: 0.95,
  snare: 0.7,
  clap: 0.5,
  hat: 0.4,
  openhat: 0.34,
  tom: 0.7,
  crash: 0.5,
}
const DRUM_PAN: Readonly<Record<DrumVoice, number>> = {
  kick: 0,
  snare: 0,
  clap: 0.1,
  hat: 0.25,
  openhat: -0.25,
  tom: -0.1,
  crash: 0.2,
}

const hitLevel = (char: string | undefined): number => (char === 'x' ? 1 : char === 'o' ? 0.55 : 0)

/** The form read into a plan per bar, and what in it does not add up. */
export function readForm(band: Band): { bars: BarPlan[]; problems: string[] } {
  const problems: string[] = []
  for (const [name, section] of Object.entries(band.sections)) {
    for (const [part, line] of Object.entries(section)) {
      if (typeof line === 'string' && line.length !== STEPS) {
        problems.push(`section ${name}: ${part} has ${line.length} steps, not ${STEPS}`)
      }
    }
  }
  const bars: BarPlan[] = []
  for (const token of band.form.replace(/\|/g, ' ').split(/\s+/)) {
    if (token === '') continue
    const [, name = '', marks = ''] = /^([^*!]+)([*!]*)$/.exec(token) ?? []
    const section = band.sections[name]
    if (section === undefined) problems.push(`the form names "${token}", which is not a section`)
    bars.push({ section: section ?? {}, crash: marks.includes('*'), roll: marks.includes('!') })
  }
  return { bars, problems }
}

/** The chord sounding at a step of a bar: a bar holds one chord, or one per half. */
function chordAt(symbols: readonly string[], step: number): Chord | null {
  const index = Math.min(symbols.length - 1, Math.floor((step / STEPS) * symbols.length))
  return parseChord(symbols[index] ?? '')
}

/** How many steps a note struck at `step` lasts: itself and the '-' after it. */
function heldFor(line: string, step: number): number {
  let length = 1
  while (line[step + length] === '-') length += 1
  return length
}

export function arrange(score: Score): Part[] {
  const band = score.source.band
  const { bars } = readForm(band)
  const parts: Part[] = []
  bars.forEach((plan, bar) => {
    if (bar >= score.bars) return
    const at = { start: bar * BEATS_PER_BAR, chords: score.chords[bar] ?? [] }
    drums(plan, at.start, band.tom ?? 45, parts)
    bass(plan.section.bass, at, parts)
    comp(plan.section.comp, band.comp ?? 'epiano', at, parts)
    arpeggio(plan.section.arp, at, parts)
    if (plan.section.pad) pad(at, parts)
  })
  if (band.round) round(score, band.round, parts)
  return parts.sort((a, b) => a.beat - b.beat)
}

interface BarAt {
  start: number
  chords: readonly string[]
}

function drumHit(voice: DrumVoice, beat: number, strength: number, pitch = 60): Part {
  return {
    voice,
    pitch,
    beat,
    beats: null,
    level: DRUM_LEVEL[voice] * strength,
    pan: DRUM_PAN[voice],
  }
}

/** Where a roll starts: the last beat of the bar. */
const ROLL_FROM = 12

/** A bar's drums: its lines, a cymbal to open it, a roll to close it. */
function drums(plan: BarPlan, start: number, tom: number, parts: Part[]): void {
  for (const voice of DRUM_VOICES) drumLine(voice, plan, start, voice === 'tom' ? tom : 60, parts)
  if (plan.crash) parts.push(drumHit('crash', start, 1))
  if (!plan.roll) return
  for (let step = ROLL_FROM; step < STEPS; step++) {
    parts.push(drumHit('snare', start + step * STEP, 0.45 + (step - ROLL_FROM) * 0.18))
  }
}

function drumLine(voice: DrumVoice, plan: BarPlan, start: number, pitch: number, parts: Part[]) {
  const line = plan.section[voice]
  if (line === undefined) return
  // Under a roll, only the kick keeps the last beat.
  const steps = plan.roll && voice !== 'kick' ? ROLL_FROM : STEPS
  for (let step = 0; step < steps; step++) {
    const strength = hitLevel(line[step])
    if (strength > 0) parts.push(drumHit(voice, start + step * STEP, strength, pitch))
  }
}

function bass(line: string | undefined, at: BarAt, parts: Part[]): void {
  if (line === undefined) return
  for (let step = 0; step < STEPS; step++) {
    const char = line[step] ?? '.'
    const chord = chordAt(at.chords, step)
    if (chord === null || !'ro53'.includes(char)) continue
    parts.push({
      voice: 'bass',
      pitch: bassPitch(chord, char),
      beat: at.start + step * STEP,
      beats: heldFor(line, step) * STEP * 0.85,
      level: 0.72,
      pan: 0,
    })
  }
}

function bassPitch(chord: Chord, char: string): number {
  const root = lift(chord.bass, 36)
  if (char === 'o') return root + 12
  const interval = char === '5' ? 7 : char === '3' ? (chord.tones[1] ?? 4) : 0
  return interval === 0 ? root : lift((chord.root + interval) % 12, 36)
}

/** Chord hits under the tune, below it, so the tune stands clear. */
function comp(line: string | undefined, voice: Voice, at: BarAt, parts: Part[]): void {
  if (line === undefined) return
  for (let step = 0; step < STEPS; step++) {
    const strength = hitLevel(line[step])
    const chord = strength > 0 ? chordAt(at.chords, step) : null
    if (chord === null) continue
    for (const pitch of voicing(chord, 50)) {
      parts.push({
        voice,
        pitch,
        beat: at.start + step * STEP,
        beats: heldFor(line, step) * STEP * 0.9,
        level: 0.3 * strength,
        pan: 0.15,
      })
    }
  }
}

/** An arpeggio above the tune, quiet: the chord's notes one after another, going up. */
function arpeggio(line: string | undefined, at: BarAt, parts: Part[]): void {
  if (line === undefined) return
  let n = 0
  for (let step = 0; step < STEPS; step++) {
    if (line[step] !== 'x') continue
    const chord = chordAt(at.chords, step)
    if (chord === null) continue
    const tones = [...voicing(chord, 76), lift(chord.root, 76) + 12]
    parts.push({
      voice: 'pluck',
      pitch: tones[n % tones.length] ?? 76,
      beat: at.start + step * STEP,
      beats: heldFor(line, step) * STEP * 0.9,
      level: 0.24,
      pan: n % 2 === 0 ? -0.3 : 0.3,
    })
    n += 1
  }
}

function pad(at: BarAt, parts: Part[]): void {
  const span = BEATS_PER_BAR / Math.max(1, at.chords.length)
  at.chords.forEach((symbol, i) => {
    const chord = parseChord(symbol)
    if (chord === null) return
    for (const pitch of voicing(chord, 48)) {
      parts.push({
        voice: 'pad',
        pitch,
        beat: at.start + i * span,
        beats: span * 0.96,
        level: 0.45,
        pan: 0,
      })
    }
  })
}

/** The tune again, `bars` later, in another voice: a round, as FROG CHORUS is sung. */
function round(score: Score, echo: NonNullable<Band['round']>, parts: Part[]): void {
  const shift = echo.bars * BEATS_PER_BAR
  const end = score.bars * BEATS_PER_BAR
  for (const note of score.notes) {
    if (note.beat + shift >= end) continue
    parts.push({
      voice: echo.voice,
      pitch: note.pitch,
      beat: note.beat + shift,
      beats: note.beats * 0.9,
      level: echo.level,
      pan: -0.2,
    })
  }
}
