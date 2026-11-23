import { buildCode, measure, measuringMachine } from '@shared/e16c/program'
import { sourceFromMachine, sourceToMachine } from '@shared/elec16/charset'
import { LIBRARY, LIBRARY_FILE, SAMPLE } from '@shared/elec16/code-area'
import { extractCode, machineText, streamingCode } from '@shared/elec16/write-code'
import {
  changedLineCount,
  charsetError,
  judge,
  MAX_FIXES,
  needsConfirm,
  sameSource,
  writeSteps,
} from '@shared/elec16/write-flow'
import {
  BUILTIN_NAMES,
  firstMessage,
  fixMessage,
  librarySignatures,
  PROMPT_EXAMPLE,
  WRITE_LIMITS,
  writeSystemPrompt,
} from '@shared/elec16/write-prompt'
import { describe, expect, it } from 'vitest'
import { built } from './elec16-helpers'

/**
 * CODE's WRITE (docs/elec16-write.md): the code taken out of a model's answer, the question
 * before code of one's own is replaced, how a build is judged, and the prompt the model is given.
 */

const FENCE = '```'

describe("WRITE's code from an answer", () => {
  it('takes the last fenced block that has main, whatever the fence is called', () => {
    const answer = [
      'Here you go:',
      `${FENCE}ts`,
      'const A: u16 = 1',
      FENCE,
      'and the whole of it:',
      `${FENCE}typescript`,
      'export function main(): void {}',
      FENCE,
      'Enjoy.',
    ].join('\n')
    expect(extractCode(answer)).toBe('export function main(): void {}')
    expect(extractCode(`${FENCE}\nexport function main(): void {}\n${FENCE}`)).toBe(
      'export function main(): void {}',
    )
  })

  it('takes an unclosed block to the end (a STOP), the last block when none has main, none without a fence', () => {
    expect(extractCode(`${FENCE}ts\nexport function main(): void {\n  cls()`)).toBe(
      'export function main(): void {\n  cls()',
    )
    expect(
      extractCode(`${FENCE}ts\nconst A = 1\n${FENCE}\n${FENCE}ts\nconst B = 2\n${FENCE}`),
    ).toBe('const B = 2')
    expect(extractCode('export function main(): void {}')).toBeNull()
    expect(extractCode('')).toBeNull()
  })

  it('streams only what is inside the first fence, never a closing fence half come', () => {
    expect(streamingCode('Sure')).toBe('')
    expect(streamingCode(`${FENCE}t`)).toBe('')
    expect(streamingCode(`${FENCE}ts\n`)).toBe('')
    expect(streamingCode(`${FENCE}ts\nconst A = 1\nexport fun`)).toBe('const A = 1\nexport fun')
    expect(streamingCode(`${FENCE}ts\nconst A = 1\n\``)).toBe('const A = 1\n')
    expect(streamingCode(`${FENCE}ts\nconst A = 1\n\`\``)).toBe('const A = 1\n')
    expect(streamingCode(`${FENCE}ts\nconst A = 1\n${FENCE}\nmore words`)).toBe('const A = 1')
    expect(streamingCode(`${FENCE}ts\r\nconst A = 1\r\n`)).toBe('const A = 1\n')
  })

  it('turns typographic marks a model writes into the machine’s ASCII, and tabs into spaces', () => {
    expect(machineText('// it’s “fast” — really…\r\n\tx =　1')).toBe(
      '// it\'s "fast" - really...\n  x = 1',
    )
    expect('problem' in sourceToMachine(machineText('// ‘a’ – b'))).toBe(false)
  })
})

describe("WRITE's question before it replaces", () => {
  it('asks only for code of the person’s own: not the sample, not blank, not what WRITE last wrote', () => {
    expect(needsConfirm(SAMPLE, null)).toBe(false)
    expect(needsConfirm('', null)).toBe(false)
    expect(needsConfirm('  \n\n ', null)).toBe(false)
    expect(needsConfirm('export function main(): void {}', null)).toBe(true)
    expect(needsConfirm('export function main(): void {}', 'export function main(): void {}')).toBe(
      false,
    )
    expect(
      needsConfirm('export function main(): void { cls() }', 'export function main(): void {}'),
    ).toBe(true)
  })

  it('counts the sample as the sample through line ends, trailing spaces and the card’s round trip', () => {
    expect(sameSource(SAMPLE.replace(/\n/g, '\r\n'), SAMPLE)).toBe(true)
    expect(sameSource(`${SAMPLE.replace(/\n/g, '  \n')}\n\n`, SAMPLE)).toBe(true)
    const made = sourceToMachine(SAMPLE)
    if ('problem' in made) throw new Error(made.problem)
    expect(needsConfirm(sourceFromMachine(made.bytes), null)).toBe(false)
    expect(sameSource(`${SAMPLE}\n// mine`, SAMPLE)).toBe(false)
  })
})

describe("WRITE's verdict on a build", () => {
  const ok = (level: 0 | 1 | 2) => ({ level, errors: [], measured: { end: 'returned' as const } })
  const tooBig = (level: 0 | 1 | 2) => ({
    level,
    errors: [
      {
        file: 'MAIN.TS',
        line: 0,
        column: 0,
        message: 'the program is 2916 bytes: the code area holds 2048',
      },
    ],
    measured: null,
  })
  const wrong = {
    file: 'MAIN.TS',
    line: 5,
    column: 10,
    message: '/ gives a fraction in TypeScript: use div(a, b)',
  }

  it('is ready when the chosen level builds and does not fault', () => {
    expect(judge([tooBig(0), ok(1), ok(2)], 2)).toEqual({ ok: true, level: 2, switched: false })
    expect(judge([ok(0), ok(1), ok(2)], 0)).toEqual({ ok: true, level: 0, switched: false })
  })

  it('moves up a level, spending no fix, when the chosen level is only too big', () => {
    expect(judge([tooBig(0), ok(1), ok(2)], 0)).toEqual({ ok: true, level: 1, switched: true })
    expect(judge([tooBig(0), tooBig(1), ok(2)], 1)).toEqual({ ok: true, level: 2, switched: true })
    // Too big at every level: the model is asked to make it smaller.
    const all = judge([tooBig(0), tooBig(1), tooBig(2)], 2)
    expect(all.ok).toBe(false)
  })

  it('asks for a fix with the chosen level’s errors, and for a program that faults at start', () => {
    const level = { level: 2 as const, errors: [wrong], measured: null }
    expect(judge([level, level, level], 2)).toEqual({ ok: false, errors: [wrong] })
    const faults = judge([ok(0), ok(1), { level: 2, errors: [], measured: { end: 'fault' } }], 2)
    expect(faults.ok).toBe(false)
    if (!faults.ok) expect(faults.errors[0]?.message).toMatch(/fault/)
    // Running past the measuring limit is a game's loop, not an error.
    expect(judge([ok(0), ok(1), { level: 2, errors: [], measured: { end: 'limit' } }], 2).ok).toBe(
      true,
    )
  })

  it('reads a character the card cannot keep as an error on its line', () => {
    expect(
      charsetError('MAIN.TS', 'Line 7 has "漢" (U+6F22), which the ELEC-16 cannot keep.'),
    ).toEqual({
      file: 'MAIN.TS',
      line: 7,
      column: 1,
      message: 'Line 7 has "漢" (U+6F22), which the ELEC-16 cannot keep.',
    })
  })

  it('counts the lines a fix or a change made', () => {
    expect(changedLineCount('a\nb\nc', 'a\nb\nc')).toBe(0)
    expect(changedLineCount('a\nb\nc', 'a\nB\nc')).toBe(1)
    expect(changedLineCount('a\nb\nc', 'a\nb\nc\nd\ne')).toBe(2)
    expect(changedLineCount('a\nb\nc', 'a\nc')).toBe(1)
    expect(MAX_FIXES).toBe(2)
  })
})

describe("WRITE's prompt", () => {
  const prompt = writeSystemPrompt()

  it('lists every library function with its type, read from the library itself', () => {
    const names = [...LIBRARY.matchAll(/^function (\w+)\(/gm)].map((m) => m[1])
    expect(librarySignatures().map((s) => s.name)).toEqual(names)
    for (const s of librarySignatures()) expect(prompt).toContain(s.signature)
  })

  it('names the built-ins e16c refuses to have redefined', () => {
    for (const name of BUILTIN_NAMES) {
      const b = buildCode(
        'MAIN.TS',
        `function ${name}(): void {}\nexport function main(): void {}`,
        2,
      )
      expect(b.errors[0]?.message, name).toMatch(/is a built-in|declared twice/)
      expect(prompt).toContain(`\`${name}`)
    }
  })

  it('holds an example that builds at -O1 and -O2 and runs without a fault', () => {
    expect(prompt).toContain(PROMPT_EXAMPLE)
    const snapshot = measuringMachine(built.image)
    for (const level of [1, 2] as const) {
      const b = buildCode('MAIN.TS', PROMPT_EXAMPLE, level)
      expect(b.errors, `-O${level}`).toEqual([])
      expect(measure(built.image, snapshot, b.image).end).not.toBe('fault')
    }
  })

  it('says no to what e16c refuses, as e16c does', () => {
    const refused = [
      'export function main(): void { putnum(7 / 2) }',
      "export function main(): void { puts('HI') }",
      'class A {}\nexport function main(): void {}',
      'export function main(): void { const f = () => 1 }',
      'export function main(): void { let x: number = 1 }',
      'export function main(): void { const a = [1, 2] }',
      'export function main(): void { let x\n x = 1 }',
    ]
    for (const source of refused) {
      expect(buildCode('MAIN.TS', source, 2).errors.length, source).toBeGreaterThan(0)
    }
  })

  it('asks for one fenced block, and stays small enough to send every time', () => {
    expect(prompt).toMatch(/one fenced code block/i)
    expect(prompt.length).toBeLessThan(14_000)
    expect(prompt).toMatch(/^[\x20-\x7e\n]*$/)
  })

  it('asks for a new program from the sample, and for a change with code of one’s own', () => {
    expect(firstMessage('make a game', SAMPLE, 'MAIN.TS')).not.toContain('HELLO FROM TYPESCRIPT')
    expect(firstMessage('make a game', SAMPLE, 'MAIN.TS')).toContain('make a game')
    const own = firstMessage('score at the top', 'export function main(): void {}', 'GAME.TS')
    expect(own).toContain('GAME.TS')
    expect(own).toContain(`${FENCE}ts\nexport function main(): void {}\n${FENCE}`)
    expect(own).toContain('score at the top')
  })

  it('gives errors back as e16c said them, the library’s marked, twenty at most', () => {
    const many = Array.from({ length: 30 }, (_, k) => ({
      file: 'MAIN.TS',
      line: k + 1,
      column: 2,
      message: `x${k} is not known`,
    }))
    const text = fixMessage([
      { file: LIBRARY_FILE, line: 3, column: 1, message: 'putc is declared twice' },
      ...many,
    ])
    expect(text).toContain('in the built-in library')
    expect(text).toContain('MAIN.TS:1:2 x0 is not known')
    expect(text).not.toContain('x19 is not known')
    expect(text.split('\n').filter((l) => l.startsWith('MAIN.TS:')).length).toBe(
      WRITE_LIMITS.errors - 1,
    )
    expect(text).toMatch(/whole corrected program/i)
  })
})

describe("WRITE's steps", () => {
  const drawn = (...args: Parameters<typeof writeSteps>) =>
    writeSteps(...args)
      .map((s) => `${s.name}${s.kind ? `:${s.kind}` : ''}`)
      .join(' ')

  it('shows nothing while idle or asking, and FIX only once a fix was asked for', () => {
    expect(writeSteps('idle', 0, 0)).toEqual([])
    expect(writeSteps('confirm', 0, 0)).toEqual([])
    expect(drawn('thinking', 0, 0)).toBe('thinking:now write compile ready')
    expect(drawn('writing', 0, 10)).toBe('thinking:done write:now compile ready')
    expect(drawn('compiling', 0, 10)).toBe('thinking:done write:done compile:now ready')
    expect(drawn('ready', 0, 10)).toBe('thinking:done write:done compile:done ready:done')
  })

  it('draws a fix under way, the compile after it, and where a SEND ended', () => {
    expect(drawn('fixing', 1, 10)).toBe('thinking:done write:done compile:done fix 1/2:now ready')
    expect(drawn('compiling', 1, 10)).toBe(
      'thinking:done write:done compile:now fix 1/2:done ready',
    )
    expect(drawn('ready', 2, 10)).toBe(
      'thinking:done write:done compile:done fix 2/2:done ready:done',
    )
    expect(drawn('failed', 2, 10)).toBe('thinking:done write:done compile:done fix 2/2:bad ready')
    expect(drawn('failed', 0, 0)).toBe('thinking:bad write compile ready')
    expect(drawn('stopped', 0, 10)).toBe('thinking:done write:off compile ready')
  })
})
