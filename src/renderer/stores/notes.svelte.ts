import { type Note, sortNotes } from '@shared/notes'

/**
 * The notes every notes pane shares.
 *
 * One copy in the window, not one per pane: two panes may show the same note,
 * and a second pane opening should not mean a second read of the file. The
 * listener is reference-counted like every other subscription here, so a window
 * with no notes pane is not listening for anything.
 */
class NotesStore {
  items = $state<Note[]>([])
  ready = $state(false)

  private users = 0
  private stop: (() => void) | null = null

  /** Called by a pane while it is mounted; returns the release. */
  use(): () => void {
    this.users += 1
    if (this.users === 1) this.start()
    return () => {
      this.users -= 1
      if (this.users === 0) {
        this.stop?.()
        this.stop = null
      }
    }
  }

  get sorted(): Note[] {
    return sortNotes(this.items)
  }

  find(id: string | null): Note | null {
    if (id === null) return null
    return this.items.find((note) => note.id === id) ?? null
  }

  async create(): Promise<Note | null> {
    const note = await window.elecdex.notes.create()
    if (note !== null) this.merge(note)
    return note
  }

  /** Stores a body. The answer carries the revision, so a pane can ignore its own echo. */
  async save(id: string, body: string): Promise<Note | null> {
    const note = await window.elecdex.notes.save(id, body)
    if (note !== null) this.merge(note)
    return note
  }

  async remove(id: string): Promise<void> {
    await window.elecdex.notes.remove(id)
    this.items = this.items.filter((note) => note.id !== id)
  }

  private merge(note: Note): void {
    const at = this.items.findIndex((entry) => entry.id === note.id)
    if (at === -1) this.items = [note, ...this.items]
    else this.items = this.items.map((entry) => (entry.id === note.id ? note : entry))
  }

  private start(): void {
    const off = window.elecdex.notes.onChange((file) => {
      this.items = file.notes
      this.ready = true
    })
    this.stop = off
    void window.elecdex.notes.list().then((file) => {
      this.items = file.notes
      this.ready = true
    })
  }
}

export const notes = new NotesStore()
