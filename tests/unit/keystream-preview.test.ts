import { describe, expect, it } from 'vitest'
import type { Note } from '../../examples/plugins/elecdex-plugin'
import { buildChart } from '../../examples/plugins/keystream/chart'
import { layoutOf } from '../../examples/plugins/keystream/draw/layout'
import { decoded, streak, sweep, typed } from '../../examples/plugins/keystream/draw/menu-motion'
import { drawResult, EXIT_MS, type ResultView } from '../../examples/plugins/keystream/draw/result'
import { TUBE, tube } from '../../examples/plugins/keystream/draw/result-parts'
import { newTally, rankOf, record, scoreOf } from '../../examples/plugins/keystream/judge'
import { barsIn, readSong } from '../../examples/plugins/keystream/notation'
import {
  fadeAt,
  PREVIEW,
  PreviewPlayer,
  previewBetween,
  previewSpan,
  turnLength,
} from '../../examples/plugins/keystream/preview'
import { SONGS } from '../../examples/plugins/keystream/songs/index'
import { colour, paint, recorder } from './keystream-canvas'

/**
 * KEYSTREAM's preview of the track under the menu's cursor (preview.ts), the cursor's sweep
 * and the chosen track's decode and retyping (menu-motion.ts), and the result screen's way
 * in and out (result.ts).
 */

const chartOf = (id: string) => {
  const song = SONGS.find((s) => s.id === id)
  if (!song) throw new Error(id)
  return buildChart(readSong(song), 'normal')
}
const how = { lead: 'epiano' as const, volume: 1, heardAt: (t: number) => t }

describe('the preview', () => {
  it('plays whole bars from the song’s best part, about fifteen seconds of them', () => {
    for (const song of SONGS) {
      const chart = chartOf(song.id)
      const span = previewSpan(chart)
      const bars = chart.beats.filter((b) => b.bar && b.time >= 0).map((b) => b.time)
      expect(bars, song.id).toContain(span.from)
      expect(bars, song.id).toContain(span.to)
      expect(span.to - span.from, song.id).toBeGreaterThan(10_000)
      expect(span.to - span.from, song.id).toBeLessThan(20_000)
    }
    // SAKURA SIGNAL is heard from its chorus: after its intro, verse and pre-chorus.
    const sakura = chartOf('sakura-signal')
    expect(previewSpan(sakura).from).toBe(sakura.clock.time((sakura.song.preview ?? 0) * 4))
    expect(sakura.song.preview).toBe(20)
    expect(barsIn('a.......|s.......', 'd.......')).toBe(3)
  })

  it('fades in and out of each turn, with a breath between turns', () => {
    expect(fadeAt(0, 10_000)).toBe(0)
    expect(fadeAt(PREVIEW.fadeInMs, 10_000)).toBe(1)
    expect(fadeAt(10_000 - PREVIEW.fadeOutMs / 2, 10_000)).toBeCloseTo(0.5)
    const chart = chartOf('neon-circuit')
    const span = previewSpan(chart)
    const turn = turnLength(span)
    const notes = previewBetween(chart, span, 0, turn * 2, how)
    // Nothing is heard in the breath; the second turn is the first again.
    const gap = notes.filter((n) => (n.at ?? 0) >= span.to - span.from && (n.at ?? 0) < turn)
    expect(gap).toEqual([])
    const first = notes.filter((n) => (n.at ?? 0) < turn)
    const second = notes.filter((n) => (n.at ?? 0) >= turn)
    expect(second.map((n) => n.pitch)).toEqual(first.map((n) => n.pitch))
    // The melody is in it, in the lead's voice.
    expect(first.some((n) => n.voice === 'epiano')).toBe(true)
    expect(Math.max(...first.map((n) => n.level ?? 0))).toBeLessThanOrEqual(1)
  })

  it('waits for the cursor to rest, then plays a window at a time, and stops as it moves on', () => {
    const played: Note[][] = []
    let stops = 0
    const player = new PreviewPlayer({ play: (n) => played.push(n), stop: () => (stops += 1) })
    const chosen = { index: 3, chart: chartOf('ode-to-joy') }
    player.rest(0)
    player.tick(PREVIEW.restMs - 1, chosen, how)
    expect(played).toHaveLength(0)
    expect(player.waiting(PREVIEW.restMs - 1, 3)).toBe(true)
    player.tick(PREVIEW.restMs, chosen, how)
    expect(player.index).toBe(3)
    expect(played).toHaveLength(1)
    expect(player.waiting(PREVIEW.restMs, 3)).toBe(false)
    // More only once the song nears the end of what was sent.
    player.tick(PREVIEW.restMs + 1000, chosen, how)
    expect(played).toHaveLength(1)
    player.tick(PREVIEW.restMs + 3000, chosen, how)
    expect(played).toHaveLength(2)
    // The cursor moves: it stops at once, and the next is heard only after a rest.
    player.rest(5000)
    expect(stops).toBe(1)
    expect(player.index).toBeNull()
    player.tick(5100, { index: 4, chart: chartOf('twinkle') }, how)
    expect(player.index).toBeNull()
    // Nothing to hear (FREE PLAY, the menu left): stopped; stopping twice stops once.
    player.tick(9000, { index: 4, chart: chartOf('twinkle') }, how)
    player.tick(9100, null, how)
    player.stop()
    expect(stops).toBe(2)
  })
})

describe('the cursor and the choice', () => {
  it('sweeps quick off the mark and eases in, leaving a fading streak', () => {
    expect(sweep(0)).toBe(0)
    expect(sweep(0.2)).toBeGreaterThan(0.7)
    expect(sweep(1)).toBe(1)
    const ghosts = streak(100, 200, 0.3)
    expect(ghosts.map((g) => g.y)).toEqual([180, 155, 130])
    expect(ghosts[0]?.alpha ?? 0).toBeGreaterThan(ghosts[2]?.alpha ?? 1)
    expect(streak(100, 200, 1)).toEqual([])
  })

  it('decodes the chosen title from the left, and retypes its details', () => {
    const title = 'NEON CIRCUIT'
    expect(decoded(title, 0)).toHaveLength(title.length)
    expect(decoded(title, 0)).not.toBe(title)
    expect(decoded(title, 0)[4]).toBe(' ')
    expect(decoded(title, 120).slice(0, 6)).toBe(title.slice(0, 6))
    expect(decoded(title, 1000)).toBe(title)
    expect(typed(40, 0)).toBe(0)
    expect(typed(40, 160)).toBe(20)
    expect(typed(40, 5000)).toBe(40)
  })
})

describe('the result’s way in and out', () => {
  it('opens from a line, and closes into it after the pressed key’s blink', () => {
    expect(tube(0, null)).toEqual({ open: 0, line: 1 })
    expect(tube(TUBE.open, null)).toEqual({ open: 1, line: 0 })
    expect(tube(5000, TUBE.blink - 1)).toEqual({ open: 1, line: 0 })
    expect(tube(5000, TUBE.blink + TUBE.close).open).toBe(0)
    expect(EXIT_MS).toBe(TUBE.blink + TUBE.close)
  })

  it('blinks the hint of the key pressed', () => {
    let tally = newTally('normal', 10)
    for (let i = 0; i < 10; i++) tally = record(tally, 'SYNC', 0)
    const score = scoreOf(tally)
    const view: ResultView = {
      chart: chartOf('twinkle'),
      index: 0,
      tally,
      score,
      rank: rankOf(score),
      newRecord: false,
      failed: false,
      previous: null,
      offset: 0,
    }
    const draw = (exit: { key: 0 | 1; age: number } | null) => {
      const { g, writes } = recorder()
      drawResult(paint(g, 1600, 900), layoutOf(1600, 900), view, 5000, {}, exit)
      return writes
    }
    const colourOf = (writes: ReturnType<typeof draw>, text: string) =>
      writes.find((w) => w.text === text)?.color
    expect(colourOf(draw({ key: 1, age: 10 }), 'R')).toBe(colour('inverse'))
    expect(colourOf(draw({ key: 1, age: 60 }), 'R')).toBe(colour('text'))
    expect(colourOf(draw({ key: 1, age: 10 }), 'ENTER')).toBe(colour('text'))
    expect(colourOf(draw(null), 'R')).toBe(colour('text'))
  })
})
