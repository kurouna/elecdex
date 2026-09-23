import { splitCommandLine } from './command-line.js'

/**
 * The git pane's shapes and the pure half of reading a repository: what git
 * prints, turned into what the pane draws. Main runs git (main/git/); nothing
 * here touches a process or a file, so every parser is unit-tested on git's
 * own output.
 *
 * The pane only looks. It never stages, commits or checks out: the terminal
 * beside it does that, and a pane that could would need to ask first.
 */

/** A repository main keeps in git-repos.json. The page knows it by `id` alone. */
export interface GitRepoRef {
  id: string
  /** The top folder's name, for the header. */
  name: string
  /** Where it is, for the header and for copying; never handed back to main. */
  path: string
}

export type GitArea = 'staged' | 'unstaged' | 'untracked' | 'conflicted'

/** What happened to a file, as git's one-letter codes put it. */
export type GitCode = 'M' | 'A' | 'D' | 'R' | 'C' | 'T' | 'U' | '?'

export interface GitFile {
  /** Relative to the top of the repository, with forward slashes. */
  path: string
  /** Where a renamed or copied file came from. */
  from?: string
  area: GitArea
  code: GitCode
  /** Lines added and removed; null when unknown (binary, untracked, conflicted). */
  added: number | null
  deleted: number | null
  binary: boolean
}

export interface GitCommit {
  oid: string
  short: string
  subject: string
  author: string
  /** Seconds since the epoch, as git keeps it. */
  time: number
}

export interface GitBranch {
  /** The branch checked out, or null when HEAD is detached. */
  head: string | null
  /** The commit HEAD is at, or null in a repository with no commits yet. */
  oid: string | null
  upstream: string | null
  ahead: number
  behind: number
}

/** A merge, rebase or the like left half done: the one state that needs a person. */
export type GitOperation = 'merge' | 'rebase' | 'cherry-pick' | 'revert' | 'bisect'

export type GitProblem =
  /** The id is not in main's list (a layout from another machine). */
  | 'unknown'
  /** The folder has gone, or is no longer a repository. */
  | 'missing'
  /** git is not installed, or not on PATH. */
  | 'no-git'
  /** git answered with an error; `message` says what. */
  | 'failed'

export interface GitState {
  repoId: string
  repo: GitRepoRef | null
  problem: GitProblem | null
  message: string
  branch: GitBranch
  operation: GitOperation | null
  stash: number
  files: GitFile[]
  /** Files left out of `files` by the cap. */
  dropped: number
  log: GitCommit[]
  /** When main last read the repository, ms since the epoch; 0 before the first read. */
  readAt: number
}

/** Rows sent to the page; a checkout of a generated tree can change thousands. */
export const MAX_FILES = 500
/** Commits in the log. */
export const LOG_LENGTH = 30
/** Lines of one diff drawn before it is cut. */
export const MAX_DIFF_LINES = 3000
/** An untracked file larger than this is not read to show it. */
export const MAX_UNTRACKED_BYTES = 512 * 1024

export const emptyBranch = (): GitBranch => ({
  head: null,
  oid: null,
  upstream: null,
  ahead: 0,
  behind: 0,
})

export function emptyState(repoId: string, problem: GitProblem | null = null): GitState {
  return {
    repoId,
    repo: null,
    problem,
    message: '',
    branch: emptyBranch(),
    operation: null,
    stash: 0,
    files: [],
    dropped: 0,
    log: [],
    readAt: 0,
  }
}

// ---------------------------------------------------------------------------
// What the page may hand main
// ---------------------------------------------------------------------------

/** Main's ids are 16 hex digits; anything else is not one of ours. */
export const isRepoId = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{16}$/.test(value)

/** A full or abbreviated commit id. */
export const isCommitId = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{7,40}$/.test(value)

/**
 * A path inside a repository as git prints it: relative, forward slashes, no
 * climbing out. Main still checks the file against the repository's own list
 * before it reads or opens anything; this only refuses what can never be one.
 */
export function isRepoPath(value: unknown): value is string {
  if (typeof value !== 'string' || value === '' || value.length > 4096) return false
  if (value.includes('\0') || value.includes('\\')) return false
  if (value.startsWith('/') || /^[A-Za-z]:/.test(value)) return false
  return value.split('/').every((part) => part !== '' && part !== '.' && part !== '..')
}

export const GIT_AREAS: readonly GitArea[] = ['staged', 'unstaged', 'untracked', 'conflicted']

/** Which diff the pane wants: a file in the working tree, or one in a commit. */
export type GitDiffRequest =
  | { repoId: string; path: string; area: GitArea }
  | { repoId: string; path: string; commit: string }

export function parseDiffRequest(raw: unknown): GitDiffRequest | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { repoId, path, area, commit } = raw as Record<string, unknown>
  if (!isRepoId(repoId) || !isRepoPath(path)) return null
  if (isCommitId(commit)) return { repoId, path, commit }
  if (typeof area === 'string' && (GIT_AREAS as readonly string[]).includes(area)) {
    return { repoId, path, area: area as GitArea }
  }
  return null
}

// ---------------------------------------------------------------------------
// git status --porcelain=v2 -z --branch --show-stash
// ---------------------------------------------------------------------------

export interface ParsedStatus {
  branch: GitBranch
  stash: number
  files: GitFile[]
}

const CODES = new Set(['M', 'A', 'D', 'R', 'C', 'T'])

/** One side of `XY`; null for `.` (unchanged on that side). */
function sideOf(letter: string | undefined): GitCode | null {
  return letter !== undefined && CODES.has(letter) ? (letter as GitCode) : null
}

function readHeader(line: string, status: ParsedStatus): void {
  const [, key, ...rest] = line.split(' ')
  const value = rest.join(' ')
  if (key === 'branch.oid') status.branch.oid = value === '(initial)' ? null : value
  else if (key === 'branch.head') status.branch.head = value === '(detached)' ? null : value
  else if (key === 'branch.upstream') status.branch.upstream = value
  else if (key === 'branch.ab') {
    const match = /^\+(\d+) -(\d+)$/.exec(value)
    status.branch.ahead = Number(match?.[1] ?? 0)
    status.branch.behind = Number(match?.[2] ?? 0)
  } else if (key === 'stash') status.stash = Number(value) || 0
}

/** The changed entries (`1`, `2`): a file can be both staged and changed again. */
function readChanged(fields: string[], path: string, from: string | undefined): GitFile[] {
  const xy = fields[1] ?? '..'
  const files: GitFile[] = []
  const staged = sideOf(xy[0])
  const unstaged = sideOf(xy[1])
  const base = { path, added: null, deleted: null, binary: false }
  if (staged !== null)
    files.push({ ...base, ...(from ? { from } : {}), area: 'staged', code: staged })
  if (unstaged !== null) files.push({ ...base, area: 'unstaged', code: unstaged })
  return files
}

/**
 * Parses `git status --porcelain=v2 -z --branch --show-stash`. With `-z` each
 * entry ends in a NUL and paths are never quoted; a rename's old path follows
 * its entry as a field of its own.
 */
export function parseStatus(output: string): ParsedStatus {
  const status: ParsedStatus = { branch: emptyBranch(), stash: 0, files: [] }
  const records = output.split('\0')
  for (let i = 0; i < records.length; i += 1) {
    const record = records[i] ?? ''
    if (record === '') continue
    if (record.startsWith('# ')) {
      readHeader(record, status)
      continue
    }
    const kind = record[0]
    if (kind === '1') {
      const fields = record.split(' ')
      status.files.push(...readChanged(fields, fields.slice(8).join(' '), undefined))
    } else if (kind === '2') {
      const fields = record.split(' ')
      i += 1
      status.files.push(...readChanged(fields, fields.slice(9).join(' '), records[i]))
    } else if (kind === 'u') {
      const path = record.split(' ').slice(10).join(' ')
      status.files.push({
        path,
        area: 'conflicted',
        code: 'U',
        added: null,
        deleted: null,
        binary: false,
      })
    } else if (kind === '?') {
      status.files.push({
        path: record.slice(2),
        area: 'untracked',
        code: '?',
        added: null,
        deleted: null,
        binary: false,
      })
    }
  }
  return status
}

// ---------------------------------------------------------------------------
// git diff --numstat -z
// ---------------------------------------------------------------------------

export interface NumstatRow {
  path: string
  added: number | null
  deleted: number | null
  binary: boolean
}

/**
 * Parses `--numstat -z`: `added TAB deleted TAB path NUL`, or for a rename
 * `added TAB deleted TAB NUL from NUL to NUL`. A binary file counts `-`.
 */
export function parseNumstat(output: string): NumstatRow[] {
  const rows: NumstatRow[] = []
  const records = output.split('\0')
  for (let i = 0; i < records.length; i += 1) {
    const record = records[i] ?? ''
    const match = /^(-|\d+)\t(-|\d+)\t(.*)$/s.exec(record)
    if (match === null) continue
    let path = match[3] ?? ''
    if (path === '') {
      // A rename: the old path, then the new one, as fields of their own.
      path = records[i + 2] ?? ''
      i += 2
    }
    const binary = match[1] === '-'
    rows.push({
      path,
      added: binary ? null : Number(match[1]),
      deleted: binary ? null : Number(match[2]),
      binary,
    })
  }
  return rows
}

/** Puts the line counts on the files of one area. */
export function withCounts(
  files: GitFile[],
  area: GitArea,
  rows: readonly NumstatRow[],
): GitFile[] {
  const byPath = new Map(rows.map((row) => [row.path, row]))
  return files.map((file) => {
    if (file.area !== area) return file
    const row = byPath.get(file.path)
    return row === undefined
      ? file
      : { ...file, added: row.added, deleted: row.deleted, binary: row.binary }
  })
}

// ---------------------------------------------------------------------------
// git log
// ---------------------------------------------------------------------------

/** The format `parseLog` reads: fields apart by US, commits apart by NUL (`-z`). */
export const LOG_FORMAT = '%H%x1f%h%x1f%an%x1f%at%x1f%s'

export function parseLog(output: string): GitCommit[] {
  const commits: GitCommit[] = []
  for (const record of output.split('\0')) {
    const [oid, short, author, time, ...subject] = record.replace(/^\n/, '').split('\x1f')
    if (oid === undefined || !isCommitId(oid) || short === undefined) continue
    commits.push({
      oid,
      short,
      author: author ?? '',
      time: Number(time) || 0,
      subject: subject.join('\x1f'),
    })
  }
  return commits
}

/**
 * Parses `--name-status -z`: a code (`M`, `A`, `D`, `T`, or `R`/`C` with a
 * score and two paths) and its path, each a field of its own.
 */
export function parseNameStatus(output: string): { path: string; from?: string; code: GitCode }[] {
  const rows: { path: string; from?: string; code: GitCode }[] = []
  const records = output.split('\0')
  let i = 0
  while (i < records.length) {
    const letter = (records[i] ?? '')[0] ?? ''
    if (!CODES.has(letter)) {
      i += 1
      continue
    }
    if (letter === 'R' || letter === 'C') {
      rows.push({ code: letter, from: records[i + 1] ?? '', path: records[i + 2] ?? '' })
      i += 3
    } else {
      rows.push({ code: letter as GitCode, path: records[i + 1] ?? '' })
      i += 2
    }
  }
  return rows
}

/** The files a commit changed: codes from `--name-status`, counts from `--numstat`. */
export function commitFiles(
  names: readonly { path: string; from?: string; code: GitCode }[],
  numstat: readonly NumstatRow[],
): GitFile[] {
  const counts = new Map(numstat.map((row) => [row.path, row]))
  return names.map((name) => {
    const row = counts.get(name.path)
    return {
      path: name.path,
      ...(name.from ? { from: name.from } : {}),
      area: 'staged' as const,
      code: name.code,
      added: row?.added ?? null,
      deleted: row?.deleted ?? null,
      binary: row?.binary ?? false,
    }
  })
}

// ---------------------------------------------------------------------------
// Unified diffs
// ---------------------------------------------------------------------------

export type DiffLineKind = 'add' | 'del' | 'ctx'

export interface DiffLine {
  kind: DiffLineKind
  text: string
  /** Line numbers in the old and the new file; null on the side the line is not on. */
  old: number | null
  new: number | null
}

export interface DiffHunk {
  /** The part of `@@ … @@` after the ranges: the function it is in, when git knows. */
  context: string
  oldStart: number
  newStart: number
  lines: DiffLine[]
}

export interface GitDiff {
  repoId: string
  path: string
  binary: boolean
  /** Lines were left out after MAX_DIFF_LINES. */
  cut: boolean
  /** A file too large to show at all. */
  tooLarge: boolean
  hunks: DiffHunk[]
  /** Why there is no diff, when there is none. */
  problem: string | null
}

const HUNK = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@ ?(.*)$/

/** Parses git's unified diff of one file into hunks. */
export function parseDiff(output: string, base: { repoId: string; path: string }): GitDiff {
  const diff: GitDiff = {
    ...base,
    binary: false,
    cut: false,
    tooLarge: false,
    hunks: [],
    problem: null,
  }
  let hunk: DiffHunk | null = null
  const at = { old: 0, new: 0 }
  let count = 0
  for (const line of output.split('\n')) {
    const header = HUNK.exec(line)
    if (header !== null) {
      at.old = Number(header[1])
      at.new = Number(header[2])
      hunk = { context: header[3] ?? '', oldStart: at.old, newStart: at.new, lines: [] }
      diff.hunks.push(hunk)
    } else if (hunk === null) {
      if (/^Binary files .* differ$/.test(line)) diff.binary = true
    } else if (count >= MAX_DIFF_LINES) {
      diff.cut = true
      break
    } else {
      const next = diffLine(line, at)
      if (next === null) continue
      hunk.lines.push(next)
      count += 1
    }
  }
  return diff
}

/** One line of a hunk, moving the line numbers on; null for git's own notes. */
function diffLine(line: string, at: { old: number; new: number }): DiffLine | null {
  const text = line.slice(1).replace(/\r$/, '')
  switch (line[0]) {
    case '+':
      return { kind: 'add', text, old: null, new: at.new++ }
    case '-':
      return { kind: 'del', text, old: at.old++, new: null }
    case ' ':
      return { kind: 'ctx', text, old: at.old++, new: at.new++ }
    default:
      // "\ No newline at end of file", and the empty line after the last.
      return null
  }
}

/** An untracked file shown as one hunk of additions. */
export function addedFileDiff(text: string, base: { repoId: string; path: string }): GitDiff {
  const lines = text.replace(/\n$/, '').split('\n')
  const cut = lines.length > MAX_DIFF_LINES
  return {
    ...base,
    binary: false,
    cut,
    tooLarge: false,
    problem: null,
    hunks: [
      {
        context: '',
        oldStart: 0,
        newStart: 1,
        lines: lines.slice(0, MAX_DIFF_LINES).map((line, i) => ({
          kind: 'add' as const,
          text: line.replace(/\r$/, ''),
          old: null,
          new: i + 1,
        })),
      },
    ],
  }
}

/** Text with a NUL in its first 8000 bytes is binary: git's own test. */
export const looksBinary = (text: string): boolean => text.slice(0, 8000).includes('\0')

/**
 * The part of a changed line that changed: the text between what an old line
 * and its replacement share at the start and at the end. Cheap, and it is what
 * the eye wants - one word swapped in a long line is lit, the rest is not.
 */
export function changedSpan(
  before: string,
  after: string,
): { old: [number, number]; new: [number, number] } {
  let start = 0
  const shortest = Math.min(before.length, after.length)
  while (start < shortest && before[start] === after[start]) start += 1
  let end = 0
  while (
    end < shortest - start &&
    before[before.length - 1 - end] === after[after.length - 1 - end]
  ) {
    end += 1
  }
  return { old: [start, before.length - end], new: [start, after.length - end] }
}

/**
 * Pairs the removed and added lines of each change, one for one, so each pair
 * can light its changed span. A change that removes three lines and adds three
 * is most often three edits; one that removes two and adds five is left alone
 * past the second, where a pairing would be a guess.
 */
export function pairChanges(lines: readonly DiffLine[]): Map<number, [number, number]> {
  const spans = new Map<number, [number, number]>()
  let i = 0
  while (i < lines.length) {
    if (lines[i]?.kind !== 'del') {
      i += 1
      continue
    }
    const dels: number[] = []
    while (lines[i]?.kind === 'del') dels.push(i++)
    const adds: number[] = []
    while (lines[i]?.kind === 'add') adds.push(i++)
    lightPairs(lines, dels, adds, spans)
  }
  return spans
}

function lightPairs(
  lines: readonly DiffLine[],
  dels: readonly number[],
  adds: readonly number[],
  spans: Map<number, [number, number]>,
): void {
  for (let k = 0; k < Math.min(dels.length, adds.length); k += 1) {
    const d = dels[k] as number
    const a = adds[k] as number
    const before = lines[d]?.text ?? ''
    const span = changedSpan(before, lines[a]?.text ?? '')
    // A line rewritten end to end has nothing unchanged to set it against.
    if (span.old[0] === 0 && span.old[1] === before.length) continue
    spans.set(d, span.old)
    spans.set(a, span.new)
  }
}

/** A row of the side-by-side view: the old line on the left, the new on the right. */
export interface SplitRow {
  left: { line: DiffLine; index: number } | null
  right: { line: DiffLine; index: number } | null
}

/**
 * The lines of a hunk side by side. Unchanged lines sit on both sides; each run
 * of removals faces the additions after it, one for one, with blanks where one
 * side ran longer.
 */
export function splitRows(lines: readonly DiffLine[]): SplitRow[] {
  const rows: SplitRow[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i] as DiffLine
    if (line.kind === 'ctx') {
      rows.push({ left: { line, index: i }, right: { line, index: i } })
      i += 1
      continue
    }
    const dels: number[] = []
    while (lines[i]?.kind === 'del') dels.push(i++)
    const adds: number[] = []
    while (lines[i]?.kind === 'add') adds.push(i++)
    for (let k = 0; k < Math.max(dels.length, adds.length); k += 1) {
      const d = dels[k]
      const a = adds[k]
      rows.push({
        left: d === undefined ? null : { line: lines[d] as DiffLine, index: d },
        right: a === undefined ? null : { line: lines[a] as DiffLine, index: a },
      })
    }
  }
  return rows
}

// ---------------------------------------------------------------------------
// Watching
// ---------------------------------------------------------------------------

/** What in the git folder says the repository changed; the rest is git's own bookkeeping. */
const GIT_DIR_SIGNALS =
  /^(HEAD|index|packed-refs|MERGE_HEAD|CHERRY_PICK_HEAD|REVERT_HEAD|BISECT_LOG|refs(\/.*)?|rebase-merge(\/.*)?|rebase-apply(\/.*)?)$/

/**
 * Whether a change the watcher reported can change what the pane shows. Inside
 * the git folder only the files above count: objects, logs and above all
 * `index.lock` change on every git command, and following them would have the
 * pane read the repository for its own reading. `inGitDir` is the path relative
 * to the git folder when the change is in it, else null.
 */
export function changeMatters(relative: string, inGitDir: string | null): boolean {
  if (inGitDir !== null) return GIT_DIR_SIGNALS.test(inGitDir.replaceAll('\\', '/'))
  return relative !== ''
}

/** The files in the git folder that mean an operation was left half done. */
export const OPERATION_MARKERS: readonly [string, GitOperation][] = [
  ['rebase-merge', 'rebase'],
  ['rebase-apply', 'rebase'],
  ['MERGE_HEAD', 'merge'],
  ['CHERRY_PICK_HEAD', 'cherry-pick'],
  ['REVERT_HEAD', 'revert'],
  ['BISECT_LOG', 'bisect'],
]

/** A state with its reading time left out: two readings that show the same are one. */
export const sameState = (a: GitState, b: GitState): boolean =>
  JSON.stringify({ ...a, readAt: 0 }) === JSON.stringify({ ...b, readAt: 0 })

// ---------------------------------------------------------------------------
// Opening a file
// ---------------------------------------------------------------------------

/**
 * The command the user set for opening a file (settings: `git.openCommand`),
 * with `{file}`, `{line}` and `{dir}` filled in, as a program and its
 * arguments - never a line for a shell, so nothing in a file name is ever
 * run. Without `{file}` the file goes last. Null when nothing is set: the OS
 * opens the file with its own application.
 */
export function openCommand(
  template: string,
  target: { file: string; line: number | null; dir: string },
): { program: string; args: string[] } | null {
  const parts = splitCommandLine(template.trim())
  const [program, ...rest] = parts
  if (program === undefined || program === '') return null
  const fill = (arg: string): string =>
    arg
      .replaceAll('{file}', target.file)
      .replaceAll('{line}', String(target.line ?? 1))
      .replaceAll('{dir}', target.dir)
  const args = rest.map(fill)
  if (!rest.some((arg) => arg.includes('{file}'))) args.push(target.file)
  return { program: fill(program), args }
}
