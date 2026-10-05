import { readFileSync } from 'node:fs'
import { CHANNELS } from '@shared/elec16/apu'
import { readCart } from '@shared/elec16/cartridge'
import { compileSongs, loopFrames, type Song } from '@shared/elec16/kit/mml'
import { Elec16 } from '@shared/elec16/machine'
import { padBit } from '@shared/elec16/pad'
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
  startGame,
} from './elec16-kit-helpers'

/**
 * ELECAIRCOMBAT, the cockpit dogfight (docs/elec16-elecaircombat.md): built from its folder as
 * gen:elec16 builds it, and flown on the core - the title, the briefing, the sortie's sky and
 * HUD, the stick, the gun, a locked missile, the ace's gun and missile, flares, the end of a
 * sortie, the continue, the game's end and a name kept in save RAM; each ace's arms and way of
 * fighting; and the frame's budget. Variables are found by name in what e16c wrote; where a
 * test needs a fixed geometry it pins the enemy in place.
 */

const DIR = 'resources/elec16/games/elecaircombat'
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
const signed = (v: number) => (v << 16) >> 16
const read = (m: Elec16, name: string, k = 0) => signed(ramWord(m, addr(name) + k * 2))
const put = (m: Elec16, name: string, v: number, k = 0) => ramPoke(m, addr(name) + k * 2, v)

/** A constant of the generated assets.e16.ts. */
const constant = (name: string) =>
  Number.parseInt(new RegExp(`${name} = 0x([0-9a-f]+)`).exec(built.report.assets)?.[1] ?? 'x', 16)

/** The vectors' places in `vec` (math.e16.ts). */
const V = { PF: 0, PR: 3, PU: 6, EF: 9, ER: 12, EU: 15, REL: 18 }
const vecOf = (m: Elec16, k: number) => [0, 1, 2].map((j) => read(m, 'vec', k + j))
const vecPut = (m: Elec16, k: number, x: number, y: number, z: number) => {
  put(m, 'vec', x, k)
  put(m, 'vec', y, k + 1)
  put(m, 'vec', z, k + 2)
}

/** A button held for `n` frames, then let go for two. */
function hold(m: Elec16, bit: number, n = 3): void {
  m.pad(bit)
  frames(m, n, cart)
  m.pad(0)
  frames(m, 2, cart)
}

/** From the title through the controls and the briefing: the first sortie begins. */
function flying(): Elec16 {
  const m = startGame(cart)
  frames(m, 60, cart)
  hold(m, padBit('start'))
  frames(m, 20, cart)
  hold(m, padBit('a'))
  frames(m, 40, cart)
  hold(m, padBit('a'))
  frames(m, 4, cart)
  return m
}

/** The words BG1 shows from cell (x, y), `n` of them: its font's tiles read back as characters. */
function textAt(m: Elec16, x: number, y: number, n: number): string {
  const font = constant('FONT_TILE')
  let out = ''
  for (let k = 0; k < n; k++) {
    const t = (bg1(m, x + k, y) & 0x3ff) - font
    out += t >= 0 && t < 64 ? String.fromCharCode(t + 32) : ' '
  }
  return out
}

/** Each sortie's first frames, ace by ace: the campaign flown through once (each ace downed). */
let aceSnaps: Uint8Array[] | null = null

/** Ace `a` downed at once, through the results and the next briefing to the next sortie. */
function nextSortie(m: Elec16, a: number): void {
  put(m, 'eAlive', 0)
  frames(m, 215, cart)
  for (let j = 0; j < 40; j++) {
    if (read(m, 'sortie') === a + 1 && read(m, 'outcome') === 0 && read(m, 'flown') > 0) return
    hold(m, padBit('a'))
    frames(m, 20, cart)
  }
}

function atAce(k: number): Elec16 {
  if (aceSnaps === null) {
    const snaps: Uint8Array[] = []
    const m = flying()
    for (let a = 0; a < 5; a++) {
      snaps.push(m.snapshot())
      if (a < 4) nextSortie(m, a)
    }
    aceSnaps = snaps
  }
  const snap = aceSnaps[k]
  if (snap === undefined) throw new Error(`no ace ${k}`)
  const c = Elec16.restore(ROM.image, snap)
  if (c === null || !c.attachCartRom(cart, new Uint8Array(32))) throw new Error('no restore')
  return c
}

/**
 * The enemy `ahead` units in front of the player, coming the other way (nose to nose): its
 * thinking held, so it holds its aim on the player.
 */
function headOn(m: Elec16, ahead: number): void {
  vecPut(m, V.PF, 0, 16384, 0)
  vecPut(m, V.PR, 16384, 0, 0)
  vecPut(m, V.PU, 0, 0, 16384)
  vecPut(m, V.EF, 0, -16384, 0)
  vecPut(m, V.ER, -16384, 0, 0)
  vecPut(m, V.EU, 0, 0, 16384)
  vecPut(m, V.REL, 0, ahead, 0)
  put(m, 'pAlt', 5200)
  put(m, 'aiThinkT', 200)
}

/** An enemy missile off its rail at the player, nose to nose at `ahead`: answers its slot (4). */
function enemyLaunch(m: Elec16, ahead = 2500): number {
  put(m, 'aiMissiles', 20)
  for (let k = 0; k < 4 && read(m, 'mOwner', 4) === 0; k++) {
    headOn(m, ahead)
    put(m, 'aiMslCool', 0)
    put(m, 'aiLockT', 400)
    frames(m, 1, cart)
  }
  expect(read(m, 'mOwner', 4)).toBe(2)
  return 4
}

/** The player `behind` units behind the enemy, both level and heading north: on its tail. */
function onTail(m: Elec16, behind: number): void {
  pin(m, behind)
}

/** The player level, heading north; the enemy `ahead` units in front, flying the same way. */
function pin(m: Elec16, ahead: number, height = 5200): void {
  vecPut(m, V.PF, 0, 16384, 0)
  vecPut(m, V.PR, 16384, 0, 0)
  vecPut(m, V.PU, 0, 0, 16384)
  vecPut(m, V.EF, 0, 16384, 0)
  vecPut(m, V.ER, 16384, 0, 0)
  vecPut(m, V.EU, 0, 0, 16384)
  vecPut(m, V.REL, 0, ahead, 0)
  put(m, 'pAlt', height)
}

/** Frames with the enemy held at `ahead` and the AI thinking nothing new; answers the busiest. */
function pinned(m: Elec16, n: number, ahead: number, pad = 0): number {
  let worst = 0
  for (let k = 0; k < n; k++) {
    pin(m, ahead)
    put(m, 'aiThinkT', 200)
    m.pad(pad)
    const c0 = m.state.cycles
    frames(m, 1, cart)
    worst = Math.max(worst, m.state.cycles - c0)
  }
  m.pad(0)
  return worst
}

/**
 * A simple pilot for the frame tests: rolls the enemy over the canopy and pulls, fires the gun
 * when it is close in the sights, a missile whenever the seeker holds a lock, and flares now
 * and then.
 */
function pilot(m: Elec16, t: number): number {
  const bx = read(m, 'eBX')
  const by = read(m, 'eBY')
  const bz = read(m, 'eBZ')
  let pad = stick(bx, by, bz)
  if (bz > 0 && bz < 2600 && Math.abs(bx) < bz / 6 && Math.abs(by) < bz / 6) pad |= padBit('a')
  if (read(m, 'locked') === 1 && (t & 31) === 0) pad |= padBit('b')
  if ((t & 63) === 5) pad |= padBit('x')
  return pad
}

/** The pilot's stick: nearly ahead, the nose nudged; else rolled toward it and pulled. */
function stick(bx: number, by: number, bz: number): number {
  if (bz > 0 && Math.abs(bx) < bz / 10 && Math.abs(by) < bz / 10) {
    return by > 10 ? padBit('down') : 0
  }
  const ang = Math.atan2(bx, by)
  let pad = Math.abs(ang) < 1.4 ? padBit('down') : 0
  if (ang > 0.25) pad |= padBit('right')
  else if (ang < -0.25) pad |= padBit('left')
  return pad
}

/** A video memory word. */
const vword = (m: Elec16, a: number) => {
  const mem = m.state.video?.mem ?? new Uint8Array()
  return (mem[a] ?? 0) | ((mem[a + 1] ?? 0) << 8)
}
/** BG0's cell (x, y), BG1's. */
const bg0 = (m: Elec16, x: number, y: number) => vword(m, 0x8000 + y * 128 + x * 2)
const bg1 = (m: Elec16, x: number, y: number) => vword(m, 0xa000 + y * 128 + x * 2)
/** Sprites shown (size word 0-2). */
const spritesShown = (m: Elec16) => {
  let n = 0
  for (let k = 0; k < 128; k++) if (vword(m, 0xc000 + k * 8 + 6) < 3) n++
  return n
}

describe('ELECAIRCOMBAT as built', () => {
  it('is what games.json holds, and its folder keeps the constants and the assembly', () => {
    const file = JSON.parse(readFileSync('resources/elec16/games/games.json', 'utf8'))
    const images = file.games.map((g: { data: string }) => fromBase64(g.data) ?? new Uint8Array())
    expect(images.find((i: Uint8Array) => readCart(i)?.id === 'ELECAIRCOMBAT')).toEqual(cart)
    expect(readCart(cart)).toMatchObject({
      id: 'ELECAIRCOMBAT',
      name: 'ELECAIRCOMBAT',
      saveBanks: 1,
    })
    expect(readFileSync(`${DIR}/assets.e16.ts`, 'utf8')).toBe(built.report.assets)
    expect(readFileSync(`${DIR}/compiled.s`, 'utf8')).toBe(built.report.asm)
  })

  it('keeps RAM code with room to spare and its tiles within the 1,024', () => {
    expect(built.report.ramCode).toBeLessThanOrEqual(18 * 1024)
    expect(built.report.tiles).toBeLessThanOrEqual(1024)
  })

  it('makes each Q14 product one MULQ, never the five instructions it once took', () => {
    const lines = built.report.asm.split('\n').map((l) => l.trim().split(' ')[0])
    const five = ['mul', 'mulh', 'srli', 'slli', 'or']
    const left = lines.filter((_, k) => five.every((op, j) => lines[k + j] === op))
    expect(left).toEqual([])
    expect(lines.filter((op) => op === 'mulq').length).toBeGreaterThan(60)
  })

  it("streams the fighter's frames through one place in video memory, each size from a bank's start", () => {
    const slot = constant('BANDIT64_TILE')
    for (const size of [64, 48, 32, 24, 16, 12, 8]) {
      expect(constant(`BANDIT${size}_TILE`), `${size}`).toBe(slot)
    }
    // Sheets larger than a bank start at one (the game finds a frame from the bank's start).
    for (const size of [64, 48, 32, 24, 16, 12]) expect(constant(`BANDIT${size}_AT`)).toBe(0xc000)
    // The room is the largest frame: four 32-point quarters.
    expect(constant('BANDIT64_BYTES')).toBe(64 * 32)
    // The title's word shares the cockpit's tiles (they are never shown together).
    expect(constant('LOGO_TILE')).toBe(constant('COCKPIT_TILE'))
  })

  it('has songs whose channels keep in step, the music on 0-11 and the effects on 12-15', () => {
    const songs: Song[] = [
      ...compileSongs(readFileSync(`${DIR}/music/songs.mml`, 'utf8')),
      ...compileSongs(readFileSync(`${DIR}/music/sfx.mml`, 'utf8')),
    ]
    for (const name of ['title', 'brief', 'fight', 'final', 'win', 'over', 'ending']) {
      expect(
        songs.some((s) => s.name === name),
        name,
      ).toBe(true)
    }
    for (const song of songs) {
      const effect = song.name.startsWith('x_')
      for (const ch of song.channels) {
        expect(ch.channel < 12, `${song.name} C${ch.channel}`).toBe(!effect)
        expect(ch.channel).toBeLessThan(CHANNELS)
      }
      const bodies = new Set(loopFrames(song).values())
      expect([...bodies], song.name).toHaveLength(bodies.size > 0 ? 1 : 0)
    }
  })
})

// Whole sorties run on the core: given time, as the suite runs everything at once.
describe('ELECAIRCOMBAT flown', { timeout: 60_000 }, () => {
  it('shows the title, the controls, the briefing, then the cockpit over the sky and the sea', () => {
    const m = startGame(cart)
    frames(m, 60, cart)
    expect(m.state.halt).toBeNull()
    // The title's word on BG1 (front cells of its tiles), the sky on BG0.
    const logo = constant('LOGO_TILE')
    const cells = Array.from({ length: 40 }, (_, x) => bg1(m, x, 6) & 0x3ff)
    expect(cells.some((t) => t > logo)).toBe(true)
    hold(m, padBit('start'))
    frames(m, 30, cart)
    expect(textAt(m, 16, 2, 8)).toBe('CONTROLS')
    hold(m, padBit('a'))
    frames(m, 30, cart)
    // The briefing: the fighter turning on its stand (sprites), the ace's name and arms in words.
    expect(textAt(m, 2, 2, 6)).toBe('SORTIE')
    expect(textAt(m, 14, 4, 6)).toBe('GANNET')
    expect(textAt(m, 2, 6, 29)).toBe('ARMS     8 MISSILES  4 FLARES')
    expect(spritesShown(m)).toBeGreaterThan(3)
    hold(m, padBit('a'))
    frames(m, 10, cart)
    // The cockpit: the panel on BG1 in front; the horizon's tiles across BG0 near the middle.
    expect(bg1(m, 20, 34) & 0x8000).toBe(0x8000)
    const horizon = constant('HORIZON_TILE')
    const rows = Array.from({ length: 26 }, (_, y) => bg0(m, 20, y + 1) & 0x3ff)
    const skyTiles = meta.sheets.find((x: { name: string }) => x.name === 'horizon').count
    expect(rows.every((t) => t >= horizon && t < horizon + skyTiles)).toBe(true)
    expect(new Set(rows).size).toBeGreaterThan(4)
    expect(read(m, 'outcome')).toBe(0)
  })

  it('rolls and pulls with the stick, and the horizon turns with it', () => {
    const m = flying()
    pinned(m, 2, 3000)
    const level = bg0(m, 2, 14)
    // Right: the right wing goes down (its up part negative), the horizon tilts.
    for (let k = 0; k < 20; k++) {
      put(m, 'pAlt', 5200)
      m.pad(padBit('right'))
      frames(m, 1, cart)
    }
    m.pad(0)
    expect(vecOf(m, V.PR)[2]).toBeLessThan(-3000)
    frames(m, 2, cart)
    expect(bg0(m, 2, 14)).not.toBe(level)
    // Down pulls the nose up (the stick as a stick), up pushes it down.
    pinned(m, 20, 3000)
    for (let k = 0; k < 15; k++) {
      m.pad(padBit('down'))
      frames(m, 1, cart)
    }
    expect(vecOf(m, V.PF)[2]).toBeGreaterThan(1000)
    pinned(m, 20, 3000)
    for (let k = 0; k < 20; k++) {
      m.pad(padBit('up'))
      frames(m, 1, cart)
    }
    expect(vecOf(m, V.PF)[2]).toBeLessThan(-500)
    m.pad(0)
  })

  it('hits the ace with the gun, scores, and brings it down', () => {
    const m = flying()
    const hp = read(m, 'eHP')
    pinned(m, 60, 700, padBit('a'))
    expect(read(m, 'eHP')).toBeLessThan(hp)
    expect(read(m, 'roundsHit')).toBeGreaterThan(0)
    expect(read(m, 'score')).toBeGreaterThan(0)
    put(m, 'eHP', 2)
    pinned(m, 30, 700, padBit('a'))
    expect(read(m, 'eAlive')).toBe(0)
    expect(read(m, 'outcome')).toBe(1)
    // The sortie ends, the results follow; then the next ace's briefing.
    frames(m, 260, cart)
    expect(m.state.halt).toBeNull()
  })

  it('locks the seeker on after a moment, and a missile strikes home', () => {
    const m = flying()
    put(m, 'aiDodge', 0)
    pinned(m, 10, 2400)
    expect(read(m, 'locked')).toBe(0)
    pinned(m, 50, 2400)
    expect(read(m, 'locked')).toBe(1)
    const hp = read(m, 'eHP')
    const left = read(m, 'missilesLeft')
    hold(m, padBit('b'))
    expect(read(m, 'missilesLeft')).toBe(left - 1)
    let k = 0
    while (k < 200 && read(m, 'eHP') > hp - 25) {
      pinned(m, 1, 2400)
      k++
    }
    expect(read(m, 'eHP')).toBeLessThanOrEqual(hp - 30)
  })

  it("lets the ace's gun hit the player from behind", () => {
    const m = flying()
    let damage = 0
    for (let k = 0; k < 240 && damage === 0; k++) {
      pin(m, -500)
      // The enemy behind, pointing at the player.
      put(m, 'aiThinkT', 200)
      frames(m, 1, cart)
      damage = read(m, 'damage')
    }
    expect(damage).toBeGreaterThan(0)
  })

  it("warns of the ace's missile, and flares draw it off", () => {
    const m = flying()
    put(m, 'aiMslCool', 0)
    put(m, 'aiLockT', 400)
    let warned = 0
    for (let k = 0; k < 30 && warned === 0; k++) {
      pin(m, -2600)
      put(m, 'aiThinkT', 200)
      frames(m, 1, cart)
      warned = read(m, 'warned')
    }
    expect(warned).toBe(1)
    // A pair fools it three times in four: dropped again after the flares' cooling if not.
    let pairs = 0
    while (pairs < 3 && read(m, 'mChase', 4) === 0) {
      hold(m, padBit('x'), 1)
      pairs++
      for (let k = 0; k < 19 && read(m, 'mChase', 4) === 0; k++) {
        pin(m, -2600)
        frames(m, 1, cart)
      }
    }
    expect(read(m, 'mChase', 4)).toBe(1)
    expect(read(m, 'flaresLeft')).toBe(48 - pairs)
    // Chasing a flare, the missile no longer warns.
    let k = 0
    while (k < 120 && read(m, 'warned') === 1) {
      pin(m, -2600)
      frames(m, 1, cart)
      k++
    }
    expect(read(m, 'damage')).toBeLessThan(34)
  })

  it('takes a crash into the sea as a lost sortie, and offers a continue', () => {
    const m = flying()
    put(m, 'pAlt', 0)
    frames(m, 3, cart)
    expect(read(m, 'outcome')).toBe(3)
    frames(m, 240, cart)
    // CONTINUE? : START flies the same sortie again.
    hold(m, padBit('start'))
    frames(m, 60, cart)
    hold(m, padBit('a'))
    frames(m, 10, cart)
    expect([read(m, 'outcome'), read(m, 'sortie')]).toEqual([0, 0])
  })

  it("ends the game, takes a best score's name and keeps it in save RAM", () => {
    const m = flying()
    put(m, 'score', 0, 0)
    put(m, 'score', 99, 1)
    put(m, 'damage', 100)
    frames(m, 240, cart)
    // No continue: ten seconds pass. GAME OVER, then the name.
    frames(m, 620, cart)
    frames(m, 170, cart)
    hold(m, padBit('up'))
    for (let k = 0; k < 3; k++) hold(m, padBit('a'))
    frames(m, 10, cart)
    const save = m.state.cart?.save ?? new Uint8Array()
    // "AC", then the first entry: the score (low, high) and the letters B A A.
    expect([save[0], save[1]]).toEqual([0x41, 0x43])
    const word = (k: number) => (save[k] ?? 0) | ((save[k + 1] ?? 0) << 8)
    expect([word(2), word(4)]).toEqual([0, 99])
    expect([save[6], save[7], save[8]]).toEqual([0x42, 0x41, 0x41])
  })

  it('keeps a sortie well within its frames', () => {
    const m = flying()
    let sum = 0
    let worst = 0
    const pads = [padBit('right') | padBit('a'), padBit('down'), padBit('left') | padBit('down'), 0]
    for (let k = 0; k < 480; k++) {
      put(m, 'damage', 0)
      put(m, 'pAlt', 5200)
      m.pad(pads[(k >> 6) & 3] ?? 0)
      const c0 = m.state.cycles
      frames(m, 1, cart)
      const d = m.state.cycles - c0
      sum += d
      if (k > 4) worst = Math.max(worst, d)
    }
    expect(m.state.halt).toBeNull()
    // 4 MHz at 60 frames: 66,667 cycles a frame.
    expect(sum / 480).toBeLessThan(45_000)
    expect(worst).toBeLessThan(60_000)
    // The art's redraw (sky, fighter, effects, the damage by part) cost no cycles: before it
    // this flight measured 26,599 on average and 38,922 at worst (2026-10-05). The sea's
    // motion pays its way too: 26,594 and 38,816 with it (frames that skip a call it saved).
    expect(sum / 480).toBeLessThanOrEqual(26_599)
    expect(worst).toBeLessThanOrEqual(38_922)
  })

  it('keeps the hardest fight within its frames: NOCTURNE and the player firing missiles all the while', () => {
    const m = atAce(4)
    let sum = 0
    let worst = 0
    const n = 900
    for (let t = 0; t < n; t++) {
      // Neither side runs dry or falls; the ace fires each time it holds a lock.
      put(m, 'damage', 0)
      if (read(m, 'pAlt') < 2500) put(m, 'pAlt', 2500)
      put(m, 'eHP', 100)
      put(m, 'clock', 9000)
      put(m, 'aiMslCool', 0)
      put(m, 'aiMissiles', 20)
      if (at.has('aiFlares')) put(m, 'aiFlares', 10)
      put(m, 'missilesLeft', 50)
      put(m, 'flaresLeft', 40)
      m.pad(pilot(m, t))
      const c0 = m.state.cycles
      frames(m, 1, cart)
      const d = m.state.cycles - c0
      sum += d
      if (t > 4) worst = Math.max(worst, d)
    }
    m.pad(0)
    expect(m.state.halt).toBeNull()
    expect(read(m, 'outcome')).toBe(0)
    expect(sum / n).toBeLessThan(45_000)
    expect(worst).toBeLessThan(60_000)
    // Nor here: 30,380 on average and 52,528 at worst before the redraw, 52,484 at worst
    // after it (2026-10-05). The sea's motion never copies in a frame past 44,000 cycles, and
    // its check is paid for: 30,359 and 52,421 with it.
    expect(sum / n).toBeLessThanOrEqual(30_380)
    expect(worst).toBeLessThanOrEqual(52_484)
  })
})

// The controls screen and each ace (docs/elec16-elecaircombat.md sections 2 and 7), on the core.
describe('ELECAIRCOMBAT controls and aces', { timeout: 120_000 }, () => {
  it("lays the pad's buttons beside the PC's keys after the title, and A or START goes on", () => {
    const m = startGame(cart)
    frames(m, 60, cart)
    hold(m, padBit('start'))
    frames(m, 20, cart)
    expect(textAt(m, 16, 2, 8)).toBe('CONTROLS')
    const line = (y: number) => [textAt(m, 2, y, 11), textAt(m, 13, y, 11), textAt(m, 25, y, 13)]
    expect(line(8)).toEqual(['D-PAD < >  ', 'ARROW < >  ', 'ROLL, TURN   '])
    expect(line(9)).toEqual(['D-PAD DOWN ', 'ARROW DOWN ', 'PULL UP      '])
    expect(line(10)).toEqual(['D-PAD UP   ', 'ARROW UP   ', 'PUSH DOWN    '])
    expect(line(13)).toEqual(['A          ', 'Z          ', 'GUN (HOLD)   '])
    expect(line(14)).toEqual(['B          ', 'X          ', 'MISSILE      '])
    expect(line(15)).toEqual(['X          ', 'S          ', 'FLARES       '])
    expect(line(17)).toEqual(['R          ', 'W          ', 'AFTERBURNER  '])
    expect(line(18)).toEqual(['L          ', 'Q          ', 'AIR BRAKE    '])
    expect(line(20)).toEqual(['START      ', 'ENTER      ', 'PAUSE        '])
    expect(line(21)).toEqual(['SELECT     ', 'RIGHT SHIFT', 'STICK REVERSE'])
    // The stick reversed (SELECT, here as on the title): up pulls, and the lines say so.
    hold(m, padBit('select'))
    expect(line(9)).toEqual(['D-PAD UP   ', 'ARROW UP   ', 'PULL UP      '])
    expect(line(10)).toEqual(['D-PAD DOWN ', 'ARROW DOWN ', 'PUSH DOWN    '])
    expect(read(m, 'stickReversed')).toBe(1)
    hold(m, padBit('select'))
    expect(read(m, 'stickReversed')).toBe(0)
    // It waits for a press, then the briefing.
    frames(m, 300, cart)
    expect(textAt(m, 16, 2, 8)).toBe('CONTROLS')
    hold(m, padBit('a'))
    frames(m, 10, cart)
    expect(textAt(m, 2, 2, 6)).toBe('SORTIE')
    // START skips it as well.
    const n = startGame(cart)
    frames(n, 60, cart)
    hold(n, padBit('start'))
    frames(n, 20, cart)
    hold(n, padBit('start'))
    frames(n, 10, cart)
    expect(textAt(n, 2, 2, 6)).toBe('SORTIE')
  })

  it('arms each side as set: the player 64 missiles and 48 flares, each ace its own', () => {
    const missiles = [8, 12, 16, 20, 24]
    const flares = [4, 8, 10, 12, 14]
    for (let k = 0; k < 5; k++) {
      const m = atAce(k)
      expect([read(m, 'sortie'), read(m, 'ace')]).toEqual([k, k])
      expect([read(m, 'missilesLeft'), read(m, 'flaresLeft')]).toEqual([64, 48])
      expect([read(m, 'aiMissiles'), read(m, 'aiFlares')], `ace ${k}`).toEqual([
        missiles[k],
        flares[k],
      ])
      // The panel shows the player's two counts whole.
      expect([textAt(m, 28, 34, 3), textAt(m, 33, 34, 3)]).toEqual(['M64', 'F48'])
    }
  })

  it("fools three in four of every ace's missiles with the player's flares", () => {
    let all = 0
    const trials = 20
    for (let k = 0; k < 5; k++) {
      const m = atAce(k)
      let fooled = 0
      for (let t = 0; t < trials; t++) {
        const slot = enemyLaunch(m)
        expect(read(m, 'mChase', slot)).toBe(0)
        hold(m, padBit('x'), 1)
        if (read(m, 'mChase', slot) === 1) fooled++
        // The next trial: this missile gone, the flares' cooling over.
        put(m, 'mOwner', 0, slot)
        put(m, 'damage', 0)
        frames(m, 20, cart)
      }
      expect(fooled, `ace ${k}`).toBeGreaterThanOrEqual(11)
      expect(fooled, `ace ${k}`).toBeLessThan(trials)
      all += fooled
    }
    expect(all / (5 * trials)).toBeGreaterThan(0.65)
    expect(all / (5 * trials)).toBeLessThan(0.85)
  })

  it("flies ORACLE's and NOCTURNE's missiles a tenth faster than the others'", () => {
    const tops: number[] = []
    for (let k = 0; k < 5; k++) {
      const m = atAce(k)
      const slot = enemyLaunch(m)
      const tenths = k >= 3 ? 11 : 10
      // Off the rail at the fighter's speed and a bit, gaining, and at the top: all of it.
      const off = Math.floor(((read(m, 'eSpeed') + 64) * tenths) / 10)
      expect(Math.abs(read(m, 'mSpeed', slot) - read(m, 'mGain', slot) - off)).toBeLessThan(8)
      expect([read(m, 'mTop', slot), read(m, 'mGain', slot)]).toEqual([80 * tenths, 2 * tenths])
      frames(m, 40, cart)
      tops.push(read(m, 'mSpeed', slot))
    }
    expect(tops).toEqual([800, 800, 800, 880, 880])
  })

  it('runs out of flares: an ace drops a pair only while it has one', () => {
    const m = atAce(0)
    put(m, 'aiFlares', 2)
    put(m, 'aiDodge', 0)
    // Locked on from behind, missile after missile on its way: GANNET (who once had none)
    // drops a pair against each while it has one, then none.
    pinned(m, 60, 1500)
    expect(read(m, 'locked')).toBe(1)
    const left: number[] = []
    let lit = 0
    for (let k = 0; k < 240; k++) {
      pin(m, 1500)
      put(m, 'aiThinkT', 200)
      put(m, 'aiFlareCool', 0)
      put(m, 'eHP', 90)
      const fNext = read(m, 'fNext')
      m.pad(k % 30 < 2 ? padBit('b') : 0)
      frames(m, 1, cart)
      if (read(m, 'fNext') !== fNext) lit++
      left.push(read(m, 'aiFlares'))
    }
    m.pad(0)
    expect(read(m, 'missilesLeft')).toBeLessThan(60)
    expect(left).toContain(1)
    expect(left.at(-1)).toBe(0)
    expect(lit).toBe(2)
  })

  it('lets ORACLE lock from further than any other ace', () => {
    const fired: boolean[] = []
    for (let k = 0; k < 5; k++) {
      const m = atAce(k)
      const before = read(m, 'aiMissiles')
      for (let t = 0; t < 160; t++) {
        headOn(m, 7000)
        put(m, 'aiMslCool', 0)
        frames(m, 1, cart)
      }
      fired.push(read(m, 'aiMissiles') < before)
    }
    expect(fired).toEqual([false, false, false, true, false])
    // Within every ace's reach, every ace fires.
    for (let k = 0; k < 5; k++) {
      const m = atAce(k)
      const before = read(m, 'aiMissiles')
      for (let t = 0; t < 160; t++) {
        headOn(m, 4600)
        put(m, 'aiMslCool', 0)
        frames(m, 1, cart)
      }
      expect(read(m, 'aiMissiles'), `ace ${k}`).toBeLessThan(before)
    }
  })
  it('sends MISTRAL straight up when pressed from behind, where GANNET turns', () => {
    const climb = (k: number) => {
      const m = atAce(k)
      onTail(m, 800)
      put(m, 'aiThinkT', 0)
      put(m, 'aiStateT', 0)
      let most = -16384
      for (let t = 0; t < 120; t++) {
        // The player stays on its tail, 800 behind: only the enemy's own flying is free.
        const ef = vecOf(m, V.EF)
        vecPut(m, V.PF, ...(ef as [number, number, number]))
        vecPut(
          m,
          V.REL,
          ...(ef.map((c) => Math.round((c * 800) / 16384)) as [number, number, number]),
        )
        put(m, 'pAlt', 5200)
        frames(m, 1, cart)
        most = Math.max(most, vecOf(m, V.EF)[2] ?? 0)
      }
      return most
    }
    const mistral = climb(1)
    const gannet = climb(0)
    // Nearly upright (sin 60 degrees is 14,189): a zoom climb; GANNET's break stays far flatter.
    expect(mistral).toBeGreaterThan(14000)
    expect(gannet).toBeLessThan(9000)
  })

  it('has MISTRAL turn over the top of its climb and dive back down', () => {
    const m = atAce(1)
    put(m, 'aiState', 2)
    put(m, 'aiStateT', 90)
    put(m, 'aiThinkT', 200)
    const states = new Set<number>()
    let lowest = 16384
    let highest = -16384
    for (let t = 0; t < 200; t++) {
      put(m, 'pAlt', 5200)
      put(m, 'aiThinkT', 200)
      frames(m, 1, cart)
      states.add(read(m, 'aiState'))
      const z = vecOf(m, V.EF)[2] ?? 0
      highest = Math.max(highest, z)
      if (highest > 14000) lowest = Math.min(lowest, z)
    }
    // ZOOM (2), then HAMMER (5): up past 60 degrees, then nose down.
    expect(states.has(5)).toBe(true)
    expect(highest).toBeGreaterThan(14000)
    expect(lowest).toBeLessThan(0)
  })

  it('slows CINDER and has it scissor with the player behind it; GANNET neither', () => {
    const fight = (k: number) => {
      const m = atAce(k)
      const cruise = read(m, 'eCruise')
      let flips = 0
      let side = read(m, 'aiSide')
      let slowest = 9999
      for (let t = 0; t < 240; t++) {
        onTail(m, 900)
        frames(m, 1, cart)
        slowest = Math.min(slowest, read(m, 'eSpeed'))
        if (read(m, 'aiSide') !== side) flips++
        side = read(m, 'aiSide')
      }
      return { drop: cruise - slowest, flips }
    }
    const cinder = fight(2)
    const gannet = fight(0)
    expect(cinder.drop).toBeGreaterThan(120)
    expect(cinder.flips).toBeGreaterThanOrEqual(3)
    expect(gannet.drop).toBeLessThan(30)
    expect(gannet.flips).toBe(0)
  })

  it('sends ORACLE out to come back nose on, and has it open fire from further head on', () => {
    // After a pass it runs out further than the others before it turns.
    const run = (k: number) => {
      const m = atAce(k)
      put(m, 'aiState', 3)
      put(m, 'aiStateT', 170)
      put(m, 'aiThinkT', 200)
      let far = 0
      for (let t = 0; t < 170; t++) {
        put(m, 'pAlt', 5200)
        put(m, 'aiThinkT', 200)
        frames(m, 1, cart)
        const r = vecOf(m, V.REL).map(Math.abs)
        far = Math.max(far, Math.max(...r))
      }
      return far
    }
    expect(run(3)).toBeGreaterThan(3500)
    // Nose to nose at 2,200: ORACLE fires, GANNET (1,700) holds its fire.
    const guns = (k: number) => {
      const m = atAce(k)
      let hits = 0
      for (let t = 0; t < 60; t++) {
        headOn(m, 2200)
        put(m, 'aiMslCool', 999)
        frames(m, 1, cart)
        if (read(m, 'eMuzzle') > 0) hits++
      }
      return hits
    }
    expect(guns(3)).toBeGreaterThan(5)
    expect(guns(0)).toBe(0)
  })

  it('has NOCTURNE feint its break, and roll in behind the player the moment it overshoots', () => {
    // The feint: the side of its break turns once, without a new thought.
    let flipped = -1
    for (let tries = 0; tries < 6 && flipped < 0; tries++) {
      const m = atAce(4)
      // A frame for the enemy to see where the player is, then its thought.
      onTail(m, 800)
      frames(m, tries + 1, cart)
      onTail(m, 800)
      put(m, 'aiThinkT', 0)
      put(m, 'aiStateT', 0)
      frames(m, 1, cart)
      if (read(m, 'aiState') !== 1) continue
      const side = read(m, 'aiSide')
      for (let t = 0; t < 30; t++) {
        onTail(m, 800)
        put(m, 'aiThinkT', 200)
        frames(m, 1, cart)
        if (read(m, 'aiSide') !== side) {
          flipped = t
          break
        }
      }
    }
    expect(flipped).toBeGreaterThan(10)
    expect(flipped).toBeLessThan(24)
    // The overshoot: the player shot past to 500 ahead of it while it breaks.
    const overshot = (k: number) => {
      const m = atAce(k)
      put(m, 'aiState', 1)
      put(m, 'aiStateT', 100)
      pin(m, -500)
      put(m, 'aiThinkT', 200)
      frames(m, 2, cart)
      return read(m, 'aiState')
    }
    expect(overshot(4)).toBe(0)
    expect(overshot(0)).toBe(1)
    expect(overshot(3)).toBe(1)
  })
})

/** Missiles from 1,500 behind the enemy until one is fooled by its flares: answers its slot. */
function firstFooled(m: Elec16): number {
  const chasing = () =>
    [0, 1, 2, 3].find((s) => read(m, 'mOwner', s) === 1 && read(m, 'mChase', s) === 1)
  for (let k = 0; k < 400; k++) {
    pin(m, 1500)
    put(m, 'aiThinkT', 200)
    put(m, 'eHP', 200)
    // (Before the flares were counted, there was no count to keep up.)
    if (at.has('aiFlares')) put(m, 'aiFlares', 10)
    m.pad(k % 30 < 2 ? padBit('b') : 0)
    frames(m, 1, cart)
    const s = chasing()
    if (s !== undefined) return s
  }
  return -1
}

// Bugs found while rebalancing the arms: each failed before its fix.
describe('ELECAIRCOMBAT arms, as fixed', { timeout: 60_000 }, () => {
  const owned = (m: Elec16, owner: number) =>
    Array.from({ length: 6 }, (_, k) => read(m, 'mOwner', k)).filter((o) => o === owner).length

  it('spends a missile only when one leaves the rail, and keeps the enemy two rails of its own', () => {
    const m = flying()
    // Fired blind into the empty sky, a missile every 25 frames: more than there are rails.
    for (let press = 0; press < 7; press++) {
      const before = owned(m, 1)
      const left = read(m, 'missilesLeft')
      const was = Array.from({ length: 6 }, (_, k) => read(m, 'mOwner', k))
      pin(m, 9000)
      m.pad(padBit('b'))
      frames(m, 1, cart)
      m.pad(0)
      const gone = was.filter((o, k) => o === 1 && read(m, 'mOwner', k) !== 1).length
      // Each one spent is one more in flight (allowing for one that ended the same frame).
      expect(left - read(m, 'missilesLeft')).toBeLessThanOrEqual(owned(m, 1) - before + gone)
      for (let k = 0; k < 24; k++) {
        pin(m, 9000)
        frames(m, 1, cart)
      }
    }
    // The player's crowd never takes the enemy's rail: its missile still goes, and costs one.
    const theirs = read(m, 'aiMissiles')
    put(m, 'aiMissiles', theirs)
    for (let k = 0; k < 4 && owned(m, 2) === 0; k++) {
      headOn(m, 2500)
      put(m, 'aiMslCool', 0)
      put(m, 'aiLockT', 400)
      frames(m, 1, cart)
    }
    expect(owned(m, 2)).toBe(1)
    expect(read(m, 'aiMissiles')).toBe(theirs - 1)
  })

  it("sends a missile the enemy's flares fool after a flare that burns, and blind once it is out", () => {
    // NOCTURNE's flares fool most often; missiles from close behind until one is fooled.
    const m = atAce(4)
    put(m, 'aiDodge', 0)
    pinned(m, 60, 1500)
    const fooled = firstFooled(m)
    m.pad(0)
    expect(fooled).toBeGreaterThanOrEqual(0)
    const flare = read(m, 'mFlare', fooled)
    expect(read(m, 'fLife', flare)).toBeGreaterThan(0)
    // The flare burns out (80 frames): within a turn the missile chases it no more.
    let k = 0
    while (k < 90 && read(m, 'fLife', flare) > 0) {
      pin(m, 1500)
      put(m, 'aiThinkT', 200)
      frames(m, 1, cart)
      k++
    }
    frames(m, 2, cart)
    expect(read(m, 'mOwner', fooled) !== 1 || read(m, 'mChase', fooled) === 2).toBe(true)
  })

  it("keeps the target's strength within the centre display's glass", () => {
    const m = flying()
    frames(m, 4, cart)
    const font = constant('FONT_TILE')
    const isText = (x: number) => {
      const t = (bg1(m, x, 32) & 0x3ff) - font
      return t >= 0 && t < 64
    }
    expect([19, 20, 21, 22, 23, 24].every(isText)).toBe(true)
    // The bezel past the glass is the cockpit's own picture.
    expect([25, 26].some(isText)).toBe(false)
  })
})

// The panel's figure of our fighter shows each part's damage (docs/elec16-elecaircombat.md
// section 3): a palette colour per part, chosen by where the blow came from.
describe('ELECAIRCOMBAT damage by part', { timeout: 60_000 }, () => {
  /** The screen slot's colour `k` (the figure's parts are 10-13: nose, left, right, tail). */
  const screenColour = (m: Elec16, k: number) => vword(m, 0xc400 + 2 * 32 + k * 2)
  const GREEN = 0x3308
  const RED = 0x109f

  /**
   * The enemy at (x, y) from the player (level, heading north, held still so rounds from the
   * side meet it), its nose on the player.
   */
  function aimedFrom(m: Elec16, x: number, y: number): void {
    pin(m, 0)
    put(m, 'pSpeed', 0)
    const d = Math.hypot(x, y)
    const fx = Math.round((-x / d) * 16384)
    const fy = Math.round((-y / d) * 16384)
    vecPut(m, V.EF, fx, fy, 0)
    vecPut(m, V.ER, fy, -fx, 0)
    vecPut(m, V.REL, x, y, 0)
    put(m, 'aiThinkT', 200)
  }

  /** Frames with the enemy held at (x, y) until the player has taken `n` damage more. */
  function shotFrom(m: Elec16, x: number, y: number, n: number): void {
    const before = read(m, 'damage')
    for (let k = 0; k < 400 && read(m, 'damage') < before + n; k++) {
      aimedFrom(m, x, y)
      frames(m, 1, cart)
    }
    expect(read(m, 'damage')).toBeGreaterThanOrEqual(before + n)
  }

  it('lights the left wing for rounds from the left, the tail for rounds from behind', () => {
    const m = flying()
    for (let k = 10; k < 14; k++) expect(screenColour(m, k)).toBe(GREEN)
    shotFrom(m, -450, 0, 1)
    expect([0, 1, 2, 3].map((k) => read(m, 'partDmg', k))).toEqual([0, read(m, 'damage'), 0, 0])
    // The hit part blinks red at once; the others stay green.
    expect(screenColour(m, 11)).toBe(RED)
    expect([10, 12, 13].map((k) => screenColour(m, k))).toEqual([GREEN, GREEN, GREEN])
    // From behind: the tail.
    const left = read(m, 'partDmg', 1)
    for (let k = 0; k < 40; k++) {
      pin(m, 3000)
      frames(m, 1, cart)
    }
    shotFrom(m, 0, -450, 1)
    expect(read(m, 'partDmg', 3)).toBeGreaterThan(0)
    expect(read(m, 'partDmg', 1)).toBe(left)
    expect(screenColour(m, 13)).toBe(RED)
    // From the right and from ahead: the right wing, the nose.
    shotFrom(m, 450, 0, 1)
    expect(read(m, 'partDmg', 2)).toBeGreaterThan(0)
    shotFrom(m, 0, 600, 1)
    expect(read(m, 'partDmg', 0)).toBeGreaterThan(0)
  })

  it("steps a part's colour from green through yellow to red by its own blows, the total kept", () => {
    const m = flying()
    const seen: number[] = []
    for (let round = 0; round < 40 && read(m, 'partDmg', 1) < 45; round++) {
      shotFrom(m, -450, 0, 1)
      // The blink over, the part shows its colour by its blows.
      for (let k = 0; k < 30; k++) {
        pin(m, 3000)
        put(m, 'aiThinkT', 200)
        frames(m, 1, cart)
      }
      const c = screenColour(m, 11)
      if (seen[seen.length - 1] !== c) seen.push(c)
    }
    // Green, yellow-green, yellow, orange, red-orange, red: in order, none skipped back.
    const steps = [0x3308, 0x2394, 0x1b7f, 0x125f, 0x115f, 0x18df]
    const order = seen.map((c) => steps.indexOf(c))
    expect(order.every((k) => k >= 0)).toBe(true)
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expect(order[order.length - 1]).toBe(5)
    // The other parts untouched, and the damage the sum of the parts' (it is one total).
    expect([10, 12, 13].map((k) => screenColour(m, k))).toEqual([GREEN, GREEN, GREEN])
    const parts = [0, 1, 2, 3].reduce((n, k) => n + read(m, 'partDmg', k), 0)
    expect(read(m, 'damage')).toBe(Math.min(100, parts))
  })
})

// The redrawn sky (docs/elec16-elecaircombat.md section 4): the row writer's cost is in which
// distances share a tile, never in what the tiles show.
describe('ELECAIRCOMBAT sky, as redrawn', () => {
  it('keeps the bands beyond the horizon in as many runs as before the redraw', () => {
    const table = readFileSync(`${DIR}/horizon.txt`, 'utf8')
      .split('\n')
      .filter((l) => !l.startsWith('#'))
      .join(' ')
      .trim()
      .split(/\s+/)
      .map(Number)
    const bands = table.slice(0, 321)
    let changes = 0
    for (let s = -160; s < 160; s++) {
      if (Math.abs(s) <= 7 || Math.abs(s + 1) <= 7) continue
      if (bands[s + 161] !== bands[s + 160]) changes++
    }
    // Thirteen sky runs and eleven sea runs (bands and the seams between them): 22 changes.
    expect(changes).toBe(22)
  })
})

// The sea's motion (docs/elec16-elecaircombat.md section 4): the band tiles' images, never
// their numbers, copied from sea.png a phase at a time, sooner the faster the player flies.
describe('ELECAIRCOMBAT sea, moving', { timeout: 60_000 }, () => {
  const tableOf = () =>
    readFileSync(`${DIR}/horizon.txt`, 'utf8')
      .split('\n')
      .filter((l) => !l.startsWith('#'))
      .join(' ')
      .trim()
      .split(/\s+/)
      .map(Number)
  const skyTiles = meta.sheets.find((x: { name: string }) => x.name === 'horizon').count
  const seaFrames = meta.sheets.find((x: { name: string }) => x.name === 'sea').count
  const phase = seaFrames / 4

  it("draws the sea's band tiles last, sea.png's first phase, and its phases within a bank", () => {
    const sky = pictureFile(`${DIR}/art/horizon.png`)
    const sea = pictureFile(`${DIR}/art/sea.png`)
    if (sky === null || sea === null) throw new Error('no picture')
    // Every band entry of the sea (below the horizon's cells) is one of the last tiles.
    const sea0 = tableOf().slice(0, 321 - 167)
    expect(sea0.every((t) => t >= skyTiles - phase && t < skyTiles)).toBe(true)
    expect(new Set(sea0).size).toBe(phase)
    // Those tiles are sea.png's first row, point for point.
    const across = sky.width / 8
    for (let k = 0; k < phase; k++) {
      const t = skyTiles - phase + k
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const a = (((Math.floor(t / across) * 8 + y) * sky.width + (t % across) * 8 + x) * 4) | 0
          const b = ((y * sea.width + k * 8 + x) * 4) | 0
          expect([...sky.data.subarray(a, a + 4)]).toEqual([...sea.data.subarray(b, b + 4)])
        }
      }
    }
    // The game copies a phase with one DMA, so the four lie in one bank's window.
    expect(constant('SEA_AT') + seaFrames * 32).toBeLessThanOrEqual(0xe000)
    // And they take no room in video memory of their own.
    expect(constant('SEA_BYTES')).toBe(0)
  })

  it('moves the waves through four phases, sooner on the burner than braking', () => {
    const m = flying()
    const vram = m.state.video?.mem ?? new Uint8Array()
    const from = (constant('HORIZON_TILE') + skyTiles - phase) * 32
    const image = () => Array.from(vram.subarray(from, from + phase * 32)).join(',')
    const run = (speed: number, n: number) => {
      let moves = 0
      const seen: string[] = []
      for (let k = 0; k < n; k++) {
        put(m, 'pSpeed', speed)
        put(m, 'pAlt', 5200)
        const was = read(m, 'seaPhase')
        frames(m, 1, cart)
        if (read(m, 'seaPhase') !== was) {
          moves++
          seen.push(image())
        }
      }
      return { moves, seen }
    }
    // On the burner (464 sixteenths a frame) a phase every 2.8 frames; braking (200) every 6.4.
    const fast = run(464, 128)
    const slow = run(200, 128)
    expect(Math.abs(fast.moves - (128 * 464) / 1280)).toBeLessThanOrEqual(1)
    expect(Math.abs(slow.moves - (128 * 200) / 1280)).toBeLessThanOrEqual(1)
    // Four different pictures of the sea, then the first again; the tiles' numbers stay.
    expect(new Set(fast.seen).size).toBe(4)
    expect(fast.seen[4]).toBe(fast.seen[0])
    expect(fast.seen[1]).not.toBe(fast.seen[0])
    const t = constant('HORIZON_TILE')
    const rows = Array.from({ length: 26 }, (_, y) => bg0(m, 20, y + 1) & 0x3ff)
    expect(rows.every((r) => r >= t && r < t + skyTiles)).toBe(true)
  })
})
