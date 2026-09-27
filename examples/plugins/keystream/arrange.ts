import type { Voice } from '../elecdex-plugin'
import { type Chord, lift, parseChord, voicing } from './harmony'
import { BEATS_PER_BAR, type Score } from './notation'
import { type DrumVoice, STYLES, type Style } from './styles'

/**
 * The band: everything under the melody, made from the song's chords, the energy of each
 * bar and its style. Written once per song; the chart turns beats into milliseconds.
 */

export interface Part {
  voice: Voice
  pitch: number
  beat: number
  /** Null for the voice's own length (drums). */
  beats: number | null
  level: number
  pan: number
}

const STEPS = 16
const STEP = BEATS_PER_BAR / STEPS

const DRUM_LEVEL: Readonly<Record<DrumVoice, number>> = {
  kick: 0.95,
  snare: 0.7,
  clap: 0.5,
  hat: 0.42,
  openhat: 0.36,
  tom: 0.7,
}
const DRUM_PAN: Readonly<Record<DrumVoice, number>> = {
  kick: 0,
  snare: 0,
  clap: 0.1,
  hat: 0.25,
  openhat: -0.25,
  tom: -0.1,
}

const hitLevel = (char: string | undefined): number => (char === 'x' ? 1 : char === 'o' ? 0.55 : 0)

const pattern = (byEnergy: readonly (string | null)[] | null, energy: number): string | null =>
  energy < 1 ? null : (byEnergy?.[energy - 1] ?? null)

/** The chord sounding at a step of a bar: a bar holds one chord, or one per half. */
function chordAt(symbols: readonly string[], step: number): Chord | null {
  const index = Math.min(symbols.length - 1, Math.floor((step / STEPS) * symbols.length))
  return parseChord(symbols[index] ?? '')
}

export function arrange(score: Score): Part[] {
  const style = STYLES[score.source.style]
  const parts: Part[] = []
  for (let bar = 0; bar < score.bars; bar++) {
    const energy = score.energy[bar] ?? 0
    const rising = (score.energy[bar + 1] ?? 0) > energy && energy > 0
    const lifted = bar > 0 && energy > (score.energy[bar - 1] ?? 0) && energy >= 2
    const at = { bar, energy, chords: score.chords[bar] ?? [] }
    drums(style, at, rising, parts)
    // A cymbal where the band lifts into a louder part.
    if (lifted) {
      parts.push({
        voice: 'crash',
        pitch: 60,
        beat: bar * BEATS_PER_BAR,
        beats: null,
        level: 0.55,
        pan: 0.2,
      })
    }
    bass(style, at, parts)
    harmony(style, at, parts)
  }
  return parts.sort((a, b) => a.beat - b.beat)
}

interface BarAt {
  bar: number
  energy: number
  chords: readonly string[]
}

function drumHit(voice: DrumVoice, beat: number, strength: number): Part {
  return {
    voice,
    pitch: 60,
    beat,
    beats: null,
    level: DRUM_LEVEL[voice] * strength,
    pan: DRUM_PAN[voice],
  }
}

/** The drums of a bar; its last beat a snare roll when the next bar lifts. */
function drums(style: Style, at: BarAt, rising: boolean, parts: Part[]): void {
  const start = at.bar * BEATS_PER_BAR
  for (const [voice, byEnergy] of Object.entries(style.drums) as [DrumVoice, ByEnergyOf][]) {
    const bar = pattern(byEnergy, at.energy)
    // Under a roll, only the kick keeps its last beat.
    const steps = rising && voice !== 'kick' ? 12 : STEPS
    if (bar !== null) drumLine(voice, bar, steps, start, style.tom, parts)
  }
  if (!rising) return
  for (let step = 12; step < STEPS; step++) {
    parts.push(drumHit('snare', start + step * STEP, 0.45 + (step - 12) * 0.18))
  }
}

type ByEnergyOf = readonly (string | null)[]

function drumLine(
  voice: DrumVoice,
  bar: string,
  steps: number,
  start: number,
  tom: number,
  parts: Part[],
): void {
  for (let step = 0; step < steps; step++) {
    const strength = hitLevel(bar[step])
    if (strength === 0) continue
    const hit = drumHit(voice, start + step * STEP, strength)
    parts.push(voice === 'tom' ? { ...hit, pitch: tom } : hit)
  }
}

/** The bass line: each character a note of the chord under it, held by '-'. */
function bass(style: Style, at: BarAt, parts: Part[]): void {
  const line = pattern(style.bass, at.energy)
  if (line === null) return
  const start = at.bar * BEATS_PER_BAR
  for (let step = 0; step < STEPS; step++) {
    const char = line[step]
    const chord = chordAt(at.chords, step)
    if (chord === null || char === undefined || !'ro5'.includes(char)) continue
    let length = 1
    while (line[step + length] === '-') length += 1
    const root = lift(chord.bass, 36)
    const pitch = char === 'o' ? root + 12 : char === '5' ? lift((chord.root + 7) % 12, 36) : root
    parts.push({
      voice: 'bass',
      pitch,
      beat: start + step * STEP,
      beats: length * STEP * 0.85,
      level: 0.72,
      pan: 0,
    })
  }
}

/** Pad, arpeggio and stabs: the chord itself. */
function harmony(style: Style, at: BarAt, parts: Part[]): void {
  const start = at.bar * BEATS_PER_BAR
  if (style.pad !== null && at.energy >= style.pad) pad(at, start, parts)
  const every = style.arp && at.energy >= 1 ? style.arp.every[at.energy - 1] : 0
  if (style.arp && every !== undefined && every > 0)
    arpeggio(at, start, every, style.arp.order, parts)
  const stabs = pattern(style.stab, at.energy)
  if (stabs !== null) stab(style.stabVoice, at, start, stabs, parts)
}

function pad(at: BarAt, start: number, parts: Part[]): void {
  const span = BEATS_PER_BAR / Math.max(1, at.chords.length)
  at.chords.forEach((symbol, i) => {
    const chord = parseChord(symbol)
    if (chord === null) return
    for (const pitch of voicing(chord, 53)) {
      parts.push({
        voice: 'pad',
        pitch,
        beat: start + i * span,
        beats: span * 0.96,
        level: 0.5,
        pan: 0,
      })
    }
  })
}

function arpeggio(
  at: BarAt,
  start: number,
  every: number,
  order: 'up' | 'updown',
  parts: Part[],
): void {
  for (let step = 0; step < STEPS; step += every) {
    const chord = chordAt(at.chords, step)
    if (chord === null) continue
    const tones = [...voicing(chord, 72), lift(chord.root, 72) + 12]
    const cycle = order === 'up' ? tones : [...tones, ...tones.slice(1, -1).reverse()]
    const n = step / every
    parts.push({
      voice: 'pluck',
      pitch: cycle[n % cycle.length] ?? 72,
      beat: start + step * STEP,
      beats: every * STEP * 0.9,
      level: 0.32,
      pan: n % 2 === 0 ? -0.3 : 0.3,
    })
  }
}

function stab(voice: Voice, at: BarAt, start: number, line: string, parts: Part[]): void {
  for (let step = 0; step < STEPS; step++) {
    const strength = hitLevel(line[step])
    const chord = strength > 0 ? chordAt(at.chords, step) : null
    if (chord === null) continue
    for (const pitch of voicing(chord, 55)) {
      parts.push({
        voice,
        pitch,
        beat: start + step * STEP,
        beats: STEP * 1.6,
        level: 0.3 * strength,
        pan: 0.15,
      })
    }
  }
}
