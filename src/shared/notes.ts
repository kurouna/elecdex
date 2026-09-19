import { z } from 'zod'

/**
 * Notes, kept in notes.json under userData.
 *
 * The body of a note is not pane state. Pane state lives in layout.json, which
 * is rewritten whole on every change and which the user may edit by hand; a note
 * would be rewritten there on every keystroke and would be lost the moment its
 * pane was closed. A note outlives its pane, so main owns it - the pane keeps
 * only which note it is showing.
 */

export const NOTES_VERSION = 1

export const NOTE_LIMITS = {
  /** How many notes the file holds. */
  notes: 200,
  /** Characters in one note. Generous for prose, small enough to keep saves cheap. */
  body: 256_000,
  /** The derived title is cut to this for the switcher. */
  title: 120,
} as const

export const NoteSchema = z.object({
  id: z.string().min(1).max(64),
  body: z.string().max(NOTE_LIMITS.body).default(''),
  /** Epoch milliseconds. */
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  /**
   * Bumped on every write. Two panes may show the same note, and each ignores
   * the broadcast carrying its own revision back so a keystroke is never undone
   * by its own echo.
   */
  rev: z.number().int().nonnegative().default(0),
})
export type Note = z.infer<typeof NoteSchema>

export const NotesFileSchema = z.object({
  version: z.literal(NOTES_VERSION).default(NOTES_VERSION),
  notes: z.array(NoteSchema).max(NOTE_LIMITS.notes).default([]),
})
export type NotesFile = z.infer<typeof NotesFileSchema>

export const emptyNotes = (): NotesFile => ({ version: NOTES_VERSION, notes: [] })

/**
 * The title shown for a note: its first line with anything that reads as markup
 * stripped off the front.
 *
 * There is no separate title field on purpose. A note that has to be named
 * before it can be written is a form, not a scratch pad, and the first line is
 * what people write there anyway.
 */
export function noteTitle(body: string): string {
  for (const line of body.split('\n', 20)) {
    const text = line.replace(/^[\s#>*+-]+/, '').trim()
    if (text !== '') return text.slice(0, NOTE_LIMITS.title)
  }
  return 'untitled'
}

/** Notes newest-first, the order the switcher lists them in. */
export const sortNotes = (notes: readonly Note[]): Note[] =>
  [...notes].sort((a, b) => b.updatedAt - a.updatedAt)
