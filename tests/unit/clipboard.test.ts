import {
  boardOf,
  CLIP_ABSORB_MS,
  CLIP_LARGE_CHARS,
  CLIP_LARGE_PERIOD_MS,
  CLIP_MAX_CHARS,
  CLIP_MAX_ENTRIES,
  CLIP_MAX_HTML_CHARS,
  CLIP_MAX_RTF_CHARS,
  CLIP_PREVIEW_CHARS,
  type ClipHistory,
  type ClipRead,
  classifyClip,
  cleared,
  clipAge,
  clipFormats,
  clipSize,
  clipTags,
  emptyHistory,
  filterEntries,
  historyFlagSaysPrivate,
  isClipId,
  maskedPreview,
  nextTick,
  previewLines,
  privateMark,
  rawFormatName,
  rawFormatType,
  recordRead,
  restored,
  shouldReadText,
  withoutEntry,
} from '@shared/clipboard'
import { describe, expect, it } from 'vitest'

const text = (value: string, html: string | null = null): ClipRead => ({
  kind: 'text',
  text: value,
  html,
})

/** Records the reads in order, five seconds apart unless given times. */
function history(reads: (ClipRead | [ClipRead, number])[], from: ClipHistory = emptyHistory()) {
  let n = from.entries.length
  let at: number | null = null
  let h = from
  for (const read of reads) {
    const [r, t]: [ClipRead, number] = Array.isArray(read) ? read : [read, (at ?? 0) + 5000]
    // Given times are looks in a row; the others are copies seconds apart.
    h = recordRead(h, r, t, () => `c${++n}`, Array.isArray(read) ? at : null)
    at = t
  }
  return h
}

describe('nextTick', () => {
  it('is the next quarter second on the wall clock, never now', () => {
    expect(nextTick(1000)).toBe(1250)
    expect(nextTick(1001)).toBe(1250)
    expect(nextTick(1249)).toBe(1250)
    expect(nextTick(1250, 500)).toBe(1500)
  })
})

describe('private marks', () => {
  const raw = (name: string) => rawFormatType(name)

  it('reads a raw format name back from its MIME type', () => {
    expect(rawFormatName(raw('Clipboard Viewer Ignore'))).toBe('Clipboard Viewer Ignore')
    expect(rawFormatName('text/plain')).toBeNull()
  })

  it('knows the formats password managers add, on every platform', () => {
    // As Electron listed a copy made the way KeePass and 1Password make theirs (measured).
    expect(privateMark(['text/plain', raw('ExcludeClipboardContentFromMonitorProcessing')])).toBe(
      'yes',
    )
    expect(privateMark(['text/plain', raw('Clipboard Viewer Ignore')])).toBe('yes')
    expect(privateMark(['text/plain', raw('org.nspasteboard.ConcealedType')])).toBe('yes')
    expect(privateMark(['text/plain', raw('x-kde-passwordManagerHint')])).toBe('yes')
    expect(privateMark(['text/plain', 'text/html'])).toBe('no')
  })

  it("asks for Windows' history flag, which says private only as 0", () => {
    expect(privateMark(['text/plain', raw('CanIncludeInClipboardHistory')])).toBe('ask')
    expect(historyFlagSaysPrivate(new Uint8Array([0, 0, 0, 0]))).toBe(true)
    expect(historyFlagSaysPrivate(new Uint8Array([1, 0, 0, 0]))).toBe(false)
    expect(historyFlagSaysPrivate(new Uint8Array([]))).toBe(false)
  })
})

describe('classifyClip', () => {
  it('tells a link, a path, a colour and a number from text', () => {
    expect(classifyClip('https://example.com/a?b=1')).toBe('url')
    expect(classifyClip('  http://x.test  ')).toBe('url')
    expect(classifyClip('C:\\Users\\me\\a.txt')).toBe('path')
    expect(classifyClip('\\\\server\\share\\a')).toBe('path')
    expect(classifyClip('/usr/local/bin')).toBe('path')
    expect(classifyClip('~/notes.md')).toBe('path')
    expect(classifyClip('#3fd2ff')).toBe('color')
    expect(classifyClip('#fff')).toBe('color')
    expect(classifyClip('1,284,500')).toBe('number')
    expect(classifyClip('-3.5')).toBe('number')
    expect(classifyClip('42%')).toBe('number')
    expect(classifyClip('hello world')).toBe('text')
    expect(classifyClip('https://a.test\nhttps://b.test')).toBe('text')
    expect(classifyClip('#ggg')).toBe('text')
  })
})

describe('recordRead', () => {
  it('adds a new copy at the top, and marks it as on the clipboard', () => {
    const h = history([text('one'), text('two')])
    expect(h.entries.map((e) => e.text)).toEqual(['two', 'one'])
    expect(h.current).toBe(h.entries[0]?.id)
  })

  it('changes nothing for the same text seen again', () => {
    const once = history([text('one')])
    expect(recordRead(once, text('one'), 99_000, () => 'x')).toBe(once)
  })

  it('moves a text already listed to the top instead of listing it twice', () => {
    const h = history([text('one'), text('two'), text('one')])
    expect(h.entries.map((e) => [e.text, e.copies])).toEqual([
      ['one', 2],
      ['two', 1],
    ])
    expect(h.entries[0]?.id).toBe('c1')
  })

  it('takes a growing selection for one copy', () => {
    const h = history([
      [text('npm'), 1000],
      [text('npm ins'), 1250],
      [text('npm install'), 1500],
    ])
    expect(h.entries.map((e) => e.text)).toEqual(['npm install'])
    expect(h.entries[0]?.firstAt).toBe(1000)
    expect(h.entries[0]?.at).toBe(1500)
  })

  it('takes a selection dragged backwards, or shrunk, for one copy too', () => {
    expect(
      history([
        [text('install'), 0],
        [text('npm install'), 300],
      ]).entries,
    ).toHaveLength(1)
    expect(
      history([
        [text('npm install'), 0],
        [text('npm'), 300],
      ]).entries,
    ).toHaveLength(1)
  })

  it('keeps two related copies apart when made apart', () => {
    const h = history([
      [text('npm'), 0],
      [text('npm install'), CLIP_ABSORB_MS + 1],
    ])
    expect(h.entries.map((e) => e.text)).toEqual(['npm install', 'npm'])
  })

  it('keeps them apart after a gap in the looks: a pause, or a pane not seen', () => {
    const h = recordRead(history([[text('seen'), 0]]), text('copied unseen'), 400, () => 'cx', null)
    expect(h.entries.map((e) => e.text)).toEqual(['copied unseen', 'seen'])
    const late = history([
      [text('seen'), 0],
      [text('seen later'), 250],
    ])
    expect(late.entries).toHaveLength(1)
    const skipped = recordRead(history([[text('a'), 0]]), text('ab'), 1250, () => 'cx', 0)
    expect(skipped.entries).toHaveLength(2)
  })

  it('never absorbs into an entry copied more than once', () => {
    const h = history([
      [text('npm'), 0],
      [text('x'), 10_000],
      [text('npm'), 20_000],
      [text('npm install'), 20_300],
    ])
    expect(h.entries.map((e) => e.text)).toEqual(['npm install', 'npm', 'x'])
  })

  it('keeps at most the limit, dropping the oldest', () => {
    const h = history(Array.from({ length: CLIP_MAX_ENTRIES + 5 }, (_, i) => text(`copy ${i}`)))
    expect(h.entries).toHaveLength(CLIP_MAX_ENTRIES)
    expect(h.entries.at(-1)?.text).toBe('copy 5')
  })

  it('lists a text too long to keep, with its beginning, and cannot put it back', () => {
    const long = 'x'.repeat(CLIP_MAX_CHARS + 1)
    const [entry] = history([text(long, '<b>x</b>')]).entries
    expect(entry?.kept).toBe(false)
    expect(entry?.chars).toBe(CLIP_MAX_CHARS + 1)
    expect(entry?.text).toHaveLength(CLIP_PREVIEW_CHARS)
    expect(entry?.html).toBeNull()
  })

  it('keeps the HTML with the text unless it is too long', () => {
    expect(history([text('a', '<b>a</b>')]).entries[0]?.html).toBe('<b>a</b>')
    const big = `<p>${'y'.repeat(CLIP_MAX_HTML_CHARS)}</p>`
    const [entry] = history([text('a', big)]).entries
    expect(entry?.html).toBeNull()
    expect(entry?.kept).toBe(true)
  })

  it('keeps the RTF beside the text, up to its limit, and only with a text kept whole', () => {
    const rtf = '{\\rtf1 {\\b bold}}'
    const [entry] = history([{ kind: 'text', text: 'bold', html: null, rtf }]).entries
    expect(entry?.rtf).toBe(rtf)
    const big = history([
      { kind: 'text', text: 'b', html: null, rtf: 'x'.repeat(CLIP_MAX_RTF_CHARS + 1) },
    ])
    expect(big.entries[0]?.rtf).toBeNull()
    const long = history([{ kind: 'text', text: 'z'.repeat(CLIP_MAX_CHARS + 1), html: null, rtf }])
    expect(long.entries[0]?.rtf).toBeNull()
  })

  it('takes the formatting of the latest copy of a text that had any, and keeps it otherwise', () => {
    const rtf = '{\\rtf1 one}'
    const h = history([
      text('one', '<b>one</b>'),
      text('two'),
      { kind: 'text', text: 'one', html: null, rtf },
    ])
    expect(h.entries[0]).toMatchObject({ text: 'one', html: null, rtf })
    const plain = history([text('one', '<b>one</b>'), text('two'), text('one')])
    expect(plain.entries[0]).toMatchObject({ html: '<b>one</b>', rtf: null })
  })

  it('counts a private copy once, never reading or listing it', () => {
    const h = history([text('one'), { kind: 'private' }, { kind: 'private' }])
    expect(h.entries).toHaveLength(1)
    expect(h.skipped).toBe(1)
    expect(h.current).toBeNull()
    // Another private copy after something else counts again.
    expect(history([text('two'), { kind: 'private' }], h).skipped).toBe(2)
  })

  it('knows nothing listed is on the clipboard when it holds an image or nothing', () => {
    const h = history([text('one'), { kind: 'other' }])
    expect(h.current).toBeNull()
    expect(h.entries).toHaveLength(1)
    // The same text copied again after the image is a copy again: it moves up, counted.
    expect(history([text('one')], h).entries[0]?.copies).toBe(2)
    expect(history([text('')], h).entries).toHaveLength(1)
  })
})

describe('putting back, removing, clearing', () => {
  const h = history([text('one'), text('two'), text('three')])

  it('marks a restored entry as current without moving it, and does not take it for a copy', () => {
    const back = restored(h, 'c1')
    expect(back.current).toBe('c1')
    expect(back.entries.map((e) => e.id)).toEqual(['c3', 'c2', 'c1'])
    expect(recordRead(back, text('one'), 99_000, () => 'x')).toBe(back)
  })

  it('refuses an entry not kept whole, or not there', () => {
    const long = history([text('z'.repeat(CLIP_MAX_CHARS + 1))])
    expect(restored(long, 'c1')).toBe(long)
    expect(restored(h, 'c9')).toBe(h)
  })

  it('removes one entry, and the mark with it when it was current', () => {
    expect(withoutEntry(h, 'c3').entries.map((e) => e.id)).toEqual(['c2', 'c1'])
    expect(withoutEntry(h, 'c3').current).toBeNull()
    expect(withoutEntry(h, 'c1').current).toBe('c3')
    expect(withoutEntry(h, 'nope')).toBe(h)
  })

  it('clears the list, and the text on the clipboard is not taken for a new copy', () => {
    const empty = cleared(h)
    expect(empty.entries).toEqual([])
    expect(recordRead(empty, text('three'), 99_000, () => 'x')).toBe(empty)
  })
})

describe('what the page is given', () => {
  it('is a preview and flags, never the whole text, the HTML or the RTF', () => {
    const long = `${'a'.repeat(CLIP_PREVIEW_CHARS)}SECRET-TAIL`
    const read: ClipRead = {
      kind: 'text',
      text: long,
      html: '<i>html</i>',
      rtf: '{\\rtf1 RTF-BODY}',
    }
    const board = boardOf(history([read]), true, false)
    const [entry] = board.entries
    expect(entry?.preview).toHaveLength(CLIP_PREVIEW_CHARS)
    expect(JSON.stringify(board)).not.toContain('SECRET-TAIL')
    expect(JSON.stringify(board)).not.toContain('<i>')
    expect(JSON.stringify(board)).not.toContain('RTF-BODY')
    expect(entry?.rich).toBe(true)
    expect(board).toMatchObject({ watching: true, paused: false, skipped: 0 })
  })
})

describe('shouldReadText', () => {
  it('reads an ordinary text every look, and a very long one every few seconds', () => {
    expect(shouldReadText(10, 1000, 1250)).toBe(true)
    expect(shouldReadText(CLIP_LARGE_CHARS, 1000, 1250)).toBe(false)
    expect(shouldReadText(CLIP_LARGE_CHARS, 1000, 1000 + CLIP_LARGE_PERIOD_MS)).toBe(true)
  })
})

describe('rows', () => {
  it('shows the first lines, tabs as spaces, blank ends trimmed', () => {
    expect(previewLines('\n\n a\tb\r\nc\nd\n\n', 2)).toEqual([' a  b', 'c'])
    expect(previewLines('', 3)).toEqual([''])
  })

  it('tags every row with its kind, and RICH under it when it came formatted', () => {
    expect(clipTags({ kind: 'text', rich: false })).toEqual(['TXT'])
    expect(clipTags({ kind: 'text', rich: true })).toEqual(['TXT', 'RICH'])
    expect(clipTags({ kind: 'url', rich: true })).toEqual(['URL', 'RICH'])
    expect(clipTags({ kind: 'color', rich: false })).toEqual(['CLR'])
  })

  it('names the formats that came with the text', () => {
    expect(clipFormats({ formats: [] })).toBe('text')
    expect(clipFormats({ formats: ['html', 'rtf'] })).toBe('text + HTML + RTF')
    const read: ClipRead = { kind: 'text', text: 'a', html: '<b>a</b>', rtf: '{}' }
    expect(boardOf(history([read]), true, false).entries[0]?.formats).toEqual(['html', 'rtf'])
  })

  it('masks a preview to its shape only', () => {
    expect(maskedPreview({ chars: 2 })).toBe('••••')
    expect(maskedPreview({ chars: 500 })).toHaveLength(24)
  })

  it('says how long ago in a few characters', () => {
    const now = 10 * 86_400_000
    expect(clipAge(now - 30_000, now)).toBe('now')
    expect(clipAge(now - 5 * 60_000, now)).toBe('5m')
    expect(clipAge(now - 3 * 3_600_000, now)).toBe('3h')
    expect(clipAge(now - 2 * 86_400_000, now)).toBe('2d')
    expect(clipAge(now + 5000, now)).toBe('now')
  })

  it('gives the size in characters, and lines when more than one', () => {
    expect(clipSize({ chars: 1, lines: 1 })).toBe('1 char')
    expect(clipSize({ chars: 1204, lines: 3 })).toBe('3 lines · 1,204 chars')
  })

  it('filters on every word, in any case', () => {
    const entries = [{ preview: 'npm run build' }, { preview: 'git log' }, { preview: 'NPM test' }]
    expect(filterEntries(entries, 'npm').map((e) => e.preview)).toEqual([
      'npm run build',
      'NPM test',
    ])
    expect(filterEntries(entries, 'npm build')).toHaveLength(1)
    expect(filterEntries(entries, '  ')).toHaveLength(3)
  })

  it('accepts only ids of the form main makes', () => {
    expect(isClipId('c1')).toBe(true)
    expect(isClipId('cdemo3')).toBe(true)
    expect(isClipId('c')).toBe(false)
    expect(isClipId('../x')).toBe(false)
    expect(isClipId(3)).toBe(false)
  })
})
