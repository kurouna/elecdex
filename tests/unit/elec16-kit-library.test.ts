import type { Picture } from '@shared/elec16/kit/tiles'
import { padBit } from '@shared/elec16/pad'
import { TILE_REG } from '@shared/elec16/video'
import { describe, expect, it } from 'vitest'
import { buildKit, frames, startGame, word } from './elec16-kit-helpers'

/**
 * The game kit's library on the core (resources/elec16/games/lib, docs/elec16-play.md section
 * 10): a small game for each part, built as gen:elec16 builds one and run through the PLAY ROM
 * - aiming, the pad, save RAM, the sound driver's volumes and long notes, the raster table.
 */

const data = new Uint8Array(16 * 4)
for (let x = 0; x < 16; x++) data.set([8 * x, 8, 8, 255], x * 4)
const PALETTES: Picture = { width: 16, height: 1, data }

const HEAD = `import { aim, B_A, frame_wait, kitInit, padRead, pressed, raster, RASTER, saveRead, saveWrite, VCTRL } from '../../../resources/elec16/games/lib/kit.e16'
import { play, soundInit, soundTick } from '../../../resources/elec16/games/lib/sound.e16'
import { peek16, poke16, type u16 } from '../../../src/shared/e16c/builtins'
`

/** A game whose main runs `setup` once and `each` every frame; with a song `s` when given. */
function game(setup: string, each = '', mml: string | null = null, saveBanks = 0): Uint8Array {
  const song = mml === null ? '' : "import { SONG_S_AT, SONG_S_BANK } from './assets.e16'\n"
  const src = `${HEAD}${song}export let n: u16 = 0
export function main(): void {
  kitInit()
  soundInit()
  poke16(VCTRL, 3)
${setup}
  let seen: u16 = 0
  for (;;) {
    seen = frame_wait(seen)
    padRead()
    soundTick()
${each}
  }
}
`
  const built = buildKit(
    'tests/fixtures/kit',
    {
      id: 'LIB',
      name: 'LIB',
      saveBanks,
      about: 'the library on the core',
      sources: ['g.e16.ts'],
      palettes: { png: 'p.png', names: ['a'] },
      ...(mml === null ? {} : { music: ['m.mml'] }),
    },
    { 'p.png': PALETTES },
    { 'g.e16.ts': src, ...(mml === null ? {} : { 'm.mml': mml }) },
  )
  if ('errors' in built) throw new Error(JSON.stringify(built.errors))
  return built.image
}

/** The direction to (dx, dy) in 256 steps, as aim gives it. */
const steps = (dx: number, dy: number) =>
  (Math.round((Math.atan2(dy, dx) * 128) / Math.PI) + 256) & 255

describe("the kit's library", () => {
  it('aims along long diagonals as along short ones', () => {
    const pairs = [
      [2240, 3840],
      [3840, 2240],
      [-2240, 3840],
      [30000, 29000],
      [-30000, -25000],
      [20000, -9000],
      [100, 171],
      [1, 32767],
    ] as const
    const cart = game(
      pairs.map(([x, y], k) => `  poke16(0x6000 + ${k * 2}, aim(${x}, ${y}))`).join('\n'),
    )
    const m = startGame(cart)
    frames(m, 2, cart)
    pairs.forEach(([x, y], k) => {
      const off = (word(m, 0x6000 + k * 2) - steps(x, y) + 384) % 256
      expect(Math.abs(off - 128), `aim(${x}, ${y})`).toBeLessThanOrEqual(1)
    })
  })

  it('takes a button pressed and let go between two reads as pressed, once', () => {
    const cart = game('', '    if (pressed(B_A)) n++\n    poke16(0x6000, n)')
    const m = startGame(cart)
    frames(m, 3, cart)
    // Down and up again before the game looked: a key tapped on the PC.
    m.pad(padBit('a'))
    m.pad(0)
    frames(m, 3, cart)
    expect(word(m, 0x6000)).toBe(1)
    // Held over frames: one press.
    m.pad(padBit('a'))
    frames(m, 4, cart)
    m.pad(0)
    frames(m, 2, cart)
    expect(word(m, 0x6000)).toBe(2)
  })

  it('keeps save RAM offsets within its 8 KB, a word at a time', () => {
    const cart = game(
      '  saveWrite(0x2004, 0x1234)\n  saveWrite(7, 0x5678)\n  poke16(0x6000, saveRead(4))\n  poke16(0x6002, saveRead(6))',
      '',
      null,
      1,
    )
    const m = startGame(cart)
    frames(m, 2, cart)
    expect([word(m, 0x6000), word(m, 0x6002)]).toEqual([0x1234, 0x5678])
    const save = m.state.cart?.save ?? new Uint8Array()
    expect([save[4], save[5], save[6], save[7]]).toEqual([0x34, 0x12, 0x78, 0x56])
    // Nothing went into the video memory past the window.
    expect(m.state.video?.mem.subarray(0, 0x1000).some((b) => b === 0x34)).toBe(false)
  })

  it('plays a note of volume 15 on an instrument of 15 at 15', () => {
    const cart = game('  play(SONG_S_BANK, SONG_S_AT, true)', '', 'song s\nC0: v15 c1\nC1: v8 c1')
    const m = startGame(cart)
    frames(m, 4, cart)
    expect([m.state.apu?.ch[0]?.vol, m.state.apu?.ch[1]?.vol]).toEqual([15, 8])
  })

  it('holds a note longer than 255 frames to its end, and lets it go there', () => {
    // A whole note at tempo 6 is 96 frames: four tied, 384, then a rest.
    const cart = game(
      '  play(SONG_S_BANK, SONG_S_AT, true)',
      '',
      'song s\ntempo 6\nC0: o4 c1^1^1^1 r1\nC1: o4 q4 c1^1^1^1 r1',
    )
    const m = startGame(cart)
    const held = [0, 0]
    for (let f = 0; f < 470; f++) {
      frames(m, 1, cart)
      for (const c of [0, 1]) if (m.state.apu?.ch[c]?.gate === true) held[c] = (held[c] ?? 0) + 1
    }
    // Both began together, a few frames before the count: C0 is held 384 frames, C1 half.
    expect((held[0] ?? 0) - (held[1] ?? 0)).toBe(192)
    expect(held[0] ?? 0).toBeGreaterThan(375)
    expect(m.state.apu?.ch[0]?.gate).toBe(false)
  })

  it('writes BG0X for each of the 36 bands every frame with raster(1)', () => {
    const cart = game(
      '  let k: u16 = 0\n  while (k < 36) {\n    poke16(RASTER + k * 2, k + 1)\n    k++\n  }\n  raster(1)',
    )
    const m = startGame(cart)
    frames(m, 5, cart)
    const writes = m.state.video?.tiles.last.log.filter((w) => w.which === 0) ?? []
    expect(writes.map((w) => w.value)).toEqual(Array.from({ length: 36 }, (_, k) => k + 1))
    expect(writes.map((w) => w.line)).toEqual(Array.from({ length: 36 }, (_, k) => k * 8))
  })

  it('leaves LINE and LINECMP to the game while raster(0)', () => {
    const cart = game(
      '  raster(1)\n  frame_wait(0)\n  frame_wait(1)\n  raster(0)\n  poke16(0xf82a, 100)',
      '    poke16(0x6000, peek16(0xf82a))',
    )
    const m = startGame(cart)
    frames(m, 6, cart)
    expect(word(m, 0x6000)).toBe(100)
    expect(m.bus.read16(TILE_REG.lineCmp)).toBe(100)
    expect(m.state.video?.tiles.last.log.filter((w) => w.which === 0)).toEqual([])
  })
})
