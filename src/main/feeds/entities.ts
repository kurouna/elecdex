/**
 * Entity and character references in feed text, decoded once for every reader of it: a feed's
 * titles (parse.ts), an OPML file (opml.ts) and a page's link tags (discover.ts). There were
 * three copies, and the link tags' read no numeric reference (found in review). Never by
 * expanding a DOCTYPE's definitions: only the XML five, numeric references and a few HTML
 * names feeds commonly use. An unknown name is left as written; a reference to no character
 * is dropped.
 */

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
