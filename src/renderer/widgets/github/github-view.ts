import type { GithubBoard, ItemKind, QueueItem, RepoTile, Weight } from '@shared/github/types'
import { clockText, type Tone } from '../cloud/cloud-view.ts'

/** GITHUB STATUS's view helpers (docs/github.md §5), pure. */

export const KIND_LABEL: Record<ItemKind, string> = {
  pr: 'PR',
  issue: 'IS',
  ci: 'CI',
  security: 'SEC',
  run: 'RUN',
  release: 'RL',
  discussion: 'DS',
}

export const QUEUE_GROUPS: { weight: Weight; label: string }[] = [
  { weight: 'danger', label: 'Broken or blocked' },
  { weight: 'warn', label: 'Waiting too long' },
  { weight: 'info', label: 'For you' },
  { weight: 'quiet', label: 'Triage · nobody has answered' },
]

export type QueueFilter = 'all' | 'mine' | 'review' | 'security' | 'mention' | 'triage'
export const QUEUE_FILTERS: readonly QueueFilter[] = [
  'all',
  'mine',
  'review',
  'security',
  'mention',
  'triage',
]

export function queueMatches(item: QueueItem, filter: QueueFilter): boolean {
  switch (filter) {
    case 'all':
      return true
    case 'mine':
      return item.mine
    case 'review':
      return item.tag === 'Review' || item.tag.startsWith('Waiting')
    case 'security':
      return item.kind === 'security'
    case 'mention':
      return item.tag === 'Mention'
    case 'triage':
      return item.tag === 'Triage'
  }
}

/** The user's own repositories go by their name alone, so the column keeps the part that differs. */
export function repoLabel(
  repo: string,
  me: string | null,
  isPrivate: boolean,
  masked: boolean,
): string {
  if (masked && isPrivate) return 'private repo'
  return me !== null && repo.startsWith(`${me}/`) ? repo.slice(me.length + 1) : repo
}

export function titleOf(title: string, isPrivate: boolean, masked: boolean): string {
  return masked && isPrivate ? '•••••••••' : title
}

export function alertsText(alerts: RepoTile['alerts']): string {
  return alerts === 'off' ? 'off' : alerts === null ? '—' : String(alerts)
}

/**
 * What REFRESH does while the rate limit holds the board back (github.md §3): GitHub asked to
 * wait (a press reads only the sign-in and the limit itself), or under 10% is left (it reads
 * only what the four-times-longer periods have due). The pane says so instead of a press that
 * seems to do nothing. Null otherwise.
 */
export function refreshNote(board: Pick<GithubBoard, 'heldUntil' | 'rate'>): string | null {
  if (board.heldUntil !== null)
    return `GitHub asked to wait: REFRESH reads only the rate limit until ${clockText(board.heldUntil)}`
  if (board.rate?.low === true)
    return `rate low: readings 4× apart until the reset at ${clockText(board.rate.reset)}, and REFRESH reads only what is due`
  return null
}

/** The 14 days' views: the sum, or what stands for it (the card's longer words when `long`). */
export function viewsText(views: RepoTile['views14'], long = false): string {
  if (views === 'unread') return long ? 'not read yet' : '—'
  if (views === null) return long ? 'not shown: needs push access' : '—'
  return views.reduce((a, b) => a + b, 0).toLocaleString('en')
}

export function compact(n: number): string {
  return n >= 10_000 ? `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}k` : n.toLocaleString('en')
}

/** The colour step of a day in the contribution grid, 0 to 4. */
export function heatLevel(count: number): number {
  return count === 0 ? 0 : count < 3 ? 1 : count < 5 ? 2 : count < 8 ? 3 : 4
}

/**
 * The pane header's badge (paneMeta), the heaviest first: a link that is not linked, a red default
 * branch, then GitHub's own incident. None when all is well.
 */
export function githubBadge(
  board: GithubBoard,
  link: { word: string; tone: Tone },
  red: number,
): { badge?: string; badgeKind?: 'danger' | 'warn' } {
  if (board.link !== 'linked' && board.link !== 'linking')
    return { badge: link.word.toLowerCase(), badgeKind: link.tone === 'danger' ? 'danger' : 'warn' }
  if (red > 0) return { badge: 'main red', badgeKind: 'danger' }
  const incident = board.incidents[0]
  if (incident === undefined) return {}
  return { badge: 'GitHub incident', badgeKind: incident.weight === 'danger' ? 'danger' : 'warn' }
}
