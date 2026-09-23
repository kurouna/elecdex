import { renameSync } from 'node:fs'

/**
 * Renames a freshly written temp file over its target: the atomic half of every
 * "write a temp file, then rename it" in main.
 *
 * On Windows a rename over a file another process has open fails with EPERM -
 * even when that process opened it for reading and allowed deletion, as Node and
 * most tools do. Antivirus scanners open every file just written, and anything
 * reading layout.json or settings.json (an editor, a backup tool, an e2e test
 * polling for a save) holds it for a moment. A save that failed there was lost
 * until the next change: the layout, settings or notes of that moment.
 *
 * So a rename refused that way is tried again later, off the call: against a
 * reader opening the file every millisecond, a rename took up to half a second to
 * get through (measured on Windows 11, 2026-09-21), far too long to block main -
 * the browser process - for. The caller has its new value in memory already, and
 * the temp file on disk is always the newest write, so a later write only
 * replaces what the retry will move; once one rename succeeds the others find no
 * temp file and stop. Any other error is thrown at once, as before.
 */

/** How long a refused rename is retried before it is given up with a warning. */
export const REPLACE_RETRY_FOR_MS = 10_000

const TRANSIENT = new Set(['EPERM', 'EACCES', 'EBUSY'])

export interface ReplaceDeps {
  rename?: (from: string, to: string) => void
  setTimeout?: (fn: () => void, ms: number) => unknown
  now?: () => number
}

const code = (error: unknown): string => (error as NodeJS.ErrnoException).code ?? ''

/** Retries waiting for their turn, by temp file: one per file is enough. */
const pending = new Set<string>()

/** A write to `temp` is still waiting to be renamed over its file: the file on disk is older. */
export const replacePending = (temp: string): boolean => pending.has(temp)

export function replaceFile(temp: string, file: string, deps: ReplaceDeps = {}): void {
  const rename = deps.rename ?? renameSync
  try {
    rename(temp, file)
    return
  } catch (error) {
    if (!TRANSIENT.has(code(error))) throw error
  }
  if (pending.has(temp)) return
  pending.add(temp)
  const later = deps.setTimeout ?? setTimeout
  const now = deps.now ?? Date.now
  const giveUpAt = now() + REPLACE_RETRY_FOR_MS
  let wait = 5
  const retry = (): void => {
    try {
      rename(temp, file)
    } catch (error) {
      const failed = code(error)
      // ENOENT: a later write's own rename got through and took the temp file.
      if (TRANSIENT.has(failed) && now() < giveUpAt) {
        wait = Math.min(wait * 2, 100)
        later(retry, wait)
        return
      }
      if (failed !== 'ENOENT') console.warn(`[elecdex] could not replace ${file}:`, error)
    }
    pending.delete(temp)
  }
  later(retry, wait)
}
