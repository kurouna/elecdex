import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { cardOp } from '@shared/elec16/card'
import { keyCode } from '@shared/elec16/keys'
import { LINK_STATUS } from '@shared/elec16/link-services'
import type { Elec16 } from '@shared/elec16/machine'
import { MODELS, type ModelId } from '@shared/elec16/map'
import { buildSoftCard } from '@shared/elec16/soft-card'
import { fromBase64 } from '@shared/emu/base64'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { card, linkService, press, screen, settle, shown, switchOn, type } from './elec16-helpers'

/**
 * The SOFT CARD (docs/elec16.md section 6): soft.json is what its sources make, and every
 * program on it runs on the ROM - loaded by name as main would serve it, given the input it
 * asks for, and ending (or ended by a key) without an error.
 */

const DIR = 'resources/elec16/soft/'
const sources = readdirSync(DIR)
  .filter((name) => /\.(bas|asm)$/i.test(name))
  .map((name) => {
    const help = `${DIR}${name.replace(/[.][a-z]+$/i, '.help')}`
    return {
      name,
      text: readFileSync(`${DIR}${name}`, 'utf8'),
      help: existsSync(help) ? readFileSync(help, 'utf8') : '',
    }
  })
const built = buildSoftCard(sources)

beforeAll(() => {
  card.files = []
  card.soft = built.files
})
afterAll(() => {
  card.soft = []
})

/** A program that never waits for a key, run for a while, as the page would. */
function runFor(m: Elec16, cycles: number): void {
  for (let left = cycles; left > 0; ) {
    const r = m.run(Math.min(left, 100_000))
    left -= Math.max(1, r.cycles)
    const request = m.takeCardRequest()
    if (request !== null) m.answerCard(request, cardOp(card.files, request, 0, card.soft).answer)
    // Waiting for a key and nothing else: there is nothing to run until one comes.
    if (r.sleeping !== null && r.sleeping.timerMs === null) return
    if (r.sleeping !== null) m.advance(Math.max(1, r.sleeping.timerMs ?? 1))
  }
}

/** LOAD on a cleared screen, on the default LCD or the one named: ready for RUN. */
function load(name: string, model?: ModelId): Elec16 {
  const m = switchOn(model)
  type(m, `LOAD "${name}"\n`)
  expect(shown(m).at(-1), name).toBe('>')
  press(m, keyCode('cls'))
  return m
}

const errors = (m: Elec16): string[] => screen(m).filter((row) => row.includes('ERR'))

describe('the SOFT CARD', () => {
  it('is what its sources make, every one of them', () => {
    expect(built.errors).toEqual([])
    expect(built.files.map((f) => f.name)).toEqual([
      'ASMDEMO.BIN',
      'BIORHYTH.BAS',
      'BOUNCE.BAS',
      'CANNON.BAS',
      'CHAT.BAS',
      'CLOCK.BAS',
      'HITBLOW.BAS',
      'LANDER.BAS',
      'MAZE.BAS',
      'PRIMES.BAS',
      'SINEWAVE.BAS',
      'TICKER.BIN',
      'UNITS.BAS',
    ])
    const file = JSON.parse(readFileSync('resources/elec16/soft.json', 'utf8')) as {
      files: { name: string; about: string; help: string; data: string }[]
    }
    expect(file.files.map((f) => ({ ...f, data: fromBase64(f.data) }))).toEqual(
      built.files.map((f) => ({ name: f.name, about: f.about, help: f.help, data: f.data })),
    )
    // Every program says how to use it, which FILES shows when it is picked.
    for (const f of built.files) expect(f.help, f.name).toMatch(/\S/)
    expect(built.files.find((f) => f.name === 'PRIMES.BAS')?.about).toBe(
      'THE PRIMES UP TO A NUMBER',
    )
  })

  it('refuses a program with no help beside it, or too long a one', () => {
    const text = '10 PRINT 1'
    expect(buildSoftCard([{ name: 'a.bas', text, help: '' }]).errors[0]).toMatch(/no .help/)
    expect(buildSoftCard([{ name: 'b.bas', text, help: 'x'.repeat(401) }]).errors[0]).toMatch(
      /over 400/,
    )
  })

  it('is listed by FILES "SOFT", and FILES alone lists the card', () => {
    const m = switchOn()
    press(m, keyCode('cls'))
    type(m, 'FILES "SOFT"\n')
    // Twelve files on six rows: the last two, and the prompt (no room counted for this card).
    expect(shown(m).slice(-3)).toEqual([
      expect.stringMatching(/^TICKER\.BIN +\d+$/),
      expect.stringMatching(/^UNITS\.BAS +\d+$/),
      '>',
    ])
    press(m, keyCode('cls'))
    type(m, 'FILES\n')
    expect(shown(m).slice(1)).toEqual(['256 KB FREE', '>'])
    press(m, keyCode('cls'))
    type(m, 'FILES "OTHER"\n')
    expect(shown(m).slice(1)).toEqual(['ERR:NO FILE', '>'])
  })

  it('runs PRIMES and UNITS on what they ask for', () => {
    const m = load('PRIMES')
    type(m, 'RUN\n30\n')
    expect(shown(m).slice(-3)).toEqual(['UP TO?30', '2 3 5 7 11 13 17 19 23 29', '>'])
    const u = load('UNITS')
    type(u, 'RUN\n1\n10\n4\n212\n0\n')
    expect(errors(u)).toEqual([])
    expect(screen(u).join('\n')).toMatch(/25\.4 CM[\s\S]*100 C/)
    expect(shown(u).at(-1)).toBe('>')
  })

  it('lands or crashes LANDER, plays a round of HIT&BLOW and works out a BIORHYTHM', () => {
    const m = load('LANDER')
    type(m, 'RUN\n')
    for (let k = 0; k < 40 && shown(m).at(-1) !== '>'; k++) type(m, '20\n')
    expect(screen(m).join('\n')).toMatch(/LANDED SAFELY|CRASHED AT/)
    // A landing there is: with 150 units no burn could ever slow it enough in time.
    const won = load('LANDER')
    type(won, 'RUN\n')
    for (const burn of [10, 10, 10, 10, 10, 10, 10, 15, 25, 30, 30, 30, 25]) type(won, `${burn}\n`)
    expect(shown(won).slice(-2)).toEqual(['LANDED SAFELY IN 13 SECONDS', '>'])
    const h = load('HITBLOW')
    type(h, 'RUN\n012\n')
    expect(shown(h).slice(-2)).toEqual([expect.stringMatching(/^\d HIT \d BLOW$/), 'GUESS?'])
    const b = load('BIORHYTH')
    type(b, 'RUN\n1990\n4\n1\n')
    expect(errors(b)).toEqual([])
    expect(shown(b).slice(-2)).toEqual([expect.stringMatching(/^INTELLECT +-?\d+ %$/), '>'])
  })

  it('runs the programs that go on until a key, and a key ends each', () => {
    for (const name of ['BOUNCE', 'CLOCK', 'MAZE', 'SINEWAVE']) {
      const m = load(name)
      type(m, 'RUN')
      // press settles, which a machine that never waits for a key never does: run here.
      m.press(keyCode('enter'))
      m.release(keyCode('enter'))
      runFor(m, 3_000_000)
      expect(errors(m), name).toEqual([])
      m.press(keyCode('a'))
      m.release(keyCode('a'))
      runFor(m, 3_000_000)
      settle(m)
      // The prompt, where the program left the cursor (over its drawing, for some).
      expect(shown(m).at(-1), name).toMatch(/^>/)
    }
  })

  it('runs ASMDEMO, machine code from the card', () => {
    const m = load('ASMDEMO.BIN')
    // A screen full of what was typed before, as after a few LOADs.
    for (const n of [1, 2, 3]) type(m, `PRINT ${n}${'0'.repeat(30)}\n`)
    type(m, 'CALL 28672\n')
    // On a cleared screen, the prompt under the words: nothing typed before is left to mix
    // with what is typed next.
    const rows = screen(m)
    expect(rows.slice(0, -1)).toEqual([
      'DRAWN BY MACHINE CODE',
      '>',
      ...rows.slice(2, -1).map(() => ''),
    ])
    expect(rows.at(-1)).toMatch(/^\?+$/)
    expect(errors(m)).toEqual([])
  })

  it('aims and fires CANNON on three LCDs: the right angle hits, Q ends it, five shots end it', () => {
    for (const model of ['pocket-32', 'pocket-48', 'handheld-160'] as const) {
      const m = load('CANNON', model)
      type(m, 'RUN')
      tap(m, keyCode('enter'), 2_000_000)
      expect(screen(m)[0], model).toBe('SHOT1 ANGLE45 HITS0')
      const angle = aim(m)
      expect(screen(m)[0], model).toBe(`SHOT1 ANGLE${angle} HITS0`)
      tap(m, keyCode(' '))
      runUntilRow(m, 'SHOT2')
      expect(screen(m)[0], model).toBe(`SHOT2 ANGLE${angle} HITS1`)
      expect(errors(m), model).toEqual([])
      // Q ends it: the prompt on a cleared screen.
      tap(m, keyCode('q'))
      settle(m)
      expect(shown(m), model).toEqual(['>'])
    }
    // Five shots, aimed nowhere in particular, end it with the score.
    const m = load('CANNON')
    type(m, 'RUN')
    tap(m, keyCode('enter'), 2_000_000)
    for (let shot = 1; shot <= 5; shot++) {
      tap(m, keyCode(' '))
      runUntilRow(m, shot < 5 ? `SHOT${shot + 1}` : 'OF 5')
    }
    expect(errors(m)).toEqual([])
    expect(shown(m)).toEqual([expect.stringMatching(/^HITS \d OF 5$/), '>'])
  })

  it('rolls what is typed into TICKER round the middle row by MCPY, and a key ends it', () => {
    for (const model of ['pocket-32', 'handheld-160'] as const) {
      const { width, height, depth } = MODELS[model]
      const m = load('TICKER.BIN', model)
      type(m, 'CALL 28672\n')
      expect(shown(m), model).toEqual(['TEXT?'])
      type(m, 'HELLO')
      m.press(keyCode('enter'))
      m.release(keyCode('enter'))
      roll(m, 0)
      const row = (height / 8) >> 1
      expect(screen(m)[row], model).toBe('HELLO')
      // The row's band in every plane as written: what the moves go round.
      const plane = (width * height) / 8
      const bands = Array.from({ length: depth }, (_, p) =>
        Array.from(m.state.vram.slice(p * plane + row * width, p * plane + (row + 1) * width)),
      )
      roll(m, 6)
      expectRolled(m, row, bands, 6)
      // A character to the left; on the 240-wide LCD (40 cells) the H has come round whole.
      if (model === 'pocket-32') expect(screen(m)[row]).toBe(`ELLO${' '.repeat(35)}H`)
      roll(m, width - 6)
      expectRolled(m, row, bands, 0)
      expect(screen(m)[row], model).toBe('HELLO')
      expect(
        screen(m)
          .filter((_, r) => r !== row)
          .join(''),
        model,
      ).toBe('')
      m.press(keyCode('a'))
      m.release(keyCode('a'))
      runFor(m, 1_000_000)
      settle(m)
      // The key that ended it was taken, not typed at the prompt, on a cleared screen.
      expect(shown(m), model).toEqual(['>'])
    }
    // ENTER alone rolls the machine's own words, and CLS at the question leaves at once.
    const m = load('TICKER.BIN')
    type(m, 'CALL 28672\n')
    m.press(keyCode('enter'))
    m.release(keyCode('enter'))
    roll(m, 0)
    expect(screen(m)[3]).toBe('ELEC-16 POCKET COMPUTER')
    m.press(keyCode('enter'))
    m.release(keyCode('enter'))
    runFor(m, 1_000_000)
    settle(m)
    type(m, 'CALL 28672\n')
    press(m, keyCode('cls'))
    expect(shown(m)).toEqual(['>'])
    expect(errors(m)).toEqual([])
  })

  it('talks with the AI in CHAT: a type chosen, the answer typed out and wrapped, the menu', () => {
    const said = (q: string) => `THE ANSWER TO ${q} IS A LONG ONE THAT GOES ON PAST THE LINE END`
    linkService.asked = []
    linkService.answer = (r) => ({
      status: LINK_STATUS.ready,
      data: new Uint8Array([...said(String.fromCharCode(...r.query))].map((c) => c.charCodeAt(0))),
    })
    try {
      for (const model of ['pocket-48', 'handheld-160'] as const) {
        const columns = MODELS[model].width / 6
        const m = load('CHAT', model)
        type(m, 'RUN\n')
        expect(screen(m)[0], model).toBe('CHAT: CHOOSE A TYPE')
        expect(screen(m).join(' '), model).toMatch(/ 3 QUIZ .*10 WEATHER/)
        type(m, '3\n')
        expect(screen(m)[0], model).toBe('QUIZ: ENTER ALONE=MENU')
        type(m, 'HELLO\n')
        expect(linkService.asked.at(-1), model).toMatchObject({ type: 3, max: 255 })
        // Typed out a word at a time to the screen's width, never a word cut in two.
        const rows = screen(m)
          .slice(2)
          .filter((row) => row !== '' && !row.startsWith('?'))
        expect(rows.join(' '), model).toBe(said('HELLO'))
        for (const row of rows) expect(row.length, model).toBeLessThanOrEqual(columns)
        type(m, '\n2\n')
        type(m, 'AGAIN\n')
        expect(linkService.asked.at(-1)?.fresh, model).toBe(true)
        type(m, '\n3\n')
        expect(shown(m), model).toEqual(['>'])
        expect(errors(m), model).toEqual([])
      }
    } finally {
      linkService.answer = null
    }
  })
})

/**
 * A key pressed and let go, and the program run on for a while, as the page would: for a
 * program that reads keys as it goes (INKEY$) and so never waits on one alone.
 */
function tap(m: Elec16, code: number, cycles = 1_000_000): void {
  m.press(code)
  m.release(code)
  runFor(m, cycles)
}

/** Whether the dot (x, y) is lit, in the first plane. */
function lit(m: Elec16, x: number, y: number): boolean {
  const { width } = MODELS[m.state.model]
  return (((m.state.vram[(y >> 3) * width + x] ?? 0) >> (y & 7)) & 1) === 1
}

/** Runs on until the first row says `text`: a shot's flight, at most. */
function runUntilRow(m: Elec16, text: string): void {
  for (let k = 0; k < 40 && !screen(m)[0]?.includes(text); k++) runFor(m, 1_000_000)
  expect(screen(m)[0], text).toContain(text)
}

/**
 * The angle at which CANNON's shell comes nearest the target's centre, flown as the program
 * flies it (4 dots a frame, gravity 16 / width), from 1 to 89 degrees.
 */
function aimAt(width: number, height: number, target: number, radius: number): number {
  const centre = height - radius - 1
  let best = { angle: 45, distance: Number.POSITIVE_INFINITY }
  for (let angle = 1; angle <= 89; angle++) {
    const rad = (angle * Math.PI) / 180
    const vx = Math.cos(rad) * 4
    let vy = -Math.sin(rad) * 4
    let x = 0
    let y = height - 2
    for (;;) {
      x += vx
      vy += 16 / width
      y += vy
      const distance = Math.hypot(x - target, y - centre)
      if (distance < best.distance) best = { angle, distance }
      if (distance <= radius || x >= width || y >= height - 1) break
    }
  }
  return best.angle
}

/**
 * CANNON aimed at its target, read off the screen (the filled circle on the ground in the
 * right half): up and down turn the barrel by five degrees, right and left by one. The angle
 * it was turned to.
 */
function aim(m: Elec16): number {
  const { width, height } = MODELS[m.state.model]
  const radius = Math.floor(height / 16) + 1
  const xs: number[] = []
  for (let x = width / 2; x < width; x++) if (lit(m, x, height - radius - 1)) xs.push(x)
  expect(xs.length).toBe(2 * radius + 1)
  const angle = aimAt(width, height, ((xs[0] ?? 0) + (xs.at(-1) ?? 0)) / 2, radius)
  const fives = Math.trunc((angle - 45) / 5)
  const ones = angle - 45 - fives * 5
  for (let k = 0; k < Math.abs(fives); k++) tap(m, keyCode(fives > 0 ? 'up' : 'down'))
  for (let k = 0; k < Math.abs(ones); k++) tap(m, keyCode(ones > 0 ? 'right' : 'left'))
  return angle
}

/**
 * TICKER's loop: run to its next sleep on the timer, letting the timer go off `moves`
 * times on the way, so the row has moved that many dots.
 */
function roll(m: Elec16, moves: number): void {
  for (let i = 0; i <= moves; i++) {
    let r = m.run(100_000)
    for (let k = 0; r.sleeping === null && k < 50; k++) r = m.run(100_000)
    if (r.sleeping?.timerMs == null) throw new Error('TICKER does not sleep on the timer')
    if (i < moves) m.advance(r.sleeping.timerMs)
  }
}

/** The row's band in every plane is what was written, moved round by so many bytes. */
function expectRolled(m: Elec16, row: number, bands: number[][], by: number): void {
  const { width, height } = MODELS[m.state.model]
  const plane = (width * height) / 8
  for (const [p, band] of bands.entries()) {
    const now = Array.from(
      m.state.vram.slice(p * plane + row * width, p * plane + (row + 1) * width),
    )
    expect(now, `plane ${p}`).toEqual(band.map((_, i) => band[(i + by) % width]))
  }
}
