import {
  FEED_AUTHOR_MAX,
  FEED_CATEGORIES_MAX,
  FEED_CATEGORY_MAX,
  FEED_IMAGE_URL_MAX,
  FEED_ITEMS_PER_FEED,
  FEED_SUMMARY_MAX,
  type FeedItem,
} from '@shared/feeds'
import { XMLParser } from 'fast-xml-parser'
import { decodeEntities } from './entities.js'

export { decodeEntities }

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

/* ---- What the article view shows beside the headline ---- */

/** Text cut to `max` characters, with an ellipsis when cut; empty stays empty. */
function cut(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

/**
 * Any HTML a summary carries, as text: every tag goes (a summary is never shown as HTML), and
 * what script and style elements hold goes with them.
 */
function summaryText(value: unknown): string {
  const html = rawText(value)
    .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
  return decodeEntities(html).replace(/\s+/g, ' ').trim()
}

const SUMMARY_FIELDS = ['description', 'summary', 'encoded', 'content'] as const

function summaryOf(node: XmlNode): string | undefined {
  // YouTube's description is media:description, inside its media:group.
  for (const holder of [node, ...asArray(node.group).filter(isNode)]) {
    for (const field of SUMMARY_FIELDS) {
      if (holder[field] === undefined) continue
      const text = summaryText(holder[field])
      if (text !== '') return cut(text, FEED_SUMMARY_MAX)
    }
  }
  return undefined
}

/** An image's URL from a media element, enclosure or `<img>`: http(s) only, resolved. */
function isImageType(type: unknown, medium: unknown): boolean {
  if (medium === 'image') return true
  return typeof type === 'string' && type.toLowerCase().startsWith('image/')
}

/** The first of `values` that `accept` takes and whose `attribute` is a usable URL. */
function firstUrl(
  values: unknown,
  attribute: string,
  accept: (node: XmlNode) => boolean,
  base: string,
): string | null {
  for (const value of asArray(values)) {
    if (!isNode(value) || typeof value[attribute] !== 'string' || !accept(value)) continue
    const url = safeUrl(decodeEntities(value[attribute]).trim(), base)
    if (url) return url
  }
  return null
}

function mediaImage(node: XmlNode, base: string): string | null {
  return (
    // media:thumbnail first: it is the picture the feed meant for a list.
    firstUrl(node.thumbnail, '@url', () => true, base) ??
    firstUrl(node.content, '@url', (m) => isImageType(m['@type'], m['@medium']), base) ??
    firstUrl(node.enclosure, '@url', (e) => isImageType(e['@type'], undefined), base) ??
    // Atom's link rel="enclosure" with an image type.
    firstUrl(
      node.link,
      '@href',
      (l) => l['@rel'] === 'enclosure' && isImageType(l['@type'], undefined),
      base,
    )
  )
}

const IMG_SRC = /<img\b[^>]*?\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')/i

function imageOf(node: XmlNode, base: string): string | undefined {
  // YouTube puts its media in a media:group.
  for (const holder of [node, ...asArray(node.group).filter(isNode)]) {
    const url = mediaImage(holder, base)
    if (url) return url
  }
  for (const field of SUMMARY_FIELDS) {
    if (node[field] === undefined) continue
    const match = IMG_SRC.exec(rawText(node[field]))
    const src = match?.[1] ?? match?.[2]
    if (src === undefined) continue
    const url = safeUrl(decodeEntities(src).trim(), base)
    if (url) return url
  }
  return undefined
}

function authorOf(node: XmlNode): string | undefined {
  for (const field of ['author', 'creator'] as const) {
    for (const value of asArray(node[field])) {
      // Atom's author is an element with a name; RSS's is text, often "mail (Name)".
      const text = plainText(isNode(value) && value.name !== undefined ? value.name : value)
      // RSS 2.0 asks for "mail (Name)": the name is what a reader wants, not the address.
      const named = /^\S+@\S+\s*\((.+)\)$/.exec(text)?.[1]?.trim()
      if (named) return cut(named, FEED_AUTHOR_MAX)
      if (text !== '') return cut(text, FEED_AUTHOR_MAX)
    }
  }
  return undefined
}

function categoriesOf(node: XmlNode): string[] | undefined {
  const out: string[] = []
  for (const value of asArray(node.category)) {
    // Atom puts the name in term (or label), RSS in the text.
    const raw = isNode(value) ? (value['@label'] ?? value['@term'] ?? value) : value
    const text = cut(plainText(raw), FEED_CATEGORY_MAX)
    if (text !== '' && !out.some((c) => c.toLowerCase() === text.toLowerCase())) out.push(text)
    if (out.length === FEED_CATEGORIES_MAX) break
  }
  return out.length > 0 ? out : undefined
}

/** The fields an item has beyond its title, link and date; absent ones are left out. */
function extrasOf(node: XmlNode, base: string): Partial<FeedItem> {
  const extras: Partial<FeedItem> = {}
  const summary = summaryOf(node)
  if (summary !== undefined) extras.summary = summary
  const image = imageOf(node, base)
  // A picture's address past FEED_IMAGE_URL_MAX is dropped: the cache refuses it whole (a signed CDN
  // link of 3000 characters lost every feed's cache at the next start, found in review).
  if (image !== undefined && image.length <= FEED_IMAGE_URL_MAX) extras.image = image
  const author = authorOf(node)
  if (author !== undefined) extras.author = author
  const categories = categoriesOf(node)
  if (categories !== undefined) extras.categories = categories
  return extras
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
    items.push({ title, link: linkOf(node, feedUrl), at: dateOf(node), ...extrasOf(node, feedUrl) })
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
