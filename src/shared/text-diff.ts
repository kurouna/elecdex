import type { DiffHunk, DiffLine } from './git.js'

/**
 * A line diff of two texts, as unified hunks, for a change git did not make -
 * what an agent session did to a file, between the copy its agent kept before
 * the first edit and the file as it is now.
 *
 * Myers' O(ND) algorithm on lines, with the common start and end taken off
 * first (most edits touch a small part of a file) and a limit on the work: two
 * texts that differ everywhere give up and show as all removed, all added,
 * rather than holding the process.
 */

/** Beyond this many differing lines the search stops and the change is shown whole. */
const MAX_EDIT = 4000
const CONTEXT = 3

type Op = { kind: DiffLine['kind']; text: string }

function myers(a: readonly string[], b: readonly string[]): Op[] | null {
  const n = a.length
  const m = b.length
  const max = Math.min(n + m, MAX_EDIT)
  const offset = max + 1
  const v = new Int32Array(2 * max + 3)
  const trace: Int32Array[] = []
  for (let d = 0; d <= max; d += 1) {
    trace.push(v.slice())
    for (let k = -d; k <= d; k += 2) {
      const start = downward(v, offset, k, d)
        ? (v[offset + k + 1] ?? 0)
        : (v[offset + k - 1] ?? 0) + 1
      const x = snake(a, b, start, start - k)
      v[offset + k] = x
      if (x >= n && x - k >= m) return backtrack(trace, a, b, offset, d)
    }
  }
  return null
}

/** Follows equal lines diagonally from (x, y); returns where x ends. */
function snake(a: readonly string[], b: readonly string[], x: number, y: number): number {
  let end = x
  while (end < a.length && y + (end - x) < b.length && a[end] === b[y + (end - x)]) end += 1
  return end
}

/** Whether the furthest path to diagonal k comes down from k + 1 (an insertion) rather than across from k - 1. */
const downward = (v: Int32Array, offset: number, k: number, d: number): boolean =>
  k === -d || (k !== d && (v[offset + k - 1] ?? 0) < (v[offset + k + 1] ?? 0))

function backtrack(
  trace: Int32Array[],
  a: readonly string[],
  b: readonly string[],
  offset: number,
  last: number,
): Op[] {
  const ops: Op[] = []
  let x = a.length
  let y = b.length
  for (let d = last; d > 0; d -= 1) {
    const v = trace[d] as Int32Array
    const k = x - y
    const down = downward(v, offset, k, d)
    const prevK = down ? k + 1 : k - 1
    const prevX = v[offset + prevK] ?? 0
    const prevY = prevX - prevK
    while (x > prevX && y > prevY) {
      x -= 1
      y -= 1
      ops.push({ kind: 'ctx', text: a[x] as string })
    }
    if (down) ops.push({ kind: 'add', text: b[--y] as string })
    else ops.push({ kind: 'del', text: a[--x] as string })
  }
  while (x > 0 && y > 0) {
    ops.push({ kind: 'ctx', text: a[--x] as string })
    y -= 1
  }
  return ops.reverse()
}

const splitLines = (text: string): string[] =>
  text === '' ? [] : text.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n')

/** The operations turning `before` into `after`, line by line. */
export function diffLines(before: string, after: string): Op[] {
  const a = splitLines(before)
  const b = splitLines(after)
  let head = 0
  while (head < a.length && head < b.length && a[head] === b[head]) head += 1
  let tail = 0
  while (
    tail < a.length - head &&
    tail < b.length - head &&
    a[a.length - 1 - tail] === b[b.length - 1 - tail]
  )
    tail += 1
  const middleA = a.slice(head, a.length - tail)
  const middleB = b.slice(head, b.length - tail)
  const middle = myers(middleA, middleB) ?? [
    ...middleA.map((text) => ({ kind: 'del' as const, text })),
    ...middleB.map((text) => ({ kind: 'add' as const, text })),
  ]
  return [
    ...a.slice(0, head).map((text) => ({ kind: 'ctx' as const, text })),
    ...middle,
    ...a.slice(a.length - tail).map((text) => ({ kind: 'ctx' as const, text })),
  ]
}

/** The operations as unified hunks, three lines of context around each change. */
export function toHunks(ops: readonly Op[]): DiffHunk[] {
  const lines = numbered(ops)
  const keep = new Array<boolean>(lines.length).fill(false)
  lines.forEach((line, i) => {
    if (line.kind === 'ctx') return
    for (let j = Math.max(0, i - CONTEXT); j <= Math.min(lines.length - 1, i + CONTEXT); j += 1)
      keep[j] = true
  })
  return grouped(lines, keep)
}

/** The operations with the line number each has in the old text and the new. */
function numbered(ops: readonly Op[]): DiffLine[] {
  const lines: DiffLine[] = []
  let oldLine = 1
  let newLine = 1
  for (const op of ops) {
    if (op.kind === 'ctx')
      lines.push({ kind: 'ctx', text: op.text, old: oldLine++, new: newLine++ })
    else if (op.kind === 'del')
      lines.push({ kind: 'del', text: op.text, old: oldLine++, new: null })
    else lines.push({ kind: 'add', text: op.text, old: null, new: newLine++ })
  }
  return lines
}

/** Runs of kept lines, each a hunk. */
function grouped(lines: readonly DiffLine[], keep: readonly boolean[]): DiffHunk[] {
  const hunks: DiffHunk[] = []
  let current: DiffHunk | null = null
  lines.forEach((line, i) => {
    if (!keep[i]) {
      current = null
      return
    }
    if (current === null) {
      current = {
        context: '',
        oldStart: line.old ?? line.new ?? 1,
        newStart: line.new ?? line.old ?? 1,
        lines: [],
      }
      hunks.push(current)
    }
    current.lines.push(line)
  })
  return hunks
}
