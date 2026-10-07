import { statSync } from 'node:fs'
import { stat } from 'node:fs/promises'
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

/**
 * How long a pane's folder may take to answer before its shell starts where a
 * new one would. A share whose server is gone can hold a look for many seconds.
 */
export const SHELL_DIRECTORY_WAIT_MS = 1500

/**
 * Where a shell a pane asked for starts: the folder it asked for (the one its
 * last shell was in, kept in the pane's state) while that is still a folder,
 * otherwise where a new shell starts. A folder deleted, renamed or on a drive
 * no longer there must not stop the shell from starting.
 *
 * Asked without blocking, and given up on after `SHELL_DIRECTORY_WAIT_MS`: the
 * folder may be on a network share, and a synchronous look at one that does not
 * answer would hold main - every window - while the layout comes back.
 */
export async function resolveShellDirectory(
  requested: string | undefined,
  fallback: () => string,
  isDirectory: (dir: string) => Promise<boolean> = directoryAnswers,
  waitMs = SHELL_DIRECTORY_WAIT_MS,
): Promise<string> {
  if (requested === undefined || !path.isAbsolute(requested)) return fallback()
  let timer: ReturnType<typeof setTimeout> | undefined
  const late = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => resolve(false), waitMs)
  })
  try {
    const found = await Promise.race([isDirectory(requested).catch(() => false), late])
    return found ? path.normalize(requested) : fallback()
  } finally {
    clearTimeout(timer)
  }
}

async function directoryAnswers(dir: string): Promise<boolean> {
  try {
    return (await stat(dir)).isDirectory()
  } catch {
    return false
  }
}

function directoryExists(dir: string): boolean {
  try {
    return statSync(dir).isDirectory()
  } catch {
    return false
  }
}
