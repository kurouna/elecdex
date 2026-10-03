/**
 * Where the ELEC-16's keys sit on its body (docs/elec16.md section 7), and which body the
 * pane draws for the room it has. The keys themselves - codes, engravings, characters - are
 * shared/elec16/keys.ts; this is only their places. BRK/ON has no code (it is a line of its
 * own) and is drawn here by its id.
 */

export const BRK = 'brk'

/** A key in a row: its id, and how many half-columns it takes. */
export interface KeySlot {
  id: string
  span: number
}

const keys = (ids: string, span = 2): KeySlot[] => ids.split(' ').map((id) => ({ id, span }))

/**
 * The whole keyboard, as the agreed mock lays it out: a letter block of ten columns with BRK
 * and the editing keys above it and SHIFT, CAPS, SPACE and ENTER below; a keypad of five
 * with the arrows on top.
 */
export const FULL_ROWS: readonly { left: readonly KeySlot[]; right: readonly KeySlot[] }[] = [
  {
    left: [{ id: 'brk', span: 4 }, ...keys('mode cls ans kana ins del'), { id: 'bs', span: 4 }],
    right: [
      { id: 'left', span: 3 },
      { id: 'up', span: 2 },
      { id: 'down', span: 2 },
      { id: 'right', span: 3 },
    ],
  },
  { left: keys('q w e r t y u i o p'), right: keys('7 8 9 ( )') },
  { left: keys('a s d f g h j k l ;'), right: keys('4 5 6 * kp/') },
  { left: keys('z x c v b n m , . /'), right: keys('1 2 3 + -') },
  {
    left: [
      { id: 'shift', span: 4 },
      { id: 'caps', span: 3 },
      { id: ' ', span: 8 },
      { id: 'enter', span: 5 },
    ],
    right: [
      { id: '0', span: 4 },
      { id: 'kp.', span: 3 },
      { id: '=', span: 3 },
    ],
  },
]

/** The one row a compact body keeps (the mock's): what the PC's keyboard has no plain key for. */
export const COMPACT_ROW: readonly string[] = [
  'brk',
  'mode',
  'cls',
  'shift',
  'left',
  'up',
  'down',
  'right',
  'enter',
]

/** Half-columns across: the letter block, a gap, the keypad. */
export const HALF_COLUMNS = 20 + 1 + 10

export type Body = 'full' | 'compact' | 'lcd'

/** The LCD's glass round its dots, in CSS pixels: padding, the annunciators' line, the bezel. */
export const GLASS = { pad: 8, marks: 14, gap: 4, bezel: 6 } as const
/** The glass beyond its dots, across and down. */
export const GLASS_EXTRA = {
  w: 2 * (GLASS.pad + GLASS.bezel),
  h: 2 * (GLASS.pad + GLASS.bezel) + GLASS.marks + GLASS.gap,
} as const
/** The case round the parts, in CSS pixels: its padding, the gaps, the name plate's line. */
export const CASE = { padX: 14, padTop: 10, padBottom: 14, gap: 8, plate: 26, border: 1 } as const
export const KEY_GAP = 4
/**
 * The widest the case grows, in CSS pixels: keys about as wide as a finger. Wider panes keep
 * it in the middle, as one object, rather than stretching it into a strip.
 */
export const CASE_MAX_WIDTH = 960

export interface DeviceFit {
  /** The case's width, in CSS pixels. */
  width: number
  /** Device pixels a dot. */
  scale: number
  /** The glass, dots and all, in CSS pixels. */
  glass: { w: number; h: number }
  /** A row of keys, in CSS pixels (0 for none). */
  keyRow: number
}

/**
 * The fewest device pixels a dot gets beside each body's keys: the whole keyboard only with
 * dots worth reading, a row of keys with any.
 */
const LEAST_SCALE: Record<Body, number> = { full: 2, compact: 1, lcd: 1 }
/** The lowest a row of keys goes before the body gives up keys: the smallest type still fits. */
const LEAST_KEY_ROW = 22
/** The row a compact body's keys take. */
const COMPACT_KEY_ROW = 28

const KEY_ROWS: Record<Body, number> = { full: 5, compact: 1, lcd: 0 }

/** The case's height, in CSS pixels, for its rows of keys, its glass and its name plate. */
export function caseHeight(
  body: Body,
  keyRow: number,
  glassHeight: number,
  plate: boolean,
): number {
  const rows = KEY_ROWS[body]
  const keys = rows > 0 ? rows * keyRow + (rows - 1) * KEY_GAP + CASE.gap : 0
  return (
    CASE.padTop +
    CASE.padBottom +
    2 * CASE.border +
    (plate ? CASE.plate + CASE.gap : 0) +
    glassHeight +
    keys
  )
}

/** The glass at a body's least dots, in CSS pixels. */
function leastGlass(body: Body, screen: { width: number; height: number }, ratio: number) {
  return {
    w: (screen.width * LEAST_SCALE[body]) / ratio + GLASS_EXTRA.w,
    h: (screen.height * LEAST_SCALE[body]) / ratio + GLASS_EXTRA.h,
  }
}

/**
 * The body for a room (CSS pixels, and the display's ratio), reckoned as deviceFit lays it
 * out, so the case it picks always fits: the whole keyboard only where its keys keep their
 * engravings and the LCD its least dots; a row of keys where there is height for one; else
 * the LCD alone.
 */
export function bodyFor(
  room: { w: number; h: number; ratio: number },
  screen: { width: number; height: number },
  plate: boolean,
): Body {
  const inner = Math.min(room.w, CASE_MAX_WIDTH) - 2 * (CASE.padX + CASE.border)
  const fits = (body: Body, keyRow: number): boolean => {
    const glass = leastGlass(body, screen, room.ratio)
    return inner >= glass.w && room.h >= caseHeight(body, keyRow, glass.h, plate)
  }
  if (room.w >= 15 * 30 && fits('full', LEAST_KEY_ROW)) return 'full'
  if (fits('compact', COMPACT_KEY_ROW)) return 'compact'
  return 'lcd'
}

/**
 * How the parts fit a room (CSS pixels, and the display's ratio): keys as high as their width
 * suits a finger, lowered first where the height is short so the LCD keeps its least dots, the
 * dots at the most whole device pixels the rest leaves, and the case as high as its parts -
 * never stretched, so in a tall pane it stays one body, the room left over above and below.
 */
export function deviceFit(
  room: { w: number; h: number; ratio: number },
  screen: { width: number; height: number },
  body: Body,
  plate: boolean,
): DeviceFit {
  const width = Math.min(room.w, CASE_MAX_WIDTH)
  const inner = width - 2 * (CASE.padX + CASE.border)
  const rows = KEY_ROWS[body]
  const byWidth =
    body === 'full'
      ? Math.max(LEAST_KEY_ROW, Math.min(36, Math.round((inner / HALF_COLUMNS) * 2 * 0.62)))
      : COMPACT_KEY_ROW
  const byRoom =
    rows > 0
      ? Math.floor(
          (room.h - caseHeight(body, 0, leastGlass(body, screen, room.ratio).h, plate)) / rows,
        )
      : 0
  const keyRow = rows > 0 ? Math.max(LEAST_KEY_ROW, Math.min(byWidth, byRoom)) : 0
  const glassRoom = room.h - caseHeight(body, keyRow, GLASS_EXTRA.h, plate)
  const scale = Math.max(
    1,
    Math.min(
      Math.floor(((inner - GLASS_EXTRA.w) * room.ratio) / screen.width),
      Math.floor((glassRoom * room.ratio) / screen.height),
    ),
  )
  return {
    width,
    scale,
    glass: {
      w: (screen.width * scale) / room.ratio + GLASS_EXTRA.w,
      h: (screen.height * scale) / room.ratio + GLASS_EXTRA.h,
    },
    keyRow,
  }
}
