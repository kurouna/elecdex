import { type Chart, COUNT_IN_BEATS } from '../chart'
import type { Layout } from './layout'
import { hints } from './menu'
import { alpha, clamp, font, type Paint, write } from './paint'

/**
 * What stands over the field for a moment: the boot log while a track loads, the count
 * before it starts and before it goes on, the pause, and the note that the keyboard is not
 * connected yet.
 */

export const LOAD_MS = 1100
const LINE_MS = 230

/** The track loading, as a boot log: each line typed out, then OK. */
export function drawLoading(p: Paint, l: Layout, chart: Chart, index: number, age: number): void {
  const lines = [
    [`MOUNT   /tracks/${String(index + 1).padStart(2, '0')}-${chart.song.id}`, 'OK'],
    [`DECODE  ${chart.notes.length} NOTES  //  ${chart.level.toUpperCase()}`, 'OK'],
    [`SYNC    CLOCK ${chart.bpm.from} BPM`, 'LOCKED'],
    ['LINK    KEYBOARD', 'READY'],
  ] as const
  const size = clamp(l.unit * 0.24, 11, 15)
  const x = l.field.x + l.unit * 0.5
  let y = l.field.y + l.unit * 0.9
  const width = Math.min(l.field.w - l.unit, 620)
  lines.forEach(([text, status], i) => {
    const t = p.reduced ? 1 : clamp((age - i * LINE_MS) / (LINE_MS * 0.8), 0, 1)
    if (t <= 0) return
    const shown = text.slice(0, Math.ceil(text.length * t))
    write(p, '>', x, y, { font: font(600, size, p.fonts.mono), color: p.c.accent })
    write(p, shown, x + size * 1.4, y, { font: font(500, size, p.fonts.mono), color: p.c.text })
    if (t >= 1) {
      write(p, status, x + width, y, {
        font: font(600, size, p.fonts.mono),
        color: p.c.ok,
        align: 'right',
      })
    }
    y += size * 1.9
  })
}

/**
 * The count-in's word at a song time, `beat` milliseconds a beat: 3, 2, 1 and then LINK on
 * its last beat, each with how long it has stood; null before the count and once the song
 * is on. The play begins a moment before the count (Chart.start), which shows nothing.
 */
export function countWord(time: number, beat: number): { word: string; age: number } | null {
  if (time >= 0) return null
  const left = Math.ceil(-time / beat)
  if (left > COUNT_IN_BEATS) return null
  return { word: left <= 1 ? 'LINK' : String(left - 1), age: time + left * beat }
}

/** A count over the field: 3, 2, 1 and the word to go, each popping in on its beat. */
export function drawCount(p: Paint, l: Layout, word: string, age: number): void {
  const g = p.g
  const size = clamp(l.unit * 1.3, 36, 110)
  const pop = p.reduced ? 1 : 1 + 0.35 * (1 - clamp(age / 140, 0, 1))
  g.save()
  g.globalAlpha = p.reduced ? 1 : clamp(1.2 - age / 600, 0.25, 1)
  g.translate(l.field.x + l.field.w / 2, l.field.y + l.field.h * 0.42)
  g.scale(pop, pop)
  write(p, word, 0, 0, {
    font: font(700, word.length > 1 ? size * 0.55 : size, p.fonts.display),
    color: p.c.accentStrong,
    align: 'center',
    baseline: 'middle',
    spacing: word.length > 1 ? '0.35em' : '0px',
  })
  g.restore()
}

/** The pause: the field dimmed, and what the keys do now. */
export function drawPause(p: Paint, l: Layout, labels: Readonly<Record<string, string>>): void {
  const g = p.g
  g.fillStyle = alpha(p.c.ground, 0.78)
  g.fillRect(l.field.x, l.field.y, l.field.w, l.line - l.field.y)
  const cx = l.field.x + l.field.w / 2
  const cy = l.field.y + l.field.h * 0.42
  write(p, 'SUSPENDED', cx, cy, {
    font: font(700, clamp(l.unit * 0.5, 18, 36), p.fonts.display),
    color: p.c.accentStrong,
    align: 'center',
    baseline: 'middle',
    spacing: '0.45em',
  })
  write(p, 'LINK HELD  //  THE TRACK WAITS WHERE IT STOPPED', cx, cy + 30, {
    font: font(500, 11, p.fonts.ui),
    color: p.c.muted,
    align: 'center',
    baseline: 'middle',
    spacing: '0.2em',
  })
  hints(
    p,
    l,
    [
      ['ESC', 'RESUME'],
      [labels.KeyR ?? 'R', 'RETRY'],
      [labels.KeyQ ?? 'Q', 'QUIT'],
    ],
    l.line - 10,
  )
}

/** The keyboard is not the pane's yet: say how to give it, over the field. */
export function drawConnect(p: Paint, l: Layout, words: string): void {
  const g = p.g
  const size = 12
  g.font = font(600, size, p.fonts.ui)
  g.letterSpacing = '0.22em'
  const w = g.measureText(words).width + 36
  g.letterSpacing = '0px'
  const x = l.w / 2 - w / 2
  const y = l.line - 92
  g.fillStyle = alpha(p.c.ground, 0.92)
  g.fillRect(x, y, w, 28)
  g.strokeStyle = p.c.accent
  g.lineWidth = 1
  g.strokeRect(x + 0.5, y + 0.5, w - 1, 27)
  write(p, words, l.w / 2 + 2, y + 14.5, {
    font: font(600, size, p.fonts.ui),
    color: p.c.accentStrong,
    align: 'center',
    baseline: 'middle',
    spacing: '0.22em',
  })
}
