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
 * ELECDRILL, the block-digging puzzle (docs/elec16-elecdrill.md): built from its folder as
 * gen:elec16 builds it, and played on the core. Most tests lay out a piece of the well by
 * hand - rows of letters written into its cells - put the driller beside it and press the
 * buttons: a group dug, blocks left hanging wobbling and falling, chains, a crushed driller,
 * AIR, capsules, ALLOY, the strata, the core, and the best five kept in save RAM.
 */

const DIR = 'resources/elec16/games/elecdrill'
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
const byte = (m: Elec16, name: string, k: number) => m.state.ram[addr(name) + k] ?? 0
const putByte = (m: Elec16, name: string, k: number, v: number) => {
  ;(m.state.ram as Uint8Array)[addr(name) + k] = v
}

/** The player's states and the cells' kinds, as player.e16.ts and field.e16.ts number them. */
const P = { stand: 0, walk: 1, fall: 3, dig: 4, crush: 6, gasp: 7 }
const KIND: Record<string, number> = { '.': 0, R: 1, Y: 2, G: 3, B: 4, X: 5, A: 6 }

/** Cell (col, row) of the well's ring. */
const cellIndex = (col: number, row: number) => ((row & 31) << 4) + col
const cell = (m: Elec16, col: number, row: number) => byte(m, 'cells', cellIndex(col, row))

/** Rows of the well from `row` laid out by letters (. empty, R Y G B colours, X ALLOY, A air). */
function lay(m: Elec16, row: number, lines: string[]): void {
  lines.forEach((line, k) => {
    ;[...line].forEach((ch, col) => {
      putByte(m, 'cells', cellIndex(col, row + k), KIND[ch] ?? 0)
      putByte(m, 'marks', cellIndex(col, row + k), 0x80)
    })
    putByte(m, 'rowMarked', (row + k) & 31, 1)
  })
}

/** The driller put at (col, row), standing. */
function place(m: Elec16, col: number, row: number): void {
  put(m, 'pCol', col)
  put(m, 'pRow', row)
  put(m, 'pX', col * 16)
  put(m, 'pY', row * 16)
  put(m, 'pState', P.stand)
}

/** The game from its title, START held: play begins (and the READY banner is up). */
function playing(): Elec16 {
  const m = startGame(cart)
  frames(m, 60, cart)
  m.pad(padBit('start'))
  frames(m, 3, cart)
  m.pad(0)
  frames(m, 10, cart)
  return m
}

/** A button held for three frames, then let go for `after` frames. */
function press(m: Elec16, buttons: number, after = 3): void {
  m.pad(buttons)
  frames(m, 3, cart)
  m.pad(0)
  frames(m, after, cart)
}

/** A piece of well: an empty pocket above a floor of green, for the tests' layouts. */
const FLOOR = ['GGGGGGGGG', 'GGGGGGGGG', 'GGGGGGGGG']
const EMPTY = '.........'

describe('ELECDRILL as built', () => {
  it('is what games.json holds, and its folder keeps the constants its sources import', () => {
    const file = JSON.parse(readFileSync('resources/elec16/games/games.json', 'utf8'))
    const images = file.games.map((g: { data: string }) => fromBase64(g.data) ?? new Uint8Array())
    expect(images.find((i: Uint8Array) => readCart(i)?.id === 'ELECDRILL')).toEqual(cart)
    expect(readCart(cart)).toMatchObject({ id: 'ELECDRILL', name: 'ELECDRILL', saveBanks: 1 })
    expect(readFileSync(`${DIR}/assets.e16.ts`, 'utf8')).toBe(built.report.assets)
    expect(readFileSync(`${DIR}/compiled.s`, 'utf8')).toBe(built.report.asm)
  })

  it("keeps its code well within RAM's room, its globals below the code, its tiles within 1,024", () => {
    // 20 KB is the room; the rarely run scenes, the driller, the effects and the panels are
    // in cartridge banks.
    expect(built.report.ramCode).toBeLessThanOrEqual(16 * 1024)
    expect(built.report.tiles).toBeLessThanOrEqual(1024)
    expect(Math.max(...at.values())).toBeLessThan(0x2000)
  })

  it('has songs whose channels keep in step, the music on 0-11 and the effects on 12-15', () => {
    const songs: Song[] = [
      ...compileSongs(readFileSync(`${DIR}/music/songs.mml`, 'utf8')),
      ...compileSongs(readFileSync(`${DIR}/music/sfx.mml`, 'utf8')),
    ]
    expect(songs.map((s) => s.name)).toEqual(
      expect.arrayContaining([
        'main',
        'lowair',
        'deep',
        'title',
        'stratum',
        'goal',
        'over',
        'result',
      ]),
    )
    for (const song of songs) {
      const effect = song.name.startsWith('x_')
      for (const ch of song.channels) {
        expect(ch.channel < 12, `${song.name} C${ch.channel}`).toBe(!effect)
        expect(ch.channel).toBeLessThan(CHANNELS)
      }
      const bodies = new Set(loopFrames(song).values())
      expect([...bodies], song.name).toHaveLength(bodies.size > 0 ? 1 : 0)
    }
    // Every bar of the looping songs whole: the main theme's loop is 16 bars of 96 frames.
    const main = songs.find((s) => s.name === 'main')
    expect(main && [...loopFrames(main).values()][0]).toBe(16 * 96)
  })
})

describe('ELECDRILL played', () => {
  it('shows the title, then starts the dig with START: the driller on the surface, AIR full', () => {
    const m = startGame(cart)
    frames(m, 60, cart)
    expect(read(m, 'outcome')).toBe(0)
    m.pad(padBit('start'))
    frames(m, 3, cart)
    m.pad(0)
    frames(m, 30, cart)
    expect(m.state.halt).toBeNull()
    expect([read(m, 'pRow'), read(m, 'pCol'), read(m, 'air'), read(m, 'lives')]).toEqual([
      5, 4, 100, 3,
    ])
    // The well is drawn: the cell under the driller (row 6) holds a block in BG0.
    const tiles = m.state.video?.mem ?? new Uint8Array()
    const map = 0x8000 + ((6 & 31) << 8) + 22 + 4 * 4
    expect(tiles[map] ?? 0).not.toBe(0)
  })

  it('digs a whole group of a colour at once, and the driller drops into the hole', () => {
    const m = playing()
    lay(m, 6, ['YYYYBBBBB', 'GGGGGGGGB', ...FLOOR])
    place(m, 4, 5)
    press(m, padBit('b'), 30)
    // The blue group (six blocks: five in the row, one below) has gone; the yellow stays.
    expect([0, 1, 2, 3].map((c) => cell(m, c, 6))).toEqual([2, 2, 2, 2])
    expect([4, 5, 6, 7, 8].map((c) => cell(m, c, 6))).toEqual([0, 0, 0, 0, 0])
    expect(cell(m, 8, 7)).toBe(0)
    expect(read(m, 'pRow')).toBe(6)
    expect(read(m, 'maxDepth')).toBe(1)
    // 6 blocks at 10, a metre at 10.
    expect(read(m, 'score')).toBe(70)
  })

  it('lets a block left hanging wobble, then fall, and its landing vanish four of a colour', () => {
    const m = playing()
    lay(m, 6, [EMPTY, EMPTY, '...Y.....', '...B.....', 'YYYYGGGGG', ...FLOOR])
    place(m, 4, 9)
    put(m, 'pFace', 1)
    press(m, padBit('a'), 0)
    frames(m, 8, cart)
    // The yellow came loose and wobbles where it was.
    expect(cell(m, 3, 8) & 0x8f).toBe(0x82)
    expect(read(m, 'uState')).toBe(1)
    frames(m, 70, cart)
    // Fallen and landed on the yellow row: five of them vanish, the first of a chain.
    frames(m, 40, cart)
    expect([0, 1, 2, 3].map((c) => cell(m, c, 10))).toEqual([0, 0, 0, 0])
    expect(cell(m, 3, 9)).toBe(0)
    expect(read(m, 'maxChain')).toBe(1)
    expect(m.state.halt).toBeNull()
  })

  it('runs a chain on: what rested on the vanished group falls and vanishes in turn', () => {
    const m = playing()
    lay(m, 6, [EMPTY, '...R.....', '...Y.....', '...B.....', 'YYYYGGGGG', 'RRRRGGGGG', ...FLOOR])
    place(m, 4, 9)
    put(m, 'pFace', 1)
    press(m, padBit('a'), 0)
    // Wobble, fall, land, vanish (yellow), fall again, land, vanish (red).
    frames(m, 260, cart)
    expect(read(m, 'maxChain')).toBe(2)
    expect([0, 1, 2, 3].map((c) => cell(m, c, 11))).toEqual([0, 0, 0, 0])
    expect(read(m, 'lbN')).toBe(0)
    // The chain is over and counted from one again next time.
    expect(read(m, 'chain')).toBe(0)
  })

  it('crushes the driller under a falling block, takes a driller and brings it back', () => {
    const m = playing()
    lay(m, 6, ['....R....', '....B....', EMPTY, 'GGGGGGGGG', ...FLOOR])
    place(m, 4, 8)
    // Drill up: the blue overhead goes, and the red above it comes down on the driller.
    m.pad(padBit('a') | padBit('up'))
    frames(m, 3, cart)
    m.pad(0)
    let crushed = false
    for (let k = 0; k < 160 && !crushed; k++) {
      frames(m, 1, cart)
      crushed = read(m, 'pState') === P.crush
    }
    expect(crushed).toBe(true)
    frames(m, 110, cart)
    // A driller less, back where it was with the red cleared away, safe a moment, AIR full.
    expect(read(m, 'lives')).toBe(2)
    expect(read(m, 'pState')).toBe(P.stand)
    expect(cell(m, 4, 7) & 15).toBe(0)
    expect(read(m, 'pSafe')).toBeGreaterThan(0)
    expect(read(m, 'air')).toBe(100)
  })

  it('lets the driller walk out from under a wobbling block before it lands', () => {
    const m = playing()
    lay(m, 6, ['....R....', '....B....', EMPTY, 'GGGGGGGGG', ...FLOOR])
    place(m, 4, 8)
    m.pad(padBit('a') | padBit('up'))
    frames(m, 3, cart)
    m.pad(padBit('right'))
    frames(m, 20, cart)
    m.pad(0)
    frames(m, 150, cart)
    expect(read(m, 'pState')).toBe(P.stand)
    expect(read(m, 'pCol')).toBeGreaterThan(4)
    expect(read(m, 'lives')).toBe(3)
    // The red came down where the driller stood.
    expect(cell(m, 4, 8)).toBe(1)
  })

  it('runs AIR down a unit a second, refills it from a capsule, and gasps at none', () => {
    const m = playing()
    lay(m, 6, [EMPTY, EMPTY, '.....A...', 'GGGGGGGGG', ...FLOOR])
    place(m, 4, 8)
    put(m, 'air', 50)
    frames(m, 120, cart)
    expect(read(m, 'air')).toBe(48)
    // Walk into the capsule: +20.
    m.pad(padBit('right'))
    frames(m, 6, cart)
    m.pad(0)
    frames(m, 10, cart)
    expect(read(m, 'air')).toBe(68)
    expect(read(m, 'capsules')).toBe(1)
    expect(cell(m, 5, 8)).toBe(0)
    // Out of air: the driller gasps.
    put(m, 'air', 1)
    frames(m, 70, cart)
    expect(read(m, 'pState')).toBe(P.gasp)
  })

  it('takes four hits to break ALLOY, which costs a fifth of the AIR', () => {
    const m = playing()
    lay(m, 6, [EMPTY, EMPTY, EMPTY, '....X....', ...FLOOR])
    place(m, 4, 8)
    for (let k = 0; k < 3; k++) press(m, padBit('b'), 10)
    expect(cell(m, 4, 9) & 15).toBe(5)
    expect((cell(m, 4, 9) >> 4) & 3).toBe(3)
    const air = read(m, 'air')
    press(m, padBit('b'), 10)
    expect(cell(m, 4, 9)).toBe(0)
    // Twenty, and maybe a unit breathed meanwhile.
    expect(air - read(m, 'air')).toBeGreaterThanOrEqual(20)
    expect(air - read(m, 'air')).toBeLessThanOrEqual(21)
  })

  it('passes a stratum every 100 m: faster, its bonus and AIR, its name on the panel', () => {
    const m = playing()
    put(m, 'maxDepth', 100)
    const air = read(m, 'air')
    frames(m, 2, cart)
    expect(read(m, 'stratum')).toBe(1)
    expect(read(m, 'wobbleFrames')).toBe(57)
    expect(read(m, 'fallSpeed')).toBe(9)
    expect(read(m, 'air')).toBe(Math.min(100, air + 20))
    expect(read(m, 'score')).toBeGreaterThanOrEqual(1000)
  })

  it('makes the well as it goes down: ALLOY more often deeper, and the core under 500 m', () => {
    const m = playing()
    // The ring is moved on by the camera: put it near the bottom and let it make new rows.
    put(m, 'top', 470)
    put(m, 'camY', 492 * 16)
    put(m, 'pRow', 495)
    put(m, 'pY', 495 * 16)
    put(m, 'pSafe', 2000)
    frames(m, 12, cart)
    expect(read(m, 'top')).toBeGreaterThanOrEqual(476)
    // Rows from 506 (500 m below the ground at row 6) are the core; above it, blocks.
    for (let c = 0; c < 9; c++) expect(cell(m, c, 506) & 15).toBe(7)
    const kinds = Array.from({ length: 9 }, (_, c) => cell(m, c, 504) & 15)
    expect(kinds.every((k) => k >= 1 && k <= 6)).toBe(true)
    expect(m.state.halt).toBeNull()
  })

  it('reaches the core at 500 m: the driller cheers, the bonus, the tally, a name kept', () => {
    const m = playing()
    put(m, 'score', 0)
    put(m, 'score', 2, 1)
    put(m, 'maxDepth', 500)
    put(m, 'stratum', 4)
    frames(m, 30, cart)
    expect(read(m, 'outcome')).toBe(2)
    expect(read(m, 'pState')).toBe(8)
    // The tally, then the name: A A A, the first letter moved up to B.
    frames(m, 700, cart)
    press(m, padBit('up'), 3)
    for (let k = 0; k < 3; k++) press(m, padBit('a'), 3)
    frames(m, 10, cart)
    const save = m.state.cart?.save ?? new Uint8Array()
    const word = (k: number) => (save[k] ?? 0) | ((save[k + 1] ?? 0) << 8)
    // "ED", then the first entry: score (low, high), depth, letters B A A.
    expect(word(0)).toBe(0x4445)
    expect(word(4)).toBeGreaterThanOrEqual(2)
    expect(word(6)).toBe(500)
    expect([save[8], save[9], save[10]]).toEqual([0x42, 0x41, 0x41])
  })

  it('ends the game when the last driller runs out of air and no one continues', () => {
    const m = playing()
    put(m, 'lives', 1)
    put(m, 'air', 1)
    frames(m, 200, cart)
    // GAME OVER and the count from ten.
    expect(read(m, 'lives')).toBe(0)
    frames(m, 800, cart)
    expect(read(m, 'outcome')).toBe(1)
    expect(m.state.halt).toBeNull()
  })

  it('goes on after GAME OVER with START: three drillers again, the dig where it was', () => {
    const m = playing()
    put(m, 'lives', 1)
    put(m, 'air', 1)
    frames(m, 330, cart)
    press(m, padBit('start'), 10)
    expect([read(m, 'lives'), read(m, 'continues'), read(m, 'outcome')]).toEqual([3, 1, 0])
    expect(read(m, 'air')).toBe(100)
  })
})

describe('ELECDRILL within its frames', () => {
  it('runs a well of blocks collapsing all at once in chains within the frame budget', () => {
    const m = playing()
    // Twelve rows of blocks on a row of blue: when it goes, everything comes down at once.
    let s = 7
    const chance = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff
      return s / 0x7fffffff
    }
    const rows: string[] = []
    for (let r = 0; r < 12; r++) {
      let line = ''
      for (let c = 0; c < 9; c++) line += 'RYGB'[Math.floor(chance() * 4)]
      rows.push(line)
    }
    lay(m, 8, [...rows, 'BBBBBBBBB', EMPTY, 'GGGGGGGGG', ...FLOOR])
    place(m, 4, 21)
    // Safe from what falls on it, so the whole collapse is seen through.
    put(m, 'pSafe', 2000)
    frames(m, 40, cart)
    press(m, padBit('a') | padBit('up'), 0)
    let worst = 0
    let sum = 0
    let most = 0
    for (let k = 0; k < 900; k++) {
      const c0 = m.state.cycles
      frames(m, 1, cart)
      const d = m.state.cycles - c0
      worst = Math.max(worst, d)
      sum += d
      most = Math.max(most, read(m, 'lbN'))
    }
    expect(m.state.halt).toBeNull()
    // It all came loose and fell, with chains on the way.
    expect(most).toBeGreaterThan(60)
    expect(read(m, 'maxChain')).toBeGreaterThanOrEqual(1)
    // 4 MHz at 60 frames: 66,667 cycles a frame. Measured near 35,000 at the worst.
    expect(worst).toBeLessThan(45_000)
    expect(sum / 900).toBeLessThan(15_000)
  })

  it('plays on for minutes of random digging without a halt or a floating block', () => {
    const m = playing()
    let s = 11
    const chance = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff
      return s / 0x7fffffff
    }
    const moves = ['b', 'left', 'right', 'a', 'b', 'down', '']
    let worst = 0
    for (let k = 0; k < 120; k++) {
      put(m, 'lives', 3)
      put(m, 'pSafe', 0)
      const move = moves[Math.floor(chance() * moves.length)] ?? ''
      worst = Math.max(worst, held(m, move === '' ? 0 : padBit(move as 'b')))
      expect(m.state.halt).toBeNull()
      expect(floating(m), `move ${k}`).toEqual([])
    }
    expect(worst).toBeLessThan(45_000)
    expect(read(m, 'maxDepth')).toBeGreaterThan(5)
  })
})

/** A button held three frames of fourteen: answers the busiest frame while playing. */
function held(m: Elec16, buttons: number): number {
  let worst = 0
  m.pad(buttons)
  for (let f = 0; f < 14; f++) {
    const c0 = m.state.cycles
    frames(m, 1, cart)
    if (read(m, 'outcome') === 0) worst = Math.max(worst, m.state.cycles - c0)
    if (f === 2) m.pad(0)
  }
  return worst
}

/**
 * Static groups standing on nothing, once every suspect has been looked at: there must be
 * none (a group is held up by any of its blocks on anything not its own and not loose, or
 * by reaching the ring's highest row, which hangs from what is above it, out of the ring).
 */
function floating(m: Elec16): string[] {
  if (read(m, 'susHead') !== read(m, 'susTail')) return []
  const top = read(m, 'top')
  const v = (i: number) => byte(m, 'cells', i & 511)
  const seen = new Set<number>()
  const out: string[] = []
  for (let r = top; r < top + 30; r++) {
    for (let c = 0; c < 9; c++) {
      const i = cellIndex(c, r)
      const t = v(i)
      if (seen.has(i) || (t & 15) === 0 || (t & 15) >= 7 || (t & 0xc0) !== 0) continue
      const group = groupAt(v, i, seen)
      if (!group.some((g) => holds(v, g, group, top)))
        out.push(`row ${r} col ${c}: ${group.length}`)
    }
  }
  return out
}

/** The static group of cell `i` (its colour's neighbours, or it alone), marked in `seen`. */
function groupAt(v: (i: number) => number, i: number, seen: Set<number>): number[] {
  const t = v(i)
  const group = [i]
  seen.add(i)
  if ((t & 15) > 4) return group
  for (let k = 0; k < group.length; k++) {
    for (const d of [-16, 16, -1, 1]) {
      const j = ((group[k] ?? 0) + d) & 511
      if (!seen.has(j) && v(j) === t) {
        seen.add(j)
        group.push(j)
      }
    }
  }
  return group
}

/** Whether block `g` of `group` holds it up. */
function holds(v: (i: number) => number, g: number, group: number[], top: number): boolean {
  if (g >> 4 === (top & 31)) return true
  const b = (g + 16) & 511
  return (v(b) & 15) !== 0 && (v(b) & 0x80) === 0 && !group.includes(b)
}
