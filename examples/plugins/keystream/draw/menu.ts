import type { Chart, Level } from '../chart'
import { LEVELS } from '../chart'
import type { Best } from '../records'
import { bpmText } from './hud'
import type { Layout, Rect } from './layout'
import {
  blinkLit,
  type Drawn,
  type MenuFrame,
  MOTION,
  rowIn,
  slideRect,
  starsLit,
  tabPower,
} from './menu-motion'
import {
  alpha,
  clamp,
  fitted,
  font,
  measure,
  type Paint,
  rule,
  type TextStyle,
  write,
} from './paint'

/**
 * The menu, as a directory listing: the genre tabs, the tracks one to a row with their
 * stars, the level, what the chosen track holds and the best result on it, and the keys
 * that drive it all. How it moves is menu-motion.ts; this draws a frame of it.
 */

export interface MenuRow {
  chart: Chart
  best: Best | null
  /** The track's place in the whole list, from 1: the same on every tab. */
  number: number
  /** 1 to 5, at the chosen level (difficulty.ts). */
  stars: number
}

export interface MenuList {
  rows: MenuRow[]
  /** The chosen row; `rows.length` is FREE PLAY, after the tracks. */
  selected: number
}

export interface MenuView {
  list: MenuList
  /** The list a tab change left, shown while it powers off. */
  before: MenuList | null
  tabs: readonly { name: string; count: number }[]
  tab: number
  level: Level
  speed: number
  /** A line under the list: that keys play by their place on the keyboard. */
  note: string
  /** What the chosen level asks, beside its chip. */
  levelNote: string
  /** The first bars of the chosen track as the keys that play them, bar by bar. */
  opening: readonly (readonly string[])[]
  /** What FREE PLAY is, beside its row. */
  free: string
}

/** m:ss */
export const timeText = (ms: number): string => {
  const s = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export const figure = (n: number): string => n.toLocaleString('en-US')

/** The height the first line takes under the details. */
const OPENING_ROOM = 64
/** The fewest rows the list keeps to make room for the first line. */
const MIN_ROWS = 8
/** Narrower than this, a row's stars are one star and a figure. */
const COMPACT_WIDTH = 720

interface ListBox {
  x: number
  y: number
  width: number
  rowH: number
  fit: number
  compact: boolean
}

export function drawMenu(p: Paint, l: Layout, view: MenuView, f: MenuFrame): Drawn {
  const width = Math.min(l.w - l.pad * 2, 980)
  const x = (l.w - width) / 2
  let y = title(p, l, x, width)
  const tabs = drawTabs(p, x, y, width, view, f)
  y += 38
  const rowH = clamp(l.unit * 0.62, 24, 40)
  // The tracks and FREE PLAY after them, as many as fit, the chosen one always among them -
  // leaving room for the chosen track's first line where the list still shows enough rows.
  // The room is the longest tab's, so what is under the list stays put as the tabs change.
  const total = Math.max(view.list.rows.length, ...view.tabs.map((t) => t.count)) + 1
  const room = l.line - 170 - y
  const withOpening = Math.floor((room - OPENING_ROOM) / rowH)
  const shown = withOpening >= Math.min(MIN_ROWS, total) ? withOpening : Math.floor(room / rowH)
  const fit = clamp(shown, 3, total)
  const box = { x, y, width, rowH, fit, compact: width < COMPACT_WIDTH }
  const cursor = drawShelf(p, box, view, f)
  y += fit * rowH + rowH * 0.6
  const chosen = view.list.rows[view.list.selected]
  if (chosen === undefined) {
    freeDetails(p, x, y + 4)
    footer(p, l, view)
    return { tabs, levels: [], cursor }
  }
  const levels = drawLevels(p, x, y, width, view, f)
  y += 22
  details(p, x, y + 14, width, chosen, view.speed)
  if (y + 110 < l.line - 60) opening(p, x, y + 64, width, view.opening)
  footer(p, l, view)
  return { tabs, levels, cursor }
}

/*
 * Chips: the genre tabs and the levels. The chosen one's light slides to it.
 */

interface ChipSet {
  labels: readonly string[]
  active: number
  from: Rect | null
  /** How far the light has come, 0 to 1. */
  slide: number
}

const chipFont = (p: Paint) => font(600, 12, p.fonts.display)

function chips(p: Paint, x: number, y: number, set: ChipSet): Rect[] {
  const g = p.g
  const style = { font: chipFont(p), color: p.c.muted, spacing: '0.25em' }
  const rects: Rect[] = []
  let at = x
  for (const text of set.labels) {
    const w = measure(p, text, style) + 22
    rects.push({ x: at, y, w, h: 22 })
    at += w + 8
  }
  const target = rects[set.active]
  if (target === undefined) return rects
  const light = set.from && set.slide < 1 ? slideRect(set.from, target, set.slide) : target
  g.fillStyle = p.c.accent
  g.fillRect(light.x, light.y, light.w, light.h)
  rects.forEach((r, i) => {
    const on = i === set.active && set.slide >= 0.6
    g.strokeStyle = alpha(p.c.border, i === set.active ? 1 : 0.6)
    g.lineWidth = 1
    g.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1)
    write(p, set.labels[i] ?? '', r.x + r.w / 2 + 2, r.y + 12, {
      ...style,
      color: on ? p.c.inverse : p.c.muted,
      align: 'center',
      baseline: 'middle',
    })
  })
  return rects
}

/** The genre tabs, each with how many tracks it holds; < > and 0-4 change them. */
function drawTabs(p: Paint, x: number, y: number, width: number, view: MenuView, f: MenuFrame) {
  const counted = width >= 600
  const rects = chips(p, x + 14, y, {
    labels: view.tabs.map((t) => (counted ? `${t.name} ${t.count}` : t.name)),
    active: view.tab,
    from: f.tab?.from ?? null,
    slide: f.tab ? f.tab.age / MOTION.slide : 1,
  })
  const end = rects.at(-1)
  if (end && end.x + end.w + 90 < x + width) {
    write(p, '< >  0-4', x + width - 14, y + 12, {
      font: font(600, 11, p.fonts.mono),
      color: p.c.muted,
      align: 'right',
      baseline: 'middle',
    })
  }
  return rects
}

/** The level chips, and beside them what the chosen level asks. */
function drawLevels(p: Paint, x: number, y: number, width: number, view: MenuView, f: MenuFrame) {
  const at =
    x +
    14 +
    write(p, 'LEVEL', x + 14, y + 11, {
      font: font(500, 10, p.fonts.ui),
      color: p.c.muted,
      spacing: '0.3em',
    }) +
    18
  const rects = chips(p, at, y, {
    labels: LEVELS.map((l) => l.toUpperCase()),
    active: LEVELS.indexOf(view.level),
    from: f.level?.from ?? null,
    slide: f.level ? f.level.age / MOTION.slide : 1,
  })
  const end = rects.at(-1)
  const noteX = (end ? end.x + end.w : at) + 10
  const style = {
    font: font(500, 11, p.fonts.ui),
    color: p.c.muted,
    baseline: 'middle' as const,
    spacing: '0.1em',
  }
  write(p, fitted(p, view.levelNote, x + width - 14 - noteX, style), noteX, y + 12, style)
  return rects
}

/*
 * The list: a shelf's tracks and FREE PLAY, powering off and on as a tab changes.
 */

/** Draws the list as this frame has it; answers the top of the cursor's row. */
function drawShelf(p: Paint, box: ListBox, view: MenuView, f: MenuFrame): number {
  const power = f.tab ? tabPower(f.tab.age) : null
  const list = power?.showing === 'before' && view.before ? view.before : view.list
  const g = p.g
  const h = box.fit * box.rowH
  const mid = box.y + h / 2
  g.save()
  if (power) {
    g.beginPath()
    g.rect(box.x - 4, box.y, box.width + 8, h)
    g.clip()
    g.translate(0, mid)
    g.scale(1, Math.max(0.02, power.open))
    g.translate(0, -mid)
  }
  const shown = drawRows(p, box, list, view.free, f)
  g.restore()
  if (power && power.line > 0) powerLine(p, box, mid, power.line)
  const end = box.y + shown.count * box.rowH
  if (!power || power.open > 0.98) {
    more(p, box.x + box.width, box.y, shown.first > 0, end, shown.first + shown.count < shown.total)
  }
  return list === view.list ? shown.cursor : box.y
}

/** The bright line across the list as it closes and opens. */
function powerLine(p: Paint, box: ListBox, y: number, strength: number): void {
  const g = p.g
  const glow = g.createLinearGradient(0, y - 10, 0, y + 10)
  glow.addColorStop(0, alpha(p.c.accent, 0))
  glow.addColorStop(0.5, alpha(p.c.accent, (p.light ? 0.12 : 0.22) * strength))
  glow.addColorStop(1, alpha(p.c.accent, 0))
  g.fillStyle = glow
  g.fillRect(box.x, y - 10, box.width, 20)
  g.fillStyle = alpha(p.c.accentStrong, 0.9 * strength)
  g.fillRect(box.x, y - 0.75, box.width, 1.5)
}

/** Draws a list's rows; answers where the cursor's row is and which rows were shown. */
function drawRows(p: Paint, box: ListBox, list: MenuList, free: string, f: MenuFrame) {
  const g = p.g
  const total = list.rows.length + 1
  const count = Math.min(box.fit, total)
  const first = clamp(list.selected - Math.floor(count / 2), 0, total - count)
  const top = box.y + (list.selected - first) * box.rowH
  const glide = f.cursor ? Math.min(1, f.cursor.age / MOTION.glide) : 1
  const at = f.cursor ? f.cursor.from + (top - f.cursor.from) * (1 - (1 - glide) ** 3) : top
  const lit = f.blink !== null && blinkLit(f.blink)
  // The cursor comes in with its row.
  g.globalAlpha = f.rows === null ? 1 : rowIn(f.rows, list.selected - first)
  cursorBar(p, box, at, lit)
  for (let i = first; i < first + count; i++) {
    const y = box.y + (i - first) * box.rowH
    g.globalAlpha = f.rows === null ? 1 : rowIn(f.rows, i - first)
    const state = { selected: i === list.selected, inverse: i === list.selected && lit }
    const row = list.rows[i]
    if (row) trackRow(p, box, y, row, state, i === list.selected ? f.stars : null)
    else freeRow(p, box, y, free, state)
  }
  g.globalAlpha = 1
  emptySlots(p, box, count)
  return { cursor: top, first, count, total }
}

/** The room a short tab leaves, marked as empty slots, so the list stays one panel. */
function emptySlots(p: Paint, box: ListBox, count: number): void {
  if (count >= box.fit) return
  const g = p.g
  g.strokeStyle = alpha(p.c.rule, 0.35)
  g.lineWidth = 1
  g.setLineDash([2, 6])
  g.beginPath()
  for (let i = count; i < box.fit; i++) {
    const y = Math.round(box.y + (i + 0.5) * box.rowH) + 0.5
    g.moveTo(box.x + 14, y)
    g.lineTo(box.x + box.width - 14, y)
  }
  g.stroke()
  g.setLineDash([])
}

/** The cursor's bar; lit, it is the blink of a chosen row, as eDEX's tiles blinked. */
function cursorBar(p: Paint, box: ListBox, y: number, lit: boolean): void {
  const g = p.g
  g.fillStyle = lit ? p.c.accent : alpha(p.c.accent, p.light ? 0.12 : 0.1)
  g.fillRect(box.x, y + 2, box.width, box.rowH - 4)
  g.fillStyle = p.c.accentStrong
  g.fillRect(box.x, y + 2, 3, box.rowH - 4)
}

/** Marks that the list goes on above or below what is shown. */
function more(
  p: Paint,
  right: number,
  top: number,
  above: boolean,
  bottom: number,
  below: boolean,
): void {
  const style = { font: font(600, 10, p.fonts.ui), color: p.c.muted, align: 'right' as const }
  if (above) write(p, '▲ MORE', right - 4, top - 4, style)
  if (below) write(p, '▼ MORE', right - 4, bottom + 12, style)
}

interface RowState {
  selected: boolean
  /** The blink's lit beat: the row's words in the ground's colour on the accent. */
  inverse: boolean
}

/** FREE PLAY in the list: no track, the keyboard alone. */
function freeRow(p: Paint, box: ListBox, y: number, words: string, state: RowState): void {
  const g = p.g
  const { x, width } = box
  const h = box.rowH
  g.fillStyle = alpha(p.c.rule, 0.5)
  g.fillRect(x + 14, y + 1, width - 28, 1)
  const mid = y + h / 2
  const quiet = state.inverse ? p.c.inverse : p.c.muted
  write(p, '∞', x + 14, mid, {
    font: font(600, clamp(h * 0.5, 12, 18), p.fonts.mono),
    color: quiet,
    baseline: 'middle',
  })
  const ink = state.inverse ? p.c.inverse : state.selected ? p.c.accentStrong : p.c.text
  const titleWidth = write(p, 'FREE PLAY', x + 52, mid, {
    font: font(600, clamp(h * 0.46, 12, 18), p.fonts.display),
    color: ink,
    baseline: 'middle',
    spacing: '0.12em',
  })
  const style = {
    font: font(500, 11, p.fonts.ui),
    color: quiet,
    baseline: 'middle' as const,
    spacing: '0.08em',
  }
  const at = x + 52 + titleWidth + 14
  write(p, fitted(p, words, x + width - 14 - at, style), at, mid + 1, style)
}

/** Where a row's title begins: after its number and its stars. */
const titleX = (box: ListBox) => box.x + (box.compact ? 84 : 118)

function trackRow(
  p: Paint,
  box: ListBox,
  y: number,
  row: MenuRow,
  state: RowState,
  starsAge: number | null,
): void {
  const { x, width } = box
  const h = box.rowH
  const mid = y + h / 2
  const ink = state.inverse ? p.c.inverse : state.selected ? p.c.accentStrong : p.c.text
  const quiet = state.inverse ? p.c.inverse : p.c.muted
  const mono = font(600, clamp(h * 0.42, 11, 16), p.fonts.mono)
  write(p, String(row.number).padStart(2, '0'), x + 14, mid, {
    font: mono,
    color: quiet,
    baseline: 'middle',
  })
  stars(p, x + 46, mid, row.stars, starsAge, box.compact, state.inverse ? p.c.inverse : null)
  const titleWidth = write(p, row.chart.song.title, titleX(box), mid, {
    font: font(600, clamp(h * 0.46, 12, 18), p.fonts.display),
    color: ink,
    baseline: 'middle',
    spacing: '0.12em',
  })
  const right = x + width - 12
  const figures = { font: mono, color: quiet, align: 'right' as const, baseline: 'middle' as const }
  const creditStyle = {
    font: font(500, 11, p.fonts.ui),
    color: quiet,
    baseline: 'middle' as const,
    spacing: '0.08em',
  }
  const creditX = titleX(box) + titleWidth + 14
  const { style, credit } = row.chart.song
  // A tempo that changes gives up its unit before the style is cut.
  const styleEnd = creditX + measure(p, style, creditStyle) + 14
  const tempo = tempoText(p, row.chart, right - 220 - styleEnd, figures)
  // The style and the credit take what room the title and the tempo leave, and no more.
  const room = right - 220 - measure(p, tempo, figures) - 14 - creditX
  // In a narrow pane the style alone, whole, rather than both cut short.
  const both = `${style}  //  ${credit}`
  const line = measure(p, both, creditStyle) <= room ? both : fitted(p, style, room, creditStyle)
  write(p, line, creditX, mid + 1, creditStyle)
  write(p, row.best ? `${row.best.rank}  ${figure(row.best.score)}` : '—', right, mid, {
    font: mono,
    color: row.best ? ink : quiet,
    align: 'right',
    baseline: 'middle',
  })
  write(p, timeText(row.chart.duration), right - 150, mid, figures)
  write(p, tempo, right - 220, mid, figures)
}

/**
 * The tempo in the room it has: whole, or for one that changes (96→176 BPM) without its
 * unit - the column keeps a steady tempo's width, so a steady one is never cut.
 */
function tempoText(p: Paint, chart: Chart, room: number, style: TextStyle): string {
  const whole = bpmText(chart)
  if (chart.bpm.from === chart.bpm.to || measure(p, whole, style) <= room) return whole
  return `${chart.bpm.from}→${chart.bpm.to}`
}

/** A five-pointed star, centred on (x, y). */
function star(p: Paint, x: number, y: number, r: number): void {
  const g = p.g
  g.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 === 0 ? r : r * 0.45
    const px = x + Math.cos(a) * rr
    const py = y + Math.sin(a) * rr
    if (i === 0) g.moveTo(px, py)
    else g.lineTo(px, py)
  }
  g.closePath()
}

/**
 * A track's stars: five, lit to its level - or, where the row is narrow, one star and the
 * figure. The chosen row's light them one by one (`age`), the newest popping in.
 */
function stars(
  p: Paint,
  x: number,
  y: number,
  count: number,
  age: number | null,
  compact: boolean,
  ink: string | null,
): void {
  const g = p.g
  const on = ink ?? p.c.accent
  const off = ink ? alpha(ink, 0.35) : alpha(p.c.rule, 0.9)
  const { lit, pop } = age === null ? { lit: count, pop: 1 } : starsLit(age, count)
  if (compact) {
    star(p, x + 5, y, 5)
    g.fillStyle = lit > 0 ? on : off
    g.fill()
    write(p, String(count), x + 14, y + 0.5, {
      font: font(600, 12, p.fonts.mono),
      color: lit > 0 ? on : off,
      baseline: 'middle',
    })
    return
  }
  for (let i = 0; i < 5; i++) {
    const newest = i === lit - 1 && pop < 1
    star(p, x + 5 + i * 12, y, newest ? 5 * (1.6 - 0.6 * pop) : 5)
    g.fillStyle = i < lit ? on : off
    g.fill()
  }
}

function freeDetails(p: Paint, x: number, y: number): void {
  write(p, "SPACE PEDAL    ←→ OCTAVE    ↑↓ TONE    1-9 < > A TRACK'S BAND    ESC MENU", x + 14, y, {
    font: font(500, 12, p.fonts.ui),
    color: p.c.muted,
    spacing: '0.14em',
    baseline: 'top',
  })
}

function footer(p: Paint, l: Layout, view: MenuView): void {
  write(p, view.note, l.field.x + 4, l.line - 40, {
    font: font(500, 10, p.fonts.ui),
    color: p.c.muted,
    spacing: '0.16em',
  })
  hints(
    p,
    l,
    [
      ['↑↓', 'TRACK'],
      ['< >', 'GENRE'],
      ['←→', 'LEVEL'],
      ['ENTER', 'START'],
      ['ESC', 'PAUSE'],
    ],
    l.line - 10,
  )
}

function title(p: Paint, l: Layout, x: number, width: number): number {
  const size = clamp(l.unit * 0.6, 20, 44)
  const top = l.pad + size * 0.9
  write(p, 'KEYSTREAM', x, top, {
    font: font(700, size, p.fonts.display),
    color: p.c.accentStrong,
    spacing: '0.35em',
  })
  write(p, 'LEAD LINE INTERFACE  //  TYPE THE MELODY', x, top + 20, {
    font: font(500, 12, p.fonts.ui),
    color: p.c.muted,
    spacing: '0.25em',
  })
  rule(p, x, top + 34, width, alpha(p.c.rule, 0.8))
  return top + 48
}

/** The chosen track's figures on one line; in a narrow pane the speed keys' note goes first. */
function details(p: Paint, x: number, y: number, width: number, row: MenuRow, speed: number): void {
  const style = {
    font: font(500, 12, p.fonts.ui),
    color: p.c.muted,
    spacing: '0.14em',
    baseline: 'top' as const,
  }
  const best = row.best
  const bits = [
    `NOTES ${row.chart.notes.length}`,
    `LENGTH ${timeText(row.chart.duration)}`,
    best
      ? `BEST ${best.rank} ${figure(best.score)}  CHAIN ${best.maxChain}${best.fullChain ? '  FULL CHAIN' : ''}`
      : 'NO RECORD',
    `SPEED ${speed}`,
  ].join('    ')
  const full = `${bits}  (↑↓ WHILE PLAYING)`
  const room = width - 28
  write(p, measure(p, full, style) <= room ? full : fitted(p, bits, room, style), x + 14, y, style)
}

/** The opening of the track as it will be typed: letters, bar by bar. */
function opening(
  p: Paint,
  x: number,
  y: number,
  width: number,
  bars: readonly (readonly string[])[],
): void {
  write(p, 'FIRST LINE', x + 14, y, {
    font: font(500, 10, p.fonts.ui),
    color: p.c.muted,
    spacing: '0.3em',
  })
  const mono = font(600, 20, p.fonts.mono)
  let at = x + 14
  const top = y + 30
  const end = x + width - 30
  const bar = { font: mono, color: alpha(p.c.rule, 0.9) }
  for (const [b, keys] of bars.entries()) {
    // A bar's rule only where its first letter still fits after it: never a rule to nothing.
    if (b > 0 && at + measure(p, '|', bar) + 12 > end) return
    if (b > 0) at += write(p, '|', at, top, bar) + 12
    for (const letter of keys) {
      if (at > end) return
      at += write(p, letter, at, top, { font: mono, color: p.c.accentStrong }) + 10
    }
    at += 2
  }
}

/** Keys and what they do, each key in a small cap, along a line. */
export function hints(
  p: Paint,
  l: Layout,
  list: readonly (readonly [string, string])[],
  y: number,
): void {
  const g = p.g
  const capFont = font(600, 10, p.fonts.mono)
  const wordFont = font(500, 10, p.fonts.ui)
  let x = l.field.x + 4
  for (const [key, word] of list) {
    g.font = capFont
    const w = g.measureText(key).width + 10
    g.strokeStyle = alpha(p.c.border, 0.7)
    g.lineWidth = 1
    g.strokeRect(x + 0.5, y - 12.5, w, 16)
    write(p, key, x + w / 2 + 0.5, y - 4, {
      font: capFont,
      color: p.c.text,
      align: 'center',
      baseline: 'middle',
    })
    x += w + 6
    x +=
      write(p, word, x, y - 4, {
        font: wordFont,
        color: p.c.muted,
        baseline: 'middle',
        spacing: '0.2em',
      }) + 18
  }
}
