import type { Chart, Level } from '../chart'
import { LEVELS } from '../chart'
import type { Best } from '../records'
import { bpmText } from './hud'
import type { Layout } from './layout'
import { alpha, clamp, font, type Paint, rule, write } from './paint'

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
  /** The first bars of the chosen track as the keys that play them, bar by bar. */
  opening: readonly (readonly string[])[]
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
  view.rows.forEach((row, i) => {
    trackRow(p, x, y, width, rowH, i, row, i === view.selected)
    y += rowH
  })
  y += rowH * 0.6
  y = levels(p, x, y, view.level)
  const chosen = view.rows[view.selected]
  if (chosen) details(p, x, y + 14, chosen, view.speed)
  if (y + 110 < l.line - 60) opening(p, x, y + 64, width, view.opening)
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
  write(p, row.chart.song.credit, x + 52 + titleWidth + 14, mid + 1, {
    font: font(500, 11, p.fonts.ui),
    color: p.c.muted,
    baseline: 'middle',
    spacing: '0.08em',
  })
  const right = x + width - 12
  write(p, row.best ? `${row.best.rank}  ${figure(row.best.score)}` : '—', right, mid, {
    font: mono,
    color: row.best ? ink : p.c.muted,
    align: 'right',
    baseline: 'middle',
  })
  write(p, timeText(row.chart.duration), right - 150, mid, {
    font: mono,
    color: p.c.muted,
    align: 'right',
    baseline: 'middle',
  })
  write(p, bpmText(row.chart), right - 220, mid, {
    font: mono,
    color: p.c.muted,
    align: 'right',
    baseline: 'middle',
  })
}

function levels(p: Paint, x: number, y: number, level: Level): number {
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
  return y + 22
}

function details(p: Paint, x: number, y: number, row: MenuRow, speed: number): void {
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
    `SPEED ${speed}  (↑↓ WHILE PLAYING)`,
  ]
  write(p, bits.join('    '), x + 14, y, style)
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
