import { type GitArea, type GitFile, type GitRef, type GitState, sameState } from '@shared/git'

/**
 * The git pane's decisions about its rows, its menu and its lamp, kept pure so
 * a unit test can hold them (tests/unit/git-rows.test.ts).
 */

/** A file of a list, by its list and path: the pane's choice and the list's selection. */
export const keyOf = (file: GitFile): string => `${file.area}:${file.path}`

/** What goes before a ref's name, in the graph and on its card. */
export const REF_MARK: Record<GitRef['kind'], string> = {
  head: '',
  branch: '⎇ ',
  remote: '',
  tag: '◆ ',
}

const AREAS: { area: GitArea; label: string }[] = [
  { area: 'conflicted', label: 'CONFLICTED' },
  { area: 'staged', label: 'STAGED' },
  { area: 'unstaged', label: 'UNSTAGED' },
  { area: 'untracked', label: 'UNTRACKED' },
]

export type FileListRow =
  | { kind: 'head'; key: string; label: string; count: number; area: GitArea }
  | { kind: 'file'; key: string; file: GitFile }

/**
 * One flat list with section heads, so rows can move between sections with
 * flip. A file is keyed by its path, so staging it moves its row. A file in two
 * lists at once (staged, then edited again) keys its staged row by the list: the
 * working tree's row is the one that stays, so a commit takes the staged row away
 * and leaves the other where it was. Before, the second row's key changed at the
 * commit, and the row that stayed folded out and landed again (found in review).
 */
export function fileListRows(files: readonly GitFile[], commit: boolean): FileListRow[] {
  if (commit) return files.map((file) => ({ kind: 'file', key: keyOf(file), file }))
  const inTree = new Set(files.filter((file) => file.area !== 'staged').map((file) => file.path))
  const out: FileListRow[] = []
  for (const { area, label } of AREAS) {
    const inArea = files.filter((file) => file.area === area)
    if (inArea.length === 0) continue
    out.push({ kind: 'head', key: `head:${area}`, label, count: inArea.length, area })
    for (const file of inArea) {
      const twice = area === 'staged' && inTree.has(file.path)
      out.push({
        kind: 'file',
        key: twice ? `file:${file.path}:staged` : `file:${file.path}`,
        file,
      })
    }
  }
  return out
}

/**
 * Whether a row's file can be opened: a commit's deleted file is not in the
 * working tree, and opening it only said so (found in review).
 */
export const opensInTree = (file: GitFile, commit: boolean): boolean =>
  !(commit && file.code === 'D')

/**
 * Where the files' context menu goes: at the click, but inside what the list
 * shows - left of the click near the right edge, above it near the bottom.
 * Before, a menu on the last rows was cut off by the list (found in review).
 * `room` is the list's visible part in its own scrolled coordinates.
 */
export function menuPlace(
  at: { x: number; y: number },
  size: { width: number; height: number },
  room: { width: number; top: number; height: number },
): { x: number; y: number } {
  const x = Math.max(0, Math.min(at.x, room.width - size.width))
  const bottom = room.top + room.height
  const y =
    at.y + size.height <= bottom
      ? at.y
      : at.y - size.height >= room.top
        ? at.y - size.height
        : Math.max(room.top, bottom - size.height)
  return { x, y }
}

/**
 * Whether a state main sent is a change to light the receive lamp for. Not the
 * kept reading main sends again when a pane comes back (the same `readAt`), and
 * not the reading made on that return unless what it shows differs (found in
 * review: the lamp lit on every return from a hidden tab). `back`: this is the
 * first reading since the pane came back.
 */
export function isNews(before: GitState | null, next: GitState, back: boolean): boolean {
  if (before === null || before.readAt === 0) return false
  if (next.readAt === before.readAt) return false
  return !(back && sameState(before, next))
}
