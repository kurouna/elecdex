import { readFileSync } from 'node:fs'
import { CHANNELS } from '@shared/elec16/apu'
import { readCart } from '@shared/elec16/cartridge'
import { channelFrames, compileSongs, loopFrames, type Song } from '@shared/elec16/kit/mml'
import { Elec16 } from '@shared/elec16/machine'
import { XRAM_MAX } from '@shared/elec16/map'
import { padBit } from '@shared/elec16/pad'
import { rasterLines } from '@shared/elec16/video'
import { fromBase64 } from '@shared/emu/base64'
import { describe, expect, it } from 'vitest'
import {
  buildKit,
  frames,
  globalsOf,
  pictureFile,
  ROM,
  ramPoke,
  ramWord,
  settle,
  tap,
  word,
} from './elec16-kit-helpers'

/**
 * ELECFIGHTER (docs/elec16-elecfighter-design.md), phases P0 to P3: built from its folder as
 * gen:elec16 builds it and fought on the core, from its boot log through the title, the select
 * and the versus to the ladder's end. The fighters are drawn meshes streamed into a room
 * of cells each (P3), their boxes drafted from the drawings; a test drives
 * either through the fighters' one entry (`ctl` 2 and `extHeld`, the buttons as the engine reads
 * them) or the pad, places them by their RAM, and reads the outcome there by the globals' names.
 */

const DIR = 'resources/elec16/games/elecfighter'
const meta = JSON.parse(readFileSync(`${DIR}/game.json`, 'utf8'))
const built = buildKit(DIR, meta)
if ('errors' in built) throw new Error(JSON.stringify(built.errors))
const cart = built.image
const at = globalsOf(built.report.asm)
const assetsText = built.report.assets
const asmText = built.report.asm
const addr = (name: string) => {
  const a = at.get(name)
  if (a === undefined) throw new Error(`no ${name}`)
  return a
}
const read = (m: Elec16, name: string, k = 0) => ramWord(m, addr(name) + k * 2)
const put = (m: Elec16, name: string, v: number, k = 0) => ramPoke(m, addr(name) + k * 2, v)

/** The engine's buttons (input.e16.ts), its states (fighter.e16.ts), its phases (main.e16.ts). */
const I = { up: 1, down: 2, back: 4, fwd: 8, lp: 16, hp: 32, lk: 64, hk: 128 }
const ST = { stand: 0, crouch: 1, prejump: 2, jump: 3, land: 4, attack: 5, hit: 6, guard: 7 }
const ST2 = { down: 8, wake: 9, dead: 10, throw: 11, thrown: 12, dash: 13, backdash: 14 }
const PH = { round: 0, fight: 1, over: 2, end: 3 }
/** The screens (engine/main.e16.ts `screen`), design 5.4's. */
const SC = { boot: 1, title: 2, controls: 3, select: 4, versus: 5, fight: 6, result: 7 }
const SC2 = { cont: 8, over: 9, clear: 10, best: 11 }
/** The moves' rows (moves.txt). */
const MV = { sLP: 0, sHP: 1, sLK: 2, sHK: 3, cLP: 4, cHP: 5, cLK: 6, cHK: 7, jLP: 8, jHP: 9 }
const MV2 = { jLK: 10, jHK: 11, throw: 12 }
const C = { startup: 0, active: 1, recovery: 2, damage: 3, hitstun: 5, blockstun: 6, stop: 7 }
const C2 = { height: 10, kind: 11, flags: 12 }

/** A slot's tables, as moves.txt, profile.txt and poses.txt hold them. */
function table(file: string, width: number): number[][] {
  const words = readFileSync(`${DIR}/${file}`, 'utf8')
    .replace(/#.*$/gm, '')
    .split(/\s+/)
    .filter(Boolean)
    .map(Number)
  const rows: number[][] = []
  for (let k = 0; k < words.length; k += width) rows.push(words.slice(k, k + width))
  return rows
}
const SLOT_IDS = ['s1', 's2', 's3', 's4']
const moves = SLOT_IDS.map((s) => table(`fighters/${s}/moves.txt`, 16))
const profiles = SLOT_IDS.map((s) => table(`fighters/${s}/profile.txt`, 16)[0] ?? [])
const S1 = moves[0] ?? []
const row = (m: number) => S1[m] ?? []

/** The ladder's last place, ROOT (cpu/opponents.txt's MIRROR): P1's own slot against it. */
const MIRROR = 3

const CLOCK = { second: 12, minute: 34, hour: 5, day: 8, month: 10, year: 2026, weekday: 4 }

/** PLAY-320 with the clock at `clock` (and `save` in its save RAM), the cartridge started. */
function power(clock = CLOCK, save?: Uint8Array): Elec16 {
  const m = Elec16.boot(ROM.image, 'play-320', undefined, XRAM_MAX)
  m.setClock(clock)
  settle(m, cart)
  if (save !== undefined) m.insertCart(cart, new Uint8Array(32), save)
  tap(m, padBit('start'), cart)
  return m
}

/** Frames until the screen is `sc`, at most `n`. */
function until(m: Elec16, sc: number, n = 600): void {
  for (let k = 0; k < n && read(m, 'screen') !== sc; k++) frames(m, 1, cart)
  expect(read(m, 'screen')).toBe(sc)
}

/** The cartridge started and its boot log skipped with START: the title. */
function boot(clock = CLOCK, save?: Uint8Array): Elec16 {
  const m = power(clock, save)
  expect(read(m, 'screen')).toBe(SC.boot)
  tap(m, padBit('start'), cart)
  until(m, SC.title, 20)
  return m
}

/** From the title: START, VERSUS CPU (the controls the first time, START past them), the select. */
function toSelect(m: Elec16): void {
  tap(m, padBit('start'), cart)
  tap(m, padBit('a'), cart)
  if (read(m, 'screen') === SC.controls) tap(m, padBit('start'), cart)
  until(m, SC.select, 4)
}

/**
 * From the title to the fight: the select's cursor starts on P1's `slot` (S1 BALANCE unless said)
 * and A takes it; the ladder from its place `at` (0 the first, PACKET in S2 RUSH, for S1); the
 * versus and the round's banner go by until the fight begins, each side driven as `drive` says
 * (2 from outside, 1 the CPU). From a machine at its title, or a clock to boot one by.
 */
function fight(
  from: Elec16 | typeof CLOCK = CLOCK,
  drive: [number, number] = [2, 2],
  slot = 0,
  at = 0,
): Elec16 {
  if (from instanceof Elec16) return fightFrom(from, drive, slot, at)
  // A fight from a clock is played from its first frame once, kept as the core's snapshot and
  // restored for each test that asks for it again: the boot log, the menus, the versus and the
  // round's banner cost a fifth of a second each time (a test checks that a restored machine
  // plays on as the one it was taken from).
  const key = JSON.stringify([from, drive, slot, at])
  let bytes = FOUGHT.get(key)
  if (bytes === undefined) {
    bytes = fightFrom(boot(from), drive, slot, at).snapshot()
    FOUGHT.set(key, bytes)
  }
  return again(bytes)
}

/** Fights begun, as snapshots, by the clock, the drive, the slot and the place they began from. */
const FOUGHT = new Map<string, Uint8Array>()

/** A machine back from its snapshot, the cartridge's ROM put back in its slot. */
function again(bytes: Uint8Array): Elec16 {
  const m = Elec16.restore(ROM.image, bytes)
  if (m === null || !m.attachCartRom(cart, new Uint8Array(32))) throw new Error('no snapshot')
  return m
}

function fightFrom(m: Elec16, drive: [number, number], slot: number, at: number): Elec16 {
  put(m, 'choice', slot, 0)
  put(m, 'choice', at, 1)
  toSelect(m)
  tap(m, padBit('a'), cart)
  put(m, 'ctl', drive[0], 0)
  put(m, 'ctl', drive[1], 1)
  for (let k = 0; k < 400 && (read(m, 'screen') !== SC.fight || read(m, 'phase') !== PH.fight); k++)
    frames(m, 1, cart)
  expect(read(m, 'phase')).toBe(PH.fight)
  return m
}

/** One frame with these buttons held by P1 and P2 (both driven from outside). */
function step(m: Elec16, h0 = 0, h1 = 0): void {
  put(m, 'extHeld', h0, 0)
  put(m, 'extHeld', h1, 1)
  frames(m, 1, cart)
}

function steps(m: Elec16, n: number, h0 = 0, h1 = 0): void {
  for (let k = 0; k < n; k++) step(m, h0, h1)
}

/**
 * The two placed `apart` points from the middle each (P1 left, facing right), standing; their
 * last frame's place in `was` too. A frame passes with nothing held so the poses settle.
 */
function place(m: Elec16, x0: number, x1: number): void {
  for (const i of [0, 1]) {
    put(m, 'fX', (i === 0 ? x0 : x1) * 16, i)
    put(m, 'was', (i === 0 ? x0 : x1) * 16, i)
    put(m, 'fY', 0, i)
    put(m, 'fAir', 0, i)
    put(m, 'fState', ST.stand, i)
    put(m, 'fStun', 0, i)
    put(m, 'fPush', 0, i)
  }
  put(m, 'fFace', x0 < x1 ? 1 : 0, 0)
  put(m, 'fFace', x0 < x1 ? 0 : 1, 1)
  put(m, 'hitstop', 0)
  step(m)
}

/** Frames until fighter `i` is free (standing or crouching), at most `n`. */
function untilFree(m: Elec16, i: number, n: number, h0 = 0, h1 = 0): number {
  for (let k = 0; k < n; k++) {
    const st = read(m, 'fState', i)
    if (st === ST.stand || st === ST.crouch) return k
    step(m, h0, h1)
  }
  return n
}

/** The game's RAM: its globals and arrays (0280-1FFF). */
const globals = (m: Elec16) => m.state.ram.slice(0x280, 0x2000)

/** Video memory's sprite table: how many sprites cover each of the screen's 288 lines. */
function perLine(m: Elec16): number[] {
  const mem = m.state.video?.mem ?? new Uint8Array()
  const lines = new Array<number>(288).fill(0)
  for (let k = 0; k < 128; k++) {
    const w = (n: number) =>
      (mem[0xc000 + k * 8 + n * 2] ?? 0) | ((mem[0xc000 + k * 8 + n * 2 + 1] ?? 0) << 8)
    const size = w(3) & 3
    if (size === 3) continue
    const y = (w(1) << 16) >> 16
    const h = 8 << size
    for (let l = Math.max(0, y); l < Math.min(288, y + h); l++) lines[l] = (lines[l] ?? 0) + 1
  }
  return lines
}

describe('ELECFIGHTER as built', () => {
  it('is what games.json holds (on the shelf from P3), and its folder keeps its build', () => {
    expect(readFileSync(`${DIR}/assets.e16.ts`, 'utf8')).toBe(built.report.assets)
    expect(readFileSync(`${DIR}/compiled.s`, 'utf8')).toBe(built.report.asm)
    expect(readCart(cart)).toMatchObject({ id: 'ELECFIGHTER', name: 'ELECFIGHTER', saveBanks: 1 })
    expect(meta.shelf).toBeUndefined()
    const file = JSON.parse(readFileSync('resources/elec16/games/games.json', 'utf8'))
    const images = file.games.map((g: { data: string }) => fromBase64(g.data) ?? new Uint8Array())
    expect(images.find((i: Uint8Array) => readCart(i)?.id === 'ELECFIGHTER')).toEqual(cart)
  })

  it("keeps its code within RAM's 20 KB, its globals below the code, its tiles within 1,024", () => {
    // Measured 2026-10-08 with the screens and the sound (P3): 18,986 bytes of RAM's 20,480 (the
    // kit's sound in RAM, the screens in banks 5-7); 19,304 at P4's balance, 19,206 after the
    // review (the banners' letter lookup and their small words moved to banks 3 and 1). The
    // globals fill their area (0280-1FFF) to within a few bytes: a new array must free its room.
    expect(built.report.ramCode).toBeLessThanOrEqual(20 * 1024)
    expect(built.report.tiles).toBeLessThanOrEqual(1024)
    expect(Math.max(...at.values())).toBeLessThan(0x2000)
  })

  it('has every slot a full table: 13 moves of 16 words, in range, a profile, and the same poses', () => {
    for (const [s, rows] of moves.entries()) {
      expect(rows.length, SLOT_IDS[s]).toBe(13)
      for (const r of rows) moveInRange(r)
      expect(profiles[s]?.length).toBe(16)
      const poses = table(`fighters/${SLOT_IDS[s]}/poses.txt`, 24)
      // The common rows, three for each move, then the rows of the picture alone (walk, fall,
      // dashes, thrown, win, idle).
      expect(poses.length).toBe(12 + 13 * 3 + 10)
      for (const [n, p] of poses.entries()) poseSound(n, p)
    }
  })
})

/** A move's row: 16 words, its startup 1-30, some active frames, a height 1-4. */
function moveInRange(r: number[]): void {
  expect(r.length).toBe(16)
  expect(r[C.startup]).toBeGreaterThanOrEqual(1)
  expect(r[C.startup]).toBeLessThanOrEqual(30)
  expect(r[C.active]).toBeGreaterThanOrEqual(1)
  expect(r[C2.height]).toBeGreaterThanOrEqual(1)
  expect(r[C2.height]).toBeLessThanOrEqual(4)
  // The columns kept for later (chip damage, a move's sound) and the flag kept (8): read by
  // nothing, so 0 until something reads them.
  expect([r[4], r[15], (r[C2.flags] ?? 0) & 8]).toEqual([0, 0, 0])
}

/** The poses in the air (the jump, a falling hit, the jump attacks'): above the feet. */
const AIR_POSES = new Set([3, 11, 55, ...Array.from({ length: 12 }, (_, k) => 36 + k)])

/**
 * Pose `n`'s boxes: each drawn as sprites is at least 8 points each way, and a pose on the
 * ground that can be struck can be struck down to its feet.
 */
function poseSound(n: number, p: number[]): void {
  const box = (b: number) => p.slice(b * 4, b * 4 + 4) as [number, number, number, number]
  const hurt = [1, 2, 3].map(box).filter((b) => b[2] !== 0)
  if (!AIR_POSES.has(n) && hurt.length > 0) {
    expect(Math.min(...hurt.map((b) => b[1] - b[3])), `pose ${n}`).toBe(0)
  }
  for (const b of [0, 1, 2, 3, 4, 5].map(box).filter((b) => b[2] !== 0)) {
    expect(Math.min(b[2], b[3])).toBeGreaterThanOrEqual(8)
  }
}

/** The stage GRID's numbers, as stages/grid/stage.txt holds them (design 4.1). */
function stageNumbers() {
  const w = readFileSync(`${DIR}/stages/grid/stage.txt`, 'utf8')
    .replace(/#.*$/gm, '')
    .split(/\s+/)
    .filter(Boolean)
    .map(Number)
  const [palette, music, horizon, ground, raster, center, last] = w as number[]
  return {
    palette,
    music,
    horizon: horizon ?? 0,
    ground: ground ?? 0,
    raster,
    center: center ?? 0,
    last: last ?? 0,
    bands: w.slice(7, 43),
    lines: w.slice(43),
  }
}

describe('ELECFIGHTER the stage (design 4.1, 4.2)', () => {
  const st = stageNumbers()
  const constant = (name: string) =>
    Number(new RegExp(`export const ${name} = (0x[0-9a-f]+)`).exec(built.report.assets)?.[1])

  it('draws GRID within its 320 tiles, its floor a line at a time from the horizon to the bottom', () => {
    expect(constant('GRID_TILES_BYTES') / 32).toBeLessThanOrEqual(320)
    expect(constant('GRID_W') * 8).toBe(512)
    expect([st.horizon, st.ground, st.raster, st.center, st.last]).toEqual([168, 244, 2, 96, 287])
    expect(st.bands).toHaveLength(36)
    // The skyline a quarter of the camera's move, the platform's rim a half.
    expect(st.bands.slice(0, 20).every((b) => b === 4)).toBe(true)
    expect(st.bands[20]).toBe(8)
    // The floor: 0.6 at the horizon, 1.0 on the foot line (the fighters' feet), more below.
    expect(st.lines).toHaveLength(st.last - st.horizon + 1)
    expect(st.lines[0]).toBe(154)
    expect(st.lines[st.ground - st.horizon]).toBe(256)
    for (let k = 1; k < st.lines.length; k++) {
      expect(st.lines[k] ?? 0).toBeGreaterThanOrEqual(st.lines[k - 1] ?? 0)
    }
  })

  it("loads the stage the opponent's row names, every row naming a stage there is", () => {
    const rows = table('cpu/opponents.txt', 32)
    for (const r of rows) expect(r[1]).toBeLessThan(1)
    const m = fight()
    expect(read(m, 'stageNow')).toBe(rows[0]?.[1])
    // The runtime's raster(2), the floor's lines from the horizon to the last.
    expect([word(m, 0x0204), word(m, 0x020c), word(m, 0x020e)]).toEqual([2, 168, 287])
  })

  it('puts each band and floor line at its share of the camera, the foot line with the fighters', () => {
    const m = fight()
    for (const [x0, x1] of [
      [100, 200],
      [300, 450],
      [250, 300],
      [200, 312],
    ]) {
      place(m, x0 ?? 0, x1 ?? 0)
      frames(m, 3, cart)
      const cam = read(m, 'camX')
      const last = m.state.video?.tiles.last
      if (last === undefined) throw new Error('no video')
      const got = rasterLines(last).map((r) => r.scroll[0])
      const at = (share: number, bits: number) =>
        (st.center + Math.floor(((cam - st.center) * share) / 2 ** bits)) & 511
      const want = Array.from({ length: 288 }, (_, y) =>
        y < st.horizon ? at(st.bands[y >> 3] ?? 0, 4) : at(st.lines[y - st.horizon] ?? 0, 8),
      )
      expect(got, `camera ${cam}`).toEqual(want)
      expect(got[st.ground]).toBe(cam)
    }
  })
})

/** A slot's art: its cells (indices by the P1 palette), its rows, its boxes and its limbs. */
function slotArt(s: string) {
  const pal = palettesPicture()[3] ?? []
  const pic = pictureFile(`${DIR}/fighters/${s}/art/cells.png`)
  if (pic === null) throw new Error(`no cells for ${s}`)
  const across = pic.width / 16
  const index = new Map<string, number>()
  pal.forEach((c, i) => {
    if (i > 0) index.set(c.join(','), i)
  })
  const cell = (f: number, x: number, y: number) => {
    const at = ((Math.floor(f / across) * 16 + y) * pic.width + (f % across) * 16 + x) * 4
    if ((pic.data[at + 3] ?? 0) < 128) return 0
    const k = index.get([0, 1, 2].map((j) => pic.data[at + j] ?? 0).join(','))
    if (k === undefined) throw new Error(`${s}: a point of cell ${f} is not in the P1 palette`)
    return k
  }
  const rows = table(`fighters/${s}/art.txt`, 34)
  /** Row `r`'s picture: points by place from the feet (x right, y down), facing right. */
  const picture = (r: number) => {
    const row = rows[r] ?? []
    const pts = new Map<string, number>()
    for (let c = 0; c < (row[1] ?? 0); c++) {
      const w = row[2 + c] ?? 0
      cellInto(pts, (x, y) => cell((row[0] ?? 0) + c, x, y), (w << 24) >> 24, (w << 16) >> 24)
    }
    return pts
  }
  return {
    rows,
    picture,
    cell,
    frames: (pic.width / 16) * (pic.height / 16),
    boxes: table(`fighters/${s}/poses.txt`, 24),
    limbs: table(`fighters/${s}/limbs.txt`, 5),
  }
}

/** The palette picture's rows: 16 colours each. */
function palettesPicture(): number[][][] {
  const p = pictureFile(`${DIR}/art/palettes.png`)
  if (p === null) throw new Error('no palettes')
  return Array.from({ length: p.height }, (_, y) =>
    Array.from({ length: 16 }, (_, x) => [0, 1, 2].map((k) => p.data[(y * 16 + x) * 4 + k] ?? 0)),
  )
}

/** A cell's drawn points into a picture, its top left at (dx, dy). */
function cellInto(
  pts: Map<string, number>,
  cell: (x: number, y: number) => number,
  dx: number,
  dy: number,
): void {
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const v = cell(x, y)
      if (v) pts.set(`${dx + x},${dy + y}`, v)
    }
}

const AROUND = [-1, 0, 1]
  .flatMap((dy) => [-1, 0, 1].map((dx) => [dx, dy]))
  .filter(([x, y]) => x || y)

/** Points of a picture with no neighbour of their colour in 8 directions. */
function isolatedIn(pts: Map<string, number>): number {
  let n = 0
  for (const [k, v] of pts) {
    const [x, y] = k.split(',').map(Number) as [number, number]
    if (!AROUND.some(([dx, dy]) => pts.get(`${x + (dx ?? 0)},${y + (dy ?? 0)}`) === v)) n++
  }
  return n
}

/** The share of two silhouettes' points (feet on feet) that only one of them covers. */
function apartShare(a: Map<string, number>, b: Map<string, number>): number {
  let both = 0
  for (const k of a.keys()) if (b.has(k)) both++
  const union = a.size + b.size - both
  return (union - both) / union
}

/** A picture's points inside a box (x, top, w, h; a point at y covers height -y - 1). */
function pointsIn(pts: Map<string, number>, bx: number, bt: number, bw: number, bh: number) {
  let n = 0
  for (const k of pts.keys()) {
    const [px, py] = k.split(',').map(Number) as [number, number]
    if (px >= bx && px < bx + bw && -py - 1 < bt && -py - 1 >= bt - bh) n++
  }
  return n
}

const ARTS = SLOT_IDS.map(slotArt)
/** The active rows of the standing light and heavy punch and kick (poses.txt). */
const ROW = { sLP: 13, sHP: 16, sLK: 19, sHK: 22 }

/** Fighter `i`'s slot's art (as `fSlot` says). */
function slotArtOf(m: Elec16, i: number) {
  const k = read(m, 'fSlot', i)
  const art = ARTS[k]
  if (art === undefined) throw new Error(`no slot ${k}`)
  return art
}

/** A cell's 256 indices in the order video memory holds them: four tiles, two points a byte. */
function cellTiles(cell: (x: number, y: number) => number): number[] {
  const out: number[] = []
  for (const [tx, ty] of [
    [0, 0],
    [8, 0],
    [0, 8],
    [8, 8],
  ] as const)
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 8; x += 2)
        out.push((cell(tx + x, ty + y) << 4) | cell(tx + x + 1, ty + y))
  return out
}

describe('ELECFIGHTER the art (P3, design 2)', () => {
  it('tells the light from the heavy at 1x by its silhouette alone', () => {
    // Measured 2026-10-08 (scripts/elecfighter/pose-book.mjs): punches 0.57-0.76 of the points
    // apart, kicks 0.64-0.70. The first mock's punches, which read alike at 1x (design 16), were
    // 0.34-0.43 and its kicks, which read apart, 0.70-0.81: 0.45 is above every pair that did not
    // read.
    for (const art of ARTS) {
      expect(apartShare(art.picture(ROW.sLP), art.picture(ROW.sHP))).toBeGreaterThanOrEqual(0.45)
      expect(apartShare(art.picture(ROW.sLK), art.picture(ROW.sHK))).toBeGreaterThanOrEqual(0.45)
    }
  })

  it('leaves no point alone in any picture, and every picture within its room of 32 cells', () => {
    for (const [s, art] of ARTS.entries()) {
      // The pose rows, then the KO's pieces cut from the down pose and from the falling one.
      expect(art.rows.length, SLOT_IDS[s]).toBe(63)
      for (const [r, row] of art.rows.entries()) {
        const [first = 0, count = 0] = row
        expect(count, `${SLOT_IDS[s]} row ${r}`).toBeGreaterThan(0)
        expect(count).toBeLessThanOrEqual(32)
        expect(first + count).toBeLessThanOrEqual(art.frames)
      }
      // The pose rows (the last two are the KO's pieces, each a piece of its own).
      for (let r = 0; r < 61; r++) expect(isolatedIn(art.picture(r)), `row ${r}`).toBe(0)
    }
  })

  it('gives every slot the palette roles; P1 and the CPU differ only in the fills 3-11', () => {
    const rows = palettesPicture()
    const names = meta.palettes.names as string[]
    const p1 = rows[names.indexOf('p1')] ?? []
    const cpu = rows[names.indexOf('cpu')] ?? []
    const fills = [3, 4, 5, 6, 7, 8, 9, 10, 11]
    for (const k of fills) expect(cpu[k], `colour ${k}`).not.toEqual(p1[k])
    for (const k of [0, 1, 2, 12, 13, 14, 15]) expect(cpu[k], `colour ${k}`).toEqual(p1[k])
    // P1 blue, the CPU red: the suit's lit fill.
    const [r1, , b1] = p1[3] ?? []
    const [r2, , b2] = cpu[3] ?? []
    expect(b1 ?? 0).toBeGreaterThan(r1 ?? 0)
    expect(r2 ?? 0).toBeGreaterThan(b2 ?? 0)
    // Every slot's cells are drawn in the one palette (the build matched every point to it).
    for (const s of SLOT_IDS) {
      expect(meta.sheets.find((x: { name: string }) => x.name === s)?.palette).toBe('p1')
    }
  })

  it('tells the same body on both sides apart by the fill alone, the wire the common one', () => {
    // User decision: P1 and the CPU differ by their fills only, ROOT's match too (found in review
    // 2026-10-08: a palette of the mirror's own turned the CPU's wire amber).
    expect(meta.palettes.names).not.toContain('mirror')
    const m = fight(CLOCK, [2, 2], 0, MIRROR)
    for (const k of [1, 2, 12, 13, 14, 15]) expect(kept(m, 9, k), `colour ${k}`).toBe(kept(m, 8, k))
    for (let k = 3; k <= 11; k++) expect(kept(m, 9, k), `colour ${k}`).not.toBe(kept(m, 8, k))
  })

  it('lays every hit box on the striking limb: within 2 points of it, on its drawn points', () => {
    for (const [s, art] of ARTS.entries()) {
      for (const [r, x, top, w, h] of art.limbs as [number, number, number, number, number][]) {
        const [bx, bt, bw, bh] = (art.boxes[r] ?? []).slice(16, 20) as [
          number,
          number,
          number,
          number,
        ]
        const at = `${SLOT_IDS[s]} row ${r}`
        expect(bw, at).toBeGreaterThan(0)
        expect(bx, at).toBeGreaterThanOrEqual(x - 2)
        expect(bx + bw, at).toBeLessThanOrEqual(x + w + 2)
        expect(bt, at).toBeLessThanOrEqual(top + 2)
        expect(bt - bh, at).toBeGreaterThanOrEqual(Math.max(0, top - h) - 2)
        expect(pointsIn(art.picture(r), bx, bt, bw, bh), at).toBeGreaterThan(20)
      }
      // Every striking row has its limb measured.
      expect(art.limbs.length).toBe(13)
    }
  })

  it('fits the cartridge and video memory: rooms, effects and stage within 1,024 tiles, 1 MB', () => {
    // Measured 2026-10-08: 59 banks (472 KB of 1,024; the four slots' cells 330 KB), 710 tiles.
    // With the screens and the sound (P3): 70 banks (560 KB), 932 tiles - the stage, the title's
    // map and the busts sharing one place (never shown together).
    expect(built.report.banks).toBeLessThanOrEqual(128)
    expect(built.report.banks).toBeLessThanOrEqual(72)
    expect(built.report.tiles).toBeLessThanOrEqual(1024)
    // Two rooms of 32 cells (4 tiles each) from the first slot's sheet, the others none.
    const constant = (name: string) =>
      Number(new RegExp(`export const ${name} = (0x[0-9a-f]+)`).exec(built.report.assets)?.[1])
    expect(constant('S1_BYTES')).toBe(2 * 32 * 128)
    expect(constant('S2_BYTES')).toBe(0)
  })

  it("streams the pose into its room: the sprites show the row's cells, mirrored facing left", () => {
    const m = fight()
    place(m, 236, 300)
    steps(m, 3)
    const mem = m.state.video?.mem ?? new Uint8Array()
    const room = Number(/export const S1_TILE = (0x[0-9a-f]+)/.exec(built.report.assets)?.[1])
    // P2's room holds its pose's first cell as the sheet has it.
    const art = slotArtOf(m, 1)
    const row = art.rows[read(m, 'fPose', 1)] ?? []
    const at = (room + 128) * 32
    const first = row[0] ?? 0
    expect([...mem.subarray(at, at + 128)]).toEqual(cellTiles((x, y) => art.cell(first, x, y)))
    // Its sprites carry FLIP_H (P2 faces left) and palette slot 9; P1's slot 8, unflipped.
    const tileWord = (k: number) =>
      (mem[0xc000 + k * 8 + 4] ?? 0) | ((mem[0xc000 + k * 8 + 5] ?? 0) << 8)
    const shown = (k: number) => ((mem[0xc000 + k * 8 + 6] ?? 0) & 3) !== 3
    const words = Array.from({ length: 128 }, (_, k) => k)
      .filter(shown)
      .map(tileWord)
    const p2 = words.filter((t) => (t & 0x3ff) >= room + 128 && (t & 0x3ff) < room + 256)
    const p1 = words.filter((t) => (t & 0x3ff) >= room && (t & 0x3ff) < room + 128)
    expect(p2.length).toBe(row[1])
    expect(p2.every((t) => (t & 0x2000) !== 0 && ((t >> 10) & 7) === 1)).toBe(true)
    expect(p1.length).toBeGreaterThan(0)
    expect(p1.every((t) => (t & 0x2000) === 0 && ((t >> 10) & 7) === 0)).toBe(true)
  })

  it('keeps the walls clean: the floor columns read round the map hold only rows, not depth lines', () => {
    const st = stageNumbers()
    const p = pictureFile(`${DIR}/stages/grid/art/stage.png`)
    if (p === null) throw new Error('no stage')
    const at = (x: number, y: number) =>
      [0, 1, 2, 3].map((k) => p.data[(y * p.width + x) * 4 + k] ?? 0).join(',')
    for (let y = st.ground + 1; y < 288; y++) {
      const share = (st.lines[y - st.horizon] ?? 0) / 256
      const n = Math.ceil(st.center * (share - 1)) + 1
      const row = at(128, y)
      for (let k = 0; k < n; k++) {
        expect(at(k, y), `(${k}, ${y})`).toBe(row)
        expect(at(511 - k, y), `(${511 - k}, ${y})`).toBe(row)
      }
    }
  })
})

describe('ELECFIGHTER frame data (design 7.7)', () => {
  it('has every light start sooner than every heavy, in every slot', () => {
    for (const rows of moves) {
      const light = rows.slice(0, 12).filter((r) => ((r[C2.kind] ?? 0) & 2) === 0)
      const heavy = rows.slice(0, 12).filter((r) => ((r[C2.kind] ?? 0) & 2) !== 0)
      const slowestLight = Math.max(...light.map((r) => r[C.startup] ?? 0))
      const fastestHeavy = Math.min(...heavy.map((r) => r[C.startup] ?? 0))
      expect(slowestLight).toBeLessThan(fastestHeavy)
    }
  })

  it('leaves a guarded light about even and a guarded heavy at -6 or worse, as computed', () => {
    const blocked = (r: number[]) =>
      (r[C.blockstun] ?? 0) - ((r[C.active] ?? 0) - 1 + (r[C.recovery] ?? 0))
    for (const rows of moves) {
      for (const m of [MV.sLP, MV.sLK, MV.cLP, MV.cLK]) {
        expect(blocked(rows[m] ?? [])).toBeGreaterThanOrEqual(-2)
        expect(blocked(rows[m] ?? [])).toBeLessThanOrEqual(0)
      }
      for (const m of [MV.sHP, MV.sHK, MV.cHP, MV.cHK]) {
        expect(blocked(rows[m] ?? [])).toBeLessThanOrEqual(-6)
      }
    }
    // S1's as the design's table has them.
    expect(
      [MV.sLP, MV.sHP, MV.sLK, MV.sHK, MV.cLP, MV.cHP, MV.cLK, MV.cHK].map((m) => blocked(row(m))),
    ).toEqual([0, -6, -2, -8, 0, -9, -2, -12])
  })

  it('measures on the core what the table computes: the light strikes first, the frames after a guard', () => {
    // From the press to the strike: the startup, in frames.
    const strikeAfter = (button: number) => {
      const m = fight()
      place(m, 236, 276)
      for (let k = 1; k <= 30; k++) {
        step(m, k === 1 ? button : 0, 0)
        if (read(m, 'struck', 0) !== 0) return k
      }
      return 99
    }
    expect(strikeAfter(I.lp)).toBe(row(MV.sLP)[C.startup])
    expect(strikeAfter(I.hp)).toBe(row(MV.sHP)[C.startup])
    // Guarded: who is free first, and by how many frames (the hitstop stops both alike).
    for (const [move, button] of [
      [MV.sLP, I.lp],
      [MV.sHP, I.hp],
      [MV.sLK, I.lk],
      [MV.sHK, I.hk],
    ] as const) {
      const r = row(move)
      const expected = (r[C.blockstun] ?? 0) - ((r[C.active] ?? 0) - 1 + (r[C.recovery] ?? 0))
      expect(guardedBy(button), `move ${move}`).toBe(expected)
    }
  })
})

/** P1's `button` guarded by P2: the frames P1 is free before P2, not counting the hitstop. */
function guardedBy(button: number): number {
  const m = fight()
  place(m, 236, 276)
  step(m, button, I.back)
  for (let k = 0; k < 30 && read(m, 'struck', 0) === 0; k++) step(m, 0, I.back)
  expect(read(m, 'struck', 0)).toBe(2)
  const free = [-1, -1]
  let t = 0
  for (let n = 0; n < 80 && Math.min(...free) < 0; n++) {
    const stopped = read(m, 'hitstop') > 0
    step(m, 0, I.back)
    if (!stopped) t++
    for (const i of [0, 1]) {
      const st = read(m, 'fState', i)
      if (free[i] === -1 && (st === ST.stand || st === ST.crouch)) free[i] = t
    }
  }
  return (free[1] ?? 0) - (free[0] ?? 0)
}

describe('ELECFIGHTER moving (P0)', () => {
  it('walks forward and back as seen from the opponent, at the slot speeds', () => {
    const m = fight()
    place(m, 200, 300)
    const x = read(m, 'fX', 0)
    steps(m, 10, I.fwd)
    expect(read(m, 'fX', 0) - x).toBe(10 * (profiles[0]?.[2] ?? 0))
    const y = read(m, 'fX', 0)
    steps(m, 10, I.back)
    expect(y - read(m, 'fX', 0)).toBe(10 * (profiles[0]?.[3] ?? 0))
    // With P1 on the right, the pad's right is back.
    const n = fight(CLOCK, [0, 2])
    place(n, 300, 200)
    const z = read(n, 'fX', 0)
    n.pad(padBit('right'))
    frames(n, 10, cart)
    n.pad(0)
    expect(read(n, 'fFace', 0)).toBe(0)
    expect(read(n, 'fX', 0) - z).toBe(10 * (profiles[0]?.[3] ?? 0))
  })

  it('crouches in place with down held', () => {
    const m = fight()
    place(m, 200, 300)
    const x = read(m, 'fX', 0)
    steps(m, 5, I.down | I.fwd)
    expect(read(m, 'fState', 0)).toBe(ST.crouch)
    expect(read(m, 'fX', 0)).toBe(x)
  })

  it('jumps to its apex and lands: three frames crouched before, three after', () => {
    const m = fight()
    place(m, 150, 350)
    const vy = profiles[0]?.[4] ?? 0
    const g = profiles[0]?.[5] ?? 0
    let apex = 0
    for (let v = vy - g; v > 0; v -= g) apex += v
    step(m, I.up)
    expect(read(m, 'fState', 0)).toBe(ST.prejump)
    steps(m, 2)
    expect(read(m, 'fAir', 0)).toBe(0)
    step(m)
    expect(read(m, 'fAir', 0)).toBe(1)
    let high = 0
    let air = 1
    while (read(m, 'fAir', 0) === 1 && air < 80) {
      high = Math.max(high, read(m, 'fY', 0))
      step(m)
      air++
    }
    expect(high).toBe(apex)
    expect(apex / 16).toBeGreaterThan(60)
    expect(apex / 16).toBeLessThan(72)
    expect(read(m, 'fState', 0)).toBe(ST.land)
    expect(untilFree(m, 0, 10)).toBe(3)
  })

  it('jumps over the other: lands on its far side, both turned round, apart', () => {
    const m = fight()
    place(m, 230, 270)
    step(m, I.up | I.fwd)
    steps(m, 60)
    expect(read(m, 'fX', 0)).toBeGreaterThan(read(m, 'fX', 1))
    expect(read(m, 'fFace', 0)).toBe(0)
    expect(read(m, 'fFace', 1)).toBe(1)
    const gap = (read(m, 'fX', 0) - read(m, 'fX', 1)) / 16
    expect(gap).toBeGreaterThanOrEqual(28)
  })

  it('stops at the walls and never stands more than 256 points apart', () => {
    const m = fight()
    place(m, 200, 300)
    for (let k = 0; k < 300; k++) {
      step(m, I.back, I.back)
      const a = read(m, 'fX', 0)
      const b = read(m, 'fX', 1)
      expect(Math.abs(b - a)).toBeLessThanOrEqual(256 * 16)
      expect(a).toBeGreaterThanOrEqual((32 + 14) * 16)
      expect(b).toBeLessThanOrEqual((480 - 16) * 16)
    }
    expect(read(m, 'fX', 1) - read(m, 'fX', 0)).toBe(256 * 16)
    // One alone walks back to the wall.
    place(m, 200, 300)
    steps(m, 200, I.back)
    // S1's body is 36 points wide (fighters/s1/boxes.txt): its half from the wall.
    expect(read(m, 'fX', 0)).toBe((32 + 18) * 16)
  })

  it('pushes bodies apart on the ground, half each, and the camera follows the middle', () => {
    const m = fight()
    place(m, 250, 262)
    // S1 BALANCE's half body (14) and the first opponent's, PACKET in S2 RUSH (13).
    expect(read(m, 'fX', 1) - read(m, 'fX', 0)).toBeGreaterThanOrEqual((14 + 13) * 16)
    place(m, 100, 200)
    expect(read(m, 'camX')).toBe(0)
    place(m, 300, 450)
    expect(read(m, 'camX')).toBe(192)
    place(m, 250, 300)
    expect(read(m, 'camX')).toBe(275 - 160)
  })

  it('keeps z and its speed 0 through a whole match of the stand-ins', () => {
    const m = fight(CLOCK, [1, 1])
    for (let k = 0; k < 1500 && read(m, 'outcome') === 0; k++) {
      frames(m, 1, cart)
      for (const i of [0, 1]) {
        expect(read(m, 'fZ', i)).toBe(0)
        expect(read(m, 'fVZ', i)).toBe(0)
      }
    }
  })

  it('changes nothing for L and R', () => {
    const run = (extra: number) => {
      const m = fight(CLOCK, [0, 2])
      const pads = [padBit('right'), padBit('y'), 0, padBit('down') | padBit('b'), padBit('up'), 0]
      for (let k = 0; k < 240; k++) {
        m.pad((pads[(k >> 3) % pads.length] ?? 0) | (k % 5 < 2 ? extra : 0))
        put(m, 'extHeld', k % 40 < 20 ? I.fwd : I.lp, 1)
        frames(m, 1, cart)
      }
      const ram = globals(m)
      // The kit's raw pad (what was held and pressed) is the one thing that may differ.
      for (const name of ['padIs', 'padWas', 'padDown']) {
        const a = addr(name) - 0x280
        ram[a] = 0
        ram[a + 1] = 0
      }
      return ram
    }
    expect(run(padBit('l') | padBit('r'))).toEqual(run(0))
  })

  it('switches the button set with SELECT: B is the light kick in TYPE A, the heavy in TYPE B', () => {
    const kick = (select: boolean) => {
      const m = boot()
      if (select) tap(m, padBit('select'), cart)
      const n = fight(m, [0, 2])
      place(n, 150, 350)
      tap(n, padBit('b'), cart)
      return read(n, 'fMove', 0)
    }
    expect(kick(false)).toBe(MV.sLK)
    expect(kick(true)).toBe(MV.sHK)
  })
})

/**
 * P1 struck in the air by P2's heavy punch and falling; P2 then set free and pressing `again`
 * every other frame, P1 kept beside it in its reach: P2's strikes that landed before P1 lay down.
 */
function fallingStruck(again: number): { hits: number; life: number; m: Elec16 } {
  const m = fight()
  place(m, 236, 270)
  put(m, 'fAir', 1, 0)
  put(m, 'fY', 30 * 16, 0)
  put(m, 'fState', ST.jump, 0)
  for (let k = 0; k < 20 && read(m, 'struck', 1) === 0; k++) step(m, 0, k === 0 ? I.hp : 0)
  expect(read(m, 'fKnock', 0)).toBe(1)
  const life = read(m, 'fLife', 0)
  while (read(m, 'hitstop') > 0) step(m)
  // P2 free at once (as after a quick air strike), to strike again while P1 falls.
  put(m, 'fState', ST.stand, 1)
  let hits = 0
  for (let k = 0; k < 60 && read(m, 'fState', 0) !== ST2.down; k++) {
    put(m, 'fX', 250 * 16, 0)
    step(m, 0, k % 2 === 0 ? again : again & I.down)
    if (read(m, 'struck', 1) !== 0) hits++
  }
  return { hits, life, m }
}

describe('ELECFIGHTER striking (P1)', () => {
  /** P2 strikes with `button` from beside P1, who holds `guard`; how it landed. */
  function guardOf(button: number, guard: number, crouchStrike = false): number {
    const m = fight()
    place(m, 236, 270)
    for (let k = 0; k < 30 && read(m, 'struck', 1) === 0; k++) {
      step(m, guard, k === 0 ? button | (crouchStrike ? I.down : 0) : crouchStrike ? I.down : 0)
    }
    return read(m, 'struck', 1)
  }

  /** A jump attack: P2 in the air beside P1, its move out next frame. */
  function airStrike(guard: number): number {
    const m = fight()
    place(m, 236, 266)
    put(m, 'fAir', 1, 1)
    put(m, 'fY', 50 * 16, 1)
    put(m, 'fVY', 0, 1)
    put(m, 'fState', ST.attack, 1)
    put(m, 'fMove', MV2.jHK, 1)
    put(m, 'fMoveF', (row(MV2.jHK)[C.startup] ?? 0) - 1, 1)
    put(m, 'fHitDone', 0, 1)
    for (let k = 0; k < 6 && read(m, 'struck', 1) === 0; k++) step(m, guard, 0)
    return read(m, 'struck', 1)
  }

  it('guards by height (design 7.6): high either way, low crouched, mid and jump attacks standing', () => {
    const HIT = 1
    const GUARDED = 2
    // High: a crouching light punch (a standing one passes over one crouched: the boxes' shape).
    expect(guardOf(I.lp, I.back, true)).toBe(GUARDED)
    expect(guardOf(I.lp, I.back | I.down, true)).toBe(GUARDED)
    expect(guardOf(I.lp, 0, true)).toBe(HIT)
    expect(guardOf(I.lp, I.down)).toBe(0)
    // Low: a crouching light kick.
    expect(guardOf(I.lk, I.back, true)).toBe(HIT)
    expect(guardOf(I.lk, I.back | I.down, true)).toBe(GUARDED)
    // Mid: a jump attack.
    expect(airStrike(I.back)).toBe(GUARDED)
    expect(airStrike(I.back | I.down)).toBe(HIT)
    expect(airStrike(0)).toBe(HIT)
  })

  it('knocks down whoever is hit in the air', () => {
    const m = fight()
    place(m, 236, 270)
    put(m, 'fAir', 1, 0)
    put(m, 'fY', 30 * 16, 0)
    put(m, 'fState', ST.jump, 0)
    for (let k = 0; k < 20 && read(m, 'struck', 1) === 0; k++) step(m, 0, k === 0 ? I.hp : 0)
    expect(read(m, 'struck', 1)).toBe(1)
    expect(read(m, 'fKnock', 0)).toBe(1)
    for (let k = 0; k < 60 && read(m, 'fAir', 0) === 1; k++) step(m)
    expect(read(m, 'fState', 0)).toBe(ST2.down)
  })

  it('takes no follow-up on one knocked down falling (design 7.8: no air juggle)', () => {
    // Found in review 2026-10-08: a fighter falling from an air hit could be struck again and
    // lifted again. P1 in the air is struck by P2's heavy punch, then P2, set free, presses
    // each light and heavy as P1 falls beside it: none lands until P1 lies down.
    for (const again of [I.lp, I.lk, I.hp, I.down | I.hp, I.down | I.lk]) {
      const { hits, life, m } = fallingStruck(again)
      expect(hits, `${again}`).toBe(0)
      expect(read(m, 'fLife', 0)).toBe(life)
      expect(read(m, 'fState', 0)).toBe(ST2.down)
    }
  })

  it('strikes once a move, however long its active frames', () => {
    const m = fight()
    place(m, 236, 270)
    const life = read(m, 'fLife', 1)
    let hits = 0
    for (let k = 0; k < 40; k++) {
      step(m, k === 0 ? I.hp : 0, 0)
      if (read(m, 'struck', 0) !== 0) hits++
    }
    expect(hits).toBe(1)
    expect(life - read(m, 'fLife', 1)).toBe(row(MV.sHP)[C.damage])
  })

  it('holds both still through the hitstop while the input ring goes on', () => {
    const m = fight()
    place(m, 236, 270)
    for (let k = 0; k < 20 && read(m, 'struck', 0) === 0; k++) step(m, k === 0 ? I.hp : 0, I.fwd)
    expect(read(m, 'hitstop')).toBe(row(MV.sHP)[C.stop])
    const keep = ['fX', 'fY', 'fStun', 'fMoveF', 'fState', 'fPush', 'fStateT']
    const snap = () => keep.flatMap((n) => [read(m, n, 0), read(m, n, 1)])
    const before = snap()
    const ring = read(m, 'ringAt')
    const timeT = read(m, 'timeT')
    for (let k = 0; k < (row(MV.sHP)[C.stop] ?? 0); k++) {
      step(m, I.fwd, I.fwd)
      expect(snap()).toEqual(before)
      expect(read(m, 'timeT')).toBe(timeT)
    }
    expect(read(m, 'ringAt')).toBe((ring + (row(MV.sHP)[C.stop] ?? 0)) & 15)
    step(m, 0, 0)
    expect(snap()).not.toEqual(before)
  })

  it('chains a light into the heavy of its kind and posture only, on hit or guard', () => {
    /** P1's light; once it strikes and the hitstop is over (or by its 6th frame), `next`. */
    const chain = (light: number, next: number, guard: number, gap: number, down = 0) => {
      const m = fight()
      place(m, 236, gap)
      step(m, light | down, guard)
      for (let k = 1; k < 6 && read(m, 'struck', 0) === 0; k++) step(m, down, guard)
      while (read(m, 'hitstop') > 0) step(m, down, guard)
      step(m, next | down, guard)
      return read(m, 'fMove', 0)
    }
    const close = 270
    expect(chain(I.lp, I.hp, 0, close)).toBe(MV.sHP)
    expect(chain(I.lp, I.hp, I.back, close)).toBe(MV.sHP)
    expect(chain(I.lk, I.hk, 0, close)).toBe(MV.sHK)
    expect(chain(I.lp, I.hp, I.back | I.down, close, I.down)).toBe(MV.cHP)
    // Not light to light, not across kinds, not from a miss.
    expect(chain(I.lp, I.lp, 0, close)).toBe(MV.sLP)
    expect(chain(I.lp, I.hk, 0, close)).toBe(MV.sLP)
    expect(chain(I.lp, I.hp, 0, 400)).toBe(MV.sLP)
  })

  it('counts a hit in the startup as a counter: four more frames of stun, a fifth more damage', () => {
    const m = fight()
    place(m, 236, 270)
    // P2 starts its heavy kick; P1's light punch lands in its startup.
    step(m, 0, I.hk)
    for (let k = 0; k < 10 && read(m, 'struck', 0) === 0; k++) step(m, k === 0 ? I.lp : 0, 0)
    expect(read(m, 'struck', 0)).toBe(3)
    const base = row(MV.sLP)[C.damage] ?? 0
    const f = 256 + ((256 * 13) >> 6)
    expect(read(m, 'dealt', 0)).toBe((base * f + 128) >> 8)
    expect(read(m, 'fStun', 1)).toBe((row(MV.sLP)[C.hitstun] ?? 0) + 4)
  })

  it('scales a combo down by a tenth a hit', () => {
    const m = fight()
    place(m, 236, 270)
    const dealt: number[] = []
    // Light punch, chained heavy punch: two hits of one combo.
    for (let k = 0; k < 40; k++) {
      step(m, k === 0 ? I.lp : k === 5 ? I.hp : 0, 0)
      if (read(m, 'struck', 0) === 1) dealt.push(read(m, 'dealt', 0))
    }
    expect(dealt).toEqual([row(MV.sLP)[C.damage], ((row(MV.sHP)[C.damage] ?? 0) * 230 + 128) >> 8])
    expect(read(m, 'fComboMax', 1)).toBe(2)
  })

  it('trades alike either side: a mirrored exchange ends mirrored', () => {
    for (const [a, b] of [
      [I.lp, I.lp],
      [I.hp, I.lk],
      [I.hk, I.lp | I.down],
    ]) {
      expect(exchange(true, a ?? 0, b ?? 0)).toEqual(exchange(false, a ?? 0, b ?? 0))
    }
    // Both light punches at once: both hit.
    const m = fight(CLOCK, [2, 2], 0, MIRROR)
    place(m, 236, 276)
    for (let k = 0; k < 10 && read(m, 'struck', 0) === 0; k++) {
      step(m, k === 0 ? I.lp : 0, k === 0 ? I.lp : 0)
    }
    expect([read(m, 'struck', 0), read(m, 'struck', 1)]).toEqual([1, 1])
  })

  it('plays mirrored with the sides swapped: any buttons, any place between whole points', () => {
    // Found 2026-10-08 with 30 scripts of 1,500 frames: places rounded down to points put the one
    // facing left up to a point nearer than its mirror image (a long kick landed on one side
    // only, S4 seed 6 at frame 76), and the walk's steps were counted from the left wall (another
    // pose, other boxes: S1 seed 8 at frame 191). Both rounded from the way each faces now.
    for (const [seed, slot] of [
      [6, 3],
      [8, 0],
    ]) {
      const a = scripted(false, seed ?? 0, slot ?? 0)
      const b = scripted(true, seed ?? 0, slot ?? 0)
      const k = a.findIndex((v, n) => v !== b[n])
      expect(k, `seed ${seed} S${(slot ?? 0) + 1}: ${a[k]} / ${b[k]}`).toBe(-1)
    }
  })

  it('buffers a press for 8 frames: pressed late in a recovery, it comes out the first free frame', () => {
    const m = fight()
    place(m, 150, 350)
    step(m, I.hp)
    const r = row(MV.sHP)
    const total = (r[C.startup] ?? 0) + (r[C.active] ?? 0) + (r[C.recovery] ?? 0) - 1
    // Frame 1 was the press; press LP 5 frames before the move ends.
    steps(m, total - 6)
    step(m, I.lp)
    steps(m, 4)
    expect(read(m, 'fMove', 0)).toBe(MV.sHP)
    step(m)
    expect(read(m, 'fMove', 0)).toBe(MV.sLP)
    // Pressed 10 frames early, it is gone by then.
    const n = fight()
    place(n, 150, 350)
    step(n, I.hp)
    steps(n, total - 11)
    step(n, I.lp)
    steps(n, 10)
    expect(read(n, 'fState', 0)).toBe(ST.stand)
  })
})

/**
 * Two of the same slot exchange `a` (the one on the left) and `b`: 50 frames of each side, the
 * one doing `a` first. Swapped, P2 does `a` from where P1's mirror image stands - the same
 * places - and every place is read mirrored.
 */
function exchange(swapped: boolean, a: number, b: number): number[][] {
  const W = 512 * 16
  const m = fight(CLOCK, [2, 2], 0, MIRROR)
  place(m, 236, 276)
  const side = (role: number) => {
    const j = swapped ? 1 - role : role
    const x = read(m, 'fX', j)
    const face = read(m, 'fFace', j)
    const rest = ['fState', 'fLife', 'fStun', 'fMoveF', 'struck'].map((n) => read(m, n, j))
    return [swapped ? W - x : x, swapped ? 1 - face : face, ...rest]
  }
  const out: number[][] = []
  for (let k = 0; k < 50; k++) {
    const p = k === 0 ? a : 0
    const q = k === 0 ? b : 0
    if (swapped) step(m, q, p)
    else step(m, p, q)
    out.push([...side(0), ...side(1), read(m, 'hitstop')])
  }
  return out
}

/**
 * Two of slot `slot` driven from outside by a seeded script of held buttons (a new pair each 7
 * frames) for 260 frames, `swapped` giving P1's to P2 and P2's to P1: each frame, both sides' place
 * (mirrored when swapped), height, state, life, facing, move, its frame and pose.
 */
function scripted(swapped: boolean, seed: number, slot: number): string[] {
  const W = 512 * 16
  const BUTTONS = [0, 1, 2, 4, 8, 16, 32, 64, 128, 18, 34, 66, 130, 40, 36, 9, 5, 8, 8, 4]
  let s = (seed * 2654435761) >>> 0
  const next = () => {
    s = (s * 1103515245 + 12345) >>> 0
    return (s >>> 16) % BUTTONS.length
  }
  const m = fight(CLOCK, [2, 2], slot, MIRROR)
  let a = 0
  let b = 0
  const out: string[] = []
  for (let k = 0; k < 260; k++) {
    if (k % 7 === 0) {
      a = BUTTONS[next()] ?? 0
      b = BUTTONS[next()] ?? 0
    }
    if (swapped) step(m, b, a)
    else step(m, a, b)
    const side = (role: number) => {
      const j = swapped ? 1 - role : role
      const x = read(m, 'fX', j)
      const face = read(m, 'fFace', j)
      const rest = ['fY', 'fState', 'fLife', 'fMove', 'fMoveF', 'fPose'].map((n) => read(m, n, j))
      return [swapped ? W - x : x, swapped ? 1 - face : face, ...rest].join(',')
    }
    out.push(`${side(0)} | ${side(1)} | ${read(m, 'hitstop')}`)
  }
  return out
}

describe('ELECFIGHTER rounds (design 7.2)', () => {
  it('ends a round on a KO and counts it; two rounds win the match', () => {
    const m = fight()
    for (const r of [1, 2]) {
      place(m, 236, 270)
      put(m, 'fLife', 1, 1)
      for (let k = 0; k < 10 && read(m, 'phase') === PH.fight; k++) step(m, k === 0 ? I.lp : 0, 0)
      expect(read(m, 'phase')).toBe(PH.over)
      expect(read(m, 'roundWon')).toBe(0)
      for (let k = 0; k < 200 && read(m, 'phase') !== PH.fight && read(m, 'outcome') === 0; k++)
        step(m)
      expect(read(m, 'wins', 0)).toBe(r)
    }
    expect(read(m, 'outcome')).toBe(1)
  })

  it('gives TIME UP to the more life, and plays a draw again until a third loses it for both', () => {
    const m = fight()
    put(m, 'timeLeft', 1)
    put(m, 'fLife', 60, 0)
    put(m, 'fLife', 40, 1)
    steps(m, 61)
    expect(read(m, 'phase')).toBe(PH.over)
    expect(read(m, 'roundWon')).toBe(0)
    for (let k = 0; k < 200 && read(m, 'phase') !== PH.fight; k++) step(m)
    expect(read(m, 'round')).toBe(2)
    for (const d of [1, 2, 3]) {
      put(m, 'timeLeft', 1)
      put(m, 'fLife', 50, 0)
      put(m, 'fLife', 50, 1)
      steps(m, 61)
      expect(read(m, 'roundWon')).toBe(2)
      for (let k = 0; k < 200 && read(m, 'phase') !== PH.fight && read(m, 'outcome') === 0; k++)
        step(m)
      if (d < 3) {
        expect(read(m, 'draws')).toBe(d)
        expect(read(m, 'round')).toBe(2)
      }
    }
    expect(read(m, 'outcome')).toBe(3)
  })

  it('counts a double KO as a draw', () => {
    const m = fight(CLOCK, [2, 2], 0, MIRROR)
    place(m, 236, 276)
    put(m, 'fLife', 1, 0)
    put(m, 'fLife', 1, 1)
    for (let k = 0; k < 10 && read(m, 'phase') === PH.fight; k++)
      step(m, k === 0 ? I.lp : 0, k === 0 ? I.lp : 0)
    expect(read(m, 'roundWon')).toBe(2)
    // Both broken into their pieces at once: never more than 32 sprites on a line.
    let most = 0
    for (let k = 0; k < 300 && read(m, 'phase') !== PH.round; k++) {
      step(m)
      most = Math.max(most, ...perLine(m))
    }
    expect(read(m, 'phase')).toBe(PH.round)
    expect(most).toBeLessThanOrEqual(32)
  })

  it('lands no strike and takes no throw once the round is over', () => {
    // Found in review 2026-10-08: the strikes were judged in the round's end too, so a heavy
    // started before TIME UP or a KO landed after it.
    const startup = row(MV.sHP)[C.startup] ?? 0
    for (const button of [I.hp, I.fwd | I.hp]) {
      const m = fight()
      place(m, 236, 270)
      step(m, button)
      // TIME runs out on the next frame, before the move's first active frame.
      put(m, 'timeLeft', 1)
      put(m, 'timeT', 59)
      step(m)
      expect(read(m, 'phase')).toBe(PH.over)
      const life = read(m, 'fLife', 1)
      for (let k = 0; k < startup + 30; k++) {
        step(m)
        expect(read(m, 'struck', 0)).toBe(0)
        expect(read(m, 'threw', 0)).toBe(0)
      }
      expect(read(m, 'fLife', 1)).toBe(life)
    }
    // A throw that took hold before TIME UP still slams, but takes no life: the round is decided.
    const n = fight()
    place(n, 236, 270)
    for (let k = 0; k < 10 && read(n, 'threw', 0) === 0; k++) step(n, k === 0 ? I.fwd | I.hp : 0)
    expect(read(n, 'fState', 1)).toBe(ST2.thrown)
    put(n, 'timeLeft', 1)
    put(n, 'timeT', 59)
    const life = read(n, 'fLife', 1)
    steps(n, 30)
    expect(read(n, 'phase')).toBe(PH.over)
    expect(read(n, 'fState', 1)).toBe(ST2.down)
    expect(read(n, 'fLife', 1)).toBe(life)
  })
})

/** BG1's row `y` as the font's words (a cell of another tile reads as a space). */
function rowText(m: Elec16, y: number): string {
  const mem = m.state.video?.mem ?? new Uint8Array()
  let s = ''
  for (let x = 0; x < 40; x++) {
    const at = 0xa000 + y * 128 + x * 2
    const t = ((mem[at] ?? 0) | ((mem[at + 1] ?? 0) << 8)) & 0x3ff
    // The font from tile 0, the band's bold font from 64: both from the space.
    s += t < 128 ? String.fromCharCode(32 + (t & 63)) : ' '
  }
  return s.trim()
}

/** The large letters (engine/draw.e16.ts, art/big.png), 2 tiles by 3 each, in their order. */
const BIG_CHARS = 'ABCDEFGHIKLMNOPRSTUVWY.?123'
const BIG_TILE = Number(/export const BIG_TILE = (0x[0-9a-f]+)/.exec(assetsText)?.[1])

/** BG1's row `y` read as the tops of large letters (a narrow space between words). */
function bigText(m: Elec16, y: number): string {
  const mem = m.state.video?.mem ?? new Uint8Array()
  let s = ''
  for (let x = 0; x < 40; x++) {
    const at = 0xa000 + y * 128 + x * 2
    const t = (((mem[at] ?? 0) | ((mem[at + 1] ?? 0) << 8)) & 0x3ff) - BIG_TILE
    if (t >= 0 && t < BIG_CHARS.length * 6) {
      if (t % 6 === 0) s += BIG_CHARS[t / 6]
    } else s += ' '
  }
  return s.trim().replace(/ +/g, ' ')
}

/** A global's size in bytes: an array's as e16c lays it out, a word's 2. */
function sizeOf(name: string): number {
  const m = new RegExp(`^${name} = 0x[0-9a-f]+ ; (\\d+) bytes$`, 'm').exec(asmText)
  return m ? Number(m[1]) : 2
}

/** The kit's sound's state (lib/sound.e16.ts): it goes on through a pause, the music muted. */
const SOUND_STATE = [
  'chBank',
  'chSong',
  'chAt',
  'chLoop',
  'chWait',
  'chGate',
  'chFreq',
  'lastFreq',
  'chLen',
  'chHeld',
  'chDrop',
  'chVol',
  'chInstVol',
  'chOn',
  'muted',
  'opTook',
  'sfxHeard',
]

/** Colour `k` of palette slot `slot` as shown, and as kept (`palCopy`). */
const shown = (m: Elec16, slot: number, k: number) => {
  const mem = m.state.video?.mem ?? new Uint8Array()
  const at = 0xc400 + slot * 32 + k * 2
  return (mem[at] ?? 0) | ((mem[at + 1] ?? 0) << 8)
}
const kept = (m: Elec16, slot: number, k: number) => read(m, 'palCopy', slot * 16 + k)

const LOG_ROW = 34
const throwDamage = (s: number) => moves[s]?.[MV2.throw]?.[C.damage] ?? 0

describe('ELECFIGHTER throws (P2, design 7.9)', () => {
  /** P1 near P2 (S2 RUSH, 13 points a half: 21 points from P1's centre to its edge). */
  const near = () => {
    const m = fight()
    place(m, 236, 270)
    return m
  }

  /** Frames until fighter `a`'s throw takes hold (99 never), each with these buttons. */
  function holdAfter(m: Elec16, h0: (k: number) => number, h1: (k: number) => number): number {
    for (let k = 1; k <= 12; k++) {
      step(m, h0(k), h1(k))
      if (read(m, 'threw', 0) !== 0 || read(m, 'threw', 1) !== 0) return k
    }
    return 99
  }

  it('beats a guard: held at its first active frame, thrown down for its damage after the window', () => {
    const m = near()
    const life = read(m, 'fLife', 1)
    expect(
      holdAfter(
        m,
        (k) => (k === 1 ? I.fwd | I.hp : 0),
        () => I.back,
      ),
    ).toBe(row(MV2.throw)[C.startup])
    expect(read(m, 'fState', 0)).toBe(ST2.throw)
    expect(read(m, 'fState', 1)).toBe(ST2.thrown)
    steps(m, 15, 0, I.back)
    expect(read(m, 'fState', 1)).toBe(ST2.thrown)
    step(m, 0, I.back)
    expect(read(m, 'fState', 1)).toBe(ST2.down)
    expect(life - read(m, 'fLife', 1)).toBe(throwDamage(0))
    // Back and the heavy punch throws the other way: it lands behind the thrower.
    const n = near()
    holdAfter(
      n,
      (k) => (k === 1 ? I.back | I.hp : I.back),
      () => 0,
    )
    steps(n, 16)
    expect(read(n, 'fX', 1)).toBeLessThan(read(n, 'fX', 0))
  })

  it('comes out only near: out of range the same buttons are the heavy punch', () => {
    const m = fight()
    place(m, 200, 270)
    step(m, I.fwd | I.hp)
    expect(read(m, 'fMove', 0)).toBe(MV.sHP)
    const n = near()
    step(n, I.fwd | I.hp)
    expect(read(n, 'fMove', 0)).toBe(MV2.throw)
    // Crouched, down and the heavy punch is the crouching heavy punch.
    const c = near()
    step(c, I.fwd | I.down | I.hp)
    expect(read(c, 'fMove', 0)).toBe(MV.cHP)
  })

  it('loses to a strike landing on the frame it would take hold; a later strike is thrown', () => {
    // S2's light punch starts in 3: pressed 2 frames after the throw, it lands on the throw's 5th.
    const s2LP = moves[1]?.[MV.sLP]?.[C.startup] ?? 0
    const at = (row(MV2.throw)[C.startup] ?? 0) - s2LP + 1
    const m = near()
    let struck = 0
    for (let k = 1; k <= 12; k++) {
      step(m, k === 1 ? I.fwd | I.hp : 0, k === at ? I.lp : 0)
      struck = Math.max(struck, read(m, 'struck', 1))
      expect(read(m, 'threw', 0)).toBe(0)
    }
    expect(struck).toBe(1)
    const n = near()
    expect(
      holdAfter(
        n,
        (k) => (k === 1 ? I.fwd | I.hp : 0),
        (k) => (k === at + 1 ? I.lp : 0),
      ),
    ).toBe(5)
  })

  it('breaks both of two throws at once: THROW TECH, no damage', () => {
    const m = fight(CLOCK, [2, 2], 0, MIRROR)
    place(m, 236, 270)
    const life = [read(m, 'fLife', 0), read(m, 'fLife', 1)]
    for (let k = 1; k <= 8; k++) step(m, k === 1 ? I.fwd | I.hp : 0, k === 1 ? I.fwd | I.hp : 0)
    expect([read(m, 'fState', 0), read(m, 'fState', 1)]).toEqual([ST.guard, ST.guard])
    expect(rowText(m, LOG_ROW)).toBe('> THROW TECH')
    steps(m, 30)
    expect([read(m, 'fLife', 0), read(m, 'fLife', 1)]).toEqual(life)
    expect(read(m, 'fX', 1) - read(m, 'fX', 0)).toBeGreaterThan(34 * 16)
  })

  it('is teched by the same buttons in its first 7 frames, not the 8th', () => {
    const techAt = (k: number, buttons = I.back | I.hp, after = I.back) => {
      const m = near()
      holdAfter(
        m,
        (n) => (n === 1 ? I.fwd | I.hp : 0),
        () => 0,
      )
      const life = read(m, 'fLife', 1)
      for (let n = 1; n <= 20; n++) step(m, 0, n === k ? buttons : n > k ? after : 0)
      return life - read(m, 'fLife', 1)
    }
    expect(techAt(1)).toBe(0)
    expect(techAt(7)).toBe(0)
    expect(techAt(7, I.fwd | I.hp)).toBe(0)
    expect(techAt(8)).toBe(throwDamage(0))
    // The heavy punch alone is not the tech; with a direction held while it waits in the
    // buffer, it is.
    expect(techAt(3, I.hp, 0)).toBe(throwDamage(0))
    expect(techAt(3, I.hp)).toBe(0)
  })

  it('takes no tech from a heavy punch pressed before the hold, only one pressed after it', () => {
    // Found in review 2026-10-08: the tech read the whole 8-frame buffer, so a heavy punch
    // pressed up to 7 frames before the throw took hold (and not yet used) teched it at once.
    // The presses are put in the ring as they would be, unused, `ago` frames before the hold.
    const before = (ago: number) => {
      const m = near()
      holdAfter(
        m,
        (n) => (n === 1 ? I.fwd | I.hp : 0),
        () => 0,
      )
      const now = read(m, 'ringAt')
      put(m, 'ringD', read(m, 'ringD', 16 + ((now - ago) & 15)) | I.hp, 16 + ((now - ago) & 15))
      const life = read(m, 'fLife', 1)
      steps(m, 20, 0, I.back)
      return life - read(m, 'fLife', 1)
    }
    for (let ago = 0; ago <= 7; ago++) expect(before(ago), `${ago} before`).toBe(throwDamage(0))
  })

  it('misses on one it cannot take, and recovers in 22 frames', () => {
    const m = near()
    put(m, 'fState', ST2.wake, 1)
    put(m, 'fStateT', 0, 1)
    step(m, I.fwd | I.hp)
    const r = row(MV2.throw)
    const total = (r[C.startup] ?? 0) + (r[C.active] ?? 0) + (r[C.recovery] ?? 0) - 1
    expect(r[C.recovery]).toBe(22)
    let k = 1
    while (read(m, 'fState', 0) === ST.attack && k < 60) {
      expect(read(m, 'threw', 0)).toBe(0)
      step(m)
      k++
    }
    expect(k).toBe(total + 1)
  })
})

describe('ELECFIGHTER down and waking (P2, design 7.3)', () => {
  /** P2 knocked down by P1's sweep: the frames of Down and of Wake. */
  it('lies 36 frames, wakes 12 untouchable, then 2 frames safe from throws', () => {
    const m = fight()
    place(m, 236, 270)
    for (let k = 0; k < 20 && read(m, 'struck', 0) === 0; k++) step(m, k === 0 ? I.down | I.hk : 0)
    expect(read(m, 'fState', 1)).toBe(ST2.down)
    const count = (st: number) => {
      let n = 0
      while (read(m, 'fState', 1) === st && n < 99) {
        step(m)
        if (read(m, 'hitstop') === 0) n++
      }
      return n
    }
    while (read(m, 'hitstop') > 0) step(m)
    expect(count(ST2.down)).toBe(36)
    expect(count(ST2.wake)).toBe(12)
  })

  it('takes no strike while waking, and no throw until its third frame standing', () => {
    /** P2 down at 270, P1 beside; P1 presses `button` `at` frames on; what it did to P2. */
    const wake = (button: number, at: number) => {
      const m = fight()
      place(m, 236, 270)
      put(m, 'fState', ST2.down, 1)
      put(m, 'fStateT', 30, 1)
      let hurt = 0
      for (let k = 1; k <= 40; k++) {
        step(m, k === at ? button : 0)
        if (hurt === 0 && (read(m, 'struck', 0) !== 0 || read(m, 'threw', 0) !== 0)) hurt = k
      }
      return hurt
    }
    // Down ends after 6 more frames, Wake after 12: P2 stands on frame 18.
    const STANDS = 18
    // A light punch whose active frames are all in Wake misses.
    expect(wake(I.lp, 8)).toBe(0)
    // A throw active as P2 stands, or a frame after, misses; on its third frame standing, holds.
    const active = row(MV2.throw)[C.startup] ?? 0
    expect(wake(I.fwd | I.hp, STANDS - active + 1)).toBe(0)
    expect(wake(I.fwd | I.hp, STANDS + 1 - active + 1)).toBe(STANDS + 2)
  })

  it('knocks down with sweeps, throws and air hits', () => {
    for (const rows of moves) {
      expect((rows[MV.cHK]?.[C2.flags] ?? 0) & 2).toBe(2)
      expect((rows[MV2.throw]?.[C2.flags] ?? 0) & 2).toBe(2)
    }
  })
})

describe('ELECFIGHTER anti-air and walls (P2, design 7.4, 7.7)', () => {
  /** P2's jump heavy kick coming down on P1, who answers with `answer` the same frame. */
  function jumpIn(answer: number): { p1: number; p2: number; knocked: number } {
    const m = fight()
    place(m, 236, 256)
    put(m, 'fAir', 1, 1)
    put(m, 'fY', 50 * 16, 1)
    put(m, 'fVY', 0, 1)
    put(m, 'fState', ST.attack, 1)
    put(m, 'fMove', MV2.jHK, 1)
    put(m, 'fMoveF', (moves[1]?.[MV2.jHK]?.[C.startup] ?? 0) - 1, 1)
    put(m, 'fHitDone', 0, 1)
    let p1 = 0
    let p2 = 0
    for (let k = 0; k < 14; k++) {
      step(m, k === 0 ? answer : I.down, 0)
      p1 = Math.max(p1, read(m, 'struck', 0))
      p2 = Math.max(p2, read(m, 'struck', 1))
    }
    return { p1, p2, knocked: read(m, 'fKnock', 1) }
  }

  it("beats a jump-in with the crouching heavy punch's upper body out of reach", () => {
    const aa = jumpIn(I.down | I.hp)
    expect(aa.p2).toBe(0)
    expect(aa.p1).toBeGreaterThan(0)
    expect(aa.knocked).toBe(1)
    // The crouching light punch has no such frames: the jump attack lands (in its startup, a
    // counter hit).
    expect(jumpIn(I.down | I.lp).p2).toBe(3)
    // The table: only the crouching heavy punch, frames 1-8 (from | to << 8).
    for (const rows of moves) {
      expect(rows.filter((r) => ((r[C2.flags] ?? 0) & 4) !== 0).length).toBe(1)
      expect(rows[MV.cHP]?.[13]).toBe(1 | (8 << 8))
    }
  })

  it('logs an anti-air', () => {
    const m = fight()
    place(m, 236, 256)
    put(m, 'fAir', 1, 1)
    put(m, 'fY', 50 * 16, 1)
    put(m, 'fState', ST.jump, 1)
    for (let k = 0; k < 14 && read(m, 'struck', 0) === 0; k++)
      step(m, k === 0 ? I.down | I.hp : I.down)
    step(m, I.down)
    expect(rowText(m, LOG_ROW)).toBe('> P1 ANTI-AIR')
  })

  it('pushes the striker back when the one struck is at the wall', () => {
    /** P1's heavy punch on P2 at `x`: how far P1 has gone back 20 frames after. */
    const back = (x: number) => {
      const m = fight()
      place(m, x - 34, x)
      step(m, I.hp, I.back)
      for (let k = 0; k < 30 && read(m, 'struck', 0) === 0; k++) step(m, 0, I.back)
      const at = read(m, 'fX', 0)
      const them = read(m, 'fX', 1)
      steps(m, 20, 0, I.back)
      return { p1: at - read(m, 'fX', 0), p2: read(m, 'fX', 1) - them }
    }
    const open = back(300)
    expect(open.p1).toBe(0)
    expect(open.p2).toBeGreaterThan(0)
    const wall = back(480 - 13)
    expect(wall.p2).toBe(0)
    expect(wall.p1).toBeGreaterThan(16 * 16)
  })
})

describe('ELECFIGHTER dashes (P2, design 6.2)', () => {
  it('dashes on forward twice within 10 frames: 14 frames, about 36 points', () => {
    const m = fight()
    place(m, 150, 350)
    step(m, I.fwd)
    step(m, 0)
    const x = read(m, 'fX', 0)
    step(m, I.fwd)
    expect(read(m, 'fState', 0)).toBe(ST2.dash)
    let n = 1
    while (read(m, 'fState', 0) === ST2.dash && n < 40) {
      step(m)
      n++
    }
    expect(n).toBe(15)
    expect(read(m, 'fX', 0) - x).toBe(14 * (profiles[0]?.[11] ?? 0))
    expect(Math.abs((read(m, 'fX', 0) - x) / 16 - 36)).toBeLessThan(1)
  })

  it('backdashes on back twice: 18 frames, about 32 points, safe from throws its first 6', () => {
    const m = fight()
    place(m, 236, 350)
    step(m, I.back)
    step(m, 0)
    const x = read(m, 'fX', 0)
    step(m, I.back)
    expect(read(m, 'fState', 0)).toBe(ST2.backdash)
    let n = 1
    while (read(m, 'fState', 0) === ST2.backdash && n < 40) {
      step(m)
      n++
    }
    expect(n).toBe(19)
    expect(x - read(m, 'fX', 0)).toBe(18 * (profiles[0]?.[13] ?? 0))
    expect(Math.abs((x - read(m, 'fX', 0)) / 16 - 32)).toBeLessThan(1)
    /** P2 throws as P1's backdash is `k` frames in: whether it holds. */
    const thrownAt = (k: number) => {
      const t = fight()
      place(t, 236, 266)
      put(t, 'fState', ST2.backdash, 0)
      put(t, 'fStateT', k - 2, 0)
      put(t, 'fVX', 0, 0)
      put(t, 'fState', ST.attack, 1)
      put(t, 'fMove', MV2.throw, 1)
      put(t, 'fMoveF', (moves[1]?.[MV2.throw]?.[C.startup] ?? 0) - 1, 1)
      put(t, 'fHitDone', 0, 1)
      step(t)
      return read(t, 'threw', 1)
    }
    expect(thrownAt(6)).toBe(0)
    expect(thrownAt(7)).toBe(1)
  })

  it('cannot guard or strike while dashing, and is struck', () => {
    const m = fight()
    place(m, 236, 270)
    put(m, 'fState', ST2.backdash, 0)
    put(m, 'fStateT', 8, 0)
    let s = 0
    for (let k = 0; k < 8; k++) {
      step(m, I.back | I.lp, k === 0 ? I.lp : 0)
      s = Math.max(s, read(m, 'struck', 1))
      expect(read(m, 'struck', 0)).toBe(0)
    }
    expect(s).toBe(1)
  })

  it('never dashes for a light pressed again, nor for presses 11 frames apart', () => {
    const m = fight()
    place(m, 150, 350)
    for (let k = 0; k < 40; k++) {
      step(m, I.fwd | (k % 2 === 0 ? I.lp : 0))
      expect(read(m, 'fState', 0)).not.toBe(ST2.dash)
    }
    const n = fight()
    place(n, 150, 350)
    step(n, I.fwd)
    steps(n, 10)
    step(n, I.fwd)
    expect(read(n, 'fState', 0)).toBe(ST.stand)
  })
})

/** cpu/opponents.txt's columns, and its rows. */
const O = { think: 2, rGuard: 3, rAA: 4, rPunish: 5, rTech: 6, rSwitch: 7, guard: 8, aa: 9 }
const O2 = { punish: 10, read: 11, range: 12, pattern: 18, habit: 19, min: 20, max: 21 }
const O3 = { whim: 23 }
const OPP_W = 32
const ROOT_ROW = 4
const opponents = table('cpu/opponents.txt', OPP_W)
/** The actions' numbers (cpu/ai.e16.ts): WAIT keeps the distance it likes. */
const WAIT = 8

/** Column `c` of the row CPU fighter `i` plays by, as met (in RAM, scaled by the ladder). */
const setRow = (m: Elec16, i: number, c: number, v: number) => put(m, 'opp', v, i * OPP_W + c)
const rowOf = (m: Elec16, i: number, c: number) => read(m, 'opp', i * OPP_W + c)

/**
 * CPU fighter 1 kept still for a test: no whim, no habit, no anti-air or punish, not wary of the
 * other's swinging, waiting where it stands (its liked distance the one it is at) with nothing
 * new chosen for a long while.
 */
function still(m: Elec16): void {
  put(m, 'swing', 0, 1)
  setRow(m, 1, O3.whim, 0)
  setRow(m, 1, O.think, 250)
  setRow(m, 1, O2.pattern, 0)
  setRow(m, 1, O.aa, 0)
  setRow(m, 1, O2.punish, 0)
  setRow(m, 1, O2.range, Math.abs(read(m, 'fX', 1) - read(m, 'fX', 0)) >> 4)
  put(m, 'plan', WAIT, 1)
  put(m, 'planT', 250, 1)
  put(m, 'thinkT', 250, 1)
  // Its presses before forgotten: a back pressed in a backdash's taps it was drawing before, and
  // the guard's back now, would be the two taps of one (seen 2026-10-08, a seed that drew it).
  for (let k = 0; k < 16; k++) put(m, 'ringD', 0, 16 + k)
}

/**
 * One frame of the CPU (P2) with `plan` forced (-1: thinking afresh) and P1 holding `p1`, played
 * on as it is and, from its snapshot, with P1 moved to the CPU's other side (from its left far
 * out of a throw's reach, from its right near) in another state: the CPU's buttons both times.
 */
function cpuTwice(m: Elec16, plan: number, p1: number): [number, number] {
  if (plan >= 0) {
    put(m, 'plan', plan, 1)
    put(m, 'planT', 30, 1)
  } else put(m, 'thinkT', 0, 1)
  const b = again(m.snapshot())
  const x1 = read(b, 'fX', 1)
  put(b, 'fX', read(b, 'fX', 0) < x1 ? x1 + 100 * 16 : x1 - 30 * 16, 0)
  put(b, 'fState', read(b, 'fState', 0) === ST.attack ? ST.stand : ST.attack, 0)
  put(b, 'fMove', MV2.throw, 0)
  put(b, 'fY', 0, 0)
  step(m, p1)
  step(b, p1)
  return [read(m, 'cpuHeld', 1), read(b, 'cpuHeld', 1)]
}

describe('ELECFIGHTER the CPU (P2, design 7.10)', { timeout: 120_000 }, () => {
  it('guards on sight only what starts slower than its reaction, and never reads nearer than it', () => {
    /** P1's `button` (a crouching move with down) against the CPU of reaction R: how it landed. */
    const landed = (r: number, button: number) => {
      const m = fight(CLOCK, [2, 1])
      still(m)
      place(m, 236, 270)
      still(m)
      setRow(m, 1, O.rGuard, r)
      setRow(m, 1, O.rSwitch, r)
      setRow(m, 1, O.guard, 256)
      steps(m, 40)
      still(m)
      let s = 0
      for (let k = 0; k < 30; k++) {
        step(m, k === 0 ? button : button & I.down, 0)
        s = Math.max(s, read(m, 'struck', 0))
      }
      const reactions = [O.rGuard, O.rAA, O.rPunish, O.rSwitch].map((c) => rowOf(m, 1, c))
      expect(read(m, 'seenLate', 1)).toBeGreaterThanOrEqual(Math.min(...reactions))
      expect(read(m, 'seenLate', 1)).toBeGreaterThanOrEqual(r)
      return s
    }
    const sweep = row(MV.cHK)[C.startup] ?? 0
    expect(sweep).toBe(10)
    // The sweep starts in 10: seen 10 frames late, too late; 9, in time.
    expect(landed(10, I.down | I.hk)).toBe(1)
    expect(landed(9, I.down | I.hk)).toBe(2)
    // The light kick (5) is never seen in time, even by the quickest (8).
    expect(landed(8, I.down | I.lk)).toBe(1)
    // The standing heavy kick (11), by 10.
    expect(landed(10, I.hk)).toBe(2)
    // The table: no reaction under 8 but the tech's, and the ladder takes 2 off each place.
    for (const r of opponents) {
      for (const c of [O.rGuard, O.rAA, O.rPunish, O.rSwitch])
        expect(r[c]).toBeGreaterThanOrEqual(8)
    }
  })

  it('chooses the same buttons whatever the other is doing now: it sees only the ring of what was', () => {
    // Found in review 2026-10-08: the throw's range and "its back to the wall" read the other's
    // place now (fX), not as seen R frames late. Each frame is played twice from the same
    // snapshot, once with P1 moved to the CPU's other side, in another state, in RAM just before
    // it: the CPU's buttons for that frame (chosen before P1 moves) must be the same.
    const THROW = 5
    // At the left wall with P1 beside it (its back to the wall), the throw planned or not; and
    // the throw planned in the open.
    for (const c of [
      { cpu: 60, p1: 100, plan: THROW },
      { cpu: 60, p1: 100, plan: -1 },
      { cpu: 300, p1: 270, plan: THROW },
    ]) {
      const m = fight(CLOCK, [2, 1], 0, 3)
      place(m, c.p1, c.cpu)
      for (let k = 0; k < 120 && read(m, 'phase') === PH.fight; k++) {
        const [now, moved] = cpuTwice(m, c.plan, k & 8 ? I.fwd : 0)
        expect(moved, `frame ${k} of ${JSON.stringify(c)}`).toBe(now)
        // Each run goes on from the true one.
        if (k % 30 === 29) place(m, c.p1, c.cpu)
      }
    }
  })

  it('combos no more than 4 hits on one who stands still, whichever opponent', () => {
    for (const at of [0, 1, 2, 3]) {
      const m = fight(CLOCK, [2, 1], 0, at)
      let hit = 0
      // A round is enough: every opponent knocks the one standing still out in it.
      for (let k = 0; k < 3000 && read(m, 'phase') === PH.fight; k++) {
        step(m)
        if (read(m, 'struck', 1) !== 0) hit++
      }
      expect(hit, `place ${at}`).toBeGreaterThan(0)
      expect(read(m, 'fComboMax', 0), `place ${at}`).toBeLessThanOrEqual(4)
    }
  })

  it("shows each opponent's habit as a tendency: due at counts drawn afresh, out by its chance, never always", () => {
    const cases = [
      // PACKET, its lights guarded; MAINFRAME, the person walking back; DAEMON, in and out on
      // its gap; KERNEL (P1 in S2 RUSH, so it is met third), its heavies guarded.
      { slot: 0, at: 0, row: 0, p1: (_: number) => I.back | I.down },
      { slot: 0, at: 1, row: 1, p1: (k: number) => ((k >> 6) & 1 ? I.back : I.fwd) },
      { slot: 0, at: 2, row: 2, p1: (_: number) => I.back | I.down },
      { slot: 1, at: 2, row: 3, p1: (_: number) => I.back | I.down },
    ]
    for (const c of cases) {
      const r = opponents[c.row] ?? []
      const chance = (r[O2.habit] ?? 0) / 256
      expect(chance).toBeGreaterThan(0)
      expect(chance).toBeLessThanOrEqual(0.7)
      const { due, fired, drawn, whims } = habitWatched(c.slot, c.at, c.p1)
      const why = `row ${c.row}: ${fired} of ${due}, ${drawn.join(' ')}`
      expect(due, why).toBeGreaterThanOrEqual(8)
      expect(fired, why).toBeGreaterThan(0)
      expect(fired, why).toBeLessThan(due)
      expect(Math.abs(fired / due - chance), why).toBeLessThan(0.3)
      expect(Math.min(...drawn)).toBeGreaterThanOrEqual(r[O2.min] ?? 0)
      expect(Math.max(...drawn)).toBeLessThanOrEqual(r[O2.max] ?? 0)
      expect(new Set(drawn).size, why).toBeGreaterThanOrEqual(2)
      expect(
        drawn.some((d, k) => k > 0 && d === drawn[k - 1]),
        why,
      ).toBe(false)
      expect(whims, why).toBeGreaterThan(0)
    }
  })

  it('gives S4 a body no nearer than the others and DAEMON a range at the tip of its long kick', () => {
    // Measured 2026-10-08, two CPUs of the same scaling, sides taken in turn: S4 under DAEMON
    // lost all 4 matches against each slot, and 0 of 4 against S1 even under KERNEL's row -
    // its drafted hurt boxes stood 3 points ahead of everyone's (its long guard arms and knee
    // taken for the body), and DAEMON liked 90 points, out of its own reach (67 with the heavy
    // kick, 76 the sweep) and inside the others' heavy punch. After (boxes, range, its habit at
    // 100 in 256), in 6 seeds a pairing: 2, 1 and 1 of 6 against S1, S2 and S3.
    const art = SLOT_IDS.map((s) => table(`fighters/${s}/poses.txt`, 24))
    const front = (s: number, pose: number, boxes: number[]) =>
      Math.max(
        ...boxes.map((k) => {
          const b = art[s]?.[pose] ?? []
          return (b[k * 4 + 2] ?? 0) === 0 ? -99 : (b[k * 4] ?? 0) + (b[k * 4 + 2] ?? 0)
        }),
      )
    const body = (s: number) => front(s, 0, [1, 2, 3])
    // Standing, guarding, at rest: S4 is the slim one (slots.json's girth 0.88).
    for (const pose of [0, 7, 60]) {
      expect(front(3, pose, [1, 2, 3])).toBeLessThanOrEqual(
        Math.max(front(0, pose, [1, 2, 3]), front(2, pose, [1, 2, 3])),
      )
    }
    // The power slot's heavy punch reaches as the standard's (design 3.1).
    const active = (s: number, m: number) => (moves[s]?.[m]?.[14] ?? 0) + 1
    expect(front(2, active(2, MV.sHP), [4, 5])).toBe(front(0, active(0, MV.sHP), [4, 5]))
    // DAEMON's liked range: past its heavy kick's tip on a standing S1 by at most its width, and
    // within its sweep's.
    const tip = (m: number) => front(3, active(3, m), [4, 5]) + body(0) - 1
    const daemon = opponents[2] ?? []
    expect(daemon[0]).toBe(3)
    expect(daemon[O2.range] ?? 0).toBeGreaterThanOrEqual(tip(MV.sHK))
    expect((daemon[O2.range] ?? 0) - (daemon[13] ?? 0)).toBeLessThanOrEqual(tip(MV.sHK))
    expect(daemon[O2.range] ?? 0).toBeLessThanOrEqual(tip(MV.cHK))
  })

  it('reads more the later it is met, but never one that does not read at all', () => {
    // Found in review 2026-10-08: KERNEL's read of 0 became 52 as the third met.
    const kernel = opponents[3] ?? []
    expect(kernel[O2.read]).toBe(0)
    const m = fight(CLOCK, [2, 1], 1, 2)
    expect(read(m, 'ladder', 2)).toBe(3)
    expect(rowOf(m, 1, O2.read)).toBe(0)
    // One that reads, met later, reads more: DAEMON as the third.
    const d = fight(CLOCK, [2, 1], 0, 2)
    expect(rowOf(d, 1, O2.read)).toBe((opponents[2]?.[O2.read] ?? 0) + 2 * 26)
  })

  it('has ROOT read a habit kept up, and lose to it changed', () => {
    const m = fight(CLOCK, [2, 1], 0, MIRROR)
    expect(rowOf(m, 1, O2.read)).toBe(Math.min(255, (opponents[4]?.[O2.read] ?? 0) + 3 * 26))
    const wake = (button: number) => wakeBeside(m, button)
    // Counted from here: the seed (the select's press) may give it a read before.
    const hits = read(m, 'readHits', 1)
    const miss = read(m, 'readMiss', 1)
    const kept = Array.from({ length: 10 }, () => wake(I.down | I.lp))
    // Twice before it knows; from then on it reads the strike and is crouched guarding.
    expect(kept.slice(0, 2).map((r) => r.guarded)).toEqual([1, 1])
    expect(kept.slice(2).map((r) => r.guarded)).toEqual(Array(8).fill(2))
    // Eight reads of the habit right (another of the fight's moments may be read right too).
    expect(read(m, 'readHits', 1) - hits).toBeGreaterThanOrEqual(8)
    expect(read(m, 'readMiss', 1) - miss).toBe(0)
    // The habit changed: still reading the strike, it guards and is thrown.
    const changed = wake(I.fwd | I.hp)
    expect(changed.threw).toBe(1)
    expect(read(m, 'readMiss', 1) - miss).toBe(1)
  })

  it('logs READ when a read was right', () => {
    const m = fight(CLOCK, [2, 1], 0, MIRROR)
    const logged = Array.from({ length: 6 }, () => wakeBeside(m, I.down | I.lp).log)
    expect(logged.slice(0, 2)).not.toContain('> READ')
    expect(logged.slice(2)).toEqual(Array(4).fill('> READ'))
  })
})

/**
 * Against the CPU of ladder place `at` (P1 in `slot`, driven by `p1` frame by frame and never
 * falling, so the habit is watched as long as the test runs): its habit's counts once it has
 * been due 16 times (at most 6,000 frames: DAEMON's gap comes round in 600; at 8, tried
 * 2026-10-08, DAEMON had taken no whim yet) - times due, times out, the counts drawn in order -
 * and its whims.
 */
function habitWatched(slot: number, at: number, p1: (k: number) => number) {
  const m = fight(CLOCK, [2, 1], slot, at)
  for (let k = 0; k < 6000 && read(m, 'outcome') === 0 && read(m, 'habDue', 1) < 16; k++) {
    put(m, 'fLife', 90, 0)
    step(m, p1(k))
  }
  const n = read(m, 'habDrawnN', 1)
  const last = Math.min(16, n)
  return {
    due: read(m, 'habDue', 1),
    fired: read(m, 'habFired', 1),
    drawn: Array.from({ length: last }, (_, k) => read(m, 'habDrawn', 16 + ((n - last + k) & 15))),
    whims: read(m, 'whims', 1),
  }
}

/**
 * P1 knocked down beside ROOT (kept still, always reading, never teching); as it stands,
 * `button`: whether that was guarded, whether it threw, and the log line meanwhile.
 */
function wakeBeside(m: Elec16, button: number): { guarded: number; threw: number; log: string } {
  still(m)
  place(m, 236, 270)
  for (const i of [0, 1]) put(m, 'fLife', 100, i)
  put(m, 'fState', ST2.down, 0)
  put(m, 'fStateT', 30, 0)
  still(m)
  setRow(m, 1, O2.read, 256)
  setRow(m, 1, O.rTech, 30)
  for (let k = 0; k < 40 && read(m, 'fState', 0) !== ST.stand; k++) step(m)
  let guarded = 0
  let threw = 0
  let log = ''
  for (let k = 0; k < 14; k++) {
    step(m, k === 0 ? button : button & I.down)
    guarded = Math.max(guarded, read(m, 'struck', 0))
    threw = Math.max(threw, read(m, 'threw', 0))
    if (k < 3) log = rowText(m, LOG_ROW) || log
  }
  steps(m, 30)
  return { guarded, threw, log }
}

/** P1's one-button players: a heavy punch, or all four buttons, whenever able. */
const ONE_BUTTON: Record<string, (k: number) => number> = {
  hp: (k) => (k & 1 ? I.hp : 0),
  all: (k) => [I.lp, 0, I.hp, 0, I.lk, 0, I.hk, 0][k & 7] ?? 0,
}
/** The ladder's five as met: [P1's slot, the place] (KERNEL is S1's, so P1 takes S2 for it). */
const MET = { PACKET: [0, 0], MAINFRAME: [0, 1], DAEMON: [0, 2], KERNEL: [1, 2], ROOT: [0, MIRROR] }

/**
 * A round against the CPU of ladder place `at` (P1 in `slot`, the clock's second `second`), P1
 * playing `p1` and standing where it is: who took it (`roundWon`, 1 the CPU); P1's heavies
 * struck in their recovery (the CPU's punishes, whiffed or guarded); the CPU's hits taken, and
 * of them those taken while it walked forward (into an attack under way).
 */
function oneButton(slot: number, at: number, second: number, p1: (k: number) => number) {
  const m = fight({ ...CLOCK, second }, [2, 1], slot, at)
  const heavy = (mv: number) => [MV.sHP, MV.sHK, MV.cHP, MV.cHK].includes(mv)
  let punished = 0
  let taken = 0
  let walking = 0
  for (let k = 0; k < 7_000 && read(m, 'phase') === PH.fight; k++) {
    const mv = read(m, 'fMove', 0)
    const r = moves[slot]?.[mv] ?? []
    const recovering =
      read(m, 'fState', 0) === ST.attack &&
      heavy(mv) &&
      read(m, 'fMoveF', 0) >= (r[C.startup] ?? 0) + (r[C.active] ?? 0)
    const free = [ST.stand, ST.crouch].includes(read(m, 'fState', 1))
    step(m, p1(k), 0)
    if ([1, 3, 4].includes(read(m, 'struck', 1)) && recovering) punished++
    if ([1, 3].includes(read(m, 'struck', 0))) {
      taken++
      if (free && (read(m, 'outWas', 1) & I.fwd) !== 0) walking++
    }
  }
  expect(read(m, 'phase')).not.toBe(PH.fight)
  return { won: read(m, 'roundWon'), punished, taken, walking }
}

describe('ELECFIGHTER the CPU against one button (design 7.7, 7.10)', { timeout: 120_000 }, () => {
  it('beats a heavy pressed whenever able, and all four mashed: it keeps out of reach and punishes', () => {
    // Measured 2026-10-08 in four seeds, before (the CPU walking in): the heavy punch beat
    // PACKET, MAINFRAME, DAEMON and KERNEL 4 of 4 times each, the CPU took 10 of the 60 matches
    // of the five against the three, and against DAEMON 50 of its 56 hits taken were walking
    // forward. After, in three seeds: 45 of 45, with 1 to 30 punishes a match. Since P4 a round
    // each of the heavy punch and the masher, in one seed (the heavy kick is the heavy punch's
    // kind, and every seed won): the test took two and a half minutes.
    let won = 0
    let all = 0
    let taken = 0
    let walking = 0
    for (const [name, [slot, at]] of Object.entries(MET)) {
      for (const [player, p1] of Object.entries(ONE_BUTTON)) {
        const r = oneButton(slot ?? 0, at ?? 0, 10, p1)
        const why = `${name} against ${player}: ${JSON.stringify(r)}`
        // Never a round without a punish.
        expect(r.punished, why).toBeGreaterThan(0)
        if (r.won === 1) won++
        all++
        taken += r.taken
        walking += r.walking
      }
    }
    expect(won / all).toBeGreaterThanOrEqual(0.9)
    // Walking into an attack under way: before, about half of the CPU's hits taken (DAEMON 14 of
    // 14); now a hit taken walking in is one the other started as it came, rarely.
    expect(walking / Math.max(1, taken)).toBeLessThan(0.15)
  })

  it('plays rounds of about half a minute CPU against CPU', () => {
    // Measured 2026-10-08: 16.4 s a round on average before (every round a KO); after the CPU
    // kept to its reach and the life went up by a quarter, 32.5 s over 36 rounds (13 to 66 s).
    // Since P4 the rounds of the two CPUs' matches the frame budget measures.
    const { rounds } = cpus()
    const avg = rounds.reduce((a, b) => a + b, 0) / rounds.length
    expect(rounds.length).toBeGreaterThanOrEqual(4)
    expect(avg, rounds.map((r) => r.toFixed(0)).join(' ')).toBeGreaterThanOrEqual(25)
    expect(avg).toBeLessThanOrEqual(50)
  })
})

describe('ELECFIGHTER pause and log (P2, design 5.3, 5.6)', () => {
  /**
   * The globals but the kit's pad and frame count and the sound's channels (the music goes on
   * muted, design 9): what a pause may move.
   */
  const frozen = (m: Elec16) => {
    const ram = globals(m)
    for (const name of ['padIs', 'padWas', 'padDown', 'seen', ...SOUND_STATE]) {
      const a = addr(name) - 0x280
      ram.fill(0, a, a + sizeOf(name))
    }
    return ram
  }

  it('pauses on START: nothing goes on, the fight darkened under PAUSED, the HUD as it was', () => {
    const m = fight(CLOCK, [2, 1])
    steps(m, 30, I.fwd)
    m.pad(padBit('start'))
    frames(m, 1, cart)
    m.pad(0)
    expect(read(m, 'paused')).toBe(1)
    // The pause's first frame shows the sprites made as it began (the drawn fighters' counts
    // change with their poses, so it may hide some the frame before showed): from then on,
    // nothing.
    frames(m, 1, cart)
    const before = frozen(m)
    const seed = read(m, 'seed')
    for (let k = 0; k < 90; k++) {
      m.pad(k % 3 === 0 ? padBit('y') | padBit('right') : padBit('x'))
      frames(m, 1, cart)
    }
    m.pad(0)
    frames(m, 1, cart)
    expect(frozen(m)).toEqual(before)
    expect(read(m, 'seed')).toBe(seed)
    // The stage, the fighters and their shadows mixed 10/16 to black; the HUD's slots untouched.
    for (const slot of [0, 8, 9]) {
      const k = 1
      expect(shown(m, slot, k), `slot ${slot}`).toBeLessThan(kept(m, slot, k))
    }
    for (const slot of [1, 2, 3, 4, 5, 6]) {
      for (let k = 1; k < 16; k++) expect(shown(m, slot, k)).toBe(kept(m, slot, k))
    }
    expect(bigText(m, 14)).toBe('PAUSED')
    expect([20, 21, 22].map((y) => rowText(m, y))).toEqual(['> RESUME', 'CONTROLS', 'QUIT FIGHT'])
    // The music muted (its channels go on unheard), the effects still heard.
    expect(read(m, 'muted')).toBe(0x0fff)
    // RESUME: as it was, and the fight goes on.
    tap(m, padBit('a'), cart)
    expect(read(m, 'paused')).toBe(0)
    expect(read(m, 'muted')).toBe(0)
    expect(shown(m, 9, 1)).toBe(kept(m, 9, 1))
    const t = read(m, 'timeT')
    steps(m, 3)
    expect(read(m, 'timeT')).not.toBe(t)
  })

  it('shows the pose and the floor of the frame the pause began on, not a frame behind', () => {
    // Found in review 2026-10-08: the pause's frames showed the sprites made as it began but
    // not their cells (streamed as a frame begins) nor the floor's lines made for that camera.
    // Walking, poses and the camera change every few frames: START on each of eight frames.
    let caught = 0
    for (let at = 0; at < 8; at++) {
      const m = fight(CLOCK, [2, 1])
      put(m, 'fX', 300 * 16, 1)
      steps(m, 20 + at, I.fwd)
      m.pad(padBit('start'))
      frames(m, 1, cart)
      m.pad(0)
      expect(read(m, 'paused')).toBe(1)
      if (read(m, 'artWant', 0) | read(m, 'artWant', 1) | read(m, 'scrollMade')) caught++
      frames(m, 2, cart)
      expect([read(m, 'artWant', 0), read(m, 'artWant', 1), read(m, 'scrollMade')]).toEqual([
        0, 0, 0,
      ])
    }
    // The case the pause must handle came up: a picture or the floor still waiting as it began.
    expect(caught).toBeGreaterThan(0)
  })

  it('quits the fight from the pause, and shows the controls from it', () => {
    const m = fight(CLOCK, [2, 1])
    tap(m, padBit('start'), cart)
    tap(m, padBit('down'), cart)
    tap(m, padBit('a'), cart)
    expect(read(m, 'screen')).toBe(SC.controls)
    expect(rowText(m, 2)).toBe('CONTROLS')
    tap(m, padBit('b'), cart)
    expect(bigText(m, 14)).toBe('PAUSED')
    tap(m, padBit('down'), cart)
    tap(m, padBit('a'), cart)
    expect(read(m, 'ladderEnd')).toBe(3)
    frames(m, 4, cart)
    expect(read(m, 'screen')).toBe(SC.title)
  })

  /** P1's light punch in P2's heavy kick's startup: a counter hit, with the log on or off. */
  function counter(m: Elec16): Elec16 {
    const n = fight(m)
    place(n, 236, 270)
    step(n, 0, I.hk)
    for (let k = 0; k < 10 && read(n, 'struck', 0) === 0; k++) step(n, k === 0 ? I.lp : 0, 0)
    expect(read(n, 'struck', 0)).toBe(3)
    return n
  }

  it('writes what happened on the log line, fades it after 60 frames, and is off when LOG is', () => {
    const m = counter(boot())
    expect(rowText(m, LOG_ROW)).toBe('> P1 COUNTER  LIGHT PUNCH')
    expect(shown(m, 5, 1)).toBe(kept(m, 5, 1))
    steps(m, 60)
    expect(rowText(m, LOG_ROW)).toBe('> P1 COUNTER  LIGHT PUNCH')
    expect(shown(m, 5, 1)).toBe(kept(m, 5, 1))
    steps(m, 8)
    expect(shown(m, 5, 1)).not.toBe(kept(m, 5, 1))
    steps(m, 10)
    expect(rowText(m, LOG_ROW)).toBe('')
    expect(shown(m, 5, 1)).toBe(kept(m, 5, 1))
    // A on the controls (from the title's menu) turns it off, and the save RAM keeps it.
    const off = boot()
    tap(off, padBit('start'), cart)
    tap(off, padBit('down'), cart)
    tap(off, padBit('a'), cart)
    expect(read(off, 'screen')).toBe(SC.controls)
    tap(off, padBit('a'), cart)
    expect(rowText(off, 30)).toContain('LOG OFF')
    expect(read(off, 'logOff')).toBe(1)
    tap(off, padBit('start'), cart)
    until(off, SC.title, 4)
    const n = counter(off)
    expect(rowText(n, LOG_ROW)).toBe('')
  })
})

describe('ELECFIGHTER the ladder (P2, design 5.4, 7.10.5)', { timeout: 300_000 }, () => {
  it('meets the three of other slots in order of strength, then ROOT in the same slot', () => {
    const names = (slot: number) => {
      const m = fight(CLOCK, [2, 2], slot)
      return [0, 1, 2, 3].map((k) => read(m, 'ladder', k))
    }
    // Rows: 0 PACKET (S2), 1 MAINFRAME (S3), 2 DAEMON (S4), 3 KERNEL (S1), 4 ROOT.
    expect(names(0)).toEqual([0, 1, 2, 4])
    expect(names(1)).toEqual([1, 2, 3, 4])
    expect(names(3)).toEqual([0, 1, 3, 4])
    const m = fight(CLOCK, [2, 2], 2, 3)
    expect([read(m, 'fSlot', 0), read(m, 'fSlot', 1)]).toEqual([2, 2])
    // Later is quicker and reads more: reactions less 2 a place (never under 8), reads 26 more.
    const at = (k: number) => fight(CLOCK, [2, 1], 0, k)
    const first = at(0)
    const root = at(3)
    expect(rowOf(first, 1, O.rGuard)).toBe(opponents[0]?.[O.rGuard])
    expect(rowOf(root, 1, O.rGuard)).toBe(Math.max(8, (opponents[4]?.[O.rGuard] ?? 0) - 6))
    expect(rowOf(root, 1, O2.read)).toBe(Math.min(255, (opponents[4]?.[O2.read] ?? 0) + 3 * 26))
  })

  /** A round lost by `loser` to a light punch, then on to the next fight or CONTINUE?. */
  function koRound(m: Elec16, loser: number): void {
    place(m, 236, 270)
    put(m, 'fLife', 1, loser)
    for (let k = 0; k < 10 && read(m, 'phase') === PH.fight; k++) {
      step(m, loser === 1 && k === 0 ? I.lp : 0, loser === 0 && k === 0 ? I.lp : 0)
    }
    expect(read(m, 'phase')).toBe(PH.over)
    for (
      let k = 0;
      k < 1500 &&
      (read(m, 'phase') !== PH.fight || read(m, 'screen') !== SC.fight) &&
      read(m, 'screen') !== SC2.cont;
      k++
    ) {
      step(m)
    }
  }

  it('goes on to the next opponent after a win, counts CONTINUE? after a loss', () => {
    const m = fight(CLOCK, [2, 2])
    koRound(m, 1)
    expect(read(m, 'ladderAt')).toBe(0)
    koRound(m, 1)
    expect(read(m, 'ladderAt')).toBe(1)
    expect(read(m, 'phase')).toBe(PH.fight)
    // Lost twice: CONTINUE? and a count; START plays the same one again.
    koRound(m, 0)
    koRound(m, 0)
    expect(bigText(m, 14)).toBe('CONTINUE?')
    expect(read(m, 'contN')).toBe(9)
    steps(m, 61)
    expect(read(m, 'contN')).toBe(8)
    tap(m, padBit('start'), cart)
    for (let k = 0; k < 300 && read(m, 'phase') !== PH.fight; k++) step(m)
    expect(read(m, 'ladderAt')).toBe(1)
    expect(read(m, 'continues')).toBe(1)
  })

  it('plays a whole ladder CPU against CPU to SYSTEM CLEAR, ROOT last, within the frame', () => {
    // P1's CPU kept standing and each opponent at one life once the fight is on (a fight to the
    // end is measured once for the file, cpus()): it beats all four in turn, ROOT last.
    const c = boot()
    put(c, 'choice', ROOT_ROW, 2)
    fight(c, [1, 1])
    const order: number[] = [read(c, 'ladder', read(c, 'ladderAt'))]
    for (let f = 0; f < 30_000 && read(c, 'ladderEnd') === 0; f++) {
      put(c, 'fLife', 100, 0)
      if (read(c, 'screen') === SC.fight && read(c, 'phase') === PH.fight) {
        put(c, 'fLife', Math.min(1, read(c, 'fLife', 1)), 1)
      }
      frames(c, 1, cart)
      const now = read(c, 'ladder', read(c, 'ladderAt'))
      if (now !== order[order.length - 1]) order.push(now)
    }
    expect(c.state.halt).toBeNull()
    expect(read(c, 'ladderEnd')).toBe(1)
    expect(order).toEqual([0, 1, 2, 4])
    expect(read(c, 'continues')).toBe(0)
    // Measured on 2026-10-08 over a whole ladder of CPUs: 3,950 frames of fighting, 9,240 cycles
    // on average and 17,069 at worst (design 10.4: 25,000 and 40,000). A frame that loads a
    // match runs past the frame (76,879: both backgrounds cleared whole, the stage's map and both
    // slots' tables) and the picture waits a frame there, as it did in P1. With GRID's raster
    // (the floor a line at a time, about 6,300 cycles a frame for the LINEs, and its tables made
    // when the camera moves) on 2026-10-08: 17,271 on average and 25,413 at worst. With the
    // drawn fighters (P3: a pose's cells streamed by one load, its sprites laid from its row, the
    // palettes' effects, the KO's pieces; in bank 4) on 2026-10-08: 16,673 and 29,116, 16 sprites
    // at most on a line. With the screens and the sound (P3) on 2026-10-08: 17,191 to 18,030 and
    // 29,189 to 32,084 (the ladder the seed gives moves with any change to the code before
    // START), 16 sprites. Since P4 the two CPUs' matches of cpus() stand for the ladder.
    const r = cpus()
    expect(r.halted).toBe(false)
    expect(r.outcomes.every((o) => o !== 0)).toBe(true)
    expect(r.avg).toBeLessThan(25_000)
    expect(r.worst).toBeLessThan(40_000)
    expect(r.line).toBeLessThanOrEqual(32)
    expect(r.avg).toBeLessThanOrEqual(19_000)
    expect(r.worst).toBeLessThanOrEqual(34_000)
  })
})

/**
 * Two CPUs' matches (P1's CPU in S1 against the ladder's first two, the clock's second 20),
 * played once for the file and measured frame by frame (a frame that loads a round or a match
 * is not one of them): the rounds' lengths in seconds, the frames' average and busiest cycles,
 * the most sprites on a line, the outcomes, and whether the machine stopped.
 */
function playCpus() {
  const rounds: number[] = []
  const outcomes: number[] = []
  let sum = 0
  let worst = 0
  let line = 0
  let n = 0
  let halted = false
  for (const at of [0, 1]) {
    const m = fight({ ...CLOCK, second: 20 }, [1, 1], 0, at)
    let r = 0
    for (let k = 0; k < 30_000 && read(m, 'outcome') === 0; k++) {
      const fighting = read(m, 'phase') === PH.fight
      const c0 = m.state.cycles
      frames(m, 1, cart)
      if (!fighting) continue
      r++
      if (read(m, 'phase') !== PH.fight) {
        rounds.push(r / 60)
        r = 0
        continue
      }
      const d = m.state.cycles - c0
      sum += d
      worst = Math.max(worst, d)
      line = Math.max(line, ...perLine(m))
      n++
    }
    outcomes.push(read(m, 'outcome'))
    halted ||= m.state.halt !== null
  }
  return { rounds, avg: sum / n, worst, line, outcomes, halted }
}
let cpusPlayed: ReturnType<typeof playCpus> | undefined
const cpus = () => {
  cpusPlayed ??= playCpus()
  return cpusPlayed
}

describe('ELECFIGHTER chance and the frame budget', () => {
  /** P1 idle on the pad, the stand-in against it: the match's RAM after `n` frames. */
  const match = (clock: Elec16 | typeof CLOCK = CLOCK, n = 300) => {
    const m = fight(clock, [0, 1])
    frames(m, n, cart)
    return m
  }

  it('plays the same match from the same clock and buttons, another from another clock', () => {
    // One played from its first frame, one from the snapshot the tests keep: the same.
    const a = match(boot())
    const b = match()
    expect(globals(a)).toEqual(globals(b))
    const c = match({ ...CLOCK, second: 13 })
    const moves = (m: Elec16) => [read(m, 'fX', 1), read(m, 'fLife', 0), read(m, 'fMove', 1)]
    expect(globals(c)).not.toEqual(globals(a))
    expect(moves(c)).not.toEqual(moves(a))
  })

  /** A match played frame by frame: the average and busiest frame's cycles, the most sprites on a line. */
  function measured(m: Elec16, n: number, pad: (k: number) => number) {
    let sum = 0
    let worst = 0
    let line = 0
    let k = 0
    for (; k < n && read(m, 'outcome') === 0; k++) {
      put(m, 'extHeld', pad(k), 0)
      const c0 = m.state.cycles
      frames(m, 1, cart)
      const d = m.state.cycles - c0
      sum += d
      worst = Math.max(worst, d)
      line = Math.max(line, ...perLine(m))
    }
    expect(m.state.halt).toBeNull()
    return { avg: sum / k, worst, line, frames: k, outcome: read(m, 'outcome') }
  }

  it('begins a match within a frame: the select to the versus and the fight, two CPUs measuring', () => {
    // Found in review 2026-10-08: the frame the select gave way to the versus took 212,461
    // cycles (both sides' reaches measured on the boxes, 60,000 each, a word and a bank a time;
    // both backgrounds cleared a word at a time, 49,000), over three frames' worth.
    const m = boot()
    toSelect(m)
    tap(m, padBit('a'), cart)
    put(m, 'ctl', 1, 0)
    put(m, 'ctl', 1, 1)
    let worst = 0
    for (let k = 0; k < 300 && read(m, 'phase') !== PH.fight; k++) {
      const c0 = m.state.cycles
      frames(m, 1, cart)
      worst = Math.max(worst, m.state.cycles - c0)
    }
    expect(read(m, 'screen')).toBe(SC.fight)
    expect(worst).toBeLessThan(66_667)
  })

  it("plays a scripted fight and two CPUs' matches within their frames, 32 sprites a line", () => {
    const script = [
      I.fwd,
      I.fwd | I.lp,
      I.hp,
      I.back,
      I.down | I.lk,
      I.up | I.fwd,
      I.hk,
      I.down | I.hp,
      0,
    ]
    // Its first 2,400 frames (since P4; before, the match to its end, 2,780 frames): rounds,
    // a KO and the next round's start come in them.
    const scripted = measured(
      fight(CLOCK, [2, 1]),
      2400,
      (k) => script[(k >> 4) % script.length] ?? 0,
    )
    // Two CPUs' matches are measured once for the file (cpus()).
    const both = cpus()
    expect(both.outcomes.every((o) => o !== 0)).toBe(true)
    // 4 MHz at 60 frames: 66,667 cycles a frame (design 10.4: under 25,000 on average, 40,000 at worst).
    for (const r of [scripted, both]) {
      expect(r.avg).toBeLessThan(25_000)
      expect(r.worst).toBeLessThan(40_000)
      expect(r.line).toBeLessThanOrEqual(32)
    }
    // As measured on 2026-10-08 with the coloured boxes and the CPU (P2): the scripted match
    // against PACKET 8,230 cycles on average and 15,291 at worst over 3,104 frames, two CPUs'
    // 8,965 and 16,531 over 3,604 (P1's stand-ins: 7,505 and 15,130); 21 sprites on the busiest
    // line. The match follows the seed, which takes the cycle counter at START, so any change to
    // the code plays another: held with room, to be tightened as the phases come. With GRID's
    // raster (the floor a line at a time) on 2026-10-08: the scripted match 15,451 and 24,489
    // over 1,749 frames, two CPUs' 16,667 and 24,499 over 3,125. With the drawn fighters (P3) on
    // 2026-10-08: the scripted match 15,355 and 27,644 over 2,575 frames, two CPUs' 16,521 and
    // 30,078 over 2,460; 16 sprites on the busiest line. With the screens and the sound (P3: the
    // kit's sound ticked every frame, the fight's effects heard in the look, the wider bodies) on
    // 2026-10-08: the scripted match 16,597 and 32,696 over 2,780 frames, two CPUs' 17,430 and
    // 30,388 over 3,519; 26 sprites on the busiest line.
    expect(scripted.avg).toBeLessThanOrEqual(17_500)
    expect(scripted.worst).toBeLessThanOrEqual(34_000)
    // With places rounded from the way each faces (`pointX`, a call where a shift was) and S4's
    // and DAEMON's new numbers on 2026-10-08: two CPUs' 18,822 on average and 32,667 at worst.
    expect(both.avg).toBeLessThanOrEqual(19_000)
    expect(both.worst).toBeLessThanOrEqual(33_000)
  })
})

describe('ELECFIGHTER the look (P3, design 2.4)', () => {
  /** A P1 heavy punch that knocks P2 (one life left) out; the frames of the round's end after it. */
  function knockOut(): Elec16 {
    const m = fight()
    place(m, 236, 270)
    put(m, 'fLife', 1, 1)
    for (let k = 0; k < 30 && read(m, 'phase') !== PH.over; k++) step(m, k === 0 ? I.hp : 0, 0)
    expect(read(m, 'phase')).toBe(PH.over)
    return m
  }

  it('draws a fighter in from the void as a round begins, the wire first, then the fill', () => {
    const m = knockOut()
    for (let k = 0; k < 300 && read(m, 'phase') !== PH.round; k++) step(m)
    frames(m, 3, cart)
    // The fills are the void's colour, the wire there.
    expect(shown(m, 8, 3)).toBe(kept(m, 8, 13))
    expect(shown(m, 8, 2)).toBe(kept(m, 8, 2))
    for (let k = 0; k < 45 && read(m, 'phase') === PH.round; k++) frames(m, 1, cart)
    frames(m, 2, cart)
    for (const k of [1, 3, 6, 9]) expect(shown(m, 8, k)).toBe(kept(m, 8, k))
  })

  it('flashes the one struck, and shows a spark where the blow lands', () => {
    const m = fight()
    place(m, 236, 270)
    for (let k = 0; k < 20 && read(m, 'struck', 0) === 0; k++) step(m, k === 0 ? I.hp : 0, 0)
    frames(m, 1, cart)
    expect(shown(m, 9, 1)).toBe(0x7fff)
    expect(shown(m, 8, 1)).toBe(kept(m, 8, 1))
    expect(read(m, 'fxK', 0)).toBe(1)
  })

  it('takes the fill of the one knocked out to the void, then breaks it into its pieces both ways', () => {
    const m = knockOut()
    for (let k = 0; k < 45 && read(m, 'phaseT') < 41; k++) step(m)
    expect(read(m, 'shOn', 1)).toBe(1)
    expect(read(m, 'shOn', 0)).toBe(0)
    const n = read(m, 'art', 34 + 1)
    expect(n).toBeGreaterThan(8)
    const vx = Array.from({ length: n }, (_, c) => (read(m, 'shVX', 32 + c) << 16) >> 16)
    expect(vx.filter((v) => v < 0).length).toBeGreaterThan(n / 4)
    expect(vx.filter((v) => v > 0).length).toBeGreaterThan(n / 4)
    // Its fills are the void (its wire only); the winner's are its own.
    expect(shown(m, 9, 4)).toBe(kept(m, 9, 13))
    expect(shown(m, 8, 4)).toBe(kept(m, 8, 4))
    // The next round draws the fighter whole again.
    for (let k = 0; k < 200 && read(m, 'phase') !== PH.fight; k++) step(m)
    expect(read(m, 'shOn', 1)).toBe(0)
    expect(read(m, 'artHold', 1)).toBe(0)
  })
})

/* ---------------- P3: the screens, the sound, save RAM, the polish ---------------- */

/** The effects' numbers (engine/audio.e16.ts). */
const X = { light: 0, heavy: 1, guard: 2, whiff: 3, dash: 4, throw: 5, land: 6, down: 7 }
const X2 = { shards: 8, round: 9, fight: 10, time: 11, ko: 12, mat: 13, move: 14, ok: 15 }
const hear = (m: Elec16, k: number) => (read(m, 'sfxHeard') & (1 << k)) !== 0

/** The cartridge's save RAM as it is now, and a word of it. */
const saveOf = (m: Elec16) => Uint8Array.from(m.state.cart?.save ?? [])
const saveWord = (save: Uint8Array, k: number) => (save[k] ?? 0) | ((save[k + 1] ?? 0) << 8)

/** A round won by P1 or lost (`loser`): the loser at one life, a light punch, the round's end. */
function roundTo(m: Elec16, loser: number): void {
  place(m, 236, 270)
  put(m, 'fLife', 1, loser)
  for (let k = 0; k < 10 && read(m, 'phase') === PH.fight; k++) {
    step(m, loser === 1 && k === 0 ? I.lp : 0, loser === 0 && k === 0 ? I.lp : 0)
  }
  expect(read(m, 'phase')).toBe(PH.over)
  for (let k = 0; k < 200 && read(m, 'phase') === PH.over; k++) step(m)
}

/** A match: two rounds to `loser`'s loss, on to the result after its END band. */
function matchTo(m: Elec16, loser: number): void {
  roundTo(m, loser)
  for (let k = 0; k < 200 && read(m, 'phase') !== PH.fight; k++) step(m)
  roundTo(m, loser)
  until(m, SC.result, 400)
  // The result takes a press from its 20th frame.
  frames(m, 20, cart)
}

/** BG1's row `y` from column `x`, `n` columns, as the font's words. */
function textAt(m: Elec16, x: number, y: number, n: number): string {
  const mem = m.state.video?.mem ?? new Uint8Array()
  let s = ''
  for (let k = 0; k < n; k++) {
    const at = 0xa000 + y * 128 + (x + k) * 2
    const t = ((mem[at] ?? 0) | ((mem[at + 1] ?? 0) << 8)) & 0x3ff
    s += t < 128 ? String.fromCharCode(32 + (t & 63)) : ' '
  }
  return s.trim()
}

describe('ELECFIGHTER the screens (P3, design 5.4)', { timeout: 300_000 }, () => {
  it('goes from the boot log through the title, controls, select, versus and fights to the results', () => {
    const m = power()
    expect(read(m, 'screen')).toBe(SC.boot)
    expect(rowText(m, 3)).toBe('ELEC-16 PLAY  ELECFIGHTER')
    // The log's lines one by one, then the title by itself.
    frames(m, 40, cart)
    expect(rowText(m, 7)).toContain('LOADING FIGHTER DATA')
    expect(rowText(m, 13)).toBe('')
    until(m, SC.title, 120)
    expect(read(m, 'songNow')).toBe(1)
    // START: the menu; A: VERSUS CPU, the controls first (the first time), START past them.
    tap(m, padBit('start'), cart)
    expect([13, 14, 15].map((y) => rowText(m, y))).toEqual(['> VERSUS CPU', 'CONTROLS', 'BEST'])
    tap(m, padBit('a'), cart)
    expect(read(m, 'screen')).toBe(SC.controls)
    tap(m, padBit('start'), cart)
    until(m, SC.select, 4)
    expect(read(m, 'songNow')).toBe(2)
    expect(rowText(m, 1)).toBe('SELECT FIGHTER                  VS CPU')
    // B goes back to the title; the second VERSUS CPU goes straight to the select.
    tap(m, padBit('b'), cart)
    until(m, SC.title, 4)
    tap(m, padBit('start'), cart)
    tap(m, padBit('a'), cart)
    expect(read(m, 'screen')).toBe(SC.select)
    // A: the win pose, then the versus, the round's banner and the fight to the stage's song.
    tap(m, padBit('a'), cart)
    until(m, SC.versus, 60)
    put(m, 'ctl', 2, 0)
    put(m, 'ctl', 2, 1)
    until(m, SC.fight, 200)
    expect(bigText(m, 14)).toBe('ROUND 1')
    for (let k = 0; k < 100 && read(m, 'phase') !== PH.fight; k++) step(m)
    expect(read(m, 'songNow')).toBe(3)
    // Won: the result (WIN, the rounds), then the next opponent's versus.
    matchTo(m, 1)
    expect(bigText(m, 2)).toBe('WIN')
    expect(textAt(m, 10, 11, 20)).toBe('ROUNDS          2-0')
    expect(read(m, 'songNow')).toBe(4)
    tap(m, padBit('start'), cart)
    until(m, SC.versus, 30)
    expect(read(m, 'ladderAt')).toBe(1)
  })

  it('counts CONTINUE? down to GAME OVER after a loss, and goes back to the title', () => {
    const m = fight()
    matchTo(m, 0)
    expect(bigText(m, 2)).toBe('LOSE')
    expect(read(m, 'songNow')).toBe(5)
    tap(m, padBit('start'), cart)
    until(m, SC2.cont, 10)
    expect(bigText(m, 14)).toBe('CONTINUE?')
    until(m, SC2.over, 700)
    expect(read(m, 'contN')).toBe(0)
    expect(bigText(m, 14)).toBe('GAME OVER')
    until(m, SC.title, 200)
    expect(read(m, 'ladderEnd')).toBe(2)
  })

  it('reaches SYSTEM CLEAR after the last, keeps the clear in save RAM, and shows it in BEST', () => {
    const m = fight(CLOCK, [2, 2], 2, MIRROR)
    matchTo(m, 1)
    tap(m, padBit('start'), cart)
    until(m, SC2.clear, 10)
    expect(bigText(m, 3)).toBe('SYSTEM CLEAR')
    expect(read(m, 'songNow')).toBe(6)
    expect(rowText(m, 8)).toBe('S3 POWER')
    expect(rowText(m, 13)).toBe('NEW RECORD')
    const sec = read(m, 'clearSec')
    expect(sec).toBeGreaterThan(0)
    // Slot 2 (S3): one clear, its time; the streak one match.
    const save = saveOf(m)
    expect(saveWord(save, 16 + 2 * 8)).toBe(1)
    expect(saveWord(save, 16 + 2 * 8 + 2)).toBe(sec)
    expect(saveWord(save, 10)).toBe(1)
    const mmss = (t: number) =>
      `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
    /** A row of the records: the slot, its clears, its best time. */
    const record = (y: number) => [textAt(m, 4, y, 14), textAt(m, 20, y, 3), textAt(m, 29, y, 5)]
    expect(record(22)).toEqual(['S3 POWER', '1', mmss(sec)])
    // It takes a press from its second second.
    frames(m, 60, cart)
    tap(m, padBit('start'), cart)
    until(m, SC.title, 30)
    expect(read(m, 'ladderEnd')).toBe(1)
    // BEST from the menu shows the same.
    tap(m, padBit('start'), cart)
    tap(m, padBit('down'), cart)
    tap(m, padBit('down'), cart)
    tap(m, padBit('a'), cart)
    expect(read(m, 'screen')).toBe(SC2.best)
    expect(record(12)).toEqual(['S3 POWER', '1', mmss(sec)])
    expect(record(10)).toEqual(['S1 BALANCE', '0', '--:--'])
    expect([textAt(m, 4, 16, 14), textAt(m, 20, 16, 3)]).toEqual(['BEST STREAK', '1'])
  })

  it('shows HOW TO PLAY and BEST in turn when the title is left alone', () => {
    const m = boot()
    frames(m, 365, cart)
    expect(rowText(m, 13)).toBe('HOW TO PLAY')
    frames(m, 360, cart)
    frames(m, 360, cart)
    expect(rowText(m, 13)).toBe('BEST RECORDS')
    // The four figures drawn in, one after another, from their wire alone.
    const n = boot()
    frames(n, 2, cart)
    for (const sl of [11, 12, 13, 14]) expect(shown(n, sl, 3)).toBe(kept(n, sl, 13))
    frames(n, 200, cart)
    for (const sl of [11, 12, 13, 14]) expect(shown(n, sl, 3)).toBe(kept(n, sl, 3))
  })

  it('tables the controls for both button sets, PAD | PC KEY | ACTION, and keeps the set', () => {
    const m = boot()
    tap(m, padBit('start'), cart)
    tap(m, padBit('down'), cart)
    tap(m, padBit('a'), cart)
    expect(read(m, 'screen')).toBe(SC.controls)
    const cells = (y: number) => [textAt(m, 2, y, 11), textAt(m, 13, y, 13), textAt(m, 26, y, 14)]
    expect(cells(5)).toEqual(['PAD', 'PC KEY', 'ACTION'])
    expect(cells(12)).toEqual(['Y', 'A', 'LIGHT PUNCH'])
    expect(cells(13)).toEqual(['X', 'S', 'HEAVY PUNCH'])
    expect(cells(14)).toEqual(['B', 'X', 'LIGHT KICK'])
    expect(cells(15)).toEqual(['A', 'Z', 'HEAVY KICK'])
    expect(cells(18)).toEqual(['SELECT', 'RIGHT SHIFT', 'BUTTON TYPE'])
    expect(cells(19)).toEqual(['L  R', 'Q  W', 'NOT USED'])
    expect(rowText(m, 22)).toBe('THROW     NEAR, < OR > + HEAVY PUNCH')
    expect(textAt(m, 22, 29, 15)).toBe('TYPE A  PAD')
    tap(m, padBit('select'), cart)
    expect(cells(14)).toEqual(['B', 'X', 'HEAVY KICK'])
    expect(cells(15)).toEqual(['A', 'Z', 'LIGHT KICK'])
    expect(cells(12)).toEqual(['Y', 'A', 'LIGHT PUNCH'])
    expect(textAt(m, 22, 29, 15)).toBe('TYPE B  PC KEYS')
    expect(saveWord(saveOf(m), 2)).toBe(1)
  })

  it("draws each slot's bars from its tables: POWER, SPEED, REACH, DEFENSE", () => {
    const level = (v: number, lo: number, step: number) =>
      v <= lo ? 1 : Math.min(5, 1 + Math.floor((v - lo) / step))
    const want = SLOT_IDS.map((id, s) => {
      const mv = moves[s] ?? []
      const heavy = [1, 3, 5, 7].reduce((a, k) => a + (mv[k]?.[C.damage] ?? 0), 0)
      const pr = profiles[s] ?? []
      const boxes = table(`fighters/${id}/poses.txt`, 24)
      const hk = boxes[(mv[MV.sHK]?.[14] ?? 0) + 1] ?? []
      return [
        level(heavy, 44, 6),
        level(pr[2] ?? 0, 15, 2),
        level((hk[16] ?? 0) + (hk[18] ?? 0), 36, 2),
        level((pr[0] ?? 0) + (pr[1] ?? 0), 200, 10),
      ]
    })
    const m = boot()
    toSelect(m)
    const hud = Number(/export const HUD_TILE = (0x[0-9a-f]+)/.exec(built.report.assets)?.[1])
    /** A bar's lit segments: two cells each, the life bar's whole tile and its 7 points. */
    const lit = (y: number) =>
      [0, 1, 2, 3, 4].filter((k) => {
        const mem = m.state.video?.mem ?? new Uint8Array()
        const cell = (x: number) => {
          const at = 0xa000 + y * 128 + x * 2
          return ((mem[at] ?? 0) | ((mem[at + 1] ?? 0) << 8)) & 0x3ff
        }
        const whole = cell(29 + k * 2) === hud + 8 + 80
        expect(cell(30 + k * 2), `segment ${k}`).toBe(whole ? hud + 8 + 70 : hud + 8)
        return whole
      }).length
    const got: number[][] = []
    for (let s = 0; s < 4; s++) {
      const bars = [0, 1, 2, 3].map((k) => read(m, 'bars', k))
      got.push(bars)
      expect([22, 24, 26, 28].map(lit), `slot ${s}`).toEqual(bars)
      expect(textAt(m, 19, 17, 15)).toBe(['S1 BALANCE', 'S2 RUSH', 'S3 POWER', 'S4 OUTBOX'][s])
      tap(m, padBit('right'), cart)
    }
    expect(got).toEqual(want)
    // The bars tell the slots apart: no bar is the same for all four.
    for (let k = 0; k < 4; k++) expect(new Set(got.map((g) => g[k])).size).toBeGreaterThan(1)
  })

  it("names the opponent's program on the versus with three lines on its style, never its habit", () => {
    const never = ['THROW', 'HABIT', 'ALWAYS', 'LOW', 'MID', 'CROUCH', 'JUMP', 'READ', 'CYCLE']
    const seen: string[] = []
    for (const [slot, place] of [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
      [0, 3],
    ] as const) {
      const m = boot()
      put(m, 'choice', slot, 0)
      put(m, 'choice', place, 1)
      toSelect(m)
      tap(m, padBit('a'), cart)
      until(m, SC.versus, 60)
      frames(m, 40, cart)
      const k = read(m, 'ladder', place)
      const name = ['PACKET', 'MAINFRAME', 'DAEMON', 'KERNEL', 'ROOT'][k] ?? ''
      expect(rowText(m, 8)).toBe(`PROGRAM ${name}`)
      for (const l of [10, 11, 12].map((y) => rowText(m, y))) {
        expect(l.length).toBeGreaterThan(5)
        for (const w of never) expect(l, `${name}: ${l}`).not.toMatch(new RegExp(`\\b${w}`))
      }
      seen.push(name)
      // RENDER to 100%, the fills there by then.
      expect(textAt(m, 4, 31, 12)).toBe('RENDER 100%')
      expect(shown(m, 9, 3)).toBe(kept(m, 9, 3))
    }
    expect(seen).toEqual(['PACKET', 'MAINFRAME', 'DAEMON', 'KERNEL', 'ROOT'])
  })

  it('keeps the button set, the log and the records in save RAM, marked EF and versioned', () => {
    const m = boot()
    let save = saveOf(m)
    expect(saveWord(save, 0)).toBe(0x4645)
    expect([2, 4, 6, 8].map((k) => saveWord(save, k))).toEqual([0, 0, 1, 0])
    // TYPE B on the title, the log off on the controls (the first VERSUS CPU marks them seen).
    tap(m, padBit('select'), cart)
    tap(m, padBit('start'), cart)
    tap(m, padBit('a'), cart)
    tap(m, padBit('a'), cart)
    tap(m, padBit('start'), cart)
    until(m, SC.select, 4)
    save = saveOf(m)
    expect([2, 4, 8].map((k) => saveWord(save, k))).toEqual([1, 1, 1])
    // Switched on again with it: TYPE B, the log off, VERSUS CPU straight to the select.
    const again = boot(CLOCK, save)
    expect([read(again, 'buttonSet'), read(again, 'logOff')]).toEqual([1, 1])
    tap(again, padBit('start'), cart)
    tap(again, padBit('a'), cart)
    expect(read(again, 'screen')).toBe(SC.select)
    // P2's layout (the mark, TYPE, LOG, nothing after): its two words kept, the rest new.
    const old = new Uint8Array(8192).fill(0x55)
    for (const [k, v] of [
      [0, 0x4645],
      [2, 1],
      [4, 0],
    ] as const) {
      old[k] = v & 255
      old[k + 1] = v >> 8
    }
    const up = boot(CLOCK, old)
    expect([read(up, 'buttonSet'), read(up, 'logOff')]).toEqual([1, 0])
    const now = saveOf(up)
    expect([6, 8, 10, 16, 18, 16 + 7 * 8 + 2].map((k) => saveWord(now, k))).toEqual([
      1, 0, 0, 0, 0, 0,
    ])
  })
})

describe('ELECFIGHTER sound (P3, design 9)', () => {
  const songs: Song[] = [
    ...compileSongs(readFileSync(`${DIR}/music/songs.mml`, 'utf8')),
    ...compileSongs(readFileSync(`${DIR}/music/sfx.mml`, 'utf8')),
  ]

  it('has its songs on 0-11 with every channel in step, its effects on 12-15', () => {
    expect(songs.filter((s) => !s.name.startsWith('x_')).map((s) => s.name)).toEqual([
      'title',
      'select',
      'fight',
      'win',
      'lose',
      'clear',
    ])
    for (const song of songs) {
      const effect = song.name.startsWith('x_')
      for (const ch of song.channels) {
        expect(ch.channel < 12, `${song.name} C${ch.channel}`).toBe(!effect)
        expect(ch.channel).toBeLessThan(CHANNELS)
      }
      if (effect) continue
      // Looped: every channel's loop the same length; once through: every channel ends together.
      const loops = new Set(loopFrames(song).values())
      expect([...loops], song.name).toHaveLength(loops.size > 0 ? 1 : 0)
      if (loops.size === 0) expect(new Set(channelFrames(song).values()).size, song.name).toBe(1)
    }
    // Whole bars: the fight's loop is 8 bars of 80 frames (tempo 5), the title's of 112.
    const loopOf = (n: string) =>
      [...loopFrames(songs.find((s) => s.name === n) as Song).values()][0]
    expect(loopOf('fight')).toBe(8 * 80)
    expect(loopOf('title')).toBe(8 * 112)
    expect(songs.filter((s) => s.name.startsWith('x_'))).toHaveLength(16)
  })

  it('hears the fight by event: hits light and heavy, guards, swings, dashes, throws, landings, falls', () => {
    const m = fight()
    const strike = (h0: number, h1 = 0) => {
      place(m, 236, 270)
      put(m, 'sfxHeard', 0)
      for (let k = 0; k < 20 && read(m, 'struck', 0) === 0; k++) step(m, k === 0 ? h0 : 0, h1)
    }
    strike(I.lp)
    expect([hear(m, X.light), hear(m, X.whiff), hear(m, X.heavy)]).toEqual([true, true, false])
    steps(m, 40)
    strike(I.hp)
    expect(hear(m, X.heavy)).toBe(true)
    steps(m, 60)
    strike(I.lp, I.back)
    expect(read(m, 'struck', 0)).toBe(2)
    expect([hear(m, X.guard), hear(m, X.light)]).toEqual([true, false])
    steps(m, 40)
    // A dash, a jump's landing.
    place(m, 150, 350)
    put(m, 'sfxHeard', 0)
    for (const h of [I.fwd, 0, I.fwd]) step(m, h)
    expect(hear(m, X.dash)).toBe(true)
    steps(m, 30)
    put(m, 'sfxHeard', 0)
    step(m, I.up)
    steps(m, 60)
    expect(hear(m, X.land)).toBe(true)
    // A throw: its hold, then the slam's fall.
    place(m, 236, 270)
    put(m, 'sfxHeard', 0)
    step(m, I.fwd | I.hp)
    steps(m, 30)
    expect([hear(m, X.throw), hear(m, X.down)]).toEqual([true, true])
    // TIME's last ten, a tick a second.
    steps(m, 60)
    put(m, 'timeLeft', 11)
    put(m, 'sfxHeard', 0)
    steps(m, 61)
    expect(hear(m, X2.time)).toBe(true)
  })

  it('cues the round, the fight, the materialising, the KO chord and the pieces; never by slot', () => {
    const m = fight()
    roundTo(m, 1)
    put(m, 'sfxHeard', 0)
    for (let k = 0; k < 300 && read(m, 'phase') !== PH.fight; k++) step(m)
    // The look hears the phase as the frame after it changed draws it.
    step(m)
    expect([X2.round, X2.mat, X2.fight].map((x) => hear(m, x))).toEqual([true, true, true])
    place(m, 236, 270)
    put(m, 'fLife', 1, 1)
    put(m, 'sfxHeard', 0)
    for (let k = 0; k < 30 && read(m, 'phase') !== PH.over; k++) step(m, k === 0 ? I.lp : 0)
    for (let k = 0; k < 60 && read(m, 'phaseT') < 45; k++) step(m)
    expect([hear(m, X2.ko), hear(m, X2.shards)]).toEqual([true, true])
    // The look hears what happened, never which slot: no branch on a fighter's slot there.
    const look = readFileSync(`${DIR}/engine/look.e16.ts`, 'utf8')
    expect(look).not.toMatch(/fSlot\[[^\]]*\]\s*[!=]==/)
  })
})

/** P2 knocked out on the ground (or, `air`, lifted into the air as it breaks): its picture's row then. */
function koPieces(air: boolean): number[] {
  const m = fight()
  place(m, 236, 270)
  put(m, 'fLife', 1, 1)
  for (let k = 0; k < 30 && read(m, 'phase') !== PH.over; k++) step(m, k === 0 ? I.hp : 0)
  for (let k = 0; k < 60 && read(m, 'phaseT') < 39; k++) step(m)
  if (air) {
    put(m, 'fAir', 1, 1)
    put(m, 'fY', 50 * 16, 1)
  }
  for (let k = 0; k < 5 && read(m, 'shOn', 1) === 0; k++) step(m)
  expect(read(m, 'shOn', 1)).toBe(1)
  return Array.from({ length: 34 }, (_, k) => read(m, 'art', 34 + k))
}

describe('ELECFIGHTER the polish (P3)', () => {
  it("keeps standing fighters' pictures from overlapping more than 8 points at their closest", () => {
    // The body boxes are the drawn torso's width: two face to face as close as their bodies let
    // them overlap their guards by a few points (16 with P2's 28-point boxes).
    const half = (s: number) => (ARTS[s]?.boxes[0]?.[2] ?? 0) / 2
    const front = (s: number, r: number) =>
      Math.max(...[...(ARTS[s]?.picture(r).keys() ?? [])].map((k) => Number(k.split(',')[0])))
    for (let a = 0; a < 4; a++)
      for (let b = 0; b < 4; b++)
        for (const r of [0, 7, 60]) {
          const over = front(a, r) + front(b, r) + 2 - (half(a) + half(b))
          expect(over, `${SLOT_IDS[a]} ${SLOT_IDS[b]} row ${r}`).toBeLessThanOrEqual(8)
        }
    // On the core: walked into each other, they stand their halves apart.
    const m = fight()
    place(m, 250, 254)
    steps(m, 10, I.fwd, I.fwd)
    const gap = (read(m, 'fX', 1) - read(m, 'fX', 0)) >> 4
    expect(gap).toBe(half(read(m, 'fSlot', 0)) + half(read(m, 'fSlot', 1)))
  })

  it("stands every picture on the foot line: the stand's lowest point on it", () => {
    for (const [s, art] of ARTS.entries()) {
      const lowest = Math.max(...[...art.picture(0).keys()].map((k) => Number(k.split(',')[1])))
      expect(lowest, SLOT_IDS[s]).toBe(0)
    }
  })

  it('breaks a fighter knocked out into the pieces of the pose it is in: down, or falling', () => {
    const rows = ARTS[1]?.rows ?? []
    expect(koPieces(false)).toEqual(rows[61])
    expect(koPieces(true)).toEqual(rows[62])
    // The pieces of the down pose lie low; the falling one's reach higher.
    const top = (r: number[]) =>
      Math.min(...r.slice(2, 2 + (r[1] ?? 0)).map((w) => (w << 16) >> 24))
    expect(top(rows[61] ?? [])).toBeGreaterThan(top(rows[62] ?? []))
  })

  it('blinks the wire under a quarter of the life, and turns it magenta while thrown', () => {
    const m = fight()
    place(m, 236, 270)
    put(m, 'fLife', 20, 1)
    const wire = new Set<number>()
    for (let k = 0; k < 40; k++) {
      step(m)
      wire.add(shown(m, 9, 1))
    }
    expect([...wire].sort()).toEqual([kept(m, 9, 1), kept(m, 9, 2)].sort())
    put(m, 'fLife', 90, 1)
    place(m, 236, 270)
    step(m, I.fwd | I.hp)
    for (let k = 0; k < 10 && read(m, 'fState', 1) !== ST2.thrown; k++) step(m)
    step(m)
    expect(read(m, 'fState', 1)).toBe(ST2.thrown)
    expect([shown(m, 9, 1), shown(m, 9, 2)]).toEqual([0x759f, 0x48d3])
    expect(shown(m, 8, 1)).toBe(kept(m, 8, 1))
  })

  it('shows a hit spark that fills its 32-point frame', () => {
    const p = pictureFile(`${DIR}/art/spark.png`)
    if (p === null) throw new Error('no spark')
    for (let f = 0; f < 3; f++) {
      const xs: number[] = []
      for (let k = 0; k < 32 * 32; k++)
        if ((p.data[((k >> 5) * p.width + f * 32 + (k & 31)) * 4 + 3] ?? 0) >= 128) xs.push(k & 31)
      expect(Math.max(...xs) - Math.min(...xs) + 1, `frame ${f}`).toBeGreaterThanOrEqual(22)
    }
  })
})

describe('ELECFIGHTER every screen within the frame (P3)', { timeout: 300_000 }, () => {
  it('runs the boot log, title, select, versus, fight and result within the budget, 32 sprites a line', () => {
    const m = power()
    const by = new Map<number, number[]>()
    const lines = new Map<number, number>()
    let last = -1
    /** `n` frames with `pad` pressed now and then; a frame that changes the screen is not counted. */
    const run = (n: number, pad = 0) => {
      for (let k = 0; k < n; k++) {
        const sc = read(m, 'screen')
        if (pad !== 0 && k % 50 === 25) m.pad(pad)
        const c0 = m.state.cycles
        frames(m, 1, cart)
        m.pad(0)
        const d = m.state.cycles - c0
        const now = read(m, 'screen')
        if (sc === now && sc === last) {
          by.set(sc, [...(by.get(sc) ?? []), d])
          lines.set(sc, Math.max(lines.get(sc) ?? 0, ...perLine(m)))
        }
        last = now
      }
    }
    run(60)
    run(500)
    tap(m, padBit('start'), cart)
    tap(m, padBit('a'), cart)
    tap(m, padBit('start'), cart)
    run(300, padBit('right'))
    tap(m, padBit('a'), cart)
    put(m, 'ctl', 1, 0)
    put(m, 'ctl', 1, 1)
    run(1500)
    // The rest of the match quickly: P2 at one life whenever the fight is on.
    for (let k = 0; k < 12000 && read(m, 'screen') !== SC.result; k++) {
      if (read(m, 'screen') === SC.fight && read(m, 'phase') === PH.fight) put(m, 'fLife', 1, 1)
      frames(m, 1, cart)
    }
    run(200)
    expect(m.state.halt).toBeNull()
    const stats = [...by.entries()].map(([sc, a]) => ({
      sc,
      avg: a.reduce((x, y) => x + y, 0) / a.length,
      worst: Math.max(...a),
      line: lines.get(sc) ?? 0,
    }))
    expect(stats.map((s) => s.sc)).toEqual(
      expect.arrayContaining([SC.boot, SC.title, SC.select, SC.versus, SC.fight, SC.result]),
    )
    // Measured 2026-10-08: the boot log 490 cycles on average and 1,400 at worst; the title
    // 6,700 and 18,600 (23 sprites on a line: the four figures and their shadows); the select
    // 5,700 and 33,800 (a slot's tables, words and body read as the cursor moves); the versus
    // 17,000 and 21,300; the fight 17,500 and 31,000; the result 6,800 and 7,400.
    for (const s of stats) {
      expect(s.avg, `screen ${s.sc}`).toBeLessThan(25_000)
      expect(s.worst, `screen ${s.sc}`).toBeLessThan(40_000)
      expect(s.line, `screen ${s.sc}`).toBeLessThanOrEqual(32)
    }
  })
})
