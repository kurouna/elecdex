import { existsSync, readFileSync } from 'node:fs'
import { compileBasic } from '@shared/e16c/basic-rom'
import { keyCode } from '@shared/elec16/keys'
import { Elec16 } from '@shared/elec16/machine'
import { buildRom } from '@shared/elec16/rom'
import { describe, expect, it } from 'vitest'
import { annunciated, card, press, screen, settle, shown, switchOn, type } from './elec16-helpers'

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

/** The second half (phase 4): strings, arrays, DATA, ON, the tools. */
const SESSION2: [string, string[]][] = [
  ['NEW', []],
  ['A$="HELLO":PRINT A$;" ";LEN(A$)', ['HELLO 5']],
  ['PRINT LEFT$(A$,2);MID$(A$,2,3);RIGHT$(A$,2);MID$(A$,9)', ['HEELLLO']],
  ['B$=A$+"!":PRINT B$, B$="HELLO!", A$<B$, "B">"AB"', ['HELLO!    1         1         1']],
  ['PRINT CHR$(65);ASC("B");VAL(" -12.5")*2;STR$(7)+"X";VAL("Z")', ['A66 -25 7X0']],
  ['DIM C(5),D$(2)*4:C(5)=9:D$(1)="ABCDEFG":PRINT C(5);D$(1);LEN(D$(1))', ['9 ABCD4']],
  ['E(3)=4:F(1,2)=5:PRINT E(3)+F(1,2);F(0,0)', ['9 0']],
  ['DIM G$*30:G$="A LONGER STRING THAN SIXTEEN":PRINT LEN(G$)', ['28']],
  ['H$="ABCDEFGHIJKLMNOPQRSTUVWXYZ":PRINT H$', ['ABCDEFGHIJKLMNOP']],
  ['PRINT C(6)', ['ERR:INDEX']],
  ['PRINT F(1)', ['ERR:INDEX']],
  ['DIM C(2)', ['ERR:DIM']],
  ['PRINT 1+"A"', ['ERR:TYPE']],
  ['A$=1', ['ERR:TYPE']],
  ['PRINT LCDW;LCDH', ['240 64']],
  ['10 DATA 1,"TWO,2",ON:READ X,Y$,Z$:PRINT X;Y$;Z$', []],
  ['20 READ W', []],
  ['RUN', ['1 TWO,2ON', 'ERR:NO DATA IN 20']],
  ['20 RESTORE:READ W:PRINT W', []],
  ['30 ON 2 GOSUB 50,60:ON 9 GOTO 50:END', []],
  ['50 PRINT "FIVE":RETURN', []],
  ['60 PRINT "SIX":RETURN', []],
  ['RUN', ['1 TWO,2ON', '1', 'SIX']],
  ['RENUM 100,30,5', []],
  [
    'LIST 20',
    [
      '20 RESTORE:READ W:PRINT W',
      '100 ON 2 GOSUB 105,110:ON 9 GOTO 105:END',
      '105 PRINT "FIVE":RETURN',
      '110 PRINT "SIX":RETURN',
    ],
  ],
  ['DELETE 105-', []],
  ['LIST 100', ['100 ON 2 GOSUB 105,110:ON 9 GOTO 105:END']],
  ['TRON:RUN 20:TROFF', ['[20]1', '[100]', 'ERR:NO LINE IN 100']],
  ['X=5:CLEAR:PRINT X', ['0']],
]

describe('BASIC', () => {
  it('greets with the room left for a program, in RUN mode', () => {
    const m = switchOn()
    expect(shown(m)).toEqual(['ELEC-16 BASIC 1.0', '26622 BYTES FREE', '>'])
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
    expect(shown(m)).toEqual(['ELEC-16 BASIC 1.0', '26606 BYTES FREE', '>'])
    expect(say(m, 'RUN')).toEqual(['KEPT0'])
    // A line whose size runs past the room is no program.
    m.state.ram.set([0x0a, 0x00, 0xfe, 0x7f], 0x0800)
    m.powerOff()
    m.brk()
    settle(m)
    expect(say(m, 'LIST')).toEqual([])
    expect(shown(switchOn())[1]).toBe('26622 BYTES FREE')
  })

  it('edits the line being typed: arrows move, typing writes over, INS opens, DEL and BS take out', () => {
    const m = switchOn('pocket-64')
    press(m, keyCode('cls'))
    type(m, 'PRINT 12')
    for (const key of ['left', 'left'] as const) press(m, keyCode(key))
    type(m, '3')
    expect(shown(m)).toEqual(['>PRINT 32'])
    expect(m.state.lcd.cursor & 0xff).toBe(8)
    press(m, keyCode('ins'))
    type(m, '1')
    expect(shown(m)).toEqual(['>PRINT 312'])
    press(m, keyCode('del'))
    expect(shown(m)).toEqual(['>PRINT 31'])
    press(m, keyCode('right'))
    press(m, keyCode('bs'))
    type(m, '4\n')
    expect(shown(m)).toEqual(['>PRINT 34', '34', '>'])
  })

  it('wraps a long line and keeps editing it where it went, scrolling with it', () => {
    const m = switchOn('pocket-32')
    press(m, keyCode('cls'))
    type(m, '\n\n\n')
    type(m, `PRINT ${'1'.repeat(50)}`)
    // The line ran past the screen's last row, which scrolled up under it.
    expect(screen(m).slice(-2)).toEqual([`>PRINT ${'1'.repeat(33)}`, '1'.repeat(17)])
    for (let k = 0; k < 45; k++) press(m, keyCode('left'))
    expect(m.state.lcd.cursor).toBe((2 << 8) | 12)
    press(m, keyCode('del'))
    expect(screen(m).slice(-2)).toEqual([`>PRINT ${'1'.repeat(33)}`, '1'.repeat(16)])
    type(m, '\n')
    expect(screen(m).slice(-2)).toEqual(['1.111111111E48', '>'])
  })

  it('calls back the last line in RUN with up, to run again or change', () => {
    const m = switchOn('pocket-64')
    expect(say(m, '7*6').map((l) => l.trim())).toEqual(['42'])
    press(m, keyCode('cls'))
    press(m, keyCode('up'))
    expect(shown(m)).toEqual(['>7*6'])
    type(m, '+1\n')
    expect(shown(m).map((l) => l.trim())).toEqual(['>7*6+1', '43', '>'])
  })

  it('in PRO calls program lines up and down to edit, the line just typed first', () => {
    const m = switchOn('pocket-64')
    press(m, keyCode('mode'))
    type(m, '10 A=1\n20 PRINT "B";A\n30 END\n')
    press(m, keyCode('cls'))
    press(m, keyCode('up'))
    expect(shown(m)).toEqual(['>30 END'])
    press(m, keyCode('up'))
    expect(shown(m).at(-1)).toBe('>20 PRINT "B";A')
    press(m, keyCode('up'))
    press(m, keyCode('up'))
    expect(shown(m).at(-1)).toBe('>10 A=1')
    press(m, keyCode('down'))
    expect(shown(m).at(-1)).toBe('>20 PRINT "B";A')
    // Changed and entered: line 20 is the new text.
    press(m, keyCode('bs'))
    type(m, 'A*2\n')
    expect(say(m, 'RUN')).toEqual(['B2'])
    // A changed number keeps both lines.
    press(m, keyCode('cls'))
    press(m, keyCode('up'))
    for (let k = 0; k < 15; k++) press(m, keyCode('left'))
    type(m, '5\n')
    expect(say(m, 'LIST')).toEqual(['10 A=1', '20 PRINT "B";A*2', '25 PRINT "B";A*2', '30 END'])
  })

  it('lists text after REM and inside quotes as it is, never as keywords', () => {
    const m = switchOn('pocket-64')
    // A kana is a byte from A1 up, where the tokens are too.
    // 10 REM, then 0xB4 0x8E; 20 PRINT "0x8E" - SIN and GOTO, were they read as tokens.
    m.state.ram.set(
      [10, 0, 8, 0, 0x93, 0xb4, 0x8e, 0, 20, 0, 10, 0, 0x84, 0x22, 0x8e, 0x22, 0, 0, 0, 0],
      0x0800,
    )
    m.powerOff()
    m.brk()
    settle(m)
    const listed = say(m, 'LIST')
    expect(listed.map((l) => l.length)).toEqual([8, 11])
    expect(listed.join(' ')).not.toMatch(/SIN|GOTO/)
    expect(listed[1]?.startsWith('20 PRINT"')).toBe(true)
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

  it('answers a session of its second half: strings, arrays, DATA, ON, RENUM, DELETE, TRON', () => {
    const m = switchOn('pocket-64')
    for (const [line, printed] of SESSION2) expect(say(m, line), line).toEqual(printed)
  })

  it('keeps programs, machine code and data files on the card, and says what is wrong', () => {
    card.files = []
    const m = switchOn('pocket-64')
    const steps: [string, string[]][] = [
      ['10 PRINT "SAVED";2', []],
      ['SAVE "PROG"', []],
      ['NEW', []],
      ['LOAD "PROG"', []],
      ['RUN', ['SAVED2']],
      ['LOAD "NONE"', ['ERR:NO FILE']],
      // A file that is not there costs nothing: the program is still the one loaded.
      ['LIST', ['10 PRINT "SAVED";2']],
      ['OPEN "D" FOR OUTPUT AS #1:PRINT #1,"AB",12:PRINT #1,3:CLOSE', []],
      ['OPEN "D" FOR APPEND AS 1:PRINT #1,"MORE":CLOSE #1', []],
      [
        'OPEN "D" FOR INPUT AS #2:INPUT #2,X$,Y,Z,W$:PRINT X$;Y;Z;W$;EOF(2):CLOSE',
        ['AB12 3 MORE1'],
      ],
      ['POKE 28672,7:POKE 28673,8:SAVE "M.BIN",28672,2', []],
      ['POKE 28672,0:LOAD "M.BIN":PRINT PEEK 28672;PEEK 28673', ['7 8']],
      ['KILL "PROG":FILES', ['D.DAT        13', 'M.BIN        2', '255 KB FREE']],
      ['SAVE "BAD NAME"', ['ERR:FILE']],
      ['OPEN "D" FOR INPUT AS #3', ['ERR:FILE']],
      ['PRINT #1,"X"', ['ERR:FILE']],
    ]
    for (const [line, printed] of steps) expect(say(m, line), line).toEqual(printed)
    const text = (name: string) =>
      new TextDecoder().decode(card.files.find((f) => f.name === name)?.data)
    expect(text('D.DAT')).toBe('AB,12\r3\rMORE\r')
    // A listing is text on the card: a line a CR, as a PC reads it.
    type(m, 'SAVE "P2"\n')
    expect(text('P2.BAS')).toBe('10 PRINT "SAVED";2\r')
  })

  it('draws dots, lines and boxes, and reads them back with POINT', () => {
    const m = switchOn('pocket-64')
    expect(say(m, 'PSET 3,60:PRINT POINT(3,60);POINT(4,60)')).toEqual(['1 0'])
    expect(say(m, 'LINE (0,62)-(9,62):PRINT POINT(9,62);POINT(10,62)')).toEqual(['1 0'])
    expect(say(m, 'LINE (20,50)-(24,54),BF:PRINT POINT(22,52);POINT(25,52)')).toEqual(['1 0'])
    expect(say(m, 'LINE (20,50)-(24,54),B:PRINT POINT(22,52);POINT(24,52)')).toEqual(['0 1'])
    expect(say(m, 'PSET 3,60:PRESET 3,60:PRINT POINT(3,60)')).toEqual(['0'])
    // A dot off the screen is nothing, not an error.
    expect(say(m, 'PSET 999,999:PRINT POINT(-1,0)')).toEqual(['0'])
  })

  it('gives the buzzer a tone for BEEP, waits it out, and WAITs on the timer', () => {
    const m = switchOn('pocket-64')
    const before = m.state.time
    expect(say(m, 'BEEP 880,200:PRINT "DONE"')).toEqual(['DONE'])
    expect(m.state.buzzer).toMatchObject({ freq: 880, duration: 200 })
    expect(m.state.time - before).toBeGreaterThanOrEqual(200)
    const waited = m.state.time
    expect(say(m, 'WAIT 32:PRINT "AFTER"')).toEqual(['AFTER'])
    expect(m.state.time - waited).toBeGreaterThanOrEqual(500)
    // The timer is left as it was found: the prompt sleeps for keys alone.
    expect(m.run(1000).sleeping).toEqual({ key: true, timerMs: null })
  })

  it('sleeps through WAIT with a key waiting for INKEY$, never spinning on it', () => {
    const m = switchOn('pocket-64')
    type(m, '10 WAIT 64:PRINT INKEY$\n')
    type(m, 'RUN')
    m.press(keyCode('enter'))
    m.release(keyCode('enter'))
    m.run(200_000)
    m.press(keyCode('q'))
    m.release(keyCode('q'))
    // Once into the wait, the machine sleeps on the timer, the key left in the FIFO.
    const r = m.run(200_000)
    expect(r.sleeping).toEqual({ key: false, timerMs: expect.any(Number) })
    expect(r.cycles).toBeLessThan(5_000)
    settle(m)
    expect(shown(m).slice(-2)).toEqual(['Q', '>'])
  })

  it('reads the clock for TIME$ and DATE$, and a key waiting for INKEY$', () => {
    const m = switchOn('pocket-64')
    m.setClock({ second: 5, minute: 4, hour: 13, day: 2, month: 10, year: 2026, weekday: 5 })
    expect(say(m, 'PRINT TIME$;" ";DATE$')).toEqual(['13:04:05 2026-10-02'])
    expect(say(m, 'K$=INKEY$:PRINT LEN(K$)')).toEqual(['0'])
  })

  it('offers each next line number with AUTO, and stops at a line left empty', () => {
    const m = switchOn('pocket-64')
    press(m, keyCode('cls'))
    type(m, 'AUTO 200,10\nPRINT 1\nPRINT 2\n\n')
    expect(shown(m)).toEqual(['>AUTO 200,10', '>200 PRINT 1', '>210 PRINT 2', '>220', '>'])
    expect(say(m, 'LIST')).toEqual(['200 PRINT 1', '210 PRINT 2'])
  })

  it('reads several items for one INPUT, a string as typed or quoted', () => {
    const m = switchOn('pocket-64')
    press(m, keyCode('cls'))
    type(m, 'INPUT "N";A,B$,C$\n12, HELLO ,"A,B"\n')
    expect(say(m, 'PRINT A;B$;C$')).toEqual(['12 HELLOA,B'])
  })

  it('answers the same session compiled at -O1, as a check on the compiler', () => {
    const asm = compileBasic(read, 1).asm
    const built = buildRom((name) =>
      name === 'basic.s' ? asm : existsSync(DIR + name) ? readFileSync(DIR + name, 'utf8') : null,
    )
    expect(built.errors).toEqual([])
    const m = Elec16.boot(built.image, 'pocket-64')
    settle(m)
    for (const [line, printed] of [...SESSION, ...SESSION2])
      expect(say(m, line), line).toEqual(printed)
    expect(screen(m)).toHaveLength(8)
  })
})
