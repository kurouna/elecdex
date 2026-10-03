/**
 * Where everything lives in the ELEC-16's 64 KB (docs/elec16.md section 3), and the models
 * that differ only in their screen (section 5). Pure data.
 */

/** RAM: 0000-7FFF. Battery-backed, so it is what a unit keeps. */
export const RAM_SIZE = 0x8000
/** Machine code from CODE or a card goes here by default; BASIC's CLEAR moves the line. */
export const CODE_AREA = 0x7000
export const CODE_AREA_END = 0x7c00

/** The fixed ROM: 8000-BFFF, where the machine starts. */
export const ROM_FIXED = 0x8000
export const ROM_FIXED_SIZE = 0x4000
/** The bank window: C000-DFFF shows one 8 KB bank of the rest of the ROM. */
export const BANK_WINDOW = 0xc000
export const BANK_SIZE = 0x2000
export const BANK_COUNT = 12
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

export const MODEL_IDS = ['pocket-32', 'pocket-48', 'pocket-64', 'handheld-160'] as const
export type ModelId = (typeof MODEL_IDS)[number]

export interface Model {
  id: ModelId
  width: number
  height: number
  /** Bits a dot: 1 for the pocket LCDs, 2 (four shades) for the handheld one. */
  depth: 1 | 2
}

export const MODELS: Readonly<Record<ModelId, Model>> = {
  'pocket-32': { id: 'pocket-32', width: 240, height: 32, depth: 1 },
  'pocket-48': { id: 'pocket-48', width: 240, height: 48, depth: 1 },
  'pocket-64': { id: 'pocket-64', width: 240, height: 64, depth: 1 },
  'handheld-160': { id: 'handheld-160', width: 160, height: 144, depth: 2 },
}

export const DEFAULT_MODEL: ModelId = 'pocket-48'

/** The bytes of VRAM a model's screen uses: one plane per bit, a byte per 8 rows of a column. */
export const vramSize = (m: Model): number => (m.width * m.height * m.depth) / 8

/** The clock the machine runs at by default, and the range a unit may choose from. */
export const DEFAULT_HZ = 4_000_000
export const MIN_HZ = 1_000_000
export const MAX_HZ = 32_000_000
