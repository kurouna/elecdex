import { readFileSync } from 'node:fs'
import { bundle } from '@main/plugins/folder'
import { PLUGIN_SAMPLE, PLUGIN_TYPES } from '@main/plugins/templates'
import { pluginRuntime, stripGlobals } from '@shared/plugin-runtime'
import { parseDescriptor, readBlocks } from '@shared/plugins'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type Durations,
  initial,
  pause,
  remaining,
  reset,
  resize,
  restore,
  skip,
  start,
  tick,
} from '../../examples/plugins/pomodoro/timer'

/** The sample plugin: its timer, and the plugin as elecdex writes and runs it. */

const d: Durations = { work: 25, short: 5, long: 15, rounds: 2 }
const MIN = 60_000
const T0 = new Date(2026, 8, 15, 9, 0).getTime()

describe('the pomodoro timer', () => {
  it('runs, pauses with what is left, and resumes from there', () => {
    let s = start(initial(d, T0), T0)
    expect(remaining(s, T0 + 10 * MIN)).toBe(15 * MIN)
    s = pause(s, T0 + 10 * MIN)
    expect(s.endsAt).toBeNull()
    expect(remaining(s, T0 + 60 * MIN)).toBe(15 * MIN)
    s = start(s, T0 + 60 * MIN)
    expect(s.endsAt).toBe(T0 + 75 * MIN)
  })

  it('counts a finished focus session, and gives a long break after the set rounds', () => {
    let s = start(initial(d, T0), T0)
    let r = tick(s, d, T0 + 25 * MIN, false)
    expect(r).toMatchObject({ finished: 'work', state: { phase: 'short', round: 1, endsAt: null } })
    expect(r.state.today.done).toBe(1)
    s = start(r.state, T0 + 25 * MIN)
    r = tick(s, d, T0 + 30 * MIN, false)
    expect(r.state.phase).toBe('work')
    s = start(r.state, T0 + 30 * MIN)
    r = tick(s, d, T0 + 55 * MIN, true)
    // The second round ends the cycle; autoStart begins the long break at once.
    expect(r.state).toMatchObject({ phase: 'long', round: 0, endsAt: T0 + 70 * MIN })
    expect(r.state.today.done).toBe(2)
  })

  it('does not count a skipped focus session', () => {
    const s = skip(start(initial(d, T0), T0), d, T0 + 5 * MIN)
    expect(s).toMatchObject({ phase: 'short', round: 0, today: { done: 0 } })
  })

  it('reports how late a phase ended, so one that ended while closed can pass silently', () => {
    const s = start(initial(d, T0), T0)
    expect(tick(s, d, T0 + 24 * MIN, false).finished).toBeNull()
    expect(tick(s, d, T0 + 25 * MIN + 500, false).late).toBe(500)
    expect(tick(s, d, T0 + 90 * MIN, false).late).toBe(65 * MIN)
  })

  it('starts today’s count again on a new day, and keeps it through a reset', () => {
    const s = tick(start(initial(d, T0), T0), d, T0 + 25 * MIN, false).state
    expect(s.today.done).toBe(1)
    expect(reset(s, d, T0 + 30 * MIN).today.done).toBe(1)
    expect(tick(s, d, T0 + 24 * 60 * MIN, false).state.today.done).toBe(0)
  })

  it('gives a phase that has not started the new length when the settings change', () => {
    const fresh = initial(d, T0)
    expect(resize(fresh, d, { ...d, work: 50 }).remainingMs).toBe(50 * MIN)
    const running = start(fresh, T0)
    expect(resize(running, d, { ...d, work: 50 })).toBe(running)
  })

  it('restores only a stored state that still has its shape', () => {
    const s = initial(d, T0)
    expect(restore(JSON.parse(JSON.stringify(s)))).toEqual(s)
    for (const bad of [null, 'x', { ...s, phase: 'nap' }, { ...s, today: null }]) {
      expect(restore(bad)).toBeNull()
    }
  })
})

describe('the sample plugin', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: T0 })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('is written from examples/plugins, with the type definitions from the plugin API', () => {
    for (const [name, text] of Object.entries(PLUGIN_SAMPLE)) {
      const file = new URL(`../../examples/plugins/${name}`, import.meta.url)
      expect(text, name).toBe(readFileSync(file, 'utf8'))
    }
    expect(PLUGIN_TYPES).toBe(
      readFileSync(new URL('../../src/shared/plugin-api.ts', import.meta.url), 'utf8'),
    )
  })

  it('describes itself, and draws only valid blocks as it runs', async () => {
    const files = Object.entries(PLUGIN_SAMPLE).map(([name, source]) => ({
      path: name.replace('pomodoro/', ''),
      source,
    }))
    const posted: Array<Record<string, unknown>> = []
    const scope = {
      postMessage: (m: unknown) => posted.push(structuredClone(m) as Record<string, unknown>),
      setInterval: (fn: () => void, ms: number) => setInterval(fn, ms),
      clearInterval: (h: unknown) => clearInterval(h as NodeJS.Timeout),
      onmessage: null as ((e: { data: unknown }) => void) | null,
    }
    new Function(
      'self',
      `(${stripGlobals})(self);(${pluginRuntime})(self, ${bundle(files)}, "index.ts")`,
    )(scope)
    const send = (data: unknown) => scope.onmessage?.({ data })

    send({ t: 'probe' })
    const described = parseDescriptor(posted.find((m) => m.t === 'descriptor')?.descriptor)
    expect(described.ok && described.descriptor.permissions.notify).toBe(true)

    const settings = { work: 1, short: 1, long: 1, rounds: 2, autoStart: false }
    send({ t: 'start', settings, locale: 'ja-JP', storage: {}, service: true })
    send({ t: 'mount', pane: 'a', size: { w: 400, h: 300 }, visible: true, state: undefined })
    await vi.advanceTimersByTimeAsync(0)
    send({ t: 'action', pane: 'a', action: 'start' })
    await vi.advanceTimersByTimeAsync(61_000)

    const renders = posted.filter((m) => m.t === 'render')
    expect(renders.length).toBeGreaterThan(2)
    for (const render of renders) expect(readBlocks(render.blocks).problems).toEqual([])
    expect(posted.filter((m) => m.t === 'notify')).toEqual([
      { t: 'notify', title: '集中おわり', body: '小休憩の時間です。' },
    ])
    expect(posted.filter((m) => m.t === 'storage').at(-1)).toMatchObject({
      key: 'timer',
      value: { phase: 'short', round: 1 },
    })
  })
})
