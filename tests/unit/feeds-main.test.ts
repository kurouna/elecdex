import { FEED_PACKS } from '@shared/feed-packs'
import { FEED_ITEMS_PER_FEED, FEED_MAX_URLS, FEED_SUMMARY_MAX, feedUrl } from '@shared/feeds'
import { DISCOVER_MAX, discoverTarget } from '@shared/feeds-discover'
import { describe, expect, it } from 'vitest'
import { discover, FALLBACK_PATHS, feedLinks } from '../../src/main/feeds/discover.js'
import {
  FeedImages,
  IMAGE_RETRY_MS,
  IMAGE_WIDTH,
  IMAGES_AT_ONCE,
  IMAGES_KEPT,
  imageSize,
  ipv6Groups,
  isLocalHost,
  MAX_IMAGE_SIDE,
  mayFetchImage,
  sizeAllowed,
} from '../../src/main/feeds/images.js'
import { exportList, parseOpml, writeOpml } from '../../src/main/feeds/opml.js'
import { parseFeed } from '../../src/main/feeds/parse.js'
import {
  heldItems,
  READ_KEY_MAX,
  READ_MAX,
  READ_TTL_MS,
  ReadMarks,
  type ReadMarksFile,
} from '../../src/main/feeds/read-marks.js'

describe('what the ADD box takes', () => {
  it('reads github: as the releases feed and youtube: as a channel', () => {
    expect(discoverTarget('github:sveltejs/svelte')).toEqual({
      kind: 'feed',
      url: 'https://github.com/sveltejs/svelte/releases.atom',
      title: 'sveltejs/svelte releases',
    })
    expect(discoverTarget('GitHub: owner/repo.git')).toMatchObject({
      url: 'https://github.com/owner/repo/releases.atom',
    })
    expect(discoverTarget('youtube:@crtworkshop')).toEqual({
      kind: 'page',
      url: 'https://www.youtube.com/@crtworkshop',
    })
    expect(discoverTarget('youtube:UCLA_DiR1FfKNvjuUpBHmylQ')).toEqual({
      kind: 'feed',
      url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCLA_DiR1FfKNvjuUpBHmylQ',
      title: 'YouTube UCLA_DiR1FfKNvjuUpBHmylQ',
    })
  })

  it('reads a youtube: channel id whatever the case of its prefix (found in review: YouTube:UC... became a handle)', () => {
    for (const prefix of ['YouTube:', 'YOUTUBE: ', 'youtube:'])
      expect(discoverTarget(`${prefix}UCLA_DiR1FfKNvjuUpBHmylQ`), prefix).toEqual({
        kind: 'feed',
        url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCLA_DiR1FfKNvjuUpBHmylQ',
        title: 'YouTube UCLA_DiR1FfKNvjuUpBHmylQ',
      })
    // The id itself keeps its case: a lower-case "uc" is a handle, as before.
    expect(discoverTarget('youtube:ucLA_DiR1FfKNvjuUpBHmylQ')).toMatchObject({ kind: 'page' })
  })

  it('refuses github: and youtube: names that are not ones', () => {
    for (const bad of ['github:../..', 'github:owner', 'github:a/b/c', 'youtube:@x', 'youtube:'])
      expect(discoverTarget(bad), bad).toBeNull()
  })

  it('takes a site with or without its scheme, and a host with a port', () => {
    expect(discoverTarget('example.com')).toEqual({ kind: 'page', url: 'https://example.com/' })
    expect(discoverTarget(' https://example.com/blog#top ')).toEqual({
      kind: 'page',
      url: 'https://example.com/blog',
    })
    expect(discoverTarget('localhost:8080/feed')).toEqual({
      kind: 'page',
      url: 'https://localhost:8080/feed',
    })
    expect(discoverTarget('http://127.0.0.1:9/feed.xml')).toEqual({
      kind: 'page',
      url: 'http://127.0.0.1:9/feed.xml',
    })
  })

  it('refuses other schemes, bare words, credentials and anything too long', () => {
    for (const bad of [
      'file:///C:/Windows/win.ini',
      'javascript:alert(1)',
      'ftp://example.com/feed',
      'news',
      'https://user:pw@example.com/feed',
      `https://example.com/${'a'.repeat(2100)}`,
      42,
    ])
      expect(discoverTarget(bad), String(bad).slice(0, 40)).toBeNull()
  })

  it('offers only packs whose every entry resolves to a feed URL', () => {
    for (const pack of FEED_PACKS) {
      expect(pack.feeds.length).toBeLessThanOrEqual(FEED_MAX_URLS)
      for (const entry of pack.feeds) {
        const target = discoverTarget(entry.url)
        expect(target, entry.url).not.toBeNull()
        expect(feedUrl(target?.url)).toBe(target?.url)
      }
    }
  })
})

describe('feedLinks', () => {
  const base = 'https://site.test/blog/post'

  it('takes the alternate RSS and Atom links and rel=feed, resolved, in page order', () => {
    const html = `<html><head>
      <link rel="stylesheet" href="/s.css">
      <link rel="alternate" type="application/rss+xml" title="All posts" href="/feed.xml">
      <LINK REL="Alternate" TYPE='application/atom+xml' TITLE='GPU &amp; graphics' HREF='../tags/gpu.atom'>
      <link rel="alternate" type="text/html" hreflang="ja" href="/ja/">
      <link rel="feed" href="https://other.test/comments">
      <link rel="alternate" type="application/rss+xml" href="/feed.xml">
    </head></html>`
    expect(feedLinks(html, base)).toEqual([
      { url: 'https://site.test/feed.xml', title: 'All posts', format: 'rss' },
      { url: 'https://site.test/tags/gpu.atom', title: 'GPU & graphics', format: 'atom' },
      { url: 'https://other.test/comments', title: '/comments', format: 'feed' },
    ])
  })

  it('does not offer a feed address the pane would refuse to list', () => {
    const html = `<link rel="alternate" type="application/rss+xml" href="/${'a'.repeat(2100)}.xml">`
    expect(feedLinks(html, base)).toEqual([])
  })

  it('drops links to other schemes and with credentials, and stops at DISCOVER_MAX', () => {
    const html = [
      '<link rel="alternate" type="application/rss+xml" href="javascript:alert(1)">',
      '<link rel="alternate" type="application/rss+xml" href="file:///etc/passwd">',
      '<link rel="alternate" type="application/rss+xml" href="https://u:p@site.test/f">',
      ...Array.from(
        { length: 12 },
        (_, i) => `<link rel="alternate" type="application/rss+xml" href="/f${i}">`,
      ),
    ].join('')
    const found = feedLinks(html, base)
    expect(found).toHaveLength(DISCOVER_MAX)
    expect(found[0]?.url).toBe('https://site.test/f0')
  })
})

describe('discover', () => {
  const rss =
    '<?xml version="1.0"?><rss version="2.0"><channel><title>Site news</title><item><title>a</title></item></channel></rss>'
  const fakeWeb = (pages: Record<string, string>) => {
    const asked: string[] = []
    return {
      asked,
      deps: {
        fetch: async (url: string) => {
          asked.push(url)
          const body = pages[url]
          return { status: body === undefined ? 404 : 200, url, text: async () => body ?? '' }
        },
        parse: async (xml: string, url: string) => parseFeed(xml, url),
      },
    }
  }

  it('answers github: without fetching anything', async () => {
    const web = fakeWeb({})
    const result = await discover(web.deps, 'github:a/b')
    expect(result).toEqual({
      ok: true,
      feeds: [
        { url: 'https://github.com/a/b/releases.atom', title: 'a/b releases', format: 'atom' },
      ],
    })
    expect(web.asked).toEqual([])
  })

  it('takes a feed URL as itself, named by its own title', async () => {
    const web = fakeWeb({ 'https://site.test/feed.xml': rss })
    expect(await discover(web.deps, 'site.test/feed.xml')).toEqual({
      ok: true,
      feeds: [{ url: 'https://site.test/feed.xml', title: 'Site news', format: 'rss' }],
    })
  })

  it("lists a page's named feeds, and asks nothing more", async () => {
    const web = fakeWeb({
      'https://site.test/':
        '<link rel="alternate" type="application/atom+xml" title="Posts" href="/atom.xml">',
    })
    const result = await discover(web.deps, 'https://site.test')
    expect(result).toEqual({
      ok: true,
      feeds: [{ url: 'https://site.test/atom.xml', title: 'Posts', format: 'atom' }],
    })
    expect(web.asked).toEqual(['https://site.test/'])
  })

  it('tries the usual places one by one when the page names none, stopping at the first feed', async () => {
    const web = fakeWeb({ 'https://site.test/': '<html></html>', 'https://site.test/rss.xml': rss })
    const result = await discover(web.deps, 'site.test')
    expect(result).toMatchObject({ ok: true, feeds: [{ url: 'https://site.test/rss.xml' }] })
    expect(web.asked).toEqual([
      'https://site.test/',
      'https://site.test/feed',
      'https://site.test/rss.xml',
    ])
  })

  it('says why when nothing is found, after at most the usual places', async () => {
    const web = fakeWeb({ 'https://site.test/': '<html></html>' })
    expect(await discover(web.deps, 'site.test')).toEqual({
      ok: false,
      error: 'no feed found on that page',
    })
    expect(web.asked).toHaveLength(1 + FALLBACK_PATHS.length)
    expect(await discover(fakeWeb({}).deps, 'site.test')).toEqual({
      ok: false,
      error: 'the page did not answer',
    })
    expect(await discover(fakeWeb({}).deps, 'file:///x')).toMatchObject({ ok: false })
  })

  it('stops trying the usual places once the site stops answering', async () => {
    const asked: string[] = []
    const deps = {
      fetch: async (url: string) => {
        asked.push(url)
        if (url === 'https://slow.test/')
          return { status: 200, url, text: async () => '<html></html>' }
        throw new Error('timed out')
      },
      parse: async (xml: string, url: string) => parseFeed(xml, url),
    }
    expect(await discover(deps, 'slow.test')).toEqual({
      ok: false,
      error: 'the site stopped answering: timed out',
    })
    // One fallback, not five times the timeout.
    expect(asked).toEqual(['https://slow.test/', 'https://slow.test/feed'])
  })

  it('reads numeric references in a link tag', () => {
    const html =
      '<link rel="alternate" type="application/rss+xml" title="R&#38;D &#x2014; news" href="/f&#x3f;a=1&#38;b=2">'
    expect(feedLinks(html, 'https://s.test/')).toEqual([
      { url: 'https://s.test/f?a=1&b=2', title: 'R&D — news', format: 'rss' },
    ])
  })

  it('reports a network failure instead of throwing', async () => {
    const deps = {
      fetch: async () => {
        throw new Error('offline')
      },
      parse: async () => {
        throw new Error('never')
      },
    }
    expect(await discover(deps, 'site.test')).toEqual({ ok: false, error: 'offline' })
  })

  it('does not take an HTML page that merely mentions <rss> for a feed', async () => {
    const web = fakeWeb({ 'https://site.test/': '<p>We have an &lt;rss&gt; feed</p><rss>broken' })
    const result = await discover(web.deps, 'site.test')
    expect(result.ok).toBe(false)
  })
})

describe('what an item carries beyond its title', () => {
  const doc = (item: string) =>
    `<?xml version="1.0"?><rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>T</title><item><title>Story</title><link>https://a.test/1</link>${item}</item></channel></rss>`

  it('reads the summary as plain text, scripts and tags gone, cut to its limit', () => {
    const [item] = parseFeed(
      doc(
        `<description><![CDATA[<p>Hello <b>world</b></p><script>alert(1)</script>]]></description>`,
      ),
      'https://a.test/feed',
    ).items
    expect(item?.summary).toBe('Hello world')
    const [long] = parseFeed(
      doc(`<description>${'word '.repeat(200)}</description>`),
      'https://a.test/feed',
    ).items
    expect(long?.summary?.length).toBe(FEED_SUMMARY_MAX)
    expect(long?.summary?.endsWith('…')).toBe(true)
  })

  it('finds the picture: media:thumbnail, media:content, an image enclosure, then the first <img>', () => {
    const image = (xml: string) => parseFeed(doc(xml), 'https://a.test/feed').items[0]?.image
    expect(
      image(
        '<media:thumbnail url="https://a.test/t.jpg"/><media:content url="https://a.test/c.jpg" medium="image"/>',
      ),
    ).toBe('https://a.test/t.jpg')
    expect(
      image(
        '<media:content url="https://a.test/v.mp4" type="video/mp4"/><media:content url="/c.jpg" type="image/jpeg"/>',
      ),
    ).toBe('https://a.test/c.jpg')
    expect(
      image(
        '<enclosure url="https://a.test/a.mp3" type="audio/mpeg"/><enclosure url="https://a.test/e.png" type="image/png"/>',
      ),
    ).toBe('https://a.test/e.png')
    expect(
      image(`<content:encoded><![CDATA[<p><img alt="x" src="/i.webp"></p>]]></content:encoded>`),
    ).toBe('https://a.test/i.webp')
    expect(image('<media:thumbnail url="javascript:alert(1)"/>')).toBeUndefined()
    expect(image('')).toBeUndefined()
  })

  it("reads YouTube's media:group for the picture and the description", () => {
    const xml = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/"><title>Ch</title><entry><title>Video</title><link rel="alternate" href="https://www.youtube.com/watch?v=x"/><media:group><media:title>Video</media:title><media:content url="https://www.youtube.com/v/x" type="application/x-shockwave-flash"/><media:thumbnail url="https://i2.ytimg.com/vi/x/hqdefault.jpg" width="480" height="360"/><media:description>About the video</media:description></media:group></entry></feed>`
    const [item] = parseFeed(xml, 'https://www.youtube.com/feeds/videos.xml').items
    expect(item?.image).toBe('https://i2.ytimg.com/vi/x/hqdefault.jpg')
    expect(item?.summary).toBe('About the video')
  })

  it('reads the author (RSS, dc:creator, Atom) and up to four distinct categories', () => {
    const [rss] = parseFeed(
      doc(
        '<dc:creator>R. Okada</dc:creator><category>A</category><category>a</category><category>B</category><category>C</category><category>D</category><category>E</category>',
      ),
      'https://a.test/feed',
    ).items
    expect(rss?.author).toBe('R. Okada')
    // RSS 2.0's "mail (Name)" gives the name.
    const [mailed] = parseFeed(
      doc('<author>desk@example.com (Demo desk)</author>'),
      'https://a.test/feed',
    ).items
    expect(mailed?.author).toBe('Demo desk')
    const [bare] = parseFeed(doc('<author>desk@example.com</author>'), 'https://a.test/feed').items
    expect(bare?.author).toBe('desk@example.com')
    expect(rss?.categories).toEqual(['A', 'B', 'C', 'D'])
    const atom = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><title>T</title><entry><title>E</title><author><name>Ann</name></author><category term="svelte" label="Svelte"/><category term="gpu"/></entry></feed>`
    const [entry] = parseFeed(atom, 'https://a.test/feed').items
    expect(entry?.author).toBe('Ann')
    expect(entry?.categories).toEqual(['Svelte', 'gpu'])
  })

  it('drops a picture address too long for the cache, keeping the rest of the item', () => {
    const long = `https://cdn.a.test/p.jpg?sig=${'x'.repeat(3000)}`
    const [item] = parseFeed(
      doc(`<media:thumbnail url="${long}"/><description>kept</description>`),
      'https://a.test/feed',
    ).items
    expect(item?.image).toBeUndefined()
    expect(item?.summary).toBe('kept')
  })

  it('leaves out what an item does not have, so an old-style item is unchanged', () => {
    const [item] = parseFeed(doc(''), 'https://a.test/feed').items
    expect(item).toEqual({ title: 'Story', link: 'https://a.test/1', at: null })
  })
})

describe("MARK ALL READ's list (heldItems)", () => {
  const A = 'https://a.test/feed'
  const B = 'https://b.test/feed'
  const held: Record<string, string[]> = { 'a-1': [A], 'a-2': [A], both: [A, B] }
  const feedsWith = (key: string) => held[key] ?? []

  it('takes the items watched feeds hold, with every feed holding one', () => {
    expect(
      heldItems(feedsWith, [
        { feed: A, key: 'a-1' },
        { feed: B, key: 'both' },
      ]),
    ).toEqual({ keys: ['a-1', 'both'], feeds: new Set([A, B]) })
  })

  it('skips an item a refresh has just pushed out, marking the rest (found in review)', () => {
    expect(
      heldItems(feedsWith, [
        { feed: A, key: 'a-1' },
        { feed: A, key: 'gone' },
        { feed: B, key: 'a-2' },
        { feed: A, key: 'a-2' },
      ]),
    ).toEqual({ keys: ['a-1', 'a-2'], feeds: new Set([A]) })
    expect(heldItems(feedsWith, [{ feed: A, key: 'gone' }])).toBeNull()
  })

  it('refuses the whole list when an entry is not the shape of one', () => {
    const big = FEED_MAX_URLS * FEED_ITEMS_PER_FEED + 1
    for (const bad of [
      [],
      'feeds',
      123,
      null,
      [{ feed: A, key: 'a-1' }, null],
      [
        { feed: A, key: 'a-1' },
        { feed: 'not a url', key: 'a-2' },
      ],
      [
        { feed: A, key: 'a-1' },
        { feed: A, key: 7 },
      ],
      [
        { feed: A, key: 'a-1' },
        { feed: A, key: 'x'.repeat(READ_KEY_MAX + 1) },
      ],
      Array.from({ length: big }, () => ({ feed: A, key: 'a-1' })),
    ])
      expect(heldItems(feedsWith, bad), JSON.stringify(bad).slice(0, 60)).toBeNull()
  })
})

describe('ReadMarks', () => {
  const harness = (file: ReadMarksFile = {}, now = 1_000_000_000_000) => {
    const saved: ReadMarksFile[] = []
    let loads = 0
    const marks = new ReadMarks({
      load: () => {
        loads += 1
        return file
      },
      save: (value) => saved.push(value),
      now: () => now,
    })
    return { marks, saved, loads: () => loads }
  }

  it('does not open the file until asked, then marks and unmarks, saving only a change', () => {
    const h = harness()
    expect(h.loads()).toBe(0)
    expect(h.marks.has('k')).toBe(false)
    expect(h.loads()).toBe(1)
    expect(h.marks.set('k', true)).toBe(true)
    expect(h.marks.set('k', true)).toBe(false)
    expect(h.marks.has('k')).toBe(true)
    expect(h.marks.set('k', false)).toBe(true)
    expect(h.saved).toEqual([{ k: 1_000_000_000_000 }, {}])
    expect(h.loads()).toBe(1)
  })

  it('forgets marks past their age, and the oldest past READ_MAX', () => {
    const now = 1_000_000_000_000
    const h = harness({ old: now - READ_TTL_MS - 1, kept: now - 1000 }, now)
    expect(h.marks.has('old')).toBe(false)
    expect(h.marks.has('kept')).toBe(true)
    const full = Object.fromEntries(
      Array.from({ length: READ_MAX }, (_, i) => [`k${i}`, now - READ_MAX + i]),
    )
    const f = harness(full, now)
    f.marks.set('new', true)
    expect(f.marks.has('k0')).toBe(false)
    expect(f.marks.has('k1')).toBe(true)
    expect(Object.keys(f.saved.at(-1) ?? {})).toHaveLength(READ_MAX)
  })

  it('marks many at once with one write, answering only what changed', () => {
    const h = harness({ a: 999_999_999_000 })
    expect(h.marks.setMany(['a', 'b', 'c', 'b'], true)).toEqual(['b', 'c'])
    expect(h.saved).toHaveLength(1)
    expect(h.marks.setMany(['a', 'b'], true)).toEqual([])
    expect(h.saved).toHaveLength(1)
    expect(h.marks.setMany(['a', 'z'], false)).toEqual(['a'])
    expect(h.marks.has('a')).toBe(false)
  })

  it('goes on when the file cannot be written', () => {
    const marks = new ReadMarks({
      load: () => ({}),
      save: () => {
        throw new Error('disk full')
      },
      now: () => 1,
    })
    expect(marks.set('k', true)).toBe(true)
    expect(marks.has('k')).toBe(true)
  })
})

/** Just enough of each format's header to declare a size. */
function png(width: number, height: number): Uint8Array {
  const b = new Uint8Array(33)
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52])
  new DataView(b.buffer).setUint32(16, width)
  new DataView(b.buffer).setUint32(20, height)
  return b
}
function jpeg(width: number, height: number): Uint8Array {
  // SOI, an APP0 of 16 bytes, then SOF0 with the size.
  const app0 = [0xff, 0xe0, 0, 16, ...new Array(14).fill(0)]
  const sof = [
    0xff,
    0xc0,
    0,
    17,
    8,
    height >> 8,
    height & 255,
    width >> 8,
    width & 255,
    3,
    0,
    0,
    0,
    0,
  ]
  return new Uint8Array([0xff, 0xd8, ...app0, ...sof])
}
function gif(width: number, height: number): Uint8Array {
  return new Uint8Array([
    0x47,
    0x49,
    0x46,
    0x38,
    0x39,
    0x61,
    width & 255,
    width >> 8,
    height & 255,
    height >> 8,
  ])
}
function webp(width: number, height: number): Uint8Array {
  const b = new Uint8Array(30)
  b.set(new TextEncoder().encode('RIFF'), 0)
  b.set(new TextEncoder().encode('WEBPVP8X'), 8)
  const w = width - 1
  const h = height - 1
  b.set([w & 255, (w >> 8) & 255, (w >> 16) & 255, h & 255, (h >> 8) & 255, (h >> 16) & 255], 24)
  return b
}

describe('what a picture may be', () => {
  it('reads the size each format declares', () => {
    expect(imageSize(png(640, 480))).toEqual({ width: 640, height: 480 })
    expect(imageSize(jpeg(1024, 768))).toEqual({ width: 1024, height: 768 })
    expect(imageSize(gif(300, 200))).toEqual({ width: 300, height: 200 })
    expect(imageSize(webp(1200, 900))).toEqual({ width: 1200, height: 900 })
    expect(
      imageSize(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>')),
    ).toBeNull()
    expect(imageSize(new Uint8Array([0xff, 0xd8, 0x00]))).toBeNull()
  })

  it('reads a JPEG through fill bytes and markers without a length (found in review)', () => {
    const plain = jpeg(800, 600)
    const head = plain.subarray(0, 20)
    const sof = plain.subarray(20)
    // 0xFF fill before a marker, and a TEM (0x01) and an RST (0xD3) standing alone.
    for (const between of [
      [0xff, 0xff],
      [0xff, 0x01],
      [0xff, 0xd3],
      [0xff, 0xff, 0xff, 0x01],
    ]) {
      const b = new Uint8Array([...head, ...between, ...sof])
      expect(imageSize(b), between.join(',')).toEqual({ width: 800, height: 600 })
    }
  })

  it('refuses what declares more pixels than may be decoded, before decoding it', () => {
    expect(sizeAllowed({ width: 4000, height: 3000 })).toBe(true)
    expect(sizeAllowed({ width: MAX_IMAGE_SIDE + 1, height: 10 })).toBe(false)
    expect(sizeAllowed({ width: 8000, height: 8000 })).toBe(false)
    expect(sizeAllowed({ width: 0, height: 10 })).toBe(false)
    expect(sizeAllowed(null)).toBe(false)
  })

  it('tells this machine and the local network from the internet', () => {
    for (const host of [
      'localhost',
      'app.localhost',
      'nas.local',
      '127.0.0.1',
      '10.1.2.3',
      '172.20.0.1',
      '192.168.1.10',
      '169.254.1.1',
      '100.64.0.1',
      '0.0.0.0',
      '[::1]',
      '[fd00::1]',
      '[fe80::1]',
      '[::ffff:192.168.0.1]',
      'router',
      'printer.lan',
      'db.internal',
    ])
      expect(isLocalHost(host), host).toBe(true)
    for (const host of [
      'example.com',
      '8.8.8.8',
      '172.32.0.1',
      '192.169.0.1',
      '[2001:db8::1]',
      'cdn.example.co.jp',
    ])
      expect(isLocalHost(host), host).toBe(false)
  })

  it('sees an IPv4 address written as IPv6, however the URL parser spells it', () => {
    // URL turns [::ffff:127.0.0.1] into [::ffff:7f00:1]: the dotted form never reaches the check.
    for (const url of [
      'http://[::ffff:127.0.0.1]/p.png',
      'http://[::ffff:169.254.169.254]/latest/meta-data',
      'http://[0:0:0:0:0:ffff:c0a8:0101]/p.png',
      'http://[::127.0.0.1]/p.png',
      'http://[64:ff9b::10.0.0.1]/p.png',
      'http://[::]/p.png',
    ]) {
      expect(isLocalHost(new URL(url).hostname), url).toBe(true)
      expect(mayFetchImage(url, 'https://news.example.com/feed'), url).toBe(false)
    }
    for (const url of [
      'http://[::ffff:8.8.8.8]/p.png',
      'http://[64:ff9b::8.8.8.8]/p.png',
      'http://[2606:4700::6810:84e5]/p.png',
    ])
      expect(isLocalHost(new URL(url).hostname), url).toBe(false)
    expect(ipv6Groups('::ffff:7f00:1')).toEqual([0, 0, 0, 0, 0, 0xffff, 0x7f00, 1])
    expect(ipv6Groups('1::2::3')).toBeNull()
    expect(ipv6Groups('1:2:3')).toBeNull()
  })

  it('fetches a local picture only for a feed on the same host', () => {
    expect(mayFetchImage('https://cdn.example.com/p.jpg', 'https://news.example.com/feed')).toBe(
      true,
    )
    expect(mayFetchImage('http://192.168.1.10/admin.png', 'https://news.example.com/feed')).toBe(
      false,
    )
    expect(mayFetchImage('http://127.0.0.1:8080/p.png', 'http://127.0.0.1:9000/feed')).toBe(true)
    expect(mayFetchImage('http://nas.local/p.png', 'http://nas.local/rss')).toBe(true)
    expect(mayFetchImage('file:///C:/p.png', 'https://a.test/feed')).toBe(false)
  })
})

describe('FeedImages', () => {
  const image = (status = 200, type = 'image/png', bytes = png(64, 48), url = '') => ({
    status,
    type,
    url,
    bytes: async () => bytes,
    cancel: () => {},
  })
  const ours = () => 'https://a.test/feed'

  it('fetches only what is allowed, once, and shrinks what it can decode', async () => {
    const asked: string[] = []
    const widths: number[] = []
    const images = new FeedImages({
      fetch: async (url) => {
        asked.push(url)
        return image()
      },
      shrink: (_bytes, width) => {
        widths.push(width)
        return 'data:image/jpeg;base64,AA=='
      },
      feedOf: (url) => (url === 'https://a.test/not-ours.png' ? null : ours()),
      now: () => 0,
    })
    expect(await images.get('https://a.test/not-ours.png')).toBeNull()
    expect(await images.get('https://a.test/p.jpg')).toBe('data:image/jpeg;base64,AA==')
    expect(await images.get('https://a.test/p.jpg')).toBe('data:image/jpeg;base64,AA==')
    expect(asked).toEqual(['https://a.test/p.jpg'])
    expect(widths).toEqual([IMAGE_WIDTH])
  })

  it('passes a type it cannot decode through as it came, and refuses SVG and errors for good', async () => {
    const asked: string[] = []
    const replies: Record<string, ReturnType<typeof image>> = {
      'https://a.test/w.webp': image(200, 'image/webp', webp(32, 16)),
      'https://a.test/s.svg': image(200, 'image/svg+xml'),
      'https://a.test/gone.png': image(404, 'text/html'),
    }
    const images = new FeedImages({
      fetch: async (url) => {
        asked.push(url)
        return replies[url] ?? image(500)
      },
      shrink: () => null,
      feedOf: ours,
      now: () => 0,
    })
    expect(await images.get('https://a.test/w.webp')).toMatch(/^data:image\/webp;base64,/)
    expect(await images.get('https://a.test/s.svg')).toBeNull()
    expect(await images.get('https://a.test/gone.png')).toBeNull()
    expect(await images.get('https://a.test/gone.png')).toBeNull()
    expect(asked.filter((u) => u.endsWith('gone.png'))).toHaveLength(1)
  })

  it('asks again after a passing failure, never after a refusal, and frees what it will not read', async () => {
    let now = 0
    const asked: string[] = []
    let cancelled = 0
    let offline = true
    const images = new FeedImages({
      fetch: async (url) => {
        asked.push(url)
        if (url.endsWith('net.png') && offline) throw new Error('net::ERR_INTERNET_DISCONNECTED')
        if (url.endsWith('busy.png') && offline)
          return { ...image(503, 'text/html'), cancel: () => cancelled++ }
        if (url.endsWith('page.png'))
          return { ...image(200, 'text/html'), cancel: () => cancelled++ }
        return image()
      },
      shrink: () => 'data:,',
      feedOf: () => 'https://a.test/feed',
      now: () => now,
    })
    for (const name of ['net', 'busy', 'page']) {
      expect(await images.get(`https://a.test/${name}.png`)).toBeNull()
    }
    expect(cancelled).toBe(2)
    offline = false
    now = IMAGE_RETRY_MS - 1
    for (const name of ['net', 'busy', 'page']) await images.get(`https://a.test/${name}.png`)
    expect(asked).toHaveLength(3)
    now = IMAGE_RETRY_MS
    expect(await images.get('https://a.test/net.png')).toBe('data:,')
    expect(await images.get('https://a.test/busy.png')).toBe('data:,')
    expect(await images.get('https://a.test/page.png')).toBeNull()
    expect(asked).toEqual([
      'https://a.test/net.png',
      'https://a.test/busy.png',
      'https://a.test/page.png',
      'https://a.test/net.png',
      'https://a.test/busy.png',
    ])
  })

  it('never decodes a picture declaring too many pixels, nor one a feed on the internet puts on the LAN', async () => {
    const asked: string[] = []
    let decoded = 0
    const images = new FeedImages({
      fetch: async (url) => {
        asked.push(url)
        if (url.endsWith('bomb.png')) return image(200, 'image/png', png(20000, 20000))
        if (url.endsWith('moved.png'))
          return image(200, 'image/png', png(10, 10), 'http://10.0.0.5/x.png')
        return image()
      },
      shrink: () => {
        decoded += 1
        return 'data:,'
      },
      feedOf: () => 'https://news.example.com/feed',
      now: () => 0,
    })
    expect(await images.get('https://cdn.example.com/bomb.png')).toBeNull()
    expect(await images.get('http://192.168.1.1/router.png')).toBeNull()
    expect(await images.get('https://cdn.example.com/moved.png')).toBeNull()
    expect(decoded).toBe(0)
    expect(asked).toEqual(['https://cdn.example.com/bomb.png', 'https://cdn.example.com/moved.png'])
  })

  it(`asks for at most ${IMAGES_AT_ONCE} at once, one request per picture however often asked, and keeps the last ${IMAGES_KEPT}`, async () => {
    let running = 0
    let most = 0
    const asked: string[] = []
    const release: Array<() => void> = []
    const images = new FeedImages({
      fetch: async (url) => {
        asked.push(url)
        running += 1
        most = Math.max(most, running)
        await new Promise<void>((go) => release.push(go))
        running -= 1
        return image()
      },
      shrink: () => 'data:,',
      feedOf: ours,
      now: () => 0,
    })
    /** Lets every request waiting go, a turn at a time, until `job` is done. */
    const finish = async (job: Promise<unknown>) => {
      let done = false
      void job.then(() => {
        done = true
      })
      while (!done) {
        await new Promise((r) => setTimeout(r, 0))
        for (const go of release.splice(0)) go()
      }
    }
    const url = (n: number) => `https://a.test/${n}.jpg`
    await finish(Promise.all([1, 2, 3, 4, 1].map((n) => images.get(url(n)))))
    expect(most).toBe(IMAGES_AT_ONCE)
    expect(asked).toHaveLength(4)
    expect(images.size()).toBe(4)
    for (let n = 5; n < IMAGES_KEPT + 10; n++) await finish(images.get(url(n)))
    expect(images.size()).toBe(IMAGES_KEPT)
  })

  it(`stays at ${IMAGES_AT_ONCE} when a picture is asked for as one ends and a waiting one has not begun (found in review)`, async () => {
    // A request may come any number of microtasks after one ends; one of the depths below lands
    // between the slot freed and the waiting request taking it.
    for (let depth = 0; depth < 24; depth++) {
      let running = 0
      let most = 0
      const release = new Map<string, () => void>()
      const images = new FeedImages({
        fetch: async (url) => {
          running += 1
          most = Math.max(most, running)
          await new Promise<void>((go) => release.set(url, go))
          running -= 1
          return image()
        },
        shrink: () => 'data:,',
        feedOf: ours,
        now: () => 0,
      })
      const url = (n: number) => `https://a.test/${depth}-${n}.jpg`
      const jobs: Array<Promise<unknown>> = [1, 2, 3].map((n) => images.get(url(n)))
      await new Promise((r) => setTimeout(r, 0))
      release.get(url(1))?.()
      let later: Promise<unknown> = Promise.resolve()
      for (let i = 0; i < depth; i++) later = later.then(() => undefined)
      jobs.push(later.then(() => images.get(url(4))))
      for (let turn = 0; turn < 10; turn++) {
        await new Promise((r) => setTimeout(r, 0))
        for (const go of release.values()) go()
      }
      await Promise.all(jobs)
      expect(most, `depth ${depth}`).toBeLessThanOrEqual(IMAGES_AT_ONCE)
    }
  })
})

describe('OPML', () => {
  it('reads the feeds of an OPML file, nested folders flattened, distinct, valid only', () => {
    const xml = `<?xml version="1.0"?><opml version="2.0"><head><title>x</title></head><body>
      <outline text="Tech"><outline type="rss" text="A &amp; B" xmlUrl="https://a.test/feed?x=1&amp;y=2"/>
        <outline text="Deep"><outline title="C" xmlUrl="https://c.test/rss"/></outline></outline>
      <outline text="dup" xmlUrl="https://a.test/feed?x=1&amp;y=2"/>
      <outline text="bad" xmlUrl="file:///etc/passwd"/>
      <outline text="folder only"/>
    </body></opml>`
    expect(parseOpml(xml)).toEqual([
      { url: 'https://a.test/feed?x=1&y=2', title: 'A & B' },
      { url: 'https://c.test/rss', title: 'C' },
    ])
  })

  it('refuses a file that is not OPML, and does not expand a DOCTYPE', () => {
    expect(() => parseOpml('<rss/>')).toThrow('not an OPML file')
    const bomb = `<?xml version="1.0"?><!DOCTYPE opml [<!ENTITY a "aaaaaaaaaa"><!ENTITY b "&a;&a;&a;&a;&a;">]><opml><body><outline text="&b;" xmlUrl="https://a.test/f"/></body></opml>`
    expect(parseOpml(bomb)).toEqual([{ url: 'https://a.test/f', title: '&b;' }])
  })

  it('decodes decimal and hexadecimal references in titles and addresses', () => {
    const xml = `<opml version="2.0"><body><outline text="Caf&#xE9; &#233;" xmlUrl="https://a.test/f&#x3F;q=1"/></body></opml>`
    expect(parseOpml(xml)).toEqual([{ url: 'https://a.test/f?q=1', title: 'Café é' }])
  })

  it('writes what it reads back, escaped', () => {
    const feeds = [
      { url: 'https://a.test/feed?x=1&y=2', title: 'A <&> "B"' },
      { url: 'https://c.test/rss', title: 'C' },
    ]
    const xml = writeOpml(feeds, new Date(Date.UTC(2026, 10, 15)))
    expect(xml).toContain('xmlUrl="https://a.test/feed?x=1&amp;y=2"')
    expect(parseOpml(xml)).toEqual(feeds)
  })

  it('takes from the page only a short list of canonical feed URLs', () => {
    expect(exportList([{ url: 'https://a.test/f', title: 'A' }])).toEqual([
      { url: 'https://a.test/f', title: 'A' },
    ])
    expect(exportList([{ url: 'https://a.test/f' }])).toEqual([
      { url: 'https://a.test/f', title: '' },
    ])
    expect(exportList([{ url: 'HTTPS://A.test/f', title: 'A' }])).toBeNull()
    expect(exportList([{ url: 'file:///etc/passwd', title: 'x' }])).toBeNull()
    expect(exportList([3])).toBeNull()
    expect(exportList('x')).toBeNull()
    expect(
      exportList(
        Array.from({ length: FEED_MAX_URLS + 1 }, (_, i) => ({
          url: `https://a.test/${i}`,
          title: '',
        })),
      ),
    ).toBeNull()
  })
})
