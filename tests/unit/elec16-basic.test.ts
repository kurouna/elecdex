import { existsSync, readFileSync } from 'node:fs'
import { compileBasic } from '@shared/e16c/basic-rom'
import { keyCode } from '@shared/elec16/keys'
import { Elec16 } from '@shared/elec16/machine'
import { buildRom } from '@shared/elec16/rom'
import { describe, expect, it } from 'vitest'
import { annunciated, press, screen, settle, shown, switchOn, type } from './elec16-helpers'

/**
 * The ROM's BASIC (resources/elec16/rom/basic, docs/elec16.md section 6), typed at as a
 * person would: each line on a cleared screen, what it printed read back.
 */

const DIR = 'resources/elec16/rom/'
const read = (name: string): string => readFileSync(`${DIR}basic/${name}`, 'utf8')

/** The rows a line printed, between its own row and the next prompt. */
function say(m: Elec16, line: string): string[] {
  press(m, keyCode('cls'))
  type(m, `${line}\n`)
  const rows = shown(m)
  // A line longer than the screen is wide takes more than one row.
  const typed = Math.ceil((line.length + 1) / 40)
  expect(rows.at(-1), line).toBe('>')
  return rows.slice(typed, -1)
}

/** A session that touches most of BASIC, line by line with what each must print. */
const SESSION: [string, string[]][] = [
  ['7/2', ['                                    3.5']],
  ['ANS*2', ['                                      7']],
  ['PRINT 1/3, 2^40', ['0.3333333333        1.099511628E12']],
  ['PRINT "A";1;"B",2', ['A1 B      2']],
  ['PRINT -2^2;2^-1', ['-4 0.5']],
  ['A=5:B=A*2:PRINT A;B', ['5 10']],
  ['X=3:IF X>2 THEN PRINT "Y" ELSE PRINT "N"', ['Y']],
  ['IF X<2 THEN PRINT "Y" ELSE PRINT "N":PRINT "M"', ['N', 'M']],
  ['IF X<2 THEN PRINT "Y":PRINT "M"', []],
  ['FOR I=5 TO 1 STEP -2:PRINT I;:NEXT:PRINT', ['5 3 1']],
  // A loop runs once before it is tested, as the BASICs of its day did.
  ['FOR I=3 TO 1:PRINT I;:NEXT I:PRINT', ['3']],
  ['PRINT ABS -3, INT -2.5, SGN -4', ['3         -3        -1']],
  ['DEG:PRINT SIN 90:RAD:PRINT SIN(PI/2)', ['1', '1']],
  ['POKE 28672,65:PRINT PEEK 28672', ['65']],
  ['NEXT', ['ERR:NEXT']],
  ['RETURN', ['ERR:RETURN']],
  ['CONT', ['ERR:CONT']],
  ['PRINT 1E99*1E99', ['ERR:OVERFLOW']],
  ['1/0', ['ERR:DIV BY 0']],
  ['GOTO 99', ['ERR:NO LINE']],
  ['PRINT SQR -1', ['ERR:ARGUMENT']],
  ['NEW', []],
  ['10 GOSUB 100', []],
  ['20 PRINT "BACK"', []],
  ['30 END', []],
  ['100 PRINT "SUB"', []],
  ['110 RETURN', []],
  ['RUN', ['SUB', 'BACK']],
  ['LIST 20', ['20 PRINT "BACK"', '30 END', '100 PRINT "SUB"', '110 RETURN']],
  ['10 PRINT Q+', []],
  ['RUN', ['ERR:SYNTAX IN 10']],
  ['NEW', []],
  ['10 FOR N=2 TO 30:FOR D=2 TO SQR N', []],
  ['30 IF N-INT(N/D)*D=0 THEN 60', []],
  ['40 NEXT D', []],
  ['50 PRINT N;', []],
  ['60 NEXT N:PRINT', []],
  ['20', ['                                     20']],
  ['RUN', ['3 5 7 11 13 17 19 23 29']],
]

describe('BASIC', () => {
  it('greets with the room left for a program, in RUN mode', () => {
    const m = switchOn()
    expect(shown(m)).toEqual(['ELEC-16 BASIC 1.0', '27646 BYTES FREE', '>'])
    expect(annunciated(m)).toEqual(['CAPS', 'RUN', 'DEG'])
  })

  it('answers a session of statements, programs and errors', () => {
    const m = switchOn('pocket-64')
    for (const [line, printed] of SESSION) expect(say(m, line), line).toEqual(printed)
  })

  it('stops a running program at BRK, and CONT goes on', () => {
    const m = switchOn('pocket-64')
    for (const line of ['10 N=N+1', '20 IF N<2000 THEN 10', '30 PRINT "DONE";N', 'RUN']) {
      type(m, line)
      if (line !== 'RUN') press(m, keyCode('enter'))
    }
    m.press(keyCode('enter'))
    m.release(keyCode('enter'))
    m.run(200_000)
    expect(annunciated(m)).toContain('BUSY')
    m.brk()
    settle(m)
    expect(shown(m).at(-2)).toMatch(/^BREAK IN (10|20)$/)
    expect(say(m, 'CONT')).toEqual(['DONE2000'])
  })

  it('reads a number for INPUT, asking again until it is one', () => {
    const m = switchOn('pocket-64')
    press(m, keyCode('cls'))
    type(m, 'INPUT "N";N:PRINT N*2\n')
    expect(shown(m).at(-1)).toBe('N?')
    type(m, 'X\n')
    expect(shown(m).at(-1)).toBe('N?')
    type(m, '-21\n')
    expect(shown(m).slice(-3)).toEqual(['N?-21', '-42', '>'])
  })

  it('switches between RUN and PRO with MODE, and in PRO a bare line number takes the line out', () => {
    const m = switchOn('pocket-64')
    type(m, '10 PRINT 1\n20 PRINT 2\n')
    press(m, keyCode('mode'))
    expect(annunciated(m)).toContain('PRO')
    type(m, '10\n')
    expect(say(m, 'LIST')).toEqual(['20 PRINT 2'])
    press(m, keyCode('mode'))
    expect(annunciated(m)).toContain('RUN')
  })

  it('keeps the program, not its variables, while switched off; RAM that holds none starts empty', () => {
    const m = switchOn('pocket-64')
    type(m, '10 PRINT "KEPT";A\nA=7\n')
    m.powerOff()
    m.brk()
    settle(m)
    expect(shown(m)).toEqual(['ELEC-16 BASIC 1.0', '27630 BYTES FREE', '>'])
    expect(say(m, 'RUN')).toEqual(['KEPT0'])
    // A line whose size runs past the room is no program.
    m.state.ram.set([0x0a, 0x00, 0xfe, 0x7f], 0x0400)
    m.powerOff()
    m.brk()
    settle(m)
    expect(say(m, 'LIST')).toEqual([])
    expect(shown(switchOn())[1]).toBe('27646 BYTES FREE')
  })

  it('keeps the program through the monitor and back', () => {
    const m = switchOn('pocket-64')
    type(m, '10 PRINT "KEPT"\nMON\n')
    expect(shown(m).at(-1)).toBe('*')
    type(m, 'Q\n')
    expect(say(m, 'RUN')).toEqual(['KEPT'])
  })

  it('is built from its sources: basic.s is what e16c makes of them at -O2', () => {
    expect(readFileSync(`${DIR}basic.s`, 'utf8')).toBe(compileBasic(read).asm)
  })

  it('answers the same session compiled at -O1, as a check on the compiler', () => {
    const asm = compileBasic(read, 1).asm
    const built = buildRom((name) =>
      name === 'basic.s' ? asm : existsSync(DIR + name) ? readFileSync(DIR + name, 'utf8') : null,
    )
    expect(built.errors).toEqual([])
    const m = Elec16.boot(built.image, 'pocket-64')
    settle(m)
    for (const [line, printed] of SESSION) expect(say(m, line), line).toEqual(printed)
    expect(screen(m)).toHaveLength(8)
  })
})
