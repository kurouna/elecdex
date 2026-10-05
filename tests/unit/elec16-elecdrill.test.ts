import { readFileSync } from 'node:fs'
import { CHANNELS } from '@shared/elec16/apu'
import { readCart } from '@shared/elec16/cartridge'
import { compileSongs, loopFrames, type Song } from '@shared/elec16/kit/mml'
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
  startGame,
  tap,
} from './elec16-kit-helpers'

/**
 * ELECDRILL, the block-digging puzzle (docs/elec16-elecdrill.md): built from its folder as
 * gen:elec16 builds it, and played on the core. Most tests lay out a piece of the well by
 * hand - rows of letters written into its cells - put the driller beside it and press the
 * buttons: a group dug, blocks left hanging wobbling and falling, chains, a crushed driller,
 * AIR, capsules, ALLOY, the strata, the core, and the best five kept in save RAM. The title's
 * difficulties, the controls, the pause and the warnings and callouts in play are read from
 * the screen's words (BG1) and the game's state.
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

/** The well's nine columns. */
const COLUMNS = [0, 1, 2, 3, 4, 5, 6, 7, 8]

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

const constant = (name: string) =>
  Number.parseInt(new RegExp(`${name} = 0x([0-9a-f]+)`).exec(built.report.assets)?.[1] ?? 'x', 16)

/** The difficulties, in the order of difficulty.txt's rows and the title's left to right. */
const LEVELS = ['easy', 'normal', 'hard'] as const
type Level = (typeof LEVELS)[number]

/** Left or right on the title, `n` times (negative for left). */
function choose(m: Elec16, n: number): void {
  for (let k = 0; k < Math.abs(n); k++) tap(m, padBit(n < 0 ? 'left' : 'right'), cart)
}

/** PLAY-320 switched on with the cartridge and `save` in its save RAM, START pressed. */
function startWithSave(save: Uint8Array): Elec16 {
  const m = Elec16.boot(ROM.image, 'play-320', undefined, XRAM_MAX)
  settle(m, cart)
  m.insertCart(cart, new Uint8Array(32), save)
  tap(m, padBit('start'), cart)
  return m
}

/**
 * The game from its title (at `level`, from NORMAL), START held, then A on the controls:
 * play begins (and the READY banner is up).
 */
function playing(level: Level = 'normal', m = startGame(cart)): Elec16 {
  frames(m, 60, cart)
  choose(m, LEVELS.indexOf(level) - 1)
  press(m, padBit('start'), 10)
  press(m, padBit('a'), 10)
  return m
}

/** BG1's row y from cell `from` to `to` as text, through the font. */
function rowText(m: Elec16, y: number, from = 0, to = 40): string {
  const font = constant('FONT_TILE')
  let out = ''
  for (let x = from; x < to; x++) {
    const tile = cellWord(m, x, y) & 0x3ff
    out += tile >= font && tile < font + 64 ? String.fromCharCode(32 + tile - font) : ' '
  }
  return out
}

/** The screen's words, every row of BG1, for a search. */
const screenText = (m: Elec16) => Array.from({ length: 36 }, (_, y) => rowText(m, y)).join('\n')

function cellWord(m: Elec16, x: number, y: number): number {
  const mem = m.state.video?.mem ?? new Uint8Array()
  const at = 0xa000 + (y << 7) + (x << 1)
  return (mem[at] ?? 0) | ((mem[at + 1] ?? 0) << 8)
}

/** Colour k of palette slot `slot` as the screen has it (RGB555). */
function colourOf(m: Elec16, slot: number, k: number): number {
  const mem = m.state.video?.mem ?? new Uint8Array()
  const at = 0xc400 + slot * 32 + k * 2
  return (mem[at] ?? 0) | ((mem[at + 1] ?? 0) << 8)
}

/** The live effects of a kind (fx.e16.ts's numbers): each one's own value. */
const FX = { dust: 2, grit: 6, say: 9, metres: 10 }
function effects(m: Elec16, kind: number): number[] {
  const out: number[] = []
  for (let k = 0; k < 32; k++) if (read(m, 'fxK', k) === kind) out.push(read(m, 'fxA', k))
  return out
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
  it('shows the title, the controls after START, then the dig: the driller on the surface', () => {
    const m = startGame(cart)
    frames(m, 60, cart)
    expect(read(m, 'outcome')).toBe(0)
    expect(rowText(m, 12)).toContain('>NORMAL<')
    press(m, padBit('start'), 10)
    // The controls: the pad's buttons beside the PC's keys, and what each does.
    expect(read(m, 'controlsUp')).toBe(1)
    expect(rowText(m, 5).replace(/\s+/g, ' ').trim()).toBe('PAD PC KEY ACTION')
    expect(rowText(m, 8).replace(/\s+/g, ' ').trim()).toBe('D-PAD < > ARROW < > WALK')
    expect(rowText(m, 10).replace(/\s+/g, ' ').trim()).toBe('A Z DIG FACING')
    expect(rowText(m, 12).replace(/\s+/g, ' ').trim()).toBe('UP/DOWN+A UP/DOWN+Z DIG UP/DOWN')
    expect(rowText(m, 14).replace(/\s+/g, ' ').trim()).toBe('B X DIG DOWN')
    expect(rowText(m, 16).replace(/\s+/g, ' ').trim()).toBe('START ENTER PAUSE')
    frames(m, 120, cart)
    // It waits there for A or START.
    expect(read(m, 'controlsUp')).toBe(1)
    press(m, padBit('a'), 30)
    expect(read(m, 'controlsUp')).toBe(0)
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
    // The yellow came loose and wobbles where it was; beside the driller, no warning.
    expect(cell(m, 3, 8) & 0x8f).toBe(0x82)
    expect(read(m, 'uState')).toBe(1)
    expect(read(m, 'warn')).toBe(0)
    put(m, 'thudAt', 0)
    frames(m, 70, cart)
    // It landed: a thump and a puff of dust where it came to rest.
    expect(read(m, 'thudAt')).not.toBe(0)
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
    // Drill up: the blue overhead goes, and the red above it comes down on the driller. Over
    // its head the warning shows while the red wobbles (1), and quickens as it falls (2).
    m.pad(padBit('a') | padBit('up'))
    frames(m, 3, cart)
    m.pad(0)
    const warned = new Set<number>()
    let crushed = false
    for (let k = 0; k < 160 && !crushed; k++) {
      frames(m, 1, cart)
      warned.add(read(m, 'warn'))
      crushed = read(m, 'pState') === P.crush
    }
    expect(crushed).toBe(true)
    expect([...warned].sort()).toEqual([0, 1, 2])
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
    expect(screenText(m)).toContain('GAME OVER')
    // Bug: the panel still showed a driller left while GAME OVER asked to go on.
    const icons = constant('ICONS_TILE')
    expect((cellWord(m, 31, 21) & 0x3ff) - icons).toBe(1)
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

describe('ELECDRILL title and difficulties', () => {
  it('chooses EASY, NORMAL or HARD on the title with left and right, and keeps the choice', () => {
    const m = startGame(cart)
    frames(m, 60, cart)
    // NORMAL first: in gold between arrows, the others plain; a line on what it means below.
    expect(rowText(m, 12, 9, 31)).toBe(' EASY  >NORMAL<  HARD ')
    choose(m, -1)
    expect(read(m, 'level')).toBe(0)
    expect(rowText(m, 12, 9, 31)).toBe('>EASY<  NORMAL   HARD ')
    expect(rowText(m, 13)).toContain('MORE AIR, SLOWER FALLS, LESS ALLOY')
    // Left stops at EASY, right at HARD.
    choose(m, -1)
    expect(read(m, 'level')).toBe(0)
    choose(m, 3)
    expect(read(m, 'level')).toBe(2)
    expect(rowText(m, 12, 25, 31)).toBe('>HARD<')
    expect(rowText(m, 13)).toContain('LESS AIR, QUICK FALLS, MORE ALLOY')
    press(m, padBit('start'), 10)
    press(m, padBit('a'), 10)
    // HARD's row from the first stratum: AIR, the wobble, the fall; named on the right panel.
    expect([read(m, 'airDrain'), read(m, 'wobbleFrames'), read(m, 'fallSpeed')]).toEqual([
      48, 48, 10,
    ])
    expect(rowText(m, 29, 31, 39).trim()).toBe('LEVEL')
    expect(rowText(m, 30, 31, 39).trim()).toBe('HARD')
    // Kept in save RAM, and chosen again when the machine is next switched on.
    const save = Uint8Array.from(m.state.cart?.save ?? [])
    expect(save[54]).toBe(2)
    const again = startWithSave(save)
    frames(again, 60, cart)
    expect(read(again, 'level')).toBe(2)
    expect(rowText(again, 12, 25, 31)).toBe('>HARD<')
  })

  it('shows how to play and the best five by turns, five seconds each', () => {
    const m = startGame(cart)
    frames(m, 60, cart)
    expect(rowText(m, 15)).toContain('BEST DRILLERS')
    frames(m, 300, cart)
    expect(rowText(m, 15)).toContain('HOW TO PLAY')
    expect(rowText(m, 17)).toContain('DIG A BLOCK: ITS WHOLE GROUP GOES')
    expect(rowText(m, 23)).toContain('OVER RIVET: STEP OUT FROM UNDER')
    expect(rowText(m, 27)).toContain('REACH THE CORE AT 500 M')
    frames(m, 300, cart)
    expect(rowText(m, 15)).toContain('BEST DRILLERS')
    // A new choice of difficulty brings its best five at once.
    frames(m, 300, cart)
    expect(rowText(m, 15)).toContain('HOW TO PLAY')
    choose(m, 1)
    expect(rowText(m, 15)).toContain('BEST DRILLERS')
  })

  it("keeps an old save's best five as NORMAL's, and gives EASY and HARD fresh ones", () => {
    // The first saves: "ED", then five of (score low, score high, depth, three letters).
    const save = new Uint8Array(8192)
    const word = (at: number, v: number) => {
      save[at] = v & 255
      save[at + 1] = v >> 8
    }
    word(0, 0x4445)
    for (let k = 0; k < 5; k++) {
      word(2 + k * 10, k === 0 ? 1234 : (5 - k) * 100)
      word(4 + k * 10, k === 0 ? 5 : 0)
      word(6 + k * 10, k === 0 ? 123 : 10)
      word(8 + k * 10, 0x5958)
      word(10 + k * 10, 0x5a)
    }
    const m = startWithSave(save)
    frames(m, 60, cart)
    expect(read(m, 'level')).toBe(1)
    expect(rowText(m, 17, 7, 29).replace(/\s+/g, ' ')).toBe('1 XYZ 00051234 123M')
    expect([read(m, 'best', 0), read(m, 'best', 1)]).toEqual([1234, 5])
    choose(m, -1)
    expect(rowText(m, 17, 7, 29).replace(/\s+/g, ' ')).toBe('1 RIV 00005000 100M')
    const kept = m.state.cart?.save ?? new Uint8Array()
    const at = (k: number) => (kept[k] ?? 0) | ((kept[k + 1] ?? 0) << 8)
    // NORMAL's five where they were, the mark of the new layout, EASY's and HARD's made.
    expect([at(2), at(4), at(6), at(52), at(54)]).toEqual([1234, 5, 123, 0x564c, 1])
    expect([at(64), at(128)]).toEqual([5000, 5000])
  })

  it('makes EASY gentler and HARD harsher: AIR, wobbles, falls and ALLOY', () => {
    const pace: Record<string, number[]> = {}
    const alloy: Record<string, number> = {}
    for (const level of LEVELS) {
      const m = playing(level)
      // ALLOY in the well made at the start (rows 6-30).
      const rows = Array.from({ length: 25 }, (_, k) => k + 6)
      alloy[level] = rows.flatMap((r) => COLUMNS.filter((c) => (cell(m, c, r) & 15) === 5)).length
      // In the third stratum (SLATE).
      put(m, 'maxDepth', 200)
      frames(m, 4, cart)
      expect(read(m, 'stratum')).toBe(2)
      pace[level] = [read(m, 'airDrain'), read(m, 'wobbleFrames'), read(m, 'fallSpeed')]
    }
    // difficulty.txt's rows: air - 2 * step, wobble - 2 * step, fall + 2.
    expect(pace).toEqual({ easy: [68, 72, 9], normal: [48, 50, 10], hard: [38, 36, 12] })
    // 1%, 3% and 5% of the blocks in LOAM.
    expect(alloy.easy).toBeLessThan(alloy.normal ?? 0)
    expect(alloy.normal).toBeLessThan(alloy.hard ?? 0)
  })
})

describe('ELECDRILL telling the player', () => {
  it('pauses with the well dimmed and PAUSED, and START resumes it as it was', () => {
    const m = playing()
    frames(m, 100, cart)
    const red = colourOf(m, 1, 4)
    const panel = colourOf(m, 7, 15)
    press(m, padBit('start'), 10)
    expect(rowText(m, 16)).toContain('PAUSED')
    expect(rowText(m, 18)).toContain('START TO RESUME')
    // The well's colours darkened, the panels' kept.
    expect(colourOf(m, 1, 4)).not.toBe(red)
    expect(colourOf(m, 7, 15)).toBe(panel)
    const frame = read(m, 'frame')
    frames(m, 60, cart)
    expect(read(m, 'frame')).toBe(frame)
    press(m, padBit('start'), 10)
    expect(colourOf(m, 1, 4)).toBe(red)
    expect(rowText(m, 16)).not.toContain('PAUSED')
    expect(read(m, 'frame')).toBeGreaterThan(frame)
  })

  it("keeps a banner's band when a pause ends while it is up", () => {
    // Bug: the pause took the band away, leaving a stratum's words over the bare blocks.
    const m = playing()
    put(m, 'maxDepth', 100)
    frames(m, 10, cart)
    expect([read(m, 'bandY'), read(m, 'bandH')]).toEqual([146, 5])
    press(m, padBit('start'), 10)
    press(m, padBit('start'), 4)
    expect([read(m, 'bandY'), read(m, 'bandH')]).toEqual([146, 5])
    expect(screenText(m)).toContain('STRATUM 2')
  })

  it('calls out AIR won from a capsule and lost to ALLOY', () => {
    const m = playing()
    lay(m, 6, [EMPTY, EMPTY, '.....A...', '....X....', ...FLOOR])
    place(m, 4, 8)
    put(m, 'air', 50)
    m.pad(padBit('right'))
    frames(m, 6, cart)
    m.pad(0)
    frames(m, 4, cart)
    expect(effects(m, FX.say)).toContain(0)
    // Back on the ALLOY and four hits on it.
    place(m, 4, 8)
    for (let k = 0; k < 4; k++) press(m, padBit('b'), 10)
    expect(cell(m, 4, 9)).toBe(0)
    expect(effects(m, FX.say)).toContain(1)
  })

  it('calls out LOW AIR once, pulses the stripes red while it lasts, and puts them back', () => {
    const m = playing()
    frames(m, 30, cart)
    const orange = colourOf(m, 7, 9)
    put(m, 'air', 26)
    frames(m, 70, cart)
    expect(read(m, 'air')).toBeLessThanOrEqual(25)
    expect(effects(m, FX.say)).toEqual([2])
    const seen = new Set<number>()
    for (let k = 0; k < 32; k++) {
      frames(m, 1, cart)
      seen.add(colourOf(m, 7, 9))
    }
    expect(seen.size).toBeGreaterThan(2)
    put(m, 'air', 80)
    frames(m, 4, cart)
    expect(colourOf(m, 7, 9)).toBe(orange)
    expect(read(m, 'airWarned')).toBe(0)
  })

  it('calls out every 50 m between the strata', () => {
    const m = playing()
    // The ring moved on to 40 m, the driller over a single blue at 50 m.
    put(m, 'top', 40)
    put(m, 'camY', 48 * 16)
    lay(m, 53, [EMPTY, EMPTY, '....B....', ...FLOOR])
    place(m, 4, 54)
    put(m, 'maxDepth', 49)
    frames(m, 2, cart)
    press(m, padBit('b'), 30)
    expect(read(m, 'maxDepth')).toBe(50)
    expect(effects(m, FX.metres)).toEqual([50])
  })

  it('lets grit trickle from under a wobbling block', () => {
    const m = playing()
    lay(m, 6, [EMPTY, EMPTY, '...Y.....', '...B.....', 'YYYYGGGGG', ...FLOOR])
    place(m, 4, 9)
    put(m, 'pFace', 1)
    press(m, padBit('a'), 0)
    let grit = 0
    for (let k = 0; k < 40; k++) {
      frames(m, 1, cart)
      grit = Math.max(grit, effects(m, FX.grit).length)
    }
    expect(grit).toBeGreaterThan(0)
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
