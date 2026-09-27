import type { Grade } from '../judge'
import { gradeColor } from './fx'
import type { Layout, Rect } from './layout'
import { timeText } from './menu'
import { alpha, clamp, font, type Paint, write } from './paint'

/**
 * The panels either side of the field, where the pane is wide enough for them: on the left
 * the log of what was typed, as a terminal prints it; on the right the letters still to
 * come, in the order they are to be typed - the line of a typing game - and where the track
 * is. Both are read-outs: the field alone is enough to play.
 */

export interface LogLine {
  label: string
  grade: Grade | 'STRAY'
  delta: number | null
}

export interface PanelView {
  log: readonly LogLine[]
  queue: readonly string[]
  time: number
  duration: number
  bar: number
  bars: number
}

const MIN_WIDTH = 170

/** The rectangles beside the field, or null where there is no room. */
export function panelRects(l: Layout): { left: Rect; right: Rect } | null {
  const gap = l.unit * 0.5
  const w = Math.min(l.field.x - l.pad - gap, 380)
  if (w < MIN_WIDTH) return null
  const y = l.field.y + 8
  const h = l.line - y
  return {
    left: { x: l.field.x - gap - w, y, w, h },
    right: { x: l.field.x + l.field.w + gap, y, w, h },
  }
}

export function drawPanels(p: Paint, l: Layout, view: PanelView): void {
  const rects = panelRects(l)
  if (rects === null) return
  frame(p, rects.left, 'TX  //  TYPED')
  log(p, rects.left, view.log)
  frame(p, rects.right, 'RX  //  INCOMING')
  queue(p, rects.right, view.queue)
  position(p, rects.right, view)
}

/** A panel's frame: a title over a rule, and the corners marked as eDEX marked its panels. */
export function frame(p: Paint, r: Rect, title: string): void {
  const g = p.g
  write(p, title, r.x, r.y + 10, {
    font: font(500, 10, p.fonts.ui),
    color: p.c.muted,
    spacing: '0.3em',
    baseline: 'middle',
  })
  g.fillStyle = alpha(p.c.rule, 0.8)
  g.fillRect(r.x, r.y + 20, r.w, 1)
  const corner = 8
  g.fillStyle = alpha(p.c.accent, 0.7)
  g.fillRect(r.x, r.y + r.h - 1, corner, 1)
  g.fillRect(r.x, r.y + r.h - corner, 1, corner)
  g.fillRect(r.x + r.w - corner, r.y + r.h - 1, corner, 1)
  g.fillRect(r.x + r.w - 1, r.y + r.h - corner, 1, corner)
}

/** The keys typed, the newest at the bottom, the older fading up the panel. */
function log(p: Paint, r: Rect, lines: readonly LogLine[]): void {
  const lineH = 21
  const room = Math.max(0, Math.floor((r.h - 40) / lineH))
  const shown = lines.slice(-room)
  const mono = font(600, 13, p.fonts.mono)
  shown.forEach((line, i) => {
    const age = shown.length - 1 - i
    const y = r.y + r.h - 14 - age * lineH
    const fade = clamp(1 - age / Math.max(1, room), 0.15, 1)
    const color = line.grade === 'STRAY' ? p.c.muted : gradeColor(p, line.grade)
    write(p, '>', r.x + 2, y, { font: mono, color: alpha(p.c.accent, fade), baseline: 'middle' })
    write(p, line.label, r.x + 22, y, {
      font: mono,
      color: alpha(p.c.text, fade),
      baseline: 'middle',
    })
    write(p, line.grade, r.x + 50, y, {
      font: font(600, 11, p.fonts.display),
      color: alpha(color, fade),
      baseline: 'middle',
      spacing: '0.2em',
    })
    if (line.delta === null) return
    const sign = line.delta > 0 ? '+' : line.delta < 0 ? '-' : '±'
    write(
      p,
      `${sign}${String(Math.round(Math.abs(line.delta))).padStart(2, '0')}MS`,
      r.x + r.w - 4,
      y,
      {
        font: font(500, 11, p.fonts.mono),
        color: alpha(p.c.muted, fade),
        align: 'right',
        baseline: 'middle',
      },
    )
  })
}

/** The letters to come as a line of text: the next one in a box, the rest after it. */
function queue(p: Paint, r: Rect, letters: readonly string[]): void {
  const g = p.g
  const top = r.y + 40
  const size = 26
  let x = r.x
  let y = top
  letters.forEach((letter, i) => {
    const s = i === 0 ? size : size * 0.7
    const w = s * 0.9
    if (x + w > r.x + r.w) {
      x = r.x
      y += size * 1.2
    }
    if (y > top + size * 2.5) return
    if (i === 0) {
      g.strokeStyle = p.c.accentStrong
      g.lineWidth = 1.5
      g.strokeRect(x + 0.75, y - s * 0.62, w + 6, s * 1.24)
    }
    write(p, letter, x + (w + 6) / 2, y, {
      font: font(700, s * 0.8, p.fonts.mono),
      color: i === 0 ? p.c.accentStrong : alpha(p.c.text, clamp(1 - i * 0.06, 0.3, 0.85)),
      align: 'center',
      baseline: 'middle',
    })
    x += w + (i === 0 ? 14 : 6)
  })
}

/** Where the track is: a bar that fills, the time and the bar number. */
function position(p: Paint, r: Rect, view: PanelView): void {
  const g = p.g
  const y = r.y + r.h - 44
  const done = clamp(view.time / Math.max(1, view.duration), 0, 1)
  write(p, 'POSITION', r.x, y - 14, {
    font: font(500, 10, p.fonts.ui),
    color: p.c.muted,
    spacing: '0.3em',
  })
  g.fillStyle = alpha(p.c.rule, 0.5)
  g.fillRect(r.x, y, r.w, 3)
  g.fillStyle = p.c.accent
  g.fillRect(r.x, y, r.w * done, 3)
  const mono = font(600, 13, p.fonts.mono)
  write(p, `${timeText(Math.max(0, view.time))} / ${timeText(view.duration)}`, r.x, y + 20, {
    font: mono,
    color: p.c.text,
  })
  write(
    p,
    `BAR ${String(Math.max(1, view.bar)).padStart(2, '0')} / ${view.bars}`,
    r.x + r.w,
    y + 20,
    {
      font: mono,
      color: p.c.muted,
      align: 'right',
    },
  )
}
