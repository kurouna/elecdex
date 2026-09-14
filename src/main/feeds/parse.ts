import { FEED_ITEMS_PER_FEED, type FeedItem } from '@shared/feeds'
import { XMLParser } from 'fast-xml-parser'

/**
 * Turns an RSS 2.0, RSS 1.0 (RDF) or Atom document into items.
 *
 * All three put articles in `item` or `entry` elements, so the format is not
 * detected: those are collected where any of them puts them (under `channel` in
 * RSS 2.0, beside it in RDF, under `feed` in Atom). Namespace prefixes are dropped, so
 * `dc:date` reads as `date`.
 *
 * Entities are not expanded by the parser: a DOCTYPE could define ones that
 * expand exponentially. Text is decoded here instead, with the XML entities,
 * numeric references and a few HTML names feeds commonly use; never inside
 * CDATA, which is already literal, and never by expanding a definition.
 *
 * Main has no DOMParser, hence fast-xml-parser. This module is imported lazily,
 * on the first fetch, so an app without an RSS pane never loads it.
 */

export interface ParsedFeed {
  title: string | null
  /** Newest first, at most FEED_ITEMS_PER_FEED. */
  items: FeedItem[]
  /** The RSS `<ttl>`: how long the feed asks to be cached, in minutes. */
  ttlMinutes: number | null
}

const MAX_TITLE_LENGTH = 300
const CDATA = '#cdata'
const TEXT = '#text'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  removeNSPrefix: true,
  processEntities: false,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  textNodeName: TEXT,
  cdataPropName: CDATA,
  isArray: (name) => name === 'item' || name === 'entry' || name === 'link',
})

type XmlNode = Record<string, unknown>

const isNode = (value: unknown): value is XmlNode =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const asArray = (value: unknown): unknown[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value]

const NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  laquo: '«',
  raquo: '»',
  middot: '·',
  bull: '•',
  copy: '©',
  reg: '®',
  trade: '™',
}

function codePoint(value: number): string {
  return Number.isInteger(value) &&
    value > 0 &&
    value <= 0x10ffff &&
    !(value >= 0xd800 && value <= 0xdfff)
    ? String.fromCodePoint(value)
    : ''
}

/** Decodes entity and character references; unknown names are left as written. */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, ref: string) => {
    if (ref[0] === '#') {
      const hex = ref[1] === 'x' || ref[1] === 'X'
      return codePoint(Number.parseInt(ref.slice(hex ? 2 : 1), hex ? 16 : 10))
    }
    return NAMED[ref.toLowerCase()] ?? whole
  })
}

/**
 * An element's text. The parser gives a string, an object with text and CDATA
 * parts (and attributes), or several of those; pieces outside CDATA are still
 * entity-encoded, CDATA is literal.
 */
function rawText(value: unknown): string {
  if (typeof value === 'string') return decodeEntities(value)
  if (Array.isArray(value)) return value.map(rawText).join('')
  if (!isNode(value)) return ''
  let text = ''
  if (typeof value[TEXT] === 'string') text += decodeEntities(value[TEXT])
  if (value[CDATA] !== undefined) text += cdataText(value[CDATA])
  return text
}

function cdataText(value: unknown): string {
  if (Array.isArray(value)) return value.map(cdataText).join('')
  if (isNode(value) && typeof value[TEXT] === 'string') return value[TEXT]
  return typeof value === 'string' ? value : ''
}

/**
 * The HTML tags feeds put in titles. Only these are removed, so text that merely
 * looks like a tag, such as `Vec<T>` in a programming headline, survives.
 */
const HTML_TAG =
  /<\/?(?:a|abbr|b|big|br|cite|code|del|dfn|div|em|font|h[1-6]|hr|i|img|ins|kbd|li|mark|ol|p|q|s|samp|small|span|strike|strong|sub|sup|time|tt|u|ul|var|wbr)(?:\s[^<>]*)?\/?>/gi

/**
 * Text fit for one line: HTML tags removed, references decoded, whitespace
 * collapsed, length capped. Titles often carry HTML, escaped (so it appears only
 * after the XML decoding) or in CDATA (so its own references are still encoded),
 * hence the second decoding after the tags go. It is only ever rendered as text.
 */
export function plainText(value: unknown): string {
  const text = decodeEntities(rawText(value).replace(HTML_TAG, ' ')).replace(/\s+/g, ' ').trim()
  return text.length > MAX_TITLE_LENGTH ? `${text.slice(0, MAX_TITLE_LENGTH - 1)}…` : text
}

/** An absolute http(s) URL, resolved against the feed; anything else is dropped. */
function safeUrl(href: string, base: string): string | null {
  if (href === '') return null
  try {
    const url = new URL(href, base)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}

/**
 * The URL a `<link>` names: RSS puts it in the text, Atom in `href`. Atom's
 * other relations (rel="self" is the feed itself, "enclosure" a file) are not
 * the article.
 */
function hrefOf(link: unknown): string {
  if (!isNode(link)) return rawText(link)
  const rel = link['@rel']
  if (typeof rel === 'string' && rel !== 'alternate') return ''
  return typeof link['@href'] === 'string' ? decodeEntities(link['@href']) : rawText(link)
}

function linkOf(node: XmlNode, base: string): string | null {
  for (const link of asArray(node.link)) {
    const url = safeUrl(hrefOf(link).trim(), base)
    if (url) return url
  }
  // Some feeds have no link; a guid is the article's URL unless it says otherwise.
  const guid = node.guid
  if (guid !== undefined && !(isNode(guid) && guid['@isPermaLink'] === 'false')) {
    return safeUrl(rawText(guid).trim(), base)
  }
  return null
}

const DATE_FIELDS = ['pubDate', 'published', 'updated', 'date', 'issued', 'modified'] as const

function dateOf(node: XmlNode): number | null {
  for (const field of DATE_FIELDS) {
    if (node[field] === undefined) continue
    const at = Date.parse(rawText(node[field]).trim())
    if (Number.isFinite(at)) return at
  }
  return null
}

function rootOf(doc: XmlNode): XmlNode | null {
  for (const name of ['rss', 'RDF', 'feed']) {
    const root = doc[name]
    if (isNode(root)) return root
  }
  return null
}

/** Parses a feed document; throws when it is not XML or not a feed. */
export function parseFeed(xml: string, feedUrl: string): ParsedFeed {
  const doc = parser.parse(xml) as unknown
  const root = isNode(doc) ? rootOf(doc) : null
  if (root === null) throw new Error('not an RSS or Atom feed')
  const channel = isNode(root.channel) ? root.channel : root

  const nodes = [root.item, root.entry, channel === root ? undefined : channel.item]
    .flatMap(asArray)
    .filter(isNode)
  const items: FeedItem[] = []
  for (const node of nodes) {
    const title = plainText(node.title)
    if (title === '') continue
    items.push({ title, link: linkOf(node, feedUrl), at: dateOf(node) })
  }
  // Newest first; a feed that dates nothing keeps its own order.
  items.sort((a, b) => (b.at ?? Number.NEGATIVE_INFINITY) - (a.at ?? Number.NEGATIVE_INFINITY))

  const ttl = Number.parseInt(rawText(channel.ttl), 10)
  return {
    title: plainText(channel.title) || null,
    items: items.slice(0, FEED_ITEMS_PER_FEED),
    ttlMinutes: Number.isFinite(ttl) && ttl > 0 ? ttl : null,
  }
}
