/**
 * Choosing which bytes of a file to read (docs/logwatch.md §3, §4). Pure: names and bytes in.
 */

/**
 * The pattern a file's name stands for when the pane follows the newest file like it: every run
 * of digits (and the date and time punctuation between them) becomes `*`, so
 * `2026-10-12T09_08_16_117Z-debug-0.log` follows as `*-debug-*.log`. A name with no digits is
 * itself, and then there is nothing to follow but the file.
 */
export function patternFor(name: string): string {
  return name.replace(/\d+(?:[-_.:T ]+\d+)*Z?/g, '*').replace(/\*+/g, '*')
}

function escapeRegExp(text: string): string {
  return text.replace(/[.+^${}()|[\]\\]/g, '\\$&')
}

/** Whether a file's name matches a pattern of `*` and `?` (case-insensitive, as names on Windows and macOS are). */
export function matchesPattern(name: string, pattern: string): boolean {
  const source = escapeRegExp(pattern).replace(/\*/g, '.*').replace(/\?/g, '.')
  return new RegExp(`^${source}$`, 'i').test(name)
}

/** A pattern main accepts: a file name with `*` or `?`, no folder, not just wildcards. */
export function isPattern(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 255 &&
    /[*?]/.test(value) &&
    !/[\\/]/.test(value) &&
    /[^*?.]/.test(value)
  )
}

/**
 * Where to start in bytes read from inside a file: after the first line break, so the first
 * line is whole. From the file's start (`atStart`) nothing is skipped.
 *
 * UTF-16 writes its break as two bytes (0A 00 little-endian, 00 0A big-endian) at an even place
 * in the file; a 0A byte anywhere else is half of another character (上 is 0A 4E), and starting
 * after it would read every character from then on one byte off. `at` is where `bytes` begin
 * in the file, to know which places are even.
 */
export function lineStart(
  bytes: Uint8Array,
  atStart: boolean,
  encoding: string,
  at: number,
): number {
  if (atStart) return 0
  const wide = encoding === 'utf-16le' ? 'le' : encoding === 'utf-16be' ? 'be' : null
  if (wide === null) {
    const lf = bytes.indexOf(0x0a)
    return lf < 0 ? bytes.length : lf + 1
  }
  const [first, second] = wide === 'le' ? [0x0a, 0] : [0, 0x0a]
  for (let i = at % 2; i + 1 < bytes.length; i += 2) {
    if (bytes[i] === first && bytes[i + 1] === second) return i + 2
  }
  return bytes.length - ((bytes.length - (at % 2)) % 2)
}

/** Line breaks in bytes: how far back to read for so many lines. */
export function countBreaks(bytes: Uint8Array): number {
  let n = 0
  for (const byte of bytes) if (byte === 0x0a) n++
  return n
}
