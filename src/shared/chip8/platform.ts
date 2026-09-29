/**
 * Which machine an imported program was written for, guessed from its bytes
 * (docs/architecture.md section 5.18). The import sheet shows the guess and its reason,
 * and the user can change it.
 *
 * A program is code and data mixed, and sprite data looks like anything - the IBM logo's
 * holds 00FF, SUPER-CHIP's hires, several times. So only the words the program can reach
 * as instructions are read: the flow is followed from 0x200 through jumps, calls and
 * skips. A jump through a table (BNNN) cannot be followed, so what lies only behind one
 * goes unread, and the guess falls back to the plainer machine; the user can change it.
 */

import { maxProgramSize, type Platform, PROGRAM_START } from './types.js'

export type GuessReason = 'size' | 'xo-instructions' | 'super-instructions' | 'plain'

export interface PlatformGuess {
  platform: Platform
  reason: GuessReason
}

const isXoWord = (op: number): boolean =>
  op === 0xf000 ||
  op === 0xf002 ||
  (op & 0xf00e) === 0x5002 || // 5XY2 and 5XY3
  (op & 0xfcff) === 0xf001 || // FN01, N up to 3
  (op & 0xf0ff) === 0xf03a ||
  ((op & 0xfff0) === 0x00d0 && (op & 0xf) !== 0)

const isSuperWord = (op: number): boolean =>
  (op >= 0x00fb && op <= 0x00ff) ||
  ((op & 0xfff0) === 0x00c0 && (op & 0xf) !== 0) ||
  (op & 0xf0ff) === 0xf030 ||
  (op & 0xf0ff) === 0xf075 ||
  (op & 0xf0ff) === 0xf085 ||
  (op & 0xf00f) === 0xd000

const isSkip = (op: number): boolean => {
  const top = op >> 12
  return (
    top === 0x3 ||
    top === 0x4 ||
    ((top === 0x5 || top === 0x9) && (op & 0xf) === 0) ||
    (op & 0xf0ff) === 0xe09e ||
    (op & 0xf0ff) === 0xe0a1
  )
}

/** Where the flow goes after the instruction at `at`: on in sequence, and elsewhere. */
function successors(op: number, at: number, wordAt: (at: number) => number): number[] {
  const top = op >> 12
  const target = (op & 0xfff) - PROGRAM_START
  if (op === 0x00ee || op === 0x00fd || op === 0x0000 || top === 0xb) return []
  if (top === 0x1) return [target]
  if (top === 0x2) return [at + 2, target]
  if (op === 0xf000) return [at + 4]
  if (isSkip(op)) return [at + 2, at + (wordAt(at + 2) === 0xf000 ? 6 : 4)]
  return [at + 2]
}

/** Every word the program reaches as an instruction. */
function reachedWords(program: Uint8Array): number[] {
  const wordAt = (at: number): number => ((program[at] ?? 0) << 8) | (program[at + 1] ?? 0)
  const seen = new Set<number>()
  const todo = [0]
  while (todo.length > 0) {
    const at = todo.pop() ?? -1
    if (at < 0 || at + 1 >= program.length || seen.has(at)) continue
    seen.add(at)
    todo.push(...successors(wordAt(at), at, wordAt))
  }
  return [...seen].map(wordAt)
}

export function guessPlatform(program: Uint8Array): PlatformGuess {
  if (program.length > maxProgramSize('schip')) return { platform: 'xochip', reason: 'size' }
  const code = reachedWords(program)
  if (code.some(isXoWord)) return { platform: 'xochip', reason: 'xo-instructions' }
  if (code.some(isSuperWord)) return { platform: 'schip', reason: 'super-instructions' }
  return { platform: 'chip8', reason: 'plain' }
}
