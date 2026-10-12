/**
 * What is done with a log line's text (docs/logwatch.md §5): its pattern, the kinds of its parts
 * for colour, and the values masked. Pure, and shared: main makes patterns and masks what
 * EXPLAIN sends; the page colours and masks what it shows.
 */

const UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi
const IPV4 = /\b\d{1,3}(?:\.\d{1,3}){3}(?::\d{1,5})?\b/g
/** Four groups at least, or a `::`: three are a time of day ("12:04:01"). */
const IPV6 =
  /(?<![\w:])(?:(?:[0-9a-f]{1,4}:){3,7}[0-9a-f]{1,4}|(?:[0-9a-f]{1,4}:)+:(?:[0-9a-f]{1,4}(?::[0-9a-f]{1,4})*)?|::(?:[0-9a-f]{1,4}(?::[0-9a-f]{1,4})*)?)(?![\w:])/gi
const QUOTED = /"[^"]*"|'[^']*'/g
const HEX_ID = /\b(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{6,}\b/gi
const NUMBER = /\d+(?:\.\d+)?/g

/** How much of a text makes its pattern: two lines that differ further on are one pattern. */
const SIGNATURE_CHARS = 300

/**
 * A line's pattern: the level, the source and the text with its values taken out, so
 * "job 3f2a… failed in 812ms" and "job 9c01… failed in 40ms" are one.
 */
export function signature(level: string, source: string, text: string): string {
  const shape = text
    .slice(0, SIGNATURE_CHARS)
    .replace(UUID, '{id}')
    .replace(QUOTED, '{s}')
    .replace(IPV4, '{ip}')
    .replace(IPV6, '{ip}')
    .replace(HEX_ID, '{id}')
    .replace(NUMBER, '{n}')
  return `${level} ${source} ${shape}`
}

/** The text part of a pattern: what the PATTERNS tab shows after level and source. */
export function signatureText(sig: string): string {
  const level = sig.indexOf(' ')
  const source = sig.indexOf(' ', level + 1)
  return source < 0 ? sig : sig.slice(source + 1)
}

export type TokenKind = 'text' | 'string' | 'address' | 'id' | 'path' | 'key' | 'number'

export interface Token {
  kind: TokenKind
  text: string
}

/**
 * A path and a key start only where a run of their characters starts (the look-behinds): from
 * every place inside a long run, "a/a/a…" or "a.a.a…" without an "=" was read to its end again
 * and again (seconds on one long line).
 */
const TOKEN =
  /("[^"]*")|(\b\d{1,3}(?:\.\d{1,3}){3}(?::\d{1,5})?\b)|(\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b|\b(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{8,}\b)|((?<![\w.\\/:-])(?:[A-Za-z]:)?[\\/][\w.\\/-]+)|((?<![\w.-])[\w.-]{1,64}=)|(\b\d+(?:\.\d+)?(?:ms|us|µs|ns|s|m|h|%|[KMGT]i?B|B)?\b)/gi

const KINDS: readonly TokenKind[] = ['string', 'address', 'id', 'path', 'key', 'number']

/** A text cut into the parts the pane colours, every character in exactly one part. */
export function tokens(text: string): Token[] {
  const out: Token[] = []
  let last = 0
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0
    if (at > last) out.push({ kind: 'text', text: text.slice(last, at) })
    const group = m.slice(1).findIndex((part) => part !== undefined)
    out.push({ kind: KINDS[group] ?? 'text', text: m[0] })
    last = at + m[0].length
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) })
  return out
}

const MASK = '•••'
// Each starts only where a run of its characters starts, and the parts that may repeat are
// bounded: a long line must cost one pass, not one pass from every place in it.
const EMAIL = /(?<![\w.+-])[\w.+-]{1,64}@[\w-]{1,63}(?:\.[\w-]{1,63}){1,8}\b/g
const BEARER = /\b(Bearer|Basic|token)\s+[\w.~+/-]{8,}=*/gi
/**
 * A value named as a secret: \`password=x\`, \`token: x\`, and JSON's \`"password":"x"\` (the name's
 * closing quote before the colon). Names up to 120 characters either side of the word are long
 * enough for \`spring.datasource.hikari.data-source-properties.password\`; bounded, it stays one pass.
 */
const SECRET_VALUE =
  /(?<![\w.-])([\w.-]{0,120}?(?:password|passwd|pwd|secret|token|api[_-]?key|apikey|auth|credential|session)[\w.-]{0,120})("?\s*[=:]\s*)("[^"]*"|'[^']*'|[^\s,;&}]+)/gi

/** A field's name that says its value is a secret: the card masks the value whatever it looks like. */
export const SECRET_NAME =
  /password|passwd|pwd|secret|token|api[_-]?key|apikey|auth|credential|session|cookie/i
/** Hyphens are left out, so a UUID (an id, not a key) stays as it is; a digit is required. */
const LONG_SECRET = /(?<![A-Za-z0-9+/_])[A-Za-z0-9+/_]{32,}={0,2}/g

/**
 * The text with what identifies someone or lets someone in taken out: addresses, e-mail,
 * credentials named as such, and long opaque strings that may be keys. Used where the screen
 * may be shared, and for what EXPLAIN sends when MASK is on.
 */
export function maskText(text: string): string {
  return (
    text
      // The scheme's token first: 'Authorization: Bearer x' would otherwise lose only 'Bearer'.
      .replace(BEARER, (_m, scheme: string) => `${scheme} ${MASK}`)
      .replace(SECRET_VALUE, (_m, name: string, between: string) => `${name}${between}${MASK}`)
      .replace(EMAIL, MASK)
      .replace(LONG_SECRET, (run) => (/\d/.test(run) ? MASK : run))
      .replace(IPV4, MASK)
      .replace(IPV6, MASK)
  )
}
