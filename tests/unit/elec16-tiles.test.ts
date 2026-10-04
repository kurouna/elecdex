import { assemble, romImage } from '@shared/elec16/asm'
import { REG_NAMES } from '@shared/elec16/isa'
import { Elec16 } from '@shared/elec16/machine'
import { MODEL_IDS, MODELS, type ModelId, XRAM_BANK } from '@shared/elec16/map'
import { decodeSnapshot } from '@shared/elec16/snapshot'
import { IRQ } from '@shared/elec16/state'
import {
  BG0_MAP,
  BG1_MAP,
  BITMAP_HEIGHT,
  BITMAP_WIDTH,
  createVideoState,
  DMA_CHUNK,
  FRAME_HZ,
  FRAME_LINES,
  LAYER,
  NO_LINE,
  PALETTE_AT,
  type Raster,
  type RasterWrite,
  rasterLines,
  SPRITES_AT,
  TILE_REG,
  VIDEO_MODE,
  VIDEO_REG,
  type VideoState,
  VSTAT_LINE,
} from '@shared/elec16/video'
import { describe, expect, it } from 'vitest'
import { paintTiles } from '../../src/renderer/widgets/elec16/tile-painter'

/**
 * PLAY-320's mode 1 (docs/elec16-play.md section 4, G5): the tile engine's registers, the
 * line the beam is on and LINE, the scrolls and layers in force line by line, DMA, the snapshot
 * - and the page's picture of it: tiles, scrolling, flips, palettes, sprites, the layers' order.
 */

const FRAME_MS = 1000 / FRAME_HZ
const CYCLES_A_LINE = 4_000_000 / FRAME_HZ / FRAME_LINES

function boot(src: string, model: ModelId = 'play-320', xram = 0): Elec16 {
  const out = assemble(`.org 0x8000\n${src}`)
  expect(out.errors).toEqual([])
  return Elec16.boot(romImage(out), model, undefined, xram)
}

function finish(m: Elec16): Record<string, number> {
  const result = m.run(5_000_000)
  expect(result.halted?.cause, `stopped at ${result.halted?.pc.toString(16)}`).toBe('breakpoint')
  return Object.fromEntries(REG_NAMES.map((name, k) => [name, m.state.regs[k] ?? 0]))
}

const tiles = (m: Elec16) => {
  const v = m.state.video
  if (v === null) throw new Error('no video')
  return v.tiles
}

describe("the tile engine's registers", () => {
  it('hold the scrolls in nine bits, LAYERS in three, and come back from a reset', () => {
    const m = boot('ebreak')
    expect([0, 1, 2, 3].map((k) => m.bus.read16(TILE_REG.bg0x + k * 2))).toEqual([0, 0, 0, 0])
    expect(m.bus.read16(TILE_REG.layers)).toBe(7)
    expect(m.bus.read16(TILE_REG.lineCmp)).toBe(NO_LINE)
    m.bus.write16(TILE_REG.bg0x, 0xffff)
    m.bus.write16(TILE_REG.bg1y, 513)
    m.bus.write16(TILE_REG.layers, 0xff)
    expect([m.bus.read16(TILE_REG.bg0x), m.bus.read16(TILE_REG.bg1y)]).toEqual([511, 1])
    expect(m.bus.read16(TILE_REG.layers)).toBe(7)
    m.bus.write16(TILE_REG.layers, LAYER.bg1)
    m.bus.write16(TILE_REG.lineCmp, 100)
    m.reset()
    expect(m.bus.read16(TILE_REG.bg0x)).toBe(0)
    expect(m.bus.read16(TILE_REG.layers)).toBe(7)
    expect(m.bus.read16(TILE_REG.lineCmp)).toBe(NO_LINE)
  })

  it('say the line the beam is on by the cycles run since VBLANK, and start again at VBLANK', () => {
    const m = boot('loop:\n  j loop')
    expect(m.bus.read16(TILE_REG.line)).toBe(0)
    m.run(CYCLES_A_LINE * 10 + 5)
    expect(m.bus.read16(TILE_REG.line)).toBe(10)
    m.run(CYCLES_A_LINE * 400)
    expect(m.bus.read16(TILE_REG.line)).toBe(FRAME_LINES - 1)
    m.advance(FRAME_MS + 0.01)
    expect(m.bus.read16(TILE_REG.line)).toBe(0)
  })

  it('follow the clock: a line is a 312th of a sixtieth of a second of cycles', () => {
    const m = boot('loop:\n  j loop')
    m.hz = 8_000_000
    m.advance(FRAME_MS + 0.01)
    m.run((8_000_000 / FRAME_HZ / FRAME_LINES) * 20 + 3)
    expect(m.bus.read16(TILE_REG.line)).toBe(20)
  })
})

describe('LINE', () => {
  it('rises once a frame when the beam reaches LINECMP, on line 7, and goes when cleared', () => {
    const m = boot('loop:\n  j loop')
    m.bus.write16(TILE_REG.lineCmp, 50)
    m.run(CYCLES_A_LINE * 49)
    expect(m.bus.read16(VIDEO_REG.stat) & VSTAT_LINE).toBe(0)
    m.run(CYCLES_A_LINE * 2)
    expect(m.bus.read16(VIDEO_REG.stat) & VSTAT_LINE).toBe(VSTAT_LINE)
    m.bus.write16(VIDEO_REG.stat, VSTAT_LINE)
    m.run(CYCLES_A_LINE * 100)
    // Not again this frame; again in the next.
    expect(m.bus.read16(VIDEO_REG.stat) & VSTAT_LINE).toBe(0)
    m.advance(FRAME_MS + 0.01)
    m.bus.write16(VIDEO_REG.stat, 1)
    m.run(CYCLES_A_LINE * 51)
    expect(m.bus.read16(VIDEO_REG.stat) & VSTAT_LINE).toBe(VSTAT_LINE)
  })

  it('wakes a program asleep for it every frame, on its line, with time given a millisecond at a time', () => {
    // Lines from 24 on: a line within the step of time that brings VBLANK has passed before a
    // program clearing LINE at the frame's start sees it.
    for (const lineCmp of [24, 100, 144, 287]) {
      // Each frame: wait for VBLANK, clear both, wait for LINE, count it and note the line.
      const m = boot(`
        li t0, ${TILE_REG.lineCmp}
        li t1, ${lineCmp}
        sw t1, 0(t0)
      frame:
        li t0, ${1 << IRQ.vblank}
        csrw mie, t0
        wfi
        li t1, ${VIDEO_REG.stat}
        li t2, 3
        sw t2, 0(t1)
        li t0, ${1 << IRQ.line}
        csrw mie, t0
        wfi
        li t1, ${VIDEO_REG.stat}
        li t2, ${VSTAT_LINE}
        sw t2, 0(t1)
        addi s0, s0, 1
        li t0, ${TILE_REG.line}
        lw s1, 0(t0)
        j frame`)
      for (let ms = 0; ms < 1000; ms++) {
        m.advance(1)
        m.run(1_000_000)
      }
      // Sixty frames in the second, a LINE in each (but the first, begun part way).
      expect(m.state.regs[REG_NAMES.indexOf('s0')], `line ${lineCmp}`).toBeGreaterThanOrEqual(59)
      expect(m.state.regs[REG_NAMES.indexOf('s1')], `line ${lineCmp}`).toBe(lineCmp)
    }
  })

  it('wakes a program waiting for it once this frame has had its LINE, at the next frame one', () => {
    // LINE comes and is cleared; then the program waits for LINE alone. Asleep, it must say
    // when to look again - never nothing, which the page takes for idle.
    const m = boot(`
      li t0, ${TILE_REG.lineCmp}
      li t1, 10
      sw t1, 0(t0)
      li t0, ${1 << IRQ.line}
      csrw mie, t0
      wfi
      li t1, ${VIDEO_REG.stat}
      li t2, 3
      sw t2, 0(t1)
      li t0, ${TILE_REG.line}
      lw s0, 0(t0)
    again:
      wfi
      li t0, ${TILE_REG.line}
      lw s1, 0(t0)
      ebreak`)
    let r = m.run(1_000_000)
    for (
      let k = 0;
      k < 20 && r.sleeping !== null && m.state.regs[REG_NAMES.indexOf('s0')] === 0;
      k++
    ) {
      m.advance(r.sleeping.timerMs ?? 1)
      r = m.run(1_000_000)
    }
    // Now asleep for the next LINE: a time to wake, not none.
    expect(r.sleeping?.timerMs).not.toBeNull()
    for (let k = 0; k < 20 && r.halted === null; k++) {
      m.advance(r.sleeping?.timerMs ?? 1)
      r = m.run(1_000_000)
    }
    expect(r.halted?.cause).toBe('breakpoint')
    expect(m.state.regs[REG_NAMES.indexOf('s1')]).toBe(10)
  })

  it('never rises for a line not drawn', () => {
    const m = boot('loop:\n  j loop')
    m.bus.write16(TILE_REG.lineCmp, BITMAP_HEIGHT)
    m.run(CYCLES_A_LINE * FRAME_LINES)
    expect(tiles(m).linePending).toBe(false)
  })

  it('wakes WFI and is taken as an interrupt with its line enabled', () => {
    const m = boot(`
      la t0, handler
      csrw mtvec, t0
      li t0, ${TILE_REG.lineCmp}
      li t1, 30
      sw t1, 0(t0)
      li t0, ${1 << IRQ.line}
      csrw mie, t0
      csrr a2, mie
      csrsi mstatus, 8
    spin:
      beqz a0, spin
      csrw mtvec, zero
      ebreak
    handler:
      csrr a1, mcause
      li t0, ${TILE_REG.line}
      lw a3, 0(t0)
      li a0, 1
      li t0, ${VIDEO_REG.stat}
      li t1, ${VSTAT_LINE}
      sw t1, 0(t0)
      mret`)
    const r = finish(m)
    expect([r.a1, r.a2]).toEqual([0x8000 | IRQ.line, 1 << IRQ.line])
    expect(r.a3).toBe(30)
  })
})

describe('the scrolls and layers, line by line', () => {
  it('are logged at the line they were written, and the frame finished is what is drawn', () => {
    const m = boot('loop:\n  j loop')
    m.bus.write16(TILE_REG.bg0x, 5)
    m.run(CYCLES_A_LINE * 100 + 1)
    m.bus.write16(TILE_REG.bg0x, 9)
    m.bus.write16(TILE_REG.layers, LAYER.bg0)
    m.advance(FRAME_MS + 0.01)
    const last = tiles(m).last
    expect(last.log).toEqual([
      { line: 0, which: 0, value: 5 },
      { line: 100, which: 0, value: 9 },
      { line: 100, which: 4, value: LAYER.bg0 },
    ])
    const lines = rasterLines(last)
    expect([
      lines[0]?.scroll[0],
      lines[99]?.scroll[0],
      lines[100]?.scroll[0],
      lines[287]?.scroll[0],
    ]).toEqual([5, 5, 9, 9])
    expect([lines[99]?.layers, lines[100]?.layers]).toEqual([7, LAYER.bg0])
    // The next frame starts from where this one ended, with nothing written yet.
    expect(tiles(m).start).toEqual({ scroll: [9, 0, 0, 0], layers: LAYER.bg0 })
    expect(tiles(m).log).toEqual([])
  })
})

describe('DMA', () => {
  it('copies from RAM into video memory, sixteen bytes a step, the CPU waiting', () => {
    const m = boot(`
      li t0, ${TILE_REG.dmaSrc}
      li t1, 0x2000
      sw t1, 0(t0)
      li t1, 0x4321
      sw t1, 2(t0)
      li t1, 100
      sw t1, 4(t0)
      li t1, 1
      sw t1, 6(t0)
      lw a0, 6(t0)
      lw a1, 4(t0)
      ebreak`)
    for (let k = 0; k < 100; k++) m.state.ram[0x2000 + k] = k + 1
    const r = finish(m)
    // The CPU went on only once it was done.
    expect([r.a0, r.a1]).toEqual([0, 0])
    expect(Array.from(m.state.video?.mem.subarray(0x4321, 0x4321 + 101) ?? [])).toEqual([
      ...Array.from({ length: 100 }, (_, k) => k + 1),
      0,
    ])
    expect(m.bus.read16(TILE_REG.dmaSrc)).toBe(0x2000 + 100)
  })

  it('reads through the bank window: extended RAM goes to video memory', () => {
    const m = boot(
      `
      li t0, 0xff04
      li t1, ${XRAM_BANK + 1}
      sw t1, 0(t0)
      li t0, ${TILE_REG.dmaSrc}
      li t1, 0xc000
      sw t1, 0(t0)
      sw zero, 2(t0)
      li t1, 64
      sw t1, 4(t0)
      li t1, 1
      sw t1, 6(t0)
      ebreak`,
      'play-320',
      2 * 8192,
    )
    m.state.xram.fill(0x5a, 8192, 8192 + 64)
    finish(m)
    expect(m.state.video?.mem.subarray(0, 64).every((b) => b === 0x5a)).toBe(true)
    expect(m.state.video?.mem[64]).toBe(0)
  })

  it('lets an interrupt in between its steps', () => {
    const m = boot(`
      la t0, handler
      csrw mtvec, t0
      li t0, ${1 << IRQ.vblank}
      csrw mie, t0
      csrsi mstatus, 8
      li t0, ${TILE_REG.dmaSrc}
      sw zero, 0(t0)
      sw zero, 2(t0)
      li t1, 0x8000
      sw t1, 4(t0)
      li t1, 1
      sw t1, 6(t0)
      csrw mtvec, zero
      ebreak
    handler:
      li t0, ${TILE_REG.dmaLen}
      lw a0, 0(t0)
      li t0, ${VIDEO_REG.stat}
      li t1, 1
      sw t1, 0(t0)
      mret`)
    m.run(40 * 8)
    expect(tiles(m).dma.active).toBe(true)
    m.advance(FRAME_MS + 0.01)
    const r = finish(m)
    // The handler ran while the copy was part way.
    expect(r.a0 ?? 0).toBeGreaterThan(0)
    expect(r.a0 ?? 0).toBeLessThan(0x8000)
    expect((r.a0 ?? 0) % DMA_CHUNK).toBe(0)
  })

  it('stops where it is when 0 is written to DMACTRL', () => {
    const m = boot('loop:\n  j loop')
    m.bus.write16(TILE_REG.dmaLen, 0x4000)
    m.bus.write16(TILE_REG.dmaCtrl, 1)
    m.run(8 * 10)
    m.bus.write16(TILE_REG.dmaCtrl, 0)
    const left = m.bus.read16(TILE_REG.dmaLen)
    expect(left).toBeGreaterThan(0)
    m.run(8 * 10)
    expect([m.bus.read16(TILE_REG.dmaCtrl), m.bus.read16(TILE_REG.dmaLen)]).toEqual([0, left])
  })

  it('does nothing for a length of 0', () => {
    const m = boot('ebreak')
    m.bus.write16(TILE_REG.dmaCtrl, 1)
    expect(m.bus.read16(TILE_REG.dmaCtrl)).toBe(0)
  })
})

describe('a snapshot of mode 1', () => {
  it("keeps the scrolls, layers, LINECMP, LINE's flags and DMA under way", () => {
    const m = boot('ebreak')
    finish(m)
    const t = tiles(m)
    t.scroll = [1, 2, 3, 511]
    t.layers = LAYER.sprites
    t.lineCmp = 77
    t.linePending = true
    t.dma = { src: 0x100, dst: 0x200, len: 48, active: true }
    const back = decodeSnapshot(m.snapshot())?.video?.tiles
    expect(back?.scroll).toEqual([1, 2, 3, 511])
    expect([back?.layers, back?.lineCmp, back?.linePending]).toEqual([LAYER.sprites, 77, true])
    expect(back?.dma).toEqual({ src: 0x100, dst: 0x200, len: 48, active: true })
    expect(back?.start).toEqual({ scroll: [1, 2, 3, 511], layers: LAYER.sprites })
  })
})

describe('the other models, without a tile engine', () => {
  it('read 0 from its registers and keep mie to their five lines', () => {
    for (const id of MODEL_IDS.filter((x) => !MODELS[x].video)) {
      const m = boot(
        `
        li t0, 0xff
        csrw mie, t0
        csrr a0, mie
        ebreak`,
        id,
      )
      const r = finish(m)
      expect(r.a0, id).toBe(0x1f)
      m.bus.write16(TILE_REG.bg0x, 5)
      m.bus.write16(TILE_REG.dmaLen, 5)
      m.bus.write16(TILE_REG.dmaCtrl, 1)
      expect(
        [m.bus.read16(TILE_REG.bg0x), m.bus.read16(TILE_REG.line), m.bus.read16(TILE_REG.dmaLen)],
        id,
      ).toEqual([0, 0, 0])
    }
  })
})

/* ---------------- the picture ---------------- */

/** A video memory whose palette entry k is the colour k (red the low five bits, green the next). */
function scene(): VideoState {
  const v = createVideoState()
  v.ctrl = 1 | (VIDEO_MODE.tiles << 1)
  for (let k = 0; k < 256; k++) {
    v.mem[PALETTE_AT + k * 2] = k & 0xff
    v.mem[PALETTE_AT + k * 2 + 1] = k >> 8
  }
  return v
}

/** A tile from eight rows of eight hex digits (its colours). */
function tile(v: VideoState, t: number, rows: string[]): void {
  rows.forEach((row, y) => {
    for (let x = 0; x < 8; x += 2) {
      v.mem[t * 32 + y * 4 + x / 2] =
        (Number.parseInt(row[x] ?? '0', 16) << 4) | Number.parseInt(row[x + 1] ?? '0', 16)
    }
  })
}

const SOLID = (c: string) => Array.from({ length: 8 }, () => c.repeat(8))
const ARROW = [
  '10000000',
  '00000000',
  '00000000',
  '00000000',
  '00000000',
  '00000000',
  '00000000',
  '00000002',
]

function cell(v: VideoState, map: number, col: number, row: number, w: number): void {
  const at = map + (row * 64 + col) * 2
  v.mem[at] = w & 0xff
  v.mem[at + 1] = w >> 8
}

function sprite(v: VideoState, n: number, x: number, y: number, w: number, size = 0): void {
  const at = SPRITES_AT + n * 8
  const put = (k: number, value: number) => {
    v.mem[at + k] = value & 0xff
    v.mem[at + k + 1] = (value >> 8) & 0xff
  }
  put(0, x)
  put(2, y)
  put(4, w)
  put(6, size)
}

/** Every sprite hidden (size 3), as a program would leave the table it does not use. */
function noSprites(v: VideoState): void {
  for (let n = 0; n < 128; n++) sprite(v, n, 0, 0, 0, 3)
}

const still = (layers = 7, scroll: Raster['scroll'] = [0, 0, 0, 0]) => ({
  start: { scroll, layers },
  log: [] as RasterWrite[],
})

/** Draws and gives back the palette entry each dot shows. */
function draw(v: VideoState, frame = still()): (x: number, y: number) => number {
  const out = new Uint8ClampedArray(BITMAP_WIDTH * BITMAP_HEIGHT * 4)
  paintTiles(v.mem, frame, out)
  return (x, y) => {
    const o = (y * BITMAP_WIDTH + x) * 4
    return (((out[o + 1] ?? 0) >> 3) << 5) | ((out[o] ?? 0) >> 3)
  }
}

describe("the page's picture of mode 1", () => {
  it('draws a tile of a background in its palette, colour 0 showing the backdrop', () => {
    const v = scene()
    noSprites(v)
    tile(v, 1, ARROW)
    cell(v, BG0_MAP, 0, 0, 1 | (3 << 10))
    const at = draw(v)
    expect([at(0, 0), at(7, 7), at(1, 0), at(8, 0)]).toEqual([3 * 16 + 1, 3 * 16 + 2, 0, 0])
  })

  it('scrolls a background round its 512 dots, and flips a tile either way', () => {
    const v = scene()
    noSprites(v)
    tile(v, 1, ARROW)
    cell(v, BG0_MAP, 1, 1, 1)
    cell(v, BG0_MAP, 63, 63, 1 | (1 << 13) | (1 << 14))
    const at = draw(v, still(7, [8, 8, 0, 0]))
    expect([at(0, 0), at(7, 7)]).toEqual([1, 2])
    const wrapped = draw(v, still(7, [504, 504, 0, 0]))
    // Cell (63, 63) at the top left, turned both ways: the 2 at its top left.
    expect([wrapped(0, 0), wrapped(7, 7)]).toEqual([2, 1])
  })

  it('puts BG1 over BG0 where it is not clear, and a front tile over the sprites', () => {
    const v = scene()
    noSprites(v)
    tile(v, 1, SOLID('5'))
    tile(v, 2, ARROW)
    cell(v, BG0_MAP, 0, 0, 1)
    cell(v, BG1_MAP, 0, 0, 2 | (1 << 10))
    sprite(v, 0, 0, 0, 1 | (2 << 10))
    let at = draw(v)
    // BG1's clear dots show the sprite; its coloured one is under the sprite.
    expect([at(1, 0), at(0, 0)]).toEqual([(8 + 2) * 16 + 5, (8 + 2) * 16 + 5])
    cell(v, BG1_MAP, 0, 0, 2 | (1 << 10) | (1 << 15))
    at = draw(v)
    expect([at(0, 0), at(1, 0)]).toEqual([16 + 1, (8 + 2) * 16 + 5])
  })

  it('puts a sprite marked behind under the backgrounds, over the backdrop', () => {
    const v = scene()
    noSprites(v)
    tile(v, 1, SOLID('5'))
    tile(v, 2, ARROW)
    cell(v, BG0_MAP, 0, 0, 2)
    sprite(v, 0, 0, 0, 1 | (1 << 15))
    const at = draw(v)
    expect([at(0, 0), at(1, 0)]).toEqual([1, 8 * 16 + 5])
  })

  it('draws large sprites from tiles in a row, flipped whole, the lower number in front', () => {
    const v = scene()
    noSprites(v)
    for (let t = 0; t < 4; t++) tile(v, 10 + t, SOLID(String(t + 1)))
    sprite(v, 0, 20, 30, 10, 1)
    let at = draw(v)
    expect([at(20, 30), at(28, 30), at(20, 38), at(35, 45), at(36, 30)]).toEqual([
      129, 130, 131, 132, 0,
    ])
    sprite(v, 0, 20, 30, 10 | (1 << 13) | (1 << 14), 1)
    sprite(v, 1, 20, 30, 10 | (2 << 10), 1)
    at = draw(v)
    expect([at(20, 30), at(35, 45)]).toEqual([132, 129])
    // Negative places reach off the top left.
    sprite(v, 0, 0xfffc, 0xfffc, 10, 1)
    at = draw(v)
    expect(at(0, 0)).toBe(129)
  })

  it('shows the first 32 sprites on a line by number, and no more', () => {
    const v = scene()
    noSprites(v)
    tile(v, 1, SOLID('7'))
    for (let n = 0; n < 33; n++) sprite(v, n, n * 8, 100, 1)
    const at = draw(v)
    expect(at(31 * 8, 100)).toBe(128 + 7)
    expect(at(32 * 8, 100)).toBe(0)
  })

  it('leaves out a layer LAYERS turns off', () => {
    const v = scene()
    noSprites(v)
    tile(v, 1, SOLID('4'))
    cell(v, BG0_MAP, 0, 0, 1)
    sprite(v, 0, 8, 0, 1)
    let at = draw(v, still(LAYER.bg1))
    expect([at(0, 0), at(8, 0)]).toEqual([0, 0])
    at = draw(v, still(LAYER.bg0 | LAYER.sprites))
    expect([at(0, 0), at(8, 0)]).toEqual([4, 128 + 4])
  })

  it('draws each line with the scroll in force on it: a split down the screen', () => {
    const v = scene()
    noSprites(v)
    tile(v, 1, SOLID('6'))
    cell(v, BG0_MAP, 1, 0, 1)
    for (let row = 0; row < 64; row++) cell(v, BG0_MAP, 1, row, 1)
    const at = draw(v, {
      start: { scroll: [0, 0, 0, 0], layers: 7 },
      log: [{ line: 100, which: 0, value: 8 }],
    })
    expect([at(8, 99), at(0, 99)]).toEqual([6, 0])
    expect([at(0, 100), at(8, 100)]).toEqual([6, 0])
  })
})
