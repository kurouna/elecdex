import { describe, expect, it } from 'vitest'
import { arrange } from '../../examples/plugins/keystream/arrange'
import { buildChart, COUNT_IN_BEATS } from '../../examples/plugins/keystream/chart'
import { layoutOf } from '../../examples/plugins/keystream/draw/layout'
import { alpha } from '../../examples/plugins/keystream/draw/paint'
import { parseChord, voicing } from '../../examples/plugins/keystream/harmony'
import plugin from '../../examples/plugins/keystream/index'
import {
  accuracyOf,
  gradeOf,
  newTally,
  rankOf,
  record,
  scoreOf,
  windowOf,
} from '../../examples/plugins/keystream/judge'
import {
  isBlack,
  KEYS,
  keyOf,
  NOTE_KEYS,
  noteName,
} from '../../examples/plugins/keystream/keyboard'
import {
  makeClock,
  parseMelody,
  readSong,
  type SongSource,
} from '../../examples/plugins/keystream/notation'
import { bestOf, bindRecords, submit } from '../../examples/plugins/keystream/records'
import { AHEAD_MS, nextWindow, notesBetween } from '../../examples/plugins/keystream/schedule'
import { Session } from '../../examples/plugins/keystream/session'
import { SONGS } from '../../examples/plugins/keystream/songs/index'
import { parseDescriptor } from '../../src/shared/plugins'

/**
 * KEYSTREAM, the sample plugin for canvas, keys and sound (examples/plugins/keystream): the
 * instrument, the notation, the songs, the band, judgement and a play's clock.
 */

const tiny: SongSource = {
  id: 'tiny',
  title: 'TINY',
  credit: 'test',
  tempo: [{ bar: 0, bpm: 120 }],
  grid: 2,
  melody: ['a.s.d-f-|g.......'],
  chords: ['C | C'],
  energy: '22',
  style: 'synthwave',
}

describe('the keyboard as a piano', () => {
  it('plays eighteen notes, one semitone apart, from middle C up on A', () => {
    const pitches = [...NOTE_KEYS].map((k) => k.pitch as number).sort((a, b) => a - b)
    expect(pitches).toHaveLength(18)
    expect(pitches[0]).toBe(60)
    expect(pitches).toEqual(Array.from({ length: 18 }, (_, i) => 60 + i))
    expect(keyOf('KeyA')?.pitch).toBe(60)
    expect(keyOf('Quote')?.pitch).toBe(77)
  })

  it('puts each black key between the two white keys it sits between on a piano', () => {
    for (const key of NOTE_KEYS.filter(isBlack)) {
      const below = NOTE_KEYS.find((k) => !isBlack(k) && k.pitch === (key.pitch as number) - 1)
      const above = NOTE_KEYS.find((k) => !isBlack(k) && k.pitch === (key.pitch as number) + 1)
      expect(below && above, key.code).toBeTruthy()
      expect(key.x).toBe(((below?.x ?? 0) + (above?.x ?? 0)) / 2)
    }
    // Where a piano has no black key, the key above the gap plays nothing.
    for (const code of ['KeyQ', 'KeyR', 'KeyI', 'BracketLeft', 'BracketRight']) {
      expect(keyOf(code)?.pitch).toBeNull()
    }
    expect(KEYS).toHaveLength(23)
    expect(noteName(61)).toBe('C#4')
  })
})

describe('notation', () => {
  it('reads a melody: keys start notes, dashes hold them, dots rest', () => {
    const { notes, problems, bars } = parseMelody(['a.s.d-f-|g.......'], 2)
    expect(problems).toEqual([])
    expect(bars).toBe(2)
    expect(notes.map((n) => [n.code, n.beat, n.beats])).toEqual([
      ['KeyA', 0, 0.5],
      ['KeyS', 1, 0.5],
      ['KeyD', 2, 1],
      ['KeyF', 3, 1],
      ['KeyG', 4, 0.5],
    ])
    expect(notes.map((n) => n.onBeat)).toEqual([true, true, true, true, true])
  })

  it('says what is wrong with a melody rather than guessing', () => {
    expect(parseMelody(['a.s.d-f'], 2).problems[0]).toMatch(/7 steps/)
    expect(parseMelody(['-.......'], 2).problems[0]).toMatch(/holds a rest/)
    expect(parseMelody(['r.......'], 2).problems[0]).toMatch(/not a key that plays/)
  })

  it('keeps time through a tempo that climbs, and counts in before the first beat', () => {
    const steady = makeClock([{ bar: 0, bpm: 120 }], 16)
    expect(steady.time(4)).toBe(2000)
    expect(steady.time(-4)).toBe(-2000)
    const climbing = makeClock(
      [
        { bar: 0, bpm: 100, ramp: true },
        { bar: 4, bpm: 200 },
      ],
      32,
    )
    expect(climbing.bpm(0)).toBe(100)
    expect(climbing.bpm(8)).toBe(150)
    expect(climbing.bpm(16)).toBe(200)
    // Each beat quicker than the one before, and the tempo held after the ramp.
    const lengths = [1, 5, 9, 13].map((b) => climbing.time(b + 1) - climbing.time(b))
    expect(lengths).toEqual([...lengths].sort((a, b) => b - a))
    expect(climbing.time(21) - climbing.time(20)).toBeCloseTo(300, 5)
  })
})

describe('the songs', () => {
  it('read without a problem, and stay on the keyboard', () => {
    expect(SONGS.length).toBeGreaterThanOrEqual(4)
    for (const source of SONGS) {
      const score = readSong(source)
      expect(score.problems, source.id).toEqual([])
      expect(score.notes.length, source.id).toBeGreaterThan(100)
      for (const note of score.notes) {
        expect(note.pitch).toBeGreaterThanOrEqual(60)
        expect(note.pitch).toBeLessThanOrEqual(77)
      }
      for (const chords of score.chords) {
        for (const chord of chords)
          expect(parseChord(chord), `${source.id} ${chord}`).not.toBeNull()
      }
    }
  })

  it('last about a minute and a half at most, and have distinct ids', () => {
    for (const source of SONGS) {
      const chart = buildChart(readSong(source), 'normal')
      expect(chart.duration, source.id).toBeGreaterThan(45_000)
      expect(chart.duration, source.id).toBeLessThan(95_000)
    }
    expect(new Set(SONGS.map((s) => s.id)).size).toBe(SONGS.length)
  })
})

describe('chords', () => {
  it('reads roots, qualities and slash basses', () => {
    expect(parseChord('Am')).toEqual({ root: 9, tones: [0, 3, 7], bass: 9 })
    expect(parseChord('Bb')?.root).toBe(10)
    expect(parseChord('C#m7')).toMatchObject({ root: 1, tones: [0, 3, 7, 10] })
    expect(parseChord('D7/C')).toMatchObject({ root: 2, bass: 0 })
    expect(parseChord('H')).toBeNull()
    expect(voicing(parseChord('C') ?? { root: 0, tones: [], bass: 0 }, 53)).toEqual([55, 60, 64])
  })
})

describe('the band', () => {
  it('plays under every bar with energy, in order, and rolls into a louder part', () => {
    const score = readSong({ ...tiny, energy: '23' })
    const parts = arrange(score)
    expect(parts.length).toBeGreaterThan(20)
    expect(parts.map((p) => p.beat)).toEqual([...parts.map((p) => p.beat)].sort((a, b) => a - b))
    // The last beat before the lift is a snare roll, and the lift opens on a cymbal.
    const roll = parts.filter((p) => p.voice === 'snare' && p.beat >= 3 && p.beat < 4)
    expect(roll).toHaveLength(4)
    expect(parts.some((p) => p.voice === 'crash' && p.beat === 4)).toBe(true)
  })

  it('sits out a bar of no energy', () => {
    const parts = arrange(readSong({ ...tiny, energy: '02' }))
    expect(parts.every((p) => p.beat >= 4)).toBe(true)
  })
})

describe('the chart', () => {
  it('gives EASY only the notes on the beat, and plays the rest itself', () => {
    const score = readSong({ ...tiny, melody: ['aa.sd-f-|g.......'] })
    const easy = buildChart(score, 'easy')
    const normal = buildChart(score, 'normal')
    expect(normal.notes).toHaveLength(6)
    expect(normal.auto).toHaveLength(0)
    expect(easy.notes.map((n) => n.code)).toEqual(['KeyA', 'KeyD', 'KeyF', 'KeyG'])
    expect(easy.auto.map((n) => n.code)).toEqual(['KeyA', 'KeyS'])
  })

  it('counts in before the song and times notes in milliseconds', () => {
    const chart = buildChart(readSong(tiny), 'normal')
    const clicks = chart.band.filter((c) => c.time < 0)
    expect(clicks.filter((c) => c.voice === 'hat')).toHaveLength(COUNT_IN_BEATS)
    expect(chart.notes.map((n) => n.time)).toEqual([0, 500, 1000, 1500, 2000])
    expect(chart.notes[2]?.length).toBe(500)
    expect(chart.beats[0]).toEqual({ time: -2000, bar: true })
    expect(chart.bpm).toEqual({ from: 120, to: 120 })
  })
})

describe('judgement', () => {
  it('grades by how far from the note, tighter on HARD', () => {
    expect(gradeOf(-30, 'normal')).toBe('SYNC')
    expect(gradeOf(60, 'normal')).toBe('LOCK')
    expect(gradeOf(-110, 'normal')).toBe('ACK')
    expect(gradeOf(130, 'normal')).toBeNull()
    expect(gradeOf(35, 'hard')).toBe('LOCK')
    expect(windowOf('hard')).toBe(90)
  })

  it('keeps the chain, the gauge and the score', () => {
    let tally = newTally('normal', 4)
    tally = record(tally, 'SYNC', -5)
    tally = record(tally, 'LOCK', 50)
    tally = record(tally, 'DROP', null)
    tally = record(tally, 'SYNC', 2)
    expect(tally.chain).toBe(1)
    expect(tally.maxChain).toBe(2)
    expect(tally.deltas).toEqual([-5, 50, 2])
    expect(scoreOf(tally)).toBe(687_500)
    expect(accuracyOf(tally)).toBeCloseTo(68.75)
    expect(rankOf(scoreOf(tally))).toBe('D')
    expect(rankOf(955_000)).toBe('S')
  })

  it('ends a HARD play when the signal runs out, and never an easier one', () => {
    let hard = newTally('hard', 20)
    let normal = newTally('normal', 20)
    for (let i = 0; i < 15; i++) {
      hard = record(hard, 'DROP', null)
      normal = record(normal, 'DROP', null)
    }
    expect(hard.failed).toBe(true)
    expect(normal.signal).toBe(0)
    expect(normal.failed).toBe(false)
  })
})

describe('a play', () => {
  const chart = buildChart(readSong(tiny), 'normal')

  it('matches a key to the nearest note on it, and counts a key that matches none', () => {
    const session = new Session(chart, 10_000, 0)
    expect(session.press('KeyA', 10_020)).toMatchObject({ kind: 'hit', grade: 'SYNC', delta: 20 })
    expect(session.stateOf(0)).toBe('hit')
    expect(session.press('KeyA', 10_030)).toEqual({ kind: 'stray', code: 'KeyA' })
    expect(session.press('KeyS', 10_430)).toMatchObject({ kind: 'hit', grade: 'LOCK', delta: -70 })
    expect(session.tally.stray).toBe(1)
  })

  it('drops the notes whose window has passed, once', () => {
    const session = new Session(chart, 0, 0)
    expect(session.advance(1100).map((o) => o.kind)).toEqual(['drop', 'drop'])
    expect(session.advance(1100)).toEqual([])
    expect(session.tally.counts.DROP).toBe(2)
    expect(session.droppedAt(0)).toBe(1100)
  })

  it('takes the player lag off every key', () => {
    const session = new Session(chart, 0, 60)
    expect(session.press('KeyA', 60)).toMatchObject({ kind: 'hit', grade: 'SYNC', delta: 0 })
  })

  it('stands still while paused and counts down before going on', () => {
    const session = new Session(chart, 0, 0)
    session.pause(700)
    expect(session.songTime(5000)).toBe(700)
    expect(session.press('KeyS', 5000)).toBeNull()
    expect(session.resume(5000, 1500)).toBe(700)
    // The field holds at 700 while the countdown runs, and keys do not count.
    expect(session.shownTime(5500)).toBe(700)
    expect(session.press('KeyD', 5500)).toBeNull()
    expect(session.heardAt(1000)).toBe(6800)
    expect(session.press('KeyD', 6800)).toMatchObject({ kind: 'hit', grade: 'SYNC' })
  })

  it('pausing again during the count stops where the field stands, never earlier', () => {
    const session = new Session(chart, 0, 0)
    session.pause(700)
    session.resume(5000, 1500)
    // Paused half way through the count: the field stood at 700, and so does the song.
    session.pause(5700)
    expect(session.songTime(9000)).toBe(700)
    expect(session.resume(9000, 1500)).toBe(700)
  })

  it('gives a late key the note it was late for, not the next one on the same key', () => {
    // Two notes on A, 170 ms apart with a quick tempo: nearer each other than two windows.
    const quick = buildChart(
      readSong({ ...tiny, tempo: [{ bar: 0, bpm: 530 }], melody: ['aa......|........'] }),
      'normal',
    )
    const gap = (quick.notes[1]?.time ?? 0) - (quick.notes[0]?.time ?? 0)
    expect(gap).toBeLessThan(120 * 2)
    const session = new Session(quick, 0, 0)
    // 100 ms late for the first: nearer the second, but the first is the one it was for.
    expect(session.press('KeyA', 100)).toMatchObject({ kind: 'hit', index: 0, grade: 'ACK' })
    expect(session.press('KeyA', gap)).toMatchObject({ kind: 'hit', index: 1, grade: 'SYNC' })
  })

  it('keeps a note a frame past its window, for a key typed at its last moment', () => {
    const session = new Session(chart, 0, 0)
    // The frame at 125 ms has passed the window (120 ms), the key at 118 ms reaches it after.
    expect(session.advance(125)).toEqual([])
    expect(session.press('KeyA', 118)).toMatchObject({ kind: 'hit', grade: 'ACK' })
    expect(session.advance(700).map((o) => o.kind)).toEqual(['drop'])
  })

  it('is over when the song has played out', () => {
    const session = new Session(chart, 0, 0)
    expect(session.over(chart.duration - 1)).toBe(false)
    expect(session.over(chart.duration + 1)).toBe(true)
  })
})

describe('sending what the game plays', () => {
  const chart = buildChart(readSong(SONGS[3] as SongSource), 'easy')
  const how = { lead: 'epiano' as const, volume: 1, guide: true, heardAt: (t: number) => t + 1000 }
  const order = (notes: readonly object[]) => notes.map((n) => JSON.stringify(n)).sort()

  it('sends every note once, a window at a time, however the frames fall', () => {
    const whole = notesBetween(chart, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, how)
    expect(whole).toHaveLength(chart.band.length + chart.auto.length + chart.notes.length)
    let sentTo = chart.clock.time(-COUNT_IN_BEATS) - 120
    const sent: object[] = []
    let windows = 0
    for (let time = sentTo; time < chart.duration + AHEAD_MS; time += 16.7) {
      const to = nextWindow(time, sentTo)
      if (to === null) continue
      sent.push(...notesBetween(chart, sentTo, to, how))
      sentTo = to
      windows += 1
    }
    expect(order(sent)).toEqual(order(whole))
    // A window at a time: dozens of small sends, never the song at once.
    expect(windows).toBeGreaterThan(20)
  })

  it('keeps a few seconds ahead of the song and no more', () => {
    expect(nextWindow(0, 5000)).toBeNull()
    expect(nextWindow(2500, 5000)).toBe(2500 + AHEAD_MS)
    const window = notesBetween(chart, 10_000, 15_000, how)
    expect(window.length).toBeGreaterThan(0)
    for (const note of window) {
      expect(note.at).toBeGreaterThanOrEqual(11_000)
      expect(note.at).toBeLessThan(16_000)
    }
    expect(notesBetween(chart, 10_000, 15_000, { ...how, guide: false }).length).toBeLessThan(
      window.length,
    )
  })
})

describe('records', () => {
  it('keep the best score of a track at a level, and a full chain once earned', () => {
    const stored = new Map<string, unknown>()
    bindRecords({
      get: <T>(key: string) => stored.get(key) as T | undefined,
      set: (key: string, value: unknown) => stored.set(key, value),
    })
    const best = { score: 900_000, rank: 'A' as const, maxChain: 80, fullChain: true }
    expect(submit('tiny', 'normal', best)).toBe(true)
    expect(
      submit('tiny', 'normal', { ...best, score: 800_000, fullChain: false, maxChain: 90 }),
    ).toBe(false)
    expect(bestOf('tiny', 'normal')).toEqual({ ...best, maxChain: 90 })
    expect(bestOf('tiny', 'hard')).toBeNull()
    expect(stored.get('records')).toMatchObject({ 'tiny:normal': { score: 900_000 } })
  })
})

describe('drawing helpers', () => {
  it('fade the colours the host hands over', () => {
    expect(alpha('rgb(10, 20, 30)', 0.5)).toBe('rgba(10, 20, 30, 0.5)')
    expect(alpha('rgba(10, 20, 30, 0.5)', 0.5)).toBe('rgba(10, 20, 30, 0.25)')
    expect(alpha('#ff0000', 1)).toBe('rgba(255, 0, 0, 1)')
    expect(alpha('hsl(1 2% 3%)', 0.5)).toBe('hsl(1 2% 3%)')
  })

  it('stand the keyboard along the bottom, centred, with the lanes over it', () => {
    for (const [w, h] of [
      [520, 340],
      [1280, 800],
      [1900, 1000],
    ] as const) {
      const l = layoutOf(w, h)
      const a = keyOf('KeyA')
      const quote = keyOf('Quote')
      if (!a || !quote) throw new Error('no keys')
      expect(l.keyTop(a) + l.cap).toBeLessThanOrEqual(h)
      expect(l.line).toBeLessThan(l.keysTop)
      expect(l.field.h).toBeGreaterThan(80)
      expect(l.keyX(a) - l.unit / 2).toBeGreaterThanOrEqual(0)
      expect(l.keyX(quote) + l.unit / 2).toBeLessThanOrEqual(w)
      expect(l.field.x + l.field.w / 2).toBeCloseTo(w / 2)
    }
  })
})

describe('the plugin', () => {
  it('describes itself as an API 2 plugin that takes keys and plays sound', () => {
    const raw = JSON.parse(JSON.stringify(plugin)) as Record<string, unknown>
    const parsed = parseDescriptor({ ...raw, hasService: true })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.descriptor.permissions).toMatchObject({ keys: true, sound: true, hosts: [] })
    expect(parsed.descriptor.zoom).toBe('full')
  })
})
