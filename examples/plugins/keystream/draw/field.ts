import type { Chart, PlayNote } from '../chart'
import { isBlack, KEYS, keyOf, NOTE_KEYS } from '../keyboard'
import type { NoteState } from '../session'
import type { Layout } from './layout'
import { alpha, clamp, font, type Paint, write } from './paint'

/**
 * The field: lanes over the keys that play them, laid out as a piano roll - the white keys'
 * lanes side by side, the black keys' narrower between - with the beat and the bar lines
 * falling at the song's pace, the judgement line, and the notes coming down to it, each a
 * key cap bearing the key to type.
 */

export interface FieldView {
  chart: Chart | null
  /** The song time the field shows. */
  time: number
  /** Milliseconds a note takes from the top of the field to the line. */
  lead: number
  state: (index: number) => NoteState
  droppedAt: (index: number) => number | undefined
  labels: Readonly<Record<string, string>>
}

const HOME = KEYS.filter((k) => k.row === 1)

/**
 * Milliseconds a note takes from the top of the field to the line, by scroll speed 1 to 10.
 * Slow enough by default (5) that notes a sixteenth apart sit close rather than fly past:
 * reading ahead matters more here than in a game of lanes, since every lane is a key to find.
 */
const LEAD_MS = [5000, 4200, 3500, 3000, 2600, 2250, 1950, 1700, 1450, 1250] as const

export const leadTime = (speed: number): number =>
  LEAD_MS[Math.min(LEAD_MS.length, Math.max(1, Math.round(speed))) - 1] ?? 2600

/** A falling note's height, in keys: low, so notes packed close still stand apart. */
export const CHIP_HEIGHT = 0.38

/** The lanes, the beat and bar lines and the judgement line: what the notes fall over. */
export function drawLanes(p: Paint, l: Layout, view: FieldView): void {
  lanes(p, l)
  if (view.chart !== null) beatLines(p, l, view.chart, view.time, view.lead)
  line(p, l, view.chart, view.time)
}

/** The notes, drawn over everything else in the field. */
export function drawNotes(p: Paint, l: Layout, view: FieldView): void {
  if (view.chart !== null) notes(p, l, view)
}

function lanes(p: Paint, l: Layout): void {
  const g = p.g
  const { field } = l
  g.fillStyle = alpha(p.c.ground, p.light ? 0.7 : 0.6)
  g.fillRect(field.x, field.y, field.w, l.line - field.y)
  // The white keys' lanes: one key wide, parted by hairlines.
  for (const key of HOME) {
    const x = l.keyX(key) - l.unit / 2
    g.fillStyle = alpha(p.c.accent, 0.028)
    g.fillRect(x + 1, field.y, l.unit - 2, l.line - field.y)
    g.fillStyle = alpha(p.c.rule, 0.35)
    g.fillRect(x, field.y, 1, l.line - field.y)
  }
  const last = HOME.at(-1)
  if (last) g.fillRect(l.keyX(last) + l.unit / 2, field.y, 1, l.line - field.y)
  // The black keys' lanes: narrower, darker, standing between.
  for (const key of NOTE_KEYS) {
    if (!isBlack(key)) continue
    const w = l.unit * 0.6
    g.fillStyle = p.light ? alpha(p.c.text, 0.035) : alpha(p.c.ground, 0.75)
    g.fillRect(l.keyX(key) - w / 2, field.y, w, l.line - field.y)
  }
  // Rails from the line down to each key that plays.
  g.fillStyle = alpha(p.c.rule, 0.4)
  for (const key of NOTE_KEYS) g.fillRect(l.keyX(key), l.line, 1, l.keyTop(key) - l.line)
}

/** Where on the field a song time is: the line at `time`, the top `lead` later. */
const yOf = (l: Layout, at: number, time: number, lead: number): number =>
  l.line - ((at - time) / lead) * (l.line - l.field.y)

function beatLines(p: Paint, l: Layout, chart: Chart, time: number, lead: number): void {
  const g = p.g
  for (const beat of chart.beats) {
    if (beat.time < time - 50) continue
    if (beat.time > time + lead) break
    const y = yOf(l, beat.time, time, lead)
    g.fillStyle = alpha(p.c.rule, beat.bar ? 0.75 : 0.28)
    g.fillRect(l.field.x, Math.round(y), l.field.w, 1)
  }
}

/** How far into the current beat the song is, 0 to 1: the line glows on the beat. */
function beatPhase(chart: Chart | null, time: number): number {
  if (chart === null || time < (chart.beats[0]?.time ?? 0)) return 1
  let lo = 0
  let hi = chart.beats.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if ((chart.beats[mid]?.time ?? 0) <= time) lo = mid
    else hi = mid - 1
  }
  const from = chart.beats[lo]?.time ?? 0
  const to = chart.beats[lo + 1]?.time ?? from + 500
  return clamp((time - from) / Math.max(1, to - from), 0, 1)
}

function line(p: Paint, l: Layout, chart: Chart | null, time: number): void {
  const g = p.g
  const pulse = p.reduced ? 0.5 : 0.35 + 0.65 * Math.exp(-beatPhase(chart, time) * 5)
  const glow = l.unit * 0.6
  const gradient = g.createLinearGradient(0, l.line - glow, 0, l.line)
  gradient.addColorStop(0, alpha(p.c.accent, 0))
  gradient.addColorStop(1, alpha(p.c.accent, (p.light ? 0.08 : 0.14) * pulse))
  g.fillStyle = gradient
  g.fillRect(l.field.x, l.line - glow, l.field.w, glow)
  g.fillStyle = p.c.accentStrong
  g.fillRect(l.field.x, l.line - 1, l.field.w, 2)
  g.fillStyle = alpha(p.c.accentStrong, 0.5 + 0.5 * pulse)
  g.fillRect(l.field.x - 4, l.line - 3, 3, 6)
  g.fillRect(l.field.x + l.field.w + 1, l.line - 3, 3, 6)
}

/** The first note at or after a time, by bisection: the notes are in order. */
function firstFrom(list: readonly PlayNote[], time: number): number {
  let lo = 0
  let hi = list.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if ((list[mid]?.time ?? 0) < time) lo = mid + 1
    else hi = mid
  }
  return lo
}

function notes(p: Paint, l: Layout, view: FieldView): void {
  const list = view.chart?.notes ?? []
  const ahead = view.time + view.lead
  const g = p.g
  // Notes stop half a key under the line: they fall into the field, not onto the keys.
  g.save()
  g.beginPath()
  g.rect(l.field.x - l.unit, l.field.y, l.field.w + l.unit * 2, l.line - l.field.y + l.unit * 0.3)
  g.clip()
  for (let i = firstFrom(list, view.time - 600); i < list.length; i++) {
    const note = list[i] as PlayNote
    if (note.time > ahead) break
    const state = view.state(i)
    if (state === 'hit') continue
    const y = yOf(l, note.time, view.time, view.lead)
    if (state === 'drop') dropped(p, l, note, y, view.time - (view.droppedAt(i) ?? view.time))
    else chip(p, l, note, y, view.labels, 1 - (note.time - view.time) / view.lead)
  }
  g.restore()
}

function chip(
  p: Paint,
  l: Layout,
  note: PlayNote,
  y: number,
  labels: Readonly<Record<string, string>>,
  near: number,
): void {
  const key = keyOf(note.code)
  if (key === undefined) return
  const black = isBlack(key)
  const w = l.unit * (black ? 0.62 : 0.8)
  const h = l.unit * CHIP_HEIGHT
  const x = l.keyX(key)
  const lit = 0.35 + 0.65 * clamp(near, 0, 1) ** 1.5
  if (near > 0.55 && !p.reduced) halo(p, x, y, w, h, (near - 0.55) / 0.45)
  if (black) blackChip(p, x, y, w, h, lit)
  else whiteChip(p, x, y, w, h, lit)
  write(p, labels[note.code] ?? key.char.toUpperCase(), x, y + 0.5, {
    font: font(700, h * 0.7, p.fonts.mono),
    color: alpha(black ? p.c.accent : p.c.accentStrong, 0.55 + 0.45 * lit),
    align: 'center',
    baseline: 'middle',
  })
}

/** A glow round a note about to land: a wider cap of faint light behind it. */
function halo(p: Paint, x: number, y: number, w: number, h: number, strength: number): void {
  const g = p.g
  const grow = 5 + 4 * strength
  g.beginPath()
  g.roundRect(x - w / 2 - grow, y - h / 2 - grow, w + grow * 2, h + grow * 2, h * 0.4)
  g.fillStyle = alpha(p.c.accent, (p.light ? 0.08 : 0.13) * strength)
  g.fill()
}

/** A white key's note: lit from within, brightest along its top edge. */
function whiteChip(p: Paint, x: number, y: number, w: number, h: number, lit: number): void {
  const g = p.g
  const top = y - h / 2
  const body = g.createLinearGradient(0, top, 0, top + h)
  body.addColorStop(0, alpha(p.c.accent, (p.light ? 0.3 : 0.5) * lit))
  body.addColorStop(1, alpha(p.c.accent, (p.light ? 0.12 : 0.18) * lit))
  g.beginPath()
  g.roundRect(x - w / 2, top, w, h, h * 0.22)
  g.fillStyle = body
  g.fill()
  g.lineWidth = 1.5
  g.strokeStyle = alpha(p.c.accentStrong, lit)
  g.stroke()
  g.fillStyle = alpha(p.c.accentStrong, 0.8 * lit)
  g.fillRect(x - w / 2 + h * 0.25, top + 2, w - h * 0.5, 1)
}

/** A black key's note: dark, as the key is, drawn in outline with a line inside. */
function blackChip(p: Paint, x: number, y: number, w: number, h: number, lit: number): void {
  const g = p.g
  g.beginPath()
  g.roundRect(x - w / 2, y - h / 2, w, h, h * 0.22)
  g.fillStyle = alpha(p.c.ground, 0.95)
  g.fill()
  g.lineWidth = 1.5
  g.strokeStyle = alpha(p.c.accent, lit)
  g.stroke()
  g.beginPath()
  g.roundRect(x - w / 2 + 3, y - h / 2 + 3, w - 6, h - 6, h * 0.14)
  g.lineWidth = 1
  g.strokeStyle = alpha(p.c.accent, 0.35 * lit)
  g.stroke()
}

/** A note let fall past the line: it goes on down in the danger colour and fades. */
function dropped(p: Paint, l: Layout, note: PlayNote, y: number, since: number): void {
  const key = keyOf(note.code)
  if (key === undefined || since > 500) return
  const g = p.g
  const w = l.unit * (isBlack(key) ? 0.62 : 0.8)
  const h = l.unit * CHIP_HEIGHT
  g.beginPath()
  g.roundRect(l.keyX(key) - w / 2, y - h / 2, w, h, h * 0.22)
  g.strokeStyle = alpha(p.c.danger, 1 - since / 500)
  g.lineWidth = 1.5
  g.stroke()
}
