import { existsSync, readFileSync } from 'node:fs'
import { compileSci, sciRomFile } from '@shared/e16c/sci-rom'
import { REG } from '@shared/elec16/bus'
import { screenText } from '@shared/elec16/font'
import { Elec16 } from '@shared/elec16/machine'
import { MODELS } from '@shared/elec16/map'
import { buildRom, romFile, romFromFile } from '@shared/elec16/rom'
import { SCI_KEYS, SCI_NAME_LENGTH, sciKeyCode } from '@shared/elec16/sci-keys'
import { SCI_ANNUNCIATORS } from '@shared/elec16/state'
import { describe, expect, it } from 'vitest'
import sciJson from '../../src/renderer/widgets/elec16/sci-rom.json'
import { settle } from './elec16-helpers.js'

/**
 * The ELEC-16 SCI ROM as S2 has it (resources/elec16/sci, docs/elec16-sci.md): reset, the
 * ROM services on the 128 x 64 LCD, and a start screen that names each key pressed, with
 * SHIFT and ALPHA lighting their marks. The calculator itself comes in S3.
 */

const DIR = 'resources/elec16/sci/'
const read = (name: string) => (existsSync(DIR + name) ? readFileSync(DIR + name, 'utf8') : null)
const built = buildRom((name) => {
  const file = `resources/elec16/${sciRomFile(name)}`
  return existsSync(file) ? readFileSync(file, 'utf8') : null
})

const switchOn = (): Elec16 => {
  const m = Elec16.boot(built.image, 'sci-128')
  settle(m)
  return m
}
const screen = (m: Elec16): string[] =>
  screenText(m.state.vram, 128, 64).map((row) => row.trimEnd())
const tap = (m: Elec16, id: string) => {
  const code = sciKeyCode(id)
  m.press(code)
  m.release(code)
  settle(m)
}
const lit = (m: Elec16): string[] =>
  SCI_ANNUNCIATORS.filter((_, bit) => (m.state.lcd.annunciators & (1 << bit)) !== 0)

describe('the SCI ROM file', () => {
  it('is what the sources build now (run npm run gen:elec16 after changing them)', () => {
    const sci = compileSci((name) => read(name) ?? '')
    expect(sci.errors).toEqual([])
    expect(read('sci.s')).toBe(sci.asm)
    expect(built.errors).toEqual([])
    expect(sciJson).toEqual(romFile(built))
    expect(romFromFile(sciJson)).toEqual(built.image)
  })

  it('says what the e16c source says of the machine as the machine has it', () => {
    const source = read('sci.e16.ts') ?? ''
    const constant = (name: string) =>
      Number(source.match(new RegExp(`const ${name} = (\\w+)`))?.[1])
    const bit = (name: string) =>
      1 << SCI_ANNUNCIATORS.indexOf(name as (typeof SCI_ANNUNCIATORS)[number])
    expect(constant('IO_ANNUNCIATORS')).toBe(REG.annunciators)
    expect(constant('WIDTH')).toBe(MODELS['sci-128'].width)
    expect(constant('BANDS')).toBe(MODELS['sci-128'].height / 8)
    expect([constant('ANN_S'), constant('ANN_A'), constant('ANN_D')]).toEqual([
      bit('S'),
      bit('A'),
      bit('D'),
    ])
    expect([constant('KEY_SHIFT'), constant('KEY_ALPHA')]).toEqual([
      sciKeyCode('shift'),
      sciKeyCode('alpha'),
    ])
    expect(constant('NAME_LENGTH')).toBe(SCI_NAME_LENGTH)
  })
})

describe('the start screen', () => {
  it('names the machine and waits for a key, asleep, with DEG lit', () => {
    const m = switchOn()
    expect(screen(m).slice(0, 5)).toEqual([
      '',
      '     ELEC-16 SCI',
      '       SCI-128',
      '',
      '     PRESS A KEY',
    ])
    expect(m.state.sleeping).toBe(true)
    expect(lit(m)).toEqual(['D'])
  })

  it('names every key by its own name and code', () => {
    const m = switchOn()
    for (const k of SCI_KEYS.filter((k) => k.id !== 'shift' && k.id !== 'alpha')) {
      tap(m, k.id)
      expect(screen(m)[5], k.id).toBe(
        `KEY ${k.name} ${k.code.toString(16).toUpperCase().padStart(4, '0')}`,
      )
    }
  })

  it('lights S or A while SHIFT or ALPHA waits, each letting the other go, and the next key both', () => {
    const m = switchOn()
    tap(m, 'shift')
    expect(lit(m)).toEqual(['S', 'D'])
    tap(m, 'alpha')
    expect(lit(m)).toEqual(['A', 'D'])
    tap(m, 'alpha')
    expect(lit(m)).toEqual(['D'])
    tap(m, 'shift')
    tap(m, 'sin')
    expect(screen(m)[5]).toBe(
      `KEY S SIN ${sciKeyCode('sin').toString(16).toUpperCase().padStart(4, '0')}`,
    )
    expect(lit(m)).toEqual(['D'])
  })

  it('comes back drawn afresh on ON (BRK), saying nothing of a break it slept through', () => {
    const m = switchOn()
    tap(m, '7')
    m.brk()
    settle(m)
    expect(screen(m)[5]).toBe('')
    expect(screen(m)[7]).toBe('')
    expect(screen(m)[1]).toBe('     ELEC-16 SCI')
  })
})
