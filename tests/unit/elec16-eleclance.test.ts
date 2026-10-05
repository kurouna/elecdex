import { readFileSync } from 'node:fs'
import { CHANNELS } from '@shared/elec16/apu'
import { readCart } from '@shared/elec16/cartridge'
import { compileSongs, loopFrames, type Song } from '@shared/elec16/kit/mml'
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
  ROM,
  ramPoke,
  ramWord,
  settle,
  startGame,
  tap,
} from './elec16-kit-helpers'

/**
 * ELECLANCE, the game kit's sample (docs/elec16-eleclance.md): built from its folder as
 * gen:elec16 builds it, and played on the core - the title, the stage, the lance, a bomb, both
 * bosses, the clear and the second round, the game's end and a name kept in save RAM. The
 * ship is kept from harm where a test needs it alive (its `guard`), found by name in what
 * e16c wrote.
 */

const DIR = 'resources/elec16/games/eleclance'
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

/** The difficulties, as the title offers them left to right. */
const LEVELS = ['easy', 'normal', 'hard'] as const
type Level = (typeof LEVELS)[number]

/** PLAY-320 switched on with ELECLANCE in the slot holding `save`, START pressed: its title. */
function startWithSave(save: Uint8Array): Elec16 {
  const m = Elec16.boot(ROM.image, 'play-320', undefined, XRAM_MAX)
  settle(m, cart)
  m.insertCart(cart, new Uint8Array(32), save)
  tap(m, padBit('start'), cart)
  return m
}

/** Left or right on the title, `n` times (negative for left). */
function choose(m: Elec16, n: number): void {
  for (let k = 0; k < Math.abs(n); k++) tap(m, padBit(n < 0 ? 'left' : 'right'), cart)
}

/** The game from its title, START pressed (at `level`, from NORMAL): the stage begins. */
function playing(level: Level = 'normal', m = startGame(cart)): Elec16 {
  frames(m, 70, cart)
  choose(m, LEVELS.indexOf(level) - 1)
  m.pad(padBit('start'))
  frames(m, 2, cart)
  m.pad(0)
  frames(m, 2, cart)
  return m
}

/** Frames with the ship kept from harm, the lance out (or `pad`); answers the busiest frame. */
function guarded(m: Elec16, n: number, pad = padBit('a')): number {
  let worst = 0
  for (let k = 0; k < n; k++) {
    put(m, 'guard', 200)
    put(m, 'lives', 3)
    m.pad(pad)
    const c0 = m.state.cycles
    frames(m, 1, cart)
    worst = Math.max(worst, m.state.cycles - c0)
  }
  return worst
}

/** A constant of the generated assets.e16.ts. */
const constant = (name: string) =>
  Number.parseInt(new RegExp(`${name} = 0x([0-9a-f]+)`).exec(built.report.assets)?.[1] ?? 'x', 16)

/** The script's rows, in its order (stage.txt, comments and the end mark left out). */
const SCRIPT_ROWS = readFileSync(`${DIR}/stage.txt`, 'utf8')
  .split(/\r?\n/)
  .map((l) => l.replace(/#.*$/, '').trim())
  .filter((l) => l !== '' && !l.startsWith('65535'))
  .map((l) => Number(l.split(/\s+/)[0]))

/**
 * The stage scrolled on until the screen's top is at picture row `row`, and the script moved
 * past what the rows below it would have sent.
 */
function scrollTo(m: Elec16, row: number): void {
  put(m, 'scrolled', constant('STAGE_H') * 8 - 288 - row * 8)
  const passed = SCRIPT_ROWS.filter((r) => r > row).length
  put(m, 'scriptAt', constant('STAGE_SCRIPT_AT') + passed * 8)
}

/** A bullet standing still at (x, y), sixteenths: slot k of the bullets. */
function stillBullet(m: Elec16, k: number, x: number, y: number): void {
  put(m, 'buKind', 0, k)
  put(m, 'buX', x, k)
  put(m, 'buY', y, k)
  put(m, 'buVX', 0, k)
  put(m, 'buVY', 0, k)
  put(m, 'buLive', 1, k)
  put(m, 'buGrazed', 1, k)
}

/** Whether a bullet still stands at (x, y). */
function stillAt(m: Elec16, x: number, y: number): boolean {
  for (let k = 0; k < 72; k++) {
    if (read(m, 'buLive', k) !== 0 && read(m, 'buX', k) === x && read(m, 'buY', k) === (y & 0xffff))
      return true
  }
  return false
}

/** Runs (guarded) until `done`, at most `limit` frames: answers the frames it took. */
function until(m: Elec16, done: () => boolean, limit: number): number {
  for (let k = 0; k < limit; k++) {
    if (done()) return k
    guarded(m, 1)
  }
  throw new Error(`not done after ${limit} frames`)
}

describe('ELECLANCE as built', () => {
  it('is what games.json holds, and its folder keeps the constants its sources import', () => {
    const file = JSON.parse(readFileSync('resources/elec16/games/games.json', 'utf8'))
    const images = file.games.map((g: { data: string }) => fromBase64(g.data) ?? new Uint8Array())
    expect(images.find((i: Uint8Array) => readCart(i)?.id === 'ELECLANCE')).toEqual(cart)
    expect(readCart(cart)).toMatchObject({ id: 'ELECLANCE', name: 'ELECLANCE', saveBanks: 1 })
    expect(readFileSync(`${DIR}/assets.e16.ts`, 'utf8')).toBe(built.report.assets)
    // And e16c's output, kept to read: what the cartridge's code was assembled from.
    expect(readFileSync(`${DIR}/compiled.s`, 'utf8')).toBe(built.report.asm)
  })

  it("keeps its code within RAM's room and its tiles within the 1,024", () => {
    expect(built.report.ramCode).toBeLessThanOrEqual(0x5000)
    expect(built.report.tiles).toBeLessThanOrEqual(1024)
  })

  it('has songs whose channels keep in step, the music on 0-11 and the effects on 12-15', () => {
    const songs: Song[] = [
      ...compileSongs(readFileSync(`${DIR}/music/songs.mml`, 'utf8')),
      ...compileSongs(readFileSync(`${DIR}/music/sfx.mml`, 'utf8')),
    ]
    for (const song of songs) {
      const effect = song.name.startsWith('x_') || song.name === 'extend'
      for (const ch of song.channels) {
        expect(ch.channel < 12, `${song.name} C${ch.channel}`).toBe(!effect)
        expect(ch.channel).toBeLessThan(CHANNELS)
      }
      // Every looping channel comes round in the same time, so the band stays together.
      const bodies = new Set(loopFrames(song).values())
      expect([...bodies], song.name).toHaveLength(bodies.size > 0 ? 1 : 0)
    }
    expect(songs.find((s) => s.name === 'stage')?.tempo).toBe(6)
    expect(songs.find((s) => s.name === 'boss')?.tempo).toBe(5)
  })
})

describe('ELECLANCE played', () => {
  it('starts from the title with START and runs the stage well within its frames', () => {
    const m = playing()
    let sum = 0
    let worst = 0
    for (let k = 0; k < 600; k++) {
      const c0 = m.state.cycles
      guarded(m, 1)
      const d = m.state.cycles - c0
      sum += d
      if (k > 10) worst = Math.max(worst, d)
    }
    expect(m.state.halt).toBeNull()
    // 4 MHz at 60 frames: 66,667 cycles a frame. Measured near 9,000 a frame on average.
    expect(sum / 600).toBeLessThan(20_000)
    expect(worst).toBeLessThan(66_667)
    // The lance has scored.
    expect(read(m, 'score')).toBeGreaterThan(0)
  })

  it("sends a bomb's ring out farther with more power, taking the bullets it passes", () => {
    // Two still bullets 60 and 150 points above the ship: power 0's ring (80) takes only the
    // nearer; power 4's (208) both.
    for (const [power, left] of [
      [0, 1],
      [4, 0],
    ] as const) {
      const m = playing()
      guarded(m, 120, 0)
      put(m, 'power', power)
      const x = read(m, 'shipX')
      const y = read(m, 'shipY')
      stillBullet(m, 0, x, y - 60 * 16)
      stillBullet(m, 1, x, y - 150 * 16)
      const before = read(m, 'bombs')
      m.pad(padBit('b'))
      frames(m, 2, cart)
      m.pad(0)
      guarded(m, 40, 0)
      expect(read(m, 'bombs')).toBe(before - 1)
      // Still bullets are found by their places: a freed slot may already hold a new one.
      expect([stillAt(m, x, y - 60 * 16), stillAt(m, x, y - 150 * 16)], `power ${power}`).toEqual([
        false,
        left === 1,
      ])
    }
  })

  it('takes P for power: more shots, missiles from 3, and the lance only half as hard', () => {
    const m = playing()
    guarded(m, 120, 0)
    // A P at the ship: caught at once.
    put(m, 'itKind', 4, 0)
    put(m, 'itX', read(m, 'shipX'), 0)
    put(m, 'itY', read(m, 'shipY'), 0)
    guarded(m, 2, 0)
    expect(read(m, 'power')).toBe(1)
    // Named as it is taken: POWER UP floats up over the ship.
    expect(Array.from({ length: 32 }, (_, k) => read(m, 'fxKind', k))).toContain(6)
    put(m, 'power', 3)
    guarded(m, 40)
    expect([0, 1, 2, 3, 4, 5].some((k) => read(m, 'mT', k) !== 0)).toBe(true)
  })

  it('lets the lance glance off a prism, which shots still hurt', () => {
    const m = playing()
    guarded(m, 120, 0)
    const x = read(m, 'shipX')
    put(m, 'fK', 9, 0)
    put(m, 'fX', x, 0)
    put(m, 'fY', 80 * 16, 0)
    put(m, 'fHP', 18, 0)
    put(m, 'fT', 0, 0)
    put(m, 'fP', 200, 0)
    guarded(m, 30)
    expect(read(m, 'fHP')).toBe(18)
    // Shots (A tapped) hurt it.
    for (let k = 0; k < 20 && read(m, 'fK') === 9; k++) {
      put(m, 'fX', read(m, 'shipX'), 0)
      guarded(m, 2, padBit('a'))
      guarded(m, 2, 0)
    }
    expect(read(m, 'fK') === 0 || read(m, 'fHP') < 18).toBe(true)
  })

  it('sends a spark on from what the lance strikes at power 2', () => {
    const m = playing()
    guarded(m, 120, 0)
    put(m, 'power', 2)
    const x = read(m, 'shipX')
    // A turret in the lance's path, another beside it within the spark's reach.
    for (const [k, dx] of [
      [0, 0],
      [1, 60],
    ] as const) {
      put(m, 'fK', 8, k)
      put(m, 'fX', x + dx * 16, k)
      put(m, 'fY', 60 * 16, k)
      put(m, 'fHP', 200, k)
      put(m, 'fT', 1, k)
    }
    guarded(m, 20)
    expect(read(m, 'fHP', 0)).toBeLessThan(200)
    expect(read(m, 'fHP', 1)).toBeLessThan(200)
  })

  it("sends a serpent's segments after its head, and up in a chain when the head dies", () => {
    const m = playing()
    scrollTo(m, 480)
    const kinds = () => Array.from({ length: 24 }, (_, k) => read(m, 'fK', k))
    until(m, () => kinds().includes(10), 600)
    guarded(m, 60, 0)
    expect(kinds().filter((k) => k === 11)).toHaveLength(6)
    // The segments are strung out along the trail, not on top of the head.
    const head = kinds().indexOf(10)
    const seg = kinds().indexOf(11)
    expect(read(m, 'fY', seg)).not.toBe(read(m, 'fY', head))
    // The head down (the lance on it), the segments follow it one after another.
    put(m, 'fHP', 1, head)
    for (let k = 0; k < 120 && kinds().includes(10); k++) {
      put(m, 'shipX', read(m, 'fX', head))
      guarded(m, 1)
    }
    expect(kinds().includes(10)).toBe(false)
    guarded(m, 60, 0)
    expect(kinds().filter((k) => k === 11)).toHaveLength(0)
  })

  it('bursts a spinner into a ring of bullets when it dies', () => {
    // HARD: every volley whole.
    const m = playing('hard')
    guarded(m, 120, 0)
    put(m, 'fK', 12, 0)
    put(m, 'fX', read(m, 'shipX'), 0)
    put(m, 'fY', 100 * 16, 0)
    put(m, 'fHP', 1, 0)
    put(m, 'fT', 1, 0)
    for (let k = 0; k < 60 && read(m, 'fK') === 12; k++) {
      put(m, 'fX', read(m, 'shipX'), 0)
      guarded(m, 1)
    }
    expect(read(m, 'fK')).toBe(0)
    guarded(m, 1, 0)
    expect(read(m, 'bulletCount')).toBeGreaterThanOrEqual(8)
  })

  it('calls OVERDRIVE on X once VOLT is full, the music bringing its layer in', () => {
    const m = playing()
    guarded(m, 120, 0)
    // Quiet until called: channel 11 (bit 11) is muted.
    expect(read(m, 'muted')).toBe(0x800)
    m.pad(padBit('x'))
    frames(m, 2, cart)
    expect(read(m, 'overdrive')).toBe(0)
    put(m, 'volt', 1024)
    m.pad(0)
    frames(m, 1, cart)
    m.pad(padBit('x'))
    frames(m, 2, cart)
    m.pad(0)
    frames(m, 2, cart)
    expect(read(m, 'overdrive')).toBeGreaterThan(400)
    expect([read(m, 'volt'), read(m, 'muted')]).toEqual([0, 0])
  })

  it('holds the stage on BASTION until it falls, then goes on above its arena', () => {
    const m = playing()
    scrollTo(m, 316)
    until(m, () => read(m, 'bossOn') === 1, 600)
    // Held: the logical rows go on past the arena while the boss lives.
    const top = read(m, 'logicalTop')
    // Away from it (no lance) a while, so it lives: the logical rows still go on.
    guarded(m, 240, padBit('left'))
    expect(read(m, 'bossOn')).toBe(1)
    expect((top - read(m, 'logicalTop')) & 0xffff).toBeGreaterThan(10)
    // Its arms and core gone: it goes down in a chain of explosions.
    put(m, 'life', 0, 0)
    put(m, 'life', 0, 1)
    put(m, 'life', 0, 2)
    until(m, () => read(m, 'bossPhase') === 9, 10)
    until(m, () => read(m, 'bossPhase') === 10, 400)
    guarded(m, 30)
    // Let go: the screen's top is above the arena now, in the station.
    expect(read(m, 'logicalTop')).toBeLessThan(256)
    guarded(m, 300)
    expect(m.state.halt).toBeNull()
  })

  it('brings ZENITH after the warning, through its phases, then clears into round two', () => {
    const m = playing()
    scrollTo(m, 74)
    until(m, () => read(m, 'bossOn') === 2, 900)
    until(m, () => read(m, 'bossPhase') === 1, 300)
    put(m, 'life', 0, 1)
    put(m, 'life', 0, 2)
    until(m, () => read(m, 'bossPhase') === 2, 60)
    put(m, 'life', 150, 0)
    until(m, () => read(m, 'bossPhase') === 3, 60)
    put(m, 'life', 1, 0)
    const before = read(m, 'score', 1) * 10000 + read(m, 'score')
    until(m, () => read(m, 'bossPhase') === 10, 600)
    guarded(m, 4)
    // Beaten, it is worth 100,000 (kept in tens).
    expect(read(m, 'score', 1) * 10000 + read(m, 'score') - before).toBeGreaterThanOrEqual(10000)
    until(m, () => read(m, 'round') === 2, 1200)
    // The panels drawn again, the score and the best with them before any point is scored.
    idleFrames(m, 2)
    expect(rowText(m, 0, 10, 19)).toMatch(/^\d{9}$/)
    expect(rowText(m, 0, 24, 33)).toMatch(/^\d{9}$/)
    expect(read(m, 'scrolled')).toBeLessThan(200)
    // Round two plays on: nothing of the beaten boss carried over to end it at once.
    guarded(m, 400)
    expect([read(m, 'round'), read(m, 'bossPhase'), read(m, 'bossOn')]).toEqual([2, 0, 0])
    expect(read(m, 'scrolled')).toBeGreaterThan(150)
    expect(m.state.halt).toBeNull()
  })

  it("ends the game, takes a best score's name and keeps it in save RAM", () => {
    const m = playing()
    put(m, 'score', 0, 0)
    put(m, 'score', 99, 1)
    // No extra ship for the score set here (it passes 50,000 at once).
    put(m, 'nextExtend', 0)
    put(m, 'lives', 0)
    put(m, 'shipState', 2)
    // GAME OVER, then the name: three letters, the first moved up to B.
    frames(m, 100, cart)
    expect(read(m, 'shipState')).toBe(3)
    frames(m, 260, cart)
    m.pad(padBit('up'))
    frames(m, 2, cart)
    m.pad(0)
    frames(m, 2, cart)
    for (let k = 0; k < 3; k++) {
      m.pad(padBit('a'))
      frames(m, 2, cart)
      m.pad(0)
      frames(m, 2, cart)
    }
    frames(m, 10, cart)
    const save = m.state.cart?.save ?? new Uint8Array()
    // "AR", then the first entry: the score (low, high) and the letters B A A.
    expect([save[0], save[1]]).toEqual([0x41, 0x52])
    const word = (k: number) => (save[k] ?? 0) | ((save[k + 1] ?? 0) << 8)
    expect([word(2), word(4)]).toEqual([0, 99])
    expect([save[6], save[7], save[8]]).toEqual([0x42, 0x41, 0x41])
  })
})

/* ---------------- the screen read back, and the foes by slot ---------------- */

/** BG1's row `y` as text: each cell's character from the game's font (space for the rest). */
function rowText(m: Elec16, y: number, from = 0, to = 40): string {
  const font = constant('FONT_TILE')
  let out = ''
  for (let x = from; x < to; x++) {
    const tile = cellWord(m, x, y) & 0x3ff
    out += tile >= font && tile < font + 64 ? String.fromCharCode(32 + tile - font) : ' '
  }
  return out
}

/** The palette slot of BG1's cell (x, y). */
const cellSlot = (m: Elec16, x: number, y: number) => (cellWord(m, x, y) >> 10) & 7

function cellWord(m: Elec16, x: number, y: number): number {
  const mem = m.state.video?.mem ?? new Uint8Array()
  const at = 0xa000 + (y << 7) + (x << 1)
  return (mem[at] ?? 0) | ((mem[at + 1] ?? 0) << 8)
}

/** The foes' kinds by slot. */
const kinds = (m: Elec16) => Array.from({ length: 24 }, (_, k) => read(m, 'fK', k))

/** Frames with the ship kept from harm and the pad let go (nothing shot). */
const idleFrames = (m: Elec16, n: number) => guarded(m, n, 0)

/** Runs (guarded, nothing shot) until `done`, at most `limit` frames. */
function untilIdle(m: Elec16, done: () => boolean, limit: number): number {
  for (let k = 0; k < limit; k++) {
    if (done()) return k
    idleFrames(m, 1)
  }
  throw new Error(`not done after ${limit} frames`)
}

/** A foe put straight into slot k. */
function foeAt(m: Elec16, k: number, kind: number, x: number, y: number, t = 0, p = 0): void {
  put(m, 'fK', kind, k)
  put(m, 'fX', x & 0xffff, k)
  put(m, 'fY', y & 0xffff, k)
  put(m, 'fVX', 0, k)
  put(m, 'fVY', 0, k)
  put(m, 'fHP', 999, k)
  put(m, 'fT', t & 0xffff, k)
  put(m, 'fP', p, k)
}

/** A two-word score (tens) as a number. */
const scoreOf = (m: Elec16) => read(m, 'score', 1) * 10000 + read(m, 'score')

const i16 = (v: number) => ((v & 0xffff) ^ 0x8000) - 0x8000

/** How far from the ship each of the bomb's ring's sparks is drawn (the frame's sprite table). */
function ringRadii(m: Elec16): number[] {
  const cx = i16(read(m, 'shipX')) >> 4
  const cy = i16(read(m, 'shipY')) >> 4
  const edge = constant('RING_TILE') + 12
  const found: number[] = []
  for (let k = 0; k < 128; k++) {
    const shown = read(m, 'oam', k * 4 + 3) !== 3
    if (!shown || (read(m, 'oam', k * 4 + 2) & 0x3ff) !== edge) continue
    const x = i16(read(m, 'oam', k * 4)) + 8 - cx
    const y = i16(read(m, 'oam', k * 4 + 1)) + 8 - cy
    found.push(Math.hypot(x, y))
  }
  return found
}

describe('ELECLANCE bugs found in review', () => {
  it("lets the belt's rocks fall through the field and leave it, freeing their slots", () => {
    const m = playing()
    scrollTo(m, 412)
    const rocks = () =>
      kinds(m)
        .map((kind, k) => (kind === 6 ? k : -1))
        .filter((k) => k >= 0)
    untilIdle(m, () => rocks().length > 0, 300)
    // In the field, where shots and the lance can reach them...
    untilIdle(m, () => rocks().some((k) => i16(read(m, 'fY', k)) > 40 * 16), 300)
    // ...and out of it at the bottom, their slots free for the foes after them.
    untilIdle(m, () => rocks().length === 0 && read(m, 'logicalTop') < 395, 900)
  })

  it('sends PRISM, HALBERD and WARDEN away when their time is up, not back down', () => {
    for (const [kind, time, row] of [
      [9, 600, 110],
      [4, 640, 80],
      [5, 760, 60],
    ] as const) {
      const m = playing()
      idleFrames(m, 30)
      foeAt(m, 23, kind, 160 * 16, row * 16, time + 1, 40)
      idleFrames(m, 400)
      expect(read(m, 'fK', 23), `kind ${kind}`).not.toBe(kind)
    }
  })

  it("lets a serpent's segments go when its head leaves by the edge", () => {
    const m = playing()
    scrollTo(m, 480)
    untilIdle(m, () => kinds(m).includes(10), 600)
    idleFrames(m, 30)
    const head = kinds(m).indexOf(10)
    put(m, 'fX', (48 + 300) * 16, head)
    idleFrames(m, 400)
    expect(kinds(m).filter((k) => k === 10 || k === 11)).toHaveLength(0)
  })

  it('refuses a third serpent while two are about, so no two share a trail', () => {
    const m = playing()
    idleFrames(m, 10)
    // Two heads high in the field, slots 0 and 1 of the serpents taken.
    foeAt(m, 22, 10, 100 * 16, 20 * 16, 1, 0x000)
    foeAt(m, 23, 10, 200 * 16, 20 * 16, 1, 0x100)
    put(m, 'serpentHead', 23, 0)
    put(m, 'serpentHead', 24, 1)
    scrollTo(m, 480)
    idleFrames(m, 60)
    expect(kinds(m).filter((k) => k === 10)).toHaveLength(2)
    expect(kinds(m).filter((k) => k === 11)).toHaveLength(0)
  })

  it('sways BASTION and ZENITH smoothly within their reach, never wrapping', () => {
    for (const [row, which, reach] of [
      [316, 1, 40],
      [74, 2, 56],
    ] as const) {
      const m = playing()
      scrollTo(m, row)
      untilIdle(m, () => read(m, 'bossOn') === which && read(m, 'bossPhase') === 1, 1200)
      const xs: number[] = []
      for (let k = 0; k < 300; k++) {
        idleFrames(m, 1)
        xs.push(i16(read(m, 'bX')) - 160 * 16)
      }
      const far = Math.max(...xs.map(Math.abs))
      expect(far, `boss ${which}`).toBeLessThanOrEqual(reach * 16)
      expect(far, `boss ${which}`).toBeGreaterThan((reach - 4) * 16)
      const step = Math.max(...xs.slice(1).map((x, k) => Math.abs(x - (xs[k] ?? 0))))
      // At most about 56 x 2 pi / 256 sixteenths a frame: a wrapped sway jumps by thousands.
      expect(step, `boss ${which}`).toBeLessThanOrEqual(32)
    }
  })

  it("waves BG0 in every band, the first too, a smooth sine within the wave's size", () => {
    const m = playing()
    idleFrames(m, 200)
    // A bomb: a wave of 12 points for 90 frames. Its shake is over by frame 40.
    m.pad(padBit('b'))
    frames(m, 2, cart)
    idleFrames(m, 40)
    const firstBand = new Set<number>()
    for (let f = 0; f < 30; f++) {
      idleFrames(m, 1)
      const last = m.state.video?.tiles.last
      if (last === undefined) throw new Error('no frame')
      const lines = rasterLines(last)
      const bands = Array.from(
        { length: 36 },
        (_, k) => i16((lines[k * 8]?.scroll[0] ?? 0) << 7) >> 7,
      )
      firstBand.add(bands[0] ?? 0)
      // Sway is 0 with the ship in the middle: every band within the wave's 12 points.
      for (const b of bands) expect(Math.abs(b)).toBeLessThanOrEqual(13)
      // A band from the next: about 12 x 2 pi x 14 / 256 apart, and the phase's step of a frame.
      for (let k = 1; k < 36; k++)
        expect(Math.abs((bands[k] ?? 0) - (bands[k - 1] ?? 0))).toBeLessThanOrEqual(7)
    }
    // The first band waves with the rest (the scroll did not overwrite it).
    expect(firstBand.size).toBeGreaterThan(3)
  })

  it("draws the bomb's ring at its radius at every power", () => {
    for (const power of [0, 2, 4]) {
      const m = playing()
      idleFrames(m, 200)
      put(m, 'power', power)
      m.pad(padBit('b'))
      frames(m, 2, cart)
      idleFrames(m, 30)
      const r = Math.min(32 * 8, 80 + power * 32)
      const found = ringRadii(m)
      expect(found.length, `power ${power}`).toBeGreaterThan(8)
      for (const d of found) expect(Math.abs(d - r), `power ${power}`).toBeLessThanOrEqual(8)
    }
  })

  it("adds the tally's bonus whole and shows it in points, its last 0 too", () => {
    const m = playing()
    scrollTo(m, 74)
    untilIdle(m, () => read(m, 'bossOn') === 2 && read(m, 'bossPhase') === 1, 900)
    put(m, 'life', 0, 1)
    put(m, 'life', 0, 2)
    put(m, 'life', 1, 0)
    // The core's last point taken by the lance.
    until(m, () => read(m, 'bossPhase') >= 9, 600)
    put(m, 'maxChain', 700)
    put(m, 'bombs', 5)
    untilIdle(m, () => rowText(m, 8).includes('STAGE CLEAR'), 600)
    const before = scoreOf(m)
    untilIdle(m, () => rowText(m, 19).includes('BONUS'), 600)
    // 700 x 1,000 and 5 x 10,000 points: 750,000, kept in tens.
    expect(scoreOf(m) - before).toBe(75000)
    expect(rowText(m, 19).replace(/\s+/g, ' ').trim()).toBe('BONUS 750000')
  })

  it("throws a dead rock's own pebbles apart, whatever else is new that frame", () => {
    const m = playing()
    idleFrames(m, 30)
    for (let k = 0; k < 24; k++) put(m, 'fK', 0, k)
    // A pebble still new this frame (its time comes round to 0), in a slot above the rock's.
    const x = read(m, 'shipX')
    foeAt(m, 0, 6, x, 120 * 16)
    put(m, 'fHP', 1, 0)
    let k = 0
    for (; k < 60 && read(m, 'fK', 0) === 6; k++) {
      foeAt(m, 2, 7, x + 90 * 16, -40 * 16, 0xffff)
      put(m, 'fX', x, 0)
      guarded(m, 1)
    }
    expect(k).toBeLessThan(60)
    // The rock's two pebbles fly apart; the other is left as it was.
    const thrown = [0, 1, 3].filter((s) => read(m, 'fK', s) === 7 && read(m, 'fVX', s) !== 0)
    expect(thrown).toHaveLength(2)
    expect(read(m, 'fVX', 2)).toBe(0)
  })

  it('redraws the score whenever it changes, whatever the two words', () => {
    const m = playing()
    idleFrames(m, 4)
    put(m, 'score', 8, 0)
    put(m, 'score', 0, 1)
    frames(m, 1, cart)
    expect(rowText(m, 0, 10, 19)).toBe('000000080')
    // 10,000 tens: a key made of both words by xor and shift once took it for the same.
    put(m, 'score', 0, 0)
    put(m, 'score', 1, 1)
    frames(m, 1, cart)
    expect(rowText(m, 0, 10, 19)).toBe('000100000')
  })

  it("starts a new game at its difficulty's first rank, not where the last one ended", () => {
    const m = playing()
    put(m, 'rank', 15)
    put(m, 'lives', 0)
    put(m, 'shipState', 2)
    // GAME OVER (no best score), the title, START again.
    for (let k = 0; k < 200 && !rowText(m, 15).includes('GAME OVER'); k++) frames(m, 1, cart)
    expect(rowText(m, 15)).toContain('GAME OVER')
    frames(m, 400, cart)
    playing('normal', m)
    expect(read(m, 'rank')).toBe(0)
  })
})

describe('ELECLANCE difficulties', () => {
  it('chooses EASY, NORMAL or HARD on the title with left and right, and keeps the choice', () => {
    const m = startGame(cart)
    frames(m, 70, cart)
    // NORMAL first: in gold between arrows, the others plain.
    expect(rowText(m, 13, 9, 31)).toBe(' EASY  >NORMAL<  HARD ')
    expect([cellSlot(m, 10, 13), cellSlot(m, 17, 13), cellSlot(m, 26, 13)]).toEqual([5, 6, 5])
    choose(m, -1)
    expect(read(m, 'level')).toBe(0)
    expect(rowText(m, 13, 9, 31)).toBe('>EASY<  NORMAL   HARD ')
    expect([cellSlot(m, 10, 13), cellSlot(m, 17, 13)]).toEqual([6, 5])
    expect(rowText(m, 20)).toContain('BEST 5 EASY')
    // Left stops at EASY, right at HARD.
    choose(m, -1)
    expect(read(m, 'level')).toBe(0)
    choose(m, 3)
    expect(read(m, 'level')).toBe(2)
    expect(rowText(m, 13, 25, 31)).toBe('>HARD<')
    expect(rowText(m, 20)).toContain('BEST 5 HARD')
    m.pad(padBit('start'))
    frames(m, 2, cart)
    m.pad(0)
    frames(m, 2, cart)
    // HARD's row: three ships and bombs, from rank 3; named on the left panel.
    expect([read(m, 'lives'), read(m, 'bombs'), read(m, 'rank')]).toEqual([3, 3, 3])
    expect(rowText(m, 16, 0, 6).trim()).toBe('HARD')
    // Kept in save RAM, and chosen again when the machine is next switched on.
    const save = Uint8Array.from(m.state.cart?.save ?? [])
    expect(save[44]).toBe(2)
    const again = startWithSave(save)
    frames(again, 70, cart)
    expect(read(again, 'level')).toBe(2)
    expect(rowText(again, 13, 25, 31)).toBe('>HARD<')
  })

  it('gives EASY more ships and bombs, and bombs again after a ship is lost', () => {
    const m = playing('easy')
    expect([read(m, 'lives'), read(m, 'bombs')]).toEqual([4, 4])
    expect(rowText(m, 3, 35, 40).trim()).toBe('****')
    put(m, 'bombs', 0)
    put(m, 'shipState', 2)
    frames(m, 100, cart)
    expect([read(m, 'lives'), read(m, 'bombs')]).toEqual([3, 4])
  })

  it("keeps an old save's best five as NORMAL's, and gives EASY and HARD fresh ones", () => {
    // The first saves: "AR", then five of (score low, score high, three letters).
    const save = new Uint8Array(8192)
    const word = (at: number, v: number) => {
      save[at] = v & 255
      save[at + 1] = v >> 8
    }
    word(0, 0x5241)
    for (let k = 0; k < 5; k++) {
      word(2 + k * 8, k === 0 ? 1234 : (5 - k) * 100)
      word(4 + k * 8, k === 0 ? 5 : 0)
      word(6 + k * 8, 0x5958)
      word(8 + k * 8, 0x5a)
    }
    const m = startWithSave(save)
    frames(m, 70, cart)
    expect(read(m, 'level')).toBe(1)
    expect(rowText(m, 20)).toContain('BEST 5 NORMAL')
    expect(rowText(m, 22, 10, 27).replace(/\s+/g, ' ')).toBe('1 XYZ 000512340')
    expect([read(m, 'best', 0), read(m, 'best', 1)]).toEqual([1234, 5])
    choose(m, -1)
    expect(rowText(m, 22, 10, 27).replace(/\s+/g, ' ')).toBe('1 ELC 000050000')
    const kept = m.state.cart?.save ?? new Uint8Array()
    const at = (k: number) => (kept[k] ?? 0) | ((kept[k + 1] ?? 0) << 8)
    // NORMAL's five where they were, the mark of the new layout, EASY's and HARD's made.
    expect([at(2), at(4), at(42), at(44)]).toEqual([1234, 5, 0x564c, 1])
    expect([at(64), at(128)]).toEqual([5000, 5000])
  })

  it('fires fewer bullets the easier it is, NORMAL gentle at first and whole by the end', () => {
    // A minute of the stage from its start, the ship kept from harm, the lance out.
    const made: Record<string, number> = {}
    for (const level of LEVELS) {
      const m = playing(level)
      guarded(m, 3600)
      expect(m.state.halt).toBeNull()
      made[level] = read(m, 'bulletsMade')
    }
    // Measured: EASY 77, NORMAL 171, HARD 396 (the old game fired 527, its foes never leaving).
    const { easy = 0, normal = 0, hard = 0 } = made
    expect(easy).toBeLessThan(normal * 0.6)
    expect(normal).toBeLessThan(hard * 0.6)
    expect(hard).toBeGreaterThan(330)
    // Late in the game (rank 10), NORMAL fires every volley whole, as HARD does.
    const late: Record<string, number> = {}
    for (const level of ['normal', 'hard'] as const) {
      const m = playing(level)
      scrollTo(m, 256)
      put(m, 'rank', 10)
      const before = read(m, 'bulletsMade')
      guarded(m, 1200)
      late[level] = read(m, 'bulletsMade') - before
    }
    expect(late.normal ?? 0).toBeGreaterThan((late.hard ?? 0) * 0.75)
  }, 60_000)
})
