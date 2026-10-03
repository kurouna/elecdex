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

/**
 * The body for a room in CSS pixels: the whole keyboard only where its keys keep their
 * engravings at the smallest type size and the LCD still gets its least size (`lcd`, in CSS
 * pixels: two device pixels a dot); a row of keys where there is height for one under the
 * LCD; else the LCD alone.
 */
export function bodyFor(room: { w: number; h: number }, lcd: { w: number; h: number }): Body {
  const keyRow = 24
  const lcdRoom = lcd.h + 40
  if (room.w >= Math.max(15 * 30, lcd.w + 40) && room.h >= lcdRoom + 5 * keyRow + 40) return 'full'
  if (room.h >= lcdRoom + keyRow + 16) return 'compact'
  return 'lcd'
}

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
 * How the parts fit a room (CSS pixels, and the display's ratio): keys as high as their width
 * suits a finger, the dots at the most whole device pixels the rest leaves, and the case as
 * high as its parts - never stretched, so in a tall pane it stays one body, the room left
 * over above and below it.
 */
export function deviceFit(
  room: { w: number; h: number; ratio: number },
  screen: { width: number; height: number },
  body: Body,
  plate: boolean,
): DeviceFit {
  const width = Math.min(room.w, CASE_MAX_WIDTH)
  const inner = width - 2 * (CASE.padX + CASE.border)
  const rows = body === 'full' ? 5 : body === 'compact' ? 1 : 0
  const keyRow =
    body === 'full'
      ? Math.max(22, Math.min(36, Math.round((inner / HALF_COLUMNS) * 2 * 0.62)))
      : body === 'compact'
        ? 28
        : 0
  const keys = rows * keyRow + Math.max(0, rows - 1) * KEY_GAP
  const fixed =
    CASE.padTop +
    CASE.padBottom +
    2 * CASE.border +
    (plate ? CASE.plate + CASE.gap : 0) +
    (rows > 0 ? keys + CASE.gap : 0)
  const byWidth = Math.floor(((inner - GLASS_EXTRA.w) * room.ratio) / screen.width)
  const byHeight = Math.floor(((room.h - fixed - GLASS_EXTRA.h) * room.ratio) / screen.height)
  const scale = Math.max(1, Math.min(byWidth, byHeight))
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
