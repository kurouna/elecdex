import { readFileSync } from 'node:fs'
import { Elec16 } from '@shared/elec16/machine'
import { XRAM_MAX } from '@shared/elec16/map'
import { padBit } from '@shared/elec16/pad'
import { expect } from 'vitest'
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
 * ELECFIGHTER's tests' common part (docs/elec16-elecfighter-design.md): the game built from its
 * folder as gen:elec16 builds it, fights begun from the title (kept as snapshots), the fighters
 * driven through their one entry (`ctl` 2 and `extHeld`) or the pad, placed by their RAM and
 * read there by the globals' names, and the screens' text. Its tests are in four files that
 * vitest runs side by side, the core playing a few hundred frames a second: one file of them all
 * took two to four minutes (2026-10-08). elec16-elecfighter.test.ts has the rules, the pictures
 * and the screens; elec16-elecfighter-cpu.test.ts the CPU's eyes, habits and reads;
 * elec16-elecfighter-play.test.ts the rounds against one-button players;
 * elec16-elecfighter-budget.test.ts two CPUs' matches and the frame budget.
 */

export const DIR = 'resources/elec16/games/elecfighter'
export const meta = JSON.parse(readFileSync(`${DIR}/game.json`, 'utf8'))
const kit = buildKit(DIR, meta)
if ('errors' in kit) throw new Error(JSON.stringify(kit.errors))
export const built = kit
export const cart = built.image
/** The globals' addresses by name. */
export const at = globalsOf(built.report.asm)
export const assetsText = built.report.assets
export const asmText = built.report.asm
export const addr = (name: string) => {
  const a = at.get(name)
  if (a === undefined) throw new Error(`no ${name}`)
  return a
}
export const read = (m: Elec16, name: string, k = 0) => ramWord(m, addr(name) + k * 2)
export const put = (m: Elec16, name: string, v: number, k = 0) => ramPoke(m, addr(name) + k * 2, v)

/** The engine's buttons (input.e16.ts), its states (fighter.e16.ts), its phases (main.e16.ts). */
export const I = { up: 1, down: 2, back: 4, fwd: 8, lp: 16, hp: 32, lk: 64, hk: 128 }
export const ST = { stand: 0, crouch: 1, prejump: 2, jump: 3, land: 4, attack: 5, hit: 6, guard: 7 }
export const ST2 = { down: 8, wake: 9, dead: 10, throw: 11, thrown: 12, dash: 13, backdash: 14 }
export const PH = { round: 0, fight: 1, over: 2, end: 3 }
/** The screens (engine/main.e16.ts `screen`), design 5.4's. */
export const SC = { boot: 1, title: 2, controls: 3, select: 4, versus: 5, fight: 6, result: 7 }
export const SC2 = { cont: 8, over: 9, clear: 10, best: 11 }
/** The moves' rows (moves.txt). */
export const MV = { sLP: 0, sHP: 1, sLK: 2, sHK: 3, cLP: 4, cHP: 5, cLK: 6, cHK: 7, jLP: 8, jHP: 9 }
export const MV2 = { jLK: 10, jHK: 11, throw: 12 }
export const C = {
  startup: 0,
  active: 1,
  recovery: 2,
  damage: 3,
  hitstun: 5,
  blockstun: 6,
  stop: 7,
}
export const C2 = { height: 10, kind: 11, flags: 12 }

/** A slot's tables, as moves.txt, profile.txt and poses.txt hold them. */
export function table(file: string, width: number): number[][] {
  const words = readFileSync(`${DIR}/${file}`, 'utf8')
    .replace(/#.*$/gm, '')
    .split(/\s+/)
    .filter(Boolean)
    .map(Number)
  const rows: number[][] = []
  for (let k = 0; k < words.length; k += width) rows.push(words.slice(k, k + width))
  return rows
}
export const SLOT_IDS = ['s1', 's2', 's3', 's4']
export const moves = SLOT_IDS.map((s) => table(`fighters/${s}/moves.txt`, 16))
export const profiles = SLOT_IDS.map((s) => table(`fighters/${s}/profile.txt`, 16)[0] ?? [])
export const S1 = moves[0] ?? []
export const row = (m: number) => S1[m] ?? []

/** The ladder's last place, ROOT (cpu/opponents.txt's MIRROR): P1's own slot against it. */
export const MIRROR = 3

export const CLOCK = { second: 12, minute: 34, hour: 5, day: 8, month: 10, year: 2026, weekday: 4 }

/** PLAY-320 with the clock at `clock` (and `save` in its save RAM), the cartridge started. */
export function power(clock = CLOCK, save?: Uint8Array): Elec16 {
  const m = Elec16.boot(ROM.image, 'play-320', undefined, XRAM_MAX)
  m.setClock(clock)
  settle(m, cart)
  if (save !== undefined) m.insertCart(cart, new Uint8Array(32), save)
  tap(m, padBit('start'), cart)
  return m
}

/** Frames until the screen is `sc`, at most `n`. */
export function until(m: Elec16, sc: number, n = 600): void {
  for (let k = 0; k < n && read(m, 'screen') !== sc; k++) frames(m, 1, cart)
  expect(read(m, 'screen')).toBe(sc)
}

/** The cartridge started and its boot log skipped with START: the title. */
export function boot(clock = CLOCK, save?: Uint8Array): Elec16 {
  const m = power(clock, save)
  expect(read(m, 'screen')).toBe(SC.boot)
  tap(m, padBit('start'), cart)
  until(m, SC.title, 20)
  return m
}

/** From the title: START, VERSUS CPU (the controls the first time, START past them), the select. */
export function toSelect(m: Elec16): void {
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
export function fight(
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
export const FOUGHT = new Map<string, Uint8Array>()

/** A machine back from its snapshot, the cartridge's ROM put back in its slot. */
export function again(bytes: Uint8Array): Elec16 {
  const m = Elec16.restore(ROM.image, bytes)
  if (m === null || !m.attachCartRom(cart, new Uint8Array(32))) throw new Error('no snapshot')
  return m
}

export function fightFrom(m: Elec16, drive: [number, number], slot: number, at: number): Elec16 {
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
export function step(m: Elec16, h0 = 0, h1 = 0): void {
  put(m, 'extHeld', h0, 0)
  put(m, 'extHeld', h1, 1)
  frames(m, 1, cart)
}

export function steps(m: Elec16, n: number, h0 = 0, h1 = 0): void {
  for (let k = 0; k < n; k++) step(m, h0, h1)
}

/**
 * The two placed `apart` points from the middle each (P1 left, facing right), standing; their
 * last frame's place in `was` too, and in the CPU's ring of sights (else it saw one coming in
 * the jump, and met it). A frame passes with nothing held so the poses settle.
 */
export function place(m: Elec16, x0: number, x1: number): void {
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
  // The CPU's ring of what it saw: there all along, so no walk in is seen in the jump.
  for (let k = 0; k < 32; k++) {
    put(m, 'seenX', x0, k)
    put(m, 'seenX', x1, 32 + k)
  }
  step(m)
}

/** Frames until fighter `i` is free (standing or crouching), at most `n`. */
export function untilFree(m: Elec16, i: number, n: number, h0 = 0, h1 = 0): number {
  for (let k = 0; k < n; k++) {
    const st = read(m, 'fState', i)
    if (st === ST.stand || st === ST.crouch) return k
    step(m, h0, h1)
  }
  return n
}

/** The game's RAM: its globals and arrays (0280-1FFF). */
export const globals = (m: Elec16) => m.state.ram.slice(0x280, 0x2000)

/** Video memory's sprite table: how many sprites cover each of the screen's 288 lines. */
export function perLine(m: Elec16): number[] {
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

/** The sprites shown (OAM, size not hidden) whose left edge is left of `x`. */
export function spritesLeftOf(m: Elec16, x: number): number {
  const mem = m.state.video?.mem ?? new Uint8Array()
  let n = 0
  for (let k = 0; k < 128; k++) {
    const w = (i: number) =>
      (mem[0xc000 + k * 8 + i * 2] ?? 0) | ((mem[0xc000 + k * 8 + i * 2 + 1] ?? 0) << 8)
    if ((w(3) & 3) === 3) continue
    if ((w(0) << 16) >> 16 < x) n++
  }
  return n
}

/** BG1's row `y` as the font's words (a cell of another tile reads as a space). */
export function rowText(m: Elec16, y: number): string {
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
export const BIG_CHARS = 'ABCDEFGHIKLMNOPRSTUVWY.?123'
export const BIG_TILE = Number(/export const BIG_TILE = (0x[0-9a-f]+)/.exec(assetsText)?.[1])

/** BG1's row `y` read as the tops of large letters (a narrow space between words). */
export function bigText(m: Elec16, y: number): string {
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
export function sizeOf(name: string): number {
  const m = new RegExp(`^${name} = 0x[0-9a-f]+ ; (\\d+) bytes$`, 'm').exec(asmText)
  return m ? Number(m[1]) : 2
}

/** The kit's sound's state (lib/sound.e16.ts): it goes on through a pause, the music muted. */
export const SOUND_STATE = [
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
export const shown = (m: Elec16, slot: number, k: number) => {
  const mem = m.state.video?.mem ?? new Uint8Array()
  const at = 0xc400 + slot * 32 + k * 2
  return (mem[at] ?? 0) | ((mem[at + 1] ?? 0) << 8)
}
export const kept = (m: Elec16, slot: number, k: number) => read(m, 'palCopy', slot * 16 + k)

export const LOG_ROW = 34
/** cpu/opponents.txt's columns, and its rows. */
export const O = { think: 2, rGuard: 3, rAA: 4, rPunish: 5, rTech: 6, rSwitch: 7, guard: 8, aa: 9 }
export const O2 = { punish: 10, read: 11, range: 12, pattern: 18, habit: 19, min: 20, max: 21 }
export const O3 = { whim: 23 }
export const OPP_W = 32
export const ROOT_ROW = 4
export const opponents = table('cpu/opponents.txt', OPP_W)
/** cpu/ladder.txt: each place's reactions slower and quicker, its sureness, its reading. */
export const ladderPlaces = table('cpu/ladder.txt', 4)

/**
 * Opponent `k`'s row as met at ladder place `pos` (engine/data.e16.ts's `oppLoad`): reactions
 * slower then quicker (never under 8, a tech's 4), the three chances scaled, a reader reading more.
 */
export function scaled(k: number, pos: number): number[] {
  const r = [...(opponents[k] ?? [])]
  const [slower = 0, quicker = 0, sure = 256, more = 0] = ladderPlaces[pos] ?? []
  for (let c = O.rGuard; c <= O.rSwitch; c++) {
    const least = c === O.rTech ? 4 : 8
    r[c] = Math.max(least, (r[c] ?? 0) + slower - quicker)
  }
  for (const c of [O.guard, O.aa, O2.punish]) r[c] = ((r[c] ?? 0) * sure) >> 8
  if ((r[O2.read] ?? 0) !== 0) r[O2.read] = Math.min(255, (r[O2.read] ?? 0) + more)
  return r
}

/** The actions' numbers (cpu/ai.e16.ts): WAIT keeps the distance it likes. */
export const WAIT = 8

/** Column `c` of the row CPU fighter `i` plays by, as met (in RAM, scaled by the ladder). */
export const setRow = (m: Elec16, i: number, c: number, v: number) =>
  put(m, 'opp', v, i * OPP_W + c)
export const rowOf = (m: Elec16, i: number, c: number) => read(m, 'opp', i * OPP_W + c)

/* ---------------- players from outside, for the balance (design 3.1) ---------------- */

/** P1's buttons for this frame, from the machine as it stands: a player from outside. */
export type Player = (m: Elec16) => number

/** A small seeded generator (mulberry32): a player's chances, the same for the same seed. */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Points between the two, now. */
export const apart = (m: Elec16) => Math.abs(read(m, 'fX', 0) - read(m, 'fX', 1)) >> 4
/** Half fighter `i`'s body as it stands (its stand pose's body box, as the CPU measures it). */
const HALF = [18, 17, 19, 21]
const halfOf = (m: Elec16, i: number) => HALF[read(m, 'fSlot', i)] ?? 18
/** How far apart P1's move `mv` reaches the CPU standing: its box's tip and the CPU's half. */
export const reachOf = (m: Elec16, mv: number) => read(m, 'reach', mv) + halfOf(m, 1)
/** How far apart P1 may throw the CPU: its profile's range and the CPU's half, a little less. */
const throwRange = (m: Elec16) => (profiles[read(m, 'fSlot', 0)]?.[8] ?? 28) + halfOf(m, 1) - 2
/** Fighter `i` in the air, still going up. */
const rising = (m: Elec16, i: number) => {
  const v = read(m, 'fVY', i)
  return v > 0 && v < 0x8000
}
const isFree = (m: Elec16, i: number) => [ST.stand, ST.crouch].includes(read(m, 'fState', i))

/** A jumper's buttons: in from the middle distance, `b` pressed falling near (every other frame). */
function jumper(m: Elec16, b: number, k: number): number {
  const d = apart(m)
  if (read(m, 'fState', 0) === ST.jump) return rising(m, 0) || d > 60 ? 0 : k & 1 ? b : 0
  if (!isFree(m, 0)) return 0
  return d > 90 ? I.fwd : I.up | I.fwd
}

/**
 * A one-button player: walks in until `b`'s move reaches (`mv`, its row) and presses it whenever
 * free there (never into the buffer, which would let it out again where it was pushed to).
 * `jump`: jumps in from the middle distance and presses it falling. `throw`: walks in to the
 * throw's range (forward and the heavy punch).
 */
export function spammer(b: number, mv: number, how: 'reach' | 'jump' | 'throw' = 'reach'): Player {
  let k = 0
  return (m) => {
    k++
    if (how === 'jump') return jumper(m, b, k)
    const range = how === 'throw' ? throwRange(m) : reachOf(m, mv) - 2
    if (!isFree(m, 0)) return b & I.down
    if (apart(m) > range) return I.fwd
    return k & 1 ? b : b & (I.down | I.fwd)
  }
}

/** What P1 saw of the CPU in a frame: its state, move, frames into it, the distance, its height. */
type Sight = { st: number; mv: number; f: number; d: number; y: number }
const NOTHING: Sight = { st: ST.stand, mv: 0, f: 0, d: 200, y: 0 }
/** A move's frames: startup and active, all, and its advantage when guarded. */
const rowOfMove = (slot: number, mv: number) => moves[slot]?.[mv] ?? []
const hitEnd = (r: number[]) => (r[C.startup] ?? 0) + (r[C.active] ?? 0)
const total = (r: number[]) => hitEnd(r) + (r[C.recovery] ?? 0) - 1
const onGuard = (r: number[]) =>
  (r[C.blockstun] ?? 0) - ((r[C.active] ?? 0) - 1 + (r[C.recovery] ?? 0))
const BUTTON = [I.lp, I.hp, I.lk, I.hk]
/** A ground move's buttons (rows 0-7). */
const buttonsOf = (mv: number) => (BUTTON[mv & 3] ?? 0) | (mv >= 4 ? I.down : 0)
/** The punishes a person reaches for, the heaviest first. */
const PUNISHERS = [MV.sHK, MV.sHP, MV.sLK, MV.sLP]
/** The pokes it walks in to. */
const POKES = [MV.sLP, MV.sLK, MV.cLK, MV.cLP, MV.sHK, MV.cHK, MV.sHP]

/** A person's skill: frames it sees late, its chances of the right guard, a punish, an anti-air. */
export type Skill = { react: number; guard: number; punish: number; aa: number }
export const PERSON: Skill = { react: 16, guard: 0.8, punish: 0.6, aa: 0.35 }
/** A beginner: slower eyes, a wrong guard one time in three, fewer punishes and anti-airs. */
export const NOVICE: Skill = { react: 20, guard: 0.65, punish: 0.35, aa: 0.2 }

/** A person's mind from frame to frame (see `person`); each step answers buttons, or null. */
class Person {
  readonly r: () => number
  readonly skill: Skill
  readonly seen: Sight[] = []
  k = 0
  out = 0
  plan = 'none'
  planT = 0
  planMv = 0
  gId = -1
  gHold = 0
  aaId = -1
  aaOn = false
  pId = -1
  pOn = false
  chained = -1
  wasGuard = false
  guardedMv = -1
  tech = 0
  m: Elec16 | null = null
  now: Sight = NOTHING
  late: Sight = NOTHING

  constructor(seed: number, skill: Skill) {
    this.r = rng(seed)
    this.skill = skill
  }

  get machine(): Elec16 {
    if (this.m === null) throw new Error('no machine')
    return this.m
  }

  press(b: number, keep = 0): number {
    return (this.out & b) !== 0 ? keep : b | keep
  }

  slot(i: number): number {
    return read(this.machine, 'fSlot', i)
  }

  cpuReach(mv: number): number {
    return read(this.machine, 'reach', 13 + mv) + halfOf(this.machine, 0)
  }

  /** The heaviest punish that starts within `left` frames and reaches, pressed; else null. */
  punishWith(left: number): number | null {
    for (const mv of PUNISHERS) {
      const s = rowOfMove(this.slot(0), mv)[C.startup] ?? 99
      if (s <= left && this.now.d <= reachOf(this.machine, mv)) return this.press(buttonsOf(mv))
    }
    return null
  }

  look(m: Elec16): void {
    this.k++
    this.m = m
    this.now = {
      st: read(m, 'fState', 1),
      mv: read(m, 'fMove', 1),
      f: read(m, 'fMoveF', 1),
      d: apart(m),
      y: read(m, 'fY', 1),
    }
    this.seen.push(this.now)
    if (this.seen.length > 40) this.seen.shift()
    this.late = this.seen[this.seen.length - 1 - this.skill.react] ?? NOTHING
  }

  /** Not free: thrown (a fifth of the time it guessed and techs), in the air, guarding, striking. */
  busy(st: number): number {
    if (st === ST2.thrown) return this.caught()
    this.tech = 0
    if (st === ST.jump) return rising(this.machine, 0) || this.now.d > 60 ? 0 : this.press(I.hk)
    if (st === ST.guard) {
      this.wasGuard = true
      if (this.now.st === ST.attack) this.guardedMv = this.now.mv
      return this.gHold || I.back | I.down
    }
    return st === ST.attack ? this.chain() : 0
  }

  /** Thrown: a fifth of the time it guessed the throw, and techs it. */
  caught(): number {
    if (this.tech === 0) this.tech = this.r() < 0.2 ? 1 : 2
    return this.tech === 1 ? this.press(I.hp, I.back) : 0
  }

  /** A light that struck: the heavy of its kind, half the time. */
  chain(): number {
    const m = this.machine
    const mv = read(m, 'fMove', 0)
    const row = rowOfMove(this.slot(0), mv)
    if (read(m, 'fHitDone', 0) === 0 || ((row[C2.flags] ?? 0) & 1) === 0) return 0
    const began = this.k - read(m, 'fMoveF', 0)
    if (this.chained !== began) this.chained = this.r() < 0.5 ? began : -2
    return this.chained > 0 ? this.press(mv & 2 ? I.hk : I.hp, mv >= 4 ? I.down : 0) : 0
  }

  /** Out of a guard: what it knows is unsafe, punished (the heaviest that comes in time). */
  afterGuard(): number | null {
    if (!this.wasGuard) return null
    this.wasGuard = false
    const g = this.guardedMv
    this.guardedMv = -1
    if (g < 0 || g >= 8 || this.r() >= this.skill.punish) return null
    return this.punishWith(-onGuard(rowOfMove(this.slot(1), g)) - 1)
  }

  /** A jump seen: the anti-air some of the time, else a standing guard. */
  jumpSeen(): number | null {
    const { late, now } = this
    if (late.y === 0 && late.st !== ST.prejump) return null
    const id = this.k - late.f
    if (Math.abs(id - this.aaId) > 30) {
      this.aaId = id
      this.aaOn = this.r() < this.skill.aa
    }
    if (now.d >= 120) return null
    if (this.aaOn && now.d < 50) return this.press(I.hp, I.down)
    return this.aaOn ? I.down : I.back
  }

  /** An attack seen coming that reaches: guarded, the right height by its skill. */
  attackSeen(): number | null {
    const { late } = this
    const lr = rowOfMove(this.slot(1), late.mv)
    if (late.st !== ST.attack || late.y !== 0 || late.mv >= 8 || late.f >= hitEnd(lr)) return null
    if (late.d > this.cpuReach(late.mv) + 8) return null
    const id = this.k - this.skill.react - late.f
    if (id !== this.gId) {
      this.gId = id
      let crouch = (lr[C2.height] ?? 1) !== 3
      if (this.r() >= this.skill.guard) crouch = !crouch
      this.gHold = I.back | (crouch ? I.down : 0)
    }
    return this.gHold
  }

  /** A recovery seen with time to run: punished by its skill, if a move comes in time. */
  recoverySeen(): number | null {
    const { late } = this
    const lr = rowOfMove(this.slot(1), late.mv)
    if (late.st !== ST.attack || late.y !== 0 || late.mv >= 8 || late.f < hitEnd(lr)) return null
    const id = this.k - this.skill.react - late.f
    if (id !== this.pId) {
      this.pId = id
      this.pOn = this.r() < this.skill.punish
    }
    if (!this.pOn) return null
    const p = this.punishWith(total(lr) - late.f - this.skill.react)
    if (p !== null) this.pOn = false
    return p
  }

  /** A plan by chance: a poke at reach, a jump in, a throw, a guard, backing off, waiting. */
  choose(): void {
    const x = this.r()
    const d = this.now.d
    this.planT = 20 + Math.floor(this.r() * 30)
    if (x < 0.36) {
      this.plan = 'poke'
      this.planMv = POKES[Math.floor(this.r() * POKES.length)] ?? 0
    } else if (x < 0.44) this.plan = d > 60 && d < 130 ? 'jump' : 'wait'
    else if (x < 0.54) this.plan = 'throw'
    else if (x < 0.78) this.plan = 'guard'
    else this.plan = x < 0.88 ? 'back' : 'wait'
    if (this.plan === 'back') this.planT = 10 + Math.floor(this.r() * 10)
  }

  planned(): number {
    if (this.planT <= 0 || this.plan === 'none') this.choose()
    this.planT--
    const d = this.now.d
    if (this.plan === 'poke' || this.plan === 'throw') return this.walkIn(d)
    if (this.plan === 'jump') {
      this.plan = 'none'
      return this.press(I.up, I.fwd)
    }
    if (this.plan === 'back') return I.back
    if (this.plan === 'guard') return I.back | I.down
    if (d < this.cpuReach(MV.cHK) + 12) return I.back | I.down
    return d > 110 ? I.fwd : 0
  }

  /** In to the poke's reach or the throw's range, then pressed. */
  walkIn(d: number): number {
    const poke = this.plan === 'poke'
    if (d > (poke ? reachOf(this.machine, this.planMv) - 4 : throwRange(this.machine))) return I.fwd
    this.plan = 'none'
    return poke ? this.press(buttonsOf(this.planMv)) : this.press(I.hp, I.fwd)
  }

  decide(m: Elec16): number {
    this.look(m)
    if (!isFree(m, 0)) return this.busy(read(m, 'fState', 0))
    this.tech = 0
    return (
      this.afterGuard() ??
      this.jumpSeen() ??
      this.attackSeen() ??
      this.recoverySeen() ??
      this.planned()
    )
  }
}

/**
 * A person, as near as a script comes (design 3.1's measure): it sees the CPU `react` frames late
 * (a person's 12-15 and the hand's); it guards an attack it sees coming (the right height most
 * of the time), crouch-guards by habit when the CPU is near and it means nothing, punishes what
 * it guarded that it knows is unsafe and a recovery it sees with time to run, anti-airs some
 * jumps, chains a light that struck, and otherwise pokes at reach, throws, jumps in, waits or
 * backs off by chance. It never reads the CPU's buttons or its program.
 */
export function person(seed: number, skill: Skill = PERSON): Player {
  const p = new Person(seed, skill)
  return (m) => {
    p.out = p.decide(m)
    return p.out
  }
}
