import path from 'node:path'
import {
  addedFileDiff,
  changeMatters,
  commitFiles,
  emptyState,
  type GitDiff,
  type GitDiffRequest,
  type GitFile,
  type GitImage,
  type GitOperation,
  type GitRepoRef,
  type GitState,
  isImagePath,
  LOG_FORMAT,
  LOG_LENGTH,
  looksBinary,
  MAX_FILES,
  MAX_IMAGE_BYTES,
  MAX_UNTRACKED_BYTES,
  OPERATION_MARKERS,
  parseDiff,
  parseLog,
  parseNameStatus,
  parseNumstat,
  parseStatus,
  sameState,
  sniffImage,
  withCounts,
} from '@shared/git'
import { type GitBytes, type GitResult, gitError, type RunGit } from './run.js'

/**
 * Keeps the repositories open in git panes current, and answers their diffs.
 *
 * A repository is read only while a pane shows it: the first subscriber starts
 * a watch on its folder, the last one leaving stops it (ipc/git.ts counts
 * them). A change the watcher reports is read after a short quiet spell and at
 * most once a second, so a build writing ten thousand files costs one reading
 * a second while it runs and nothing after. There is no poll: a repository
 * nobody touches is read once and then left alone.
 *
 * Free of Electron and of the file system, which arrive in `deps`, so all of it
 * runs in unit tests against a made-up git and a made-up clock.
 */

export interface Watch {
  close(): void
}

export interface GitServiceDeps {
  run: RunGit
  repo(id: string): GitRepoRef | null
  /** Watches a folder and everything below it; `relative` is the changed path in it. */
  watch(folder: string, onChange: (relative: string) => void): Watch | null
  exists(file: string): boolean
  /** A file's text, or null when it is missing, unreadable or larger than `max` bytes. */
  readText(file: string, max: number): Promise<string | 'too-large' | null>
  /** A file's bytes, or null when it is missing, or 'too-large' past `max`. */
  readBytes(file: string, max: number): Promise<Buffer | 'too-large' | null>
  /** A file's bytes as git holds them at a revision (`HEAD:path`, `:path` for the index). */
  gitBytes: GitBytes
  /** The path with every link resolved, or null when it does not exist. */
  realpath(file: string): string | null
  now(): number
  setTimer(fn: () => void, ms: number): unknown
  clearTimer(handle: unknown): void
  publish(state: GitState): void
}

/** Quiet time after a change before reading: an editor's save is several writes. */
export const SETTLE_MS = 300
/** The least time between two readings of one repository. */
export const MIN_GAP_MS = 1000

interface Watched {
  ref: GitRepoRef
  gitDir: string | null
  watches: Watch[]
  timer: unknown
  reading: boolean
  again: boolean
  lastStart: number
  state: GitState
}

const DIFF_FLAGS = ['--no-color', '--no-ext-diff', '--no-textconv', '-M', '-U3']

export class GitService {
  private readonly deps: GitServiceDeps
  private readonly watched = new Map<string, Watched>()

  constructor(deps: GitServiceDeps) {
    this.deps = deps
  }

  /** What the pane should show now: the last reading, or an empty state before the first. */
  snapshot(id: string): GitState {
    return this.watched.get(id)?.state ?? emptyState(id)
  }

  watching(): string[] {
    return [...this.watched.keys()].sort()
  }

  watch(id: string): void {
    if (this.watched.has(id)) return
    const ref = this.deps.repo(id)
    if (ref === null) {
      this.deps.publish(emptyState(id, 'unknown'))
      return
    }
    const entry: Watched = {
      ref,
      gitDir: null,
      watches: [],
      timer: null,
      reading: false,
      again: false,
      lastStart: 0,
      state: { ...emptyState(id), repo: ref },
    }
    this.watched.set(id, entry)
    void this.start(entry)
  }

  unwatch(id: string): void {
    const entry = this.watched.get(id)
    if (entry === undefined) return
    this.watched.delete(id)
    if (entry.timer !== null) this.deps.clearTimer(entry.timer)
    for (const watch of entry.watches) watch.close()
  }

  dispose(): void {
    for (const id of [...this.watched.keys()]) this.unwatch(id)
  }

  /** Finds the git folder, starts watching, and takes the first reading. */
  private async start(entry: Watched): Promise<void> {
    const root = entry.ref.path
    const found = await this.deps.run(root, ['rev-parse', '--absolute-git-dir'])
    if (!this.isCurrent(entry)) return
    if (!found.ok) {
      this.settle(entry, this.failure(entry, found))
      return
    }
    entry.gitDir = path.resolve(found.stdout.trim())
    const gitDir = entry.gitDir
    const insideRoot = path.relative(root, gitDir)
    const rootWatch = this.deps.watch(root, (relative) => {
      const inGit = pathIn(insideRoot, relative)
      if (changeMatters(relative, inGit)) this.changed(entry)
    })
    if (rootWatch !== null) entry.watches.push(rootWatch)
    // A linked worktree keeps its git folder elsewhere; its index and HEAD are there.
    if (insideRoot.startsWith('..') || path.isAbsolute(insideRoot)) {
      const gitWatch = this.deps.watch(gitDir, (relative) => {
        if (changeMatters(relative, relative)) this.changed(entry)
      })
      if (gitWatch !== null) entry.watches.push(gitWatch)
    }
    await this.read(entry)
  }

  private changed(entry: Watched): void {
    if (!this.isCurrent(entry)) return
    if (entry.reading) {
      entry.again = true
      return
    }
    if (entry.timer !== null) this.deps.clearTimer(entry.timer)
    const wait = Math.max(SETTLE_MS, entry.lastStart + MIN_GAP_MS - this.deps.now())
    entry.timer = this.deps.setTimer(() => {
      entry.timer = null
      void this.read(entry)
    }, wait)
  }

  private isCurrent(entry: Watched): boolean {
    return this.watched.get(entry.ref.id) === entry
  }

  /** Reads the repository and publishes it if anything the pane shows is different. */
  private async read(entry: Watched): Promise<void> {
    if (!this.isCurrent(entry)) return
    entry.reading = true
    entry.again = false
    entry.lastStart = this.deps.now()
    try {
      const next = await this.reading(entry)
      if (this.isCurrent(entry)) this.settle(entry, next)
    } finally {
      entry.reading = false
      // Something changed while git was reading: what it read may be stale.
      if (entry.again && this.isCurrent(entry)) this.changed(entry)
    }
  }

  private settle(entry: Watched, next: GitState): void {
    const changed = !sameState(entry.state, next) || entry.state.readAt === 0
    entry.state = next
    if (changed) this.deps.publish(next)
  }

  private failure(entry: Watched, result: GitResult): GitState {
    const base = { ...emptyState(entry.ref.id), repo: entry.ref, readAt: this.deps.now() }
    if (result.missing) return { ...base, problem: 'no-git', message: 'git was not found on PATH' }
    if (!this.deps.exists(entry.ref.path)) {
      return { ...base, problem: 'missing', message: 'the folder is no longer there' }
    }
    return { ...base, problem: 'failed', message: gitError(result) }
  }

  private async reading(entry: Watched): Promise<GitState> {
    const root = entry.ref.path
    const status = await this.deps.run(root, [
      'status',
      '--porcelain=v2',
      '-z',
      '--branch',
      '--show-stash',
      '--untracked-files=all',
    ])
    if (!status.ok) return this.failure(entry, status)
    const parsed = parseStatus(status.stdout)
    const headMoved = parsed.branch.oid !== entry.state.branch.oid || entry.state.readAt === 0
    const [unstaged, staged, log] = await Promise.all([
      this.deps.run(root, ['diff', '--numstat', '-z', '--no-ext-diff', '--no-textconv']),
      this.deps.run(root, [
        'diff',
        '--cached',
        '--numstat',
        '-z',
        '--no-ext-diff',
        '--no-textconv',
        '-M',
      ]),
      headMoved && parsed.branch.oid !== null
        ? this.deps.run(root, ['log', `-n${LOG_LENGTH}`, '-z', `--format=${LOG_FORMAT}`])
        : Promise.resolve(null),
    ])
    let files = withCounts(parsed.files, 'unstaged', parseNumstat(unstaged.stdout))
    files = withCounts(files, 'staged', parseNumstat(staged.stdout))
    return {
      ...emptyState(entry.ref.id),
      repo: entry.ref,
      branch: parsed.branch,
      stash: parsed.stash,
      operation: this.operation(entry.gitDir),
      files: files.slice(0, MAX_FILES),
      dropped: Math.max(0, files.length - MAX_FILES),
      log:
        log === null ? (parsed.branch.oid === null ? [] : entry.state.log) : parseLog(log.stdout),
      readAt: this.deps.now(),
    }
  }

  private operation(gitDir: string | null): GitOperation | null {
    if (gitDir === null) return null
    for (const [marker, operation] of OPERATION_MARKERS) {
      if (this.deps.exists(path.join(gitDir, marker))) return operation
    }
    return null
  }

  // -------------------------------------------------------------------------
  // Diffs, a commit's files, and where a file is
  // -------------------------------------------------------------------------

  /**
   * The diff the pane asked for. A working-tree file must be one the last
   * reading listed, in the list the pane named: the page asks by name, and main
   * answers only for what it showed.
   */
  async diff(request: GitDiffRequest): Promise<GitDiff> {
    const base = { repoId: request.repoId, path: request.path }
    const entry = this.watched.get(request.repoId)
    if (entry === undefined) return problem(base, 'the repository is not open in a pane')
    const root = entry.ref.path
    if (isImagePath(request.path)) return this.imageDiff(entry, request, base)
    if ('commit' in request) {
      const shown = await this.deps.run(root, [
        'show',
        '--format=',
        ...DIFF_FLAGS,
        request.commit,
        '--',
        request.path,
      ])
      return fromResult(shown, base)
    }
    const file = entry.state.files.find((f) => f.path === request.path && f.area === request.area)
    if (file === undefined) return problem(base, 'the file is no longer in that list')
    if (file.area === 'untracked') return this.untracked(file, base)
    if (file.area === 'conflicted') return this.conflicted(file, base)
    const paths = file.from === undefined ? [file.path] : [file.from, file.path]
    const cached = file.area === 'staged' ? ['--cached'] : []
    const shown = await this.deps.run(root, ['diff', ...cached, ...DIFF_FLAGS, '--', ...paths])
    return fromResult(shown, base)
  }

  /**
   * An image's change, as the file before and after rather than hunks: for a
   * working-tree file, the index against the tree (unstaged) or HEAD against the
   * index (staged); for a commit, its first parent against it. The request is
   * held to what the last reading listed, as a text diff is.
   */
  private async imageDiff(
    entry: Watched,
    request: GitDiffRequest,
    base: { repoId: string; path: string },
  ): Promise<GitDiff> {
    const root = entry.ref.path
    let before: Buffer | 'too-large' | null
    let after: Buffer | 'too-large' | null
    if ('commit' in request) {
      before = await this.deps.gitBytes(root, `${request.commit}^:${request.path}`, MAX_IMAGE_BYTES)
      after = await this.deps.gitBytes(root, `${request.commit}:${request.path}`, MAX_IMAGE_BYTES)
    } else {
      const file = entry.state.files.find((f) => f.path === request.path && f.area === request.area)
      if (file === undefined) return problem(base, 'the file is no longer in that list')
      const earlier = file.from ?? file.path
      const onDisk = async () => {
        const real = this.locate(request.repoId, file.path)
        return real === null ? null : this.deps.readBytes(real, MAX_IMAGE_BYTES)
      }
      if (file.area === 'staged') {
        before = await this.deps.gitBytes(root, `HEAD:${earlier}`, MAX_IMAGE_BYTES)
        after = await this.deps.gitBytes(root, `:${file.path}`, MAX_IMAGE_BYTES)
      } else if (file.area === 'untracked') {
        before = null
        after = await onDisk()
      } else {
        before = await this.deps.gitBytes(root, `:${earlier}`, MAX_IMAGE_BYTES)
        after = await onDisk()
      }
    }
    const notes: string[] = []
    const side = (bytes: Buffer | 'too-large' | null, which: string): GitImage | null => {
      if (bytes === null) return null
      if (bytes === 'too-large') {
        notes.push(`${which} is larger than ${MAX_IMAGE_BYTES / 1024 / 1024} MB`)
        return null
      }
      const type = sniffImage(bytes)
      if (type === null) {
        notes.push(`${which} is not an image`)
        return null
      }
      return { dataUrl: `data:${type};base64,${bytes.toString('base64')}`, bytes: bytes.length }
    }
    return {
      ...problem(base, null),
      binary: true,
      images: {
        before: side(before, 'before'),
        after: side(after, 'after'),
        note: notes.join('; ') || null,
      },
    }
  }

  /** The files a commit changed, against its first parent. */
  async commit(repoId: string, oid: string): Promise<GitFile[] | null> {
    const entry = this.watched.get(repoId)
    if (entry === undefined) return null
    const root = entry.ref.path
    const flags = ['--no-commit-id', '-r', '-z', '-M', '--root', '-m', '--first-parent']
    const [names, counts] = await Promise.all([
      this.deps.run(root, ['diff-tree', ...flags, '--name-status', oid]),
      this.deps.run(root, ['diff-tree', ...flags, '--numstat', oid]),
    ])
    if (!names.ok) return null
    return commitFiles(parseNameStatus(names.stdout), parseNumstat(counts.stdout)).slice(
      0,
      MAX_FILES,
    )
  }

  /**
   * The file on disk for a path the pane shows, or null. It must lie inside the
   * repository once every link is resolved, and not in its git folder: a path
   * the page names is only ever a file of the working tree.
   */
  locate(repoId: string, relative: string): string | null {
    const entry = this.watched.get(repoId)
    if (entry === undefined) return null
    const root = this.deps.realpath(entry.ref.path)
    const real = this.deps.realpath(path.join(entry.ref.path, relative))
    if (root === null || real === null) return null
    const inside = path.relative(root, real)
    if (inside === '' || inside.startsWith('..') || path.isAbsolute(inside)) return null
    if (inside.split(path.sep)[0] === '.git') return null
    return real
  }

  private async untracked(file: GitFile, base: { repoId: string; path: string }): Promise<GitDiff> {
    const real = this.locate(base.repoId, file.path)
    if (real === null) return problem(base, 'the file is not there')
    const text = await this.deps.readText(real, MAX_UNTRACKED_BYTES)
    if (text === 'too-large') return { ...problem(base, null), tooLarge: true }
    if (text === null) return problem(base, 'the file cannot be read')
    if (looksBinary(text)) return { ...problem(base, null), binary: true }
    return addedFileDiff(text, base)
  }

  /** A conflicted file as it stands, markers and all: git's combined diff is harder to read. */
  private async conflicted(
    file: GitFile,
    base: { repoId: string; path: string },
  ): Promise<GitDiff> {
    const diff = await this.untracked(file, base)
    for (const hunk of diff.hunks) {
      for (const line of hunk.lines) {
        line.kind = 'ctx'
        line.old = line.new
      }
    }
    return diff
  }
}

/** The part of `relative` inside `folder` (both relative to one root), or null. */
function pathIn(folder: string, relative: string): string | null {
  if (folder.startsWith('..') || path.isAbsolute(folder)) return null
  const inside = path.relative(folder, relative)
  return inside.startsWith('..') || path.isAbsolute(inside) ? null : inside
}

function problem(base: { repoId: string; path: string }, message: string | null): GitDiff {
  return { ...base, binary: false, cut: false, tooLarge: false, hunks: [], problem: message }
}

function fromResult(
  result: { ok: boolean; stdout: string; stderr: string; tooLarge: boolean },
  base: { repoId: string; path: string },
): GitDiff {
  if (result.tooLarge) return { ...problem(base, null), tooLarge: true }
  if (!result.ok) return problem(base, gitError({ ...result, missing: false }))
  return parseDiff(result.stdout, base)
}
