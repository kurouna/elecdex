import { describe, expect, it } from 'vitest'
import { joinBlocks, splitBlocks, splitParts } from '../../src/shared/translate/blocks'

/** The unit of translation (docs/translate.md §6.1): blocks between blank lines, and back. */

const roundTrip = (source: string): string => {
  const { blocks, tail } = splitBlocks(source)
  return joinBlocks(blocks, tail)
}

describe('splitBlocks', () => {
  it('cuts at blank lines and keeps a single line break inside a block', () => {
    const { blocks } = splitBlocks('Title\n\nFirst line\nsecond line\n\n- a\n- b')
    expect(blocks.map((b) => b.text)).toEqual(['Title', 'First line\nsecond line', '- a\n- b'])
  })

  it('takes a line of nothing but spaces as blank, and several as one gap', () => {
    const { blocks } = splitBlocks('A\n   \n\t\n\nB')
    expect(blocks.map((b) => b.text)).toEqual(['A', 'B'])
    expect(blocks[1]?.lead).toBe('\n   \n\t\n\n')
  })

  it('is one block without a blank line, and none for white space alone', () => {
    expect(splitBlocks('one\ntwo').blocks).toHaveLength(1)
    expect(splitBlocks('').blocks).toEqual([])
    expect(splitBlocks('  \n \n').blocks).toEqual([])
  })

  it('keeps the indentation of a block and the gaps around, to put back', () => {
    const { blocks, tail } = splitBlocks('\n\n  indented\n\nnext  ')
    expect(blocks.map((b) => [b.lead, b.text])).toEqual([
      ['\n\n  ', 'indented'],
      ['\n\n', 'next'],
    ])
    expect(tail).toBe('  ')
  })

  it('gives the source back exactly when joined', () => {
    for (const source of [
      'A\n\nB',
      '  A\nB\n\n\nC\n',
      '\nA',
      '\n\n\nA\n \n B \n\n',
      'only',
      '   ',
      'a\r\n\r\nb',
    ]) {
      expect(roundTrip(source)).toBe(source.replace(/\r\n?/g, '\n'))
    }
  })

  it('puts translations back the way the source was laid out', () => {
    const { blocks, tail } = splitBlocks('Hello\n\n  World\n')
    const translated = blocks.map((b, i) => ({
      lead: b.lead,
      text: ['こんにちは', '世界'][i] ?? '',
    }))
    expect(joinBlocks(translated, tail)).toBe('こんにちは\n\n  世界\n')
  })
})

describe('splitParts', () => {
  it('keeps a part of surrogate pairs within the size it counts in, never cutting one', () => {
    // 30 emoji with no full stop: 60 UTF-16 units, one sentence, cut by characters.
    const text = '😀'.repeat(30)
    const parts = splitParts(text, 60, 20)
    expect(parts.join('')).toBe(text)
    for (const part of parts) {
      expect(part.length).toBeLessThanOrEqual(20)
      expect(part).toMatch(/^(?:😀)+$/u)
    }
  })

  it('leaves a block within the limit whole', () => {
    expect(splitParts('Short. Text.', 10)).toEqual(['Short. Text.'])
  })

  it('cuts a long block by sentences, and joins back exactly', () => {
    const text = Array.from({ length: 40 }, (_, i) => `Sentence number ${i} is here.`).join(' ')
    const parts = splitParts(text, 1200, 512)
    expect(parts.length).toBeGreaterThan(2)
    expect(parts.join('')).toBe(text)
    // Each part ends at a sentence, never in the middle of one.
    for (const part of parts.slice(0, -1)) expect(part.trimEnd()).toMatch(/\.$/)
  })

  it('cuts a sentence longer than the limit by characters, never inside a surrogate pair', () => {
    const text = '😀'.repeat(300)
    const parts = splitParts(text, 1200, 100)
    expect(parts.join('')).toBe(text)
    for (const part of parts) expect([...part].every((c) => c === '😀')).toBe(true)
  })
})
