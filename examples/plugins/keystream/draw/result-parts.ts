import {
  accuracyOf,
  fastSlow,
  GRADES,
  type Lamp,
  meanDelta,
  type Rank,
  type Tally,
  windowOf,
} from '../judge'
import { gradeColor } from './fx'
import { bpmText } from './hud'
import { figure } from './menu'
import { alpha, clamp, counter, fitted, font, measure, type Paint, rule, write } from './paint'
import { frame } from './panels'
import type { ResultView } from './result'

/**
 * The parts of the result screen, each drawn in the screen's design units and each arriving
 * on its own beat (REVEAL): the scan line, the heading typed out, the figures counting up,
 * the bars filling, then the rank slammed in and the lamp stamped on - as a game ends a
 * stage. With motion reduced, everything is simply there.
 */

/** When each part arrives, in milliseconds from the result's opening. */
export const REVEAL = {
  frames: 150,
  score: 380,
  bars: 480,
  rank: 1350,
  lamp: 1650,
  record: 1850,
  hints: 2150,
  done: 2500,
} as const

/**
 * The result's way in and out, as a pane's: it opens from a line of light; a key pressed on
 * it blinks its hint, 100 ms a beat as a chosen row does, and the screen presses back into
 * the line before the key acts.
 */
export const TUBE = { open: 260, blink: 400, close: 180 } as const

/** How open the screen is, 0 a line and 1 open, and how bright the line across it. */
export function tube(age: number, exit: number | null): { open: number; line: number } {
  if (exit !== null && exit >= TUBE.blink) {
    const t = Math.min(1, (exit - TUBE.blink) / TUBE.close)
    return { open: 1 - t * t, line: t }
  }
  if (age >= TUBE.open) return { open: 1, line: 0 }
  const t = Math.max(0, age) / TUBE.open
  return { open: 1 - (1 - t) ** 3, line: 1 - t }
}

/** How far a part has come, eased from 0 to 1 over `ms` from `start`; 1 with motion reduced. */
export type Reveal = (start: number, ms: number) => number

export function rankColor(p: Paint, rank: Rank, failed: boolean): string {
  if (failed) return p.c.muted
  return { S: p.c.accentStrong, A: p.c.accent, B: p.c.text, C: p.c.warn, D: p.c.danger }[rank]
}

export function lampColor(p: Paint, lamp: Lamp): string {
  return {
    'ALL SYNC': p.c.accentStrong,
    'FULL CHAIN': p.c.ok,
    CLEAR: p.c.accent,
    'NO CARRIER': p.c.danger,
  }[lamp]
}

const label = (p: Paint, text: string, x: number, y: number, align: 'left' | 'right' = 'left') =>
  write(p, text, x, y, {
    font: font(500, 10.5, p.fonts.ui),
    color: p.c.muted,
    spacing: '0.24em',
    align,
  })

/** A scan line down the screen as it opens, the way the tube draws a new picture. */
export function sweep(p: Paint, w: number, h: number, age: number): void {
  const t = clamp(age / 650, 0, 1)
  if (p.reduced || t >= 1) return
  const g = p.g
  const y = -20 + (h + 40) * t
  const trail = g.createLinearGradient(0, y - 70, 0, y)
  trail.addColorStop(0, alpha(p.c.accent, 0))
  trail.addColorStop(1, alpha(p.c.accent, 0.12 * (1 - t)))
  g.fillStyle = trail
  g.fillRect(-20, y - 70, w + 40, 70)
  g.fillStyle = alpha(p.c.accentStrong, 0.75 * (1 - t))
  g.fillRect(-20, y, w + 40, 1.5)
}

/** The heading typed out, the track under it, the lamp at its right and a rule beneath. */
export function header(
  p: Paint,
  w: number,
  view: ResultView,
  lamp: Lamp,
  age: number,
  reveal: Reveal,
): void {
  const g = p.g
  const text = view.failed ? 'LINK TERMINATED' : 'TRANSMISSION COMPLETE'
  const typed = p.reduced ? 1 : clamp(age / 480, 0, 1)
  const size = w < 800 ? 19 : 28
  const color = view.failed ? p.c.danger : p.c.accentStrong
  const shown = text.slice(0, Math.ceil(text.length * typed))
  const tw = write(p, shown, 0, 30, {
    font: font(700, size, p.fonts.display),
    color,
    spacing: '0.28em',
  })
  // The cursor stays only while the line is typed, so the still screen has none.
  if (!p.reduced && age < 700 && Math.floor(age / 120) % 2 === 0) {
    g.fillStyle = alpha(color, 0.85)
    g.fillRect(tw + 2, 30 - size * 0.74, size * 0.42, size * 0.8)
  }
  trackLine(p, 56, w, view)
  lampStamp(p, w, 6, lamp, reveal)
  const t = reveal(REVEAL.frames, 450)
  if (t >= 1) rule(p, 0, 74, w, alpha(p.c.rule, 0.9))
  else {
    g.fillStyle = alpha(p.c.rule, 0.9)
    g.fillRect(0, 74, w * t, 1)
  }
}

function trackLine(p: Paint, y: number, w: number, view: ResultView): void {
  let x = 0
  x +=
    write(p, String(view.index + 1).padStart(2, '0'), x, y, {
      font: font(600, 14, p.fonts.mono),
      color: p.c.accent,
    }) + 12
  x +=
    write(p, view.chart.song.title, x, y, {
      font: font(600, 15, p.fonts.display),
      color: p.c.text,
      spacing: '0.14em',
    }) + 14
  const style = { font: font(500, 12, p.fonts.ui), color: p.c.muted, spacing: '0.16em' }
  const { song, level } = view.chart
  const rest = `${song.style}  //  ${song.credit}  //  ${level.toUpperCase()}  //  ${bpmText(view.chart)}`
  write(p, fitted(p, rest, w - x, style), x, y, style)
}

/** The lamp: how the play ended, stamped on once the rank is in. Until then, its place. */
function lampStamp(p: Paint, right: number, y: number, lamp: Lamp, reveal: Reveal): void {
  const g = p.g
  const color = lampColor(p, lamp)
  const spacing = 0.26 * 17
  const style = {
    font: font(700, 17, p.fonts.display),
    color,
    spacing: `${spacing}px`,
    baseline: 'middle' as const,
    align: 'center' as const,
  }
  const w = measure(p, lamp, style) + 34
  const h = 38
  const cx = right - w / 2
  const cy = y + h / 2
  const t = reveal(REVEAL.lamp, 240)
  if (t <= 0) {
    g.strokeStyle = alpha(p.c.rule, 0.7)
    g.lineWidth = 1
    g.setLineDash([4, 4])
    g.strokeRect(right - w + 0.5, y + 0.5, w - 1, h - 1)
    g.setLineDash([])
    return
  }
  g.save()
  g.globalAlpha = t
  g.translate(cx, cy)
  const scale = 1 + 0.7 * (1 - t)
  g.scale(scale, scale)
  g.fillStyle = alpha(color, p.light ? 0.12 : 0.16)
  g.fillRect(-w / 2, -h / 2, w, h)
  g.strokeStyle = color
  g.lineWidth = 1.5
  g.strokeRect(-w / 2 + 0.75, -h / 2 + 0.75, w - 1.5, h - 1.5)
  // Letter spacing trails the last letter too: half of it back, so the word sits centred.
  write(p, lamp, spacing / 2, 1, style)
  g.restore()
  const f = reveal(REVEAL.lamp + 160, 460)
  if (f <= 0 || f >= 1) return
  const grow = 16 * f
  g.strokeStyle = alpha(color, 0.8 * (1 - f))
  g.lineWidth = 1.5
  g.strokeRect(right - w - grow, y - grow, w + grow * 2, h + grow * 2)
}

function diamond(p: Paint, cx: number, cy: number, r: number): void {
  const g = p.g
  g.beginPath()
  g.moveTo(cx, cy - r)
  g.lineTo(cx + r, cy)
  g.lineTo(cx, cy + r)
  g.lineTo(cx - r, cy)
  g.closePath()
}

export interface Emblem {
  cx: number
  cy: number
  r: number
}

/**
 * The rank in a diamond: while the figures count, letters run through it; then the rank
 * is slammed in with a flash, and a ring of light for an S or an A.
 */
export function rankEmblem(p: Paint, at: Emblem, view: ResultView, age: number, reveal: Reveal) {
  const color = rankColor(p, view.rank, view.failed)
  const show = reveal(REVEAL.frames, 420)
  const slam = reveal(REVEAL.rank, 240)
  if (!p.light && slam > 0) glow(p, at, color, slam)
  emblemFrame(p, at, color, show)
  if (slam > 0) {
    burst(p, at, color, view, reveal)
    letter(p, at, view.rank, color, slam)
  } else if (show > 0) {
    // Letters running, as a slot does before it stops.
    const running = 'SABCD'[Math.floor(age / 70) % 5] ?? 'S'
    write(p, running, at.cx, at.cy + at.r * 0.06, {
      font: font(700, at.r * 0.95, p.fonts.display),
      color: alpha(p.c.muted, 0.45 * show),
      align: 'center',
      baseline: 'middle',
    })
  }
  const labelY = at.cy + at.r + 38
  write(p, 'RANK', at.cx, labelY, {
    font: font(500, 10.5, p.fonts.ui),
    color: alpha(p.c.muted, show),
    align: 'center',
    spacing: '0.5em',
  })
}

function glow(p: Paint, at: Emblem, color: string, t: number): void {
  const g = p.g
  const halo = g.createRadialGradient(at.cx, at.cy, at.r * 0.2, at.cx, at.cy, at.r * 1.9)
  halo.addColorStop(0, alpha(color, 0.2 * t))
  halo.addColorStop(1, alpha(color, 0))
  g.fillStyle = halo
  g.fillRect(at.cx - at.r * 2, at.cy - at.r * 2, at.r * 4, at.r * 4)
}

function emblemFrame(p: Paint, at: Emblem, color: string, show: number): void {
  if (show <= 0) return
  const g = p.g
  const r = at.r * (0.86 + 0.14 * show)
  const fill = g.createLinearGradient(0, at.cy - r, 0, at.cy + r)
  fill.addColorStop(0, alpha(color, 0.2 * show))
  fill.addColorStop(1, alpha(color, 0.02 * show))
  diamond(p, at.cx, at.cy, r)
  g.fillStyle = fill
  g.fill()
  g.strokeStyle = alpha(color, show)
  g.lineWidth = 2
  g.stroke()
  diamond(p, at.cx, at.cy, r - 12)
  g.strokeStyle = alpha(color, 0.35 * show)
  g.lineWidth = 1
  g.stroke()
  // A tick off each point, as eDEX marked the corners of its panels.
  g.fillStyle = alpha(color, 0.8 * show)
  g.fillRect(at.cx - 0.5, at.cy - r - 16, 1, 9)
  g.fillRect(at.cx - 0.5, at.cy + r + 7, 1, 9)
  g.fillRect(at.cx - r - 16, at.cy - 0.5, 9, 1)
  g.fillRect(at.cx + r + 7, at.cy - 0.5, 9, 1)
}

/** The flash of the rank landing: the diamond thrown outwards, and rays for an S or an A. */
function burst(p: Paint, at: Emblem, color: string, view: ResultView, reveal: Reveal): void {
  const f = reveal(REVEAL.rank + 60, 560)
  if (f >= 1) return
  const g = p.g
  diamond(p, at.cx, at.cy, at.r)
  g.fillStyle = alpha(color, 0.35 * (1 - reveal(REVEAL.rank, 320)))
  g.fill()
  diamond(p, at.cx, at.cy, at.r * (1 + 0.5 * f))
  g.strokeStyle = alpha(color, 0.9 * (1 - f))
  g.lineWidth = 2
  g.stroke()
  if (view.failed || (view.rank !== 'S' && view.rank !== 'A')) return
  g.strokeStyle = alpha(color, 0.8 * (1 - f))
  g.lineWidth = 1.5
  g.beginPath()
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + Math.PI / 16
    const from = at.r * 1.1
    const to = at.r * (1.16 + 0.6 * f)
    g.moveTo(at.cx + Math.cos(a) * from, at.cy + Math.sin(a) * from)
    g.lineTo(at.cx + Math.cos(a) * to, at.cy + Math.sin(a) * to)
  }
  g.stroke()
}

function letter(p: Paint, at: Emblem, rank: Rank, color: string, slam: number): void {
  const g = p.g
  g.save()
  g.translate(at.cx, at.cy + at.r * 0.06)
  const scale = 1 + 1.4 * (1 - slam)
  g.scale(scale, scale)
  g.globalAlpha = slam
  if (!p.light) {
    g.shadowColor = color
    g.shadowBlur = 26
  }
  write(p, rank, 0, 0, {
    font: font(700, at.r * 1.12, p.fonts.display),
    color,
    align: 'center',
    baseline: 'middle',
  })
  g.restore()
}

/** The score counting up, the best it is set against, and the new record's tag. */
export function scoreBlock(
  p: Paint,
  x: number,
  w: number,
  view: ResultView,
  age: number,
  reveal: Reveal,
): void {
  label(p, 'SCORE', x, 104)
  const t = reveal(REVEAL.score, 950)
  counter(p, view.score * t, 7, x - 2, 154, 48, view.failed ? p.c.muted : p.c.text)
  bestLine(p, x, 186, view, reveal)
  if (view.newRecord && !view.failed) recordTag(p, x + w, 186, age, reveal)
  p.g.fillStyle = alpha(p.c.rule, 0.6)
  p.g.fillRect(x, 202, w * reveal(REVEAL.frames, 450), 1)
}

function bestLine(p: Paint, x: number, y: number, view: ResultView, reveal: Reveal): void {
  const t = reveal(REVEAL.rank - 150, 300)
  if (t <= 0) return
  const g = p.g
  g.globalAlpha = t
  const mono = font(600, 14, p.fonts.mono)
  if (view.previous === null) {
    if (!view.failed) label(p, 'FIRST RECORD', x, y)
  } else {
    let at = x + label(p, 'BEST', x, y) + 10
    at += write(p, figure(view.previous), at, y, { font: mono, color: p.c.muted }) + 14
    const diff = view.score - view.previous
    const text = `${diff >= 0 ? '+' : '−'}${figure(Math.abs(diff))}`
    write(p, text, at, y, { font: mono, color: diff > 0 ? p.c.ok : p.c.muted })
  }
  g.globalAlpha = 1
}

/** NEW RECORD, blinking a few times as it arrives and then steady. */
function recordTag(p: Paint, right: number, y: number, age: number, reveal: Reveal): void {
  if (reveal(REVEAL.record, 1) <= 0) return
  const since = age - REVEAL.record
  if (!p.reduced && since < 600 && Math.floor(since / 110) % 2 === 1) return
  const g = p.g
  const style = {
    font: font(700, 11, p.fonts.display),
    color: p.c.accentStrong,
    spacing: '0.24em',
    baseline: 'middle' as const,
  }
  const w = measure(p, 'NEW RECORD', style) + 16
  g.fillStyle = alpha(p.c.accentStrong, p.light ? 0.1 : 0.16)
  g.fillRect(right - w, y - 14, w, 19)
  g.strokeStyle = p.c.accentStrong
  g.lineWidth = 1
  g.strokeRect(right - w + 0.5, y - 13.5, w - 1, 18)
  write(p, 'NEW RECORD', right - w + 8, y - 4, style)
}

/** A bar and a count for each grade, filling one after another; then STRAY, FAST and SLOW. */
export function judgements(p: Paint, x: number, w: number, tally: Tally, reveal: Reveal): void {
  const g = p.g
  GRADES.forEach((grade, i) => {
    const t = reveal(REVEAL.bars + i * 90, 650)
    // Each row comes in from the left, one after another, as the launcher's tiles do.
    const come = reveal(REVEAL.bars + i * 90, 220)
    g.save()
    g.globalAlpha = come
    g.translate(-16 * (1 - come), 0)
    const y = 230 + i * 30
    const color = gradeColor(p, grade)
    write(p, grade, x, y, {
      font: font(600, 13, p.fonts.display),
      color: alpha(color, clamp(t * 3, 0, 1)),
      spacing: '0.22em',
      baseline: 'middle',
    })
    const bx = x + 76
    const bw = w - 76 - 66
    g.fillStyle = alpha(p.c.rule, 0.35)
    g.fillRect(bx, y - 1, bw, 2)
    const share = tally.total === 0 ? 0 : tally.counts[grade] / tally.total
    const fill = share > 0 ? Math.max(2, bw * share) : 0
    g.fillStyle = alpha(color, 0.9)
    g.fillRect(bx, y - 4, fill * t, 8)
    write(p, figure(Math.round(tally.counts[grade] * t)), x + w, y, {
      font: font(600, 17, p.fonts.mono),
      color: alpha(p.c.text, clamp(t * 3, 0, 1)),
      align: 'right',
      baseline: 'middle',
    })
    g.restore()
  })
  const t = reveal(REVEAL.bars + 380, 400)
  if (t <= 0) return
  g.globalAlpha = t
  const { fast, slow } = fastSlow(tally)
  let at = x
  for (const [name, n] of [
    ['STRAY', tally.stray],
    ['FAST', fast],
    ['SLOW', slow],
  ] as const) {
    at += label(p, name, at, 356) + 8
    at += write(p, figure(n), at, 356, { font: font(600, 13, p.fonts.mono), color: p.c.text }) + 24
  }
  g.globalAlpha = 1
}

/** Accuracy, the longest chain and the timing, in a panel beside the figures. */
export function analysis(p: Paint, x: number, w: number, tally: Tally, reveal: Reveal): void {
  const g = p.g
  g.globalAlpha = reveal(REVEAL.frames + 120, 420)
  frame(p, { x, y: 94, w, h: 272 }, 'SIGNAL  //  ANALYSIS')
  g.globalAlpha = 1
  accuracyRing(p, x + 60, 186, 46, accuracyOf(tally), reveal(REVEAL.score + 80, 1000))
  const t = reveal(REVEAL.score + 200, 500)
  g.globalAlpha = t
  const at = x + 134
  label(p, 'MAX CHAIN', at, 160)
  const n = write(p, figure(tally.maxChain), at, 186, {
    font: font(600, 21, p.fonts.mono),
    color: p.c.text,
  })
  write(p, ` / ${figure(tally.total)}`, at + n, 186, {
    font: font(600, 13, p.fonts.mono),
    color: p.c.muted,
  })
  label(p, 'AVG OFFSET', at, 216)
  const mean = Math.round(meanDelta(tally))
  write(p, `${mean > 0 ? '+' : mean < 0 ? '−' : '±'}${Math.abs(mean)} MS`, at, 240, {
    font: font(600, 16, p.fonts.mono),
    color: p.c.text,
  })
  g.globalAlpha = 1
  histogram(p, x, 280, w, 50, tally, reveal(REVEAL.bars + 150, 700))
}

/** The same figures on one line, where the pane has no room for the panel. */
export function summary(p: Paint, x: number, y: number, tally: Tally, reveal: Reveal): void {
  const g = p.g
  g.globalAlpha = reveal(REVEAL.bars + 380, 400)
  const mono = font(600, 13, p.fonts.mono)
  let at = x + label(p, 'ACC', x, y) + 8
  at += write(p, `${accuracyOf(tally).toFixed(2)}%`, at, y, { font: mono, color: p.c.text }) + 24
  at += label(p, 'MAX CHAIN', at, y) + 8
  write(p, `${figure(tally.maxChain)} / ${figure(tally.total)}`, at, y, {
    font: mono,
    color: p.c.text,
  })
  g.globalAlpha = 1
}

function accuracyRing(p: Paint, cx: number, cy: number, r: number, acc: number, t: number) {
  const g = p.g
  g.lineWidth = 5
  g.strokeStyle = alpha(p.c.rule, 0.35)
  g.beginPath()
  g.arc(cx, cy, r, 0, Math.PI * 2)
  g.stroke()
  g.fillStyle = alpha(p.c.muted, 0.6)
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2 - Math.PI / 2
    const long = i % 5 === 0 ? 6 : 3
    g.save()
    g.translate(cx + Math.cos(a) * (r + 8), cy + Math.sin(a) * (r + 8))
    g.rotate(a)
    g.fillRect(0, -0.5, long, 1)
    g.restore()
  }
  if (t > 0) {
    g.strokeStyle = p.c.accentStrong
    g.lineCap = 'butt'
    g.beginPath()
    g.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (acc / 100) * t)
    g.stroke()
  }
  write(p, (acc * t).toFixed(1), cx, cy - 3, {
    font: font(600, 21, p.fonts.mono),
    color: p.c.text,
    align: 'center',
    baseline: 'middle',
  })
  write(p, 'ACCURACY %', cx, cy + 17, {
    font: font(500, 8.5, p.fonts.ui),
    color: p.c.muted,
    align: 'center',
    baseline: 'middle',
    spacing: '0.16em',
  })
}

/** Where the keys landed, early to late across the widest window, SYNC's band marked. */
function histogram(p: Paint, x: number, y: number, w: number, h: number, tally: Tally, t: number) {
  const g = p.g
  const bins = 29
  const reach = windowOf(tally.level)
  const counts = new Array<number>(bins).fill(0)
  for (const d of tally.deltas) {
    const i = clamp(Math.floor(((d + reach) / (reach * 2)) * bins), 0, bins - 1)
    counts[i] = (counts[i] ?? 0) + 1
  }
  const sync = (windowOf(tally.level, 'SYNC') / reach) * (w / 2)
  g.fillStyle = alpha(p.c.accentStrong, p.light ? 0.05 : 0.045)
  g.fillRect(x + w / 2 - sync, y, sync * 2, h)
  const most = Math.max(1, ...counts)
  const step = w / bins
  counts.forEach((n, i) => {
    const bar = (n / most) * h * t
    g.fillStyle = alpha(p.c.accent, 0.3 + 0.7 * (n / most))
    g.fillRect(x + i * step + 1, y + h - bar, step - 2, bar)
  })
  g.fillStyle = alpha(p.c.rule, 0.8)
  g.fillRect(x, y + h, w, 1)
  g.fillStyle = p.c.accentStrong
  g.fillRect(x + w / 2 - 0.5, y - 6, 1, h + 10)
  const small = { font: font(500, 9.5, p.fonts.ui), color: p.c.muted, spacing: '0.22em' }
  write(p, 'EARLY', x, y + h + 16, small)
  write(p, 'SYNC', x + w / 2, y + h + 16, { ...small, align: 'center', color: p.c.accent })
  write(p, 'LATE', x + w, y + h + 16, { ...small, align: 'right' })
}
