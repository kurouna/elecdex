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
const ST2 = { down: 8, wake: 9, dead: 10 }
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

/** The stand-in's slot (cpu/opponents.txt): P1 in it fights its own mirror. */
const SAME = 2

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
 * From the title, START: the match against the stand-in (S3 POWER), until the fight begins;
 * P1 in `slot` (S1 BALANCE unless said), each side driven as `drive` says (2 from outside).
 */
function fight(m = boot(), drive: [number, number] = [2, 2], slot = 0): Elec16 {
  put(m, 'choice', slot, 0)
  tap(m, padBit('start'), cart)
  put(m, 'ctl', drive[0], 0)
  put(m, 'ctl', drive[1], 1)
  for (let k = 0; k < 120 && read(m, 'phase') !== PH.fight; k++) frames(m, 1, cart)
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
    expect(read(m, 'fX', 1) - read(m, 'fX', 0)).toBeGreaterThanOrEqual((14 + 16) * 16)
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
    const m = fight(boot(), [2, 2], SAME)
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
  const m = fight(boot(), [2, 2], SAME)
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
    const m = fight(boot(), [2, 2], SAME)
    place(m, 236, 276)
    put(m, 'fLife', 1, 0)
    put(m, 'fLife', 1, 1)
    for (let k = 0; k < 10 && read(m, 'phase') === PH.fight; k++)
      step(m, k === 0 ? I.lp : 0, k === 0 ? I.lp : 0)
    expect(read(m, 'roundWon')).toBe(2)
  })
})

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

  it("plays a scripted match and a stand-ins' match to the end within their frames, 32 sprites a line", () => {
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
    const standins = measured(fight(boot(), [1, 1]), 20000, () => 0)
    // 4 MHz at 60 frames: 66,667 cycles a frame (design 10.4: under 25,000 on average, 40,000 at worst).
    for (const r of [scripted, standins]) {
      expect(r.outcome).not.toBe(0)
      expect(r.avg).toBeLessThan(25_000)
      expect(r.worst).toBeLessThan(40_000)
      expect(r.line).toBeLessThanOrEqual(32)
    }
    // As measured on 2026-10-08 with the coloured boxes (P1): the scripted match 7,233 cycles on
    // average and 14,748 at worst over 2,384 frames, the stand-ins' 7,505 and 15,130 over 3,804
    // (the busiest frames are those a strike lands in); 20 sprites on the busiest line. The match follows
    // the seed, which takes the cycle counter at START, so any change to the code plays another:
    // held with room, to be tightened as the phases come.
    expect(scripted.avg).toBeLessThanOrEqual(8_000)
    expect(scripted.worst).toBeLessThanOrEqual(17_000)
    expect(standins.avg).toBeLessThanOrEqual(8_000)
    expect(standins.worst).toBeLessThanOrEqual(17_000)
  })
})
