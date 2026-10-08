import { readFileSync } from 'node:fs'
import { CHANNELS } from '@shared/elec16/apu'
import { readCart } from '@shared/elec16/cartridge'
import { channelFrames, compileSongs, loopFrames, type Song } from '@shared/elec16/kit/mml'
import type { Elec16 } from '@shared/elec16/machine'
import { padBit } from '@shared/elec16/pad'
import { rasterLines } from '@shared/elec16/video'
import { fromBase64 } from '@shared/emu/base64'
import { describe, expect, it } from 'vitest'
import {
  addr,
  assetsText,
  at,
  bigText,
  boot,
  built,
  C,
  C2,
  CLOCK,
  cart,
  DIR,
  fight,
  globals,
  I,
  kept,
  LOG_ROW,
  MIRROR,
  MV,
  MV2,
  meta,
  moves,
  O,
  O2,
  opponents,
  PH,
  perLine,
  place,
  power,
  profiles,
  put,
  ROOT_ROW,
  read,
  row,
  rowOf,
  rowText,
  SC,
  SC2,
  SLOT_IDS,
  SOUND_STATE,
  ST,
  ST2,
  scaled,
  shown,
  sizeOf,
  step,
  steps,
  table,
  toSelect,
  until,
  untilFree,
} from './elec16-elecfighter-support'
import { frames, pictureFile, tap, word } from './elec16-kit-helpers'

/**
 * ELECFIGHTER (docs/elec16-elecfighter-design.md), phases P0 to P3: built from its folder as
 * gen:elec16 builds it and fought on the core, from its boot log through the title, the select
 * and the versus to the ladder's end. The fighters are drawn meshes streamed into a room
 * of cells each (P3), their boxes drafted from the drawings; a test drives
 * either through the fighters' one entry (`ctl` 2 and `extHeld`, the buttons as the engine reads
 * them) or the pad, places them by their RAM, and reads the outcome there by the globals' names.
 * The CPU and whole matches played are in the files beside it (elec16-elecfighter-support.ts
 * says which).
 */

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
    // review (the banners' letter lookup and their small words moved to banks 3 and 1); 19,208
    // with the in-between pictures (their choice in bank 4, the clock in RAM); 19,244 with the
    // transitions and the throw's frames (the row before kept in RAM, `fRowWas`). The
    // globals fill their area (0280-1FFF) to its last byte since: a new array must free its room.
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
/** The in-between pictures, after the KO's pieces in every art.txt (scripts/elecfighter/pose-book.mjs). */
const TWEENS = 53
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
    // apart, kicks 0.64-0.70; with the lights fully extended (2026-10-09) punches 0.47-0.69 (S3's
    // broad jab the nearest), kicks 0.58-0.73. The first mock's punches, which read alike at 1x
    // (design 16), were 0.34-0.43 and its kicks, which read apart, 0.70-0.81: 0.45 is above every
    // pair that did not read.
    for (const art of ARTS) {
      expect(apartShare(art.picture(ROW.sLP), art.picture(ROW.sHP))).toBeGreaterThanOrEqual(0.45)
      expect(apartShare(art.picture(ROW.sLK), art.picture(ROW.sHK))).toBeGreaterThanOrEqual(0.45)
    }
  })

  it('leaves no point alone in any picture, and every picture within its room of 32 cells', () => {
    for (const [s, art] of ARTS.entries()) {
      // The pose rows, the KO's pieces cut from the down pose and from the falling one, then the
      // in-between pictures (fighters/frames.txt).
      expect(art.rows.length, SLOT_IDS[s]).toBe(63 + TWEENS)
      for (const [r, row] of art.rows.entries()) {
        const [first = 0, count = 0] = row
        expect(count, `${SLOT_IDS[s]} row ${r}`).toBeGreaterThan(0)
        expect(count).toBeLessThanOrEqual(32)
        expect(first + count).toBeLessThanOrEqual(art.frames)
      }
      // The pose rows and the in-betweens (not the KO's pieces, each a piece of its own).
      for (let r = 0; r < 63 + TWEENS; r++)
        if (r < 61 || r >= 63) expect(isolatedIn(art.picture(r)), `row ${r}`).toBe(0)
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
    // With 31 in-between pictures a slot (fighters/frames.txt) on 2026-10-08: 98 banks (784 KB);
    // with 50 (the throw's, the transitions', the wake-up's) 113 banks (904 KB); with 53 (the
    // lights' retraction, 2026-10-09) 116 banks (928 KB). At least 10 banks are kept free.
    expect(built.report.banks).toBeLessThanOrEqual(118)
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
    const row = art.rows[read(m, 'artPic', 1)] ?? []
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
      for (const m of [MV.sLP, MV.sLK, MV.cLP]) {
        expect(blocked(rows[m] ?? [])).toBeGreaterThanOrEqual(-2)
        expect(blocked(rows[m] ?? [])).toBeLessThanOrEqual(0)
      }
      // The crouching light kick, the longest light, is the one to answer (the second balance
      // pass, 2026-10-09): -4 to -6, a light's punish after it is guarded.
      expect(blocked(rows[MV.cLK] ?? [])).toBeGreaterThanOrEqual(-6)
      expect(blocked(rows[MV.cLK] ?? [])).toBeLessThanOrEqual(-4)
      for (const m of [MV.sHP, MV.sHK, MV.cHP, MV.cHK]) {
        expect(blocked(rows[m] ?? [])).toBeLessThanOrEqual(-6)
      }
    }
    // S1's as the design's table has them.
    expect(
      [MV.sLP, MV.sHP, MV.sLK, MV.sHK, MV.cLP, MV.cHP, MV.cLK, MV.cHK].map((m) => blocked(row(m))),
    ).toEqual([0, -6, -2, -8, 0, -9, -6, -12])
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

/**
 * `winner` knocks out the other (one life left) walking with `walk` held - into a heavy punch,
 * or, walking back (a guard of it), into the sweep - the winner on the left or the right: the
 * round's end begun, and where the winner stood at the KO.
 */
function knockedOutWalking(winner: number, left: boolean, walk: number) {
  const m = fight()
  const w = (winner === 0) === left ? 236 : 270
  place(m, w, w === 236 ? 270 : 236)
  put(m, 'fLife', 1, 1 - winner)
  const blow = walk === I.fwd ? I.hp : I.down | I.hk
  const held = (i: number, k: number) => {
    if (i !== winner) return walk
    return k < 2 ? blow : 0
  }
  for (let k = 0; k < 30 && read(m, 'phase') === PH.fight; k++) step(m, held(0, k), held(1, k))
  expect(read(m, 'phase')).toBe(PH.over)
  return { m, xKO: read(m, 'fX', winner) }
}

/** Frames of the round's or the match's end with both still at `xs`, until it ends (at most 300). */
function framesStill(m: Elec16, xs: number[]): number {
  let n = 0
  for (let k = 0; k < 300; k++) {
    step(m)
    const ph = read(m, 'phase')
    if (ph !== PH.over && ph !== PH.end) break
    expect([read(m, 'fX', 0), read(m, 'fX', 1)]).toEqual(xs)
    n++
  }
  return n
}

/** P2's places, from now through its stun in state `st` (at most 40 frames), nothing held. */
function stunPath(m: Elec16, st: number): number[] {
  const xs = [read(m, 'fX', 1)]
  for (let k = 0; k < 40 && read(m, 'fState', 1) === st; k++) {
    step(m)
    xs.push(read(m, 'fX', 1))
  }
  return xs
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

  it('leaves the winner and the one knocked out where they fell, whoever wins, either side', () => {
    // Found in play 2026-10-08: struck while walking, a fighter kept its walking speed - knocked
    // out, it lay sliding on to the end of the match and pushed the winner along with it.
    for (const winner of [0, 1])
      for (const left of [true, false])
        for (const walk of [I.fwd, I.back]) {
          const at = `winner ${winner}, ${left ? 'left' : 'right'}, walking ${walk}`
          const { m, xKO } = knockedOutWalking(winner, left, walk)
          // The blow's push and the fall run out; from then on nothing moves, through the
          // win's pose and the next round's start (or the match's end).
          steps(m, 50)
          const xs = [read(m, 'fX', 0), read(m, 'fX', 1)]
          expect(framesStill(m, xs), at).toBeGreaterThan(60)
          expect(read(m, 'fVX', 1 - winner), at).toBe(0)
          // The winner was never carried: at most the one shove of a body falling against it.
          expect(Math.abs((xs[winner] ?? 0) - xKO), at).toBeLessThanOrEqual(32)
        }
  })

  it('takes a struck or guarding fighter only as far as the push, not its walk', () => {
    // P2 walks into P1's heavy punch, or back from it (a guard).
    const cases = [
      { walk: I.fwd, struck: 1, st: ST.hit },
      { walk: I.back, struck: 2, st: ST.guard },
    ]
    for (const c of cases) {
      const m = fight()
      place(m, 236, 270)
      for (let k = 0; k < 30 && read(m, 'struck', 0) === 0; k++) step(m, k === 0 ? I.hp : 0, c.walk)
      expect(read(m, 'struck', 0)).toBe(c.struck)
      expect(read(m, 'fVX', 1)).toBe(0)
      // Its stun goes by with nothing held: the push alone moves it away, slowing to a stop.
      const xs = stunPath(m, c.st)
      expect(xs.every((x, k) => k === 0 || x >= (xs[k - 1] ?? 0))).toBe(true)
      expect(read(m, 'fPush', 1)).toBe(0)
    }
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
    // Later is quicker, surer and reads more, by cpu/ladder.txt's row for the place (design
    // 7.10.5): the first met slower than its row, ROOT quicker (never under 8).
    const at = (k: number) => fight(CLOCK, [2, 1], 0, k)
    const first = at(0)
    const root = at(3)
    for (const c of [O.rGuard, O.rPunish, O.guard, O2.punish, O2.read]) {
      expect(rowOf(first, 1, c), `column ${c}`).toBe(scaled(0, 0)[c])
      expect(rowOf(root, 1, c), `column ${c}`).toBe(scaled(4, 3)[c])
    }
    expect(rowOf(first, 1, O.rGuard)).toBeGreaterThan(opponents[0]?.[O.rGuard] ?? 0)
    expect(rowOf(root, 1, O.rGuard)).toBeLessThan(opponents[4]?.[O.rGuard] ?? 0)
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

  it('plays a whole ladder CPU against CPU to SYSTEM CLEAR, ROOT last', () => {
    // P1's CPU kept standing and each opponent at one life once the fight is on: it beats all
    // four in turn, ROOT last. The frame budget of whole matches is two CPUs' (cpus(), in
    // elec16-elecfighter-budget.test.ts), which since P4 stand for the ladder.
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
  })
})

/** A table of the game's folder as words, `#` comments left out. */
function wordsOf(file: string): number[] {
  return readFileSync(`${DIR}/${file}`, 'utf8')
    .replace(/#.*$/gm, '')
    .split(/\s+/)
    .filter(Boolean)
    .map(Number)
}

/**
 * The pictures' tables (design 2.5, 7.9), shared by every slot: each row's pictures in turn
 * (frames.txt), the pictures a row begins with by the row before (transitions.txt), the throw
 * frame by frame (throws.txt); and the pictures' names, as S1's art.txt has them.
 */
const SEQ = wordsOf('fighters/frames.txt')
const TRANS = wordsOf('fighters/transitions.txt')
const THROWS = wordsOf('fighters/throws.txt')
/** The engine's numbers, as its source has them: the test reads them, never copies them. */
const engineConst = (file: string, name: string) =>
  Number(
    new RegExp(`const ${name} = (\\d+)`).exec(readFileSync(`${DIR}/engine/${file}`, 'utf8'))?.[1],
  )
const SEQ_W = engineConst('look.e16.ts', 'SEQ_W')
const PO_WALK = engineConst('fighter.e16.ts', 'PO_WALK')
/** The throw's frames each way: the thrower's till it is free (hit.e16.ts), the table's rows. */
const THROW_KS = engineConst('hit.e16.ts', 'THROW_F')
const PIC_NAMES = readFileSync(`${DIR}/fighters/s1/art.txt`, 'utf8')
  .split('\n')
  .filter((l) => l.trim() !== '' && !l.startsWith('#'))
  .map((l) => (l.split('#')[1] ?? '').trim().split(' ').pop() ?? '')
/**
 * The picture fighter `i` should show as this frame ends, worked out from the tables as the
 * design says (independently of look.e16.ts): null to keep the one showing (a row entered after
 * the frame's pose was set).
 */
function picWanted(m: Elec16, i: number): number | null {
  const st = read(m, 'fState', i)
  if (st === ST2.throw || st === ST2.thrown) return throwPicWanted(m, i, st === ST2.throw)
  const t = read(m, 'fRowT', i)
  if (t === 0xffff) return null
  const row = read(m, 'fPose', i) * SEQ_W
  return (t < 16 ? transPicWanted(m, i, row, t) : null) ?? rowPicWanted(m, i, row, t)
}

/** A throw's picture, thrower's or thrown's, by the thrower's frames since it took hold. */
function throwPicWanted(m: Elec16, i: number, thrower: boolean): number {
  const a = thrower ? i : 1 - i
  const k = Math.min(read(m, 'fStateT', a), THROW_KS - 1)
  const w = THROWS[(read(m, 'fThrowBack', a) * THROW_KS + k) * 4 + (thrower ? 0 : 1)]
  return (w ?? 0) & 255
}

/** The picture the row begins with by the row before, or null for the row's own. */
function transPicWanted(m: Elec16, i: number, row: number, t: number): number | null {
  const into = SEQ[row + 9] ?? 0
  const was = read(m, 'fRowWas', i)
  for (let k = into & 255; k < (into & 255) + (into >> 8); k++) {
    const from = TRANS[k * 3] ?? 0
    if (was < (from & 255) || was > from >> 8) continue
    const p = [TRANS[k * 3 + 1] ?? 0, TRANS[k * 3 + 2] ?? 0].find((w) => t < w >> 8)
    return p !== undefined && (p & 255) !== 255 ? p & 255 : null
  }
  return null
}

/**
 * The row's own picture by its clock: frames, or the points walked into a step - the step the
 * place is in now (8 points each), whatever step the pose was chosen at before the move.
 */
function rowPicWanted(m: Elec16, i: number, row0: number, t0: number): number {
  let row = row0
  let t = t0
  if (SEQ[row] === 1) {
    const x = read(m, 'fX', i)
    const d = read(m, 'fFace', i) !== 0 ? x >> 4 : -((x + 15) >> 4)
    t = d & 7
    row = (PO_WALK + ((d >> 3) & 3)) * SEQ_W
  }
  const seq = (k: number) => SEQ[row + k] ?? 0
  let k = 0
  while (k < 3 && t >= seq(2 + k * 2)) k++
  return seq(1 + k * 2)
}

/**
 * Frames played with these buttons, each checked: both fighters show the picture the tables
 * give (or keep theirs), and a picture is copied into its room on the frames it changes only.
 */
function picturesFollow(m: Elec16, n: number, h: (k: number) => [number, number]): number[][] {
  const shown: number[][] = [[], []]
  for (let k = 0; k < n; k++) {
    const before = [read(m, 'artPic', 0), read(m, 'artPic', 1)]
    const [h0, h1] = h(k)
    step(m, h0, h1)
    for (const i of [0, 1]) {
      const want = picWanted(m, i) ?? before[i]
      const now = read(m, 'artPic', i)
      expect(now, `frame ${k} fighter ${i}`).toBe(want)
      expect(read(m, 'artWant', i) !== 0, `frame ${k} fighter ${i} copied`).toBe(now !== before[i])
      shown[i]?.push(now)
    }
  }
  return shown
}

/** A run of pictures with each picture once, in the order they came. */
const inTurn = (pics: number[]) => pics.filter((p, k) => p !== pics[k - 1]).map((p) => PIC_NAMES[p])

/** The walk's eight pictures, a step and its in-between each, in the order a walk forward shows them. */
const WALK = ['walk1', 'walk1b', 'walk2', 'walk2b', 'walk3', 'walk3b', 'walk4', 'walk4b']
/** Pictures that are all the walk's, each the next of the eight round (`by` 1) or the one before (-1). */
const stepping = (names: (string | undefined)[], by: number) =>
  names.every((n, k) => {
    const at = WALK.indexOf(n ?? '')
    return at >= 0 && (k === 0 || at === (WALK.indexOf(names[k - 1] ?? '') + by + 8) % 8)
  })

describe('ELECFIGHTER the pictures in turn (design 2.5, 7.9)', () => {
  it('shows each row its pictures by its clock, the walk by its points both ways and mirrored', () => {
    const m = fight()
    place(m, 236, 330)
    // Both walk in and back: P2 faces left, so its steps run mirrored. A walk forward shows the
    // eight steps in turn, a walk back the same backwards, whichever way it faces.
    const [w0, w1] = picturesFollow(m, 40, (k) => [
      k < 20 ? I.fwd : I.back,
      k < 20 ? I.back : I.fwd,
    ])
    for (const [pics, first] of [
      [w0, 1],
      [w1, -1],
    ] as const) {
      const ahead = inTurn((pics ?? []).slice(2, 20))
      const back = inTurn((pics ?? []).slice(22))
      expect(stepping(ahead, first), ahead.join(' ')).toBe(true)
      expect(stepping(back, -first), back.join(' ')).toBe(true)
      for (const seen of [ahead, back]) {
        expect(seen.length, seen.join(' ')).toBeGreaterThanOrEqual(4)
        expect(
          seen.some((p) => p?.endsWith('b')),
          seen.join(' '),
        ).toBe(true)
      }
    }
    // A heavy punch from the stance: wind-up begun, wound, the blow, its follow-through settling.
    place(m, 236, 330)
    steps(m, 30)
    const [p1] = picturesFollow(m, 40, (k) => [k === 0 ? I.hp : 0, 0])
    expect(inTurn(p1 ?? []).slice(0, 6)).toEqual(['hp0a', 'hp0', 'hp', 'hp2', 'hp3', 'hp4'])
  })

  it('begins a row by the row before: through half a crouch down and up, half a guard up and down', () => {
    const m = fight()
    place(m, 236, 330)
    steps(m, 30)
    const [down] = picturesFollow(m, 12, () => [I.down, 0])
    expect(inTurn(down ?? []).slice(-2)).toEqual(['chalf', 'crouch'])
    const [up] = picturesFollow(m, 6, () => [0, 0])
    expect(inTurn(up ?? [])[0]).toBe('chalf')
    // P1 guards P2's light punch: the half guard as the hitstop ends, then half down again.
    place(m, 236, 270)
    steps(m, 30)
    const [guard] = picturesFollow(m, 40, (k) => [k < 24 ? I.back : 0, k === 2 ? I.lp : 0])
    const seen = inTurn(guard ?? [])
    expect(seen).toContain('ghalf')
    expect(seen.slice(seen.indexOf('ghalf'), seen.indexOf('ghalf') + 3)).toEqual([
      'ghalf',
      'guard',
      'ghalf',
    ])
  })

  it('plays the throw frame by frame: the thrower hauls, heaves and slams, the thrown is carried', () => {
    for (const way of [I.fwd, I.back]) {
      const m = fight()
      place(m, 230, 262)
      const xs: number[] = []
      // The thrower (P1, facing right) drawn turned about, frame by frame.
      const turned: boolean[] = []
      const [a, d] = picturesFollow(m, 30, (k) => {
        if (k > 0 && k < 21) xs.push(heldAt(m))
        if (k > 0 && k < 27) turned.push(drawnOf(m, 0).flipped)
        return [k === 0 ? way | I.hp : 0, 0]
      })
      // Turned about only for a back throw in the open, from the haul on (it slams behind it).
      if (way === I.back) expect(turned.slice(18).every(Boolean), String(turned)).toBe(true)
      else expect(turned.some(Boolean), String(turned)).toBe(false)
      expect(inTurn(a ?? []).slice(1, 5)).toEqual(['throw', 'tpull', 'theave', 'tslam'])
      const carried = inTurn(d ?? [])
      expect(carried).toContain('thrown')
      expect(carried).toContain('tlift')
      expect(carried).toContain('tair')
      expect(carried.at(-1)).toBe('bounce')
      // Carried from in front of the thrower (x 230): over it to land behind on a back throw.
      expect(Math.max(...xs)).toBeGreaterThan(240)
      if (way === I.back) {
        expect(carried).toContain('tinv')
        expect(Math.min(...xs)).toBeLessThan(220)
      } else expect(Math.min(...xs)).toBeGreaterThan(230)
    }
    // Found in review 2026-10-08: a back throw with the thrower's back to a wall was drawn
    // carried off the stage, behind it, and jumped about 75 points at the slam - the slam's
    // mirror point lies past the wall, and the walls and the bodies put the thrown back in
    // front. Drawn, it is carried to where it will really land, and the thrower is not turned.
    backThrowAtWall(50, 85)
    backThrowAtWall(462, 427)
  })

  it('keeps the one held on its feet through the tech window, still from the pull at frame 4', () => {
    // Found in review 2026-10-08: frames 5-7 lifted the held one 2 to 8 points and pulled it on,
    // inside the window a tech breaks: it was drawn snapping back to its feet.
    const word = (way: number, k: number, w: number) => THROWS[(way * THROW_KS + k) * 4 + w] ?? 0
    for (const way of [0, 1]) {
      for (let k = 0; k <= 7; k++) {
        const share = (word(way, k, 2) << 24) >> 24
        expect([word(way, k, 3), word(way, k, 2) >> 8], `way ${way} frame ${k}`).toEqual([0, 0])
        expect(share, `way ${way} frame ${k}`).toBeGreaterThanOrEqual(13)
        if (k > 4) expect(word(way, k, 2), `way ${way} frame ${k}`).toBe(word(way, 4, 2))
      }
    }
    // On the core: through the window the held one's cells stand on the floor where they stood,
    // and from frame 4 they do not move.
    for (const way of [I.fwd, I.back]) heldThroughWindow(way)
  })

  it('holds its tables to their sizes: a row of frames.txt each pose row, the throw both ways', () => {
    const rows = engineConst('data.e16.ts', 'SHARDS_ROW')
    const transW = engineConst('look.e16.ts', 'TRANS_W')
    const throwW = engineConst('look.e16.ts', 'THROW_W')
    expect([rows, SEQ_W, transW, throwW, THROW_KS]).toEqual([61, 10, 3, 4, 26])
    // The clock, four pictures and their ends, the transitions' word.
    expect(SEQ_W).toBe(2 + 2 * engineConst('look.e16.ts', 'SEQ_PICS'))
    expect(SEQ.length).toBe(rows * SEQ_W)
    expect(TRANS.length % transW).toBe(0)
    expect(THROWS.length).toBe(2 * THROW_KS * throwW)
    // The game's build keeps the throw's table as long: look.e16.ts takes its frames from it.
    expect(assetsText).toMatch(new RegExp(`THROWS_LEN = 0x${THROWS.length.toString(16)}\\b`))
    // Every row's transitions lie inside transitions.txt, one after another from the first.
    let next = 0
    for (let r = 0; r < rows; r++) {
      const into = SEQ[r * SEQ_W + SEQ_W - 1] ?? 0
      if (into === 0) continue
      expect(into & 255, `row ${r}`).toBe(next)
      next = (into & 255) + (into >> 8)
      expect(next, `row ${r}`).toBeLessThanOrEqual(TRANS.length / transW)
    }
    expect(next).toBe(TRANS.length / transW)
  })

  it('staggers both apart after a throw tech, and plays the air hit, the fall and the wake-up', () => {
    const m = fight()
    place(m, 230, 262)
    const [a, d] = picturesFollow(m, 30, (k) => [
      k === 0 ? I.fwd | I.hp : 0,
      k === 7 ? I.fwd | I.hp : 0,
    ])
    for (const p of [a, d])
      expect(inTurn(p ?? [])).toEqual(expect.arrayContaining(['stag', 'stag2']))
    place(m, 200, 280)
    const [, air] = picturesFollow(m, 120, (k) => [k === 10 ? I.hp : 0, k < 3 ? I.up | I.fwd : 0])
    const fell = inTurn(air ?? [])
    const from = fell.indexOf('launch')
    expect(fell.slice(from, from + 9)).toEqual([
      'launch',
      'air',
      'knock',
      'bounce',
      'down',
      'wsit',
      'wake',
      'wake2',
      'wake3',
    ])
  })
})

/**
 * P1 (at `x0`, its back to the wall) throws P2 (at `x1`) back: the slam cannot put it behind,
 * so each frame it is carried is drawn inside the ring and on screen towards where it will
 * land, in front, the thrower not turned; and at the slam it does not jump.
 */
function backThrowAtWall(x0: number, x1: number): void {
  const m = fight()
  place(m, x0, x1)
  // The sprites shown as a frame ends are those the frame before laid, by its camera.
  let cam = read(m, 'camX')
  let held = false
  const lays: { held: boolean; p2: Drawn; p1: Drawn; cam: number }[] = []
  let landed = 0
  for (let k = 0; k < 30; k++) {
    step(m, k === 0 ? I.back | I.hp : 0)
    lays.push({ held, p2: drawnOf(m, 1), p1: drawnOf(m, 0), cam })
    if (held && read(m, 'fState', 1) !== ST2.thrown) landed = read(m, 'fX', 1) / 16
    held = read(m, 'fState', 1) === ST2.thrown
    cam = read(m, 'camX')
  }
  const carried = lays.filter((l) => l.held)
  const why = `from ${x0}: ${carried.map((l) => `${l.p2.min}..${l.p2.max}`).join(' ')}`
  expect(carried.length, why).toBe(16)
  for (const l of carried) {
    expect(l.p2.min, why).toBeGreaterThanOrEqual(0)
    expect(l.p2.max, why).toBeLessThanOrEqual(320)
    expect(l.p2.mid + l.cam, why).toBeGreaterThanOrEqual(32)
    expect(l.p2.mid + l.cam, why).toBeLessThanOrEqual(480)
    // Turned only if the thrown lands behind: here it lands in front, as it faces.
    expect(l.p1.flipped, why).toBe(x0 > x1)
  }
  // No jump at the slam: the last frame carried drawn where the slam leaves it.
  const last = carried.at(-1) as (typeof lays)[number]
  const after = lays[lays.indexOf(last) + 1] as (typeof lays)[number]
  expect(Math.abs(after.p2.mid + after.cam - (last.p2.mid + last.cam)), why).toBeLessThanOrEqual(4)
  expect(Math.abs(last.p2.mid + last.cam - landed), why).toBeLessThanOrEqual(8)
  expect(x0 < x1 ? landed > x0 : landed < x0).toBe(true)
}

/** A throw `way` held through its tech window: P2's cells on the floor, still from frame 4. */
function heldThroughWindow(way: number): void {
  const m = fight()
  place(m, 230, 262)
  const lays: { t: number; p2: Drawn }[] = []
  let t = -1
  for (let k = 0; k < 14; k++) {
    step(m, k === 0 ? way | I.hp : 0)
    lays.push({ t, p2: drawnOf(m, 1) })
    t = read(m, 'fState', 1) === ST2.thrown ? read(m, 'fStateT', 0) : -1
  }
  const window = lays.filter((l) => l.t >= 0 && l.t <= 7)
  expect(window.map((l) => l.t)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
  for (const l of window) expect(l.p2.bottom, `frame ${l.t}`).toBe(window[0]?.p2.bottom)
  for (const l of window.slice(5)) expect(l.p2.mid, `frame ${l.t}`).toBe(window[4]?.p2.mid)
}

/** Where P2's cells are drawn (OAM, palette slot 9), their middle in world points. */
function heldAt(m: Elec16): number {
  const mem = m.state.video?.mem ?? new Uint8Array()
  const xs: number[] = []
  for (let k = 0; k < 128; k++) {
    const w = (n: number) =>
      (mem[0xc000 + k * 8 + n * 2] ?? 0) | ((mem[0xc000 + k * 8 + n * 2 + 1] ?? 0) << 8)
    if ((w(3) & 3) === 3 || ((w(2) >> 10) & 7) !== 1) continue
    xs.push(((w(0) << 16) >> 16) + 8)
  }
  return xs.reduce((s, x) => s + x, 0) / Math.max(1, xs.length) + read(m, 'camX')
}

/**
 * A fighter's cells as shown: their left and right ends, middle and lowest edge on screen, and
 * whether mirrored.
 */
type Drawn = { min: number; max: number; mid: number; bottom: number; flipped: boolean }

/** Fighter `i`'s cells in OAM (palette slot 8 + i), on screen. */
function drawnOf(m: Elec16, i: number): Drawn {
  const mem = m.state.video?.mem ?? new Uint8Array()
  const xs: number[] = []
  let bottom = -999
  let flips = 0
  for (let k = 0; k < 128; k++) {
    const w = (n: number) =>
      (mem[0xc000 + k * 8 + n * 2] ?? 0) | ((mem[0xc000 + k * 8 + n * 2 + 1] ?? 0) << 8)
    if ((w(3) & 3) === 3 || ((w(2) >> 10) & 7) !== i) continue
    xs.push((w(0) << 16) >> 16)
    bottom = Math.max(bottom, ((w(1) << 16) >> 16) + 16)
    if ((w(2) & 0x2000) !== 0) flips++
  }
  const mid = xs.reduce((s, x) => s + x + 8, 0) / Math.max(1, xs.length)
  const flipped = flips > xs.length / 2
  return { min: Math.min(...xs), max: Math.max(...xs) + 16, mid, bottom, flipped }
}

/**
 * P1's light punch on P2 (holding `guard`): the frames from the one it lands on to the hitstop's
 * end, each checked to show P2's picture of the frame before it landed.
 */
function heldThroughStop(m: Elec16, guard: number): number {
  let was = read(m, 'artPic', 1)
  let stopped = 0
  for (let k = 0; k < 20; k++) {
    step(m, k === 0 ? I.lp : 0, guard)
    const landed = read(m, 'struck', 0) !== 0
    if (landed || (stopped > 0 && read(m, 'hitstop') > 0)) {
      expect(read(m, 'artPic', 1), `frame ${k}`).toBe(was)
      stopped++
    } else if (stopped > 0) break
    was = read(m, 'artPic', 1)
  }
  return stopped
}

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

  it('holds the picture that was showing through a hitstop, struck or guarding', () => {
    // Found in review 2026-10-08: the strike's `enter` set the row's clock to 0xffff after the
    // frame's pose was set, so through the hitstop the old row was read with that clock and showed
    // its last picture (the stand's breath) - then the struck picture after it.
    for (const guard of [0, I.back]) {
      const m = fight()
      place(m, 236, 270)
      // P2 crouches and stands again: its stand row's first frames, its first picture showing.
      steps(m, 3, 0, I.down)
      steps(m, 4, 0, guard)
      expect(heldThroughStop(m, guard)).toBeGreaterThan(3)
    }
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
        level((hk[16] ?? 0) + (hk[18] ?? 0), 40, 3),
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
    // Measured 2026-10-08 after the review: the boot log 490 cycles on average and 1,400 at
    // worst; the title 6,758 and 18,579 (23 sprites on a line: the four figures and their
    // shadows); the select 3,527 and 32,495 (a slot's tables, words and body read as the cursor
    // moves); the versus 11,762 and 28,805 (its palettes written only on a change, the reaches
    // measured in its first two frames); the fight 17,926 and 27,543; the result 6,786 and 7,403.
    for (const s of stats) {
      expect(s.avg, `screen ${s.sc}`).toBeLessThan(25_000)
      expect(s.worst, `screen ${s.sc}`).toBeLessThan(40_000)
      expect(s.line, `screen ${s.sc}`).toBeLessThanOrEqual(32)
    }
  })
})
