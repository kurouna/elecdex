import type { GitArea, GitCode, GitFile } from '@shared/git'
import type { CardRow } from '../../lib/hover-card.ts'

/**
 * What the git pane's card for a changed file says (GitFileCard.svelte, the
 * frame being every detail card's: architecture.md §7.4). Pure.
 */

/**
 * A path of the repository as the system writes it, under the repository's
 * folder. git names that folder with forward slashes on Windows too
 * (C:/Users/...), so a folder on a drive is written with backslashes, whole.
 */
export function repoFilePath(repoPath: string, path: string): string {
  if (repoPath === '') return path
  const windows = /^[a-z]:[\\/]/i.test(repoPath) || repoPath.includes('\\')
  const sep = windows ? '\\' : '/'
  const joined = `${repoPath.replace(/[\\/]+$/, '')}/${path}`
  return windows ? joined.replaceAll('/', sep) : joined
}

/** git's letter in words. */
export const CODE_WORDS: Record<GitCode, string> = {
  M: 'modified',
  A: 'added',
  D: 'deleted',
  R: 'renamed',
  C: 'copied',
  T: 'type changed',
  U: 'in conflict',
  '?': 'not tracked',
}

const AREA_WORDS: Record<GitArea, string> = {
  staged: 'staged for the next commit',
  unstaged: 'in the working tree, not staged',
  untracked: 'new to git',
  conflicted: 'needs resolving',
}

/** What a changed file's card says below its full path. `commit`: the file is a commit's, not the working tree's. */
export function fileRows(file: GitFile, repoPath: string, commit: boolean): CardRow[] {
  const rows: CardRow[] = [
    {
      label: 'CHANGE',
      value: commit
        ? `${CODE_WORDS[file.code]} in this commit`
        : `${CODE_WORDS[file.code]} · ${AREA_WORDS[file.area]}`,
    },
  ]
  if (file.from !== undefined)
    rows.push({ label: 'FROM', value: repoFilePath(repoPath, file.from) })
  if (file.binary) rows.push({ label: 'LINES', value: 'a binary file' })
  else if (file.added !== null) {
    rows.push({ label: 'LINES', value: `+${file.added} −${file.deleted ?? 0}` })
  }
  rows.push({
    label: 'CLICK',
    value: 'shows its diff · double-click opens it · right-click for more',
    muted: true,
  })
  return rows
}
