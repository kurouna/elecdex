import { describe, expect, it } from 'vitest'
import { buildChart } from '../../examples/plugins/keystream/chart'
import { layoutOf } from '../../examples/plugins/keystream/draw/layout'
import {
  drawResult,
  RANK_AT,
  RECORD_AT,
  REVEAL_MS,
  type ResultView,
} from '../../examples/plugins/keystream/draw/result'
import { fanfare } from '../../examples/plugins/keystream/fanfare'
import {
  fastSlow,
  type Grade,
  lampOf,
  newTally,
  rankOf,
  record,
  scoreOf,
  suggestedOffset,
  type Tally,
} from '../../examples/plugins/keystream/judge'
import { readSong } from '../../examples/plugins/keystream/notation'
import { SONGS } from '../../examples/plugins/keystream/songs/index'
import { paint, recorder } from './keystream-canvas'

/**
 * KEYSTREAM's result screen (examples/plugins/keystream/draw/result.ts): how a play ended,
 * the figures under it, the sounds as the rank lands, and the reveal drawn on a canvas that
 * only records what it is asked to write.
 */

function tallyOf(
  level: 'normal' | 'hard',
  plan: Partial<Record<Grade, number>>,
  deltas = 0,
): Tally {
  const total = Object.values(plan).reduce((a, b) => a + (b ?? 0), 0)
  let tally = newTally(level, total)
  for (const grade of ['SYNC', 'LOCK', 'ACK', 'DROP'] as const) {
    for (let i = 0; i < (plan[grade] ?? 0); i++) {
      tally = record(tally, grade, grade === 'DROP' ? null : deltas)
    }
  }
  return tally
}

describe('how a play ended', () => {
  it('lights the lamp for the link lost, every note in SYNC, none dropped, or played out', () => {
    expect(lampOf({ ...tallyOf('hard', { SYNC: 3 }), failed: true })).toBe('NO CARRIER')
    expect(lampOf(tallyOf('normal', { SYNC: 5 }))).toBe('ALL SYNC')
    expect(lampOf(tallyOf('normal', { SYNC: 4, ACK: 1 }))).toBe('FULL CHAIN')
    expect(lampOf(tallyOf('normal', { SYNC: 4, DROP: 1 }))).toBe('CLEAR')
    expect(lampOf(tallyOf('normal', {}))).toBe('CLEAR')
  })

  it('counts the hits outside SYNC as fast or slow, by the level’s window', () => {
    const tally = { ...tallyOf('normal', { SYNC: 1 }), deltas: [-60, -41, -40, 0, 40, 41, 90] }
    expect(fastSlow(tally)).toEqual({ fast: 2, slow: 2 })
    // HARD holds SYNC to 30 ms.
    expect(fastSlow({ ...tally, level: 'hard' })).toEqual({ fast: 3, slow: 3 })
  })
})

describe('the fanfare', () => {
  const when = { rank: 10_000, record: 10_500 }

  it('lands with the rank: a kick, a cymbal and a chord run upwards, longer for a better rank', () => {
    const s = fanfare('S', false, when, 1)
    const d = fanfare('D', false, when, 1)
    for (const notes of [s, d]) {
      expect(notes.filter((n) => n.voice === 'kick').map((n) => n.at)).toEqual([when.rank])
      const chord = notes.filter((n) => n.voice === 'pluck')
      expect(chord.map((n) => n.at)).toEqual([...chord.map((n) => n.at ?? 0)].sort((a, b) => a - b))
      expect(chord.every((n) => (n.at ?? 0) >= when.rank)).toBe(true)
    }
    expect(s.filter((n) => n.voice === 'pluck').length).toBeGreaterThan(
      d.filter((n) => n.voice === 'pluck').length,
    )
  })

  it('blips for a new record, and is silent at no volume', () => {
    expect(fanfare('B', false, when, 1).some((n) => n.voice === 'chip')).toBe(false)
    const record = fanfare('B', true, when, 1).filter((n) => n.voice === 'chip')
    expect(record.map((n) => n.at)).toEqual([when.record, when.record + 100])
    expect(fanfare('A', true, when, 0).every((n) => n.level === 0)).toBe(true)
  })
})

function viewOf(tally: Tally, extra: Partial<ResultView> = {}): ResultView {
  const score = scoreOf(tally)
  return {
    chart: buildChart(readSong(SONGS[0] as (typeof SONGS)[number]), 'normal'),
    index: 0,
    tally,
    score,
    rank: rankOf(score),
    newRecord: true,
    failed: tally.failed,
    previous: null,
    offset: 0,
    ...extra,
  }
}

function drawn(view: ResultView, age: number, size = { w: 1600, h: 900 }, reduced = false) {
  const { g, texts } = recorder()
  const p = paint(g, size.w, size.h, reduced)
  drawResult(p, layoutOf(size.w, size.h), view, age, {})
  return texts
}

describe('the result screen', () => {
  const played = viewOf(tallyOf('normal', { SYNC: 90, LOCK: 8, ACK: 2 }))

  it('says the timing offset to set when the hits ran late or early on the whole', () => {
    // 18 ms late on average at an offset of 0: 20 is the step nearest. The deltas are what
    // is left after the offset, so the same lateness at 20 asks for 40; 2 ms left asks nothing.
    const late = tallyOf('normal', { SYNC: 40, LOCK: 10 }, 18)
    const centred = tallyOf('normal', { SYNC: 30 }, 2)
    expect(suggestedOffset(late, 0)).toBe(20)
    expect(suggestedOffset(late, 20)).toBe(40)
    expect(suggestedOffset(centred, 20)).toBeNull()
    expect(suggestedOffset(tallyOf('normal', { LOCK: 30 }, -62), 10)).toBe(-50)
    expect(suggestedOffset(tallyOf('normal', { LOCK: 30 }, 200), 0)).toBe(150)
    // Too few hits to tell.
    expect(suggestedOffset(tallyOf('normal', { LOCK: 5 }, 60), 0)).toBeNull()
    for (const size of [
      { w: 1600, h: 900 },
      { w: 560, h: 500 },
    ]) {
      expect(drawn(viewOf(late), REVEAL_MS, size)).toContain('SET OFFSET +20')
      const texts = drawn(viewOf(centred, { offset: 20 }), REVEAL_MS, size)
      expect(texts.some((t) => t.startsWith('SET OFFSET'))).toBe(false)
    }
  })

  it('holds the rank and the lamp back until the figures have counted up', () => {
    const early = drawn(played, RANK_AT - 200)
    expect(early).not.toContain('FULL CHAIN')
    expect(early).not.toContain('NEW RECORD')
    const done = drawn(played, REVEAL_MS)
    expect(done).toContain(played.rank)
    expect(done).toContain('FULL CHAIN')
    expect(done).toContain('NEW RECORD')
    expect(done.join(' ')).toContain(String(played.score))
  })

  it('stays as it is once revealed: the last frame drawn is the still screen', () => {
    expect(drawn(played, REVEAL_MS)).toEqual(drawn(played, REVEAL_MS + 60_000))
    expect(RECORD_AT).toBeLessThan(REVEAL_MS)
  })

  it('shows everything at once with motion reduced', () => {
    expect(drawn(played, 0, undefined, true)).toEqual(drawn(played, REVEAL_MS, undefined, true))
    expect(drawn(played, 0, undefined, true)).toContain('FULL CHAIN')
  })

  it('says a lost link, and keeps no record for it', () => {
    const lost = viewOf(
      { ...tallyOf('hard', { SYNC: 10, DROP: 30 }), failed: true },
      {
        newRecord: false,
      },
    )
    const texts = drawn(lost, REVEAL_MS)
    expect(texts).toContain('LINK TERMINATED')
    expect(texts).toContain('NO CARRIER')
    expect(texts).not.toContain('NEW RECORD')
  })

  it('sets the score against the best before it', () => {
    const texts = drawn(viewOf(played.tally, { previous: 812_345 }), REVEAL_MS)
    expect(texts).toContain('812,345')
    expect(texts).toContain(`+${(played.score - 812_345).toLocaleString('en-US')}`)
  })

  it('has its analysis panel only where the pane is wide enough', () => {
    expect(drawn(played, REVEAL_MS)).toContain('SIGNAL  //  ANALYSIS')
    const narrow = drawn(played, REVEAL_MS, { w: 540, h: 900 })
    expect(narrow).not.toContain('SIGNAL  //  ANALYSIS')
    expect(narrow).toContain('MAX CHAIN')
  })
})
