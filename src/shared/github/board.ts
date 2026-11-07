import { GH_LIMITS, repoName } from './derive.js'
import type { GithubBoardSpec } from './types.js'

/**
 * A GITHUB STATUS board's key: what a pane subscribes to, and the only thing it sends. Main reads
 * it back with `parseBoardKey` and accepts nothing else, so a key cannot name a host, a URL or an
 * argument - only repositories of the checked owner/name form.
 */
export function boardKey(spec: GithubBoardSpec): string {
  const repos =
    spec.repos === 'auto'
      ? 'auto'
      : [
          ...new Set(spec.repos.map((r) => repoName(r)).filter((r): r is string => r !== null)),
        ].slice(0, GH_LIMITS.maxRepos)
  return JSON.stringify({
    repos: Array.isArray(repos) && repos.length === 0 ? 'auto' : repos,
    inbox: spec.inbox,
  })
}

export function parseBoardKey(raw: unknown): GithubBoardSpec | null {
  if (typeof raw !== 'string' || raw.length > 2000) return null
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof value !== 'object' || value === null) return null
  const { repos, inbox } = value as { repos?: unknown; inbox?: unknown }
  if (inbox !== 'all' && inbox !== 'participating') return null
  let spec: GithubBoardSpec
  if (repos === 'auto') spec = { repos: 'auto', inbox }
  else {
    if (!Array.isArray(repos) || repos.length === 0 || repos.length > GH_LIMITS.maxRepos)
      return null
    const names = repos.map(repoName)
    if (names.some((name) => name === null)) return null
    spec = { repos: names as string[], inbox }
  }
  // Only the canonical form is a key: one board per spelling, never two for the same spec.
  return boardKey(spec) === raw ? spec : null
}

/** The pane's choices, read from its state with defaults. */
export function readGithubPane(state: Record<string, unknown> | undefined): {
  spec: GithubBoardSpec
  tab: 'queue' | 'inbox' | 'events' | 'repos'
  mask: boolean
  band: boolean
  drill: string | null
} {
  const s = state ?? {}
  const pinned = Array.isArray(s.repos)
    ? s.repos.filter((r): r is string => repoName(r) !== null)
    : []
  const tab = s.tab === 'inbox' || s.tab === 'events' || s.tab === 'repos' ? s.tab : 'queue'
  return {
    spec: {
      repos: pinned.length > 0 ? pinned : 'auto',
      inbox: s.inbox === 'participating' ? 'participating' : 'all',
    },
    tab,
    mask: s.mask === true,
    band: s.band !== false,
    drill: typeof s.drill === 'string' && repoName(s.drill) !== null ? s.drill : null,
  }
}
