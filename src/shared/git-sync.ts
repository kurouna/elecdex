import type { GitState } from './git.js'

/**
 * The git pane's two writes: FETCH and PULL, each on the user's own press
 * (architecture.md §5.9). Everything else the pane does only reads.
 *
 * A pull is a fast-forward and nothing else: no merge commit, no rebase, no
 * conflict for the pane to leave behind, no editor to wait on. When the branch
 * and its upstream have both moved on, it refuses and says so, and the user
 * merges or rebases in the terminal, where git can ask them things.
 *
 * The decisions are pure and live here, so the page (whether the buttons can be
 * pressed) and main (whether to run git at all) read the same rules.
 */

export const GIT_SYNC_ACTIONS = ['fetch', 'pull'] as const
export type GitSyncAction = (typeof GIT_SYNC_ACTIONS)[number]

export const isSyncAction = (value: unknown): value is GitSyncAction =>
  typeof value === 'string' && (GIT_SYNC_ACTIONS as readonly string[]).includes(value)

/** How a fetch or pull ended. */
export type GitSyncCode =
  /** A fetch that ran; `commits` is how far behind the branch now is. */
  | 'fetched'
  /** A pull that moved the branch on; `commits` is by how many. */
  | 'pulled'
  /** A pull with nothing to take. */
  | 'current'
  /** Both sides have commits the other lacks: a fast-forward cannot join them. */
  | 'diverged'
  /** Another fetch or pull of this repository is still running. */
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
export const SYNC_DONE: ReadonlySet<GitSyncCode> = new Set(['fetched', 'pulled', 'current'])

/** A network round trip, and possibly a large one: far longer than a reading may take. */
export const SYNC_TIMEOUT_MS = 120_000

/**
 * Why a fetch or pull cannot be run on the repository as main last read it, or
 * null when it can. Checked by the page to dim the button and by main before it
 * runs anything, against its own reading rather than what the page says.
 */
export function syncBlocked(state: GitState | null, action: GitSyncAction): string | null {
  if (state === null || state.readAt === 0) return 'not read yet'
  if (state.problem !== null) return 'the repository cannot be read'
  if (state.operation !== null) return `a ${state.operation} is in progress`
  if (state.branch.head === null) return 'HEAD is detached'
  if (state.branch.upstream === null) return 'the branch has no upstream'
  if (action === 'pull' && state.branch.ahead > 0 && state.branch.behind > 0) {
    return 'diverged from its upstream: merge or rebase in the terminal'
  }
  return null
}

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
    case 'current':
      return 'ALREADY UP TO DATE'
    case 'fetched':
      return result.commits === 0 ? 'FETCHED · UP TO DATE' : `FETCHED · ${commits} BEHIND`
    case 'diverged':
      return 'DIVERGED'
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
