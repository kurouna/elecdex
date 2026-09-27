import { describe, expect, it } from 'vitest'
import type { KeyNote, Note } from '../../examples/plugins/elecdex-plugin'
import { startGame } from '../../examples/plugins/keystream/app'

/**
 * KEYSTREAM's view as a whole (examples/plugins/keystream/app.ts), driven through a stand-in
 * view context: the keys go in as the host sends them, and what the view asks of the host
 * is recorded. The canvas is never there, so nothing is drawn.
 */

function stand() {
  const listeners = new Map<string, Set<(arg?: unknown) => void>>()
  const asked = {
    keymaps: [] as Record<string, KeyNote>[],
    sustain: [] as boolean[],
    played: [] as Note[][],
    stops: 0,
  }
  let frame: ((now: number) => void) | null = null
  const ctx = {
    settings: { lead: 'epiano', volume: 80, offset: 0, guide: false },
    locale: 'en',
    visible: true,
    size: { w: 800, h: 600 },
    theme: { mode: 'dark', reducedMotion: true, colors: {}, fonts: {} },
    keys: {
      focused: true,
      labels: {},
      play: (map: Record<string, KeyNote> | null) => asked.keymaps.push(map ?? {}),
      sustain: (on: boolean) => asked.sustain.push(on),
    },
    sound: {
      play: (notes: readonly Note[]) => asked.played.push([...notes]),
      stop: () => {
        asked.stops += 1
      },
      latency: 0,
    },
    state: { get: () => undefined, set: () => {} },
    render: () => {},
    surface: () => null,
    animate: (fn: (now: number) => void) => {
      frame = fn
      return () => {
        frame = null
      }
    },
    on: (event: string, fn: (arg?: unknown) => void) => {
      const set = listeners.get(event) ?? new Set()
      set.add(fn)
      listeners.set(event, set)
      return () => set.delete(fn)
    },
    log: () => {},
    every: () => () => {},
    subtitle: () => {},
    badge: () => {},
  }
  const stop = startGame(ctx as never)
  const key = (code: string, down: boolean, at = 0) => {
    for (const fn of listeners.get('key') ?? []) fn({ code, down, shift: false, at })
  }
  const press = (code: string, at = 0) => {
    key(code, true, at)
    key(code, false, at + 30)
  }
  return { asked, key, press, stop, frame: (now: number) => frame?.(now) }
}

describe('the view', () => {
  it('binds the keys as a track plays them on the menu: ringing a while, not held', () => {
    const { asked } = stand()
    expect(asked.keymaps.at(-1)?.KeyA).toMatchObject({ voice: 'epiano', pitch: 60 })
    expect(asked.keymaps.at(-1)?.KeyA?.hold).toBeUndefined()
  })

  it('in FREE mode hears keys come up: the pedal lifts with Space, held keys are let go', () => {
    const { asked, key, press } = stand()
    // FREE PLAY is after the tracks: up from the first goes round to it.
    press('ArrowUp')
    press('Enter')
    expect(asked.keymaps.at(-1)?.KeyA).toMatchObject({ hold: true })
    key('Space', true)
    key('Space', false)
    expect(asked.sustain).toEqual([true, false])
    // Back on the menu, the keys ring a while again rather than hold.
    press('Escape')
    expect(asked.keymaps.at(-1)?.KeyA?.hold).toBeUndefined()
  })

  it('starts a track, and sends its band a window at a time as the frames come', () => {
    const { asked, press, frame } = stand()
    press('Enter', 0)
    frame(1200)
    const first = asked.played.length
    expect(first).toBeGreaterThan(1)
    frame(1300)
    expect(asked.played).toHaveLength(first)
    frame(6000)
    expect(asked.played.length).toBeGreaterThan(first)
  })
})
