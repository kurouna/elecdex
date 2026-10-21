import type { GitState } from './git.js'

/**
 * The git pane's three writes: FETCH, PULL and PUSH, each on the user's own press
 * (architecture.md §5.9). Everything else the pane does only reads.
 *
 * A pull is a fast-forward and nothing else: no merge commit, no rebase, no
 * conflict for the pane to leave behind, no editor to wait on. When the branch
 * and its upstream have both moved on, it refuses and says so, and the user
 * merges or rebases in the terminal, where git can ask them things.
 *
 * A push is the same in the other direction: the branch onto its upstream and
 * nothing else, never forced. A remote that has moved on refuses it, and the
 * user fetches and pulls first. A branch with no upstream is not pushed: which
 * remote it belongs on is the user's to say, in the terminal (`push -u`).
 *
 * The decisions are pure and live here, so the page (whether the buttons can be
 * pressed) and main (whether to run git at all) read the same rules.
 */

export const GIT_SYNC_ACTIONS = ['fetch', 'pull', 'push'] as const
export type GitSyncAction = (typeof GIT_SYNC_ACTIONS)[number]

export const isSyncAction = (value: unknown): value is GitSyncAction =>
  typeof value === 'string' && (GIT_SYNC_ACTIONS as readonly string[]).includes(value)

/** How a fetch, pull or push ended. */
export type GitSyncCode =
  /** A fetch that ran; `commits` is how far behind the branch now is. */
  | 'fetched'
  /** A pull that moved the branch on; `commits` is by how many. */
  | 'pulled'
  /** A push the remote took; `commits` is how many it was given. */
  | 'pushed'
  /** A pull with nothing to take, or a push with nothing to give. */
  | 'current'
  /** Both sides have commits the other lacks: a fast-forward cannot join them. */
  | 'diverged'
  /** The remote has commits the branch lacks, so a push would have to force: fetch and pull first. */
  | 'rejected'
  /** Another fetch, pull or push of this repository is still running. */
  | 'busy'
  /** The repository is in no state to take one (see `syncBlocked`). */
  | 'refused'
  /** It took longer than `SYNC_TIMEOUT_MS`, perhaps waiting on a password nobody can type. */
  | 'timeout'
  /** git said no; `message` is git's own first line. */
  | 'failed'

export interface GitSyncResult {
  action: GitSyncAction
  code: GitSyncCode
  commits: number
  /** Why, in git's own words where git gave them. */
  message: string
}

/** The codes that are a success, for the colour of the notice. */
export const SYNC_DONE: ReadonlySet<GitSyncCode> = new Set([
  'fetched',
  'pulled',
  'pushed',
  'current',
])

/** The codes that need the terminal rather than an error: the notice is a warning. */
export const SYNC_WARN: ReadonlySet<GitSyncCode> = new Set(['diverged', 'rejected'])

/** A network round trip, and possibly a large one: far longer than a reading may take. */
export const SYNC_TIMEOUT_MS = 120_000

/**
 * Why a fetch, pull or push cannot be run on the repository as main last read it, or
 * null when it can. Checked by the page to dim the button and by main before it
 * runs anything, against its own reading rather than what the page says.
 */
export function syncBlocked(state: GitState | null, action: GitSyncAction): string | null {
  if (state === null || state.readAt === 0) return 'not read yet'
  if (state.problem !== null) return 'the repository cannot be read'
  if (state.operation !== null) return `a ${state.operation} is in progress`
  if (state.branch.head === null) return 'HEAD is detached'
  if (state.branch.upstream === null) {
    return action === 'push'
      ? 'the branch has no upstream: push -u in the terminal'
      : 'the branch has no upstream'
  }
  if (action === 'fetch') return null
  const { ahead, behind } = state.branch
  if (ahead > 0 && behind > 0) return 'diverged from its upstream: merge or rebase in the terminal'
  if (action === 'push' && behind > 0) return 'behind its upstream: pull first'
  if (action === 'push' && ahead === 0) return 'nothing to push'
  return null
}

/**
 * The config keys that name a program the transport runs: ssh (`core.sshCommand`), a
 * proxy (`core.gitProxy`), a password prompt (`core.askPass`), a credential helper (a
 * `!` one is a shell command), the program that lists an alternate's refs
 * (`core.alternateRefsCommand`, run by fetch through a shell; found in review), the program
 * run at the other end of a local or ssh remote (`uploadpack`, `receivepack`, run through a
 * shell), a remote helper (`vcs`) and an alias standing in for a credential or remote helper
 * git does not ship (`alias.credential-<name>`, `alias.remote-<name>`; found in review). An
 * extended regular expression, for `git config --get-regexp`; git prints section and key in
 * lower case.
 */
export const TRANSPORT_PROGRAM_KEYS =
  '^(core\\.(sshcommand|gitproxy|askpass|alternaterefscommand)|credential\\.(.+\\.)?helper|remote\\..+\\.(uploadpack|receivepack|vcs)|alias\\.(credential|remote)-.+)$'

/**
 * A credential helper git ships, named alone or with plain options (`store`,
 * `cache --timeout=60`, `manager`), or empty to reset the list. git runs any other value through
 * a shell as `git credential-<value>`, so `store; anything` ran `anything`, and a name it does
 * not ship falls back to an alias the repository may define (both found in review, in a real
 * git): those, a `!` command and a path to a program are the repository's choosing.
 */
const GIT_HELPER =
  /^(store|cache|manager|manager-core|wincred|osxkeychain|libsecret)( +--?[A-Za-z0-9-]+(=[A-Za-z0-9._~/:@%+,-]*)?)*$/
const helperIsGits = (value: string): boolean => {
  const helper = value.trim()
  return helper === '' || GIT_HELPER.test(helper)
}

/**
 * The transport programs a repository's own config names (local or worktree scope), from
 * `git config --get-regexp --show-scope -z TRANSPORT_PROGRAM_KEYS`, sorted. Each entry is the
 * scope and a NUL, then the key, a newline and the value and a NUL, so a value cannot pass for
 * another entry (checked against git itself in git-sync.test.ts). A repository handed over as a folder or an archive brings its `.git/config`
 * with it, so a press could otherwise run a program of its choosing; the user's own (global,
 * system) settings are theirs, as in the terminal.
 */
export function repoTransportPrograms(output: string): string[] {
  const keys = new Set<string>()
  const fields = output.split('\0')
  for (let i = 0; i + 1 < fields.length; i += 2) {
    const scope = fields[i] ?? ''
    const entry = fields[i + 1] ?? ''
    const cut = entry.indexOf('\n')
    const key = cut === -1 ? entry : entry.slice(0, cut)
    const value = cut === -1 ? '' : entry.slice(cut + 1)
    if (key === '' || scope === 'global' || scope === 'system') continue
    if (/^credential\..*helper$/.test(key) && helperIsGits(value)) continue
    keys.add(key)
  }
  return [...keys].sort()
}

/** The one line of `git push --porcelain` for a ref: its flag, and git's summary of it. */
export interface PushLine {
  /** ' ' fast-forward, '*' new, '=' up to date, '!' rejected; '+' and '-' never asked for. */
  flag: string
  /** `[rejected] (fetch first)`, `[up to date]`, `abc1234..def5678`. */
  summary: string
}

/** The porcelain line `git push --porcelain` wrote for the destination `ref`, or null. */
export function parsePushPorcelain(output: string, ref: string): PushLine | null {
  for (const line of output.split(/\r?\n/)) {
    const [flag, refs, summary] = line.split('\t')
    if (flag?.length !== 1 || refs === undefined || summary === undefined) continue
    if (refs.slice(refs.indexOf(':') + 1) === ref) return { flag, summary: summary.trim() }
  }
  return null
}

/** `branch.<name>.merge` as a push may name it: a branch, nothing that reads as an option. */
export const isBranchRef = (ref: string): boolean => /^refs\/heads\/[^\s:]+$/.test(ref)

/** `branch.<name>.remote` as a push may name it: not this repository (`.`), nor an option. */
export const isPushRemote = (remote: string): boolean =>
  remote !== '' && remote !== '.' && !remote.startsWith('-') && !/[\s]/.test(remote)

/** `git rev-list --left-right --count A...B`: "3\t5" as the commits only on each side. */
export function parseLeftRight(output: string): { left: number; right: number } | null {
  const match = /^(\d+)\s+(\d+)\s*$/.exec(output.trim())
  if (match === null) return null
  return { left: Number(match[1]), right: Number(match[2]) }
}

/** The short line a notice leads with: "PULLED 3 COMMITS", "DIVERGED". */
export function syncHeadline(result: GitSyncResult): string {
  const commits = `${result.commits} COMMIT${result.commits === 1 ? '' : 'S'}`
  switch (result.code) {
    case 'pulled':
      return `PULLED ${commits}`
    case 'pushed':
      return `PUSHED ${commits}`
    case 'current':
      return 'ALREADY UP TO DATE'
    case 'fetched':
      return result.commits === 0 ? 'FETCHED · UP TO DATE' : `FETCHED · ${commits} BEHIND`
    case 'diverged':
      return 'DIVERGED'
    case 'rejected':
      return 'REJECTED'
    case 'busy':
      return 'BUSY'
    case 'refused':
      return `CANNOT ${result.action.toUpperCase()}`
    case 'timeout':
      return 'TIMED OUT'
    default:
      return `${result.action.toUpperCase()} FAILED`
  }
}

/** What a button says while its fetch, pull or push runs. */
export const SYNC_BUSY: Record<GitSyncAction, string> = {
  fetch: 'FETCHING',
  pull: 'PULLING',
  push: 'PUSHING',
}

/** A button's title: what it does to which upstream, or why it cannot be pressed now. */
export function syncTitle(state: GitState | null, action: GitSyncAction): string {
  const blocked = syncBlocked(state, action)
  if (blocked !== null) return `Cannot ${action}: ${blocked}`
  const upstream = state?.branch.upstream ?? ''
  if (action === 'push') {
    return `Push this branch onto ${upstream}, never forced. No hooks run: pre-push checks are skipped`
  }
  return action === 'pull'
    ? `Pull ${upstream} into this branch, fast-forward only (no merge, no rebase, no hooks)`
    : `Fetch from the remote of ${upstream}, leaving the working tree as it is`
}

/**
 * What the armed button says. A push names what goes where, and that its hooks do not run:
 * a repository that checks in pre-push (husky's tests, a linter) is pushed without them.
 */
export function syncArmed(state: GitState | null, action: GitSyncAction): string {
  if (action !== 'push') return action
  const branch = state?.branch
  return `push ↑${branch?.ahead ?? 0} to ${branch?.upstream ?? ''} · no hooks`
}

/** The notice's colour for how it ended: done, the terminal's to sort out, or failed. */
export function syncTone(code: GitSyncCode): 'ok' | 'warn' | 'danger' {
  return SYNC_DONE.has(code) ? 'ok' : SYNC_WARN.has(code) ? 'warn' : 'danger'
}
