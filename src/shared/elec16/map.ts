/**
 * Where everything lives in the ELEC-16's 64 KB (docs/elec16.md section 3), and the models
 * that differ only in their screen (section 5). Pure data.
 */

/** RAM: 0000-7FFF. Battery-backed, so it is what a unit keeps. */
export const RAM_SIZE = 0x8000
/** Machine code from CODE or a card goes here: BASIC's program and variables stop below it. */
export const CODE_AREA = 0x7000
export const CODE_AREA_END = 0x7c00

/** The fixed ROM: 8000-BFFF, where the machine starts. */
export const ROM_FIXED = 0x8000
export const ROM_FIXED_SIZE = 0x4000
/** The bank window: C000-DFFF shows one 8 KB bank of the rest of the ROM. */
export const BANK_WINDOW = 0xc000
export const BANK_SIZE = 0x2000
export const BANK_COUNT = 12

/**
 * Extended RAM (docs/elec16-play.md section 3): 8 KB banks shown in the same window from
 * bank XRAM_BANK, only on a model that has it (PLAY-320), as much as the unit chose in TUNE.
 * Raising the most there can be is this one number: the banks it takes follow from it.
 */
export const XRAM_BANK = 0x20
export const XRAM_MAX = 512 * 1024
/** What TUNE offers, in KB; a unit made before it had one takes the most. */
export const XRAM_SIZES_KB = [0, 128, 256, 512] as const
export type XramSizeKb = (typeof XRAM_SIZES_KB)[number]
export const DEFAULT_XRAM_KB: XramSizeKb = 512
/** The longest ROM there can be: the fixed part and every bank. */
export const ROM_MAX = ROM_FIXED_SIZE + BANK_COUNT * BANK_SIZE

/** The LCD's memory: E000-F7FF, of which a model uses what its screen needs. */
export const VRAM = 0xe000
export const VRAM_WINDOW = 0x1800

/** I/O: FF00-FFFF (section 5). F800-FEFF is reserved: it reads 0 and ignores writes. */
export const IO = 0xff00

/** Where the CPU starts after a reset. */
export const RESET_VECTOR = ROM_FIXED

/** What the machine says it is, at FF00. */
export const MACHINE_ID = 0xe016

/**
 * Every model, in the order of the MODEL register's number - and the models a unit may be, as
 * TUNE offers them (all of them since PLAY-320 came, docs/elec16-play.md).
 */
export const MODEL_IDS = [
  'pocket-32',
  'pocket-48',
  'pocket-64',
  'handheld-160',
  'play-320',
] as const
export type ModelId = (typeof MODEL_IDS)[number]

export interface Model {
  id: ModelId
  width: number
  height: number
  /** Bits a dot: 1 for the pocket LCDs, 2 (four shades) for the handheld one. */
  depth: 1 | 2
  /**
   * The most extended RAM it can have, in bytes: 0 on every model but PLAY-320, whose new
   * parts are its alone (docs/elec16-play.md section 1).
   */
  xramMax: number
  /**
   * Its screen lives in a memory of its own, not in the E000 window (PLAY-320's video, G2):
   * until then the window reads 0 and ignores writes there.
   */
  video: boolean
  /**
   * The ROM it runs: the pocket ROM (BASIC and the monitor) or the PLAY ROM (the start
   * screen). A unit moved between the two starts with its RAM cleared: what one kept means
   * nothing to the other (docs/elec16-play.md section 1).
   */
  rom: 'pocket' | 'play'
  /**
   * How often its screen is drawn at most: an LCD answers in tens of milliseconds, thirty
   * times a second (measured, docs/elec16.md section 9); PLAY-320's colour screen, for
   * games, sixty (docs/elec16-play.md section 4).
   */
  drawHz: 30 | 60
  /** It has the pad of twelve buttons (PLAY-320, docs/elec16-play.md section 6). */
  pad: boolean
  /** It has a cartridge slot (PLAY-320, docs/elec16-play.md section 7). */
  cart: boolean
  /** It has the sixteen-channel sound (PLAY-320, docs/elec16-play.md section 5). */
  apu: boolean
}

export const MODELS: Readonly<Record<ModelId, Model>> = {
  'pocket-32': {
    id: 'pocket-32',
    width: 240,
    height: 32,
    depth: 1,
    xramMax: 0,
    video: false,
    rom: 'pocket',
    drawHz: 30,
    pad: false,
    cart: false,
    apu: false,
  },
  'pocket-48': {
    id: 'pocket-48',
    width: 240,
    height: 48,
    depth: 1,
    xramMax: 0,
    video: false,
    rom: 'pocket',
    drawHz: 30,
    pad: false,
    cart: false,
    apu: false,
  },
  'pocket-64': {
    id: 'pocket-64',
    width: 240,
    height: 64,
    depth: 1,
    xramMax: 0,
    video: false,
    rom: 'pocket',
    drawHz: 30,
    pad: false,
    cart: false,
    apu: false,
  },
  'handheld-160': {
    id: 'handheld-160',
    width: 160,
    height: 144,
    depth: 2,
    xramMax: 0,
    video: false,
    rom: 'pocket',
    drawHz: 30,
    pad: false,
    cart: false,
    apu: false,
  },
  'play-320': {
    id: 'play-320',
    width: 320,
    height: 288,
    depth: 2,
    xramMax: XRAM_MAX,
    video: true,
    rom: 'play',
    drawHz: 60,
    pad: true,
    cart: true,
    apu: true,
  },
}

export const DEFAULT_MODEL: ModelId = 'pocket-48'

/** The bytes of VRAM a model's screen uses: one plane per bit, a byte per 8 rows of a column. */
export const vramSize = (m: Model): number => (m.video ? 0 : (m.width * m.height * m.depth) / 8)

/** The extended RAM, in bytes, a unit's choice gives on a model: none where it has none. */
export const xramBytes = (m: Model, kb: XramSizeKb): number => Math.min(m.xramMax, kb * 1024)

/**
 * Whether the bank window can show `bank`: one of the ROM's, or of the extended RAM the
 * machine has. Any other is not taken (the window stays as it was), so a model without
 * extended RAM goes on ignoring every bank from XRAM_BANK up.
 */
export const bankTaken = (bank: number, xram: number): boolean =>
  bank < BANK_COUNT || (bank >= XRAM_BANK && bank < XRAM_BANK + xram / BANK_SIZE)

/** The clock the machine runs at by default, and the range a unit may choose from. */
export const DEFAULT_HZ = 4_000_000
export const MIN_HZ = 1_000_000
export const MAX_HZ = 32_000_000
