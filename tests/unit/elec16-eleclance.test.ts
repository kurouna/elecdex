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

/** The game from its title, START pressed: the stage begins. */
function playing(): Elec16 {
  const m = startGame(cart)
  frames(m, 70, cart)
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

  it('turns every bullet into a star with a bomb, which costs one', () => {
    const m = playing()
    scrollTo(m, 400)
    until(m, () => read(m, 'bulletCount') > 4, 1200)
    const before = read(m, 'bombs')
    m.pad(padBit('b'))
    frames(m, 2, cart)
    m.pad(0)
    frames(m, 1, cart)
    expect(read(m, 'bombs')).toBe(before - 1)
    expect(read(m, 'bulletCount')).toBe(0)
    expect(read(m, 'bombing')).toBeGreaterThan(0)
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
