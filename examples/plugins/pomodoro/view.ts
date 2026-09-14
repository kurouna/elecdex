import type { Block } from '../elecdex-plugin'
import { text } from './text'
import { type Durations, isRunning, phaseMs, remaining, type TimerState } from './timer'

export interface Model {
  state: TimerState
  durations: Durations
}

const pad = (n: number): string => String(n).padStart(2, '0')

const clock = (ms: number): string => {
  const seconds = Math.ceil(ms / 1000)
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`
}

const timeOfDay = (at: number): string => {
  const t = new Date(at)
  return `${pad(t.getHours())}:${pad(t.getMinutes())}`
}

/** The pane: the phase and its countdown, a meter, the cycle, and the controls. */
export function blocks(
  model: Model,
  size: { w: number; h: number },
  locale: string,
  now: number,
): Block[] {
  const t = text(locale)
  const { state, durations } = model
  const running = isRunning(state)
  const left = remaining(state, now)
  const total = phaseMs(state.phase, durations)
  const started = left < total
  const tone = state.phase === 'work' ? 'accent' : 'ok'
  const label =
    state.phase === 'work'
      ? `${t.work} · ${t.round} ${state.round + 1}/${durations.rounds}`
      : t[state.phase]

  const readout: Block =
    running && state.endsAt !== null
      ? { t: 'time', at: state.endsAt, style: 'countdown', label, tone, size: 'lg' }
      : {
          t: 'big',
          value: clock(left),
          label: `${label} · ${started ? t.paused : t.ready}`,
          tone: 'dim',
        }

  const fresh = !started && state.phase === 'work' && state.round === 0
  const controls: Block = {
    t: 'buttons',
    items: [
      running
        ? { action: 'pause', text: t.pause, primary: true }
        : { action: 'start', text: started ? t.resume : t.start, primary: true },
      { action: 'skip', text: t.skip },
      { action: 'reset', text: t.reset, disabled: fresh },
    ],
  }

  // A small pane keeps the time and the controls.
  if (size.h < 170 || size.w < 200) return [readout, controls]

  return [
    readout,
    { t: 'bar', value: total > 0 ? 1 - left / total : 0, segments: 24, tone },
    { t: 'steps', count: durations.rounds, done: state.round, label: t.round, tone: 'accent' },
    {
      t: 'rows',
      rows: [
        { label: t.today, value: String(state.today.done) },
        running && state.endsAt !== null
          ? { label: t.ends, value: timeOfDay(state.endsAt) }
          : { label: t.next, value: t[state.phase] },
      ],
    },
    controls,
  ]
}
