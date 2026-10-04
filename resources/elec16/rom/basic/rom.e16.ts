// ELEC-16 BASIC (docs/elec16.md section 6): what it takes from the hand-written ROM - the
// LCD and keyboard drivers and the monitor - and the addresses it uses. Compiled by e16c into
// the ROM; see basic.e16.ts for the whole.
import type { i16, u16 } from '../../../../src/shared/e16c/builtins'

/* ---------------- the ROM's routines (lcd.s, keys.s, monitor.s, basic glue in main.s) ---------------- */

export declare function putc(c: u16): void
export declare function puts(at: u16): void
export declare function newline(): void
export declare function fresh_line(): void
export declare function cls(): void
export declare function getkey(): u16
/** The machine stack's room left, in bytes, above the code area it would run into. */
export declare function stack_room(): u16
/** The next key's character, or 0 when none waits; it never waits (INKEY$). */
export declare function pollkey(): u16
/** A line into `buf`, at most `max` characters: its length; -1 CLS, -2 BRK, -3 MODE. */
export declare function readline(buf: u16, max: u16): i16
export declare function annunciate(): void
/** Moves the cursor to a column and row (held to the screen). */
export declare function locate(column: u16, row: u16): void
/** Back to BASIC's prompt, the stack as it was there: after an error, or BREAK. */
export declare function basic_abort(): void
/** Into the machine-code monitor; it comes back with Q. */
export declare function monitor(): void
/** Calls machine code at an address (CALL). */
export declare function call_at(address: u16): void
/**
 * LINK's service 8 (link.s): the question at `query` put to service 0, the AI, of `type`;
 * the answer at `reply`, at most `max` bytes. Its length, or -STATUS when there is none.
 */
export declare function link(query: u16, reply: u16, max: u16, type: u16): i16

/* ---------------- the monitor's work area (ram.inc) ---------------- */

export const CURX = 0x00
export const CURY = 0x02
export const COLS = 0x04
export const ROWS = 0x06
/** The screen's width in dots, the bytes in one plane, and 1 or 2 bits a dot. */
export const WIDTH = 0x08
export const PLANE = 0x0a
export const DEPTH = 0x0c
export const ANNMODE = 0x1a
export const INBASIC = 0x1c
export const BRKFLAG = 0x1e

/* ---------------- the machine ---------------- */

export const IO_POWER = 0xff06
export const IO_KEY_COUNT = 0xff12
export const IO_WIDTH = 0xff20
export const IO_HEIGHT = 0xff22
export const IO_TCOUNT = 0xff30
export const IO_TCMP = 0xff32
export const IO_TCTRL = 0xff34
/** The clock: second, minute, hour, day, month, year - 2000, weekday (bytes). */
export const IO_CLOCK = 0xff38
export const IO_FREQ = 0xff40
export const IO_DUR = 0xff42
export const CARD_CMD = 0xff60
export const CARD_BLOCK = 0xff62
export const CARD_STATUS = 0xff64
/** LINK (shared/elec16/link-services.ts): CMD and the statuses ASK tells apart. */
export const LINK_CMD = 0xff70
export const LINK_FRESH = 2
export const LINK_CANCEL = 3
export const LINK_ST_OFF = 2
export const LINK_ST_HELD = 3
export const LINK_ST_BAD_REQUEST = 5
export const LINK_ST_CANCELLED = 7
export const CARD_RESULT = 0xff66
export const CARD_RESULT_HIGH = 0xff68
/** The CSR that enables the lines WFI wakes for, and the timer's bit in it. */
export const CSR_MIE = 0x304
export const MIE_TIMER = 1
/** The screen's memory, and where machine code from the card loads unless told. */
export const VRAM = 0xe000
export const CODE_AREA = 0x7000
export const CODE_AREA_END = 0x7c00
/** The cursor's look: 6 a blinking block, 0 none. */
export const IO_CURMODE = 0xff2c
export const MATH_OP = 0xff50
export const MATH_A = 0xff52
export const MATH_B = 0xff54
export const MATH_ARG = 0xff56
export const MATH_STATUS = 0xff58
export const MATH_RESULT = 0xff5a
export const MATH_ANGLE = 0xff5c

/** The annunciators (shared/elec16/state.ts ANNUNCIATORS). */
export const ANN_BUSY = 0x01
export const ANN_RUN = 0x10
export const ANN_PRO = 0x20
export const ANN_DEG = 0x80
export const ANN_RAD = 0x100
export const ANN_GRAD = 0x200
export const ANN_SOUND = 0x400

/** Where programs go: from here up to the code area (7000), variables after them. */
export const PROG = 0x0800
export const LIMIT = 0x7000

/** Characters (the ROM's key characters, keys.ts CONTROL). */
export const K_ENTER = 0x0d
export const K_BRK = 0x03
export const K_BS = 0x08
export const K_CLS = 0x0c
export const K_INS = 0x0e
export const K_ANS = 0x14
export const K_DEL = 0x0f
export const K_MODE = 0x10
export const K_LEFT = 0x1c
export const K_RIGHT = 0x1d
export const K_UP = 0x1e
export const K_DOWN = 0x1f
export const CH_SPACE = 0x20
export const CH_QUOTE = 0x22
export const CH_HASH = 0x23
export const CH_DOLLAR = 0x24
export const CH_LPAREN = 0x28
export const CH_RPAREN = 0x29
export const CH_STAR = 0x2a
export const CH_PLUS = 0x2b
export const CH_COMMA = 0x2c
export const CH_MINUS = 0x2d
export const CH_DOT = 0x2e
export const CH_SLASH = 0x2f
export const CH_0 = 0x30
export const CH_9 = 0x39
export const CH_COLON = 0x3a
export const CH_SEMI = 0x3b
export const CH_LT = 0x3c
export const CH_EQ = 0x3d
export const CH_GT = 0x3e
export const CH_QUESTION = 0x3f
export const CH_A = 0x41
export const CH_Z = 0x5a
export const CH_LBRACKET = 0x5b
export const CH_RBRACKET = 0x5d
export const CH_CARET = 0x5e
export const CH_LOWER_A = 0x61
export const CH_LOWER_Z = 0x7a
