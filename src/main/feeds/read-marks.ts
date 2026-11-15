import { z } from 'zod'

/**
 * Which headlines have been opened, across every RSS pane: an article read in one pane shows
 * read in the others and after a restart. Kept by main as one small file, `feeds-read.json`
 * (the desk's data lives in main; a pane keeps only its display choices).
 *
 * Keys are feedItemKey's (an article's link, or its feed and title). The file is bounded: a
 * mark older than READ_TTL_MS goes, and past READ_MAX the oldest go first - a feed keeps its
 * twenty newest items, so a mark that old is for a headline long gone from every list.
 */

export const READ_MAX = 3000
export const READ_TTL_MS = 120 * 24 * 60 * 60_000
/** A key longer than this is no feed item's (a link is at most 2048, a title 300). */
export const READ_KEY_MAX = 2600

export const ReadMarksSchema = z.record(z.string().max(READ_KEY_MAX), z.number())
export type ReadMarksFile = z.infer<typeof ReadMarksSchema>

export interface ReadMarksDeps {
  load(): ReadMarksFile
  save(marks: ReadMarksFile): void
  now(): number
}

export class ReadMarks {
  private readonly deps: ReadMarksDeps
  /** Key -> when it was marked; insertion order is age order. */
  private marks: Map<string, number> | null = null

  constructor(deps: ReadMarksDeps) {
    this.deps = deps
  }

  /** Read on first use: an app with no RSS pane never opens the file. */
  private all(): Map<string, number> {
    if (this.marks === null) {
      const now = this.deps.now()
      const entries = Object.entries(this.deps.load())
        .filter(([, at]) => now - at <= READ_TTL_MS)
        .sort((a, b) => a[1] - b[1])
      this.marks = new Map(entries.slice(-READ_MAX))
    }
    return this.marks
  }

  has(key: string): boolean {
    return this.all().has(key)
  }

  /** Marks or unmarks; false when nothing changed. */
  set(key: string, read: boolean): boolean {
    return this.setMany([key], read).length > 0
  }

  /** Marks or unmarks several at once, saving the file once; answers the keys that changed. */
  setMany(keys: readonly string[], read: boolean): string[] {
    const marks = this.all()
    const changed = [...new Set(keys)].filter((key) => read !== marks.has(key))
    if (changed.length === 0) return []
    const now = this.deps.now()
    for (const key of changed) {
      if (read) marks.set(key, now)
      else marks.delete(key)
    }
    while (marks.size > READ_MAX) {
      const oldest = marks.keys().next().value
      if (oldest === undefined) break
      marks.delete(oldest)
    }
    try {
      this.deps.save(Object.fromEntries(marks))
    } catch (error) {
      console.warn('[elecdex] could not save the read marks', error)
    }
    return changed
  }
}
