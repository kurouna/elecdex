/**
 * The markdown a model answers in, as a tree the chat pane draws with elements of
 * its own - never as HTML. What a model writes is untrusted text (it may be
 * quoting a web page, or steered by one), and a tree of known nodes cannot carry
 * a script, a style or an image request whatever it says.
 *
 * It covers what models actually write: paragraphs, headings, fenced code,
 * lists, quotes, tables and rules; code, emphasis, strikethrough and links
 * inline. It is forgiving rather than exact, because it is fed an answer that is
 * still being written: a fence not yet closed is a code block that is open.
 * Line breaks inside a paragraph are kept, as local models use them.
 */

export type Inline =
  | { t: 'text'; v: string }
  | { t: 'code'; v: string }
  | { t: 'strong' | 'em' | 'del'; c: Inline[] }
  | { t: 'link'; href: string; c: Inline[] }

export type Block =
  | { t: 'p'; c: Inline[] }
  | { t: 'h'; level: number; c: Inline[] }
  | { t: 'code'; lang: string; v: string }
  | { t: 'list'; ordered: boolean; start: number; items: Block[][] }
  | { t: 'quote'; c: Block[] }
  | { t: 'table'; head: Inline[][]; rows: Inline[][][] }
  | { t: 'hr' }

/** Only a web address becomes a link; anything else stays the text it was. */
export function safeHref(raw: string): string | null {
  try {
    const url = new URL(raw)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

const INLINE =
  /(`+)([\s\S]+?)\1|\*\*([\s\S]+?)\*\*(?!\*)|__([\s\S]+?)__|~~([\s\S]+?)~~|\*(?!\s)([^*\n]+?)\*|(?<![\w])_(?!\s)([^_\n]+?)_(?![\w])|\[([^\]\n]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])/g

function inlineNode(m: RegExpExecArray): Inline {
  if (m[2] !== undefined) return { t: 'code', v: m[2].trim() === '' ? m[2] : m[2].trim() }
  const strong = m[3] ?? m[4]
  if (strong !== undefined) return { t: 'strong', c: parseInline(strong) }
  if (m[5] !== undefined) return { t: 'del', c: parseInline(m[5]) }
  const em = m[6] ?? m[7]
  if (em !== undefined) return { t: 'em', c: parseInline(em) }
  if (m[8] !== undefined && m[9] !== undefined) {
    const href = safeHref(m[9])
    return href === null ? { t: 'text', v: m[0] } : { t: 'link', href, c: parseInline(m[8]) }
  }
  const href = safeHref(m[0])
  return href === null ? { t: 'text', v: m[0] } : { t: 'link', href, c: [{ t: 'text', v: m[0] }] }
}

export function parseInline(source: string): Inline[] {
  const out: Inline[] = []
  let last = 0
  for (const m of source.matchAll(INLINE)) {
    if (m.index > last) out.push({ t: 'text', v: source.slice(last, m.index) })
    out.push(inlineNode(m))
    last = m.index + m[0].length
  }
  if (last < source.length) out.push({ t: 'text', v: source.slice(last) })
  return out
}

const FENCE = /^ {0,3}(`{3,}|~{3,})\s*([\w+#.-]*)/
const HEADING = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/
const RULE = /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/
const QUOTE = /^ {0,3}>\s?/
const ITEM = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/
const TABLE_RULE = /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/

const isBlank = (line: string | undefined): boolean => line === undefined || line.trim() === ''

const cells = (line: string): string[] =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replace(/\\\|/g, '|'))

/** Whether a table starts here: a row of cells over a row of dashes. */
const tableAt = (lines: readonly string[], i: number): boolean =>
  (lines[i] ?? '').includes('|') &&
  TABLE_RULE.test(lines[i + 1] ?? '') &&
  (lines[i + 1] ?? '').includes('-')

/** Whether a line opens a block of its own, which ends the paragraph above it. */
function startsBlock(lines: readonly string[], i: number): boolean {
  const line = lines[i] ?? ''
  return (
    FENCE.test(line) ||
    HEADING.test(line) ||
    RULE.test(line) ||
    QUOTE.test(line) ||
    ITEM.test(line) ||
    tableAt(lines, i)
  )
}

type Step = { block: Block; next: number }

function fence(lines: readonly string[], i: number, open: RegExpExecArray): Step {
  const mark = open[1] ?? '```'
  const body: string[] = []
  let at = i + 1
  for (; at < lines.length; at += 1) {
    const line = lines[at] ?? ''
    if (line.trim().startsWith(mark) && line.trim().replace(/[`~]/g, '') === '') break
    body.push(line)
  }
  return { block: { t: 'code', lang: open[2] ?? '', v: body.join('\n') }, next: at + 1 }
}

function quote(lines: readonly string[], i: number): Step {
  const inner: string[] = []
  let at = i
  while (at < lines.length && QUOTE.test(lines[at] ?? '')) {
    inner.push((lines[at] ?? '').replace(QUOTE, ''))
    at += 1
  }
  return { block: { t: 'quote', c: parseBlocks(inner) }, next: at }
}

function table(lines: readonly string[], i: number): Step {
  const head = cells(lines[i] ?? '').map(parseInline)
  const rows: Inline[][][] = []
  let at = i + 2
  while (at < lines.length && !isBlank(lines[at]) && (lines[at] ?? '').includes('|')) {
    rows.push(cells(lines[at] ?? '').map(parseInline))
    at += 1
  }
  return { block: { t: 'table', head, rows }, next: at }
}

/** The lines of one list item: its first, and those after it indented under its text. */
function itemLines(lines: readonly string[], i: number, indent: number, first: string) {
  const body = [first]
  let at = i + 1
  for (; at < lines.length; at += 1) {
    const line = lines[at] ?? ''
    if (isBlank(line)) {
      // A blank line stays in the item only when what follows is still indented under it.
      const after = lines[at + 1]
      if (isBlank(after) || (after ?? '').search(/\S/) <= indent) break
      body.push('')
      continue
    }
    if (line.search(/\S/) <= indent) break
    body.push(line.slice(Math.min(indent + 2, line.search(/\S/))))
  }
  return { body, next: at }
}

/** Whether an item belongs to the list being read: same indent, same kind of marker. */
const sameList = (m: RegExpExecArray, indent: number, ordered: boolean): boolean =>
  (m[1] ?? '').length === indent && /\d/.test(m[2] ?? '') === ordered

function list(lines: readonly string[], i: number, first: RegExpExecArray): Step {
  const indent = (first[1] ?? '').length
  const ordered = /\d/.test(first[2] ?? '')
  const items: Block[][] = []
  let at = i
  while (at < lines.length) {
    const m = ITEM.exec(lines[at] ?? '')
    if (m === null || !sameList(m, indent, ordered)) break
    const item = itemLines(lines, at, indent, m[3] ?? '')
    items.push(parseBlocks(item.body))
    at = item.next
    // Items may be a blank line apart.
    if (isBlank(lines[at]) && ITEM.test(lines[at + 1] ?? '')) at += 1
  }
  const start = ordered ? Number.parseInt(first[2] ?? '1', 10) : 1
  return { block: { t: 'list', ordered, start, items }, next: at }
}

function paragraph(lines: readonly string[], i: number): Step {
  const body = [lines[i] ?? '']
  let at = i + 1
  while (at < lines.length && !isBlank(lines[at]) && !startsBlock(lines, at)) {
    body.push(lines[at] ?? '')
    at += 1
  }
  const text = body.map((line) => line.trim()).join('\n')
  return { block: { t: 'p', c: parseInline(text) }, next: at }
}

function blockAt(lines: readonly string[], i: number): Step {
  const line = lines[i] ?? ''
  const fenced = FENCE.exec(line)
  if (fenced !== null) return fence(lines, i, fenced)
  const heading = HEADING.exec(line)
  if (heading !== null) {
    const level = (heading[1] ?? '#').length
    return { block: { t: 'h', level, c: parseInline(heading[2] ?? '') }, next: i + 1 }
  }
  if (RULE.test(line)) return { block: { t: 'hr' }, next: i + 1 }
  if (QUOTE.test(line)) return quote(lines, i)
  const item = ITEM.exec(line)
  if (item !== null) return list(lines, i, item)
  if (tableAt(lines, i)) return table(lines, i)
  return paragraph(lines, i)
}

function parseBlocks(lines: readonly string[]): Block[] {
  const blocks: Block[] = []
  let i = 0
  while (i < lines.length) {
    if (isBlank(lines[i])) {
      i += 1
      continue
    }
    const step = blockAt(lines, i)
    blocks.push(step.block)
    i = step.next
  }
  return blocks
}

export function parseMarkdown(source: string): Block[] {
  return parseBlocks(source.replace(/\r\n?/g, '\n').split('\n'))
}
