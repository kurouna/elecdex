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
  /** Mode 1's tile engine: scrolls, layers, LINE and DMA (G5). */
  tiles: TileState
}

export function createVideoState(): VideoState {
  return {
    mem: new Uint8Array(VIDEO_SIZE),
    ctrl: VCTRL_ON,
    page: 0,
    pending: false,
    frame: 0,
    fraction: 0,
    tiles: createTileState(),
  }
}

/** What a reset puts back: the display on, mode 0, page 0, VBLANK let go. The memory stays. */
export function resetVideo(v: VideoState): void {
  v.ctrl = VCTRL_ON
  v.page = 0
  v.pending = false
  resetTiles(v.tiles)
}

/** A register's value; the rest of the block reads 0. Reading has no effect. */
export function videoRead(v: VideoState, a: number, cycles = 0): number {
  switch (a) {
    case VIDEO_REG.ctrl:
      return v.ctrl
    case VIDEO_REG.page:
      return v.page
    case VIDEO_REG.stat:
      return (v.pending ? VSTAT_VBLANK : 0) | (v.tiles.linePending ? VSTAT_LINE : 0)
    case VIDEO_REG.frame:
      return v.frame
    default:
      return a >= TILE_REG.bg0x ? tileRead(v.tiles, a, cycles) : 0
  }
}

/** A register written (at `cycles`): true when what is shown may have changed. */
export function videoWrite(v: VideoState, a: number, value: number, cycles = 0): boolean {
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
      if ((value & VSTAT_LINE) !== 0) v.tiles.linePending = false
      return false
    default:
      return a >= TILE_REG.bg0x ? tileWrite(v.tiles, a, value, cycles) : false
  }
}

/**
 * Host time passes: each sixtieth of a second is a frame, and raises VBLANK; the frame's
 * lines start again from the machine's cycle count now.
 */
export function advanceVideo(v: VideoState, ms: number, cycles = 0): void {
  v.fraction += (ms * FRAME_HZ) / 1000
  const frames = Math.floor(v.fraction)
  if (frames === 0) return
  v.fraction -= frames
  v.frame = (v.frame + frames) & 0xffff
  v.pending = true
  // The new frame began part way through this step, `fraction` of a frame ago: the beam is
  // that far down it already.
  const t = v.tiles
  endFrame(t, cycles - v.fraction * t.cyclesPerLine * FRAME_LINES)
}

/** Milliseconds until the next VBLANK. */
export const msToFrame = (v: VideoState): number => ((1 - v.fraction) * 1000) / FRAME_HZ

/* ---------------- mode 1: the tile engine's registers (G5) ---------------- */

/** The tile engine's registers (docs/elec16-play.md section 4, mode 1). */
export const TILE_REG = {
  bg0x: 0xf820,
  bg0y: 0xf822,
  bg1x: 0xf824,
  bg1y: 0xf826,
  layers: 0xf828,
  lineCmp: 0xf82a,
  line: 0xf82c,
  dmaSrc: 0xf830,
  dmaDst: 0xf832,
  dmaLen: 0xf834,
  dmaCtrl: 0xf836,
} as const

/** LAYERS' bits: BG0, BG1 and the sprites shown. */
export const LAYER = { bg0: 1, bg1: 2, sprites: 4 } as const
export const LAYERS_ALL = 7

/** VSTAT's bit for LINE: set when the line LINECMP names is reached. */
export const VSTAT_LINE = 2

/** A frame's lines: 288 drawn, then VBLANK's. */
export const FRAME_LINES = 312
export const NO_LINE = 0xffff

/** Where mode 1's parts are in the video memory. */
export const TILES_AT = 0x0000
export const TILE_BYTES = 32
export const MAX_TILES = 1024
export const BG0_MAP = 0x8000
export const BG1_MAP = 0xa000
export const MAP_SIZE = 64
export const SPRITES_AT = 0xc000
export const SPRITES = 128
export const SPRITE_BYTES = 8
export const SPRITES_A_LINE = 32
/** Background tiles take palettes 0-7, sprites 8-15. */
export const SPRITE_PALETTES = 8

/** DMA: bytes moved, and the cycles they take, each step. */
export const DMA_CHUNK = 16
export const DMA_CYCLES = 8

/**
 * What a line is drawn with, of the registers a program may change between lines: the
 * scrolls (BG0 X, BG0 Y, BG1 X, BG1 Y) and LAYERS. Indexed so a write is logged by number.
 */
export interface Raster {
  scroll: [number, number, number, number]
  layers: number
}

/** A write to a raster register, at a line: from that line down it is in force. */
export interface RasterWrite {
  line: number
  /** 0-3 a scroll, 4 LAYERS. */
  which: number
  value: number
}

export interface TileState extends Raster {
  lineCmp: number
  /** LINE came and was not cleared: interrupt line 7. */
  linePending: boolean
  /**
   * LINE will not come again this frame: raised for LINECMP, or LINECMP written for a line
   * the beam had passed (or one not drawn). Writing LINECMP sets it afresh; VBLANK clears it.
   */
  lineDone: boolean
  /**
   * The beam's clock: the machine's cycles and the cycles it slept (credited from the time
   * given while asleep in WFI, so a program waiting for LINE sees the beam go on); its count
   * at the last VBLANK; and the cycles a line takes.
   */
  slept: number
  frameCycles: number
  cyclesPerLine: number
  dma: { src: number; dst: number; len: number; active: boolean }
  /** This frame: the registers it started with and what was written since, by line. */
  start: Raster
  log: RasterWrite[]
  /** The frame last finished, as the page draws it. Not kept in a snapshot. */
  last: { start: Raster; log: readonly RasterWrite[] }
}

const raster = (r: Raster): Raster => ({ scroll: [...r.scroll], layers: r.layers })

export function createTileState(): TileState {
  const start: Raster = { scroll: [0, 0, 0, 0], layers: LAYERS_ALL }
  return {
    scroll: [0, 0, 0, 0],
    layers: LAYERS_ALL,
    lineCmp: NO_LINE,
    linePending: false,
    lineDone: false,
    slept: 0,
    frameCycles: 0,
    cyclesPerLine: 4_000_000 / FRAME_HZ / FRAME_LINES,
    dma: { src: 0, dst: 0, len: 0, active: false },
    start,
    log: [],
    last: { start: raster(start), log: [] },
  }
}

/** A reset: the scrolls 0, every layer shown, no LINE, no DMA. The memory stays. */
export function resetTiles(t: TileState): void {
  t.scroll = [0, 0, 0, 0]
  t.layers = LAYERS_ALL
  t.lineCmp = NO_LINE
  t.linePending = false
  t.dma.active = false
  t.log = []
  t.start = raster(t)
}

/** The line the beam is on, by the cycles run and slept since VBLANK (0-311). */
export function lineAt(t: TileState, cycles: number): number {
  const line = Math.floor((cycles + t.slept - t.frameCycles) / t.cyclesPerLine)
  return Math.max(0, Math.min(FRAME_LINES - 1, line))
}

/** Cycles from now until the beam reaches LINECMP this frame; null when LINE will not come. */
export function cyclesToLine(t: TileState, cycles: number): number | null {
  if (t.lineDone || t.lineCmp >= BITMAP_HEIGHT) return null
  return Math.max(0, t.lineCmp * t.cyclesPerLine - (cycles + t.slept - t.frameCycles))
}

export function tileRead(t: TileState, a: number, cycles: number): number {
  switch (a) {
    case TILE_REG.bg0x:
    case TILE_REG.bg0y:
    case TILE_REG.bg1x:
    case TILE_REG.bg1y:
      return t.scroll[(a - TILE_REG.bg0x) >> 1] ?? 0
    case TILE_REG.layers:
      return t.layers
    case TILE_REG.lineCmp:
      return t.lineCmp
    case TILE_REG.line:
      return lineAt(t, cycles)
    default:
      return dmaRead(t, a)
  }
}

function dmaRead(t: TileState, a: number): number {
  switch (a) {
    case TILE_REG.dmaSrc:
      return t.dma.src
    case TILE_REG.dmaDst:
      return t.dma.dst
    case TILE_REG.dmaLen:
      return t.dma.len
    case TILE_REG.dmaCtrl:
      return t.dma.active ? 1 : 0
    default:
      return 0
  }
}

/** A tile register written at `cycles`: a raster one is logged at its line. True when shown. */
export function tileWrite(t: TileState, a: number, value: number, cycles: number): boolean {
  if (a >= TILE_REG.bg0x && a <= TILE_REG.layers) {
    const which = (a - TILE_REG.bg0x) >> 1
    const v = which === 4 ? value & LAYERS_ALL : value & 511
    if (which === 4) t.layers = v
    else t.scroll[which] = v
    t.log.push({ line: lineAt(t, cycles), which, value: v })
    return true
  }
  switch (a) {
    case TILE_REG.lineCmp:
      // A line still to come this frame raises LINE when the beam gets there - again in the
      // same frame, for a handler naming the next band; one passed waits for the next frame.
      t.lineCmp = value
      t.lineDone = value >= BITMAP_HEIGHT || lineAt(t, cycles) >= value
      return false
    case TILE_REG.dmaSrc:
      t.dma.src = value
      return false
    case TILE_REG.dmaDst:
      t.dma.dst = value
      return false
    case TILE_REG.dmaLen:
      t.dma.len = value
      return false
    case TILE_REG.dmaCtrl:
      // 1 starts it (with something to move); 0 stops it where it is.
      t.dma.active = (value & 1) !== 0 && t.dma.len > 0
      return false
    default:
      return false
  }
}

/** After an instruction: LINE raised once the beam reaches LINECMP this frame. */
export function lineStep(t: TileState, cycles: number): void {
  if (t.lineDone || t.lineCmp >= BITMAP_HEIGHT) return
  if (lineAt(t, cycles) < t.lineCmp) return
  t.lineDone = true
  t.linePending = true
}

/**
 * VBLANK: the frame just finished is the one the page draws - the registers it started with
 * and what was written in it by line - and the next starts from the registers as they are.
 */
export function endFrame(t: TileState, cycles: number): void {
  t.last = { start: t.start, log: t.log }
  t.start = raster(t)
  t.log = []
  t.lineDone = false
  t.frameCycles = cycles + t.slept
}

/** The registers in force on each line of the frame `f`: what the page draws each line with. */
export function rasterLines(f: { start: Raster; log: readonly RasterWrite[] }): Raster[] {
  const now = raster(f.start)
  const lines: Raster[] = []
  let k = 0
  for (let y = 0; y < BITMAP_HEIGHT; y++) {
    while (k < f.log.length && (f.log[k] as RasterWrite).line <= y) {
      const w = f.log[k] as RasterWrite
      if (w.which === 4) now.layers = w.value
      else now.scroll[w.which] = w.value
      k++
    }
    lines.push(raster(now))
  }
  return lines
}
