import type { ElecdexPlugin, ServiceContext, SettingValues } from '../elecdex-plugin'
import { text } from './text'
import {
  type Durations,
  initial,
  pause,
  reset,
  resize,
  restore,
  skip,
  start,
  type TimerState,
  tick,
} from './timer'
import { blocks, type Model } from './view'

/**
 * A pomodoro timer: the sample plugin elecdex writes into a new plugins folder.
 *
 * The service owns the timer - one for the plugin however many panes show it - and keeps
 * it in storage, so it carries on across restarts. Each pane only draws the model and
 * sends its buttons back. It asks for one permission: notifications, when a phase ends.
 */

interface Settings extends SettingValues {
  work: number
  short: number
  long: number
  rounds: number
  autoStart: boolean
}

/** A phase that ended longer ago than this (while elecdex was closed) passes silently. */
const LATE_MS = 60_000

const durationsOf = (s: Settings): Durations => ({
  work: s.work,
  short: s.short,
  long: s.long,
  rounds: s.rounds,
})

function service(ctx: ServiceContext<Settings, Model>): void {
  let durations = durationsOf(ctx.settings)
  let state: TimerState = restore(ctx.storage.get('timer')) ?? initial(durations, Date.now())

  const commit = (next: TimerState): void => {
    if (next !== state) {
      state = next
      ctx.storage.set('timer', state)
    }
    ctx.publish({ state, durations })
  }

  const onTick = (): void => {
    const result = tick(state, durations, Date.now(), ctx.settings.autoStart)
    if (result.finished !== null && result.late < LATE_MS) {
      const t = text(ctx.locale)
      ctx.notify({ title: t.doneTitle(result.finished), body: t.doneBody(result.state.phase) })
    }
    if (result.state !== state) commit(result.state)
  }

  ctx.on('action', ({ action }) => {
    const now = Date.now()
    if (action === 'start') commit(start(state, now))
    else if (action === 'pause') commit(pause(state, now))
    else if (action === 'skip') commit(skip(state, durations, now))
    else if (action === 'reset') commit(reset(state, durations, now))
  })

  ctx.on('settings', () => {
    const next = durationsOf(ctx.settings)
    const resized = resize(state, durations, next)
    durations = next
    commit(resized)
  })

  onTick()
  commit(state)
  ctx.every(1000, onTick)
}

const plugin: ElecdexPlugin<Settings, Model> = {
  apiVersion: 1,
  id: 'pomodoro',
  title: 'pomodoro',
  description: 'A focus timer: work, short breaks, and a long break every few rounds.',
  permissions: { notify: true },
  settings: [
    { key: 'work', type: 'number', label: 'Focus (minutes)', default: 25, min: 1, max: 120 },
    { key: 'short', type: 'number', label: 'Short break (minutes)', default: 5, min: 1, max: 60 },
    { key: 'long', type: 'number', label: 'Long break (minutes)', default: 15, min: 1, max: 60 },
    {
      key: 'rounds',
      type: 'number',
      label: 'Rounds before a long break',
      default: 4,
      min: 1,
      max: 12,
    },
    { key: 'autoStart', type: 'boolean', label: 'Start the next phase by itself', default: false },
  ],
  minSize: { w: 160, h: 90 },
  // A phase and a countdown: worth a closer look, but not the whole workspace.
  zoom: 'panel',
  multiple: true,
  service,
  view(ctx) {
    let model: Model | null = null
    const draw = (): void => {
      if (model !== null) ctx.render(blocks(model, ctx.size, ctx.locale, Date.now()))
    }
    ctx.onData((next) => {
      model = next
      draw()
    })
    ctx.on('resize', draw)
    // The countdown ticks by itself; the meter moves on with each redraw.
    ctx.every(1000, draw)
  },
}

export default plugin
