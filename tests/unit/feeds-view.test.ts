import { type FeedUpdate, mergeFeeds, type ShownItem } from '@shared/feeds'
import {
  autoTag,
  cleanTag,
  daySections,
  feedMarks,
  freeTurn,
  isMuted,
  lastSeenKey,
  litParts,
  MARK_TURNS,
  matchesFind,
  paneSeenAt,
  paneView,
  paneWords,
  storedMarks,
  WORDS_MAX,
  wordPattern,
} from '@shared/feeds-view'
import { describe, expect, it } from 'vitest'

const item = (key: string, at: number | null, extra: Partial<ShownItem> = {}): ShownItem => ({
  title: key,
  link: `https://a.test/${key}`,
  at,
  source: 'A',
  feed: 'https://a.test/feed',
  key,
  read: false,
  ...extra,
})

describe('the pane state', () => {
  it('reads the view, falling back to LIST', () => {
    expect(paneView('card')).toBe('card')
    expect(paneView('ticker')).toBe('ticker')
    expect(paneView('grid')).toBe('list')
    expect(paneView(undefined)).toBe('list')
  })

  it('reads the last look only as a positive time', () => {
    expect(paneSeenAt(1_700_000_000_000)).toBe(1_700_000_000_000)
    expect(paneSeenAt(0)).toBeNull()
    expect(paneSeenAt('1')).toBeNull()
    expect(paneSeenAt(Number.NaN)).toBeNull()
  })

  it('keeps words trimmed, distinct ignoring case, short, and at most twenty', () => {
    expect(paneWords([' CRT ', 'crt', '', 3, 'Svelte  5', 'x'.repeat(41)])).toEqual([
      'CRT',
      'Svelte 5',
    ])
    expect(paneWords(Array.from({ length: 30 }, (_, i) => `w${i}`))).toHaveLength(WORDS_MAX)
    expect(paneWords('CRT')).toEqual([])
  })
})

describe('marks', () => {
  it('makes a tag from a title: initials, a single word, or other scripts', () => {
    expect(autoTag('Kernel Notes')).toBe('KN')
    expect(autoTag('the GitHub Blog')).toBe('TG')
    expect(autoTag('Zenn')).toBe('ZE')
    expect(autoTag('ITmedia NEWS 最新記事一覧')).toBe('IN')
    expect(autoTag('技術ブログ')).toBe('技術')
    expect(autoTag('   ')).toBe('··')
  })

  it('takes a typed tag of one to three characters, upper-cased', () => {
    expect(cleanTag(' hn ')).toBe('HN')
    expect(cleanTag('ab c')).toBe('ABC')
    expect(cleanTag('abcd')).toBeNull()
    expect(cleanTag('')).toBeNull()
    expect(cleanTag(3)).toBeNull()
  })

  it('reads stored marks, dropping turns that are not on the wheel and bad tags', () => {
    expect(
      storedMarks({
        'https://a.test/': { turn: 140, tag: 'aa' },
        'https://b.test/': { turn: 141 },
        'https://c.test/': { turn: 0, tag: 'toolong' },
        'https://d.test/': 'x',
      }),
    ).toEqual({ 'https://a.test/': { turn: 140, tag: 'AA' }, 'https://c.test/': { turn: 0 } })
    expect(storedMarks(null)).toEqual({})
    expect(storedMarks([])).toEqual({})
  })

  it('gives each feed without a stored turn the first free one, and reuses the least used when full', () => {
    expect(freeTurn([])).toBe(0)
    expect(freeTurn([0, 140])).toBe(260)
    expect(freeTurn([...MARK_TURNS])).toBe(0)
    expect(freeTurn([...MARK_TURNS, 0])).toBe(140)
    const marks = feedMarks(
      ['https://a.test/', 'https://b.test/', 'https://c.test/'],
      { 'https://b.test/': { turn: 0, tag: 'BB' } },
      { 'https://a.test/': 'Alpha News', 'https://c.test/': 'Gamma' },
    )
    expect(marks).toEqual({
      'https://a.test/': { turn: 140, tag: 'AN' },
      'https://b.test/': { turn: 0, tag: 'BB' },
      'https://c.test/': { turn: 260, tag: 'GA' },
    })
  })

  it('names a feed with no title yet by its host', () => {
    expect(feedMarks(['https://www.example.test/feed'], {}, {})).toEqual({
      'https://www.example.test/feed': { turn: 0, tag: 'ET' },
    })
  })
})

describe('keywords', () => {
  it('matches a Latin word only whole, and other scripts anywhere, any case', () => {
    const pattern = wordPattern(['CRT', '宇宙'])
    expect(isMuted({ title: 'A crt monitor' }, pattern)).toBe(true)
    expect(isMuted({ title: 'sCRTipt' }, pattern)).toBe(false)
    expect(isMuted({ title: 'CRTs' }, pattern)).toBe(false)
    expect(isMuted({ title: '大型宇宙船' }, pattern)).toBe(true)
    expect(isMuted({ title: 'anything' }, null)).toBe(false)
  })

  it('treats the words as text, never as a pattern', () => {
    const pattern = wordPattern(['C++', 'a.b'])
    expect(isMuted({ title: 'Modern C++ today' }, pattern)).toBe(true)
    expect(isMuted({ title: 'axb' }, pattern)).toBe(false)
  })

  it('answers the same for every call (a global pattern keeps no position between them)', () => {
    const pattern = wordPattern(['news'])
    for (let i = 0; i < 3; i++) expect(isMuted({ title: 'the news' }, pattern)).toBe(true)
  })

  it('finds what is searched in the title or the summary', () => {
    expect(matchesFind({ title: 'Hello World' }, 'world')).toBe(true)
    expect(matchesFind({ title: 'Hello', summary: 'a Phosphor glow' }, 'phosphor')).toBe(true)
    expect(matchesFind({ title: 'Hello' }, 'nope')).toBe(false)
    expect(matchesFind({ title: 'Hello' }, '  ')).toBe(true)
  })

  it('lights highlight words and the search, merging what overlaps', () => {
    expect(litParts('Svelte and CRT', wordPattern(['CRT']), 'and')).toEqual([
      { text: 'Svelte ', lit: false },
      { text: 'and', lit: true },
      { text: ' ', lit: false },
      { text: 'CRT', lit: true },
    ])
    expect(litParts('CRT shader', wordPattern(['CRT']), 'crt sh')).toEqual([
      { text: 'CRT sh', lit: true },
      { text: 'ader', lit: false },
    ])
    expect(litParts('plain', null, '')).toEqual([{ text: 'plain', lit: false }])
    // Lower case lengthens İ: no search light rather than one in the wrong place.
    expect(litParts('İstanbul news', null, 'news')).toEqual([{ text: 'İstanbul news', lit: false }])
  })

  it('leaves muted and unsearched items out before the limit, so older ones fill the list', () => {
    const update: FeedUpdate = {
      url: 'https://a.test/feed',
      title: 'A',
      items: Array.from({ length: 4 }, (_, i) => ({
        title: i === 0 ? 'crypto news' : `story ${i}`,
        link: `https://a.test/${i}`,
        at: 100 - i,
      })),
      fetchedAt: 1,
      error: null,
      read: ['https://a.test/2'],
    }
    const mute = wordPattern(['crypto'])
    const shown = mergeFeeds([update], 2, (i) => !isMuted(i, mute))
    expect(shown.map((i) => i.title)).toEqual(['story 1', 'story 2'])
    expect(shown.map((i) => i.read)).toEqual([false, true])
    expect(shown[0]?.feed).toBe('https://a.test/feed')
  })
})

describe('days and the last look', () => {
  const now = new Date(2026, 10, 15, 21, 0).getTime()
  const at = (day: number, hour: number) => new Date(2026, 10, day, hour).getTime()

  it('cuts the list at local midnights: today, yesterday, then dates, and the undated last', () => {
    const sections = daySections(
      [
        item('a', at(15, 9)),
        item('b', at(15, 1)),
        item('c', at(14, 23)),
        item('d', at(12, 8)),
        item('e', null),
      ],
      now,
    )
    expect(sections.map((s) => [s.label, s.date, s.items.map((i) => i.key)])).toEqual([
      ['today', '11/15', ['a', 'b']],
      ['yesterday', '11/14', ['c']],
      ['11/12', null, ['d']],
      ['undated', null, ['e']],
    ])
  })

  it('crosses a month and a year', () => {
    const newYear = new Date(2027, 0, 1, 8).getTime()
    const sections = daySections([item('a', new Date(2026, 11, 31, 22).getTime())], newYear)
    expect(sections[0]?.label).toBe('yesterday')
    expect(sections[0]?.date).toBe('12/31')
  })

  it('puts LAST SEEN before the first item older than the last look, only between items', () => {
    const items = [item('a', 300), item('b', 200), item('c', 100)]
    expect(lastSeenKey(items, 250)).toBe('b')
    expect(lastSeenKey(items, 400)).toBeNull()
    expect(lastSeenKey(items, 50)).toBeNull()
    expect(lastSeenKey(items, null)).toBeNull()
    expect(lastSeenKey([item('a', 300), item('u', null)], 250)).toBeNull()
  })
})
