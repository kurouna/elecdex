import type { Chart, PlayNote } from './chart'
import { type Grade, gradeOf, newTally, record, type Tally, windowOf } from './judge'

/**
 * One play of a chart: its clock, the keys judged against it, and the tally. Times are on
 * the view's clock (ctx.animate's `now`, a key's `at`), in milliseconds; song time 0 is the
 * first beat of the song, heard at `startAt`.
 */

export type Outcome =
  | { kind: 'hit'; note: PlayNote; index: number; grade: Exclude<Grade, 'DROP'>; delta: number }
  | { kind: 'drop'; note: PlayNote; index: number }
  | { kind: 'stray'; code: string }

export type NoteState = 'live' | 'hit' | 'drop'

/**
 * How long past its window a note is kept before it is dropped. The frame that drops it and
 * the key that saves it arrive separately; a key typed in the last moment of the window may
 * reach the view just after the frame, and must still find its note.
 */
const DROP_GRACE_MS = 34

export class Session {
  readonly chart: Chart
  tally: Tally
  private startAt: number
  /** While a resume counts down, the field stands at the song time it was paused at. */
  private holdAt: number | null = null
  private pausedAt: number | null = null
  private readonly states: NoteState[]
  /** Where the song was when each dropped note was dropped, by index. */
  private readonly dropped = new Map<number, number>()
  /** The first note not yet judged: every one before it is. */
  private live = 0
  /** The player's own lag, from the settings: positive when keys land late. */
  private readonly offset: number

  constructor(chart: Chart, startAt: number, offset: number) {
    this.chart = chart
    this.startAt = startAt
    this.offset = offset
    this.tally = newTally(chart.level, chart.notes.length)
    this.states = chart.notes.map(() => 'live')
  }

  get paused(): boolean {
    return this.pausedAt !== null
  }

  /** The song's time at a moment; standing still while paused. */
  songTime(now: number): number {
    return this.pausedAt ?? now - this.startAt
  }

  /** The time the field shows: the paused time while a resume counts down. */
  shownTime(now: number): number {
    const time = this.songTime(now)
    return this.holdAt !== null && time < this.holdAt ? this.holdAt : time
  }

  /** Whether keys count: not paused, and not while a resume counts down. */
  running(now: number): boolean {
    return this.pausedAt === null && (this.holdAt === null || now - this.startAt >= this.holdAt)
  }

  stateOf(index: number): NoteState {
    return this.states[index] ?? 'live'
  }

  /** The next notes still to be typed, in order. */
  next(count: number): PlayNote[] {
    const out: PlayNote[] = []
    for (let i = this.live; i < this.chart.notes.length && out.length < count; i++) {
      if (this.states[i] === 'live') out.push(this.chart.notes[i] as PlayNote)
    }
    return out
  }

  /** When a dropped note was let go, in song time. */
  droppedAt(index: number): number | undefined {
    return this.dropped.get(index)
  }

  /**
   * A key went down: the earliest live note on it whose window holds the moment, or a stray
   * key. The earliest, not the nearest: a late key for one note must not take the next note
   * on the same key and leave the first to drop.
   */
  press(code: string, at: number): Outcome | null {
    if (!this.running(at)) return null
    const time = at - this.startAt - this.offset
    const reach = windowOf(this.chart.level)
    let best = -1
    for (let i = this.live; i < this.chart.notes.length; i++) {
      const note = this.chart.notes[i] as PlayNote
      if (note.time > time + reach) break
      if (this.states[i] === 'live' && note.code === code && Math.abs(time - note.time) <= reach) {
        best = i
        break
      }
    }
    const note = this.chart.notes[best]
    const grade = note === undefined ? null : gradeOf(time - note.time, this.chart.level)
    if (note === undefined || grade === null) {
      this.tally = { ...this.tally, stray: this.tally.stray + 1 }
      return { kind: 'stray', code }
    }
    const delta = time - note.time
    this.judge(best, grade, delta)
    return { kind: 'hit', note, index: best, grade, delta }
  }

  /** Notes whose window has passed untyped are dropped. */
  advance(now: number): Outcome[] {
    if (!this.running(now)) return []
    const time = this.songTime(now) - this.offset
    const reach = windowOf(this.chart.level)
    const out: Outcome[] = []
    for (let i = this.live; i < this.chart.notes.length; i++) {
      const note = this.chart.notes[i] as PlayNote
      if (note.time + reach + DROP_GRACE_MS >= time) break
      if (this.states[i] !== 'live') continue
      this.dropped.set(i, time)
      this.judge(i, 'DROP', null)
      out.push({ kind: 'drop', note, index: i })
    }
    return out
  }

  private judge(index: number, grade: Grade, delta: number | null): void {
    this.states[index] = grade === 'DROP' ? 'drop' : 'hit'
    this.tally = record(this.tally, grade, delta)
    while (this.live < this.states.length && this.states[this.live] !== 'live') this.live += 1
  }

  /** The song has played out, or the signal is gone (HARD). */
  over(now: number): boolean {
    return this.tally.failed || (!this.paused && this.songTime(now) > this.chart.duration)
  }

  /** Stops where the field stands: during a resume's countdown, where it stopped before. */
  pause(now: number): void {
    if (this.pausedAt === null) this.pausedAt = this.shownTime(now)
  }

  /** Goes on from where it stopped after `countdown` milliseconds. Returns that song time. */
  resume(now: number, countdown: number): number {
    const from = this.pausedAt ?? this.songTime(now)
    this.pausedAt = null
    this.startAt = now + countdown - from
    this.holdAt = from
    return from
  }

  /** The moment on the view's clock a song time is heard. */
  heardAt(songTime: number): number {
    return this.startAt + songTime
  }
}
