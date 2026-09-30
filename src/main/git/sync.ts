import type { GitState } from '@shared/git'
import {
  type GitSyncAction,
  type GitSyncResult,
  parseLeftRight,
  SYNC_TIMEOUT_MS,
  syncBlocked,
} from '@shared/git-sync'
import { type GitResult, gitError, type RunGit } from './run.js'

/**
 * The git pane's two writes, FETCH and PULL, run on the user's press
 * (shared/git-sync.ts has the rules, architecture.md §5.9 the reasons).
 *
 * Apart from the reading GitService on purpose: that one may run whenever a
 * file changes and must never write; this one runs only when asked, and is
 * where a later write (a push) would go.
 *
 * What it guards against, beyond what every reading already turns off (the
 * file system monitor, signature display, the repository's own filters):
 *
 *  - Hooks. A fetch runs `reference-transaction`, a pull `post-merge` too, and
 *    a repository can point `core.hooksPath` into its own working tree (husky
 *    does), so a pulled commit could name the program the pull then runs. Every
 *    call points `core.hooksPath` at an empty folder of main's.
 *  - Signature checks (`merge.verifySignatures` runs `gpg.program`), submodules
 *    (fetched and checked out under their own config) and a merge, a rebase or an
 *    autostash chosen in config: all turned off on the command line.
 *  - A password prompt: git is told there is no terminal, and a transport that
 *    waits anyway is stopped at `SYNC_TIMEOUT_MS`.
 *
 * The transport itself - ssh, the credential helper, proxies - is the user's own
 * configuration, as it would be in the terminal: without it nothing could sign in.
 */

export interface GitSyncDeps {
  run: RunGit
  /** A repository a pane shows, as GitService.target has it. */
  target(id: string): { path: string; guard: readonly string[]; state: GitState } | null
  /** Main wrote to the repository: read it again. */
  moved(id: string): void
  /** An empty folder of main's, for `core.hooksPath`. */
  hooksDir(): string
}

const ARGS: Record<GitSyncAction, readonly string[]> = {
  fetch: ['fetch', '--no-recurse-submodules'],
  pull: [
    'pull',
    '--ff-only',
    '--no-rebase',
    '--no-autostash',
    '--no-verify-signatures',
    '--no-recurse-submodules',
  ],
}

export class GitSync {
  private readonly deps: GitSyncDeps
  /** Repositories with a fetch or pull under way: one at a time each. */
  private readonly running = new Set<string>()

  constructor(deps: GitSyncDeps) {
    this.deps = deps
  }

  async run(id: string, action: GitSyncAction): Promise<GitSyncResult> {
    const result = (code: GitSyncResult['code'], message = '', commits = 0): GitSyncResult => ({
      action,
      code,
      commits,
      message,
    })
    if (this.running.has(id)) return result('busy', 'a fetch or pull is already running')
    const target = this.deps.target(id)
    const blocked = syncBlocked(target?.state ?? null, action)
    if (target === null || blocked !== null) return result('refused', blocked ?? 'not read yet')

    this.running.add(id)
    try {
      const git = (args: readonly string[], timeoutMs?: number): Promise<GitResult> =>
        this.deps.run(
          target.path,
          [...target.guard, '-c', `core.hooksPath=${this.deps.hooksDir()}`, ...args],
          timeoutMs === undefined ? undefined : { timeoutMs },
        )
      const before = target.state.branch.oid
      const done = await git(ARGS[action], SYNC_TIMEOUT_MS)
      // Whatever came of it, refs may have moved: the pane reads again.
      this.deps.moved(id)
      if (!done.ok) {
        if (done.timedOut) return result('timeout', 'no answer in time: does it want a password?')
        if (action === 'pull' && (await this.diverged(git))) {
          return result('diverged', 'merge or rebase in the terminal')
        }
        return result('failed', gitError(done) || 'git gave no reason')
      }
      return action === 'fetch'
        ? result('fetched', '', await this.count(git, 'HEAD..@{upstream}'))
        : this.pulled(git, before, result)
    } finally {
      this.running.delete(id)
    }
  }

  private async pulled(
    git: (args: readonly string[]) => Promise<GitResult>,
    before: string | null,
    result: (code: GitSyncResult['code'], message?: string, commits?: number) => GitSyncResult,
  ): Promise<GitSyncResult> {
    const commits = before === null ? 0 : await this.count(git, `${before}..HEAD`)
    return commits === 0 ? result('current') : result('pulled', '', commits)
  }

  private async count(
    git: (args: readonly string[]) => Promise<GitResult>,
    range: string,
  ): Promise<number> {
    const counted = await git(['rev-list', '--count', range])
    const n = Number(counted.stdout.trim())
    return counted.ok && Number.isInteger(n) && n >= 0 ? n : 0
  }

  /** Whether the branch and its upstream (as just fetched) each have commits the other lacks. */
  private async diverged(git: (args: readonly string[]) => Promise<GitResult>): Promise<boolean> {
    const sides = await git(['rev-list', '--left-right', '--count', 'HEAD...@{upstream}'])
    const counts = sides.ok ? parseLeftRight(sides.stdout) : null
    return counts !== null && counts.left > 0 && counts.right > 0
  }
}
