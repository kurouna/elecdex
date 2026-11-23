/**
 * CODE's WRITE (docs/elec16-write.md section 7): the program in a model's answer. Pure, for
 * main and the page alike. A model's text is untrusted data: it only ever becomes the editor's
 * text, which e16c then compiles to run as E16 code on the machine - never run, never drawn as
 * HTML.
 */

/** An opening fence line: three backticks and a language name or none. */
const OPENING = /^```[A-Za-z0-9_+-]*[ \t]*$/
const CLOSING = /^```[ \t]*$/

const linesOf = (text: string): string[] => text.replace(/\r\n?/g, '\n').split('\n')

/** Every fenced block, in order; one not closed runs to the end. */
function blocks(text: string): string[] {
  const found: string[] = []
  let inside: string[] | null = null
  for (const line of linesOf(text)) {
    if (inside === null) {
      if (OPENING.test(line)) inside = []
    } else if (CLOSING.test(line)) {
      found.push(inside.join('\n'))
      inside = null
    } else {
      inside.push(line)
    }
  }
  if (inside !== null) found.push(inside.join('\n'))
  return found
}

/**
 * The program in an answer: the last fenced block that has `export function main`, else the
 * last block (e16c then says what is missing). None without a fence: the prompt asks for one,
 * and a fix round asks again.
 */
export function extractCode(text: string): string | null {
  const found = blocks(text)
  return found.findLast((b) => /export\s+function\s+main\b/.test(b)) ?? found.at(-1) ?? null
}

/**
 * What the editor shows of an answer still coming: the inside of its first fence so far, never
 * the start of a closing fence half arrived.
 */
export function streamingCode(partial: string): string {
  const lines = linesOf(partial)
  const open = lines.findIndex((l) => OPENING.test(l))
  // The opening line is only known for one once its line has ended.
  if (open < 0 || open === lines.length - 1) return ''
  const body: string[] = []
  for (const line of lines.slice(open + 1)) {
    if (CLOSING.test(line)) return body.join('\n')
    body.push(line)
  }
  const last = body.at(-1) ?? ''
  if (/^`{1,3}$/.test(last)) body[body.length - 1] = ''
  return body.join('\n')
}

/** Marks a model writes that the machine's characters do not have, as the ASCII they stand for. */
const TYPOGRAPHIC: readonly [RegExp, string][] = [
  [/[‘’‚′]/g, "'"],
  [/[“”„″]/g, '"'],
  [/[–—−]/g, '-'],
  [/…/g, '...'],
  [/[ 　   ]/g, ' '],
]

/**
 * A model's program made ready for the card: line ends as LF, tabs as two spaces, typographic
 * marks as ASCII, so a curly quote in a comment does not spend a fix. Anything else the machine
 * cannot keep is left for `sourceToMachine` to name.
 */
export function machineText(code: string): string {
  let text = code.replace(/\r\n?/g, '\n').replace(/\t/g, '  ')
  for (const [from, to] of TYPOGRAPHIC) text = text.replace(from, to)
  return text
}
