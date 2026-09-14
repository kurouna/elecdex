import { readFileSync } from 'node:fs'
import {
  FEED_MAX_SHOWN,
  FEED_MAX_URLS,
  type FeedUpdate,
  feedUrl,
  formatItemTime,
  mergeFeeds,
  paneFeeds,
  parseFeedList,
} from '@shared/feeds'
import { describe, expect, it } from 'vitest'
import { decodeEntities, parseFeed, plainText } from '../../src/main/feeds/parse.js'

const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/feeds/${name}`, import.meta.url), 'utf8')

describe('feedUrl', () => {
  it('accepts http and https, in canonical form without the fragment', () => {
    expect(feedUrl('https://Example.test/feed.xml#top')).toBe('https://example.test/feed.xml')
    expect(feedUrl('  http://example.test  ')).toBe('http://example.test/')
  })

  it('refuses other schemes, credentials, garbage and very long URLs', () => {
    expect(feedUrl('file:///etc/passwd')).toBeNull()
    expect(feedUrl('javascript:alert(1)')).toBeNull()
    expect(feedUrl('https://user:secret@example.test/feed')).toBeNull()
    expect(feedUrl('not a url')).toBeNull()
    expect(feedUrl(42)).toBeNull()
    expect(feedUrl(`https://example.test/${'a'.repeat(2100)}`)).toBeNull()
  })
})

describe('pane feeds and the editor', () => {
  it('keeps only valid, distinct URLs from pane state, at most ten', () => {
    const many = Array.from({ length: 14 }, (_, i) => `https://example.test/${i}`)
    expect(paneFeeds(['https://a.test/x', 'ftp://b.test', 'https://a.test/x', 3])).toEqual([
      'https://a.test/x',
    ])
    expect(paneFeeds(many)).toHaveLength(FEED_MAX_URLS)
    expect(paneFeeds(undefined)).toEqual([])
  })

  it('reads one URL per line, reporting lines that are not feeds', () => {
    expect(
      parseFeedList('https://a.test/rss\r\n\n  https://b.test/atom \nhttps://a.test/rss'),
    ).toEqual({
      urls: ['https://a.test/rss', 'https://b.test/atom'],
      invalid: [],
    })
    expect(parseFeedList('https://a.test/rss\nexample.com/feed').invalid).toEqual([
      'example.com/feed',
    ])
  })
})

const update = (title: string, items: FeedUpdate['items']): FeedUpdate => ({
  url: `https://${title}.test/`,
  title,
  items,
  fetchedAt: 1,
  error: null,
})

describe('mergeFeeds', () => {
  it('interleaves feeds newest first and names each item’s feed', () => {
    const merged = mergeFeeds([
      update('a', [
        { title: 'a2', link: 'https://a.test/2', at: 200 },
        { title: 'a1', link: 'https://a.test/1', at: 100 },
      ]),
      update('b', [{ title: 'b1', link: 'https://b.test/1', at: 150 }]),
    ])
    expect(merged.map((i) => [i.title, i.source])).toEqual([
      ['a2', 'a'],
      ['b1', 'b'],
      ['a1', 'a'],
    ])
  })

  it('shows an article in two feeds once, and puts undated items last in feed order', () => {
    const merged = mergeFeeds([
      update('a', [
        { title: 'undated 1', link: null, at: null },
        { title: 'shared', link: 'https://x.test/s', at: 50 },
        { title: 'undated 2', link: null, at: null },
      ]),
      update('b', [{ title: 'shared again', link: 'https://x.test/s', at: 60 }]),
    ])
    expect(merged.map((i) => i.title)).toEqual(['shared', 'undated 1', 'undated 2'])
    expect(new Set(merged.map((i) => i.key)).size).toBe(merged.length)
  })

  it('shows at most twenty', () => {
    const items = Array.from({ length: 15 }, (_, i) => ({
      title: `t${i}`,
      link: null,
      at: i,
    }))
    expect(mergeFeeds([update('a', items), update('b', items)])).toHaveLength(FEED_MAX_SHOWN)
  })
})

describe('formatItemTime', () => {
  it('shows the time for today and the date before', () => {
    const now = new Date(2026, 8, 14, 18, 0).getTime()
    expect(formatItemTime(new Date(2026, 8, 14, 9, 5).getTime(), now)).toBe('09:05')
    expect(formatItemTime(new Date(2026, 8, 13, 23, 59).getTime(), now)).toBe('9/13')
    expect(formatItemTime(new Date(2025, 8, 14, 9, 5).getTime(), now)).toBe('9/14')
  })
})

describe('parseFeed', () => {
  it('reads RSS 2.0: titles as plain text, links resolved and safe, newest first', () => {
    const feed = parseFeed(fixture('rss2.xml'), 'https://news.example.test/feed.xml')
    expect(feed.title).toBe('Example & News')
    expect(feed.ttlMinutes).toBe(30)
    expect(feed.items).toEqual([
      {
        title: 'Markets rally & rates fall',
        link: 'https://news.example.test/latest?id=1&src=rss',
        at: Date.parse('2026-09-14T00:30:00Z'),
      },
      {
        title: 'Résumé escaped …',
        link: 'https://news.example.test/guid-link',
        at: Date.parse('2026-09-13T12:00:00Z'),
      },
      {
        title: 'Older story',
        link: 'https://news.example.test/older',
        at: Date.parse('2026-09-13T08:00:00Z'),
      },
      { title: 'Not a link', link: null, at: null },
      { title: 'Unsafe link', link: null, at: null },
    ])
  })

  it('reads Atom: the alternate link, not rel="self", and published before updated', () => {
    const feed = parseFeed(fixture('atom.xml'), 'https://blog.example.test/atom.xml')
    expect(feed.title).toBe('Atom Example')
    expect(feed.ttlMinutes).toBeNull()
    expect(feed.items.map((i) => [i.title, i.link, i.at])).toEqual([
      ['Only updated', 'https://blog.example.test/posts/2', Date.parse('2026-09-13T10:00:00Z')],
      ['First entry', 'https://blog.example.test/posts/1', Date.parse('2026-09-12T10:00:00Z')],
    ])
  })

  it('reads RSS 1.0 (RDF), whose items sit beside the channel', () => {
    const feed = parseFeed(fixture('rdf.xml'), 'https://rdf.example.test/index.rdf')
    expect(feed.title).toBe('RDF サイト')
    expect(feed.items.map((i) => i.title)).toEqual(['記事 A', '記事 B'])
  })

  it('keeps twenty items of a long feed, the newest', () => {
    const items = Array.from(
      { length: 30 },
      (_, i) =>
        `<item><title>n${i}</title><pubDate>${new Date(Date.UTC(2026, 0, 1 + i)).toUTCString()}</pubDate></item>`,
    ).join('')
    const feed = parseFeed(
      `<rss><channel><title>t</title>${items}</channel></rss>`,
      'https://x.test/',
    )
    expect(feed.items).toHaveLength(20)
    expect(feed.items[0]?.title).toBe('n29')
  })

  it('does not expand entities a DOCTYPE defines', () => {
    const laughs = `<?xml version="1.0"?>
<!DOCTYPE lolz [
  <!ENTITY lol "lol">
  <!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
  <!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">
  <!ENTITY lol4 "&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;">
]>
<rss><channel><title>t</title><item><title>&lol4;</title></item></channel></rss>`
    const feed = parseFeed(laughs, 'https://x.test/')
    expect(feed.items[0]?.title).toBe('&lol4;')
  })

  it('refuses documents that are not feeds', () => {
    expect(() => parseFeed('<html><body>hello</body></html>', 'https://x.test/')).toThrow(
      'not an RSS or Atom feed',
    )
    expect(() => parseFeed('not xml at all', 'https://x.test/')).toThrow()
  })
})

describe('text decoding', () => {
  it('decodes references once each, leaving unknown names and invalid code points', () => {
    expect(decodeEntities('&amp;lt; &#65;&#x42; &unknown; &#0; &#xD800;')).toBe(
      '&lt; AB &unknown;  ',
    )
  })

  it('makes one line of text, capped in length', () => {
    expect(plainText('  a\n\t<br/>b  ')).toBe('a b')
    expect(plainText('x'.repeat(400))).toHaveLength(300)
  })
})
