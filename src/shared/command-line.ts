/**
 * Splitting a command line into its arguments, shared by the collector (which
 * reads what a listening process was started with) and main (which runs the
 * command the user set for opening a file).
 */

/**
 * Splits a command line the way the C runtime does on Windows
 * (CommandLineToArgvW): quotes group, and backslashes are literal except
 * before a quote. POSIX lines arrive already split, joined with NULs.
 */
export function splitCommandLine(line: string): string[] {
  if (line.includes('\0')) return line.split('\0').filter((arg) => arg !== '')
  const split: Splitting = { args: [], current: '', quoted: false, started: false }
  let i = 0
  while (i < line.length) i = step(line, i, split)
  if (split.started) split.args.push(split.current)
  return split.args
}

interface Splitting {
  args: string[]
  current: string
  quoted: boolean
  /** An argument has begun, which `""` does too: it is an empty argument, not none. */
  started: boolean
}

/** Reads what starts at `i` and returns where the next thing starts. */
function step(line: string, i: number, split: Splitting): number {
  const char = line[i] ?? ''
  if (!split.quoted && (char === ' ' || char === '\t')) {
    if (split.started) split.args.push(split.current)
    split.current = ''
    split.started = false
    return i + 1
  }
  split.started = true
  if (char === '\\') {
    const run = slashRun(line, i)
    split.current += run.text
    return run.next
  }
  if (char !== '"') {
    split.current += char
    return i + 1
  }
  if (split.quoted && line[i + 1] === '"') {
    split.current += '"'
    return i + 2
  }
  split.quoted = !split.quoted
  return i + 1
}

/**
 * A run of backslashes: before a quote, each pair is one backslash and an odd
 * one out escapes the quote; anywhere else they are all literal.
 */
function slashRun(line: string, at: number): { text: string; next: number } {
  let end = at
  while (line[end] === '\\') end += 1
  const count = end - at
  if (line[end] !== '"') return { text: '\\'.repeat(count), next: end }
  const half = '\\'.repeat(Math.floor(count / 2))
  // An even run leaves the quote to be read as a quote.
  return count % 2 === 1 ? { text: `${half}"`, next: end + 1 } : { text: half, next: end }
}
