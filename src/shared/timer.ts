/**
 * The clock arithmetic behind the chrono pane.
 *
 * Everything here works from wall-clock moments rather than from a count of
 * ticks. Moving a pane remounts its widget, a background tab stops being drawn,
 * and the app is closed and opened again - a counter would lose time at each of
 * those, while `startedAt` plus what was banked before it cannot.
 */

export const TIMER_MAX_LAPS = 100

/**
 * The steps the timer offers, in minutes.
 *
 * They add to what is set rather than replacing it, so any duration can be built
 * up by tapping - 25 + 10 + 1 - instead of the list being the only times on
 * offer. Setting an exact number is the field beside them.
 */
export const TIMER_STEPS = [1, 3, 5, 10, 25] as const

/** The longest a timer may be set for: a day, beyond which it is a calendar entry. */
export const TIMER_MAX_MS = 24 * 3_600_000

export interface ChronoState {
  running: boolean
  /** When the current run began, in epoch milliseconds. */
  startedAt: number
  /** Milliseconds banked by earlier runs. */
  accumulatedMs: number
}

/** How long the stopwatch has been going at `now`. */
export function elapsed(state: ChronoState, now: number): number {
  return state.running
    ? state.accumulatedMs + Math.max(0, now - state.startedAt)
    : state.accumulatedMs
}

/** How long is left on a countdown at `now`; never below zero. */
export function remaining(state: ChronoState, durationMs: number, now: number): number {
  return Math.max(0, durationMs - elapsed(state, now))
}

/**
 * Splits a duration for the readout.
 *
 * Tenths, not hundredths. The window draws on a shared 10 fps loop, so a
 * hundredths digit would step in units of ten and read as a fault; laps are
 * still recorded at full millisecond precision, where the number is used rather
 * than watched.
 */
export function splitDuration(ms: number): {
  hours: number
  minutes: number
  seconds: number
  tenths: number
} {
  const total = Math.max(0, Math.floor(ms))
  return {
    hours: Math.floor(total / 3_600_000),
    minutes: Math.floor(total / 60_000) % 60,
    seconds: Math.floor(total / 1000) % 60,
    tenths: Math.floor(total / 100) % 10,
  }
}

const pad = (value: number): string => String(value).padStart(2, '0')

/** "01:34" or "1:02:03" - the shape the big readout shows, without the tenths. */
export function formatClock(ms: number, withHours = false): string {
  const { hours, minutes, seconds } = splitDuration(ms)
  if (hours > 0 || withHours) return `${hours}:${pad(minutes)}:${pad(seconds)}`
  return `${pad(minutes)}:${pad(seconds)}`
}

/** A lap, as the pane records it. */
export interface Lap {
  /** Its length in milliseconds. */
  ms: number
  /** Total elapsed when it was taken. */
  atMs: number
}

/** Which laps are the fastest and slowest, or null when there are fewer than two. */
export function lapExtremes(laps: readonly Lap[]): { best: number; worst: number } | null {
  if (laps.length < 2) return null
  let best = 0
  let worst = 0
  for (let i = 1; i < laps.length; i += 1) {
    const ms = laps[i]?.ms ?? 0
    if (ms < (laps[best]?.ms ?? 0)) best = i
    if (ms > (laps[worst]?.ms ?? 0)) worst = i
  }
  return { best, worst }
}

/**
 * How many segments the countdown ladder is drawn with.
 *
 * One segment per two logical pixels of the long side, clamped. Fewer than 12
 * and the ladder empties in jumps; more than 60 and the lit and unlit ends are
 * the same grey at a glance.
 */
export function segmentCount(lengthPx: number): number {
  return Math.max(12, Math.min(60, Math.floor(lengthPx / 8)))
}

/**
 * How many segments are still lit, counting down.
 *
 * Rounded up, so the last segment goes out exactly when the timer reaches zero
 * rather than a fraction of a segment early.
 */
export function litSegments(remainingMs: number, durationMs: number, segments: number): number {
  if (durationMs <= 0) return 0
  const ratio = Math.max(0, Math.min(1, remainingMs / durationMs))
  return Math.min(segments, Math.ceil(ratio * segments))
}

/**
 * What the chrono pane keeps.
 *
 * The stopwatch and the countdowns are separate machines, as they are on a
 * phone: starting one does not start the other, resetting one does not stop the
 * other, and a countdown goes on counting while the stopwatch is the mode on
 * screen. They were one clock at first, which meant the pane had a single
 * running flag and the two modes were only ever two views of it - the wrong
 * model, and confusing to use.
 */

/** How many countdowns one pane will hold. Beyond this they are unreadable. */
export const MAX_TIMERS = 6

export interface StopwatchState extends ChronoState {
  laps: Lap[]
}

export interface TimerEntry extends ChronoState {
  id: string
  durationMs: number
  /** Set when this countdown has already announced that it finished. */
  rang: boolean
}

export type ChronoMode = 'stopwatch' | 'timer' | 'alarm'

export interface ChronoPane {
  mode: ChronoMode
  stopwatch: StopwatchState
  timers: TimerEntry[]
}

const DEFAULT_DURATION_MS = 5 * 60_000

const num = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

function readLaps(raw: unknown): Lap[] {
  if (!Array.isArray(raw)) return []
  return raw
    .flatMap((lap) => {
      if (typeof lap !== 'object' || lap === null) return []
      const { ms, atMs } = lap as Record<string, unknown>
      if (typeof ms !== 'number' || typeof atMs !== 'number') return []
      return [{ ms, atMs }]
    })
    .slice(-TIMER_MAX_LAPS)
}

function readRun(raw: Record<string, unknown>): ChronoState {
  return {
    running: raw.running === true,
    startedAt: num(raw.startedAt),
    accumulatedMs: Math.max(0, num(raw.accumulatedMs)),
  }
}

export function makeTimer(minutes: number): TimerEntry {
  return {
    id: `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    durationMs: clampDuration(minutes * 60_000),
    running: false,
    startedAt: 0,
    accumulatedMs: 0,
    rang: false,
  }
}

export const clampDuration = (ms: number): number =>
  Math.min(TIMER_MAX_MS, Math.max(1000, Math.round(ms)))

/**
 * Reads the pane state, including the shape it had when the two modes shared one
 * clock: that pane's run becomes the stopwatch, and its duration the first
 * countdown, so a pane saved by the older build opens with its settings intact.
 */
export function readChrono(state: Record<string, unknown> | undefined): ChronoPane {
  const raw = state ?? {}
  const mode: ChronoMode =
    raw.mode === 'timer' ? 'timer' : raw.mode === 'alarm' ? 'alarm' : 'stopwatch'

  const storedStopwatch = raw.stopwatch
  const stopwatch: StopwatchState =
    typeof storedStopwatch === 'object' && storedStopwatch !== null
      ? {
          ...readRun(storedStopwatch as Record<string, unknown>),
          laps: readLaps((storedStopwatch as Record<string, unknown>).laps),
        }
      : { ...readRun(raw), laps: readLaps(raw.laps) }

  const storedTimers = raw.timers
  const timers: TimerEntry[] = Array.isArray(storedTimers)
    ? storedTimers
        .flatMap((entry) => {
          if (typeof entry !== 'object' || entry === null) return []
          const record = entry as Record<string, unknown>
          const id = typeof record.id === 'string' ? record.id : null
          if (id === null) return []
          return [
            {
              id,
              durationMs: clampDuration(num(record.durationMs, DEFAULT_DURATION_MS)),
              ...readRun(record),
              rang: record.rang === true,
            },
          ]
        })
        .slice(0, MAX_TIMERS)
    : [
        {
          ...makeTimer(num(raw.durationMs, DEFAULT_DURATION_MS) / 60_000),
          // The older pane's countdown kept no run of its own; start it stopped.
          id: 'timer-1',
        },
      ]

  return { mode, stopwatch, timers: timers.length === 0 ? [makeTimer(5)] : timers }
}
