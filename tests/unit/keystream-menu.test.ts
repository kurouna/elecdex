import { describe, expect, it } from 'vitest'
import { buildChart, type Chart, openingBars } from '../../examples/plugins/keystream/chart'
import { busyness, starsOf } from '../../examples/plugins/keystream/difficulty'
import { layoutOf } from '../../examples/plugins/keystream/draw/layout'
import { drawMenu, type MenuList, type MenuView } from '../../examples/plugins/keystream/draw/menu'
import {
  blinkLit,
  type MenuFrame,
  MenuMotion,
  MOTION,
  rowIn,
  starsLit,
  tabPower,
} from '../../examples/plugins/keystream/draw/menu-motion'
import {
  GENRES,
  isShelf,
  onShelf,
  SHELVES,
  type Shelf,
  settle,
  shelfOfKey,
  stepRow,
  stepShelf,
} from '../../examples/plugins/keystream/genres'
import { labelOf } from '../../examples/plugins/keystream/keyboard'
import { readSong } from '../../examples/plugins/keystream/notation'
import { SONGS } from '../../examples/plugins/keystream/songs/index'
import { colour, paint, recorder } from './keystream-canvas'

/**
 * KEYSTREAM's menu (examples/plugins/keystream/draw/menu.ts): the genre tabs, the stars,
 * how the menu moves (menu-motion.ts), and what a frame of it draws, on a canvas that only
 * records what it is asked to write.
 */

const charts = SONGS.map((song) => buildChart(readSong(song), 'normal'))
const genres = SONGS.map((song) => song.genre)
const index = (id: string) => SONGS.findIndex((song) => song.id === id)
const starsFor = (chart: Chart) => starsOf(chart.notes.map((n) => n.time))

const STILL: MenuFrame = {
  tab: null,
  level: null,
  cursor: null,
  rows: null,
  stars: null,
  blink: null,
}

function listOf(shelf: Shelf, chosen: number): MenuList {
  const places = onShelf(genres, shelf)
  const rows = places.flatMap((i) => {
    const chart = charts[i]
    return chart ? [{ chart, best: null, number: i + 1, stars: starsFor(chart) }] : []
  })
  return { rows, selected: chosen === SONGS.length ? rows.length : places.indexOf(chosen) }
}

function menu(
  chosen: number,
  size: { w: number; h: number },
  frame: MenuFrame = STILL,
  shelf: Shelf = 'all',
  before: MenuList | null = null,
) {
  const chart = charts[chosen]
  const view: MenuView = {
    list: listOf(shelf, chosen),
    before,
    tabs: SHELVES.map((s) => ({ name: s.toUpperCase(), count: onShelf(genres, s).length })),
    tab: SHELVES.indexOf(shelf),
    level: 'normal',
    speed: 5,
    note: 'NOTE',
    levelNote: 'LEVEL NOTE',
    opening: chart ? openingBars(chart, 4).map((bar) => bar.map((c) => labelOf({}, c))) : [],
    free: 'FREE',
  }
  const { g, texts, writes, fills } = recorder()
  const drawn = drawMenu(paint(g, size.w, size.h), layoutOf(size.w, size.h), view, frame)
  return { texts, writes, fills, drawn }
}

describe('the genre tabs', () => {
  it('file every track under one of four genres, each holding a few', () => {
    expect(new Set(genres)).toEqual(new Set(GENRES))
    for (const genre of GENRES) {
      expect(onShelf(genres, genre).length, genre).toBeGreaterThanOrEqual(3)
    }
    expect(onShelf(genres, 'all')).toHaveLength(SONGS.length)
  })

  it('are picked by 0 to 4 and stepped round by < and >', () => {
    expect(SHELVES.map((_, i) => shelfOfKey(`Digit${i}`))).toEqual([...SHELVES])
    expect(shelfOfKey('Digit5')).toBeNull()
    expect(shelfOfKey('KeyA')).toBeNull()
    expect(stepShelf('all', -1)).toBe('electro')
    expect(stepShelf('electro', 1)).toBe('all')
    expect(isShelf('pop')).toBe(true)
    expect(isShelf('jazz')).toBe(false)
  })

  it('keep the choice when the new tab shows it, and else take its first row', () => {
    const pop = [...onShelf(genres, 'pop'), SONGS.length]
    const sakura = index('sakura-signal')
    expect(settle(pop, sakura)).toBe(sakura)
    expect(settle(pop, index('twinkle'))).toBe(pop[0])
    // FREE PLAY is on every tab.
    expect(settle(pop, SONGS.length)).toBe(SONGS.length)
  })

  it('move the cursor round the tab’s own rows only', () => {
    const rows = [3, 7, 12, 18]
    expect(stepRow(rows, 7, 1)).toBe(12)
    expect(stepRow(rows, 18, 1)).toBe(3)
    expect(stepRow(rows, 3, -1)).toBe(18)
    expect(stepRow(rows, 5, 1)).toBe(3)
  })
})

describe('the stars', () => {
  it('count how busy the notes are: the average and the busiest four seconds', () => {
    const even = Array.from({ length: 40 }, (_, i) => i * 1000)
    expect(busyness(even)).toBeCloseTo((1 + 1.25) / 2, 1)
    expect(starsOf(even)).toBe(1)
    const rush = Array.from({ length: 400 }, (_, i) => i * 150)
    expect(starsOf(rush)).toBe(5)
    expect(starsOf([])).toBe(1)
  })

  it('run from 1 to 5 over the tracks, which are listed easiest first', () => {
    const stars = charts.map(starsFor)
    expect(stars).toEqual([...stars].sort((a, b) => a - b))
    expect(stars[0]).toBe(1)
    expect(stars.at(-1)).toBe(5)
  })

  it('are no more on EASY than on NORMAL', () => {
    for (const song of SONGS) {
      const score = readSong(song)
      expect(starsFor(buildChart(score, 'easy')), song.id).toBeLessThanOrEqual(
        starsFor(buildChart(score, 'normal')),
      )
    }
  })
})

describe('how the menu moves', () => {
  it('powers the list off into a line and the next on from it, as a pane does', () => {
    expect(tabPower(0)).toMatchObject({ showing: 'before', open: 1 })
    const pressed = tabPower(MOTION.tabOff - 1)
    expect(pressed.showing).toBe('before')
    expect(pressed.open).toBeLessThan(0.1)
    const opening = tabPower(MOTION.tabOff + 1)
    expect(opening.showing).toBe('after')
    expect(opening.open).toBeLessThan(0.1)
    expect(opening.line).toBeGreaterThan(0.9)
    expect(tabPower(MOTION.tabOff + MOTION.tabOn)).toEqual({ showing: 'after', open: 1, line: 0 })
  })

  it('brings the rows in one after another, and blinks a chosen row 100 ms a beat', () => {
    expect(rowIn(0, 0)).toBe(0)
    expect(rowIn(MOTION.rowIn, 0)).toBe(1)
    expect(rowIn(MOTION.rowIn, 3)).toBeLessThan(1)
    expect([0, 25, 50, 75, 100, 125].map(blinkLit)).toEqual([true, true, false, false, true, true])
  })

  it('lights the chosen track’s stars one by one', () => {
    expect(starsLit(0, 4).lit).toBe(1)
    expect(starsLit(MOTION.star * 2 + 1, 4).lit).toBe(3)
    expect(starsLit(MOTION.star * 10, 4)).toEqual({ lit: 4, pop: 1 })
  })

  it('stops, and is still with motion reduced', () => {
    const motion = new MenuMotion()
    motion.shown(0)
    motion.tab(10, 0, 'all')
    expect(motion.alive(100, false)).toBe(true)
    expect(motion.alive(100, true)).toBe(false)
    expect(motion.frame(100, true)).toEqual(STILL)
    expect(motion.alive(5000, false)).toBe(false)
    motion.chosen(6000)
    expect(motion.blinked(6000 + MOTION.blink - 1)).toBe(false)
    expect(motion.blinked(6000 + MOTION.blink)).toBe(true)
  })
})

describe('the menu', () => {
  const mountain = index('mountain-king')

  it('shows the tabs with their counts, and a tab’s tracks under their own numbers', () => {
    const { texts } = menu(index('loopback'), { w: 1600, h: 1000 }, STILL, 'pop')
    expect(texts).toContain('POP 3')
    expect(texts).toContain('ALL 18')
    const titles = texts.filter((t) => SONGS.some((s) => s.title === t))
    expect(titles).toEqual(onShelf(genres, 'pop').map((i) => SONGS[i]?.title))
    expect(texts).toContain(String(index('loopback') + 1).padStart(2, '0'))
    expect(texts).toContain('FREE PLAY')
  })

  it('keeps what is under the list where it is, whichever tab is shown', () => {
    const levelY = (shelf: Shelf, chosen: number) =>
      menu(chosen, { w: 1600, h: 1000 }, STILL, shelf).writes.find((w) => w.text === 'LEVEL')?.y
    const all = levelY('all', index('loopback'))
    expect(all).toBeDefined()
    expect(levelY('pop', index('loopback'))).toBe(all)
    expect(levelY('electro', index('overclock'))).toBe(all)
  })

  it('draws the list the tab left while it powers off, and the new one after', () => {
    const before = listOf('all', mountain)
    const age = (ms: number): MenuFrame => ({ ...STILL, tab: { age: ms, from: null } })
    const going = menu(index('sakura-signal'), { w: 1600, h: 1000 }, age(20), 'pop', before).texts
    expect(going).toContain('MOUNTAIN KING')
    const coming = menu(index('sakura-signal'), { w: 1600, h: 1000 }, age(200), 'pop', before)
    expect(coming.texts).not.toContain('MOUNTAIN KING')
    expect(coming.texts).toContain('SAKURA SIGNAL')
  })

  it('blinks a chosen row in the ground’s colour on the accent, as eDEX’s tiles did', () => {
    expect(colour('inverse')).not.toBe(colour('accentStrong'))
    const lit = menu(mountain, { w: 1600, h: 1000 }, { ...STILL, blink: 10 })
    const dark = menu(mountain, { w: 1600, h: 1000 }, { ...STILL, blink: 60 })
    const titleColour = (r: typeof lit) => r.writes.find((w) => w.text === 'MOUNTAIN KING')?.color
    expect(titleColour(lit)).toBe(colour('inverse'))
    expect(titleColour(dark)).toBe(colour('accentStrong'))
    expect(lit.fills.some((f) => f.color === colour('accent') && f.w > 500)).toBe(true)
  })

  it('remembers where its tabs, levels and cursor were drawn, to move from', () => {
    const { drawn } = menu(mountain, { w: 1600, h: 1000 })
    expect(drawn.tabs).toHaveLength(SHELVES.length)
    expect(drawn.levels).toHaveLength(3)
    expect(drawn.cursor).toBeGreaterThan(0)
  })

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
    expect(menu(index('overclock'), { w: 480, h: 1000 }).texts).toContain('172 BPM')
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
