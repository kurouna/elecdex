import { z } from 'zod'
import { LayoutTreeSchema } from './schemas/layout.js'

/**
 * Saved layouts: arrangements the user keeps by name and comes back to.
 *
 * The workspace still has exactly one live layout, in layout.json, which is
 * what the app opens with and what a hand edit reaches. These are copies of it
 * taken on request, in a file of their own - so nothing here changes what
 * layout.json means, and a saved arrangement cannot be lost by rearranging the
 * workspace.
 *
 * A saved layout holds a pane's state as it was, including a terminal's session
 * id. Those sessions are long gone by the time it is applied again, so the
 * shells come up new; applying a layout ends the shells of the panes it
 * replaces, exactly as closing those panes would.
 */

/** Enough for the handful of arrangements a person actually switches between. */
export const MAX_SAVED_LAYOUTS = 12

export const SavedLayoutSchema = z.object({
  /** Assigned by main, so the renderer cannot collide two of them. */
  id: z.string().regex(/^[a-z0-9]{4,32}$/),
  name: z.string().min(1).max(40),
  tree: LayoutTreeSchema,
})
export type SavedLayout = z.infer<typeof SavedLayoutSchema>

export const SavedLayoutsFileSchema = z.object({
  version: z.literal(1).default(1),
  items: z.array(SavedLayoutSchema).max(MAX_SAVED_LAYOUTS).default([]),
})
export type SavedLayoutsFile = z.infer<typeof SavedLayoutsFileSchema>

/** What the renderer lists: the trees stay in main until one is applied. */
export interface SavedLayoutSummary {
  id: string
  name: string
}

export const summarize = (items: readonly SavedLayout[]): SavedLayoutSummary[] =>
  items.map(({ id, name }) => ({ id, name }))

/** Trimmed, and rejected when nothing is left or it is too long to show. */
export function cleanLayoutName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  // Control characters would break the list as surely as an empty name.
  const name = raw.replace(/\p{C}/gu, ' ').trim()
  return name === '' || name.length > 40 ? null : name
}

/**
 * The list after saving `tree` under `name`.
 *
 * A name already in the list is replaced where it stands, rather than added
 * again: "save" on a layout the user is already keeping means updating it, and
 * two rows with one name could not be told apart. Returns null when the list is
 * full, so the caller can say so instead of quietly dropping the save.
 */
export function withSavedLayout(
  items: readonly SavedLayout[],
  entry: SavedLayout,
): SavedLayout[] | null {
  const at = items.findIndex((item) => item.name === entry.name)
  if (at >= 0) return items.map((item, i) => (i === at ? { ...entry, id: item.id } : item))
  if (items.length >= MAX_SAVED_LAYOUTS) return null
  return [...items, entry]
}
