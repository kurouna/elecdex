import { describe, expect, it } from 'vitest'
import { buildChart, openingBars } from '../../examples/plugins/keystream/chart'
import { layoutOf } from '../../examples/plugins/keystream/draw/layout'
import { drawMenu, type MenuView } from '../../examples/plugins/keystream/draw/menu'
import { labelOf } from '../../examples/plugins/keystream/keyboard'
import { readSong } from '../../examples/plugins/keystream/notation'
import { SONGS } from '../../examples/plugins/keystream/songs/index'
import { paint, recorder } from './keystream-canvas'

/**
 * KEYSTREAM's menu (examples/plugins/keystream/draw/menu.ts), drawn on a canvas that only
 * records what it is asked to write: what each row keeps in a narrow pane, and the chosen
 * track's first line under the list.
 */

const charts = SONGS.map((song) => buildChart(readSong(song), 'normal'))
const index = (id: string) => SONGS.findIndex((song) => song.id === id)

function menu(selected: number, size: { w: number; h: number }) {
  const chart = charts[selected]
  const view: MenuView = {
    rows: charts.map((c) => ({ chart: c, best: null })),
    selected,
    level: 'normal',
    speed: 5,
    note: 'NOTE',
    levelNote: 'LEVEL NOTE',
    opening: chart ? openingBars(chart, 4).map((bar) => bar.map((c) => labelOf({}, c))) : [],
    free: 'FREE',
  }
  const { g, texts, writes } = recorder()
  drawMenu(paint(g, size.w, size.h), layoutOf(size.w, size.h), view)
  return { texts, writes }
}

describe('the menu', () => {
  const mountain = index('mountain-king')

  it('gives up a changing tempo’s unit before its style is cut, and only then', () => {
    const shown = new Set<string>()
    for (let w = 480; w <= 1200; w += 4) {
      const texts = menu(mountain, { w, h: 1000 }).texts
      const at = texts.indexOf('MOUNTAIN KING')
      const [style, , , tempo] = texts.slice(at + 1, at + 5)
      shown.add(tempo ?? '')
      expect(['96→176 BPM', '96→176'], `${w}`).toContain(tempo)
      // With its unit, the style is whole; without it, the style is whole or all there is room for.
      if (tempo === '96→176 BPM') expect(style, `${w}`).toMatch(/^ROCK($| {2}\/\/ )/)
    }
    // Both happen across the widths: wide panes keep the unit, narrow ones drop it.
    expect(shown).toEqual(new Set(['96→176 BPM', '96→176']))
    // A steady tempo keeps its unit, however narrow.
    expect(menu(mountain, { w: 480, h: 1000 }).texts).toContain('172 BPM')
  })

  it('keeps room for the chosen track’s first line under a long list', () => {
    const tall = menu(mountain, { w: 1600, h: 1000 })
    expect(tall.texts).toContain('FIRST LINE')
    // The list scrolls rather than taking the line's room: not every track is on it.
    expect(tall.texts.filter((t) => SONGS.some((s) => s.title === t)).length).toBeLessThan(
      SONGS.length,
    )
    // Too short a pane for both: the list first.
    expect(menu(mountain, { w: 1600, h: 560 }).texts).not.toContain('FIRST LINE')
  })

  it('never ends the first line on a bar’s rule', () => {
    // Every width, so every place the line's end can fall is met.
    for (let w = 400; w <= 1100; w++) {
      const line = menu(mountain, { w, h: 1000 }).writes.filter((x) => x.font === '600 20px x')
      expect(line.length, `${w}`).toBeGreaterThan(0)
      expect(line.at(-1)?.text, `${w}`).not.toBe('|')
    }
  })
})
