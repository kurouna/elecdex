import type { SavedLayoutsApi } from '@shared/api'
import type { SavedLayoutSummary } from '@shared/layouts'
import type { LayoutTree } from '@shared/schemas/layout'
import { toasts } from './toasts.svelte.ts'

/** What the saved layouts ask of the live layout they belong to (layout.svelte.ts). */
export interface SavedHost {
  /** Writes a pending save and waits for one in flight. */
  flush(): Promise<void>
  /** A plain copy of the live tree, for crossing the IPC boundary. */
  snapshot(): LayoutTree
  /** Puts the arrangement on screen away and brings `tree` up in its place. */
  replaceTree(tree: LayoutTree): Promise<void>
  /** Whether the workspace may be replaced by the layout of that name. */
  mayReplace(name: string): Promise<boolean>
}

/**
 * Arrangements the user keeps by name (architecture.md §5.6, shared/layouts.ts),
 * part of the layout store (`layout.saved`). Only the names are held here: the
 * trees stay in main until one is applied, so the page never carries a dozen
 * layouts it is not showing.
 */
export class SavedLayouts {
  readonly #host: SavedHost

  constructor(host: SavedHost) {
    this.#host = host
  }

  list = $state.raw<SavedLayoutSummary[]>([])

  /** The layout being worked in: what the workspace is written back into. */
  readonly active = $derived(this.list.find((entry) => entry.active) ?? null)

  async load(): Promise<void> {
    try {
      this.list = await window.elecdex.layout.saved.list()
    } catch (error) {
      // Not being able to list them costs nothing that is on screen.
      console.error('[elecdex] could not read the saved layouts', error)
    }
  }

  /**
   * Keeps the current arrangement under a name, replacing one already saved
   * under it. False when the list is full, so the caller can say so.
   */
  async saveAs(name: string): Promise<boolean> {
    // A pane still powering off is closed as far as a saved arrangement goes,
    // and a save still pending belongs to the layout being left: keeping the
    // arrangement under a new name enters that new layout, so main must have
    // the old one first. Left to the debounce, the last few hundred
    // milliseconds of work would land in one layout or the other depending on
    // how long the user took to type the name.
    await this.#host.flush()
    const next = await this.#ask((saved) => saved.save(name, this.#host.snapshot()))
    if (next === undefined) return false
    this.list = next
    return next.some((entry) => entry.name === name)
  }

  /**
   * Makes a saved arrangement the live one.
   *
   * The pending save is written out first rather than dropped: it holds the
   * arrangement of the layout being left, and a layout follows the work, so it
   * has to reach that layout before the workspace becomes another one.
   */
  async apply(id: string): Promise<boolean> {
    await this.#host.flush()
    const tree = await this.#ask((saved) => saved.apply(id))
    // Main could not be asked: `ask` has said so.
    if (tree === undefined) return false
    if (tree === null) {
      // Main no longer has it, or cannot read it (a layouts.json changed by hand,
      // or written by a newer elecdex): a key that does nothing says why, and the
      // list is read again so it stops offering what is not there.
      toasts.show({
        title: 'the layout could not be applied',
        body: 'It is no longer saved, or was saved by a newer elecdex. The list now shows what is on disk.',
        tone: 'warn',
      })
      await this.load()
      return false
    }
    // Which layout is now being worked in, before the effect rather than after
    // it: main has already decided, and a second switch pressed while the panes
    // are still coming on asks this list which one it is in.
    this.markActive(id)
    await this.#host.replaceTree(tree)
    await this.load()
    return true
  }

  /** Records which saved layout the workspace belongs to, as main has just said. */
  markActive(id: string | null): void {
    if (this.list.every((entry) => entry.active === (entry.id === id))) return
    this.list = this.list.map((entry) => ({ ...entry, active: entry.id === id }))
  }

  /**
   * Goes to a saved layout, asking first when shells would end by it.
   *
   * This is the way in for everything that switches - the number shortcuts, the
   * buttons in the status bar, the dialog - so the question is asked once, in
   * one place, whichever of them was used. The layout already being worked in is
   * not re-applied: there would be nothing to see but the effect.
   */
  async switchTo(id: string): Promise<boolean> {
    const entry = this.list.find((layout) => layout.id === id)
    // A switch still playing is not a reason to refuse: pressing 1 then 2 must
    // end at 2, and `replaceTree` hands the screen to whichever came last.
    if (entry === undefined || entry.active) return false
    if (!(await this.#host.mayReplace(entry.name))) return false
    return this.apply(id)
  }

  async remove(id: string): Promise<void> {
    await this.#change((saved) => saved.remove(id))
  }

  /** Renames one; the name it keeps is whatever comes back. */
  async rename(id: string, name: string): Promise<void> {
    await this.#change((saved) => saved.rename(id, name))
  }

  /** Moves one up or down the list, which is what the number shortcuts follow. */
  async move(id: string, delta: number): Promise<void> {
    await this.#change((saved) => saved.move(id, delta))
  }

  /**
   * Runs a change to the list and takes the list it answers with. A failure
   * leaves the list as it is: main is the one that decides what is saved, and
   * a dialog showing the old list is better than one showing a guess.
   */
  async #change(run: (saved: SavedLayoutsApi) => Promise<SavedLayoutSummary[]>): Promise<void> {
    const next = await this.#ask(run)
    if (next !== undefined) this.list = next
  }

  /** Asks main about the saved layouts; undefined when it could not be reached. */
  async #ask<T>(run: (saved: SavedLayoutsApi) => Promise<T>): Promise<T | undefined> {
    try {
      return await run(window.elecdex.layout.saved)
    } catch (error) {
      console.error('[elecdex] a saved layout could not be changed', error)
      toasts.show({
        title: 'the saved layouts could not be changed',
        body: 'Nothing was saved. The list on screen is the one on disk.',
        tone: 'danger',
      })
      return undefined
    }
  }
}
