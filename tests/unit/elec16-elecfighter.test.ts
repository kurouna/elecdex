import { readFileSync } from 'node:fs'
import { readCart } from '@shared/elec16/cartridge'
import { Elec16 } from '@shared/elec16/machine'
import { XRAM_MAX } from '@shared/elec16/map'
import { padBit } from '@shared/elec16/pad'
import { fromBase64 } from '@shared/emu/base64'
import { describe, expect, it } from 'vitest'
import {
  buildKit,
  frames,
  globalsOf,
  ROM,
  ramPoke,
  ramWord,
  settle,
  tap,
} from './elec16-kit-helpers'

/**
 * ELECFIGHTER (docs/elec16-elecfighter-design.md), phases P0 and P1: built from its folder as
 * gen:elec16 builds it and fought on the core. The fighters are coloured boxes; a test drives
 * either through the fighters' one entry (`ctl` 2 and `extHeld`, the buttons as the engine reads
 * them) or the pad, places them by their RAM, and reads the outcome there by the globals' names.
 */

const DIR = 'resources/elec16/games/elecfighter'
const meta = JSON.parse(readFileSync(`${DIR}/game.json`, 'utf8'))
const built = buildKit(DIR, meta)
if ('errors' in built) throw new Error(JSON.stringify(built.errors))
const cart = built.image
const at = globalsOf(built.report.asm)
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

/** PLAY-320 with the clock at `clock`, the cartridge started, its title up. */
function boot(clock = CLOCK): Elec16 {
  const m = Elec16.boot(ROM.image, 'play-320', undefined, XRAM_MAX)
  m.setClock(clock)
  settle(m, cart)
  tap(m, padBit('start'), cart)
  frames(m, 20, cart)
  return m
}

/**
 * From the title, START: the ladder from its place `at` (0 the first, PACKET in S2 RUSH, for
 * S1), until the fight begins; P1 in `slot` (S1 BALANCE unless said), each side driven as
 * `drive` says (2 from outside, 1 the CPU).
 */
function fight(m = boot(), drive: [number, number] = [2, 2], slot = 0, at = 0): Elec16 {
  put(m, 'choice', slot, 0)
  put(m, 'choice', at, 1)
  tap(m, padBit('start'), cart)
  put(m, 'ctl', drive[0], 0)
  put(m, 'ctl', drive[1], 1)
  for (let k = 0; k < 240 && read(m, 'phase') !== PH.fight; k++) frames(m, 1, cart)
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
  it('keeps its folder in step with its build, and is not on the shelf before P3', () => {
    expect(readFileSync(`${DIR}/assets.e16.ts`, 'utf8')).toBe(built.report.assets)
    expect(readFileSync(`${DIR}/compiled.s`, 'utf8')).toBe(built.report.asm)
    expect(readCart(cart)).toMatchObject({ id: 'ELECFIGHTER', name: 'ELECFIGHTER', saveBanks: 1 })
    const file = JSON.parse(readFileSync('resources/elec16/games/games.json', 'utf8'))
    const ids = file.games.map(
      (g: { data: string }) => readCart(fromBase64(g.data) ?? new Uint8Array())?.id,
    )
    expect(ids).not.toContain('ELECFIGHTER')
  })

  it("keeps its code within RAM's 20 KB, its globals below the code, its tiles within 1,024", () => {
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
      expect(poses.length).toBe(12 + 13 * 3)
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
}

/** The poses in the air (the jump, a falling hit, the jump attacks'): above the feet. */
const AIR_POSES = new Set([3, 11, ...Array.from({ length: 12 }, (_, k) => 36 + k)])

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
    const n = fight(boot(), [0, 2])
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
    expect(read(m, 'fX', 0)).toBe((32 + 14) * 16)
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
    const m = fight(boot(), [1, 1])
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
      const m = fight(boot(), [0, 2])
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
    const m = fight(boot(), [2, 2], 0, MIRROR)
    place(m, 236, 276)
    for (let k = 0; k < 10 && read(m, 'struck', 0) === 0; k++) {
      step(m, k === 0 ? I.lp : 0, k === 0 ? I.lp : 0)
    }
    expect([read(m, 'struck', 0), read(m, 'struck', 1)]).toEqual([1, 1])
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
  const m = fight(boot(), [2, 2], 0, MIRROR)
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
    const m = fight(boot(), [2, 2], 0, MIRROR)
    place(m, 236, 276)
    put(m, 'fLife', 1, 0)
    put(m, 'fLife', 1, 1)
    for (let k = 0; k < 10 && read(m, 'phase') === PH.fight; k++)
      step(m, k === 0 ? I.lp : 0, k === 0 ? I.lp : 0)
    expect(read(m, 'roundWon')).toBe(2)
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
    const m = fight(boot(), [2, 2], 0, MIRROR)
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
 * CPU fighter 1 kept still for a test: no whim, no habit, no anti-air or punish, waiting where it
 * stands (its liked distance the one it is at) with nothing new chosen for a long while.
 */
function still(m: Elec16): void {
  setRow(m, 1, O3.whim, 0)
  setRow(m, 1, O.think, 250)
  setRow(m, 1, O2.pattern, 0)
  setRow(m, 1, O.aa, 0)
  setRow(m, 1, O2.punish, 0)
  setRow(m, 1, O2.range, Math.abs(read(m, 'fX', 1) - read(m, 'fX', 0)) >> 4)
  put(m, 'plan', WAIT, 1)
  put(m, 'planT', 250, 1)
  put(m, 'thinkT', 250, 1)
}

describe('ELECFIGHTER the CPU (P2, design 7.10)', { timeout: 120_000 }, () => {
  it('guards on sight only what starts slower than its reaction, and never reads nearer than it', () => {
    /** P1's `button` (a crouching move with down) against the CPU of reaction R: how it landed. */
    const landed = (r: number, button: number) => {
      const m = fight(boot(), [2, 1])
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

  it('combos no more than 4 hits on one who stands still, whichever opponent', () => {
    for (const at of [0, 1, 2, 3]) {
      const m = fight(boot(), [2, 1], 0, at)
      let hit = 0
      for (let k = 0; k < 3000 && read(m, 'outcome') === 0; k++) {
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

  it('has ROOT read a habit kept up, and lose to it changed', () => {
    const m = fight(boot(), [2, 1], 0, MIRROR)
    expect(rowOf(m, 1, O2.read)).toBe(Math.min(255, (opponents[4]?.[O2.read] ?? 0) + 3 * 26))
    const wake = (button: number) => wakeBeside(m, button)
    const kept = Array.from({ length: 10 }, () => wake(I.down | I.lp))
    // Twice before it knows; from then on it reads the strike and is crouched guarding.
    expect(kept.slice(0, 2).map((r) => r.guarded)).toEqual([1, 1])
    expect(kept.slice(2).map((r) => r.guarded)).toEqual(Array(8).fill(2))
    expect(read(m, 'readHits', 1)).toBe(8)
    expect(read(m, 'readMiss', 1)).toBe(0)
    // The habit changed: still reading the strike, it guards and is thrown.
    const changed = wake(I.fwd | I.hp)
    expect(changed.threw).toBe(1)
    expect(read(m, 'readMiss', 1)).toBe(1)
  })

  it('logs READ when a read was right', () => {
    const m = fight(boot(), [2, 1], 0, MIRROR)
    const logged = Array.from({ length: 6 }, () => wakeBeside(m, I.down | I.lp).log)
    expect(logged.slice(0, 2)).not.toContain('> READ')
    expect(logged.slice(2)).toEqual(Array(4).fill('> READ'))
  })
})

/**
 * Against the CPU of ladder place `at` (P1 in `slot`, driven by `p1` frame by frame and never
 * falling, so the habit is watched as long as the test runs): its habit's counts for 6,000
 * frames - times due, times out, the counts drawn in order - and its whims.
 */
function habitWatched(slot: number, at: number, p1: (k: number) => number) {
  const m = fight(boot(), [2, 1], slot, at)
  for (let k = 0; k < 6000 && read(m, 'outcome') === 0; k++) {
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

describe('ELECFIGHTER pause and log (P2, design 5.3, 5.6)', () => {
  /** The globals but the kit's pad and frame count (what a pause may move). */
  const frozen = (m: Elec16) => {
    const ram = globals(m)
    for (const name of ['padIs', 'padWas', 'padDown', 'seen']) {
      const a = addr(name) - 0x280
      ram[a] = 0
      ram[a + 1] = 0
    }
    return ram
  }

  it('pauses on START: nothing goes on, the fight darkened under PAUSED, the HUD as it was', () => {
    const m = fight(boot(), [2, 1])
    steps(m, 30, I.fwd)
    m.pad(padBit('start'))
    frames(m, 1, cart)
    m.pad(0)
    expect(read(m, 'paused')).toBe(1)
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
    for (const slot of [1, 2, 3, 4, 5]) {
      for (let k = 1; k < 16; k++) expect(shown(m, slot, k)).toBe(kept(m, slot, k))
    }
    expect(rowText(m, 16)).toBe('PAUSED')
    expect([19, 20, 21].map((y) => rowText(m, y))).toEqual(['> RESUME', 'CONTROLS', 'QUIT FIGHT'])
    // RESUME: as it was, and the fight goes on.
    tap(m, padBit('a'), cart)
    expect(read(m, 'paused')).toBe(0)
    expect(shown(m, 9, 1)).toBe(kept(m, 9, 1))
    const t = read(m, 'timeT')
    steps(m, 3)
    expect(read(m, 'timeT')).not.toBe(t)
  })

  it('quits the fight from the pause, and shows the controls from it', () => {
    const m = fight(boot(), [2, 1])
    tap(m, padBit('start'), cart)
    tap(m, padBit('down'), cart)
    tap(m, padBit('a'), cart)
    expect(rowText(m, 6)).toBe('CONTROLS')
    tap(m, padBit('b'), cart)
    expect(rowText(m, 16)).toBe('PAUSED')
    tap(m, padBit('down'), cart)
    tap(m, padBit('a'), cart)
    expect(read(m, 'ladderEnd')).toBe(3)
    frames(m, 4, cart)
    expect(rowText(m, 9)).toBe('PRESS START')
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
    // A on the controls (the title, until P3) turns it off, and the save RAM keeps it.
    const off = boot()
    tap(off, padBit('a'), cart)
    expect(rowText(off, 12)).toContain('LOG OFF')
    expect(read(off, 'logOff')).toBe(1)
    const n = counter(off)
    expect(rowText(n, LOG_ROW)).toBe('')
  })
})

describe('ELECFIGHTER the ladder (P2, design 5.4, 7.10.5)', { timeout: 300_000 }, () => {
  it('meets the three of other slots in order of strength, then ROOT in the same slot', () => {
    const names = (slot: number) => {
      const m = fight(boot(), [2, 2], slot)
      return [0, 1, 2, 3].map((k) => read(m, 'ladder', k))
    }
    // Rows: 0 PACKET (S2), 1 MAINFRAME (S3), 2 DAEMON (S4), 3 KERNEL (S1), 4 ROOT.
    expect(names(0)).toEqual([0, 1, 2, 4])
    expect(names(1)).toEqual([1, 2, 3, 4])
    expect(names(3)).toEqual([0, 1, 3, 4])
    const m = fight(boot(), [2, 2], 2, 3)
    expect([read(m, 'fSlot', 0), read(m, 'fSlot', 1)]).toEqual([2, 2])
    // Later is quicker and reads more: reactions less 2 a place (never under 8), reads 26 more.
    const at = (k: number) => fight(boot(), [2, 1], 0, k)
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
      k < 600 && read(m, 'phase') !== PH.fight && rowText(m, 16) !== 'CONTINUE?';
      k++
    ) {
      step(m)
    }
  }

  it('goes on to the next opponent after a win, counts CONTINUE? after a loss', () => {
    const m = fight(boot(), [2, 2])
    koRound(m, 1)
    expect(read(m, 'ladderAt')).toBe(0)
    koRound(m, 1)
    expect(read(m, 'ladderAt')).toBe(1)
    expect(read(m, 'phase')).toBe(PH.fight)
    // Lost twice: CONTINUE? and a count; START plays the same one again.
    koRound(m, 0)
    koRound(m, 0)
    expect(rowText(m, 16)).toBe('CONTINUE?')
    expect(rowText(m, 19)).toBe('9')
    steps(m, 61)
    expect(rowText(m, 19)).toBe('8')
    tap(m, padBit('start'), cart)
    for (let k = 0; k < 300 && read(m, 'phase') !== PH.fight; k++) step(m)
    expect(read(m, 'ladderAt')).toBe(1)
    expect(read(m, 'continues')).toBe(1)
  })

  it('plays a whole ladder CPU against CPU to SYSTEM CLEAR or GAME OVER, within the frame', () => {
    const m = boot()
    put(m, 'choice', ROOT_ROW, 2)
    fight(m, [1, 1])
    const r = ladderMeasured(m)
    expect(m.state.halt).toBeNull()
    expect([1, 2]).toContain(read(m, 'ladderEnd'))
    // Measured on 2026-10-08: 3,950 frames of fighting, 9,240 cycles on average and 17,069 at
    // worst (design 10.4: 25,000 and 40,000). A frame that loads a match runs past the frame
    // (76,879: both backgrounds cleared whole, the stage's map and both slots' tables) and the
    // picture waits a frame there, as it did in P1.
    expect(r.avg).toBeLessThan(25_000)
    expect(r.worst).toBeLessThan(40_000)
    expect(r.avg).toBeLessThanOrEqual(10_500)
    expect(r.worst).toBeLessThanOrEqual(20_000)
    // P1's CPU kept standing: it beats all four in turn, ROOT last, to SYSTEM CLEAR.
    const c = boot()
    put(c, 'choice', ROOT_ROW, 2)
    fight(c, [1, 1])
    const order: number[] = [read(c, 'ladder', read(c, 'ladderAt'))]
    for (let f = 0; f < 120_000 && read(c, 'ladderEnd') === 0; f++) {
      put(c, 'fLife', 100, 0)
      frames(c, 1, cart)
      const now = read(c, 'ladder', read(c, 'ladderAt'))
      if (now !== order[order.length - 1]) order.push(now)
    }
    expect(read(c, 'ladderEnd')).toBe(1)
    expect(order).toEqual([0, 1, 2, 4])
    expect(read(c, 'continues')).toBe(0)
  })
})

/**
 * A ladder played to its end, the fight's frames measured (a frame that loads a match - its
 * stage, both slots - is not one of them): their average and busiest cycles.
 */
function ladderMeasured(m: Elec16): { avg: number; worst: number } {
  let sum = 0
  let worst = 0
  let n = 0
  for (let k = 0; k < 120_000 && read(m, 'ladderEnd') === 0; k++) {
    const fighting = read(m, 'phase') === PH.fight
    const c0 = m.state.cycles
    frames(m, 1, cart)
    if (fighting && read(m, 'phase') === PH.fight) {
      const d = m.state.cycles - c0
      sum += d
      worst = Math.max(worst, d)
      n++
    }
  }
  return { avg: sum / n, worst }
}

describe('ELECFIGHTER chance and the frame budget', () => {
  /** P1 idle on the pad, the stand-in against it: the match's RAM after `n` frames. */
  const match = (clock = CLOCK, n = 600) => {
    const m = fight(boot(clock), [0, 1])
    frames(m, n, cart)
    return m
  }

  it('plays the same match from the same clock and buttons, another from another clock', () => {
    const a = match()
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

  it("plays a scripted match and a CPUs' match to the end within their frames, 32 sprites a line", () => {
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
    const scripted = measured(
      fight(boot(), [2, 1]),
      20000,
      (k) => script[(k >> 4) % script.length] ?? 0,
    )
    const cpus = measured(fight(boot(), [1, 1]), 20000, () => 0)
    // 4 MHz at 60 frames: 66,667 cycles a frame (design 10.4: under 25,000 on average, 40,000 at worst).
    for (const r of [scripted, cpus]) {
      expect(r.outcome).not.toBe(0)
      expect(r.avg).toBeLessThan(25_000)
      expect(r.worst).toBeLessThan(40_000)
      expect(r.line).toBeLessThanOrEqual(32)
    }
    // As measured on 2026-10-08 with the coloured boxes and the CPU (P2): the scripted match
    // against PACKET 8,230 cycles on average and 15,291 at worst over 3,104 frames, two CPUs'
    // 8,965 and 16,531 over 3,604 (P1's stand-ins: 7,505 and 15,130); 21 sprites on the busiest
    // line. The match follows the seed, which takes the cycle counter at START, so any change to
    // the code plays another: held with room, to be tightened as the phases come.
    expect(scripted.avg).toBeLessThanOrEqual(9_000)
    expect(scripted.worst).toBeLessThanOrEqual(18_000)
    expect(cpus.avg).toBeLessThanOrEqual(10_000)
    expect(cpus.worst).toBeLessThanOrEqual(19_000)
  })
})
