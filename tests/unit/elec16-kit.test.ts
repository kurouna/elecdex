import { readFileSync } from 'node:fs'
import { channelFrames, compileSong, freqOf, OP, songBytes } from '@shared/elec16/kit/mml'
import { type Picture, readMap, readSheet, rgb555 } from '@shared/elec16/kit/tiles'
import { padBit } from '@shared/elec16/pad'
import { describe, expect, it } from 'vitest'
import { playText } from '../../src/renderer/widgets/elec16/play-painter'
import { buildKit, frames, ROM_TRAP, settle, startGame, tap, word } from './elec16-kit-helpers'

/**
 * The game kit (docs/elec16-play.md section 10): the music compiler, the pictures, and a
 * tiny game built from tests/fixtures/kit and run on the core through the PLAY ROM.
 */

/** A picture of `w` x `h` filled by `colour(x, y)`: [r, g, b] or null for clear. */
function picture(w: number, h: number, colour: (x: number, y: number) => number[] | null): Picture {
  const data = new Uint8Array(w * h * 4)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = colour(x, y)
      if (c !== null) data.set([c[0] ?? 0, c[1] ?? 0, c[2] ?? 0, 255], (y * w + x) * 4)
    }
  }
  return { width: w, height: h, data }
}

const RED = [248, 0, 0]
const BLUE = [0, 0, 248]
const WHITE = [248, 248, 248]
/** Two palettes: 0 black, red, blue; 1 black, white. */
const PALETTES = picture(16, 2, (x, y) =>
  x === 0
    ? [0, 0, 0]
    : y === 0
      ? x === 1
        ? RED
        : x === 2
          ? BLUE
          : [8 * x, 8, 8]
      : x === 1
        ? WHITE
        : [8, 8 * x, 8],
)
const pal = (row: number) => {
  const out: number[] = []
  for (let x = 0; x < 16; x++) {
    const at = (row * 16 + x) * 4
    out.push(rgb555(PALETTES.data[at] ?? 0, PALETTES.data[at + 1] ?? 0, PALETTES.data[at + 2] ?? 0))
  }
  return out
}

/** A channel's code read back as the names of its ops. */
function notesOf(code: number[]): string[] {
  const size: Record<number, [string, number]> = {
    [OP.note]: ['note', 5],
    [OP.again]: ['again', 3],
    [OP.repeat]: ['repeat', 1],
    [OP.rest]: ['rest', 2],
    [OP.hold]: ['hold', 3],
    [OP.inst]: ['inst', 2],
    [OP.vol]: ['vol', 2],
    [OP.pan]: ['pan', 2],
    [OP.loop]: ['loop', 1],
    [OP.end]: ['end', 1],
  }
  const out: string[] = []
  for (let at = 0; at < code.length; ) {
    const [name, n] = size[code[at] ?? 0] ?? ['?', 1]
    out.push(name)
    at += n
  }
  return out
}

describe("the kit's music", () => {
  it('turns notes into FREQ values and lengths into frames, gated by q', () => {
    const song = compileSong('t', 'tempo 6\ninst a wave=sq25\nC0: @a o4 l4 a q4 a8. r16 a2^4')
    const code = song.channels[0]?.code ?? []
    const a4 = freqOf(69)
    expect(a4).toBe(1760)
    expect(code).toEqual([
      OP.inst,
      0,
      OP.note,
      a4 & 0xff,
      a4 >> 8,
      24,
      24,
      OP.note,
      a4 & 0xff,
      a4 >> 8,
      18,
      9,
      OP.rest,
      6,
      OP.note,
      a4 & 0xff,
      a4 >> 8,
      72,
      36,
      OP.end,
    ])
  })

  it('unrolls repeats and definitions, loops at L, and writes an echo channel', () => {
    const song = compileSong(
      't',
      'tempo 5\ndefine two = c d\nC0: v10 [$two]2 L e\necho C3 = C0 delay 3 vol -4 pan 12',
    )
    const c0 = song.channels.find((c) => c.channel === 0)
    const c3 = song.channels.find((c) => c.channel === 3)
    expect(notesOf(c0?.code ?? [])).toEqual([
      'vol',
      'note',
      'again',
      'again',
      'again',
      'note',
      'loop',
    ])
    // The loop comes back to e, written whole: nothing is known of the last note there.
    expect(c0?.loop).toBe(2 + 5 + 3 * 3)
    expect(c0?.code[c0.loop ?? 0]).toBe(OP.note)
    // The echo: a rest of 3 frames, the volume 4 lower, then the same notes.
    expect(c3?.code.slice(0, 4)).toEqual([OP.rest, 3, OP.vol, 6])
    expect(notesOf(c3?.code ?? []).filter((n) => n !== 'rest' && n !== 'vol')).toEqual([
      'note',
      'again',
      'again',
      'again',
      'note',
      'loop',
    ])
  })

  it('writes a note again as one byte, and a new pitch of the same length as three', () => {
    const song = compileSong('t', 'tempo 6\nC0: l16 c c c d d e8 e8')
    expect(notesOf(song.channels[0]?.code ?? [])).toEqual([
      'note',
      'repeat',
      'repeat',
      'again',
      'repeat',
      'note',
      'repeat',
      'end',
    ])
    expect(channelFrames(song).get(0)).toBe(6 * 5 + 12 * 2)
  })

  it('refuses a length that is not whole frames, an unknown instrument and a bad line', () => {
    expect(() => compileSong('t', 'tempo 5\nC0: c32')).toThrow(/whole frames/)
    expect(() => compileSong('t', 'C0: @nope c')).toThrow(/no instrument nope/)
    expect(() => compileSong('t', 'hello')).toThrow(/what is/)
  })

  it('lays a song out with its channels, instruments and offsets', () => {
    const bytes = songBytes(compileSong('t', 'inst a vol=9 pan=3\nC2: @a c\nC5: r4'))
    expect([bytes[0], bytes[1], bytes[2], bytes[8]]).toEqual([2, 1, 2, 5])
    const start2 = (bytes[4] ?? 0) | ((bytes[5] ?? 0) << 8)
    expect(start2).toBe(2 + 12 + 8)
    expect(bytes[start2]).toBe(OP.inst)
    // The instrument: its volume and pan.
    expect([bytes[15], bytes[20]]).toEqual([9, 3])
  })
})

describe("the kit's pictures", () => {
  it('cuts a sheet into frames of tiles, the left point in the high half', () => {
    const p = picture(16, 16, (x, y) => (x < 8 && y < 8 ? RED : x >= 8 && y >= 8 ? BLUE : null))
    const sheet = readSheet(p, 16, pal(0))
    expect([sheet.frames, sheet.tilesPerFrame, sheet.bytes.length]).toEqual([1, 4, 128])
    expect([sheet.bytes[0], sheet.bytes[32], sheet.bytes[96]]).toEqual([0x11, 0, 0x22])
  })

  it('says where a point is not in its palette', () => {
    const p = picture(8, 8, (x, y) => (x === 3 && y === 5 ? [0, 248, 0] : RED))
    expect(() => readSheet(p, 8, pal(0))).toThrow('(3, 5) is #00f800, not in its palette')
  })

  it('shares a map tile with any cell alike, flipped too, each in a palette that fits', () => {
    // A corner mark, then the same mark flipped, a clear cell and a white cell.
    const mark = (x: number, y: number) => (x === 0 && y === 0 ? RED : null)
    const p = picture(32, 8, (x, y) => {
      const cx = Math.floor(x / 8)
      const lx = x % 8
      if (cx === 0) return mark(lx, y)
      if (cx === 1) return mark(7 - lx, y)
      if (cx === 2) return null
      return WHITE
    })
    const map = readMap(
      p,
      [
        { slot: 0, palette: pal(0) },
        { slot: 3, palette: pal(1) },
      ],
      100,
    )
    expect(map.tiles.length / 32).toBe(3)
    expect([...map.cells]).toEqual([101, 101 | 0x2000, 100, 102 | (3 << 10)])
  })
})

describe('a kit game on the core', () => {
  const ship = picture(16, 16, (x, y) => (x === y || x === 15 - y ? RED : null))
  const META = {
    id: 'TINY',
    name: 'TINY',
    saveBanks: 0,
    about: 'the kit test game',
    sources: ['tiny.e16.ts', { file: 'far.e16.ts', bank: 1 }],
    palettes: { png: 'palettes.png', names: ['ship', 'text'] },
    sheets: [{ name: 'ship', png: 'ship.png', cell: 16 as const, palette: 'ship', tile: 40 }],
    music: ['tiny.mml'],
  }
  const built = buildKit('tests/fixtures/kit', META, { 'palettes.png': PALETTES, 'ship.png': ship })
  if ('errors' in built) throw new Error(JSON.stringify(built.errors))
  const cart = built.image

  it('is laid out: the entry in bank 0, code in bank 1, data, then the code for RAM', () => {
    expect(built.report.banks).toBeGreaterThanOrEqual(4)
    expect(built.report.ramCode).toBeGreaterThan(1000)
    expect(built.report.ramCode).toBeLessThan(0x5000)
    expect(built.report.assets).toContain('export const SHIP_TILE = 0x28')
  })

  it('writes the constants its sources import, as the folder keeps them', () => {
    expect(readFileSync('tests/fixtures/kit/assets.e16.ts', 'utf8')).toBe(built.report.assets)
  })

  it('starts from START, runs frame by frame, calls into its bank, and draws its sprite', () => {
    const m = startGame(cart)
    frames(m, 10, cart)
    expect(m.state.halt).toBeNull()
    expect(word(m, 0x0270)).toBeGreaterThanOrEqual(8)
    expect(word(m, 0x0272)).toBe(42)
    const v = m.state.video?.mem ?? new Uint8Array()
    // Sprite 0 at (100, 50), tile 40 in slot 8 (field 0), unflipped, 16 points; sprite 1 hidden.
    const at = 0xc000
    const w = (k: number) => (v[at + k] ?? 0) | ((v[at + k + 1] ?? 0) << 8)
    expect([w(0), w(2), w(4), w(6), w(14)]).toEqual([100, 50, 40, 1, 3])
    // The sheet's tiles where it said, its palette in slot 8.
    expect(v[40 * 32]).toBe(0x10)
    expect((v[0xc400 + 8 * 32 + 2] ?? 0) | ((v[0xc400 + 8 * 32 + 3] ?? 0) << 8)).toBe(
      rgb555(248, 0, 0),
    )
  })

  it('plays its song: channel 0 keyed with the notes, again and again as it loops', () => {
    const m = startGame(cart)
    frames(m, 60, cart)
    const c = m.state.apu?.ch[0]
    expect(c?.ons).toBeGreaterThanOrEqual(5)
    expect(c?.wave).toBe(2)
  })

  it('goes back to the start screen when the game returns, every channel let go', () => {
    const m = startGame(cart)
    frames(m, 5, cart)
    tap(m, padBit('start'), cart)
    settle(m, cart)
    const lines = playText(m.state.video?.mem ?? []).map((l) => l.trim())
    expect(lines).toContain('PRESS START')
    expect(m.state.apu?.ch.every((x) => !x.gate)).toBe(true)
  })

  it('gives the ROM its own handler back when BRK stops the game, interrupts off', () => {
    const m = startGame(cart)
    frames(m, 5, cart)
    expect(m.state.csr.mtvec).not.toBe(ROM_TRAP)
    m.brk()
    settle(m, cart)
    const lines = playText(m.state.video?.mem ?? []).map((l) => l.trim())
    expect(lines.some((l) => l.startsWith('BREAK AT'))).toBe(true)
    expect([m.state.csr.mtvec, m.state.csr.mstatus & 8]).toEqual([ROM_TRAP, 0])
  })
})
