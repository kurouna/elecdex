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

/* ---------------- the monitor's work area (ram.inc) ---------------- */

export const CURX = 0x00
export const CURY = 0x02
export const COLS = 0x04
export const ROWS = 0x06
export const FLAGS = 0x0e
export const ANNMODE = 0x1a
export const INBASIC = 0x1c
export const BRKFLAG = 0x1e

/* ---------------- the machine ---------------- */

export const IO_ANNUN = 0xff2e
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
export const ANN_MON = 0x40
export const ANN_DEG = 0x80
export const ANN_RAD = 0x100
export const ANN_GRAD = 0x200

/** Where programs go: from here up to the code area (7000), variables after them. */
export const PROG = 0x0800
export const LIMIT = 0x7000

/** Characters (the ROM's key characters, keys.ts CONTROL). */
export const K_ENTER = 0x0d
export const K_BRK = 0x03
export const K_BS = 0x08
export const K_CLS = 0x0c
export const K_INS = 0x0e
export const K_DEL = 0x0f
export const K_MODE = 0x10
export const K_LEFT = 0x1c
export const K_RIGHT = 0x1d
export const K_UP = 0x1e
export const K_DOWN = 0x1f
export const CH_SPACE = 0x20
export const CH_QUOTE = 0x22
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
export const CH_CARET = 0x5e
export const CH_LOWER_A = 0x61
export const CH_LOWER_Z = 0x7a
