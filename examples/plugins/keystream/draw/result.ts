import type { Chart } from '../chart'
import { accuracyOf, GRADES, meanDelta, type Rank, type Tally, windowOf } from '../judge'
import { gradeColor } from './fx'
import { bpmText } from './hud'
import type { Layout } from './layout'
import { figure, hints } from './menu'
import { alpha, clamp, counter, font, type Paint, write } from './paint'

/**
 * The result, as the end of a transmission: how it closed, the rank, the figures, and how
 * early or late the keys landed - a line at a time, as a log prints.
 */

export interface ResultView {
  chart: Chart
  index: number
  tally: Tally
  score: number
  rank: Rank
  newRecord: boolean
  failed: boolean
}

export const REVEAL_MS = 900
const BINS = 25

export function drawResult(
  p: Paint,
  l: Layout,
  view: ResultView,
  age: number,
  labels: Readonly<Record<string, string>>,
): void {
  const shown = (step: number) => p.reduced || age >= step * (REVEAL_MS / 6)
  // Laid out at a design size, then scaled and centred in the room above the keyboard.
  const design = { w: 640, h: 250 }
  const room = { top: l.pad, bottom: l.line - 40 }
  const s = clamp(
    Math.min((l.w - l.pad * 2) / design.w, (room.bottom - room.top) / design.h),
    0.7,
    1.6,
  )
  const g = p.g
  g.save()
  g.translate(l.w / 2 - (design.w * s) / 2, (room.top + room.bottom) / 2 - (design.h * s) / 2)
  g.scale(s, s)
  heading(p, 0, 22, view, age)
  const box = 150
  const y = 64
  if (shown(1)) rankBox(p, 0, y, box, view.rank)
  const col = box + 32
  if (shown(2)) scoreLine(p, col, y + 20, view)
  if (shown(3)) figuresLine(p, col, y + 50, view.tally)
  if (shown(4)) countsLine(p, col, y + 80, view.tally)
  if (shown(5)) histogram(p, col, y + 104, design.w - col, 36, view.tally)
  g.restore()
  if (shown(6)) {
    hints(
      p,
      l,
      [
        ['ENTER', 'MENU'],
        [labels.KeyR ?? 'R', 'RETRY'],
      ],
      l.line - 10,
    )
  }
}

function heading(p: Paint, x: number, y: number, view: ResultView, age: number): void {
  const text = view.failed ? 'NO CARRIER' : 'TRANSMISSION COMPLETE'
  const typed = p.reduced ? text : text.slice(0, Math.ceil(text.length * clamp(age / 420, 0, 1)))
  write(p, typed, x, y, {
    font: font(700, 24, p.fonts.display),
    color: view.failed ? p.c.danger : p.c.accentStrong,
    spacing: '0.3em',
  })
  const level = view.chart.level.toUpperCase()
  write(
    p,
    `${String(view.index + 1).padStart(2, '0')} ${view.chart.song.title}  //  ${level}  //  ${bpmText(view.chart)}`,
    x,
    y + 22,
    {
      font: font(500, 12, p.fonts.ui),
      color: p.c.muted,
      spacing: '0.18em',
    },
  )
}

const rankColor = (p: Paint, rank: Rank): string =>
  ({ S: p.c.accentStrong, A: p.c.accent, B: p.c.text, C: p.c.warn, D: p.c.danger })[rank]

function rankBox(p: Paint, x: number, y: number, size: number, rank: Rank): void {
  const g = p.g
  const color = rankColor(p, rank)
  const gradient = g.createLinearGradient(0, y, 0, y + size)
  gradient.addColorStop(0, alpha(color, 0.18))
  gradient.addColorStop(1, alpha(color, 0.02))
  g.fillStyle = gradient
  g.fillRect(x, y, size, size)
  g.strokeStyle = color
  g.lineWidth = 1.5
  g.strokeRect(x + 0.75, y + 0.75, size - 1.5, size - 1.5)
  write(p, rank, x + size / 2, y + size * 0.54, {
    font: font(700, size * 0.62, p.fonts.display),
    color,
    align: 'center',
    baseline: 'middle',
  })
  write(p, 'RANK', x + size / 2, y + size + 16, {
    font: font(500, 10, p.fonts.ui),
    color: p.c.muted,
    align: 'center',
    spacing: '0.4em',
  })
}

function label(p: Paint, text: string, x: number, y: number): number {
  return write(p, text, x, y, {
    font: font(500, 10, p.fonts.ui),
    color: p.c.muted,
    spacing: '0.2em',
  })
}

function tag(p: Paint, text: string, x: number, y: number, color: string): void {
  const g = p.g
  g.font = font(600, 10, p.fonts.ui)
  g.letterSpacing = '0.2em'
  const w = g.measureText(text).width + 12
  g.letterSpacing = '0px'
  g.strokeStyle = color
  g.lineWidth = 1
  g.strokeRect(x + 0.5, y - 12.5, w, 16)
  write(p, text, x + 6, y - 4, {
    font: font(600, 10, p.fonts.ui),
    color,
    baseline: 'middle',
    spacing: '0.2em',
  })
}

function scoreLine(p: Paint, x: number, y: number, view: ResultView): void {
  let at = x + label(p, 'SCORE ', x, y) + 8
  at += counter(p, view.score, 7, at, y, 24, p.c.text) + 16
  if (view.newRecord && !view.failed) tag(p, 'NEW RECORD', at, y - 2, p.c.accentStrong)
}

function figuresLine(p: Paint, x: number, y: number, tally: Tally): void {
  const mono = font(600, 16, p.fonts.mono)
  let at = x + label(p, 'ACC ', x, y) + 6
  at += write(p, `${accuracyOf(tally).toFixed(2)}%`, at, y, { font: mono, color: p.c.text }) + 26
  at += label(p, 'MAX CHAIN ', at, y) + 6
  at += write(p, `${tally.maxChain} / ${tally.total}`, at, y, { font: mono, color: p.c.text }) + 16
  if (tally.counts.DROP === 0 && tally.total > 0) tag(p, 'FULL CHAIN', at, y - 2, p.c.ok)
}

function countsLine(p: Paint, x: number, y: number, tally: Tally): void {
  let at = x
  for (const grade of GRADES) {
    at += label(p, `${grade} `, at, y) + 4
    at +=
      write(p, figure(tally.counts[grade]), at, y, {
        font: font(600, 14, p.fonts.mono),
        color: gradeColor(p, grade),
      }) + 18
  }
  at += label(p, 'STRAY ', at, y) + 4
  write(p, figure(tally.stray), at, y, { font: font(600, 14, p.fonts.mono), color: p.c.muted })
}

/** Where the keys landed, early to late, across the widest window. */
function histogram(p: Paint, x: number, y: number, w: number, h: number, tally: Tally): void {
  const g = p.g
  const reach = windowOf(tally.level)
  const bins = new Array<number>(BINS).fill(0)
  for (const d of tally.deltas) {
    const i = clamp(Math.floor(((d + reach) / (reach * 2)) * BINS), 0, BINS - 1)
    bins[i] = (bins[i] ?? 0) + 1
  }
  const most = Math.max(1, ...bins)
  const step = w / BINS
  bins.forEach((n, i) => {
    const bar = (n / most) * h
    g.fillStyle = alpha(p.c.accent, 0.25 + 0.75 * (n / most))
    g.fillRect(x + i * step + 1, y + h - bar, step - 2, bar)
  })
  g.fillStyle = alpha(p.c.rule, 0.8)
  g.fillRect(x, y + h, w, 1)
  g.fillStyle = p.c.accentStrong
  g.fillRect(x + w / 2, y - 4, 1, h + 8)
  const small = { font: font(500, 10, p.fonts.ui), color: p.c.muted, spacing: '0.2em' }
  write(p, 'EARLY', x, y + h + 14, small)
  write(p, 'LATE', x + w, y + h + 14, { ...small, align: 'right' })
  const mean = meanDelta(tally)
  const sign = mean > 0 ? '+' : ''
  write(p, `AVG ${sign}${mean.toFixed(0)} MS`, x + w / 2, y + h + 14, {
    ...small,
    align: 'center',
    color: p.c.text,
  })
}
