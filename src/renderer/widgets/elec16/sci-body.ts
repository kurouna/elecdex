/**
 * SCI-128's body (docs/elec16-sci.md section 8.2, the agreed mock in docs/elec16-sci-mock): one
 * geometry, in dots of the LCD, as play-body.ts is PLAY-320's. The glass is the LCD component's
 * (Lcd.svelte), its dots at a whole number of device pixels and its frame in CSS pixels
 * (layout.ts GLASS), so the body is laid out round it: the plate above in dots, the glass at
 * the size it comes to, the keys below in dots - every part scaled together, never stretched.
 *
 * Three ways to show it, as the pocket models have (BodyMode): the whole body; COMPACT, the
 * glass and a row of keys (the arrows, AC and =) with the PC's keys for the rest; LCD, the
 * glass alone.
 */

import { MODELS } from '@shared/elec16/map'
import type { Room } from '../emu/screen.js'
import { GLASS_EXTRA } from './layout.js'
import type { BodyMode } from './pane-state.js'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

const SCREEN = { w: MODELS['sci-128'].width, h: MODELS['sci-128'].height }

/** The body's width in dots, and where its keys stand in it. */
const BODY_WIDTH = 156
const KEYS_X = 8
const KEYS_WIDTH = 140
/** The plate (name and solar strip) above the glass, and the room round the glass. */
const PLATE = { top: 4, h: 14 }
const GLASS_TOP = 21
const GLASS_TO_KEYS = 6
const BOTTOM = 8

/** The keys on the body: where each is in the grid of its block. ON is a key here too. */
export type SciPlaceBlock = 'top' | 'fn' | 'num' | 'compact'

export interface SciPlace {
  /** A key's id (shared/elec16/sci-keys.ts), or `on`. */
  id: string
  block: SciPlaceBlock
  /** The key's face, and the band above it its SHIFT and ALPHA faces are printed in. */
  key: Rect
  legend: Rect
}

/** The top two rows: six columns, the pad over the middle two. */
const TOP_ROWS: readonly (readonly (string | null)[])[] = [
  ['shift', 'alpha', null, null, 'menu', 'on'],
  ['setup', 'func', null, null, 'sto', 'fd'],
]
const FN_ROWS: readonly (readonly string[])[] = [
  ['frac', 'sq', 'cube', 'pow', 'log', 'ln'],
  ['neg', 'dms', 'hyp', 'sin', 'cos', 'tan'],
  ['fx', 'inv', 'ncr', 'lp', 'rp', 'mplus'],
]
const NUM_ROWS: readonly (readonly string[])[] = [
  ['7', '8', '9', 'del', 'ac'],
  ['4', '5', '6', 'mul', 'div'],
  ['1', '2', '3', 'add', 'sub'],
  ['0', 'dot', 'exp', 'ans', 'eq'],
]
/** COMPACT's one row: the arrows, AC and =. */
const COMPACT_ROW: readonly string[] = ['left', 'up', 'down', 'right', 'ac', 'eq']

/** Rows of the grids, in dots from the top of the keys: the legend band, then the key. */
const LEGEND = 4
const TOP = { colW: 20, gap: 4, keyH: 7, pitch: 14 }
const FN = { top: 30, colW: 20, gap: 4, keyH: 9, pitch: 15 }
/** The seam between the function keys and the number keys. */
export const SEAM_Y = 78
const NUM = { top: 82, colW: 24, gap: 5, keyH: 12, pitch: 18 }
const KEYS_HEIGHT = NUM.top + 3 * NUM.pitch + LEGEND + NUM.keyH
/** The cursor pad over the top grid's middle columns, both rows. */
const PAD: Rect = { x: 2 * (TOP.colW + TOP.gap), y: 1, w: 2 * TOP.colW + TOP.gap, h: 25 }

function grid(
  rows: readonly (readonly (string | null)[])[],
  g: { top?: number; colW: number; gap: number; keyH: number; pitch: number },
  block: SciPlaceBlock,
): SciPlace[] {
  const out: SciPlace[] = []
  rows.forEach((row, r) => {
    row.forEach((id, c) => {
      if (id === null) return
      const x = c * (g.colW + g.gap)
      const y = (g.top ?? 0) + r * g.pitch
      out.push({
        id,
        block,
        legend: { x, y, w: g.colW, h: LEGEND },
        key: { x, y: y + LEGEND, w: g.colW, h: g.keyH },
      })
    })
  })
  return out
}

/** Every key of the whole body, in dots from the keys' top left. */
export const FULL_PLACES: readonly SciPlace[] = [
  ...grid(TOP_ROWS, TOP, 'top'),
  ...grid(FN_ROWS, FN, 'fn'),
  ...grid(NUM_ROWS, NUM, 'num'),
]
export const COMPACT_PLACES: readonly SciPlace[] = grid([COMPACT_ROW], TOP, 'compact').map((p) => ({
  ...p,
  legend: { ...p.legend, h: 0 },
  key: { ...p.key, y: 0, h: 9 },
}))

/** The body as laid out at one scale, in CSS pixels. */
export interface SciLayout {
  mode: Exclude<BodyMode, 'auto'>
  width: number
  height: number
  /** Device pixels a dot of the LCD (Lcd.svelte's `scale`). */
  scale: number
  /** CSS pixels a dot of the body's geometry. */
  unit: number
  plate: Rect | null
  /** The glass, as the LCD component takes it: its dots and its frame. */
  glass: Rect
  pad: Rect | null
  seam: number | null
  keys: readonly (SciPlace & { at: Rect; over: Rect })[]
}

/** The body at `scale` device pixels a dot on a screen of `ratio`. */
export function sciLayout(
  mode: Exclude<BodyMode, 'auto'>,
  scale: number,
  ratio: number,
): SciLayout {
  const unit = scale / ratio
  const glass = {
    w: (SCREEN.w * scale) / ratio + GLASS_EXTRA.w,
    h: (SCREEN.h * scale) / ratio + GLASS_EXTRA.h,
  }
  if (mode === 'lcd') {
    return {
      mode,
      width: glass.w,
      height: glass.h,
      scale,
      unit,
      plate: null,
      glass: { x: 0, y: 0, ...glass },
      pad: null,
      seam: null,
      keys: [],
    }
  }
  // The body is as wide as its plan, or as the glass and a margin where the glass is wider
  // (its frame is in CSS pixels, so at one device pixel a dot it is wider than the plan).
  const width = Math.max(BODY_WIDTH * unit, glass.w + 2 * KEYS_X * unit)
  const keysX = (width - KEYS_WIDTH * unit) / 2
  const glassRect = {
    x: (width - glass.w) / 2,
    y: (mode === 'full' ? GLASS_TOP : 4) * unit,
    ...glass,
  }
  const keysY = glassRect.y + glass.h + GLASS_TO_KEYS * unit
  const places = mode === 'full' ? FULL_PLACES : COMPACT_PLACES
  const toCss = (r: Rect): Rect => ({
    x: keysX + r.x * unit,
    y: keysY + r.y * unit,
    w: r.w * unit,
    h: r.h * unit,
  })
  const keysHeight = mode === 'full' ? KEYS_HEIGHT : 9
  return {
    mode,
    width,
    height: keysY + (keysHeight + BOTTOM) * unit,
    scale,
    unit,
    plate:
      mode === 'full'
        ? { x: KEYS_X * unit, y: PLATE.top * unit, w: width - 2 * KEYS_X * unit, h: PLATE.h * unit }
        : null,
    glass: glassRect,
    pad: mode === 'full' ? toCss(PAD) : null,
    seam: mode === 'full' ? keysY + SEAM_Y * unit : null,
    keys: places.map((p) => ({ ...p, at: toCss(p.key), over: toCss(p.legend) })),
  }
}

/** At least this many device pixels a dot for the body; below it the LCD alone is shown. */
const LEAST_SCALE = 2

/**
 * The body for the room and the mode asked for, at the largest whole number of device pixels
 * a dot it fits at. `auto` takes the whole body where it fits at two or more, then COMPACT,
 * then the LCD alone; the LCD alone fits at whatever it can, below one a dot if it must.
 */
export function sciFit(room: Room, mode: BodyMode): SciLayout | null {
  if (room.w <= 0 || room.h <= 0) return null
  const fits = (l: SciLayout) => l.width <= room.w && l.height <= room.h
  const largest = (m: Exclude<BodyMode, 'auto'>, least: number): SciLayout | null => {
    for (let s = 12; s >= least; s--) {
      const l = sciLayout(m, s, room.ratio)
      if (fits(l)) return l
    }
    return null
  }
  if (mode === 'auto') {
    return (
      largest('full', LEAST_SCALE) ??
      largest('compact', LEAST_SCALE) ??
      largest('lcd', 1) ??
      sciLayout('lcd', smallest(room), room.ratio)
    )
  }
  return largest(mode, 1) ?? sciLayout(mode, smallest(room), room.ratio)
}

/** Less than a device pixel a dot, as much as the room has (no less than a tenth). */
function smallest(room: Room): number {
  const w = (room.w - GLASS_EXTRA.w) * room.ratio
  const h = (room.h - GLASS_EXTRA.h) * room.ratio
  return Math.max(0.1, Math.min(w / SCREEN.w, h / SCREEN.h))
}

/* ---------------- printing ---------------- */

/** A piece of a key's print: raised (an exponent), set in the mono face (the prime marks), or neither. */
export interface FaceRun {
  text: string
  sup: boolean
  mono: boolean
}

/** Characters the UI face lacks, printed another way: as a raised letter, or in the mono face. */
const RAISED: Readonly<Record<string, string>> = { ˣ: 'x', ʸ: 'y', '⁻¹': '-1' }
const MONO = /[°′″]/

/**
 * What is printed on or above a key, in runs: modifier letters (ˣ, ʸ, ⁻¹) raised from plain
 * letters, ∛ as a raised 3 before √, and degrees, minutes and seconds in the mono face - the
 * keys' face (Saira) has none of those, and the system's would differ from key to key, as the
 * pocket's arrows did (Keyboard.svelte).
 */
export function faceRuns(text: string): FaceRun[] {
  const runs: FaceRun[] = []
  const push = (t: string, sup: boolean, mono: boolean) => {
    const last = runs[runs.length - 1]
    if (last !== undefined && last.sup === sup && last.mono === mono) last.text += t
    else runs.push({ text: t, sup, mono })
  }
  const chars = [...text]
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i] ?? ''
    const pair = ch + (chars[i + 1] ?? '')
    if (RAISED[pair] !== undefined) {
      push(RAISED[pair], true, false)
      i++
    } else if (ch === '∛') {
      push('3', true, false)
      push('√', false, false)
    } else if (RAISED[ch] !== undefined) push(RAISED[ch], true, false)
    else push(ch, false, MONO.test(ch))
  }
  return runs
}

/* ---------------- colours ---------------- */

/** The calculator's colours (docs/elec16-sci.md section 8.2): two cases and elecdex's own. */
export const SCI_SKINS = ['slate', 'chalk', 'plain'] as const
export type SciSkin = (typeof SCI_SKINS)[number]

/** The LCD's colours, as CSS colours (§4.1's table); PLAIN's are the theme's, as the pocket PLAIN. */
export interface SciLcd {
  ground: string
  dot: string
  shadow: string
  flat: boolean
  unlit: number
  glare: number
}

export interface SciSkinColours {
  /** The case: its fill (a CSS image), lit edge, shaded edge, the print and the name. */
  case: string
  caseHi: string
  caseLo: string
  print: string
  plate: string
  seam: string
  bezel: string
  solar: string
  /** The function keys and the number keys: face, lit edge, side, legend. */
  fn: readonly [string, string, string, string]
  num: readonly [string, string, string, string]
  /** SHIFT's and ALPHA's colour (their keys and their faces' print), DEL and AC, and =. */
  shift: string
  onShift: string
  shiftPrint: string
  alpha: string
  onAlpha: string
  alphaPrint: string
  warm: string
  eq: string
  onEq: string
  lcd: SciLcd
}

/*
 * Small print on a case is 4.5:1 or more on it (docs/elec16-sci.md section 8.2): on CHALK the
 * faces' print is darker than the keys of the same colour.
 */
export const SCI_SKIN_COLOURS: Readonly<Record<SciSkin, SciSkinColours>> = {
  slate: {
    case: 'linear-gradient(180deg, #34383f, #272a30 55%, #212429)',
    caseHi: 'rgb(255 255 255 / 0.12)',
    caseLo: 'rgb(0 0 0 / 0.5)',
    print: '#a9adb4',
    plate: '#e9eaec',
    seam: 'rgb(0 0 0 / 0.45)',
    bezel: '#16181c',
    solar: 'linear-gradient(180deg, #4b362e, #3a2a24)',
    fn: ['#1c1e22', 'rgb(255 255 255 / 0.10)', '#0c0d0f', '#eceef1'],
    num: ['#d8dbdf', 'rgb(255 255 255 / 0.85)', '#8e9399', '#1d1f23'],
    shift: '#f0a240',
    onShift: '#20160a',
    shiftPrint: '#f0a240',
    alpha: '#5cc6d0',
    onAlpha: '#0b2226',
    alphaPrint: '#5cc6d0',
    warm: '#d9573a',
    eq: '#3d434b',
    onEq: '#ffffff',
    lcd: {
      ground: '#c4cbb9',
      dot: '#161b14',
      shadow: '#a3ab98',
      flat: false,
      unlit: 0.03,
      glare: 0.1,
    },
  },
  chalk: {
    case: 'linear-gradient(180deg, #f1ede5, #e6e0d4 60%, #ddd6c8)',
    caseHi: 'rgb(255 255 255 / 0.9)',
    caseLo: 'rgb(120 100 70 / 0.35)',
    print: '#565a61',
    plate: '#2d3138',
    seam: 'rgb(120 100 70 / 0.3)',
    bezel: '#3a3e45',
    solar: 'linear-gradient(180deg, #43332d, #2f2522)',
    fn: ['#444a53', 'rgb(255 255 255 / 0.18)', '#23272c', '#f4f5f7'],
    num: ['#fbfaf6', '#ffffff', '#b9b3a6', '#24272c'],
    shift: '#a9520c',
    onShift: '#ffffff',
    shiftPrint: '#8f4408',
    alpha: '#136579',
    onAlpha: '#ffffff',
    alphaPrint: '#126377',
    warm: '#cf4a33',
    eq: '#2b5f8a',
    onEq: '#ffffff',
    lcd: {
      ground: '#cfd3c5',
      dot: '#191c17',
      shadow: '#aeb2a3',
      flat: false,
      unlit: 0.03,
      glare: 0.14,
    },
  },
  plain: {
    case: 'transparent',
    caseHi: 'transparent',
    caseLo: 'transparent',
    print: 'var(--text-muted)',
    plate: 'var(--accent)',
    seam: 'var(--panel-rule)',
    bezel: 'transparent',
    solar: 'transparent',
    fn: ['transparent', 'transparent', 'transparent', 'var(--accent)'],
    num: ['var(--surface-1)', 'transparent', 'transparent', 'var(--text)'],
    shift: 'var(--warn)',
    onShift: 'var(--surface-0)',
    shiftPrint: 'var(--warn)',
    alpha: 'var(--accent)',
    onAlpha: 'var(--surface-0)',
    alphaPrint: 'var(--accent)',
    warm: 'var(--danger)',
    eq: 'var(--surface-2)',
    onEq: 'var(--text)',
    lcd: {
      ground: 'var(--surface-1)',
      dot: 'var(--accent)',
      shadow: 'var(--surface-1)',
      flat: true,
      unlit: 0,
      glare: 0,
    },
  },
}
