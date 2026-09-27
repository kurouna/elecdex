import type { Chart, Level } from '../chart'
import { LEVELS } from '../chart'
import type { Best } from '../records'
import { bpmText } from './hud'
import type { Layout } from './layout'
import { alpha, clamp, fitted, font, measure, type Paint, rule, write } from './paint'

/**
 * The menu, as a directory listing: the tracks one to a row, the level, what the chosen
 * track holds and the best result on it, and the keys that drive it all.
 */

export interface MenuRow {
  chart: Chart
  best: Best | null
}

export interface MenuView {
  rows: MenuRow[]
  selected: number
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

export function drawMenu(p: Paint, l: Layout, view: MenuView): void {
  const width = Math.min(l.w - l.pad * 2, 980)
  const x = (l.w - width) / 2
  let y = title(p, l, x, width)
  const rowH = clamp(l.unit * 0.62, 24, 40)
  // The tracks and FREE PLAY after them, as many as fit, the chosen one always among them.
  const total = view.rows.length + 1
  const fit = Math.max(3, Math.min(total, Math.floor((l.line - 170 - y) / rowH)))
  const first = clamp(view.selected - Math.floor(fit / 2), 0, total - fit)
  for (let i = first; i < first + fit; i++) {
    const row = view.rows[i]
    if (row) trackRow(p, x, y, width, rowH, i, row, i === view.selected)
    else freeRow(p, x, y, width, rowH, view.free, i === view.selected)
    y += rowH
  }
  more(p, x + width, y - fit * rowH, first > 0, y, first + fit < total)
  y += rowH * 0.6
  const chosen = view.rows[view.selected]
  if (chosen === undefined) {
    freeDetails(p, x, y + 4)
    footer(p, l, view)
    return
  }
  y = levels(p, x, y, width, view.level, view.levelNote)
  details(p, x, y + 14, width, chosen, view.speed)
  if (y + 110 < l.line - 60) opening(p, x, y + 64, width, view.opening)
  footer(p, l, view)
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

/** FREE PLAY in the list: no track, the keyboard alone. */
function freeRow(
  p: Paint,
  x: number,
  y: number,
  width: number,
  h: number,
  words: string,
  selected: boolean,
): void {
  const g = p.g
  g.fillStyle = alpha(p.c.rule, 0.5)
  g.fillRect(x + 14, y + 1, width - 28, 1)
  if (selected) {
    g.fillStyle = alpha(p.c.accent, p.light ? 0.12 : 0.1)
    g.fillRect(x, y + 2, width, h - 4)
    g.fillStyle = p.c.accentStrong
    g.fillRect(x, y + 2, 3, h - 4)
  }
  const mid = y + h / 2
  write(p, '∞', x + 14, mid, {
    font: font(600, clamp(h * 0.5, 12, 18), p.fonts.mono),
    color: p.c.muted,
    baseline: 'middle',
  })
  const titleWidth = write(p, 'FREE PLAY', x + 52, mid, {
    font: font(600, clamp(h * 0.46, 12, 18), p.fonts.display),
    color: selected ? p.c.accentStrong : p.c.text,
    baseline: 'middle',
    spacing: '0.12em',
  })
  write(p, words, x + 52 + titleWidth + 14, mid + 1, {
    font: font(500, 11, p.fonts.ui),
    color: p.c.muted,
    baseline: 'middle',
    spacing: '0.08em',
  })
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

function trackRow(
  p: Paint,
  x: number,
  y: number,
  width: number,
  h: number,
  index: number,
  row: MenuRow,
  selected: boolean,
): void {
  const g = p.g
  if (selected) {
    g.fillStyle = alpha(p.c.accent, p.light ? 0.12 : 0.1)
    g.fillRect(x, y + 2, width, h - 4)
    g.fillStyle = p.c.accentStrong
    g.fillRect(x, y + 2, 3, h - 4)
  }
  const mid = y + h / 2
  const ink = selected ? p.c.accentStrong : p.c.text
  const mono = font(600, clamp(h * 0.42, 11, 16), p.fonts.mono)
  write(p, String(index + 1).padStart(2, '0'), x + 14, mid, {
    font: mono,
    color: p.c.muted,
    baseline: 'middle',
  })
  const titleWidth = write(p, row.chart.song.title, x + 52, mid, {
    font: font(600, clamp(h * 0.46, 12, 18), p.fonts.display),
    color: ink,
    baseline: 'middle',
    spacing: '0.12em',
  })
  const right = x + width - 12
  const figures = {
    font: mono,
    color: p.c.muted,
    align: 'right' as const,
    baseline: 'middle' as const,
  }
  // The style and the credit take what room the title and the tempo leave, and no more.
  const bpmLeft = right - 220 - measure(p, bpmText(row.chart), figures)
  const creditStyle = {
    font: font(500, 11, p.fonts.ui),
    color: p.c.muted,
    baseline: 'middle' as const,
    spacing: '0.08em',
  }
  const creditX = x + 52 + titleWidth + 14
  const room = bpmLeft - 14 - creditX
  const { style, credit } = row.chart.song
  // In a narrow pane the style alone, whole, rather than both cut short.
  const both = `${style}  //  ${credit}`
  const line = measure(p, both, creditStyle) <= room ? both : fitted(p, style, room, creditStyle)
  write(p, line, creditX, mid + 1, creditStyle)
  write(p, row.best ? `${row.best.rank}  ${figure(row.best.score)}` : '—', right, mid, {
    font: mono,
    color: row.best ? ink : p.c.muted,
    align: 'right',
    baseline: 'middle',
  })
  write(p, timeText(row.chart.duration), right - 150, mid, figures)
  write(p, bpmText(row.chart), right - 220, mid, figures)
}

/** The level chips, and beside them what the chosen level asks. Answers the line's bottom. */
function levels(p: Paint, x: number, y: number, width: number, level: Level, note: string): number {
  const g = p.g
  let at = x + 14
  at +=
    write(p, 'LEVEL', at, y + 11, {
      font: font(500, 10, p.fonts.ui),
      color: p.c.muted,
      spacing: '0.3em',
    }) + 18
  for (const each of LEVELS) {
    const on = each === level
    const text = each.toUpperCase()
    g.font = font(600, 12, p.fonts.display)
    g.letterSpacing = '0.25em'
    const w = g.measureText(text).width + 22
    g.letterSpacing = '0px'
    g.fillStyle = on ? p.c.accent : 'rgba(0, 0, 0, 0)'
    g.fillRect(at, y, w, 22)
    g.strokeStyle = alpha(p.c.border, on ? 1 : 0.6)
    g.lineWidth = 1
    g.strokeRect(at + 0.5, y + 0.5, w - 1, 21)
    write(p, text, at + w / 2 + 2, y + 12, {
      font: font(600, 12, p.fonts.display),
      color: on ? p.c.inverse : p.c.muted,
      align: 'center',
      baseline: 'middle',
      spacing: '0.25em',
    })
    at += w + 8
  }
  const style = {
    font: font(500, 11, p.fonts.ui),
    color: p.c.muted,
    baseline: 'middle' as const,
    spacing: '0.1em',
  }
  write(p, fitted(p, note, x + width - 14 - (at + 10), style), at + 10, y + 12, style)
  return y + 22
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
  for (const [b, bar] of bars.entries()) {
    if (b > 0) at += write(p, '|', at, top, { font: mono, color: alpha(p.c.rule, 0.9) }) + 12
    for (const letter of bar) {
      if (at > x + width - 30) return
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
