import { z } from 'zod'
import { LayoutTreeSchema } from './schemas/layout.js'

/**
 * Saved layouts: the arrangements the user works in, kept by name.
 *
 * They follow the work rather than being snapshots. One of them is `active` -
 * the one that was applied - and every save of the live layout is written into
 * it as well, so rearranging the workspace and coming back later finds it as it
 * was left. Saving a snapshot and having it drift back to what it was on the
 * next switch was the first design, and it was wrong: the arrangement a person
 * is working in is the thing they expect to persist (user decision 2026-09-20).
 *
 * layout.json still holds the one live arrangement, and is still what the app
 * opens with and what a hand edit reaches; these are copies beside it.
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
  /**
   * The layout being worked in, which the live layout is written back into. Null
   * after a reset, or when nothing has been applied: the workspace is then an
   * arrangement of its own, belonging to no saved layout.
   */
  active: z.string().nullable().default(null),
})
export type SavedLayoutsFile = z.infer<typeof SavedLayoutsFileSchema>

/** What the renderer lists: the trees stay in main until one is applied. */
export interface SavedLayoutSummary {
  id: string
  name: string
  /** The one being worked in: what the workspace is written back into. */
  active: boolean
}

export const summarize = (
  items: readonly SavedLayout[],
  activeId: string | null,
): SavedLayoutSummary[] => items.map(({ id, name }) => ({ id, name, active: id === activeId }))

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

/** The list after writing `tree` into the active layout; unchanged when there is none. */
export function withLiveTree(
  items: readonly SavedLayout[],
  activeId: string | null,
  tree: SavedLayout['tree'],
): SavedLayout[] | null {
  if (activeId === null) return null
  const at = items.findIndex((item) => item.id === activeId)
  if (at < 0) return null
  // Writing an identical tree back would rewrite the file on every focus change,
  // which is what a layout save mostly is.
  if (JSON.stringify(items[at]?.tree) === JSON.stringify(tree)) return null
  return items.map((item, i) => (i === at ? { ...item, tree } : item))
}
