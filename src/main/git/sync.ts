import type { GitState } from '@shared/git'
import {
  type GitSyncAction,
  type GitSyncResult,
  isBranchRef,
  isPushRemote,
  parseLeftRight,
  parsePushPorcelain,
  repoTransportPrograms,
  SYNC_TIMEOUT_MS,
  syncBlocked,
  TRANSPORT_PROGRAM_KEYS,
} from '@shared/git-sync'
import { type GitResult, gitError, type RunGit } from './run.js'

/**
 * The git pane's three writes, FETCH, PULL and PUSH, run on the user's press
 * (shared/git-sync.ts has the rules, architecture.md §5.9 the reasons).
 *
 * Apart from the reading GitService on purpose: that one may run whenever a
 * file changes and must never write; this one runs only when asked.
 *
 * What it guards against, beyond what every reading already turns off (the
 * file system monitor, signature display, the repository's own filters):
 *
 *  - Hooks. A fetch runs `reference-transaction`, a pull `post-merge` too, a
 *    push `pre-push`, and a repository can point `core.hooksPath` into its own
 *    working tree (husky does), so a pulled commit could name the program the
 *    pull then runs. Every call points `core.hooksPath` at an empty folder of
 *    main's. A push's checks in `pre-push` are skipped with them: the button
 *    says so before the second press.
 *  - Signature checks (`merge.verifySignatures` runs `gpg.program`), submodules
 *    (fetched and checked out under their own config) and a merge, a rebase or an
 *    autostash chosen in config: all turned off on the command line.
 *  - Any transport but https, http, ssh and git (`PROTOCOLS`): `ext::`, a folder on this
 *    machine, a remote helper. The terminal is left for them.
 *  - A push that sends more than asked for: `push.default=matching` sends every
 *    branch, `remote.<name>.push` other refs, `push.followTags` tags, and a `+`
 *    forces. A push always names its one refspec, the branch onto its upstream,
 *    with no `+`; `--no-follow-tags`, `--no-signed` (`push.gpgSign` runs
 *    `gpg.program`) and `--recurse-submodules=no` go with it.
 *  - A password prompt: git is told there is no terminal, and a transport that
 *    waits anyway is stopped at `SYNC_TIMEOUT_MS`.
 *
 *  - A transport program the repository's own config names (`core.sshCommand`, a
 *    credential helper, `remote.<name>.uploadpack` and the rest, TRANSPORT_PROGRAM_KEYS):
 *    a repository handed over as a folder brings its `.git/config`, so the press is
 *    refused and the terminal is left to run it (found in a security review).
 *
 * The transport itself - ssh, the credential helper, proxies - as the user's own
 * (global, system) configuration names it is theirs, as it would be in the terminal:
 * without it nothing could sign in.
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
  // The remote and the refspec follow (`pushArgs`).
  push: [
    'push',
    '--porcelain',
    '--no-verify',
    '--no-follow-tags',
    '--no-signed',
    '--recurse-submodules=no',
  ],
}

/**
 * Only https, http, ssh and git are spoken: not `ext::`, which runs a command named in a URL;
 * not a folder on this machine (`file`), whose own hooks and config run on the other side of a
 * push or a fetch, which nothing given here reaches; not a remote helper (`foo::url`), which a
 * repository's alias or `url.<base>.insteadOf` could supply (the last two found in review).
 */
const PROTOCOLS: readonly string[] = [
  '-c',
  'protocol.allow=never',
  '-c',
  'protocol.https.allow=always',
  '-c',
  'protocol.http.allow=always',
  '-c',
  'protocol.ssh.allow=always',
  '-c',
  'protocol.git.allow=always',
]

type Git = (args: readonly string[], timeoutMs?: number) => Promise<GitResult>
type Result = (code: GitSyncResult['code'], message?: string, commits?: number) => GitSyncResult

/**
 * How a push ended, from the porcelain line for its one ref: git's exit code alone does not
 * tell a remote that has moved on from one that refused for its own reasons.
 */
function pushOutcome(done: GitResult, ref: string, commits: number, result: Result): GitSyncResult {
  if (done.timedOut) return result('timeout', 'no answer in time: does it want a password?')
  const line = parsePushPorcelain(done.stdout, ref)
  if (line?.flag === '=') return result('current')
  if (line?.flag === '!' && line.summary.startsWith('[rejected]')) {
    return result('rejected', 'the remote has commits this branch lacks: FETCH, then PULL')
  }
  // `[remote rejected] (pre-receive hook declined)` and the like: the remote's own reasons.
  if (line?.flag === '!') return result('failed', line.summary)
  if (!done.ok || line === null) return result('failed', gitError(done) || 'git gave no reason')
  return result('pushed', '', commits)
}

export class GitSync {
  private readonly deps: GitSyncDeps
  /** Repositories with a fetch, pull or push under way: one at a time each. */
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
    if (this.running.has(id)) return result('busy', 'a fetch, pull or push is already running')
    const target = this.deps.target(id)
    const blocked = syncBlocked(target?.state ?? null, action)
    if (target === null || blocked !== null) return result('refused', blocked ?? 'not read yet')

    this.running.add(id)
    try {
      const git: Git = (args, timeoutMs) =>
        this.deps.run(
          target.path,
          [
            ...target.guard,
            '-c',
            `core.hooksPath=${this.deps.hooksDir()}`,
            // The transports a person uses with a hosted remote, and no other (`PROTOCOLS`).
            ...PROTOCOLS,
            ...args,
          ],
          timeoutMs === undefined ? undefined : { timeoutMs },
        )
      const named = await this.transportPrograms(git)
      if (named.length > 0) {
        return result(
          'refused',
          `this repository's own config names a program to run (${named.join(', ')}): use the terminal`,
        )
      }
      return action === 'push'
        ? // syncBlocked has refused a detached HEAD already.
          await this.push(id, git, target.state.branch.head ?? '', result)
        : await this.take(id, git, action, target.state.branch.oid, result)
    } finally {
      this.running.delete(id)
    }
  }

  /** A fetch, or a fast-forward pull. */
  private async take(
    id: string,
    git: Git,
    action: 'fetch' | 'pull',
    oid: string | null,
    result: Result,
  ): Promise<GitSyncResult> {
    // HEAD as it is now, not as main last read it: a commit made in the terminal a moment
    // before the press was counted as pulled (found in review).
    const before = action === 'pull' ? await this.head(git, oid) : null
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
  }

  /**
   * The branch onto its upstream as the branch's own config names it - never the
   * `origin/main` spelling, which a remote with a slash in its name makes ambiguous -
   * and only what the branch has that the upstream lacks, counted just before.
   *
   * Everything is of the branch main last read, by name, never of HEAD: checked out to
   * another branch in the terminal a moment before the press, HEAD would have been
   * counted while that branch was pushed (found in review).
   */
  private async push(id: string, git: Git, branch: string, result: Result): Promise<GitSyncResult> {
    const remote = await this.config(git, `branch.${branch}.remote`)
    const merge = await this.config(git, `branch.${branch}.merge`)
    if (!isPushRemote(remote) || !isBranchRef(merge)) {
      return result('refused', 'the branch has no upstream on a remote: push -u in the terminal')
    }
    const commits = await this.count(git, `${branch}@{upstream}..refs/heads/${branch}`)
    if (commits === 0) {
      // main's reading had something to push, so the branch has moved since: read it again.
      this.deps.moved(id)
      return result('current')
    }
    const done = await git(
      [...ARGS.push, '--', remote, `refs/heads/${branch}:${merge}`],
      SYNC_TIMEOUT_MS,
    )
    this.deps.moved(id)
    return pushOutcome(done, merge, commits, result)
  }

  /**
   * The transport programs the repository's own config names, read afresh on every press
   * (a pull may have brought a config include's target with it). An answer git could not
   * give counts as one: nothing runs on a config it could not read.
   */
  private async transportPrograms(git: Git): Promise<string[]> {
    const read = await git(['config', '--get-regexp', '--show-scope', '-z', TRANSPORT_PROGRAM_KEYS])
    // Exit 1 with nothing printed is git's "no such key".
    const noSuchKey = !read.ok && !read.timedOut && read.stdout === '' && read.stderr.trim() === ''
    if (!read.ok && !noSuchKey) return ['unreadable config']
    return repoTransportPrograms(read.stdout)
  }

  private async config(git: Git, key: string): Promise<string> {
    const read = await git(['config', '--get', key])
    return read.ok ? read.stdout.trim() : ''
  }

  private async pulled(git: Git, before: string | null, result: Result): Promise<GitSyncResult> {
    const commits = before === null ? 0 : await this.count(git, `${before}..HEAD`)
    return commits === 0 ? result('current') : result('pulled', '', commits)
  }

  private async head(git: Git, fallback: string | null): Promise<string | null> {
    const read = await git(['rev-parse', '--verify', '-q', 'HEAD'])
    const oid = read.stdout.trim()
    return read.ok && /^[0-9a-f]{40,64}$/.test(oid) ? oid : fallback
  }

  private async count(git: Git, range: string): Promise<number> {
    const counted = await git(['rev-list', '--count', range])
    const n = Number(counted.stdout.trim())
    return counted.ok && Number.isInteger(n) && n >= 0 ? n : 0
  }

  /** Whether the branch and its upstream (as just fetched) each have commits the other lacks. */
  private async diverged(git: Git): Promise<boolean> {
    const sides = await git(['rev-list', '--left-right', '--count', 'HEAD...@{upstream}'])
    const counts = sides.ok ? parseLeftRight(sides.stdout) : null
    return counts !== null && counts.left > 0 && counts.right > 0
  }
}
