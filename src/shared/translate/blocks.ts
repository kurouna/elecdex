/**
 * The unit of translation (docs/translate.md §6.1): a block is what lies between blank lines. One
 * line break inside a block stays (a wrapped sentence, a list), and a block is one number on the
 * spine. What separates the blocks - the blank lines, and the first line's indentation - is the
 * source's own and goes back into the translation unchanged.
 */

/** The longest source a run takes, in characters (§6.1). */
export const MAX_SOURCE_CHARS = 20_000

/** A block's tokens above which it is translated in parts (§6.1). */
export const PART_TOKENS = 512

export interface SourceBlock {
  /** What comes before the block: the blank lines after the previous one, and its indentation. */
  lead: string
  /** The block, without its first line's indentation or the line breaks around it. */
  text: string
}

export interface SplitSource {
  blocks: SourceBlock[]
  /** What follows the last block: trailing blank lines and spaces. */
  tail: string
}

/** A line of nothing but white space separates blocks. */
const BLANK_LINE = /\n[^\S\n]*\n(?:[^\S\n]*\n)*/

/** The source as blocks; an empty source, or one of only white space, has none. */
export function splitBlocks(source: string): SplitSource {
  const text = source.replace(/\r\n?/g, '\n')
  const blocks: SourceBlock[] = []
  let at = 0
  let lead = ''
  for (;;) {
    const rest = text.slice(at)
    const match = BLANK_LINE.exec(rest)
    const chunk = match ? rest.slice(0, match.index) : rest
    pushBlock(blocks, lead, chunk)
    if (!match) {
      const last = blocks.at(-1)
      // White space after the last block is its tail, not part of it.
      const trailing = /\s*$/.exec(chunk)?.[0] ?? ''
      if (last && chunk.trim() !== '')
        last.text = last.text.slice(0, last.text.length - trailing.length)
      return { blocks, tail: chunk.trim() === '' ? lead + chunk : trailing }
    }
    lead = chunk.trim() === '' ? lead + chunk + match[0] : match[0]
    at += match.index + match[0].length
  }
}

function pushBlock(blocks: SourceBlock[], lead: string, chunk: string): void {
  if (chunk.trim() === '') return
  // A chunk holds no blank line, so this is at most the source's first line break and an indent.
  const indent = /^\s*/.exec(chunk)?.[0] ?? ''
  blocks.push({ lead: lead + indent, text: chunk.slice(indent.length) })
}

/** The translation put together the way the source was laid out. */
export function joinBlocks(
  blocks: readonly { lead: string; text: string }[],
  tail: string,
): string {
  return blocks.map((block) => block.lead + block.text).join('') + tail
}

/**
 * A long block in parts no bigger than `maxTokens`, by sentence and, for a sentence longer still,
 * by characters. Tokens are estimated from the whole block's count, so only the block is asked for
 * (§9). Joining the parts gives the block back exactly.
 */
export function splitParts(text: string, tokens: number, maxTokens = PART_TOKENS): string[] {
  if (tokens <= maxTokens || text.length < 2) return [text]
  const perChar = tokens / text.length
  const maxChars = Math.max(1, Math.floor(maxTokens / perChar))
  const parts: string[] = []
  let current = ''
  for (const sentence of sentences(text)) {
    for (const piece of byChars(sentence, maxChars)) {
      if (current !== '' && current.length + piece.length > maxChars) {
        parts.push(current)
        current = ''
      }
      current += piece
    }
  }
  if (current !== '') parts.push(current)
  return parts
}

function sentences(text: string): string[] {
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'sentence' })
  return [...segmenter.segment(text)].map((s) => s.segment)
}

/**
 * A sentence in pieces of at most `maxChars` UTF-16 units, as `splitParts` counts them, taken a
 * code point at a time so a surrogate pair is never cut in two (one alone may pass a limit of 1).
 */
function byChars(sentence: string, maxChars: number): string[] {
  if (sentence.length <= maxChars) return [sentence]
  const pieces: string[] = []
  let piece = ''
  for (const char of sentence) {
    if (piece !== '' && piece.length + char.length > maxChars) {
      pieces.push(piece)
      piece = ''
    }
    piece += char
  }
  if (piece !== '') pieces.push(piece)
  return pieces
}
