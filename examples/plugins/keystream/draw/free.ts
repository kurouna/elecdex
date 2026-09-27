import { chordName } from '../chord-name'
import { type PlayedNote, RISE_MS, type Trail } from '../free'
import { isBlack, keyOf, noteName } from '../keyboard'
import { CHIP_HEIGHT } from './field'
import { LAMP_ROOM, type Layout, type Rect } from './layout'
import { hints } from './menu'
import { alpha, clamp, font, type Paint, rule, write } from './paint'
import { frame, panelRects } from './panels'

/**
 * FREE mode's screen: the header says the tone, the octave, the pedal and the band; what is
 * played rises from the keys as trails and is named as a chord in the middle of the field;
 * beside it, what was played and what the keys do.
 */

export interface FreeView {
  tone: string
  octave: number
  pedal: boolean
  /** The band going round underneath, by its place in the list. */
  backing: number | null
  tracks: readonly string[]
  trails: readonly Trail[]
  holding: readonly number[]
  played: readonly PlayedNote[]
}

export function drawFree(p: Paint, l: Layout, view: FreeView, now: number): void {
  header(p, l, view)
  trails(p, l, view.trails, now)
  chord(p, l, view.holding)
  const rects = panelRects(l)
  if (rects === null) {
    // No room beside the field: the keys of the mode go across its top instead.
    hints(p, l, KEYS, l.field.y + 22)
    return
  }
  frame(p, rects.left, 'TX  //  PLAYED')
  playedLog(p, rects.left, view.played)
  frame(p, rects.right, 'BAND  //  1-9  < >')
  bandList(p, rects.right, view)
}

const signed = (n: number) => (n > 0 ? `+${n}` : String(n))

/** What the keys do in the mode. */
const KEYS: readonly (readonly [string, string])[] = [
  ['SPACE', 'PEDAL'],
  ['←→', 'OCTAVE'],
  ['↑↓', 'TONE'],
  ['ENTER', 'BAND'],
  ['1-9', 'WHICH BAND'],
  ['< >', 'BAND BEFORE / AFTER'],
  ['ESC', 'MENU'],
]

function header(p: Paint, l: Layout, view: FreeView): void {
  const s = l.scale
  const y = l.header.h * 0.31
  const muted = {
    font: font(500, 12 * s, p.fonts.ui),
    color: p.c.muted,
    baseline: 'middle' as const,
    spacing: '0.12em',
  }
  let x = l.header.x
  x += write(p, 'KEYSTREAM', x, y, {
    font: font(600, 11 * s, p.fonts.display),
    color: p.c.accent,
    spacing: '0.32em',
    baseline: 'middle',
  })
  x += write(p, '  //  ', x, y, muted)
  x += write(p, 'FREE PLAY', x, y, { ...muted, color: p.c.text })
  write(p, `  //  TONE ${view.tone}  //  OCTAVE ${signed(view.octave)}`, x, y, muted)
  lamp(p, 'PEDAL', l.w - l.pad - LAMP_ROOM, y, view.pedal, s)
  const band =
    view.backing === null ? 'OFF' : `${view.backing + 1}  ${view.tracks[view.backing] ?? ''}`
  const line2 = l.header.h * 0.79
  const at =
    l.header.x +
    write(p, 'BAND ', l.header.x, line2, {
      font: font(500, 10 * s, p.fonts.ui),
      color: p.c.muted,
      spacing: '0.2em',
    })
  write(p, band, at + 6, line2, {
    font: font(600, 15 * s, p.fonts.mono),
    color: view.backing === null ? p.c.muted : p.c.text,
  })
  rule(p, l.header.x, l.header.h - 1, l.header.w, alpha(p.c.rule, 0.8))
}

/** A small lit box: on while the thing it names is. */
function lamp(p: Paint, text: string, right: number, y: number, on: boolean, s: number): void {
  const g = p.g
  g.font = font(600, 11 * s, p.fonts.ui)
  g.letterSpacing = '0.25em'
  const w = g.measureText(text).width + 16
  g.letterSpacing = '0px'
  const h = 18 * s
  g.fillStyle = on ? p.c.accent : 'rgba(0, 0, 0, 0)'
  g.fillRect(right - w, y - h / 2, w, h)
  g.strokeStyle = alpha(p.c.border, on ? 1 : 0.6)
  g.lineWidth = 1
  g.strokeRect(right - w + 0.5, y - h / 2 + 0.5, w - 1, h - 1)
  write(p, text, right - w / 2 + 2, y + 0.5, {
    font: font(600, 11 * s, p.fonts.ui),
    color: on ? p.c.inverse : p.c.muted,
    align: 'center',
    baseline: 'middle',
    spacing: '0.25em',
  })
}

/** What is played, rising from its key: bright at the key while held, fading as it goes. */
function trails(p: Paint, l: Layout, list: readonly Trail[], now: number): void {
  const g = p.g
  const rise = (l.line - l.field.y) / RISE_MS
  g.save()
  g.beginPath()
  g.rect(l.field.x - l.unit, l.field.y, l.field.w + l.unit * 2, l.line - l.field.y)
  g.clip()
  for (const trail of list) {
    const key = keyOf(trail.code)
    if (key === undefined) continue
    const top = l.line - (now - trail.start) * rise
    const bottom = trail.end === null ? l.line : l.line - (now - trail.end) * rise
    const height = Math.max(l.unit * CHIP_HEIGHT * 0.5, bottom - top)
    const w = l.unit * (isBlack(key) ? 0.62 : 0.8)
    const x = l.keyX(key) - w / 2
    const fade = clamp(1 - (l.line - bottom) / (l.line - l.field.y), 0, 1)
    const color = isBlack(key) ? p.c.accentStrong : p.c.accent
    const body = g.createLinearGradient(0, bottom, 0, bottom - height)
    body.addColorStop(0, alpha(color, (p.light ? 0.35 : 0.55) * fade))
    body.addColorStop(1, alpha(color, 0.08 * fade))
    g.fillStyle = body
    g.beginPath()
    g.roundRect(x, bottom - height, w, height, 3)
    g.fill()
    g.fillStyle = alpha(p.c.accentStrong, 0.9 * fade)
    g.fillRect(x, bottom - 2, w, 2)
  }
  g.restore()
}

/** The chord held, large in the middle of the field, with its notes under it. */
function chord(p: Paint, l: Layout, holding: readonly number[]): void {
  if (holding.length === 0) return
  const cx = l.field.x + l.field.w / 2
  const cy = l.field.y + l.field.h * 0.3
  const name = chordName(holding) ?? (holding.length === 1 ? noteName(holding[0] ?? 60) : null)
  if (name !== null) {
    write(p, name, cx, cy, {
      font: font(700, clamp(l.unit * 0.9, 24, 72), p.fonts.display),
      color: alpha(p.c.accentStrong, 0.9),
      align: 'center',
      baseline: 'middle',
      spacing: '0.08em',
    })
  }
  write(p, holding.map(noteName).join('  '), cx, cy + clamp(l.unit * 0.7, 20, 52), {
    font: font(500, 13, p.fonts.mono),
    color: p.c.muted,
    align: 'center',
    baseline: 'middle',
  })
}

function playedLog(p: Paint, r: Rect, played: readonly PlayedNote[]): void {
  const lineH = 21
  const room = Math.max(0, Math.floor((r.h - 40) / lineH))
  const shown = played.slice(-room)
  const mono = font(600, 13, p.fonts.mono)
  shown.forEach((note, i) => {
    const age = shown.length - 1 - i
    const y = r.y + r.h - 14 - age * lineH
    const fade = clamp(1 - age / Math.max(1, room), 0.15, 1)
    write(p, '>', r.x + 2, y, { font: mono, color: alpha(p.c.accent, fade), baseline: 'middle' })
    write(p, note.label, r.x + 22, y, {
      font: mono,
      color: alpha(p.c.text, fade),
      baseline: 'middle',
    })
    write(p, note.name, r.x + 50, y, {
      font: font(600, 12, p.fonts.display),
      color: alpha(p.c.accentStrong, fade),
      baseline: 'middle',
      spacing: '0.1em',
    })
  })
}

/** Rows of the band list, and the room under them for the keys of the mode. */
const ROW_H = 22
const KEY_ROW_H = 22

/**
 * The bands to play over, by number, and the keys of the mode. A list longer than the
 * panel has room for scrolls with the band chosen, as the menu's does.
 */
function bandList(p: Paint, r: Rect, view: FreeView): void {
  const rows = ['OFF', ...view.tracks]
  const chosen = view.backing === null ? 0 : view.backing + 1
  const room = r.h - 40 - 18 - KEYS.length * KEY_ROW_H
  const shown = clamp(Math.floor(room / ROW_H), 3, rows.length)
  const first = clamp(chosen - Math.floor(shown / 2), 0, rows.length - shown)
  for (let i = first; i < first + shown; i++) {
    bandRow(p, r, rows[i] ?? '', i, r.y + 40 + (i - first) * ROW_H, i === chosen)
  }
  const more = { font: font(500, 10, p.fonts.ui), color: p.c.muted, align: 'right' as const }
  if (first > 0) write(p, '▲', r.x + r.w - 4, r.y + 40 - ROW_H / 2, more)
  if (first + shown < rows.length) {
    write(p, '▼ MORE', r.x + r.w - 4, r.y + 40 + shown * ROW_H - 6, more)
  }
  keyList(p, r, r.y + 40 + shown * ROW_H + 18)
}

function bandRow(p: Paint, r: Rect, title: string, i: number, y: number, on: boolean): void {
  const g = p.g
  if (on) {
    g.fillStyle = alpha(p.c.accent, p.light ? 0.12 : 0.1)
    g.fillRect(r.x, y - ROW_H / 2 + 1, r.w, ROW_H - 2)
    g.fillStyle = p.c.accentStrong
    g.fillRect(r.x, y - ROW_H / 2 + 1, 3, ROW_H - 2)
  }
  write(p, String(i), r.x + 12, y, {
    font: font(600, 13, p.fonts.mono),
    color: p.c.muted,
    baseline: 'middle',
  })
  write(p, title, r.x + 40, y, {
    font: font(600, 12, p.fonts.display),
    color: on ? p.c.accentStrong : p.c.text,
    baseline: 'middle',
    spacing: '0.12em',
  })
}

function keyList(p: Paint, r: Rect, top: number): void {
  const g = p.g
  KEYS.forEach(([key, word], i) => {
    const y = top + i * KEY_ROW_H
    if (y > r.y + r.h - 8) return
    const capFont = font(600, 10, p.fonts.mono)
    g.font = capFont
    const w = g.measureText(key).width + 10
    g.strokeStyle = alpha(p.c.border, 0.7)
    g.lineWidth = 1
    g.strokeRect(r.x + 0.5, y - 8.5, w, 16)
    write(p, key, r.x + w / 2 + 0.5, y, {
      font: capFont,
      color: p.c.text,
      align: 'center',
      baseline: 'middle',
    })
    write(p, word, r.x + w + 10, y, {
      font: font(500, 10, p.fonts.ui),
      color: p.c.muted,
      baseline: 'middle',
      spacing: '0.2em',
    })
  })
}
