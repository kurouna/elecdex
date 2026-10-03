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

/** The whole keyboard: a letter block of ten columns and a keypad of five, row by row. */
export const FULL_ROWS: readonly { left: readonly KeySlot[]; right: readonly KeySlot[] }[] = [
  {
    left: [...keys('brk mode ans cls caps kana ins del'), { id: 'bs', span: 4 }],
    right: [],
  },
  { left: keys('q w e r t y u i o p'), right: keys('7 8 9 ( )') },
  { left: keys('a s d f g h j k l ;'), right: keys('4 5 6 * kp/') },
  { left: keys('z x c v b n m , . /'), right: keys('1 2 3 + -') },
  {
    left: [{ id: 'shift', span: 3 }, { id: ' ', span: 9 }, ...keys('left up down right')],
    right: [...keys('0 kp. ='), { id: 'enter', span: 4 }],
  },
]

/** The one row a compact body keeps: what the PC's keyboard has no plain key for. */
export const COMPACT_ROW: readonly string[] = [
  'brk',
  'mode',
  'cls',
  'caps',
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
