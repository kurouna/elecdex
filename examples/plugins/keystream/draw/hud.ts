import type { Chart } from '../chart'
import { accuracyOf, scoreOf, type Tally } from '../judge'
import { LAMP_ROOM, type Layout } from './layout'
import { alpha, counter, font, type Paint, rule, write } from './paint'

/**
 * The header: which track, how it goes - score, chain, accuracy, the signal gauge - and the
 * scroll speed, read like one of elecdex's instrument panels. The top right corner is left
 * to the host's KEYS lamp.
 */

export interface HudView {
  chart: Chart
  index: number
  tally: Tally | null
  speed: number
}

const SEGMENTS = 20

export function drawHud(p: Paint, l: Layout, view: HudView): void {
  const { header } = l
  titleLine(p, l, view, header.h * 0.31)
  readouts(p, l, view, header.h * 0.79)
  rule(p, header.x, header.h - 1, header.w, alpha(p.c.rule, 0.8))
}

export function bpmText(chart: Chart): string {
  return chart.bpm.from === chart.bpm.to
    ? `${chart.bpm.from} BPM`
    : `${chart.bpm.from}→${chart.bpm.to} BPM`
}

function titleLine(p: Paint, l: Layout, view: HudView, y: number): void {
  let x = l.header.x
  x += write(p, 'KEYSTREAM', x, y, {
    font: font(600, 11 * l.scale, p.fonts.display),
    color: p.c.accent,
    spacing: '0.32em',
    baseline: 'middle',
  })
  const muted = {
    font: font(500, 12 * l.scale, p.fonts.ui),
    color: p.c.muted,
    baseline: 'middle' as const,
    spacing: '0.12em',
  }
  x += write(p, '  //  ', x, y, muted)
  x += write(p, `${String(view.index + 1).padStart(2, '0')} ${view.chart.song.title}`, x, y, {
    ...muted,
    color: p.c.text,
  })
  write(p, `  //  ${view.chart.level.toUpperCase()}  //  ${bpmText(view.chart)}`, x, y, muted)
  write(p, `SPEED ${view.speed}`, l.w - l.pad - LAMP_ROOM, y, { ...muted, align: 'right' })
}

function label(p: Paint, l: Layout, text: string, x: number, y: number): number {
  return write(p, text, x, y, {
    font: font(500, 10 * l.scale, p.fonts.ui),
    color: p.c.muted,
    baseline: 'alphabetic',
    spacing: '0.2em',
  })
}

function readouts(p: Paint, l: Layout, view: HudView, y: number): void {
  const tally = view.tally
  const size = 17 * l.scale
  const gap = 22 * l.scale
  let x = l.header.x
  x += label(p, l, 'SCORE ', x, y) + 4
  x += counter(p, tally === null ? 0 : scoreOf(tally), 7, x, y, size, p.c.text) + gap
  x += label(p, l, 'CHAIN ', x, y) + 4
  x += counter(p, tally?.chain ?? 0, 4, x, y, size, p.c.text) + gap
  x += label(p, l, 'ACC ', x, y) + 4
  const acc = tally === null ? '---.--' : accuracyOf(tally).toFixed(2).padStart(6, ' ')
  x += write(p, `${acc}%`, x, y, { font: font(600, size, p.fonts.mono), color: p.c.text }) + gap
  if (x + 180 * l.scale > l.w - l.pad - LAMP_ROOM - 60) return
  x += label(p, l, 'SIGNAL ', x, y) + 6
  gauge(p, x, y - size * 0.65, size * 0.65, tally?.signal ?? 0.6, tally?.level === 'hard')
}

/** The signal as a row of cells, like a VFD's level meter; low, it turns to warning. */
function gauge(p: Paint, x: number, y: number, h: number, value: number, hard: boolean): void {
  const g = p.g
  const lit = Math.round(value * SEGMENTS)
  const low = value < 0.3
  for (let i = 0; i < SEGMENTS; i++) {
    const on = i < lit
    const color = low ? (hard ? p.c.danger : p.c.warn) : p.c.accent
    g.fillStyle = on ? alpha(color, 0.35 + (0.65 * (i + 1)) / SEGMENTS) : alpha(p.c.rule, 0.35)
    g.fillRect(x + i * h * 0.64, y, h * 0.45, h)
  }
}
