import {
  type Snippet,
  type SnippetAdded,
  type SnippetContent,
  type SnippetsFile,
  type SnippetView,
  snippetView,
  withEdit,
  withMove,
  withoutSnippet,
  withSnippet,
  withUse,
} from '@shared/snippets'

export interface SnippetShelfDeps {
  /** snippets.json as it is on disk (or the default). */
  load(): SnippetsFile
  save(file: SnippetsFile): void
  now(): number
  makeId(): string
  /** Every change, made here or by hand in the file. */
  changed(): void
}

/**
 * The snippets, main's (architecture.md §5.14): snippets.json in memory, with an
 * index from text to id so the history's rows can say which of them are kept
 * too, and which snippet the clipboard holds. Every change goes through a pure
 * function in shared/snippets.ts; this only keeps the result, writes it and says
 * so. The page never has a snippet's whole text but in the editor, by asking.
 */
export class SnippetShelf {
  readonly #deps: SnippetShelfDeps
  #file: SnippetsFile
  #index = new Map<string, string>()

  constructor(deps: SnippetShelfDeps) {
    this.#deps = deps
    this.#file = deps.load()
    this.#reindex()
  }

  views(): SnippetView[] {
    return this.#file.snippets.map(snippetView)
  }

  /** The snippet holding exactly this text, or null. */
  idOf(text: string): string | null {
    return this.#index.get(text) ?? null
  }

  get(id: string): Snippet | undefined {
    return this.#file.snippets.find((snippet) => snippet.id === id)
  }

  add(content: SnippetContent, name = ''): SnippetAdded {
    const { file, result } = withSnippet(
      this.#file,
      content,
      this.#freshId(),
      this.#deps.now(),
      name,
    )
    this.#commit(file)
    return result
  }

  edit(id: string, change: { name?: string; text?: string }): boolean {
    const next = withEdit(this.#file, id, change, this.#deps.now())
    if (next === null) return false
    this.#commit(next)
    return true
  }

  move(id: string, index: number): boolean {
    if (this.get(id) === undefined) return false
    this.#commit(withMove(this.#file, id, index))
    return true
  }

  remove(id: string): boolean {
    if (this.get(id) === undefined) return false
    this.#commit(withoutSnippet(this.#file, id))
    return true
  }

  /** A snippet was put on the clipboard. */
  used(id: string): void {
    this.#commit(withUse(this.#file, id, this.#deps.now()))
  }

  /** The file changed on disk, by hand: it is what there is now. */
  reload(file: SnippetsFile): void {
    if (JSON.stringify(file) === JSON.stringify(this.#file)) return
    this.#file = file
    this.#reindex()
    this.#deps.changed()
  }

  #commit(next: SnippetsFile): void {
    if (next === this.#file) return
    this.#file = next
    this.#reindex()
    this.#deps.save(next)
    this.#deps.changed()
  }

  #reindex(): void {
    this.#index = new Map(this.#file.snippets.map((snippet) => [snippet.text, snippet.id]))
  }

  /** An id no snippet has: twelve random characters collide next to never, but a file edited by hand may. */
  #freshId(): string {
    for (;;) {
      const id = this.#deps.makeId()
      if (this.get(id) === undefined) return id
    }
  }
}
