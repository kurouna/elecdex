import type { PadButton } from '@shared/elec16/pad'
import { BITMAP_HEIGHT, BITMAP_WIDTH } from '@shared/elec16/video'

/**
 * PLAY-320's bodies (docs/elec16-play.md section 8), as the agreed mock draws them: one
 * geometry, in units of a dot of its screen, that the pane draws and the tests hold - every
 * button inside the body, none over another or over the screen, the screen 320 x 288 in its
 * frame. The tall body has the screen on top and the buttons below it; the wide one the screen
 * in the middle and the buttons either side. The shoulder buttons L and R stand above the top.
 */

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export type BodyShape = 'tall' | 'wide'

/** What a button looks like: the d-pad's arms, round face buttons, the shoulders, the pills. */
export type ButtonShape = 'arm' | 'round' | 'shoulder' | 'pill'

export interface PlayBody {
  shape: BodyShape
  /** Everything, the shoulders too. */
  width: number
  height: number
  /** The case. */
  body: Rect
  /** The bar along its top: the name on the left, the lamp on the right. */
  bar: Rect
  /** The dark frame round the screen, and the screen in it. */
  frame: Rect
  screen: Rect
  /** The d-pad's middle, between its arms (not a button). */
  hub: Rect
  buttons: Readonly<Record<PadButton, Rect & { shape: ButtonShape }>>
  /** The speaker's slots. */
  speaker: Rect
}

const arm = (x: number, y: number, w: number, h: number) => ({ x, y, w, h, shape: 'arm' as const })
const round = (x: number, y: number) => ({ x, y, w: 44, h: 44, shape: 'round' as const })
const pill = (x: number, y: number) => ({ x, y, w: 52, h: 14, shape: 'pill' as const })
const shoulder = (x: number, y: number, w: number) => ({
  x,
  y,
  w,
  h: 28,
  shape: 'shoulder' as const,
})

/** The d-pad round a middle point: arms 34 wide and 35 long either side of a 34-dot hub. */
function dpad(cx: number, cy: number) {
  const half = 17
  return {
    hub: { x: cx - half, y: cy - half, w: 34, h: 34 },
    up: arm(cx - half, cy - half - 35, 34, 35),
    down: arm(cx - half, cy + half, 34, 35),
    left: arm(cx - half - 35, cy - half, 35, 34),
    right: arm(cx + half, cy - half, 35, 34),
  }
}

/** X above, Y left, A right, B below, round a middle point. */
function faces(cx: number, cy: number) {
  return {
    x: round(cx - 22, cy - 68),
    y: round(cx - 68, cy - 22),
    a: round(cx + 24, cy - 22),
    b: round(cx - 22, cy + 24),
  }
}

const screenIn = (frame: Rect): Rect => ({
  x: frame.x + (frame.w - BITMAP_WIDTH) / 2,
  y: frame.y + (frame.h - BITMAP_HEIGHT) / 2,
  w: BITMAP_WIDTH,
  h: BITMAP_HEIGHT,
})

const TALL_FRAME: Rect = { x: 16, y: 56, w: 352, h: 320 }
const TALL_PAD = dpad(96, 476)

export const TALL: PlayBody = {
  shape: 'tall',
  width: 384,
  height: 688,
  body: { x: 0, y: 14, w: 384, h: 674 },
  bar: { x: 20, y: 32, w: 344, h: 18 },
  frame: TALL_FRAME,
  screen: screenIn(TALL_FRAME),
  hub: TALL_PAD.hub,
  buttons: {
    up: TALL_PAD.up,
    down: TALL_PAD.down,
    left: TALL_PAD.left,
    right: TALL_PAD.right,
    ...faces(290, 476),
    l: shoulder(16, 0, 88),
    r: shoulder(280, 0, 88),
    select: pill(118, 596),
    start: pill(198, 596),
  },
  speaker: { x: 286, y: 600, w: 72, h: 56 },
}

const WIDE_FRAME: Rect = { x: 264, y: 60, w: 352, h: 320 }
const WIDE_PAD = dpad(132, 196)

export const WIDE: PlayBody = {
  shape: 'wide',
  width: 880,
  height: 432,
  body: { x: 0, y: 16, w: 880, h: 416 },
  bar: { x: 28, y: 34, w: 824, h: 18 },
  frame: WIDE_FRAME,
  screen: screenIn(WIDE_FRAME),
  hub: WIDE_PAD.hub,
  buttons: {
    up: WIDE_PAD.up,
    down: WIDE_PAD.down,
    left: WIDE_PAD.left,
    right: WIDE_PAD.right,
    ...faces(748, 196),
    l: shoulder(40, 0, 120),
    r: shoulder(720, 0, 120),
    select: pill(106, 330),
    start: pill(722, 330),
  },
  speaker: { x: 798, y: 352, w: 44, h: 36 },
}

export const BODIES: Readonly<Record<BodyShape, PlayBody>> = { tall: TALL, wide: WIDE }

/** The speaker's slots are drawn turned by this many degrees, about their middle. */
export const SPEAKER_TURN = -24

/** Where a pill's name (START, SELECT) is printed: under it, a little wider. */
export const legendOf = (r: Rect): Rect => ({ x: r.x - 8, y: r.y + r.h + 4, w: r.w + 16, h: 12 })

/** What a rectangle covers turned by `degrees` about its middle. */
export function turned(r: Rect, degrees: number): Rect {
  const a = (Math.abs(degrees) * Math.PI) / 180
  const w = r.w * Math.cos(a) + r.h * Math.sin(a)
  const h = r.w * Math.sin(a) + r.h * Math.cos(a)
  return { x: r.x + (r.w - w) / 2, y: r.y + (r.h - h) / 2, w, h }
}

/** The room a body has, in CSS pixels, and device pixels to one. */
export interface Room {
  w: number
  h: number
  ratio: number
}

/**
 * Device pixels to a unit (a dot of the screen) for the body in the room: a whole number where
 * one fits, so every dot is the same size, else as much as fits (no less than a tenth). 0 for
 * no room.
 */
export function playScale(room: Room, w: number, h: number): number {
  if (room.w <= 0 || room.h <= 0) return 0
  const most = Math.min((room.w * room.ratio) / w, (room.h * room.ratio) / h)
  return most >= 1 ? Math.floor(most) : Math.max(most, 0.1)
}

/** The body for `auto`: the one whose screen comes out larger; the tall one on a tie. */
export function bodyFor(room: Room): BodyShape {
  const exact = (b: PlayBody) => Math.min(room.w / b.width, room.h / b.height)
  return exact(WIDE) > exact(TALL) ? 'wide' : 'tall'
}

/** How the pane shows PLAY-320: a body chosen by the room, one of the two, or the screen alone. */
export const PLAY_BODY_MODES = ['auto', 'tall', 'wide', 'screen'] as const
export type PlayBodyMode = (typeof PLAY_BODY_MODES)[number]

/** The colours of the case (docs/elec16-play.md section 8: the mock's three). */
export const PLAY_SKINS = ['graphite', 'ivory', 'coral'] as const
export type PlaySkin = (typeof PLAY_SKINS)[number]

export interface PlaySkinColours {
  case: string
  edge: string
  print: string
  name: string
  lamp: string
  /** A and B, X and Y, and the d-pad, shoulders and pills: their face, shade and legend. */
  ab: readonly [string, string, string]
  xy: readonly [string, string, string]
  dark: readonly [string, string, string]
}

export const PLAY_SKIN_COLOURS: Readonly<Record<PlaySkin, PlaySkinColours>> = {
  graphite: {
    case: '#2b2f36',
    edge: '#1a1d22',
    print: '#aab2bf',
    name: '#5fd0c9',
    lamp: '#5ce08a',
    ab: ['#7fe3dc', '#22706b', '#0f2f2d'],
    xy: ['#c9ced8', '#5a606c', '#1d2027'],
    dark: ['#3b3f48', '#0e0f12', '#c9ced8'],
  },
  ivory: {
    case: '#ece5d6',
    edge: '#c9c0ad',
    print: '#5e594f',
    name: '#d9632f',
    lamp: '#2f9c55',
    ab: ['#f08a54', '#8a3612', '#fff7ef'],
    xy: ['#8c8678', '#3b372f', '#fff7ef'],
    dark: ['#3b3f48', '#0e0f12', '#e9e6df'],
  },
  coral: {
    case: '#d9605a',
    edge: '#a3443f',
    print: '#fbe3df',
    name: '#fff4ef',
    lamp: '#b6ffcb',
    ab: ['#4a505c', '#14161a', '#fbe3df'],
    xy: ['#fff1ec', '#a35650', '#5a2622'],
    dark: ['#3b3f48', '#0e0f12', '#fbe3df'],
  },
}

/** The d-pad as one cross: its arms and middle, which the raised plate under them covers. */
export const dpadCross = (b: PlayBody): Rect => ({
  x: b.buttons.left.x,
  y: b.buttons.up.y,
  w: b.buttons.left.w + b.hub.w + b.buttons.right.w,
  h: b.buttons.up.h + b.hub.h + b.buttons.down.h,
})

/** How far the d-pad's dish and a button's well reach round them, in units. */
export const DISH = 8
export const WELL = 4

/** `r` grown by `by` units each way: the recess a button sits in. */
export const recess = (r: Rect, by: number): Rect => ({
  x: r.x - by,
  y: r.y - by,
  w: r.w + by * 2,
  h: r.h + by * 2,
})
