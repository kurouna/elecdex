import { describe, expect, it } from 'vitest'
import type { KeyNote, Note } from '../../examples/plugins/elecdex-plugin'
import { buildChart } from '../../examples/plugins/keystream/chart'
import { chordName } from '../../examples/plugins/keystream/chord-name'
import { FreePlay, OCTAVES, RISE_MS, TONES } from '../../examples/plugins/keystream/free'
import { readSong } from '../../examples/plugins/keystream/notation'
import { loopBetween, loopLength } from '../../examples/plugins/keystream/schedule'
import { SONGS } from '../../examples/plugins/keystream/songs/index'

/**
 * KEYSTREAM's FREE mode (examples/plugins/keystream/free.ts): the keyboard as an instrument,
 * the chord held named, and a track's band going round underneath. The view's context is a
 * stand-in that records what the mode asks of the host.
 */

describe('naming the chord held', () => {
  it('names chords from their root, and inversions over their bass', () => {
    expect(chordName([60, 64, 67])).toBe('C')
    expect(chordName([57, 60, 64])).toBe('Am')
    expect(chordName([67, 71, 74, 77])).toBe('G7')
    expect(chordName([60, 64, 67, 71])).toBe('Cmaj7')
    expect(chordName([64, 67, 72])).toBe('C/E')
    expect(chordName([62, 65, 69, 72])).toBe('Dm7')
    expect(chordName([60, 67])).toBe('C5')
    expect(chordName([70, 74, 77])).toBe('Bb')
  })

  it('names nothing for one note, or notes that make no chord here', () => {
    expect(chordName([60])).toBeNull()
    expect(chordName([])).toBeNull()
    expect(chordName([60, 61, 62])).toBeNull()
  })
})

describe('a band going round', () => {
  const chart = buildChart(readSong(SONGS[0] as (typeof SONGS)[number]), 'normal')
  const length = loopLength(chart)
  const how = { volume: 1, heardAt: (t: number) => t }
  const inLoop = chart.band.filter((c) => c.time >= 0).length

  it('plays the band without its count-in, once each time round', () => {
    expect(length).toBeGreaterThan(30_000)
    const once = loopBetween(chart, 0, length, how)
    expect(once).toHaveLength(inLoop)
    expect(once.every((n) => (n.at ?? -1) >= 0 && (n.at ?? 0) < length)).toBe(true)
    // Three times round, sent a few seconds at a time, is three times the notes, in order.
    const sent: Note[] = []
    for (let from = 0; from < length * 3; from += 4321) {
      sent.push(...loopBetween(chart, from, Math.min(from + 4321, length * 3), how))
    }
    expect(sent).toHaveLength(inLoop * 3)
    const times = sent.map((n) => n.at ?? 0)
    expect(times).toEqual([...times].sort((a, b) => a - b))
    expect(times.at(-1)).toBeGreaterThan(length * 2)
  })

  it('sends nothing for an empty window', () => {
    expect(loopBetween(chart, 5000, 5000, how)).toEqual([])
  })
})

/** A view's context that records what FREE mode asks of the host. */
function stand() {
  const asked = {
    keymaps: [] as Record<string, KeyNote>[],
    sustain: [] as boolean[],
    played: [] as Note[][],
    stops: 0,
  }
  const ctx = {
    settings: { lead: 'piano', volume: 50, offset: 0, guide: false },
    keys: {
      focused: true,
      labels: { KeyA: 'A' } as Record<string, string>,
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
  }
  const charts = SONGS.map((s) => buildChart(readSong(s), 'normal'))
  const free = new FreePlay(ctx as never, (i) => charts[i] ?? null, charts.length)
  const key = (code: string, down: boolean, at = 0) => free.key({ code, down, shift: false, at })
  return { free, asked, key }
}

describe('FREE mode', () => {
  it('holds every key while it is down, in the chosen tone and octave', () => {
    const { free, asked, key } = stand()
    free.enter()
    const bound = asked.keymaps.at(-1) ?? {}
    expect(Object.keys(bound)).toHaveLength(18)
    expect(bound.KeyA).toEqual({ voice: 'piano', pitch: 60, level: 0.425, hold: true })
    // Left moves the keys an octave down, as far as it goes; up and down change the tone.
    for (let i = 0; i < 5; i++) expect(key('ArrowLeft', true)).toBe('changed')
    expect(free.octave).toBe(-OCTAVES)
    expect(asked.keymaps.at(-1)?.KeyA?.pitch).toBe(60 - 12 * OCTAVES)
    key('ArrowDown', true)
    expect(asked.keymaps.at(-1)?.KeyA?.voice).toBe(TONES[2]?.voice)
    for (let i = 0; i < TONES.length; i++) key('ArrowUp', true)
    expect(asked.keymaps.at(-1)?.KeyA?.voice).toBe(TONES[2]?.voice)
    expect(free.saved()).toEqual({ tone: TONES[2]?.voice, octave: -OCTAVES })
  })

  it('traces what is played, names what is held, and lets trails rise away', () => {
    const { free, key } = stand()
    free.enter()
    key('KeyA', true, 100)
    key('KeyD', true, 110)
    key('KeyG', true, 120)
    expect(free.holding).toEqual([60, 64, 67])
    expect(chordName(free.holding)).toBe('C')
    key('KeyD', false, 500)
    expect(free.holding).toEqual([60, 67])
    expect(free.played.map((p) => p.name)).toEqual(['C4', 'E4', 'G4'])
    expect(free.moving()).toBe(true)
    key('KeyA', false, 600)
    key('KeyG', false, 600)
    free.frame(600 + RISE_MS + 1)
    expect(free.trails).toEqual([])
    expect(free.moving()).toBe(false)
  })

  it('makes Space the sustain pedal', () => {
    const { free, asked, key } = stand()
    free.enter()
    key('Space', true)
    key('Space', true)
    key('Space', false)
    expect(asked.sustain).toEqual([true, false])
    expect(free.pedal).toBe(false)
  })

  it('plays a band underneath, a window at a time, and stops it without losing the pedal', () => {
    const { free, asked, key } = stand()
    free.enter()
    key('Space', true)
    key('Digit3', true, 1000)
    expect(free.backing?.index).toBe(2)
    free.frame(1000)
    expect(asked.played.at(-1)?.length).toBeGreaterThan(10)
    const first = asked.played.length
    free.frame(1500)
    expect(asked.played).toHaveLength(first)
    free.frame(4000)
    expect(asked.played.length).toBeGreaterThan(first)
    // Another track replaces it; 0 stops it, and the pedal the stop let go is put back.
    key('Digit1', true, 5000)
    expect(free.backing?.index).toBe(0)
    key('Digit0', true, 6000)
    expect(free.backing).toBeNull()
    expect(asked.stops).toBe(2)
    expect(asked.sustain).toEqual([true, true, true])
    // Enter starts the first band; comma and period step round the whole list, past what
    // the digits reach.
    key('Enter', true, 7000)
    expect(free.backing?.index).toBe(0)
    key('Comma', true, 7100)
    expect(free.backing?.index).toBe(SONGS.length - 1)
    key('Period', true, 7200)
    expect(free.backing?.index).toBe(0)
    key('Digit9', true, 7300)
    expect(free.backing?.index).toBe(8)
    for (let i = 0; i < SONGS.length - 9; i++) key('Period', true, 7400 + i)
    expect(free.backing?.index).toBe(SONGS.length - 1)
    expect(key('Escape', true)).toBe('leave')
    free.leave()
    expect(free.backing).toBeNull()
    expect(free.pedal).toBe(false)
  })
})
