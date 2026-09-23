import { diffLines, toHunks } from '@shared/text-diff'
import { describe, expect, it } from 'vitest'

/** The line diff behind an agent session's changes to a file. */

const apply = (ops: ReturnType<typeof diffLines>) => ({
  before: ops.filter((o) => o.kind !== 'add').map((o) => o.text),
  after: ops.filter((o) => o.kind !== 'del').map((o) => o.text),
})

describe('a line diff', () => {
  it('finds a changed line among unchanged ones', () => {
    const ops = diffLines('a\nb\nc\n', 'a\nB\nc\n')
    expect(ops.map((o) => `${o.kind}:${o.text}`)).toEqual(['ctx:a', 'del:b', 'add:B', 'ctx:c'])
  })

  it('always rebuilds both texts, whatever the edits', () => {
    const cases: [string, string][] = [
      ['', 'new\nfile\n'],
      ['gone\n', ''],
      ['1\n2\n3\n4\n5\n', '0\n1\n3\n4\n4.5\n5\n6\n'],
      ['x\ny\nx\ny\n', 'y\nx\ny\nx\n'],
      ['a\r\nb\r\n', 'a\nb\nc\n'],
    ]
    for (const [before, after] of cases) {
      const rebuilt = apply(diffLines(before, after))
      expect(rebuilt.before.join('\n')).toBe(before.replace(/\r\n/g, '\n').replace(/\n$/, ''))
      expect(rebuilt.after.join('\n')).toBe(after.replace(/\n$/, ''))
    }
  })

  it('numbers hunks and keeps three lines round each change', () => {
    const before = Array.from({ length: 30 }, (_, i) => `line ${i + 1}`).join('\n')
    const after = before.replace('line 5', 'line five').replace('line 25', 'line twenty-five')
    const hunks = toHunks(diffLines(before, after))
    expect(hunks).toHaveLength(2)
    expect(hunks[0]?.oldStart).toBe(2)
    expect(hunks[0]?.lines.filter((l) => l.kind === 'ctx')).toHaveLength(6)
    expect(hunks[1]?.lines.find((l) => l.kind === 'add')).toMatchObject({
      text: 'line twenty-five',
      new: 25,
    })
  })

  it('gives up on texts that differ everywhere, showing them whole', () => {
    const before = Array.from({ length: 3000 }, (_, i) => `a${i}`).join('\n')
    const after = Array.from({ length: 3000 }, (_, i) => `b${i}`).join('\n')
    const ops = diffLines(before, after)
    expect(ops.filter((o) => o.kind === 'del')).toHaveLength(3000)
    expect(ops.filter((o) => o.kind === 'add')).toHaveLength(3000)
  })
})
