import { describe, expect, it } from 'vitest'
import type { KeyNote, Note } from '../../examples/plugins/elecdex-plugin'
import { startGame } from '../../examples/plugins/keystream/app'
import { EXIT_MS } from '../../examples/plugins/keystream/draw/result'
import { PREVIEW } from '../../examples/plugins/keystream/preview'
import { SONGS } from '../../examples/plugins/keystream/songs/index'

/**
 * KEYSTREAM's view as a whole (examples/plugins/keystream/app.ts), driven through a stand-in
 * view context: the keys go in as the host sends them, and what the view asks of the host
 * is recorded. The canvas is never there, so nothing is drawn.
 */

function stand(options: { reduced?: boolean; saved?: unknown } = {}) {
  const listeners = new Map<string, Set<(arg?: unknown) => void>>()
  const asked = {
    keymaps: [] as Record<string, KeyNote>[],
    sustain: [] as boolean[],
    played: [] as Note[][],
    stops: 0,
    saved: [] as unknown[],
  }
  let frame: ((now: number) => void) | null = null
  const ctx = {
    settings: { lead: 'epiano', volume: 80, offset: 0, guide: false },
    locale: 'en',
    visible: true,
    size: { w: 800, h: 600 },
    theme: { mode: 'dark', reducedMotion: options.reduced ?? true, colors: {}, fonts: {} },
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
    state: { get: () => options.saved, set: (value: unknown) => asked.saved.push(value) },
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

  it('goes on from the count-in when paused before the song, and counts down when paused in it', () => {
    // Found in play: a pause during the count-in was followed by 3, 2, 1 and then the count
    // again - a count before a count.
    const { asked, press, frame } = stand()
    const loudHats = (batch: readonly Note[]) =>
      batch.filter((n) => n.voice === 'hat' && (n.level ?? 0) > 0.5).length
    press('Enter', 0)
    frame(1200)
    expect(asked.played.at(-1)).toSatisfy((b: Note[]) => loudHats(b) === 4)
    // Paused in the count, and resumed: the count-in whole again, from now, and no 3-2-1.
    press('Escape', 1300)
    const stops = asked.stops
    press('Escape', 2000)
    const again = asked.played.at(-1) ?? []
    expect(asked.stops).toBe(stops)
    expect(loudHats(again)).toBe(4)
    // The first click comes a moment after the key, not after a 1.5 s countdown.
    const first = Math.min(...again.map((n) => n.at ?? 0))
    expect(first).toBeGreaterThanOrEqual(2000)
    expect(first).toBeLessThan(2000 + 500)
    // Paused in the song: what comes next is sent after the countdown, and no count-in.
    frame(2000)
    frame(9000)
    press('Escape', 9000)
    press('Escape', 9500)
    const later = asked.played.at(-1) ?? []
    expect(later.length).toBeGreaterThan(0)
    expect(loudHats(later)).toBe(0)
    expect(Math.min(...later.map((n) => n.at ?? 0))).toBeGreaterThanOrEqual(9500 + 1500)
  })

  it('ends a track on its result: the rank lands with its chord, and a new record blips', () => {
    const { asked, press, frame } = stand()
    press('Enter', 0)
    // Nothing typed: every note is dropped, and the track plays out to a D.
    let now = 0
    // The fanfare: a chord with its cymbal (the menu's own cues are chips alone).
    const isFanfare = (batch: readonly Note[]) =>
      batch.some((n) => n.voice === 'pluck') && batch.some((n) => n.voice === 'crash')
    while (now < 120_000 && !asked.played.some(isFanfare)) {
      now += 50
      frame(now)
    }
    const fanfare = asked.played.find(isFanfare) ?? []
    const rankAt = fanfare.find((n) => n.voice === 'kick')?.at ?? 0
    expect(rankAt).toBeGreaterThan(now)
    expect(fanfare.filter((n) => n.voice === 'pluck').map((n) => n.pitch)).toEqual([57, 60, 63])
    expect(fanfare.filter((n) => n.voice === 'chip').every((n) => (n.at ?? 0) > rankAt)).toBe(true)
  })

  it('changes tab with < > and the digits, keeping the choice where the tab shows it', () => {
    const { asked, press } = stand({ saved: { song: 'sakura-signal' } })
    const shelfOf = () => (asked.saved.at(-1) as { shelf?: string; song?: string }) ?? {}
    press('Digit2')
    expect(shelfOf()).toMatchObject({ shelf: 'pop', song: 'sakura-signal' })
    // A tab without it: its first track.
    press('Period')
    expect(shelfOf().shelf).toBe('dance')
    expect(SONGS.find((song) => song.id === shelfOf().song)?.genre).toBe('dance')
    press('Digit0')
    press('Comma')
    expect(shelfOf().shelf).toBe('electro')
    // Up from the first row goes round to FREE PLAY, and down from it to the tab's first.
    press('ArrowUp')
    expect(shelfOf().song).toBe('free')
    press('ArrowDown')
    expect(SONGS.find((song) => song.id === shelfOf().song)?.genre).toBe('electro')
  })

  it('comes back on the tab it was left on', () => {
    const { asked, press } = stand({ saved: { song: 'loopback', shelf: 'pop' } })
    press('ArrowDown')
    const saved = asked.saved.at(-1) as { shelf: string; song: string }
    expect(saved.shelf).toBe('pop')
    expect(SONGS.find((song) => song.id === saved.song)?.genre).toBe('pop')
  })

  it('blinks a chosen track before it loads, and takes no other key meanwhile', () => {
    const { asked, press, frame } = stand({ reduced: false })
    frame(0)
    const before = asked.played.length
    press('Enter', 100)
    // The start's two blips, and nothing of the track yet.
    expect(asked.played.length).toBe(before + 1)
    frame(300)
    press('ArrowDown', 350)
    frame(500)
    expect(asked.played.length).toBe(before + 1)
    // The blink done: the boot log's ticks, for the track that was chosen.
    frame(700)
    expect(asked.played.length).toBe(before + 2)
    expect(asked.played.at(-1)?.every((n) => n.voice === 'hat')).toBe(true)
    expect((asked.saved.at(-1) as { song: string }).song).toBe(SONGS[0]?.id)
  })

  it('plays the track under the cursor once it rests there, and stops it as the cursor moves', () => {
    // The view's clock is the worker's: the menu came on at performance.now().
    const t0 = performance.now()
    const { asked, press, frame } = stand({ reduced: false })
    // A key that does nothing on the menu, to wake the view's frames as a surface would.
    press('KeyZ', t0)
    frame(t0)
    frame(t0 + 200)
    const quiet = asked.played.length
    // After the rest, the first track is heard.
    frame(t0 + PREVIEW.restMs + 50)
    expect(asked.played.length).toBe(quiet + 1)
    expect(asked.played.at(-1)?.some((n) => n.voice === 'epiano')).toBe(true)
    const stops = asked.stops
    press('ArrowDown', t0 + 1000)
    expect(asked.stops).toBe(stops + 1)
    frame(t0 + 1100)
    const moved = asked.played.length
    frame(t0 + 1000 + PREVIEW.restMs + 20)
    expect(asked.played.length).toBe(moved + 1)
    // Chosen: the preview stops before the row blinks.
    press('Enter', t0 + 2000)
    expect(asked.stops).toBe(stops + 2)
  })

  it('leaves the result after the pressed key’s blink and the screen’s close', () => {
    const { asked, press, frame } = stand({ reduced: false })
    frame(0)
    press('Enter', 10)
    let now = 10
    const isFanfare = (batch: readonly Note[]) =>
      batch.some((n) => n.voice === 'pluck') && batch.some((n) => n.voice === 'crash')
    while (now < 120_000 && !asked.played.some(isFanfare)) {
      now += 50
      frame(now)
    }
    const saves = asked.saved.length
    press('Escape', now + 3000)
    frame(now + 3000 + EXIT_MS - 20)
    // Still on the result: back on the menu, the pane would save its choice.
    expect(asked.saved.length).toBe(saves)
    frame(now + 3000 + EXIT_MS + 20)
    press('ArrowDown', now + 3200 + EXIT_MS)
    expect(asked.saved.length).toBe(saves + 1)
  })
})
