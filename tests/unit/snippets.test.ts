import {
  cleanName,
  dropIndex,
  emptySnippets,
  filterSnippets,
  isSnippetId,
  makeSnippetId,
  SNIPPET_LIMITS,
  type SnippetContent,
  type SnippetsFile,
  SnippetsFileSchema,
  slotNumber,
  snippetTitle,
  snippetView,
  withEdit,
  withMove,
  withoutSnippet,
  withSnippet,
  withUse,
} from '@shared/snippets'
import { describe, expect, it } from 'vitest'
import { SnippetShelf } from '../../src/main/clipboard/snippets.js'

/**
 * Snippets (architecture.md §5.14): the pure decisions - what a new one is,
 * that a text is kept once, where one moves, what an edit leaves of its
 * formatting - and main's shelf, which keeps them, writes and tells.
 */

const plain = (text: string): SnippetContent => ({ text, html: null, rtf: null })

function fileOf(...texts: string[]): SnippetsFile {
  let file = emptySnippets()
  texts.forEach((text, i) => {
    file = withSnippet(file, plain(text), `s${i}`, 1000 + i).file
  })
  return file
}

const texts = (file: SnippetsFile) => file.snippets.map((s) => s.text)

describe('withSnippet', () => {
  it('adds at the end, with the formatting it was copied with', () => {
    const one = withSnippet(emptySnippets(), plain('one'), 'sa', 5)
    const two = withSnippet(
      one.file,
      { text: 'two', html: '<b>two</b>', rtf: '{\\rtf1 two}' },
      'sb',
      6,
      ' sig ',
    )
    expect(two.result).toEqual({ id: 'sb', added: true })
    expect(texts(two.file)).toEqual(['one', 'two'])
    expect(two.file.snippets[1]).toMatchObject({
      name: 'sig',
      html: '<b>two</b>',
      rtf: '{\\rtf1 two}',
      createdAt: 6,
      copies: 0,
      usedAt: null,
    })
  })

  it('keeps a text once, answering the one that holds it', () => {
    const file = fileOf('one', 'two')
    const again = withSnippet(file, { text: 'one', html: '<i>one</i>', rtf: null }, 'sx', 9)
    expect(again.result).toEqual({ id: 's0', added: false })
    expect(again.file).toBe(file)
  })

  it('refuses an empty or too long text, and one more than the file holds', () => {
    expect(withSnippet(emptySnippets(), plain(''), 'sa', 1).result).toEqual({ error: 'invalid' })
    const long = plain('x'.repeat(SNIPPET_LIMITS.text + 1))
    expect(withSnippet(emptySnippets(), long, 'sa', 1).result).toEqual({ error: 'invalid' })
    const full = fileOf(...Array.from({ length: SNIPPET_LIMITS.snippets }, (_, i) => `t${i}`))
    expect(withSnippet(full, plain('more'), 'sz', 1).result).toEqual({ error: 'full' })
  })

  it('makes a file the schema takes back, HTML and RTF of any length included', () => {
    const big = { text: 'rich', html: 'h'.repeat(900_000), rtf: 'r'.repeat(900_000) }
    const { file } = withSnippet(emptySnippets(), big, makeSnippetId(), 1)
    expect(SnippetsFileSchema.parse(JSON.parse(JSON.stringify(file)))).toEqual(file)
  })
})

describe('withEdit', () => {
  it('renames and keeps the formatting', () => {
    const { file } = withSnippet(
      emptySnippets(),
      { text: 'a', html: '<b>a</b>', rtf: null },
      'sa',
      1,
    )
    const renamed = withEdit(file, 'sa', { name: 'bold\na' }, 2)
    expect(renamed?.snippets[0]).toMatchObject({ name: 'bold a', html: '<b>a</b>', updatedAt: 2 })
  })

  it('drops the formatting with a new text: it would say the old words', () => {
    const { file } = withSnippet(
      emptySnippets(),
      { text: 'a', html: '<b>a</b>', rtf: '{a}' },
      'sa',
      1,
    )
    const rewritten = withEdit(file, 'sa', { text: 'b' }, 2)
    expect(rewritten?.snippets[0]).toMatchObject({ text: 'b', html: null, rtf: null })
  })

  it('refuses an empty text, one another snippet holds, and an unknown id', () => {
    const file = fileOf('one', 'two')
    expect(withEdit(file, 's0', { text: '' }, 2)).toBeNull()
    expect(withEdit(file, 's0', { text: 'two' }, 2)).toBeNull()
    expect(withEdit(file, 'snope', { name: 'x' }, 2)).toBeNull()
  })

  it('changes nothing for the same name and text', () => {
    const file = fileOf('one')
    expect(withEdit(file, 's0', { text: 'one', name: '' }, 2)).toBe(file)
  })
})

describe('withMove', () => {
  it('moves one to a place, the others keeping their order', () => {
    const file = fileOf('a', 'b', 'c', 'd')
    expect(texts(withMove(file, 's0', 2))).toEqual(['b', 'c', 'a', 'd'])
    expect(texts(withMove(file, 's3', 0))).toEqual(['d', 'a', 'b', 'c'])
    expect(texts(withMove(file, 's1', 99))).toEqual(['a', 'c', 'd', 'b'])
    expect(texts(withMove(file, 's1', -3))).toEqual(['b', 'a', 'c', 'd'])
    expect(withMove(file, 's1', 1)).toBe(file)
    expect(withMove(file, 'snope', 0)).toBe(file)
  })
})

describe('dropIndex', () => {
  const middles = [20, 60, 100, 140]

  it('is the place among the rows whose middles the pointer passed, the dragged one left out', () => {
    expect(dropIndex(middles, 10, 0)).toBe(0)
    expect(dropIndex(middles, 70, 0)).toBe(1)
    expect(dropIndex(middles, 110, 0)).toBe(2)
    expect(dropIndex(middles, 500, 0)).toBe(3)
    expect(dropIndex(middles, 0, 3)).toBe(0)
    expect(dropIndex(middles, 90, 3)).toBe(2)
  })

  it('agrees with withMove: a drop where it was moves nothing', () => {
    const file = fileOf('a', 'b', 'c', 'd')
    for (let from = 0; from < 4; from += 1) {
      const to = dropIndex(middles, middles[from] as number, from)
      expect(to).toBe(from)
      expect(withMove(file, `s${from}`, to)).toBe(file)
    }
  })
})

describe('what a row shows', () => {
  it('is called by its name, or its first line with something on it', () => {
    expect(snippetTitle({ name: 'sig', text: 'Regards' })).toBe('sig')
    expect(snippetTitle({ name: '', text: '\n  \n  ssh prod\nmore' })).toBe('ssh prod')
    expect(snippetTitle({ name: '', text: '   ' })).toBe('blank')
  })

  it('gives the page a preview, never the whole text or its formatting', () => {
    const text = `#3fd2ff${'x'.repeat(1000)}`
    const { file } = withSnippet(
      emptySnippets(),
      { text, html: '<p>secret</p>', rtf: null },
      'sa',
      1,
    )
    const view = snippetView(file.snippets[0] as never)
    expect(view.preview.length).toBe(600)
    expect(view.chars).toBe(text.length)
    expect(view).toMatchObject({ rich: true, formats: ['html'] })
    expect(JSON.stringify(view)).not.toContain('secret')
    expect(snippetView(fileOf('#3fd2ff').snippets[0] as never).kind).toBe('color')
  })

  it('filters on name and preview, numbers slots from 01, and cleans names', () => {
    const views = fileOf('npm run build', 'git log').snippets.map(snippetView)
    const named = [{ ...views[0], name: 'Deploy' }, views[1]] as typeof views
    expect(filterSnippets(named, 'deploy').map((v) => v.id)).toEqual(['s0'])
    expect(filterSnippets(named, 'LOG').map((v) => v.id)).toEqual(['s1'])
    expect(filterSnippets(named, '  ')).toHaveLength(2)
    expect([slotNumber(0), slotNumber(9), slotNumber(99)]).toEqual(['01', '10', '100'])
    expect(cleanName(`  a\t b\n${'c'.repeat(100)}`)).toHaveLength(SNIPPET_LIMITS.name)
  })

  it('makes ids its own check accepts', () => {
    for (let i = 0; i < 20; i += 1) expect(isSnippetId(makeSnippetId())).toBe(true)
    expect(isSnippetId('c12')).toBe(false)
    expect(isSnippetId('s../x')).toBe(false)
  })
})

describe('withUse and withoutSnippet', () => {
  it('counts a copy and when, and deletes one', () => {
    const file = withUse(withUse(fileOf('a', 'b'), 's1', 50), 's1', 70)
    expect(file.snippets[1]).toMatchObject({ copies: 2, usedAt: 70 })
    expect(texts(withoutSnippet(file, 's0'))).toEqual(['b'])
    expect(withoutSnippet(file, 'snope')).toBe(file)
  })
})

describe('SnippetShelf', () => {
  function shelf(initial = emptySnippets()) {
    const saved: SnippetsFile[] = []
    let changed = 0
    let n = 0
    const ids = ['sdup', 'sdup', 'snext']
    const it = new SnippetShelf({
      load: () => initial,
      save: (file) => saved.push(file),
      now: () => 1000,
      makeId: () => ids[n++] ?? `s${n}`,
      changed: () => {
        changed += 1
      },
    })
    return { shelf: it, saved, changed: () => changed }
  }

  it('writes and tells on a change, and neither when nothing changed', () => {
    const s = shelf()
    expect(s.shelf.add(plain('one'))).toEqual({ id: 'sdup', added: true })
    expect(s.saved).toHaveLength(1)
    expect(s.changed()).toBe(1)
    expect(s.shelf.add(plain('one'))).toEqual({ id: 'sdup', added: false })
    expect(s.shelf.move('sdup', 0)).toBe(true)
    expect(s.saved).toHaveLength(1)
    expect(s.changed()).toBe(1)
  })

  it('never gives a new snippet an id one already has', () => {
    const s = shelf()
    s.shelf.add(plain('one'))
    expect(s.shelf.add(plain('two'))).toEqual({ id: 'snext', added: true })
  })

  it('knows which snippet holds a text, after every kind of change', () => {
    const s = shelf()
    s.shelf.add(plain('one'))
    expect(s.shelf.idOf('one')).toBe('sdup')
    s.shelf.edit('sdup', { text: 'uno' })
    expect(s.shelf.idOf('one')).toBeNull()
    expect(s.shelf.idOf('uno')).toBe('sdup')
    s.shelf.remove('sdup')
    expect(s.shelf.idOf('uno')).toBeNull()
    s.shelf.reload(fileOf('by hand'))
    expect(s.shelf.idOf('by hand')).toBe('s0')
    expect(s.changed()).toBe(4)
    // A reload that finds the file as it was tells nothing.
    s.shelf.reload(fileOf('by hand'))
    expect(s.changed()).toBe(4)
  })

  it('counts a use and says so', () => {
    const s = shelf(fileOf('a'))
    s.shelf.used('s0')
    expect(s.shelf.views()[0]).toMatchObject({ copies: 1, usedAt: 1000 })
    expect(s.saved).toHaveLength(1)
  })
})
