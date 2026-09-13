/**
 * Update check: is there a newer elecdex release on GitHub?
 *
 * Only a check. Nothing is downloaded or installed: the builds are unsigned, so
 * an in-place updater would trip Gatekeeper and SmartScreen on every update;
 * instead the user is pointed at the release page.
 */

export const RELEASES_API = 'https://api.github.com/repos/kurouna/elecdex/releases/latest'
export const RELEASES_PAGE = 'https://github.com/kurouna/elecdex/releases'

export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'disabled' }
  | { state: 'checking' }
  | { state: 'current'; checkedAt: number; latest: string | null }
  | { state: 'available'; checkedAt: number; latest: string; url: string }
  | { state: 'error'; checkedAt: number; error: string }

interface Version {
  core: [number, number, number]
  pre: string[]
}

function parseVersion(raw: string): Version | null {
  const m = raw.trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/)
  if (!m) return null
  return {
    core: [Number(m[1]), Number(m[2]), Number(m[3])],
    pre: m[4] ? m[4].split('.') : [],
  }
}

/** Semver order of one pre-release identifier: numbers below words, numbers by value. */
function comparePart(a: string, b: string): number {
  const na = /^\d+$/.test(a) ? Number(a) : null
  const nb = /^\d+$/.test(b) ? Number(b) : null
  if (na !== null && nb !== null) return na - nb
  if (na !== null) return -1
  if (nb !== null) return 1
  return a === b ? 0 : a < b ? -1 : 1
}

function comparePre(a: string[], b: string[]): number {
  // A release outranks its pre-releases.
  if (a.length === 0 || b.length === 0) return b.length - a.length
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const diff = comparePart(a[i] as string, b[i] as string)
    if (diff !== 0) return diff
  }
  return a.length - b.length
}

/** Semver order: negative if a < b, positive if a > b, 0 if equal or either is not a version. */
export function compareVersions(a: string, b: string): number {
  const va = parseVersion(a)
  const vb = parseVersion(b)
  if (!va || !vb) return 0
  for (let i = 0; i < 3; i++) {
    const diff = (va.core[i] as number) - (vb.core[i] as number)
    if (diff !== 0) return diff
  }
  return comparePre(va.pre, vb.pre)
}

/**
 * The latest release from GitHub's API response, if it is a usable one: a
 * published, non-draft release with a version tag and a page on this repository.
 * The page URL is checked because it is what the app offers to open.
 */
export function parseRelease(json: unknown): { version: string; url: string } | null {
  if (typeof json !== 'object' || json === null) return null
  const r = json as Record<string, unknown>
  if (r.draft === true || r.prerelease === true) return null
  if (typeof r.tag_name !== 'string' || typeof r.html_url !== 'string') return null
  const version = r.tag_name.replace(/^v/, '')
  if (parseVersion(version) === null) return null
  if (!r.html_url.startsWith(`${RELEASES_PAGE}/`)) return null
  return { version, url: r.html_url }
}
