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
 * last frame's place in `was` too. A frame passes with nothing held so the poses settle.
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
/** The actions' numbers (cpu/ai.e16.ts): WAIT keeps the distance it likes. */
export const WAIT = 8

/** Column `c` of the row CPU fighter `i` plays by, as met (in RAM, scaled by the ladder). */
export const setRow = (m: Elec16, i: number, c: number, v: number) =>
  put(m, 'opp', v, i * OPP_W + c)
export const rowOf = (m: Elec16, i: number, c: number) => read(m, 'opp', i * OPP_W + c)
