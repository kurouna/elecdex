// The game kit's library for PLAY-320 (docs/elec16-play.md section 10): banks, video memory,
// DMA, palettes, backgrounds, sprites, the pad, numbers on the screen, the score, save RAM,
// sines, aiming and chance. Copied into RAM with the game's code by the kit's builder; its
// names share the game's one namespace, so a game does not use them for its own.
import {
  addr,
  type bool,
  div,
  i16,
  mulShift,
  peek,
  peek16,
  poke16,
  u16,
  words,
  wrap16,
} from '../../../../src/shared/e16c/builtins'
import { KIT_ATAN_AT, KIT_SIN_AT, KIT_TABLES_BANK, PALETTES_AT, PALETTES_BANK } from './kit-assets'

/* ---------------- the runtime (runtime.s) ---------------- */

/** Sleeps until the frame count is not `seen`; answers the count. */
export declare function frame_wait(seen: u16): u16
/**
 * LINE steps BG0X through `RASTER` every 8 lines from the next frame (1); or does so down to
 * the line `raster_lines` names and then writes BG0X every line from the game's table (2); or
 * stops (0).
 */
export declare function raster(on: u16): void
/**
 * `raster(2)`'s lines: BG0X from the word at `table` on line `from` (8 to 287) and from the
 * next word each line down to `to` (`from` to 287). `table` is the game's (`words(n)`); given
 * before `from` comes, it is drawn from this frame.
 */
export declare function raster_lines(table: u16, from: u16, to: u16): void

/** BG0X for each band of 8 lines, while `raster(1)` (and above the lines, `raster(2)`). */
export const RASTER = 0x0210
export const RASTER_BANDS = 36

/* ---------------- the machine ---------------- */

export const IO_BANK = 0xff04
export const WINDOW = 0xc000
export const VCTRL = 0xf800
export const VPAGE = 0xf802
export const VWIN = 0xe000
export const PAD = 0xf810
export const PADHIT = 0xf812
export const BG0X = 0xf820
export const BG0Y = 0xf822
export const BG1X = 0xf824
export const BG1Y = 0xf826
export const LAYERS = 0xf828
export const DMASRC = 0xf830
export const DMADST = 0xf832
export const DMALEN = 0xf834
export const DMACTRL = 0xf836
/** Video memory: the two maps, the sprite table and the palettes. */
export const MAP0 = 0x8000
export const MAP1 = 0xa000
export const OAM = 0xc000
export const PALS = 0xc400
/** A cartridge's save RAM, bank 0x80 in the window: a word's offset within its 8 KB. */
export const SAVE_BANK = 0x80
const SAVE_MASK = 0x1ffe

/** The buttons: PAD's bits. */
export const B_UP = 1
export const B_DOWN = 2
export const B_LEFT = 4
export const B_RIGHT = 8
export const B_A = 16
export const B_B = 32
export const B_X = 64
export const B_Y = 128
export const B_L = 256
export const B_R = 512
export const B_START = 1024
export const B_SELECT = 2048

/** A sprite's size word: 8, 16 or 32 points square, or none drawn. */
export const S8 = 0
export const S16 = 1
export const S32 = 2
export const S_NONE = 3
/** In a tile word: the palette (bits 10-12; a sprite's 0-7 are slots 8-15), flips, behind / in front. */
export const FLIP_H = 0x2000
export const FLIP_V = 0x4000
export const BEHIND = 0x8000

/* ---------------- banks and video memory ---------------- */

/** The window shows bank `b`; answers the one it showed. */
export function bank(b: u16): u16 {
  const old = peek16(IO_BANK)
  poke16(IO_BANK, b)
  return old
}

/** A word of video memory through its window. */
export function vpoke(at: u16, v: u16): void {
  poke16(VPAGE, at >> 12)
  poke16(VWIN + (at & 0xfff), v)
}

/** `n` words of video memory from `at` set to `v` (a page at a time through the window). */
export function vfill(at: u16, v: u16, n: u16): void {
  while (n > 0) {
    poke16(VPAGE, at >> 12)
    let p = VWIN + (at & 0xfff)
    let k = div(0x1000 - (at & 0xfff), 2)
    if (k > n) k = n
    n = wrap16(n - k)
    at = wrap16(at + k * 2)
    while (k > 0) {
      poke16(p, v)
      p = wrap16(p + 2)
      k--
    }
  }
}

/** DMA: `len` bytes from the CPU's `src` to video memory's `dst`. The CPU waits for it. */
export function dma(src: u16, dst: u16, len: u16): void {
  poke16(DMASRC, src)
  poke16(DMADST, dst)
  poke16(DMALEN, len)
  poke16(DMACTRL, 1)
}

/**
 * `len` bytes of a cartridge's data at `src` in bank `b` into video memory at `dst`: a bank
 * at a time when it runs on past one. The window is put back.
 */
export function load(b: u16, src: u16, dst: u16, len: u16): void {
  const old = bank(b)
  while (len > 0) {
    let n = wrap16(0xe000 - src)
    if (n > len) n = len
    dma(src, dst, n)
    len = wrap16(len - n)
    dst = wrap16(dst + n)
    b++
    poke16(IO_BANK, b)
    src = WINDOW
  }
  poke16(IO_BANK, old)
}

/** Palette `row` of the game's palette picture into slot `slot` (0-7 backgrounds, 8-15 sprites). */
export function palette(row: u16, slot: u16): void {
  load(PALETTES_BANK, PALETTES_AT + row * 32, PALS + slot * 32, 32)
}

/** One colour of a slot, RGB555. */
export function colour(slot: u16, k: u16, rgb: u16): void {
  vpoke(PALS + slot * 32 + k * 2, rgb)
}

/** A copy of the palettes as loaded, to flash or fade from (16 slots of 16). */
export const palCopy = words(256)

/** Remembers slot `slot` as it is now in `palCopy` (call after `palette`). */
export function palKeep(row: u16, slot: u16): void {
  const old = bank(PALETTES_BANK)
  let k: u16 = 0
  while (k < 16) {
    palCopy[slot * 16 + k] = peek16(PALETTES_AT + row * 32 + k * 2)
    k++
  }
  poke16(IO_BANK, old)
}

/**
 * Slot `slot` mixed from its kept colours towards `rgb` by `t` sixteenths (0 none, 16 all): as
 * `mix` does each colour, `rgb`'s part of it worked out once for the fifteen.
 */
export function palMix(slot: u16, rgb: u16, t: u16): void {
  const u = 16 - t
  const r = (rgb & 31) * t
  const g = ((rgb >> 5) & 31) * t
  const b = ((rgb >> 10) & 31) * t
  poke16(VPAGE, (PALS + slot * 32) >> 12)
  let p = VWIN + ((PALS + slot * 32 + 2) & 0xfff)
  let k = slot * 16 + 1
  const end = slot * 16 + 16
  while (k < end) {
    const c = palCopy[k]
    const mr = ((c & 31) * u + r) >> 4
    const mg = (((c >> 5) & 31) * u + g) >> 4
    const mb = (((c >> 10) & 31) * u + b) >> 4
    poke16(p, mr | (mg << 5) | (mb << 10))
    p = wrap16(p + 2)
    k++
  }
}

/** Two RGB555 colours mixed, `t` sixteenths of the way from `a` to `b`. */
export function mix(a: u16, b: u16, t: u16): u16 {
  const r = mixPart(a & 31, b & 31, t)
  const g = mixPart((a >> 5) & 31, (b >> 5) & 31, t)
  const bl = mixPart((a >> 10) & 31, (b >> 10) & 31, t)
  return r | (g << 5) | (bl << 10)
}

function mixPart(a: u16, b: u16, t: u16): u16 {
  return (a * (16 - t) + b * t) >> 4
}

/* ---------------- backgrounds ---------------- */

/** The address in video memory of cell (x, y) of map `layer` (0 or 1). */
export function cellAt(layer: u16, x: u16, y: u16): u16 {
  return (layer === 0 ? MAP0 : MAP1) + ((y & 63) << 7) + ((x & 63) << 1)
}

/**
 * A row of `n` cells of a map picture into map `layer` at row `y` from column `x`: `src` the
 * row's cells in the window of bank `b`.
 */
export function mapRow(b: u16, src: u16, layer: u16, y: u16): void {
  const old = bank(b)
  dma(src, cellAt(layer, 0, y), 128)
  poke16(IO_BANK, old)
}

/** Text at a map's cell: characters from 32 as tiles from `font` (with its palette bits). */
export function text(at: u16, s: u16, font: u16): void {
  let c = peek(s)
  while (c !== 0) {
    vpoke(at, font + c - 32)
    at = wrap16(at + 2)
    s++
    c = peek(s)
  }
}

/** A number of `digits` digits (leading zeros shown) at a map's cell, from tile `zero`. */
export function number(at: u16, n: u16, digits: u16, zero: u16): void {
  at = wrap16(at + digits * 2)
  while (digits > 0) {
    at = wrap16(at - 2)
    // One division a digit: the remainder from it (a multiply), not a second division.
    const q = div(n, 10)
    vpoke(at, wrap16(zero + n - q * 10))
    n = q
    digits--
  }
}

/* ---------------- sprites ---------------- */

/** The sprite table as the next frame shows it: 128 sprites of 4 words. */
export const oam = words(512)
let sprN: u16 = 0
let sprShown: u16 = 128

/** Starts a frame's sprites: the first one drawn is in front of every later one. */
export function sprBegin(): void {
  sprN = 0
}

/** A sprite at (x, y): `tile` its tile word (tile, palette field 0-7 for slots 8-15, flips), `size` S8 S16 S32. */
export function spr(x: i16, y: i16, tile: u16, size: u16): void {
  if (sprN >= 128) return
  const k = sprN << 2
  oam[k] = u16(x)
  oam[k + 1] = u16(y)
  oam[k + 2] = tile
  oam[k + 3] = size
  sprN++
}

/** How many sprites the frame has so far. */
export function sprCount(): u16 {
  return sprN
}

/**
 * The frame's sprites, the rest hidden, into video memory: call just after the frame's wait.
 * Only the sprites this frame or the last showed are copied: every one past them is hidden
 * there already.
 */
export function sprShow(): void {
  let k = sprN
  const was = sprShown
  while (k < was) {
    oam[(k << 2) + 3] = S_NONE
    k++
  }
  sprShown = sprN
  const n = sprN > was ? sprN : was
  if (n > 0) dma(addr(oam), OAM, n << 3)
}

/* ---------------- the pad ---------------- */

let padIs: u16 = 0
let padWas: u16 = 0
/** The buttons that went down since the last read, held now or not. */
let padDown: u16 = 0

/**
 * Reads the pad: once a frame. A press is a button PADHIT marks that was up at the last read,
 * so one pressed and let go between two reads (a key tapped on the PC) still counts.
 */
export function padRead(): void {
  const hit = peek16(PADHIT)
  poke16(PADHIT, hit)
  padWas = padIs
  padIs = peek16(PAD)
  padDown = (hit | padIs) & ~padWas
}

/** Whether every button in `mask` is held. */
export function held(mask: u16): bool {
  return (padIs & mask) === mask
}

/** Whether a button in `mask` went down since the last read. */
export function pressed(mask: u16): bool {
  return (padDown & mask) !== 0
}

/** The buttons held now, PAD's bits. */
export function padNow(): u16 {
  return padIs
}

/* ---------------- numbers ---------------- */

/** Sines: 256 steps a turn, -256 to 256 (copied from the cartridge by `kitInit`). */
export const sines = words(256)
/** atan(k / 32) for k 0-32, in the same steps. */
const atans = words(33)
let seed: u16 = 0x1d2b

/** The library's tables into RAM: call first. */
export function kitInit(): void {
  const old = bank(KIT_TABLES_BANK)
  let k: u16 = 0
  while (k < 256) {
    sines[k] = peek16(KIT_SIN_AT + k * 2)
    k++
  }
  k = 0
  while (k < 33) {
    atans[k] = peek16(KIT_ATAN_AT + k * 2)
    k++
  }
  poke16(IO_BANK, old)
  // The START that began the game is still held: what is held now is not a press in it, nor
  // what PADHIT marked before the game began.
  padIs = peek16(PAD)
  padWas = padIs
  padDown = 0
  poke16(PADHIT, 0xfff)
}

/** sin(a) of 256 steps, times 256. */
export function sin(a: u16): i16 {
  return i16(sines[a & 255])
}

/** cos(a) of 256 steps, times 256. */
export function cos(a: u16): i16 {
  return i16(sines[(a + 64) & 255])
}

/** The direction (256 steps, 0 along +x, 64 along +y: down the screen) from 0 to (dx, dy). */
export function aim(dx: i16, dy: i16): u16 {
  let ax = dx < 0 ? u16(-dx) : u16(dx)
  let ay = dy < 0 ? u16(-dy) : u16(dy)
  if (ax === 0 && ay === 0) return 64
  // The smaller times 32 must fit a word: both halved while either is 1024 or more, which
  // keeps their ratio (all the table reads) to well within a step.
  while (ax >= 1024 || ay >= 1024) {
    ax = ax >> 1
    ay = ay >> 1
  }
  // In the first octant first: atan of the smaller over the larger.
  let a: u16 = 0
  if (ax >= ay) a = atans[div(ay * 32 + (ax >> 1), ax)]
  else a = 64 - atans[div(ax * 32 + (ay >> 1), ay)]
  if (dx < 0) a = 128 - a
  if (dy < 0) a = wrap16(256 - a)
  return a & 255
}

/** A chance number, 1 to 65535 (xorshift). */
export function rand(): u16 {
  let x = seed
  x = wrap16(x ^ (x << 7))
  x = x ^ (x >> 9)
  x = wrap16(x ^ (x << 8))
  seed = x
  return x
}

/** A chance number below `n` (n at most 32767): the top byte of chance times n, over 256. */
export function randBelow(n: u16): u16 {
  return u16(mulShift(i16(rand() >> 8), i16(n), 8))
}

/** Seeds chance (from the frame count, say, when START is pressed). */
export function randSeed(s: u16): void {
  seed = s === 0 ? 0x1d2b : s
}

/* ---------------- the score: two words, the low one to 9999 ---------------- */

/** Adds `n` (under 10000) to the score whose two words are at `at`. */
export function scoreAdd(at: u16, n: u16): void {
  let lo = peek16(at) + n
  let hi = peek16(at + 2)
  while (lo >= 10000) {
    lo = lo - 10000
    hi++
  }
  if (hi > 9999) {
    hi = 9999
    lo = 9999
  }
  poke16(at, lo)
  poke16(at + 2, hi)
}

/** Whether the score at `a` is more than the one at `b`. */
export function scoreMore(a: u16, b: u16): bool {
  const ah = peek16(a + 2)
  const bh = peek16(b + 2)
  return ah > bh || (ah === bh && peek16(a) > peek16(b))
}

/** A score shown as eight digits at a map's cell. */
export function scoreShow(cell: u16, at: u16, zero: u16): void {
  number(cell, peek16(at + 2), 4, zero)
  number(wrap16(cell + 8), peek16(at), 4, zero)
}

/* ---------------- save RAM ---------------- */

/** A word of the cartridge's save RAM: the offset taken within its 8 KB, a word's (even). */
export function saveRead(off: u16): u16 {
  const old = bank(SAVE_BANK)
  const v = peek16(WINDOW + (off & SAVE_MASK))
  poke16(IO_BANK, old)
  return v
}

/** A word into the cartridge's save RAM, the offset as `saveRead` takes it. */
export function saveWrite(off: u16, v: u16): void {
  const old = bank(SAVE_BANK)
  poke16(WINDOW + (off & SAVE_MASK), v)
  poke16(IO_BANK, old)
}
