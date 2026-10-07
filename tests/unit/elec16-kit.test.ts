import { readFileSync } from 'node:fs'
import { type KitMeta, Layout } from '@shared/elec16/kit/build'
import { channelFrames, compileSong, freqOf, OP, songBytes } from '@shared/elec16/kit/mml'
import { type Picture, readMap, readSheet, rgb555 } from '@shared/elec16/kit/tiles'
import { padBit } from '@shared/elec16/pad'
import { rasterLines } from '@shared/elec16/video'
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

  it("says a bank's code is too long, not that it is outside RAM", () => {
    const lines = Array.from({ length: 2000 }, (_, k) => `  poke16(0x300, ${k})`)
    const far = [
      'export function farAway(a: u16, b: u16): u16 {',
      ...lines,
      '  return a + b',
      '}',
    ].join('\n')
    const long = buildKit(
      'tests/fixtures/kit',
      META,
      { 'palettes.png': PALETTES, 'ship.png': ship },
      {
        'far.e16.ts': far,
      },
    )
    expect(JSON.stringify(long)).toContain("a bank's code runs past its 8 KB")
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

/**
 * The runtime's raster (docs/elec16-play.md section 10): a game that fills the bands with
 * 3 a band and its table of lines with 1000 + the line, in the mode `MODE`, its lines from
 * `FROM` to `TO`, and counts the frames it drew.
 */
function rasterGame(mode: number, from: number, to: number): string {
  return `
import { addr, poke16, words, type u16 } from '../../../src/shared/e16c/builtins'
import { frame_wait, kitInit, raster, raster_lines, RASTER, VCTRL } from '../../../resources/elec16/games/lib/kit.e16'
const lines = words(288)
export function main(): void {
  kitInit()
  poke16(VCTRL, 3)
  let k: u16 = 0
  while (k < 36) {
    poke16(RASTER + k * 2, k * 3)
    k++
  }
  k = 0
  while (k < 288) {
    lines[k] = 300 + k
    k++
  }
  raster_lines(addr(lines), ${from}, ${to})
  raster(${mode})
  let seen: u16 = 0
  for (;;) {
    seen = frame_wait(seen)
    poke16(0x0270, seen)
  }
}
`
}

describe("the kit's raster", () => {
  const META = {
    id: 'RASTER',
    name: 'RASTER',
    saveBanks: 0,
    about: 'the raster test game',
    sources: ['raster.e16.ts'],
    palettes: { png: 'palettes.png', names: ['ship', 'text'] },
  }
  /** The game run 10 frames: BG0X on each line of the frame last drawn, and its cycles. */
  function run(mode: number, from = 168, to = 287) {
    const built = buildKit(
      'tests/fixtures/kit',
      META,
      { 'palettes.png': PALETTES },
      { 'raster.e16.ts': rasterGame(mode, from, to) },
    )
    if ('errors' in built) throw new Error(JSON.stringify(built.errors))
    const m = startGame(built.image)
    frames(m, 10, built.image)
    const c0 = m.state.cycles
    frames(m, 1, built.image)
    const cycles = m.state.cycles - c0
    expect(m.state.halt).toBeNull()
    const last = m.state.video?.tiles.last
    if (last === undefined) throw new Error('no video')
    return { x: rasterLines(last).map((r) => r.scroll[0]), cycles, m }
  }
  const band = (y: number) => Math.floor(y / 8) * 3

  it('raster(1) writes each band of 8 lines, as it always has', () => {
    const { x } = run(1)
    expect(x).toEqual(Array.from({ length: 288 }, (_, y) => band(y)))
  })

  it('raster(2) writes the bands above its first line, then the table every line to its last', () => {
    const { x } = run(2)
    expect(x).toEqual(Array.from({ length: 288 }, (_, y) => (y < 168 ? band(y) : 300 + y - 168)))
  })

  it('raster(2) starts its lines between two bands and leaves the last value below its end', () => {
    const { x } = run(2, 170, 250)
    const want = Array.from({ length: 288 }, (_, y) =>
      y < 170 ? band(y) : y <= 250 ? 300 + y - 170 : 300 + 250 - 170,
    )
    expect(x).toEqual(want)
  })

  it('raster(2) costs a short handler a line, raster(1) what it did, raster(0) nothing', () => {
    const one = run(1)
    const two = run(2)
    // 120 lines, each a LINE taken and its handler: measured 1,792 cycles a frame for raster(1)'s
    // 36 bands and 6,287 for raster(2)'s 21 bands and 120 lines (2026-10-08).
    expect(two.cycles - one.cycles).toBeLessThan(120 * 45)
    // raster(1)'s bands cost what they did before raster(2) came: its handler is untouched.
    expect(one.cycles).toBe(1792)
    const none = run(0)
    expect(new Set(none.x)).toEqual(new Set([0]))
  })
})

describe("the kit's template for a new game", () => {
  const meta = JSON.parse(readFileSync('resources/elec16/kit-template/game.json', 'utf8'))
  const built = buildKit('resources/elec16/kit-template', meta)
  if ('errors' in built) throw new Error(JSON.stringify(built.errors))

  it('builds, runs, flies its ship and shoots, and goes back to the start screen on START', () => {
    const m = startGame(built.image)
    frames(m, 10, built.image)
    expect(m.state.halt).toBeNull()
    const v = m.state.video?.mem ?? new Uint8Array()
    const word = (at: number) => (v[at] ?? 0) | ((v[at + 1] ?? 0) << 8)
    // Sprite 0, the ship, at (144, 212); no shot yet.
    expect([word(0xc000), word(0xc002), word(0xc006), word(0xc00e)]).toEqual([144, 212, 1, 3])
    m.pad(padBit('right'))
    frames(m, 10, built.image)
    m.pad(padBit('a'))
    frames(m, 2, built.image)
    m.pad(0)
    frames(m, 2, built.image)
    expect(word(0xc000)).toBeGreaterThan(144)
    // A shot: sprite 1 shown.
    expect(word(0xc00e)).toBe(1)
    tap(m, padBit('start'), built.image)
    settle(m, built.image)
    const lines = playText(m.state.video?.mem ?? []).map((l) => l.trim())
    expect(lines).toContain('PRESS START')
  })
})

describe("the kit's music, refusing what would go wrong on the machine", () => {
  const code = (text: string, ch = 0) =>
    compileSong('t', text).channels.find((c) => c.channel === ch)?.code ?? []

  it('reads # after a note as a sharp, and as a comment only at the start or after a space', () => {
    expect(code('C0: c#4 d e')).toEqual(code('C0: c+4 d e'))
    expect(notesOf(code('C0: c#4 d e'))).toEqual(['note', 'again', 'again', 'end'])
    expect(code('C0: c d # e f\n# C0: g')).toEqual(code('C0: c d'))
  })

  it('accepts a dotted default length, and refuses a length of 0 or less', () => {
    expect(code('tempo 6\nC0: l8. c')).toEqual(code('tempo 6\nC0: c8.'))
    expect(() => compileSong('t', 'C0: l-4 c')).toThrow(/length/)
    expect(() => compileSong('t', 'C0: c r-8')).toThrow(/length/)
    expect(() => compileSong('t', 'C0: c0')).toThrow(/length/)
  })

  it('refuses a loop with nothing that takes time after L', () => {
    expect(() => compileSong('t', 'C0: c d L v10')).toThrow(/after L/)
    expect(() => compileSong('t', 'C0: c d L')).toThrow(/after L/)
    expect(code('C0: c L d')).toContain(OP.loop)
  })

  it('holds a note past 255 frames, letting it go on its own frame', () => {
    // A whole note at tempo 6 is 96 frames: four tied are 384, held whole or half.
    const a = freqOf(60)
    expect(code('tempo 6\nC0: o4 c1^1^1^1')).toEqual([
      OP.note,
      a & 0xff,
      a >> 8,
      255,
      0,
      OP.hold,
      129,
      129,
      OP.end,
    ])
    expect(code('tempo 6\nC0: o4 q4 c1^1^1^1')).toEqual([
      OP.note,
      a & 0xff,
      a >> 8,
      255,
      192,
      OP.hold,
      129,
      0,
      OP.end,
    ])
    // Over three parts (576 frames, 504 held): held through the first, let go in the second.
    expect(code('tempo 6\nC0: o4 q7 c1^1^1^1^1^1').slice(3)).toEqual([
      255,
      0,
      OP.hold,
      255,
      249,
      OP.hold,
      66,
      0,
      OP.end,
    ])
  })

  it('starts an echo with its own volume, waits for no delay of 0, and checks its numbers', () => {
    expect(code('C0: c d\necho C1 = C0 delay 3 vol -4', 1).slice(0, 4)).toEqual([
      OP.rest,
      3,
      OP.vol,
      11,
    ])
    const now = code('C0: c d\necho C1 = C0 delay 0', 1)
    expect(now.slice(0, 2)).toEqual([OP.vol, 11])
    expect(notesOf(now)).not.toContain('rest')
    expect(() => compileSong('t', 'C0: c\necho C16 = C0 delay 3')).toThrow(/C16/)
    expect(() => compileSong('t', 'C0: c\necho C1 = C99 delay 3')).toThrow(/C99/)
    expect(() => compileSong('t', 'C0: c\necho C1 = C0 delay 3 pan 99')).toThrow(/pan/)
    expect(() => compileSong('t', 'C0: c\necho C1 = C0 delay 300')).toThrow(/delay/)
  })

  it('stops a song that unrolls past what a channel holds, quickly', () => {
    const started = performance.now()
    expect(() => compileSong('t', 'C0: [[[c16]60]60]60')).toThrow(/8192/)
    expect(() => compileSong('t', 'C0: []1000000000 c')).toThrow(/8192/)
    expect(performance.now() - started).toBeLessThan(2000)
  })
})

describe("the kit's builder, refusing what would go wrong on the machine", () => {
  const ship = picture(16, 16, (x, y) => (x === y ? RED : null))
  const META: KitMeta = {
    id: 'TINY',
    name: 'TINY',
    saveBanks: 0,
    about: 'the kit test game',
    sources: ['tiny.e16.ts', { file: 'far.e16.ts', bank: 1 }],
    palettes: { png: 'palettes.png', names: ['ship', 'text'] },
    sheets: [{ name: 'ship', png: 'ship.png', cell: 16 as const, palette: 'ship', tile: 40 }],
    music: ['tiny.mml'],
  }
  type Meta = KitMeta
  const build = (change: (m: Meta) => Meta, files: Record<string, string> = {}) =>
    buildKit(
      'tests/fixtures/kit',
      change(structuredClone(META)) as never,
      {
        'palettes.png': PALETTES,
        'ship.png': ship,
        'map.png': picture(16, 8, (x) => (x >= 8 ? RED : null)),
      },
      files,
    )
  const said = (r: ReturnType<typeof build>) =>
    'errors' in r ? r.errors.map((e) => e.message).join('; ') : 'built'

  it("refuses a header readCart would not take: save RAM, the name's characters", () => {
    expect(said(build((m) => ({ ...m, saveBanks: 9 })))).toMatch(/saveBanks/)
    expect(said(build((m) => ({ ...m, name: 'TÏNY' })))).toMatch(/name/)
    expect(said(build((m) => m))).toBe('built')
  })

  it("takes a map's palette only in a background's slot, 0 to 7", () => {
    const map = (slot: number) => ({
      name: 'bg',
      png: 'map.png',
      palettes: [{ palette: 'ship', slot }],
    })
    expect(said(build((m) => ({ ...m, maps: [map(8)] })))).toMatch(/slot 8/)
    expect(said(build((m) => ({ ...m, maps: [map(7)] })))).toBe('built')
  })

  it('puts only drawn cells of a front map in front, not its clear ones', () => {
    const built = build((m) => ({
      ...m,
      maps: [{ name: 'bg', png: 'map.png', front: true, palettes: [{ palette: 'ship', slot: 3 }] }],
    }))
    if ('errors' in built) throw new Error(said(built))
    const at = (name: string) =>
      Number.parseInt(
        new RegExp(`${name} = 0x([0-9a-f]+)`).exec(built.report.assets)?.[1] ?? '',
        16,
      )
    const rows = 64 + (at('BG_MAP_BANK') - 0x100) * 8192
    const cell = (k: number) =>
      (built.image[rows + k * 2] ?? 0) | ((built.image[rows + k * 2 + 1] ?? 0) << 8)
    expect(cell(0) & 0x8000).toBe(0)
    expect(cell(1) & 0x8000).toBe(0x8000)
  })

  it("refuses a table's word that is not one, never reading it as 0", () => {
    const table = (text: string) =>
      said(build((m) => ({ ...m, tables: [{ name: 'tab', file: 't.txt' }] }), { 't.txt': text }))
    expect(table('1 2 3 # three\n-4, 0x10')).toBe('built')
    expect(table('1 two 3')).toMatch(/"two"/)
    expect(table('1 70000')).toMatch(/70000/)
    expect(table('1.5')).toMatch(/1\.5/)
  })

  it('places even an empty part inside its bank', () => {
    const layout = new Layout(1)
    layout.put(new Uint8Array(8191))
    expect(layout.put(new Uint8Array(0)).at).toBeLessThan(0xe000)
  })

  it('refuses tiles that run into another part, unless both start at the same tile', () => {
    const sheet = (name: string, tile: number) => ({
      name,
      png: 'ship.png',
      cell: 16 as const,
      palette: 'ship',
      tile,
    })
    expect(said(build((m) => ({ ...m, sheets: [...(m.sheets ?? []), sheet('two', 42)] })))).toMatch(
      /two's tiles 42-45 run into ship's 40-43/,
    )
    expect(said(build((m) => ({ ...m, sheets: [...(m.sheets ?? []), sheet('two', 40)] })))).toBe(
      'built',
    )
    expect(said(build((m) => ({ ...m, sheets: [...(m.sheets ?? []), sheet('two', 44)] })))).toBe(
      'built',
    )
  })

  it('says so when two parts make one constant, or a name is no constant', () => {
    const sheet = (name: string) => ({ name, png: 'ship.png', cell: 16 as const, palette: 'ship' })
    expect(said(build((m) => ({ ...m, sheets: [...(m.sheets ?? []), sheet('SHIP')] })))).toMatch(
      /SHIP_TILE is made twice/,
    )
    expect(said(build((m) => ({ ...m, sheets: [...(m.sheets ?? []), sheet('1up')] })))).toMatch(
      /1UP_TILE is not a name/,
    )
  })
})
