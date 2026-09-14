import { statSync } from 'node:fs'
import path from 'node:path'
import type { StartDirectory } from '@shared/api'

/**
 * Where a new shell starts, from the `terminal.startDirectory` setting.
 *
 * Empty means the home folder, and so does anything that is not a folder once
 * read: a relative path (relative to what?), a folder since deleted or a drive
 * not mounted. The shell must always start, so a bad setting never stops it; the
 * settings dialog shows that it fell back. "~" at the start stands for home, as
 * in the shells themselves.
 */
export function resolveStartDirectory(
  setting: string,
  home: string,
  isDirectory: (dir: string) => boolean = directoryExists,
): StartDirectory {
  const raw = setting.trim()
  if (raw === '') return { path: home, fellBack: false }
  const expanded = /^~(?=$|[\\/])/.test(raw) ? path.join(home, raw.slice(1)) : raw
  if (path.isAbsolute(expanded) && isDirectory(expanded)) {
    return { path: path.normalize(expanded), fellBack: false }
  }
  return { path: home, fellBack: true }
}

function directoryExists(dir: string): boolean {
  try {
    return statSync(dir).isDirectory()
  } catch {
    return false
  }
}
