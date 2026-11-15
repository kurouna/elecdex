import { FEED_MAX_URLS, feedUrl } from '@shared/feeds'
import { XMLParser } from 'fast-xml-parser'
import { decodeEntities } from './entities.js'

/**
 * OPML, the file feed readers move their subscriptions in: read on IMPORT OPML, written on
 * EXPORT OPML. Only the feeds' URLs and titles are taken; folders are flattened in order.
 * Entities are not expanded by the parser (a DOCTYPE could define ones that grow without
 * bound), as in parse.ts.
 */

export interface OpmlFeed {
  url: string
  title: string
}

/** The most outlines read: a reader's whole export, never a file that would stall main. */
const MAX_OUTLINES = 2000

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  processEntities: false,
  parseTagValue: false,
  parseAttributeValue: false,
  isArray: (name) => name === 'outline',
})

type Node = Record<string, unknown>
const isNode = (v: unknown): v is Node => typeof v === 'object' && v !== null && !Array.isArray(v)

/** The feeds an OPML file lists, distinct, in order; throws when it is not OPML. */
export function parseOpml(xml: string): OpmlFeed[] {
  const doc = parser.parse(xml) as unknown
  const body = isNode(doc) && isNode(doc.opml) ? doc.opml.body : undefined
  if (!isNode(body)) throw new Error('not an OPML file')
  const out: OpmlFeed[] = []
  let seen = 0
  const walk = (outlines: unknown): void => {
    for (const outline of Array.isArray(outlines) ? outlines : []) {
      if (!isNode(outline) || ++seen > MAX_OUTLINES) return
      const feed = outlineFeed(outline)
      if (feed !== null && !out.some((f) => f.url === feed.url)) out.push(feed)
      walk(outline.outline)
    }
  }
  walk(body.outline)
  return out
}

/** An outline as a feed: its xmlUrl, if it is one, and its title or text. */
function outlineFeed(outline: Node): OpmlFeed | null {
  const raw = outline['@xmlUrl']
  const url = typeof raw === 'string' ? feedUrl(decodeEntities(raw)) : null
  if (url === null) return null
  const title = outline['@title'] ?? outline['@text']
  return { url, title: typeof title === 'string' ? decodeEntities(title).trim().slice(0, 300) : '' }
}

const escapeXml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** An OPML 2.0 file listing the feeds; anything that is not a feed URL is left out. */
export function writeOpml(feeds: readonly OpmlFeed[], now: Date): string {
  const lines = feeds
    .filter((feed) => feedUrl(feed.url) === feed.url)
    .slice(0, FEED_MAX_URLS)
    .map((feed) => {
      const title = escapeXml(feed.title.slice(0, 300))
      return `    <outline type="rss" text="${title}" title="${title}" xmlUrl="${escapeXml(feed.url)}"/>`
    })
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<opml version="2.0">',
    '  <head>',
    '    <title>elecdex RSS</title>',
    `    <dateCreated>${now.toUTCString()}</dateCreated>`,
    '  </head>',
    '  <body>',
    ...lines,
    '  </body>',
    '</opml>',
    '',
  ].join('\n')
}

/** What the page sends to export: a list of feeds, each a URL and a title, or null. */
export function exportList(raw: unknown): OpmlFeed[] | null {
  if (!Array.isArray(raw) || raw.length > FEED_MAX_URLS) return null
  const out: OpmlFeed[] = []
  for (const value of raw) {
    if (!isNode(value)) return null
    const url = feedUrl(value.url)
    if (url === null || url !== value.url) return null
    const title = typeof value.title === 'string' ? value.title.slice(0, 300) : ''
    out.push({ url, title })
  }
  return out
}
