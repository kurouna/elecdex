import path from 'node:path'

/**
 * The user's files that main found there but could not read (another program holding them open,
 * EBUSY or EPERM on Windows), and is reading again by itself (JsonStore's `readAgain`). While a
 * file is here its panes show the default in its place, which looks like the user's work gone:
 * the page is told, so it can say which file and that nothing is lost (system.ts sends it).
 */

const held = new Set<string>()
const listeners = new Set<(files: string[]) => void>()

export const unreadableFiles = {
  /** The file names, sorted: what the page says. */
  list(): string[] {
    return [...held].map((file) => path.basename(file)).sort()
  },

  /** Puts a file on the list, or takes it off; listeners hear only a change. */
  mark(file: string, unreadable: boolean): void {
    if (held.has(file) === unreadable) return
    if (unreadable) held.add(file)
    else held.delete(file)
    const files = this.list()
    for (const listener of listeners) listener(files)
  },

  onChange(listener: (files: string[]) => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}
