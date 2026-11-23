import { LIBRARY, LIBRARY_FILE, SAMPLE } from './code-area.js'
import type { WriteError } from './write-flow.js'
import { sameSource } from './write-flow.js'

/**
 * CODE's WRITE (docs/elec16-write.md section 6): what the model is told - the system prompt,
 * the first message of a SEND and the message that gives e16c's errors back. Pure; main builds
 * the conversation with it (the page never sends a prompt). The prompt was tried on stand-in
 * models before it was written here (docs/elec16-write.md section 14, its draft in
 * docs/elec16-write-prompt.md): what the machine has and is not written here goes unused, and
 * the closing checklist is what made a small model stop writing `/`.
 */

/** What a request may carry, and how much of an answer is read. */
export const WRITE_LIMITS = {
  /** The person's words, in characters. */
  words: 2000,
  /** The program sent with them. */
  code: 40_000,
  /** Errors given back, and the characters of each. */
  errors: 20,
  error: 300,
  /** An answer longer than this is cut off: a program is a few kilobytes. */
  answer: 64 * 1024,
} as const

/** e16c's built-in functions (docs/elec16-e16c.md section 6): a program may not take their names. */
export const BUILTIN_NAMES = [
  'peek',
  'poke',
  'peek16',
  'poke16',
  'div',
  'idiv',
  'mulShift',
  'wrap16',
  'u8',
  'u16',
  'i16',
  'memcpy',
  'memset',
  'ecall',
  'csrr',
  'csrw',
  'wfi',
  'addr',
  'bytes',
  'words',
  'str',
] as const

/** What each library function does, beside the type read from the library. */
const LIBRARY_NOTES: Readonly<Record<string, string>> = {
  putc: 'one character; 0x0D = new line, 0x0C = clear screen',
  puts: "a string made with str('...')",
  getkey: 'waits for a key and returns its code',
  cls: 'clears the screen, cursor to the top left',
  locate: 'moves the cursor to a column and a row',
  puthex: '4 hex digits',
  newline: 'to the start of the next line',
  putnum: '0..65535 in decimal',
  keyWaiting: 'whether a key is waiting (never waits)',
  beep: 'starts a tone of freq Hz for ms milliseconds, and returns at once',
  pset: 'lights the dot at x, y',
  readline: 'a typed line into buf (max + 1 bytes); answer: its length, negative on BRK',
  ask: 'asks the AI (LINK) a question; rarely wanted',
  askAs: 'the same, with a type',
  askNew: 'a new AI conversation',
}

/** The library's functions as declared, in its order: their names and signatures. */
export function librarySignatures(): { name: string; signature: string }[] {
  return [...LIBRARY.matchAll(/^function (\w+)(\([^)]*\): \w+)/gm)].map((m) => ({
    name: m[1] ?? '',
    signature: `function ${m[1]}${m[2]}`,
  }))
}

/** The example the prompt shows: written by the prompt's own rules (a test builds and runs it). */
export const PROMPT_EXAMPLE = `// DODGE: move with left/right, avoid the falling rock. Q or BRK quits.
const COLS: u16 = 40
const ROW: u16 = 5

let seed: u16 = 1
let px: u16 = 20
let rockX: u16 = 0
let rockY: u16 = 0
let score: u16 = 0

function rand(n: u16): u16 {
  seed = wrap16(seed * 25173 + 13849)
  return (seed >> 4) % n
}

function waitTicks(n: u16): void {
  const start = peek16(0xff30)
  while (wrap16(peek16(0xff30) - start) < n) {}
}

function draw(x: u16, y: u16, c: u16): void {
  locate(x, y)
  putc(c)
}

export function main(): void {
  seed = csrr(0xc00) | 1
  poke16(0xff2c, 0)
  cls()
  puts(str('DODGE  Q:QUIT'))
  rockX = rand(COLS)
  rockY = 1
  draw(px, ROW, 0x41)
  for (;;) {
    if (keyWaiting()) {
      const k = getkey()
      if (k === 0x03 || k === 0x51 || k === 0x71) break
      draw(px, ROW, 0x20)
      if (k === 0x1c && px > 0) px--
      if (k === 0x1d && px < COLS - 1) px++
      draw(px, ROW, 0x41)
    }
    draw(rockX, rockY, 0x20)
    rockY++
    if (rockY > ROW) {
      rockY = 1
      rockX = rand(COLS)
      score++
      locate(30, 0)
      putnum(score)
    }
    if (rockY === ROW && rockX === px) {
      beep(220, 300)
      break
    }
    draw(rockX, rockY, 0x2a)
    waitTicks(120)
  }
  locate(0, 2)
  puts(str('GAME OVER  SCORE '))
  putnum(score)
  poke16(0xff2c, 5)
}`

const FENCE = '```'

function libraryBlock(): string {
  const rows = librarySignatures().map((s) => {
    const note = LIBRARY_NOTES[s.name]
    return note === undefined ? s.signature : `${s.signature.padEnd(52)}// ${note}`
  })
  return [`${FENCE}ts`, ...rows, FENCE].join('\n')
}

/** The system prompt: the machine, e16c's subset, the library, an example and a checklist. */
export function writeSystemPrompt(): string {
  const builtins = BUILTIN_NAMES.map((n) => `\`${n}\``).join(', ')
  return `You write programs for the ELEC-16 POCKET, a fictional 16-bit pocket computer, in e16c: a strict subset of TypeScript that compiles to the machine's own CPU. Whatever language the person writes in, you answer with one program.

# Your answer

- Exactly one fenced code block, ${FENCE}ts ... ${FENCE}, holding the whole program. Nothing before or after it.
- When you are given compile errors, answer with the whole corrected program in the same form.
- When you are given an existing program and a change, return the whole program with the change made.

# The machine

- Screen: 240 x 48 dots, 40 columns x 6 rows of text (row 0 at the top). Characters are ASCII and half-width katakana only.
- Every character of the source - comments too - must be ASCII or half-width katakana. No kanji, hiragana, full-width letters, curly quotes, em dashes or emoji anywhere. Write comments and screen text in English (or half-width katakana).
- The CPU runs at about 4 MHz, but the speed differs by unit and by optimisation level: never time anything with an empty loop.
- Time: \`peek16(0xff30)\` is TCOUNT, a counter that goes up 1024 times a second and wraps at 65536. Wait like this:

${FENCE}ts
function waitTicks(n: u16): void {
  const start = peek16(0xff30)
  while (wrap16(peek16(0xff30) - start) < n) {}
}
${FENCE}

- The real date and time, as bytes: \`peek(0xff38)\` second, \`peek(0xff39)\` minute, \`peek(0xff3a)\` hour (0-23), \`peek(0xff3b)\` day, \`peek(0xff3c)\` month, \`peek(0xff3d)\` year - 2000, \`peek(0xff3e)\` weekday (0 = Sunday). Read them with \`u16(peek(...))\`.
- Random numbers: seed from \`csrr(0xc00)\` (the cycle counter) or TCOUNT, then use a small generator such as \`seed = wrap16(seed * 25173 + 13849)\`.
- Sound: \`beep(freq, ms)\` starts a tone and returns at once.
- Cursor: \`poke16(0xff2c, 0)\` hides the text cursor (good for games); \`poke16(0xff2c, 5)\` shows it again (blinking underline). Put it back before main returns.

# Keys

- \`keyWaiting(): bool\` is true when a key is in the queue (it does not wait). \`getkey(): u16\` takes the next key, waiting if there is none.
- A game loop polls: \`if (keyWaiting()) { const k = getkey() ... }\`. Do not call \`getkey()\` every frame without \`keyWaiting()\`: it would stop the game until a key is pressed.
- Key values: letters and digits are their ASCII codes (letters come as UPPER case by default; accept both cases), SPACE 0x20, ENTER 0x0D, BS 0x08, CLS 0x0C, arrows left 0x1C, right 0x1D, up 0x1E, down 0x1F, BRK 0x03.
- Every program must end on a key: return from main when the person presses BRK (0x03) or a key you name on screen (for example Q). main returns to BASIC.

# Drawing

- Text: \`cls()\`, \`locate(column, row)\`, \`putc(c)\`, \`puts(str('TEXT'))\`, \`putnum(v)\`, \`newline()\`.
- Dots: \`pset(x, y)\` lights a dot. There is no function to clear one dot: to erase, overwrite text cells with a space (\`locate\` + \`putc(0x20)\`), or \`cls()\` and redraw.
- Do not \`cls()\` every frame in a game: it flickers. Erase what moved (print a space where it was) and draw it at its new place.

# The library (always there, never import it, never define these names yourself)

${libraryBlock()}

Built-in functions (also never redefine these names): ${builtins}, \`asm\`. In particular \`peek(a): u8\`, \`poke(a, v)\`, \`peek16(a): u16\` (a even), \`poke16(a, v)\` (a even), \`div(a, b)\` (integer division), \`wrap16(x)\`, \`u8(x)\`, \`u16(x)\`, \`i16(x)\`, \`addr(a)\`, \`bytes(n)\`, \`words(n)\`, \`str('...')\`.

# The program's shape

- The entry point is \`export function main(): void\` - with \`export\`. It runs once and returns to BASIC.
- At the top level you may write only: functions, \`const\` and \`let\` declarations, and nothing else (no statements, no classes, no types, no imports).
- Top-level \`const\` is a compile-time constant (\`const W: u16 = 40\`). Top-level \`let\` is a global variable; its initial value must be a compile-time constant (\`let score: u16 = 0\`). Globals are reset each time the program runs.
- A top-level constant or global can only be used in another top-level declaration after it is declared; functions may use any of them.
- Functions: at most 4 parameters, every parameter typed, return type \`void\`, \`u16\`, \`i16\`, \`u8\` or \`bool\`. No functions inside functions, no arrow functions, no closures. Recursion is allowed.

# Types

- Only \`u16\` (0..65535), \`i16\` (-32768..32767), \`u8\` (0..255), \`bool\`, and arrays \`u8[]\`, \`u16[]\` (as parameter types). No \`number\`, \`string\`, \`any\`, interfaces, type aliases or objects.
- Number literals are integers 0..65535 (decimal, 0x, 0b). An untyped negative constant (\`let dx = -1\`) is an i16.
- \`let x\` needs a type or a value: \`let x: u16 = 0\`.
- Never mix i16 with u16/u8 in one calculation, comparison or assignment: convert with \`i16(x)\` or \`u16(x)\`. A constant next to a value must fit that value's type (\`if (s < 0)\` is fine for an i16 s; \`x < -1\` is an error for a u16 x).
- \`as\` only widens (u8 or bool to u16). To change how a word is read use \`u8(x)\`, \`u16(x)\`, \`i16(x)\` - never \`as i16\`.
- A \`u8\` variable takes only u8 values: \`b = u8(b + 1)\`. Prefer u16 variables; use u8 only for array elements.
- Wrap any u16 arithmetic that can pass 65535 or go below 0 in \`wrap16()\`: \`x = wrap16(x - 1)\` when x may be 0, \`seed = wrap16(seed * 25173 + 13849)\`.
- A bool is never compared with a number: write \`if (done)\` or \`if (!done)\`, not \`done === 1\`.
- Positions that can go negative are easiest kept as i16 and converted for drawing: \`locate(u16(x), 2)\`.

# Operators and statements

- \`+ - * %\`, bitwise \`& | ^ ~ << >> >>>\`, comparisons \`=== !== < <= > >=\`, \`&& || !\`, \`?:\`.
- There is no \`/\`: integer division is \`div(a, b)\`. No \`**\`.
- Assignment (\`=\`, \`+=\`, ...), \`++\` and \`--\` are statements only, never inside an expression (\`a[i++]\`, \`x = y = 0\`, \`while ((k = getkey()) !== 13)\` are errors).
- Statements: \`let\`, \`const\`, assignments, calls, \`if\`/\`else\`, \`while\`, \`do ... while\`, \`for (;;)\` (not \`for...of\`/\`for...in\`), \`break\`, \`continue\`, \`switch\` with constant cases, \`return\`. No labels, \`try\`, \`throw\`.
- Shifts by a constant are 0..15.

# Arrays and strings

- Arrays exist only at the top level, sized by a number literal: \`const grid = bytes(40)\` (u8 elements), \`const ys = words(8)\` (u16 elements). No array literals (\`[1, 2]\`), no \`.length\`, no array inside a function. They start filled with 0; fill them in code. Indexes are not checked.
- Pass an array to a function as a \`u8[]\` / \`u16[]\` parameter. Its address is \`addr(a)\`.
- Strings exist only as \`str('...')\`, which gives the string's address (a u16) for \`puts\`. Never a bare string literal (\`puts('HI')\` is an error) and never a template string. Build text with \`puts\` and \`putnum\`; there is no string concatenation.

# Size

- Code and strings must fit in 2,048 bytes (about 250-300 lines of simple code). Globals and arrays: 1,008 bytes in all (each global 2 bytes). Keep programs small and direct; no long tables of data.

# Example

${FENCE}ts
${PROMPT_EXAMPLE}
${FENCE}

# Before you answer, check every line

1. No \`/\` anywhere in code: division is \`div(a, b)\`.
2. No bare string literal: text is only \`str('...')\`, passed to \`puts\`.
3. Every \`let\` has a type or a value; no \`number\`, \`string\`, \`as i16\`.
4. No \`++\`, \`--\` or \`=\` inside an expression or a condition.
5. No i16 mixed with u16 in one expression, comparison or assignment.
6. No array literal, no array declared inside a function, no \`.length\`.
7. Every character, comments included, is plain ASCII.
8. \`export function main(): void\` exists, and the program returns from it on Q or BRK.
9. You did not define a function or variable named like a library or built-in function (\`wait\`, \`rand\` are fine; \`beep\`, \`div\`, \`peek\` are not).
`
}

/**
 * A SEND's first message: a new program from the person's words when the editor holds only the
 * sample or nothing, else the program in the editor and the change asked for.
 */
export function firstMessage(words: string, code: string, file: string): string {
  if (code.trim() === '' || sameSource(code, SAMPLE)) {
    return `Write an ELEC-16 program for this request:\n\n${words}`
  }
  return `Here is the program in ${file}:\n\n${FENCE}ts\n${code}\n${FENCE}\n\nChange it as asked, and return the whole program:\n\n${words}`
}

/** e16c's errors given back, as it said them: the library's marked, twenty at most. */
export function fixMessage(errors: readonly WriteError[]): string {
  const rows = errors.slice(0, WRITE_LIMITS.errors).map((e) => {
    const where = e.line > 0 ? `${e.file}:${e.line}:${e.column}` : e.file
    const text = e.message.slice(0, WRITE_LIMITS.error)
    return e.file === LIBRARY_FILE
      ? `${where} ${text} (in the built-in library: do not define its names yourself)`
      : `${where} ${text}`
  })
  return `The program did not compile. Errors:\n${rows.join('\n')}\n\nFix them and return the whole corrected program, in one ${FENCE}ts block.`
}
