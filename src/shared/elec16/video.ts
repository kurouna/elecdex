/**
 * PLAY-320's video (docs/elec16-play.md section 4): 64 KB of video memory of its own, seen 4 KB
 * at a time in the E000 window (VPAGE), and its registers at F800. Mode 0 is a bitmap of
 * 320x288 dots, two bits a dot, coloured by palette 0; VBLANK comes sixty times a second of
 * the time the page gives, on interrupt line 5. Only a model with `video` has any of it: on
 * every other the block reads 0 and ignores writes, as it always has.
 *
 * Pure data and arithmetic, like the other devices: the page draws from the memory.
 */

/** The registers, by address. */
export const VIDEO_REG = {
  ctrl: 0xf800,
  page: 0xf802,
  stat: 0xf804,
  frame: 0xf806,
} as const

/** The block the registers live in: the rest of it reads 0. */
export const VIDEO_IO = 0xf800
export const VIDEO_IO_END = 0xf900

export const VIDEO_SIZE = 0x10000
/** The window at E000 shows one page of the video memory. */
export const VIDEO_PAGE_SIZE = 0x1000
export const VIDEO_PAGES = VIDEO_SIZE / VIDEO_PAGE_SIZE

/** VCTRL: the display's switch, and the mode in bits 1-2. */
export const VCTRL_ON = 1
export const VCTRL_MODE_SHIFT = 1
export const VCTRL_MASK = 7
export const VIDEO_MODE = { bitmap: 0, tiles: 1 } as const

/** VSTAT's bit for VBLANK: set by the frame, cleared by writing it as 1. */
export const VSTAT_VBLANK = 1

/** Frames a second. */
export const FRAME_HZ = 60

/** Mode 0: 320x288 dots, 80 bytes a row, four dots a byte with the leftmost in bits 7-6. */
export const BITMAP_WIDTH = 320
export const BITMAP_HEIGHT = 288
export const BITMAP_ROW = BITMAP_WIDTH / 4
export const BITMAP_SIZE = BITMAP_ROW * BITMAP_HEIGHT

/** Where the palettes are: 16 of 16 colours, each two bytes of RGB555. Mode 0 uses palette 0. */
export const PALETTE_AT = 0xc400
export const PALETTE_SIZE = 16 * 16 * 2

export interface VideoState {
  mem: Uint8Array
  ctrl: number
  page: number
  /** VBLANK came and was not yet cleared: interrupt line 5 is up. */
  pending: boolean
  /** VBLANKs since the machine started, as FRAME reads them (16 bits). */
  frame: number
  /** The part of a frame that has passed. */
  fraction: number
}

export function createVideoState(): VideoState {
  return {
    mem: new Uint8Array(VIDEO_SIZE),
    ctrl: VCTRL_ON,
    page: 0,
    pending: false,
    frame: 0,
    fraction: 0,
  }
}

/** What a reset puts back: the display on, mode 0, page 0, VBLANK let go. The memory stays. */
export function resetVideo(v: VideoState): void {
  v.ctrl = VCTRL_ON
  v.page = 0
  v.pending = false
}

/** A register's value; the rest of the block reads 0. Reading has no effect. */
export function videoRead(v: VideoState, a: number): number {
  switch (a) {
    case VIDEO_REG.ctrl:
      return v.ctrl
    case VIDEO_REG.page:
      return v.page
    case VIDEO_REG.stat:
      return v.pending ? VSTAT_VBLANK : 0
    case VIDEO_REG.frame:
      return v.frame
    default:
      return 0
  }
}

/** A register written: true when what is shown may have changed. */
export function videoWrite(v: VideoState, a: number, value: number): boolean {
  switch (a) {
    case VIDEO_REG.ctrl: {
      const ctrl = value & VCTRL_MASK
      if (ctrl === v.ctrl) return false
      v.ctrl = ctrl
      return true
    }
    case VIDEO_REG.page:
      v.page = value & (VIDEO_PAGES - 1)
      return false
    case VIDEO_REG.stat:
      if ((value & VSTAT_VBLANK) !== 0) v.pending = false
      return false
    default:
      return false
  }
}

/** Host time passes: each sixtieth of a second is a frame, and raises VBLANK. */
export function advanceVideo(v: VideoState, ms: number): void {
  v.fraction += (ms * FRAME_HZ) / 1000
  const frames = Math.floor(v.fraction)
  if (frames === 0) return
  v.fraction -= frames
  v.frame = (v.frame + frames) & 0xffff
  v.pending = true
}

/** Milliseconds until the next VBLANK. */
export const msToFrame = (v: VideoState): number => ((1 - v.fraction) * 1000) / FRAME_HZ
