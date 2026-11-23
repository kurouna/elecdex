import { SAMPLE } from './code-area.js'

/**
 * CODE's WRITE (docs/elec16-write.md sections 3 and 4): when to ask before the editor is
 * replaced, how a build is judged - ready, a level up, or errors for the model to fix - and how
 * much an answer changed. Pure.
 */

/** Fixes asked for after the first answer, in one SEND: three requests at most. */
export const MAX_FIXES = 2

/** An error as e16c gives it: by file, line and column (line 0 for the whole program). */
export interface WriteError {
  file: string
  line: number
  column: number
  message: string
}

type Level = 0 | 1 | 2

/** One level's build as the judge needs it: its errors, and how its measured run ended. */
export interface JudgedLevel {
  level: Level
  errors: readonly WriteError[]
  measured: { end: string } | null
}

export type Verdict =
  | { ok: true; level: Level; switched: boolean }
  | { ok: false; errors: WriteError[] }

/** A source as compared: LF ends, no trailing spaces on a line, no blank lines at the end. */
function normalized(source: string): string {
  return source
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n+$/, '')
}

/** Whether two sources are the same program text, line ends and trailing spaces aside. */
export function sameSource(a: string, b: string): boolean {
  return normalized(a) === normalized(b)
}

/**
 * Whether a SEND asks before it replaces the editor: not for the first sample, a blank
 * editor, or what WRITE itself last wrote there untouched - only for code of a person's own.
 */
export function needsConfirm(source: string, lastWritten: string | null): boolean {
  const own = normalized(source)
  if (own.trim() === '') return false
  if (own === normalized(SAMPLE)) return false
  return lastWritten === null || own !== normalized(lastWritten)
}

const TOO_BIG = /^the program is \d+ bytes: the code area holds \d+$/

const onlyTooBig = (errors: readonly WriteError[]): boolean =>
  errors.length > 0 && errors.every((e) => TOO_BIG.test(e.message))

const runs = (l: JudgedLevel | undefined): boolean =>
  l !== undefined && l.errors.length === 0 && l.measured?.end !== 'fault'

/**
 * A build judged at the level the pane has chosen - sizes differ by level, and -O0 seldom fits.
 * Too big there alone, a higher level that builds is taken without asking the model; a program
 * that faults as it starts goes back to be fixed like an error. Running past the measuring limit
 * is a game's loop, not a fault.
 */
export function judge(levels: readonly JudgedLevel[], chosen: Level, file = 'MAIN.TS'): Verdict {
  const at = levels.find((l) => l.level === chosen)
  if (at === undefined) return { ok: false, errors: [] }
  if (runs(at)) return { ok: true, level: chosen, switched: false }
  if (onlyTooBig(at.errors)) {
    const up = levels.find((l) => l.level > chosen && runs(l))
    if (up !== undefined) return { ok: true, level: up.level, switched: true }
  }
  if (at.errors.length > 0) return { ok: false, errors: [...at.errors] }
  return {
    ok: false,
    errors: [
      {
        file,
        line: 0,
        column: 0,
        message:
          'the program faulted as soon as it ran: a peek16 or poke16 at an odd address, or a write above 0x8000 (the ROM)',
      },
    ],
  }
}

/** `sourceToMachine`'s problem ("Line N has ...") as an error on that line, for the model to fix. */
export function charsetError(file: string, problem: string): WriteError {
  const line = Number(/^Line (\d+)/.exec(problem)?.[1] ?? 0)
  return { file, line, column: line > 0 ? 1 : 0, message: problem }
}

/** How many lines of `after` are new or changed against `before` (a longest common subsequence). */
export function changedLineCount(before: string, after: string): number {
  const a = before.split('\n')
  const b = after.split('\n')
  let row = new Array<number>(b.length + 1).fill(0)
  for (const x of a) {
    const next = new Array<number>(b.length + 1).fill(0)
    for (let j = 0; j < b.length; j++) {
      next[j + 1] = x === b[j] ? (row[j] ?? 0) + 1 : Math.max(row[j + 1] ?? 0, next[j] ?? 0)
    }
    row = next
  }
  const kept = row[b.length] ?? 0
  return Math.max(b.length, a.length) - kept
}

/** Where a SEND is, as the page has it. */
export type WritePhase =
  | 'idle'
  | 'confirm'
  | 'thinking'
  | 'writing'
  | 'compiling'
  | 'fixing'
  | 'ready'
  | 'stopped'
  | 'failed'

export type StepKind = '' | 'now' | 'done' | 'bad' | 'off'

export interface WriteStep {
  name: string
  kind: StepKind
}

/** The step a SEND that did not finish ended at: a fix once one was asked for, else how far it came. */
function endedAt(fixes: number, bytes: number): number {
  if (fixes > 0) return FIX_STEP
  return bytes > 0 ? 1 : 0
}

const FIX_STEP = 3
const REACHED: Partial<Record<WritePhase, number>> = {
  thinking: 0,
  writing: 1,
  compiling: 2,
  fixing: FIX_STEP,
}

/**
 * The steps WRITE's line draws (docs/elec16-write.md section 2): THINKING, WRITE, COMPILE, FIX
 * n/2 once a fix has been asked for, READY. Done ones filled, the one under way lit, where it
 * ended red (failed) or warned (stopped); none while nothing is under way.
 */
export function writeSteps(phase: WritePhase, fixes: number, bytes: number): WriteStep[] {
  if (phase === 'idle' || phase === 'confirm') return []
  const fixed = fixes > 0
  const names = [
    'thinking',
    'write',
    'compile',
    ...(fixed ? [`fix ${fixes}/${MAX_FIXES}`] : []),
    'ready',
  ]
  const reached = phase === 'ready' ? names.length : (REACHED[phase] ?? endedAt(fixes, bytes))
  const ended: StepKind = phase === 'failed' ? 'bad' : phase === 'stopped' ? 'off' : 'now'
  // Compiling again after a fix: the fix is behind it.
  const fixBehind = phase === 'compiling' && fixed
  return names.map((name, k) => ({
    name,
    kind: k < reached || (fixBehind && k === FIX_STEP) ? 'done' : k === reached ? ended : '',
  }))
}
