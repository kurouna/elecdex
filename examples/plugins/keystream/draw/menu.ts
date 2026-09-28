import { type Chart, LEVELS, type Level } from '../chart'
import type { Best } from '../records'
import { bpmText } from './hud'
import type { Layout, Rect } from './layout'
import {
  blinkLit,
  type Drawn,
  decoded,
  type MenuFrame,
  MOTION,
  panelPower,
  rowIn,
  slideRect,
  starsLit,
  streak,
  sweep,
  tabPower,
  typed,
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
 * The menu, as a directory listing: the genre tabs (and FREE PLAY's), the tracks one to a row
 * with their stars and best at the level chosen, the level and the instrument, what the
 * chosen track holds, and the keys that drive it all. The level is changed on the list with
 * < and >, and once more on a panel over the list that Enter opens for the chosen track, as
 * the dance and beat games have it (user decision 2026-09-28).
 * How it moves is menu-motion.ts; this draws a frame of it.
 */

export interface MenuRow {
  chart: Chart
  /** The best at the level chosen. */
  best: Best | null
  /** The track's place in the whole list, from 1: the same on every tab. */
  number: number
  /** 1 to 5, at the chosen level (difficulty.ts). */
  stars: number
}

export interface MenuList {
  rows: MenuRow[]
  /** Whether FREE PLAY is a row, after the tracks: on ALL and its own tab only. */
  free: boolean
  /** The chosen row; `rows.length` is FREE PLAY. */
  selected: number
}

/** A level of the chosen track, as its panel lists it. */
export interface LevelRow {
  level: Level
  stars: number
  notes: number
  best: Best | null
  /** What the level asks. */
  note: string
}

export interface MenuView {
  /** Choosing a track, or its level on the panel. */
  stage: 'tracks' | 'levels'
  /** The chosen track's levels; null on FREE PLAY. */
  levels: readonly LevelRow[] | null
  /** The instrument the keys play, and the key that picked it. */
  instrument: { name: string; key: string }
  list: MenuList
  /** The list a tab change left, shown while it powers off. */
  before: MenuList | null
  /** Each tab, and how many tracks it holds (null for FREE PLAY's). */
  tabs: readonly { name: string; count: number | null }[]
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
  /** The chosen track is being heard. */
  previewing: boolean
  /** Whether the chosen track is heard at all (Space turns it off and on). */
  preview: boolean
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
  const total = Math.max(rowCount(view.list), ...view.tabs.map((t) => (t.count ?? 0) + 1))
  const room = l.line - 170 - y
  const withOpening = Math.floor((room - OPENING_ROOM) / rowH)
  const shown = withOpening >= Math.min(MIN_ROWS, total) ? withOpening : Math.floor(room / rowH)
  const fit = clamp(shown, 3, total)
  const box = { x, y, width, rowH, fit, compact: width < COMPACT_WIDTH }
  const cursor = drawShelf(p, box, view, f)
  // The panel takes the list's room, or what it needs over the details under a short list:
  // drawn last, over them.
  const panelH = Math.min(Math.max(fit * rowH, PANEL_MIN), l.line - 70 - y)
  y += fit * rowH + rowH * 0.6
  const chosen = view.list.rows[view.list.selected]
  if (chosen === undefined) {
    freeDetails(p, x, y + 4)
    footer(p, l, view)
    return { tabs, levels: [], panel: drawPanel(p, box, panelH, view, f), cursor }
  }
  const levels = drawLevels(p, x, y, width, view, f)
  y += 22
  // The chosen track's details, typed out again as the choice changes.
  const age = f.choice ?? Number.POSITIVE_INFINITY
  details(p, x, y + 14, width, chosen, view, age)
  if (y + 110 < l.line - 60) opening(p, x, y + 64, width, view.opening, age)
  footer(p, l, view)
  return { tabs, levels, panel: drawPanel(p, box, panelH, view, f), cursor }
}

/** A list's rows: its tracks, and FREE PLAY where it is one. */
const rowCount = (list: MenuList) => list.rows.length + (list.free ? 1 : 0)

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

/** The tabs, each genre's with how many tracks it holds; the left and right arrows change them. */
function drawTabs(p: Paint, x: number, y: number, width: number, view: MenuView, f: MenuFrame) {
  const counted = width >= 600
  const rects = chips(p, x + 14, y, {
    labels: view.tabs.map((t) => (counted && t.count !== null ? `${t.name} ${t.count}` : t.name)),
    active: view.tab,
    from: f.tab?.from ?? null,
    slide: f.tab ? f.tab.age / MOTION.slide : 1,
  })
  const end = rects.at(-1)
  if (end && end.x + end.w + 90 < x + width) {
    write(p, '←→', x + width - 14, y + 12, {
      font: font(600, 11, p.fonts.mono),
      color: p.c.muted,
      align: 'right',
      baseline: 'middle',
    })
  }
  return rects
}

/**
 * The level chips under the list - < and > change them - beside them what the chosen level
 * asks, and at the end the instrument. Answers the chips, for the light to move from.
 */
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
    labels: LEVELS.map((level) => level.toUpperCase()),
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
  const instrumentX = instrument(p, x + width - 14, y + 12, view.instrument)
  write(p, fitted(p, view.levelNote, instrumentX - 18 - noteX, style), noteX, y + 12, style)
  return rects
}

/**
 * The instrument the keys play, ending at `right`: a lit chip - its key, then its name - as a
 * chosen level's is, so it reads as the one chosen. Answers its left.
 */
function instrument(p: Paint, right: number, y: number, chosen: MenuView['instrument']): number {
  const g = p.g
  const nameStyle = {
    font: font(600, 11, p.fonts.display),
    color: p.c.inverse,
    baseline: 'middle' as const,
    spacing: '0.18em',
  }
  const keyStyle = {
    font: font(700, 11, p.fonts.mono),
    color: p.c.inverse,
    baseline: 'middle' as const,
  }
  const keyW = measure(p, chosen.key, keyStyle)
  const nameW = measure(p, chosen.name, nameStyle)
  const w = 10 + keyW + 10 + nameW + 10
  const x = right - w
  g.fillStyle = p.c.accent
  g.fillRect(x, y - 11, w, 22)
  // The key set off from the name by a rule, as a key cap on the chip.
  g.fillStyle = alpha(p.c.inverse, 0.5)
  g.fillRect(x + 10 + keyW + 4.5, y - 7, 1, 14)
  write(p, chosen.key, x + 10, y + 0.5, keyStyle)
  write(p, chosen.name, x + 10 + keyW + 10, y + 0.5, nameStyle)
  return x
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
  // The list that left is drawn as it stood while it is pressed away: no row coming in, no
  // choice decoding, no blink. The row blinks for FREE PLAY; a track's start blinks its level
  // on the panel instead.
  const rowsFrame =
    list !== view.list
      ? { ...f, rows: null, choice: null, blink: null }
      : view.stage === 'tracks'
        ? f
        : { ...f, blink: null }
  const shown = drawRows(p, box, list, view.free, rowsFrame)
  g.restore()
  if (power && power.line > 0) powerLine(p, box, mid, power.line)
  const end = box.y + shown.count * box.rowH
  // The list's marks for more above and below belong to the list, not to the panel over it.
  if ((!power || power.open > 0.98) && view.stage === 'tracks') {
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
  const total = rowCount(list)
  const count = Math.min(box.fit, total)
  const first = clamp(list.selected - Math.floor(count / 2), 0, total - count)
  const top = box.y + (list.selected - first) * box.rowH
  const lit = f.blink !== null && blinkLit(f.blink)
  g.globalAlpha = f.rows === null ? 1 : rowIn(f.rows, list.selected - first)
  drawCursor(p, box, top, lit, f)
  for (let i = first; i < first + count; i++) {
    const y = box.y + (i - first) * box.rowH
    g.globalAlpha = f.rows === null ? 1 : rowIn(f.rows, i - first)
    const state = { selected: i === list.selected, inverse: i === list.selected && lit }
    const row = list.rows[i]
    if (row) trackRow(p, box, y, row, state, i === list.selected ? f.choice : null)
    else freeRow(p, box, y, free, state)
  }
  g.globalAlpha = 1
  emptySlots(p, box, count)
  return { cursor: top, first, count, total }
}

/** The cursor at its row, or sweeping to it with a streak behind it. */
function drawCursor(p: Paint, box: ListBox, top: number, lit: boolean, f: MenuFrame): void {
  const g = p.g
  if (f.cursor === null) {
    cursorBar(p, box, top, lit)
    return
  }
  const glide = Math.min(1, f.cursor.age / MOTION.glide)
  const at = f.cursor.from + (top - f.cursor.from) * sweep(glide)
  const alphaNow = g.globalAlpha
  for (const ghost of streak(f.cursor.from, at, glide)) {
    g.globalAlpha = alphaNow * ghost.alpha
    g.fillStyle = p.c.accent
    g.fillRect(box.x, ghost.y + 2, box.width, box.rowH - 4)
  }
  g.globalAlpha = alphaNow
  cursorBar(p, box, at, lit)
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
  /** Since this row became the choice; null for any other row, or when still. */
  choiceAge: number | null,
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
  stars(p, x + 46, mid, row.stars, choiceAge, box.compact, state.inverse ? p.c.inverse : null)
  const titleStyle = {
    font: font(600, clamp(h * 0.46, 12, 18), p.fonts.display),
    color: ink,
    baseline: 'middle' as const,
    spacing: '0.12em',
  }
  // The chosen title decodes; what follows it stands where the settled title ends.
  const title = row.chart.song.title
  write(p, choiceAge === null ? title : decoded(title, choiceAge), titleX(box), mid, titleStyle)
  const titleWidth = measure(p, title, titleStyle)
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
  const keys =
    "1-0 INSTRUMENT    Z X OCTAVE    C V STRENGTH    SPACE PEDAL    ↑↓ ENTER A TRACK'S BAND"
  write(p, keys, x + 14, y, {
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
  const keys: readonly (readonly [string, string])[] =
    view.stage === 'levels'
      ? [
          ['↑↓', 'LEVEL'],
          ['ENTER', 'START'],
          ['ESC', 'BACK'],
          ['1-0 -', 'INSTRUMENT'],
          ['SPACE', 'PREVIEW'],
        ]
      : [
          ['↑↓', 'TRACK'],
          ['←→', 'GENRE'],
          // FREE PLAY has no level to change.
          ...(view.levels === null ? [] : [['< >', 'LEVEL'] as const]),
          ['ENTER', 'SELECT'],
          ['1-0 -', 'INSTRUMENT'],
          ['SPACE', 'PREVIEW'],
        ]
  hints(p, l, keys, l.line - 10)
}

/*
 * The levels' panel: a track chosen, its levels over the list, as a pane powers on.
 */

/** The least height the levels' panel needs: its title, three one-line levels, the instrument. */
const PANEL_MIN = 212

/** The panel as this frame has it; answers its level rows, for the light to move from. */
function drawPanel(p: Paint, box: ListBox, h: number, view: MenuView, f: MenuFrame): Rect[] {
  const levels = view.levels
  if (levels === null) return []
  const power = f.panel
    ? panelPower(f.panel.age, f.panel.closing)
    : { open: view.stage === 'levels' ? 1 : 0, line: 0 }
  if (power.open <= 0 && power.line <= 0) return []
  const g = p.g
  const mid = box.y + h / 2
  g.save()
  g.beginPath()
  g.rect(box.x - 6, box.y - 2, box.width + 12, h + 4)
  g.clip()
  g.translate(0, mid)
  g.scale(1, Math.max(0.02, power.open))
  g.translate(0, -mid)
  g.fillStyle = p.c.ground
  g.fillRect(box.x - 6, box.y - 2, box.width + 12, h + 4)
  g.fillStyle = alpha(p.c.raised, 0.9)
  g.fillRect(box.x, box.y, box.width, h)
  g.strokeStyle = alpha(p.c.accentStrong, 0.8)
  g.lineWidth = 1
  g.strokeRect(box.x + 0.5, box.y + 0.5, box.width - 1, h - 1)
  const rects = panelBody(p, box, h, view, levels, f)
  g.restore()
  if (power.line > 0) powerLine(p, box, mid, power.line)
  return rects
}

function panelBody(
  p: Paint,
  box: ListBox,
  h: number,
  view: MenuView,
  levels: readonly LevelRow[],
  f: MenuFrame,
): Rect[] {
  const chosen = view.list.rows[view.list.selected]
  const { x, width } = box
  write(p, 'SELECT LEVEL', x + 18, box.y + 22, {
    font: font(500, 10, p.fonts.ui),
    color: p.c.muted,
    spacing: '0.3em',
  })
  if (chosen) {
    write(p, chosen.chart.song.title, x + 18, box.y + 50, {
      font: font(700, clamp(box.rowH * 0.7, 16, 26), p.fonts.display),
      color: p.c.accentStrong,
      spacing: '0.14em',
    })
    write(
      p,
      `${chosen.chart.song.style}  //  ${bpmText(chosen.chart)}  //  ${timeText(chosen.chart.duration)}`,
      x + width - 18,
      box.y + 50,
      {
        font: font(500, 11, p.fonts.ui),
        color: p.c.muted,
        align: 'right',
        spacing: '0.12em',
      },
    )
  }
  // The levels share what is left between the title and the instrument's line, in its middle.
  const space = h - 66 - 40
  const rowH = clamp(space / levels.length, 30, 84)
  const top = box.y + 66 + (space - rowH * levels.length) / 2
  const rects = levels.map((_, i) => ({
    x: x + 12,
    y: top + i * rowH + 2,
    w: width - 24,
    h: rowH - 4,
  }))
  panelCursor(p, rects, levels, view, f)
  const lit = f.blink !== null && blinkLit(f.blink)
  levels.forEach((row, i) => {
    const r = rects[i] as Rect
    levelRow(p, r, row, row.level === view.level && lit, f.panelChoice)
  })
  const bottom = box.y + h - 16
  write(p, 'INSTRUMENT', x + 18, bottom, {
    font: font(500, 10, p.fonts.ui),
    color: p.c.muted,
    spacing: '0.3em',
    baseline: 'middle',
  })
  instrument(p, x + width - 18, bottom, view.instrument)
  return rects
}

/** The light behind the chosen level, sweeping to it from the one before. */
function panelCursor(
  p: Paint,
  rects: Rect[],
  levels: readonly LevelRow[],
  view: MenuView,
  f: MenuFrame,
): void {
  const target = rects[levels.findIndex((row) => row.level === view.level)]
  if (target === undefined) return
  const g = p.g
  const from = f.panelLevel?.from ?? null
  const t = f.panelLevel ? Math.min(1, f.panelLevel.age / MOTION.glide) : 1
  const at = from && t < 1 ? slideRect(from, target, sweep(t)) : target
  if (from && t < 1) {
    for (const ghost of streak(from.y, at.y, t)) {
      g.fillStyle = alpha(p.c.accent, ghost.alpha)
      g.fillRect(at.x, ghost.y, at.w, at.h)
    }
  }
  g.fillStyle = alpha(p.c.accent, p.light ? 0.14 : 0.12)
  g.fillRect(at.x, at.y, at.w, at.h)
  g.fillStyle = p.c.accentStrong
  g.fillRect(at.x, at.y, 3, at.h)
}

/** One level: its name, its stars, its notes and the best on it, and what it asks under them. */
function levelRow(p: Paint, r: Rect, row: LevelRow, inverse: boolean, age: number | null): void {
  const g = p.g
  if (inverse) {
    g.fillStyle = p.c.accent
    g.fillRect(r.x, r.y, r.w, r.h)
  }
  const ink = inverse ? p.c.inverse : p.c.text
  const quiet = inverse ? p.c.inverse : p.c.muted
  const mid = r.y + r.h * 0.4
  write(p, row.level.toUpperCase(), r.x + 16, mid, {
    font: font(700, clamp(r.h * 0.34, 12, 18), p.fonts.display),
    color: inverse ? p.c.inverse : p.c.accentStrong,
    baseline: 'middle',
    spacing: '0.2em',
  })
  stars(p, r.x + 130, mid, row.stars, age, false, inverse ? p.c.inverse : null)
  const mono = font(600, 13, p.fonts.mono)
  const right = r.x + r.w - 14
  write(p, row.best ? `${row.best.rank}  ${figure(row.best.score)}` : 'NO RECORD', right, mid, {
    font: mono,
    color: row.best ? ink : quiet,
    align: 'right',
    baseline: 'middle',
  })
  write(p, `NOTES ${row.notes}`, right - 170, mid, {
    font: mono,
    color: quiet,
    align: 'right',
    baseline: 'middle',
  })
  if (r.h >= 40) {
    const style = {
      font: font(500, 11, p.fonts.ui),
      color: quiet,
      spacing: '0.1em',
      baseline: 'middle' as const,
    }
    write(p, fitted(p, row.note, r.w - 150, style), r.x + 130, r.y + r.h * 0.78, style)
  }
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
function details(
  p: Paint,
  x: number,
  y: number,
  width: number,
  row: MenuRow,
  view: MenuView,
  age: number,
): void {
  const style = {
    font: font(500, 12, p.fonts.ui),
    color: p.c.muted,
    spacing: '0.14em',
    baseline: 'top' as const,
  }
  const best = row.best
  // The figures are the level chosen, whose chip is lit just above.
  const bits = [
    `NOTES ${row.chart.notes.length}`,
    `LENGTH ${timeText(row.chart.duration)}`,
    best
      ? `BEST ${best.rank} ${figure(best.score)}  CHAIN ${best.maxChain}${best.fullChain ? '  FULL CHAIN' : ''}`
      : 'NO RECORD',
    `SPEED ${view.speed}`,
  ].join('    ')
  const full = `${bits}  (↑↓ WHILE PLAYING)`
  const room = width - 28
  const line = measure(p, full, style) <= room ? full : fitted(p, bits, room, style)
  write(p, line.slice(0, typed(line.length, age)), x + 14, y, style)
  if (view.previewing) previewTag(p, x + width - 14, y + 7, '▶ PREVIEW', p.c.accentStrong)
  else if (!view.preview) previewTag(p, x + width - 14, y + 7, 'PREVIEW OFF', p.c.muted)
}

/**
 * The preview's state at the end of the chosen track's details: a lit tag while it plays, a
 * quiet one while Space has it off, nothing while it waits for the cursor to rest.
 */
function previewTag(p: Paint, right: number, y: number, text: string, ink: string): void {
  const style = {
    font: font(600, 10, p.fonts.display),
    color: ink,
    spacing: '0.24em',
    baseline: 'middle' as const,
  }
  const w = measure(p, text, style) + 14
  p.g.strokeStyle = alpha(ink, 0.7)
  p.g.lineWidth = 1
  p.g.strokeRect(right - w + 0.5, y - 8.5, w - 1, 17)
  write(p, text, right - w + 7, y + 0.5, style)
}

/** The opening of the track as it will be typed: letters, bar by bar. */
function opening(
  p: Paint,
  x: number,
  y: number,
  width: number,
  bars: readonly (readonly string[])[],
  age: number,
): void {
  // Typed out with the details: as many letters as the moment allows.
  let left = typed(
    bars.reduce((n, bar) => n + bar.length, 0),
    age,
  )
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
      if (at > end || left <= 0) return
      left -= 1
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
  /** The key just pressed, blinking: its cap lit on the accent on the blink's lit beats. */
  pressed: { index: number; lit: boolean } | null = null,
): void {
  const g = p.g
  const capFont = font(600, 10, p.fonts.mono)
  const wordFont = font(500, 10, p.fonts.ui)
  let x = l.field.x + 4
  list.forEach(([key, word], i) => {
    const on = pressed?.index === i
    const lit = on && pressed?.lit === true
    const w = measure(p, key, { font: capFont, color: p.c.text }) + 10
    if (lit) {
      g.fillStyle = p.c.accent
      g.fillRect(x, y - 13, w + 1, 17)
    }
    g.strokeStyle = on ? p.c.accentStrong : alpha(p.c.border, 0.7)
    g.lineWidth = 1
    g.strokeRect(x + 0.5, y - 12.5, w, 16)
    write(p, key, x + w / 2 + 0.5, y - 4, {
      font: capFont,
      color: lit ? p.c.inverse : p.c.text,
      align: 'center',
      baseline: 'middle',
    })
    x += w + 6
    x +=
      write(p, word, x, y - 4, {
        font: wordFont,
        color: on ? p.c.accentStrong : p.c.muted,
        baseline: 'middle',
        spacing: '0.2em',
      }) + 18
  })
}
