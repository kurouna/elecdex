import { CODE_END, CODE_START, LIBRARY, MEASURE_LIMIT, SAMPLE } from '@shared/e16c/code-area'
import { buildCode, measure, measuringMachine } from '@shared/e16c/program'
import { fromMachineText, sourceFromMachine, sourceToMachine } from '@shared/elec16/charset'
import { describe, expect, it } from 'vitest'
import { built, settle, shown, switchOn, type } from './elec16-helpers'

/**
 * CODE (docs/elec16.md section 6, CODE): a person's TypeScript built at every level with the
 * library, linked for the code area, measured on a machine of its own, and run by CALL on
 * the ROM as RUN does.
 */

const snapshot = measuringMachine(built.image)

describe("CODE's programs", () => {
  it('build the sample at every level, smaller as the level rises, each returning from main', () => {
    const sizes = ([0, 1, 2] as const).map((level) => {
      const b = buildCode('MAIN.TS', SAMPLE, level)
      expect(b.errors, `-O${level}`).toEqual([])
      expect(measure(built.image, snapshot, b.image).end, `-O${level}`).toBe('returned')
      return b.image.length
    })
    expect(sizes[1]).toBeLessThan(sizes[0] ?? 0)
    expect(sizes[2]).toBeLessThan(sizes[1] ?? 0)
  })

  it('run on the ROM by CALL 28672, the library drawing on the LCD, and come back to BASIC', () => {
    const b = buildCode(
      'MAIN.TS',
      "const W = str('TS!')\nexport function main(): void { puts(W); putnum(1234); newline() }",
      2,
    )
    const m = switchOn()
    expect(m.loadCode(CODE_START, b.image)).toBe(true)
    type(m, 'CALL 28672\n')
    settle(m)
    expect(shown(m).slice(-2)).toEqual(['TS!1234', '>'])
  })

  it('say what is wrong, where: a TypeScript error, no main, too big for the code area', () => {
    const bad = buildCode('MAIN.TS', 'export function main(): void {\n  return 1 / 2\n}', 1)
    expect(bad.errors[0]).toMatchObject({ file: 'MAIN.TS', line: 2 })
    expect(bad.image).toHaveLength(0)
    expect(buildCode('MAIN.TS', 'export function go(): void {}', 1).errors[0]?.message).toMatch(
      /no main/,
    )
    // An unexported main built at -O0 and -O1 and vanished at -O2: refused alike at each.
    for (const level of [0, 1, 2] as const) {
      expect(buildCode('MAIN.TS', 'function main(): void {}', level).errors[0]?.message).toMatch(
        /main is not exported/,
      )
    }
    const lines = Array.from({ length: 400 }, (_, k) => `  poke(0x6000 + ${k}, ${k & 0xff})`)
    const big = buildCode('MAIN.TS', `export function main(): void {\n${lines.join('\n')}\n}`, 0)
    expect(big.errors[0]?.message).toMatch(
      new RegExp(`the code area holds ${CODE_END - CODE_START}`),
    )
  })

  it('measure a program that waits for a key, and one that never ends, without hanging', () => {
    const waits = buildCode('MAIN.TS', 'export function main(): void { getkey() }', 2)
    expect(measure(built.image, snapshot, waits.image).end).toBe('waits')
    const spins = buildCode('MAIN.TS', 'export function main(): void { for (;;) {} }', 2)
    const forever = measure(built.image, snapshot, spins.image)
    expect(forever.end).toBe('limit')
    expect(forever.cycles).toBeGreaterThanOrEqual(MEASURE_LIMIT)
  })

  it('keep the library to what e16c takes: it compiles on its own at every level', () => {
    for (const level of [0, 1, 2] as const) {
      const b = buildCode('MAIN.TS', `${LIBRARY}\nexport function main(): void {}`, level)
      // The library twice is a name defined twice: once is what every program gets.
      expect(b.errors[0]?.message ?? '', `-O${level}`).toMatch(/declared twice|defined twice/)
    }
  })
})

describe('a source kept on the card', () => {
  it('keeps every line, blank ones too, and reads back as it was', () => {
    const text = 'export function main(): void {\n\n  putc(65)\n}\n'
    const made = sourceToMachine(text)
    if ('problem' in made) throw new Error(made.problem)
    expect(sourceFromMachine(made.bytes)).toBe(text)
    // EXPORT writes it as a PC's text.
    expect(fromMachineText(made.bytes)).toBe(
      'export function main(): void {\r\n\r\n  putc(65)\r\n}\r\n',
    )
    expect(sourceToMachine('// 漢字')).toMatchObject({ problem: expect.stringMatching(/Line 1/) })
  })
})
