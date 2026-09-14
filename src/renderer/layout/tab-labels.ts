/**
 * Names for shell tabs, taken from where each shell is.
 *
 * A tab is named after its working directory's last folder, as Windows Terminal
 * and VS Code name theirs: the shell's name was the same on every tab and told
 * them apart no better than nothing. Only tabs that would share a name get
 * parent folders added, one at a time, until they differ. Pure, so the rules
 * are unit-tested (tests/unit/tab-labels.test.ts).
 */

/** A Windows path: a drive letter, or a UNC share. */
const WINDOWS_PATH = /^(?:[A-Za-z]:|\\\\|\/\/)/

function isWindowsPath(path: string): boolean {
  return WINDOWS_PATH.test(path)
}

/**
 * A path as its platform writes it. Shell integration reports Windows paths
 * with forward slashes (from a file:// URL), which read as foreign next to the
 * file browser's backslashes.
 */
export function displayPath(path: string): string {
  return isWindowsPath(path) ? path.replace(/\//g, '\\') : path
}

function segments(path: string): string[] {
  return path.split(/[\\/]/).filter((part) => part !== '')
}

/** Paths compared as the platform would: Windows ignores case and the kind of slash. */
function samePath(a: string, b: string): boolean {
  const norm = (p: string) => {
    const joined = segments(p).join('/')
    return isWindowsPath(p) ? joined.toLowerCase() : joined
  }
  return norm(a) === norm(b)
}

/**
 * The last `count` folders of a path, or its root when it has no folder. One more
 * than it has is the whole path, root and all, the last way left to tell it apart.
 */
function tail(path: string, count: number): string {
  const parts = segments(path)
  const windows = isWindowsPath(path)
  const separator = windows ? '\\' : '/'
  // A drive root keeps its backslash (`C:\`); the POSIX root is `/`.
  if (parts.length === 0) return separator
  if (windows && parts.length === 1 && /^[A-Za-z]:$/.test(parts[0] ?? '')) return `${parts[0]}\\`
  if (count > parts.length) return displayPath(path)
  return parts.slice(-count).join(separator)
}

/**
 * One label per path, `null` where a tab has no path (its shell has not said
 * where it is). The home folder is named like any other: a lone `~` said too
 * little on a tab.
 */
export function tabLabels(paths: readonly (string | null | undefined)[]): (string | null)[] {
  const depth = paths.map(() => 1)
  const label = (index: number): string | null => {
    const path = paths[index]
    if (path == null || path === '') return null
    return tail(path, depth[index] ?? 1)
  }

  // Lengthen clashing labels until they differ. Each pass adds a folder to
  // every tab in a clash whose path has one more to give, so it ends.
  for (;;) {
    const labels = paths.map((_, index) => label(index))
    let grew = false
    labels.forEach((text, index) => {
      const path = paths[index]
      if (text === null || path == null) return
      const clash = labels.some(
        (other, j) => j !== index && other === text && !samePath(paths[j] ?? '', path),
      )
      if (clash && (depth[index] ?? 1) <= segments(path).length) {
        depth[index] = (depth[index] ?? 1) + 1
        grew = true
      }
    })
    if (!grew) return labels
  }
}
