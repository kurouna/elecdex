import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  bitNibbles,
  CALC_EXAMPLES,
  CALC_FUNCTIONS,
  CALC_MAX_VARS,
  evaluate,
  evaluateAt,
  evaluateLine,
  tally,
} from '@shared/calc'
import { describe, expect, it } from 'vitest'

/**
 * The wrapper around the vendored calculator (src/shared/calc).
 *
 * The arithmetic itself has elecxzy's own tests, which run here unchanged; what
 * is checked here is the seam. Two things it guards that nothing else would
 * catch:
 *
 *  - **the seam holds.** Nothing outside src/shared/calc may reach into
 *    calc/vendor. If it did, a sync would silently change code that had not
 *    been looked at, and the wrapper's rules could be walked around.
 *  - **the help sheet is true.** The function names are written out there by
 *    hand, because the vendor does not export its table. Every one is evaluated
 *    here, so a sync that renames or drops one fails rather than leaving the
 *    sheet quietly wrong.
 */

const SRC = path.join(import.meta.dirname, '..', '..', 'src')

/** Every .ts and .svelte file under src, except the wrapper and the vendor itself. */
function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) {
      if (full.includes(path.join('shared', 'calc'))) continue
      sourceFiles(full, found)
      continue
    }
    if (/\.(ts|svelte)$/.test(name)) found.push(full)
  }
  return found
}

describe('the vendor seam', () => {
  it('is the only way into the vendored calculator', () => {
    const reaching = sourceFiles(SRC).filter((file) => {
      const text = readFileSync(file, 'utf8')
      return text.includes('@calc/') || text.includes('calc/vendor')
    })
    expect(reaching).toEqual([])
  })

  it('leaves the vendor folder unedited, with its licence and provenance', () => {
    const vendor = path.join(SRC, 'shared', 'calc', 'vendor')
    const names = readdirSync(vendor)
    expect(names).toContain('LICENSE.md')
    expect(names).toContain('SOURCE.json')
    const source = JSON.parse(readFileSync(path.join(vendor, 'SOURCE.json'), 'utf8')) as {
      project: string
      license: string
    }
    expect(source.project).toBe('elecxzy')
    expect(source.license).toBe('MIT')
  })
})

describe('evaluate', () => {
  it('gives the three forms of one number', () => {
    const result = evaluate('1920 * 1080')
    expect(result).toMatchObject({ ok: true, value: 2_073_600, text: '2073600' })
    expect(result.ok && result.grouped).toBe('2,073,600')
  })

  it('rounds away the float noise, as the vendor does', () => {
    expect(evaluate('0.1 + 0.2')).toMatchObject({ ok: true, text: '0.3' })
  })

  it('reads a line typed with a Japanese keyboard', () => {
    expect(evaluate('１＋２')).toMatchObject({ ok: true, value: 3 })
    expect(evaluate('3百万 / 12')).toMatchObject({ ok: true, value: 250_000 })
    expect(evaluate('６×７')).toMatchObject({ ok: true, value: 42 })
  })

  it('answers with an error rather than throwing', () => {
    expect(evaluate('1/0')).toEqual({ ok: false, error: 'Division by zero' })
    expect(evaluate('((((((((')).toMatchObject({ ok: false })
  })

  it('resolves ans and named values', () => {
    expect(evaluate('ans * 2', { ans: 21 })).toMatchObject({ ok: true, value: 42 })
  })
})

describe('evaluateLine', () => {
  it('assigns a name', () => {
    const result = evaluateLine('disk = 2 * tb / (512 * gib)')
    expect(result).toMatchObject({ ok: true, assigned: 'disk' })
    expect(result.ok && Math.round(result.value)).toBe(4)
  })

  it('refuses to shadow a constant or a function', () => {
    expect(evaluateLine('e = 3')).toEqual({ ok: false, error: 'e is built in' })
    expect(evaluateLine('sqrt = 3')).toEqual({ ok: false, error: 'sqrt is built in' })
    expect(evaluateLine('ans = 3')).toEqual({ ok: false, error: 'ans is built in' })
  })

  it('stops at the size of the register file', () => {
    const full: Record<string, number> = {}
    for (let i = 0; i < CALC_MAX_VARS; i += 1) full[`v${i}`] = i
    expect(evaluateLine('extra = 1', full)).toMatchObject({ ok: false })
    // Writing one that is already there is not a new name.
    expect(evaluateLine('v0 = 1', full)).toMatchObject({ ok: true, assigned: 'v0' })
  })

  it('is not confused by a comparison', () => {
    // `==` is not an assignment; it goes to the evaluator, which refuses it.
    expect(evaluateLine('a == 1')).toMatchObject({ ok: false })
  })

  it('passes a plain expression straight through', () => {
    const result = evaluateLine('2 + 2')
    expect(result).toMatchObject({ ok: true, value: 4 })
    expect(result.assigned).toBeUndefined()
  })
})

describe('evaluateAt', () => {
  it('finds the expression around the caret and leaves the prose alone', () => {
    const line = 'budget 1200*3 yen'
    const found = evaluateAt(line, 10)
    expect(found?.value).toBe(3600)
    expect(line.slice(found?.start ?? 0, found?.end ?? 0)).toBe('1200*3')
  })

  it('answers nothing where there is nothing to work out', () => {
    expect(evaluateAt('just some words', 5)).toBeNull()
  })
})

describe('bitNibbles', () => {
  it('lays an integer out in eight nibbles', () => {
    expect(bitNibbles(276)).toEqual([
      '0000',
      '0000',
      '0000',
      '0000',
      '0000',
      '0001',
      '0001',
      '0100',
    ])
  })

  it('shows a negative in two-s-complement, since the map has a width', () => {
    expect(bitNibbles(-1)?.join('')).toBe('1'.repeat(32))
  })

  it('refuses what 32 columns cannot say', () => {
    expect(bitNibbles(1.5)).toBeNull()
    expect(bitNibbles(2 ** 40)).toBeNull()
  })
})

describe('tally', () => {
  it('summarises a column of numbers', () => {
    const report = tally('10\n20\n30\n40')
    expect(report?.count).toBe(4)
    expect(report?.stats.sum).toBe(100)
    expect(report?.stats.mean).toBe(25)
    expect(report?.figures.map((f) => f.label)).toContain('median')
  })

  it('does not tear a date into negative parts', () => {
    // The vendor's rule, and the reason a table of dates does not quietly shrink
    // a total: the day and month are read, but never as minus numbers.
    const report = tally('2026-09-06')
    expect(report?.stats.min).toBeGreaterThan(0)
    expect(report?.stats.sum).toBe(2026 + 9 + 6)
  })

  it('bins for the histogram, and marks the quartiles', () => {
    const report = tally(Array.from({ length: 100 }, (_, i) => i).join('\n'))
    expect(report?.bins.length).toBeGreaterThanOrEqual(8)
    expect(report?.bins.reduce((a, b) => a + b, 0)).toBe(100)
    expect(report?.box?.median).toBeGreaterThan(0.4)
    expect(report?.box?.median).toBeLessThan(0.6)
  })

  it('has no bins when every value is the same, and says so rather than dividing by nothing', () => {
    const report = tally('5 5 5')
    expect(report?.bins).toEqual([])
    expect(report?.box).toBeNull()
  })

  it('answers nothing for text with no numbers in it', () => {
    expect(tally('no numbers here')).toBeNull()
  })
})

describe('the help sheet', () => {
  it('names only functions the evaluator really has', () => {
    for (const fn of CALC_FUNCTIONS) {
      const args = Array.from({ length: fn.args }, (_, i) => i + 1).join(', ')
      expect(
        evaluate(`${fn.name}(${args})`),
        `${fn.name} is listed but the evaluator does not know it`,
      ).toMatchObject({ ok: true })
    }
  })

  it('works every example it offers', () => {
    for (const example of CALC_EXAMPLES) {
      expect(evaluate(example), example).toMatchObject({ ok: true })
    }
  })
})
