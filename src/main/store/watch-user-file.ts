import { type FSWatcher, unwatchFile, watch, watchFile } from 'node:fs'
import path from 'node:path'

/**
 * Reports changes to one file under userData, however they were made.
 *
 * The same arrangement settings.json has, for the same two reasons. The folder
 * is watched rather than the file, because an editor that saves by renaming a
 * temp file over the original leaves a file watcher attached to a deleted inode;
 * and the modification time is polled as well, because fs.watch misses events on
 * some Windows setups. Changes are debounced: a save is a truncate, a write and
 * a rename, and reading between them finds half a file.
 */

const DEBOUNCE_MS = 150
const POLL_MS = 1000

export function watchUserFile(file: string, onChange: () => void): { close: () => void } {
  const dir = path.dirname(file)
  const name = path.basename(file)
  let timer: NodeJS.Timeout | undefined

  const settle = (): void => {
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      onChange()
    }, DEBOUNCE_MS)
  }

  let watcher: FSWatcher | null = null
  let polling = false
  try {
    watcher = watch(dir, { persistent: false }, (_event, changed) => {
      if (changed === name) settle()
    })
    watchFile(file, { persistent: false, interval: POLL_MS }, (now, before) => {
      if (now.mtimeMs !== before.mtimeMs) settle()
    })
    polling = true
  } catch (error) {
    console.warn(`[elecdex] ${name} will not reload live:`, error)
  }

  return {
    close: () => {
      if (timer !== undefined) clearTimeout(timer)
      watcher?.close()
      if (polling) unwatchFile(file)
    },
  }
}
