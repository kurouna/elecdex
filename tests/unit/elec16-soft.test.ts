import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { cardOp } from '@shared/elec16/card'
import { keyCode } from '@shared/elec16/keys'
import type { Elec16 } from '@shared/elec16/machine'
import { buildSoftCard } from '@shared/elec16/soft-card'
import { fromBase64 } from '@shared/emu/base64'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { card, press, screen, settle, shown, switchOn, type } from './elec16-helpers'

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

/** LOAD and RUN on a cleared screen; the program left running or waiting. */
function load(name: string): Elec16 {
  const m = switchOn()
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
      'CLOCK.BAS',
      'HITBLOW.BAS',
      'LANDER.BAS',
      'MAZE.BAS',
      'PRIMES.BAS',
      'SINEWAVE.BAS',
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
    // Ten files on six rows: the last two, and the prompt (no room counted for this card).
    expect(shown(m).slice(-3)).toEqual([
      expect.stringMatching(/^SINEWAVE\.BAS +\d+$/),
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
})
