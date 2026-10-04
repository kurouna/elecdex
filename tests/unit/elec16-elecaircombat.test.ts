import { readFileSync } from 'node:fs'
import { CHANNELS } from '@shared/elec16/apu'
import { readCart } from '@shared/elec16/cartridge'
import { compileSongs, loopFrames, type Song } from '@shared/elec16/kit/mml'
import type { Elec16 } from '@shared/elec16/machine'
import { padBit } from '@shared/elec16/pad'
import { fromBase64 } from '@shared/emu/base64'
import { describe, expect, it } from 'vitest'
import { buildKit, frames, globalsOf, ramPoke, ramWord, startGame } from './elec16-kit-helpers'

/**
 * ELECAIRCOMBAT, the cockpit dogfight (docs/elec16-elecaircombat.md): built from its folder as
 * gen:elec16 builds it, and flown on the core - the title, the briefing, the sortie's sky and
 * HUD, the stick, the gun, a locked missile, the ace's gun and missile, flares, the end of a
 * sortie, the continue, the game's end and a name kept in save RAM. Variables are found by
 * name in what e16c wrote; where a test needs a fixed geometry it pins the enemy in place.
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

/** From the title through the briefing: the first sortie begins. */
function flying(): Elec16 {
  const m = startGame(cart)
  frames(m, 60, cart)
  hold(m, padBit('start'))
  frames(m, 40, cart)
  hold(m, padBit('a'))
  frames(m, 4, cart)
  return m
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
  it('shows the title, the briefing, then the cockpit over the sky and the sea', () => {
    const m = startGame(cart)
    frames(m, 60, cart)
    expect(m.state.halt).toBeNull()
    // The title's word on BG1 (front cells of its tiles), the sky on BG0.
    const logo = constant('LOGO_TILE')
    const cells = Array.from({ length: 40 }, (_, x) => bg1(m, x, 6) & 0x3ff)
    expect(cells.some((t) => t > logo)).toBe(true)
    hold(m, padBit('start'))
    frames(m, 30, cart)
    // The briefing: the fighter turning on its stand (sprites), the ace's name in words.
    expect(spritesShown(m)).toBeGreaterThan(3)
    hold(m, padBit('a'))
    frames(m, 10, cart)
    // The cockpit: the panel on BG1 in front; the horizon's tiles across BG0 near the middle.
    expect(bg1(m, 20, 34) & 0x8000).toBe(0x8000)
    const horizon = constant('HORIZON_TILE')
    const rows = Array.from({ length: 26 }, (_, y) => bg0(m, 20, y + 1) & 0x3ff)
    expect(rows.every((t) => t >= horizon && t < horizon + 197)).toBe(true)
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
    hold(m, padBit('x'))
    expect(read(m, 'flaresLeft')).toBe(23)
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
  })
})
