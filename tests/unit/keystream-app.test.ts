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

function stand(options: { reduced?: boolean; saved?: unknown; settings?: object } = {}) {
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
    settings: { volume: 80, offset: 0, guide: false, ...options.settings },
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
  /** A track started as a player does: chosen, then its level (NORMAL, as it is kept). */
  const start = (at = 0) => {
    press('Enter', at)
    press('Enter', at + 1)
  }
  return { asked, key, press, start, stop, frame: (now: number) => frame?.(now) }
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
    const { asked, start, frame } = stand()
    start(0)
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
    const { asked, press, start, frame } = stand()
    const loudHats = (batch: readonly Note[]) =>
      batch.filter((n) => n.voice === 'hat' && (n.level ?? 0) > 0.5).length
    start(0)
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
    const { asked, start, frame } = stand()
    start(0)
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

  it('changes tab with the left and right arrows or < >, keeping the choice where it can', () => {
    const { asked, press } = stand({ saved: { song: 'sakura-signal' } })
    const shelfOf = () => (asked.saved.at(-1) as { shelf?: string; song?: string }) ?? {}
    press('ArrowRight')
    press('ArrowRight')
    expect(shelfOf()).toMatchObject({ shelf: 'pop', song: 'sakura-signal' })
    // A tab without it: its first track.
    press('Period')
    expect(shelfOf().shelf).toBe('dance')
    expect(SONGS.find((song) => song.id === shelfOf().song)?.genre).toBe('dance')
    // The digits are the instruments now: they leave the tab where it is.
    press('Digit2')
    expect(shelfOf().shelf).toBe('dance')
    press('Comma')
    expect(shelfOf().shelf).toBe('pop')
    press('ArrowRight')
    press('ArrowRight')
    expect(shelfOf().shelf).toBe('electro')
    // Up from the first row goes round to FREE PLAY, and down from it to the tab's first.
    press('ArrowUp')
    expect(shelfOf().song).toBe('free')
    press('ArrowDown')
    expect(SONGS.find((song) => song.id === shelfOf().song)?.genre).toBe('electro')
  })

  it('writes the pane only for a key that changed something', () => {
    const { asked, press } = stand({ saved: { song: 'loopback', shelf: 'all' } })
    const saves = asked.saved.length
    // The keyboard played on the menu, and keys the menu has no use for.
    for (const code of ['KeyA', 'KeyJ', 'KeyZ', 'Backspace']) press(code)
    expect(asked.saved.length).toBe(saves)
    press('Enter')
    expect(asked.saved.length).toBe(saves + 1)
    // On the levels' panel, past its ends.
    press('ArrowDown')
    press('ArrowDown')
    press('ArrowDown')
    expect(asked.saved.length).toBe(saves + 2)
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
    // The track chosen: its levels open (a blip); the level chosen: the start's two blips.
    press('Enter', 90)
    press('Enter', 100)
    expect(asked.played.length).toBe(before + 2)
    frame(300)
    press('ArrowDown', 350)
    frame(500)
    expect(asked.played.length).toBe(before + 2)
    // The blink done: the boot log's ticks, for the track that was chosen.
    frame(700)
    expect(asked.played.length).toBe(before + 3)
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
    // Its levels open and it plays on; the level chosen, it stops before the row blinks.
    press('Enter', t0 + 2000)
    expect(asked.stops).toBe(stops + 1)
    press('Enter', t0 + 2100)
    expect(asked.stops).toBe(stops + 2)
  })

  it('turns the preview off and on with Space, on either stage, and keeps the choice', () => {
    const t0 = performance.now()
    const { asked, press, frame } = stand({ reduced: false })
    press('KeyZ', t0)
    frame(t0 + PREVIEW.restMs + 50)
    const heard = asked.played.length
    const stops = asked.stops
    // Off: what plays stops at once, and nothing more is sent however long the cursor rests.
    press('Space', t0 + 1000)
    expect(asked.stops).toBe(stops + 1)
    expect(asked.saved.at(-1)).toMatchObject({ preview: false })
    const cue = asked.played.length
    expect(cue).toBe(heard + 1)
    frame(t0 + 1000 + PREVIEW.restMs * 3)
    press('ArrowDown', t0 + 1100)
    frame(t0 + 1100 + PREVIEW.restMs * 3)
    expect(asked.played.length).toBe(cue + 1)
    // On again from the levels' panel: the chosen track is heard after the rest.
    press('Enter', t0 + 5000)
    press('Space', t0 + 5100)
    expect(asked.saved.at(-1)).toMatchObject({ preview: true })
    const on = asked.played.length
    frame(t0 + 5100 + PREVIEW.restMs + 50)
    expect(asked.played.length).toBe(on + 1)
    expect(asked.played.at(-1)?.some((n) => n.voice === 'epiano')).toBe(true)
  })

  it('stays quiet on the menu when the preview was left off', () => {
    const t0 = performance.now()
    const { asked, press, frame } = stand({ reduced: false, saved: { preview: false } })
    press('KeyZ', t0)
    frame(t0 + PREVIEW.restMs * 3)
    expect(asked.played).toHaveLength(0)
    expect(asked.saved.at(-1)).toMatchObject({ preview: false })
  })

  it('leaves the result after the pressed key’s blink and the screen’s close', () => {
    const { asked, press, start, frame } = stand({ reduced: false })
    frame(0)
    start(10)
    let now = 20
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

describe('the instruments', () => {
  const voiceOf = (asked: { keymaps: Record<string, KeyNote>[] }) =>
    asked.keymaps.at(-1)?.KeyA?.voice

  it('are picked on the number row, on the menu, in a track and in FREE PLAY alike', () => {
    const { asked, press, start, frame } = stand()
    press('Digit3')
    expect(voiceOf(asked)).toBe('guitar')
    // Heard on the menu at once: a rising chord on it.
    expect(asked.played.at(-1)?.every((n) => n.voice === 'guitar')).toBe(true)
    expect(asked.saved.at(-1)).toMatchObject({ instrument: 'guitar' })
    press('Minus')
    expect(voiceOf(asked)).toBe('bass')
    // In a track, the keys change at once, and nothing else is played for it.
    start(0)
    frame(1300)
    const played = asked.played.length
    press('Digit6', 1400)
    expect(voiceOf(asked)).toBe('organ')
    expect(asked.played).toHaveLength(played)
  })

  it('are the one FREE PLAY holds its keys on', () => {
    const { asked, press } = stand({ saved: { song: 'free' } })
    press('Enter')
    expect(asked.keymaps.at(-1)?.KeyA).toMatchObject({ voice: 'epiano', hold: true })
    press('Digit7')
    expect(asked.keymaps.at(-1)?.KeyA).toMatchObject({ voice: 'marimba', hold: true })
  })

  it('come back as they were kept, or as FREE PLAY had one, and else as key 1’s', () => {
    expect(voiceOf(stand({ saved: { instrument: 'organ' } }).asked)).toBe('organ')
    expect(voiceOf(stand({ saved: { free: { tone: 'pad' } } }).asked)).toBe('pad')
    // Nothing valid kept: the first instrument, whatever was there.
    for (const kept of [undefined, 'kazoo', 3, null, { voice: 'guitar' }]) {
      expect(voiceOf(stand({ saved: { instrument: kept } }).asked), String(kept)).toBe('epiano')
    }
  })

  it('writes a fallen-back choice back at once, leaving the rest of what was kept', () => {
    // Found in use: after an update the instrument chosen in the old setting was not there.
    const { asked } = stand({ saved: { song: 'loopback', level: 'hard', instrument: 'kazoo' } })
    expect(asked.saved.at(-1)).toMatchObject({
      song: 'loopback',
      level: 'hard',
      instrument: 'epiano',
    })
    const kept = stand({ saved: { song: 'loopback', instrument: 'organ' } })
    expect(kept.asked.saved).toHaveLength(0)
  })
})

describe('choosing a level', () => {
  const savedOf = (asked: { saved: unknown[] }) =>
    (asked.saved.at(-1) as { level?: string; shelf?: string; song?: string }) ?? {}

  it('comes after the track: Enter opens its levels, the arrows move on them, Escape goes back', () => {
    const { asked, press, frame } = stand()
    press('Enter')
    // The panel is open: the arrows are the levels', not the list's or the tabs'.
    press('ArrowDown')
    expect(savedOf(asked)).toMatchObject({ level: 'hard', song: SONGS[0]?.id, shelf: 'all' })
    press('ArrowLeft')
    press('ArrowLeft')
    expect(savedOf(asked).level).toBe('easy')
    press('ArrowUp')
    expect(savedOf(asked).level).toBe('easy')
    // Back to the list: the arrows move rows and tabs again.
    press('Escape')
    press('ArrowRight')
    expect(savedOf(asked).shelf).toBe('classics')
    press('Enter')
    press('Backspace')
    press('ArrowDown')
    expect(savedOf(asked).song).not.toBe(SONGS[0]?.id)
    // And from the panel, Enter starts it at the level chosen.
    press('Enter', 100)
    press('Enter', 110)
    frame(1300)
    expect(asked.played.some((batch) => batch.some((n) => n.voice === 'kick'))).toBe(true)
  })

  it('starts FREE PLAY at once, with no levels to choose', () => {
    const { asked, press } = stand({ saved: { song: 'free' } })
    press('Enter')
    expect(asked.keymaps.at(-1)?.KeyA).toMatchObject({ hold: true })
  })
})
