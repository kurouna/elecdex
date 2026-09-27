import type { Note, Voice } from '../elecdex-plugin'
import { type Chart, firstAt } from './chart'
import { nextWindow } from './schedule'

/**
 * A track heard on the menu, as a rhythm game plays the one under the cursor: once the
 * cursor has rested a moment, about fifteen seconds from the song's best part - the band
 * and the melody - going round, faded in and out with a breath between. A song names that
 * part as the bar it starts at (SongSource.preview); one that names none is heard from
 * where its melody begins.
 */

export const PREVIEW = {
  /** How long the cursor rests on a track before it is heard. */
  restMs: 400,
  /** About how long a turn lasts: whole bars, at least this long. */
  spanMs: 15_000,
  /** The silence between one turn and the next. */
  gapMs: 700,
  fadeInMs: 300,
  fadeOutMs: 1500,
} as const

/** The part of a song a preview plays, in song time. */
export interface Span {
  from: number
  to: number
}

/** The bar the part starts at: the song's own choice, or the bar its melody starts in. */
function startBar(chart: Chart): number {
  if (chart.song.preview !== undefined) return chart.song.preview
  const first = chart.notes[0]?.time ?? 0
  let bar = 0
  for (const beat of chart.beats) {
    if (beat.time > first) break
    if (beat.bar && beat.time >= 0) bar += 1
  }
  return Math.max(0, bar - 1)
}

/** Whole bars from the start, until the part lasts `spanMs`, and never past the song. */
export function previewSpan(chart: Chart): Span {
  const bars = chart.beats.filter((b) => b.bar && b.time >= 0).map((b) => b.time)
  const first = Math.min(startBar(chart), Math.max(0, bars.length - 2))
  const from = bars[first] ?? 0
  const to = bars.find((time) => time - from >= PREVIEW.spanMs) ?? bars.at(-1) ?? from
  return { from, to }
}

/** One turn and its breath. */
export const turnLength = (span: Span): number => span.to - span.from + PREVIEW.gapMs

/** How loud a moment `t` into a turn of `length` is heard: faded in, and out at its end. */
export function fadeAt(t: number, length: number): number {
  const into = Math.min(1, t / PREVIEW.fadeInMs)
  const left = Math.min(1, (length - t) / PREVIEW.fadeOutMs)
  return Math.max(0, Math.min(into, left))
}

export interface Hearing {
  lead: Voice
  volume: number
  /** When, on the view's clock, a moment of the preview (from its first turn) is heard. */
  heardAt: (time: number) => number
}

/** The notes of the preview from `from` up to `to`, in time since its first turn began. */
export function previewBetween(chart: Chart, span: Span, from: number, to: number, how: Hearing) {
  const length = span.to - span.from
  const turn = turnLength(span)
  const notes: Note[] = []
  if (length <= 0 || to <= from) return notes
  for (let cycle = Math.max(0, Math.floor(from / turn)); cycle * turn < to; cycle++) {
    const base = cycle * turn
    const lo = Math.max(0, from - base) + span.from
    const hi = Math.min(length, to - base) + span.from
    const at = (time: number) => how.heardAt(base + time - span.from)
    const gain = (time: number) => fadeAt(time - span.from, length) * how.volume
    for (const cue of within(chart.band, lo, hi)) {
      notes.push({
        voice: cue.voice,
        pitch: cue.pitch,
        at: at(cue.time),
        ...(cue.length === null ? {} : { length: cue.length }),
        level: cue.level * gain(cue.time),
        pan: cue.pan,
      })
    }
    for (const note of [...within(chart.notes, lo, hi), ...within(chart.auto, lo, hi)]) {
      notes.push({
        voice: how.lead,
        pitch: note.pitch,
        at: at(note.time),
        length: note.length * 0.95,
        level: 0.7 * gain(note.time),
      })
    }
  }
  return notes.filter((n) => (n.level ?? 0) > 0)
}

function within<T extends { time: number }>(list: readonly T[], from: number, to: number): T[] {
  const out: T[] = []
  for (let i = firstAt(list, from); i < list.length; i++) {
    const item = list[i] as T
    if (item.time >= to) break
    out.push(item)
  }
  return out
}

/** Where the preview's notes go: the pane's sound. */
export interface Speaker {
  play(notes: Note[]): void
  stop(): void
}

interface Playing {
  index: number
  chart: Chart
  span: Span
  startAt: number
  sentTo: number
}

/**
 * The preview under the menu's cursor: it waits for the cursor to rest, then plays the
 * chosen track's part a window at a time, and stops the moment the cursor moves on.
 */
export class PreviewPlayer {
  private playing: Playing | null = null
  private restAt = Number.NEGATIVE_INFINITY
  private readonly speaker: Speaker

  constructor(speaker: Speaker) {
    this.speaker = speaker
  }

  /** The track being heard, by its place in the list; null when none is. */
  get index(): number | null {
    return this.playing?.index ?? null
  }

  /** The cursor moved, or the menu came on: what plays stops, and the rest begins again. */
  rest(now: number): void {
    this.stop()
    this.restAt = now
  }

  stop(): void {
    if (this.playing === null) return
    this.playing = null
    this.speaker.stop()
  }

  /** Whether a track is waiting out the cursor's rest: the view keeps its frames till then. */
  waiting(now: number, index: number | null): boolean {
    return index !== null && this.index !== index && now - this.restAt < PREVIEW.restMs + 100
  }

  /**
   * Starts the chosen track once the cursor has rested, and sends what comes next of it.
   * `chosen` null (FREE PLAY, or nothing to hear) stops whatever plays.
   */
  tick(now: number, chosen: { index: number; chart: Chart } | null, how: Omit<Hearing, 'heardAt'>) {
    if (chosen === null) {
      this.stop()
      return
    }
    if (this.playing?.index !== chosen.index) {
      if (now - this.restAt < PREVIEW.restMs) return
      this.stop()
      const span = previewSpan(chosen.chart)
      this.playing = {
        index: chosen.index,
        chart: chosen.chart,
        span,
        startAt: now + 60,
        sentTo: 0,
      }
    }
    const playing = this.playing as Playing
    const to = nextWindow(now - playing.startAt, playing.sentTo)
    if (to === null) return
    const notes = previewBetween(playing.chart, playing.span, playing.sentTo, to, {
      ...how,
      heardAt: (time) => playing.startAt + time,
    })
    playing.sentTo = to
    if (notes.length > 0) this.speaker.play(notes)
  }
}
