import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { CH } from '@shared/channels'
import {
  emptyNotes,
  NOTE_LIMITS,
  type Note,
  type NotesFile,
  NotesFileSchema,
  noteTitle,
} from '@shared/notes'
import { app, dialog, ipcMain } from 'electron'
import { appWindows } from '../app-windows.js'
import { JsonStore } from '../store/json-store.js'
import { watchUserFile } from '../store/watch-user-file.js'

/**
 * Notes: main owns the text, every window sees the same file.
 *
 * There is no subscription to count here. Nothing is polled and nothing is
 * fetched - the cost of a note is a file on disk - so every window is told
 * about every change, the way settings are, and a pane decides for itself
 * whether the note it is showing moved.
 */

/** A body longer than the schema allows is cut rather than refused, so a paste is never lost whole. */
const clampBody = (body: string): string => body.slice(0, NOTE_LIMITS.body)

export function registerNotesIpc(): { dispose: () => void } {
  const file = path.join(app.getPath('userData'), 'notes.json')
  const store = new JsonStore<NotesFile>({
    file,
    schema: NotesFileSchema,
    makeDefault: emptyNotes,
    // Notes are the user's own words: a file that will not parse is left exactly
    // where it is, and a copy is taken before anything overwrites it.
    keepInvalid: true,
  })

  let notes = store.read()

  const broadcast = (): void => {
    for (const win of appWindows()) {
      if (!win.webContents.isDestroyed()) win.webContents.send(CH.notes.changed, notes)
    }
  }

  const commit = (next: NotesFile): void => {
    notes = next
    store.write(next)
    broadcast()
  }

  // A hand edit while the app runs takes effect, as it does for settings.json.
  const watcher = watchUserFile(file, () => {
    store.invalidate()
    const next = store.read()
    if (JSON.stringify(next) === JSON.stringify(notes)) return
    notes = next
    broadcast()
  })

  ipcMain.handle(CH.notes.list, (): NotesFile => notes)

  ipcMain.handle(CH.notes.create, (): Note | null => {
    if (notes.notes.length >= NOTE_LIMITS.notes) return null
    const now = Date.now()
    const note: Note = { id: crypto.randomUUID(), body: '', createdAt: now, updatedAt: now, rev: 1 }
    commit({ ...notes, notes: [note, ...notes.notes] })
    return note
  })

  ipcMain.handle(CH.notes.save, (_event, id: unknown, body: unknown): Note | null => {
    if (typeof id !== 'string' || typeof body !== 'string') return null
    const current = notes.notes.find((note) => note.id === id)
    if (current === undefined) return null
    const text = clampBody(body)
    // An unchanged body still answers, so a pane's save always resolves, but it
    // does not bump the revision - that would make every idle flush look like an
    // edit to the other panes showing the same note.
    if (text === current.body) return current

    const next: Note = { ...current, body: text, updatedAt: Date.now(), rev: current.rev + 1 }
    commit({ ...notes, notes: notes.notes.map((note) => (note.id === id ? next : note)) })
    return next
  })

  ipcMain.handle(CH.notes.remove, (_event, id: unknown): boolean => {
    if (typeof id !== 'string') return false
    if (!notes.notes.some((note) => note.id === id)) return false
    commit({ ...notes, notes: notes.notes.filter((note) => note.id !== id) })
    return true
  })

  ipcMain.handle(CH.notes.export, async (_event, id: unknown): Promise<string | null> => {
    if (typeof id !== 'string') return null
    const note = notes.notes.find((entry) => entry.id === id)
    if (note === undefined) return null

    // The renderer has no filesystem; the path comes from the user's own dialog.
    const result = await dialog.showSaveDialog({
      defaultPath: `${noteTitle(note.body)
        .replace(/[\\/:*?"<>|]/g, '_')
        .slice(0, 60)}.md`,
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    })
    if (result.canceled || result.filePath === '') return null
    await writeFile(result.filePath, note.body, 'utf8')
    return result.filePath
  })

  return {
    dispose: () => {
      watcher.close()
      ipcMain.removeHandler(CH.notes.list)
      ipcMain.removeHandler(CH.notes.create)
      ipcMain.removeHandler(CH.notes.save)
      ipcMain.removeHandler(CH.notes.remove)
      ipcMain.removeHandler(CH.notes.export)
    },
  }
}
