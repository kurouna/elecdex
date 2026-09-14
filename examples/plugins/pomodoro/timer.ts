/**
 * The pomodoro timer as plain data: every change is a function from one state to the next,
 * given the time, so the service stays small and the timer can be tested without a clock.
 */

export type Phase = 'work' | 'short' | 'long'

export interface Durations {
  /** Minutes. */
  work: number
  short: number
  long: number
  /** Work sessions before a long break. */
  rounds: number
}

export interface TimerState {
  phase: Phase
  /** When the running phase ends, in epoch ms; null while paused or not started. */
  endsAt: number | null
  /** What is left of the phase while paused. */
  remainingMs: number
  /** Work sessions finished in this cycle. */
  round: number
  /** Work sessions finished on `date` (local YYYY-MM-DD). */
  today: { date: string; done: number }
}

const MINUTE = 60_000

export const phaseMs = (phase: Phase, d: Durations): number => d[phase] * MINUTE

export function localDate(now: number): string {
  const t = new Date(now)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`
}

export function initial(d: Durations, now: number): TimerState {
  return {
    phase: 'work',
    endsAt: null,
    remainingMs: phaseMs('work', d),
    round: 0,
    today: { date: localDate(now), done: 0 },
  }
}

export const isRunning = (s: TimerState): boolean => s.endsAt !== null

export const remaining = (s: TimerState, now: number): number =>
  s.endsAt === null ? s.remainingMs : Math.max(0, s.endsAt - now)

export function start(s: TimerState, now: number): TimerState {
  return isRunning(s) ? s : { ...s, endsAt: now + s.remainingMs }
}

export function pause(s: TimerState, now: number): TimerState {
  return isRunning(s) ? { ...s, endsAt: null, remainingMs: remaining(s, now) } : s
}

/** Back to the start of a fresh cycle; today's count stays. */
export function reset(s: TimerState, d: Durations, now: number): TimerState {
  return { ...initial(d, now), today: rollDay(s, now).today }
}

/** The phase after this one, not started. A work session counts only when it ran out. */
function advance(s: TimerState, d: Durations, now: number, completed: boolean): TimerState {
  const day = rollDay(s, now)
  if (s.phase !== 'work') {
    return { ...day, phase: 'work', endsAt: null, remainingMs: phaseMs('work', d) }
  }
  const round = completed ? s.round + 1 : s.round
  const long = round >= d.rounds
  const phase: Phase = long ? 'long' : 'short'
  return {
    phase,
    endsAt: null,
    remainingMs: phaseMs(phase, d),
    round: long ? 0 : round,
    today: { date: day.today.date, done: day.today.done + (completed ? 1 : 0) },
  }
}

export const skip = (s: TimerState, d: Durations, now: number): TimerState =>
  advance(s, d, now, false)

/**
 * Moves the timer on to `now`. When the running phase has ended, returns the next phase
 * (started at once when autoStart is on) and the phase that ended.
 */
export function tick(
  s: TimerState,
  d: Durations,
  now: number,
  autoStart: boolean,
): { state: TimerState; finished: Phase | null; late: number } {
  if (s.endsAt === null || now < s.endsAt)
    return { state: rollDay(s, now), finished: null, late: 0 }
  const late = now - s.endsAt
  const next = advance(s, d, now, true)
  return { state: autoStart ? start(next, now) : next, finished: s.phase, late }
}

/** When the settings change, a phase that has not started takes the new length. */
export function resize(s: TimerState, before: Durations, after: Durations): TimerState {
  if (isRunning(s) || s.remainingMs !== phaseMs(s.phase, before)) return s
  return { ...s, remainingMs: phaseMs(s.phase, after) }
}

function rollDay(s: TimerState, now: number): TimerState {
  const date = localDate(now)
  return s.today.date === date ? s : { ...s, today: { date, done: 0 } }
}

/** A stored state, if it still has the shape of one. */
export function restore(raw: unknown): TimerState | null {
  if (typeof raw !== 'object' || raw === null) return null
  const s = raw as Partial<TimerState>
  const phases: readonly unknown[] = ['work', 'short', 'long']
  const ok =
    phases.includes(s.phase) &&
    (s.endsAt === null || typeof s.endsAt === 'number') &&
    typeof s.remainingMs === 'number' &&
    typeof s.round === 'number' &&
    typeof s.today?.date === 'string' &&
    typeof s.today.done === 'number'
  return ok ? (s as TimerState) : null
}
