import path from 'node:path'
import {
  type Glossary,
  GlossarySchema,
  MAX_GLOSSARIES,
  readGlossaries,
} from '@shared/translate/glossary'
import { type HistoryEntry, readHistory, recordEntry } from '@shared/translate/history'
import { z } from 'zod'
import { JsonStore } from '../store/json-store.js'

/**
 * The glossaries and the history (docs/translate.md §6.3, §7): main's files, translate/
 * glossaries.json and translate/history.json, written through JsonStore (temp file and
 * replaceFile). The history is written at most every two seconds; a revision number tells the
 * panes that either changed, through the board they already follow.
 */

/** How long history writes are gathered for. */
export const HISTORY_WRITE_MS = 2000

const AnyFile = z.object({
  version: z.literal(1),
  entries: z.array(z.unknown()).optional(),
  glossaries: z.array(z.unknown()).optional(),
})

export interface LibraryDeps {
  setTimer(fn: () => void, ms: number): unknown
  clearTimer(handle: unknown): void
  changed(): void
}

export class TranslateLibrary {
  readonly #glossaryFile: JsonStore<z.infer<typeof AnyFile>>
  readonly #historyFile: JsonStore<z.infer<typeof AnyFile>>
  readonly #deps: LibraryDeps
  #glossaries: Glossary[]
  #history: HistoryEntry[]
  #writeTimer: unknown = null
  #revision = 0

  constructor(root: string, deps: LibraryDeps) {
    this.#deps = deps
    const store = (name: string) =>
      new JsonStore({
        file: path.join(root, name),
        schema: AnyFile,
        makeDefault: () => ({ version: 1 as const }),
      })
    this.#glossaryFile = store('glossaries.json')
    this.#historyFile = store('history.json')
    this.#glossaries = readGlossaries(this.#glossaryFile.read())
    this.#history = readHistory(this.#historyFile.read())
  }

  /** Grows with every change of either: the board carries it, and a pane asks again. */
  get revision(): number {
    return this.#revision
  }

  glossaries(): Glossary[] {
    return this.#glossaries
  }

  glossary(id: string): Glossary | null {
    return this.#glossaries.find((g) => g.id === id) ?? null
  }

  /** A glossary added or changed; a problem when it is not one, or there are too many. */
  saveGlossary(raw: unknown): { problem: string } | null {
    const parsed = GlossarySchema.safeParse(raw)
    if (!parsed.success) return { problem: 'Not a glossary.' }
    const glossary = parsed.data
    const at = this.#glossaries.findIndex((g) => g.id === glossary.id)
    if (at < 0 && this.#glossaries.length >= MAX_GLOSSARIES) {
      return { problem: `At most ${MAX_GLOSSARIES} glossaries.` }
    }
    this.#glossaries =
      at < 0
        ? [...this.#glossaries, glossary]
        : this.#glossaries.map((g, i) => (i === at ? glossary : g))
    this.#writeGlossaries()
    return null
  }

  removeGlossary(id: string): void {
    const next = this.#glossaries.filter((g) => g.id !== id)
    if (next.length === this.#glossaries.length) return
    this.#glossaries = next
    this.#writeGlossaries()
  }

  history(): HistoryEntry[] {
    return this.#history
  }

  entry(id: string): HistoryEntry | null {
    return this.#history.find((e) => e.id === id) ?? null
  }

  record(entry: HistoryEntry): void {
    this.#history = recordEntry(this.#history, entry)
    this.#historyChanged()
  }

  removeEntry(id: string): void {
    const next = this.#history.filter((e) => e.id !== id)
    if (next.length === this.#history.length) return
    this.#history = next
    this.#historyChanged()
  }

  clearHistory(): void {
    if (this.#history.length === 0) return
    this.#history = []
    this.#historyChanged()
  }

  /** Writes what is waiting now: elecdex is quitting. */
  flush(): void {
    if (this.#writeTimer === null) return
    this.#deps.clearTimer(this.#writeTimer)
    this.#writeTimer = null
    this.#writeHistory()
  }

  #writeGlossaries(): void {
    try {
      this.#glossaryFile.write({ version: 1, glossaries: this.#glossaries })
    } catch (error) {
      console.error('[elecdex] translate: could not write the glossaries', error)
    }
    this.#bump()
  }

  #historyChanged(): void {
    this.#bump()
    if (this.#writeTimer !== null) return
    this.#writeTimer = this.#deps.setTimer(() => {
      this.#writeTimer = null
      this.#writeHistory()
    }, HISTORY_WRITE_MS)
  }

  #writeHistory(): void {
    try {
      this.#historyFile.write({ version: 1, entries: this.#history })
    } catch (error) {
      console.error('[elecdex] translate: could not write the history', error)
    }
  }

  #bump(): void {
    this.#revision++
    this.#deps.changed()
  }
}
