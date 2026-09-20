import { describe, expect, it } from 'vitest'
import { parseInline, parseMarkdown, safeHref } from '../../src/renderer/lib/markdown.js'

const text = (v: string) => ({ t: 'text', v })

describe('inline markdown', () => {
  it('reads code, emphasis, strikethrough and links', () => {
    expect(parseInline('a `b*c` **d** *e* ~~f~~ [g](https://h.test/i)')).toEqual([
      text('a '),
      { t: 'code', v: 'b*c' },
      text(' '),
      { t: 'strong', c: [text('d')] },
      text(' '),
      { t: 'em', c: [text('e')] },
      text(' '),
      { t: 'del', c: [text('f')] },
      text(' '),
      { t: 'link', href: 'https://h.test/i', c: [text('g')] },
    ])
  })

  it('nests, and leaves snake_case and arithmetic alone', () => {
    expect(parseInline('**bold and *both***')).toEqual([
      { t: 'strong', c: [text('bold and '), { t: 'em', c: [text('both')] }] },
    ])
    expect(parseInline('my_var_name and 2 * 3 * 4')).toEqual([text('my_var_name and 2 * 3 * 4')])
  })

  it('turns a bare address into a link, without the full stop after it', () => {
    expect(parseInline('see https://example.test/a_b.')).toEqual([
      text('see '),
      { t: 'link', href: 'https://example.test/a_b', c: [text('https://example.test/a_b')] },
      text('.'),
    ])
  })

  it('only a web address becomes a link', () => {
    expect(safeHref('javascript:alert(1)')).toBeNull()
    expect(safeHref('file:///etc/passwd')).toBeNull()
    expect(safeHref('data:text/html,x')).toBeNull()
    expect(parseInline('[click](javascript:alert(1))')[0]).toMatchObject({ t: 'text' })
  })
})

describe('block markdown', () => {
  it('reads what models write', () => {
    const blocks = parseMarkdown(
      [
        '## Steps',
        '',
        'First line',
        'second line',
        '',
        '1. one',
        '2. two',
        '   - nested',
        '',
        '> quoted',
        '',
        '---',
        '',
        '```ts',
        'const a = 1 // **not bold**',
        '```',
      ].join('\n'),
    )
    expect(blocks.map((b) => b.t)).toEqual(['h', 'p', 'list', 'quote', 'hr', 'code'])
    expect(blocks[1]).toEqual({ t: 'p', c: [text('First line\nsecond line')] })
    expect(blocks[2]).toMatchObject({
      t: 'list',
      ordered: true,
      start: 1,
      items: [
        [{ t: 'p', c: [text('one')] }],
        [
          { t: 'p', c: [text('two')] },
          { t: 'list', ordered: false, items: [[{ t: 'p', c: [text('nested')] }]] },
        ],
      ],
    })
    expect(blocks[5]).toEqual({ t: 'code', lang: 'ts', v: 'const a = 1 // **not bold**' })
  })

  it('a fence still being written is a code block already', () => {
    expect(parseMarkdown('Here:\n```python\nprint("hi")\nfor x in')).toEqual([
      { t: 'p', c: [text('Here:')] },
      { t: 'code', lang: 'python', v: 'print("hi")\nfor x in' },
    ])
  })

  it('reads a table', () => {
    const [table] = parseMarkdown('| a | b |\n|---|:-:|\n| 1 | `2` |\n| 3 \\| 4 | 5 |')
    expect(table).toEqual({
      t: 'table',
      head: [[text('a')], [text('b')]],
      rows: [
        [[text('1')], [{ t: 'code', v: '2' }]],
        [[text('3 | 4')], [text('5')]],
      ],
    })
  })

  it('a list interrupts a paragraph, a hashtag is not a heading', () => {
    expect(parseMarkdown('Options:\n- a\n- b').map((b) => b.t)).toEqual(['p', 'list'])
    expect(parseMarkdown('#hashtag')).toEqual([{ t: 'p', c: [text('#hashtag')] }])
  })

  it('never makes anything of HTML but text', () => {
    const blocks = parseMarkdown('<img src=x onerror=alert(1)>\n\n<script>alert(1)</script>')
    expect(blocks).toEqual([
      { t: 'p', c: [text('<img src=x onerror=alert(1)>')] },
      { t: 'p', c: [text('<script>alert(1)</script>')] },
    ])
  })

  it('takes a long answer in its stride', () => {
    const long = Array.from({ length: 4000 }, (_, i) => `- item **${i}** with \`code\``).join('\n')
    const started = performance.now()
    const blocks = parseMarkdown(long)
    expect(blocks[0]).toMatchObject({ t: 'list' })
    expect(performance.now() - started).toBeLessThan(1000)
  })
})
