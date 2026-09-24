import { z } from 'zod'
import { layoutShape, type ShapeRect } from './layout-shape.js'
import type { LayoutNode, LayoutTree, PaneNode } from './schemas/layout.js'
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

/**
 * How many of them a number key applies: the first nine, by their place in the
 * list (shared/keybindings.ts has one action each). The rest are kept and can be
 * applied from the dialog, and moving one into the first nine is how it gets a
 * key - which is what the dialog's up and down buttons are for.
 */
export const KEYED_LAYOUTS = 9

export const SavedLayoutSchema = z.object({
  /** Assigned by main, so the renderer cannot collide two of them. */
  id: z.string().regex(/^[a-z0-9]{4,32}$/),
  name: z.string().min(1).max(40),
  tree: LayoutTreeSchema,
  /**
   * The preset it was made from (shared/layout-presets.ts), which is what lets it
   * be put back to it. Kept as a plain id rather than checked against this
   * build's presets: a file from a newer build is carried, not pruned.
   */
  preset: z
    .string()
    .regex(/^[a-z0-9-]{1,32}$/)
    .optional(),
})
export type SavedLayout = z.infer<typeof SavedLayoutSchema>

/**
 * Entries are validated one by one and the ones that do not hold are dropped,
 * rather than the array failing as a whole.
 *
 * The alternative loses eleven good arrangements to one bad one: JsonStore
 * quarantines a file that does not parse and starts from the default, which
 * here is an empty list. The file is still kept as `.bak`, but the user would
 * open elecdex to find every layout gone. Extra entries past the limit are
 * dropped for the same reason.
 */
const SavedLayoutList = z.array(z.unknown()).transform((list) =>
  list
    .flatMap((raw) => {
      const parsed = SavedLayoutSchema.safeParse(raw)
      return parsed.success ? [parsed.data] : []
    })
    .slice(0, MAX_SAVED_LAYOUTS),
)

export const SavedLayoutsFileSchema = z.object({
  version: z.literal(1).default(1),
  items: SavedLayoutList.default([]),
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
  /** The preset it was made from, or null for one the user saved. */
  preset: string | null
  /** Its arrangement as rectangles, for the dialog's thumbnail. */
  shape: ShapeRect[]
}

export const summarize = (
  items: readonly SavedLayout[],
  activeId: string | null,
): SavedLayoutSummary[] =>
  items.map(({ id, name, tree, preset }) => ({
    id,
    name,
    active: id === activeId,
    preset: preset ?? null,
    shape: layoutShape(tree),
  }))

/**
 * Pane state that means nothing anywhere but this machine, in this run.
 *
 * A terminal records the session it adopted, which is how a pane finds its shell
 * again after a reload. Kept in a saved layout it is worse than useless: the
 * session is gone by the time the layout is applied, it changes every time a
 * shell is created - which would rewrite the file for nothing - and it is the
 * one thing in a layout that cannot mean anything on another machine.
 */
const VOLATILE_PANE_STATE: readonly string[] = ['sessionId']

/**
 * A tree fit to be saved and carried to another machine: the arrangement, with
 * the state that belongs to this run left out.
 */
export function portableTree(tree: LayoutTree): LayoutTree {
  return { ...tree, root: portableNode(tree.root) }
}

function portableNode(node: LayoutNode): LayoutNode {
  if (node.kind === 'split') return { ...node, children: node.children.map(portableNode) }
  if (node.kind === 'tabs') return { ...node, children: node.children.map(portablePane) }
  return portablePane(node)
}

function portablePane(node: PaneNode): PaneNode {
  if (node.state === undefined) return node
  const state: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(node.state)) {
    if (!VOLATILE_PANE_STATE.includes(key)) state[key] = value
  }
  // An empty object is dropped, so a pane that carried only a session id is
  // written the same as one that never had state at all.
  const { state: _dropped, ...rest } = node
  return Object.keys(state).length > 0 ? { ...rest, state } : rest
}

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
  // Updating one made from a preset keeps it that preset's: it is the same layout.
  const kept = (item: SavedLayout): SavedLayout =>
    item.preset === undefined
      ? { ...entry, id: item.id }
      : { ...entry, id: item.id, preset: item.preset }
  if (at >= 0) return items.map((item, i) => (i === at ? kept(item) : item))
  if (items.length >= MAX_SAVED_LAYOUTS) return null
  return [...items, entry]
}

/**
 * The list after renaming one layout. Null when there is no such layout, or when
 * another already has that name - two rows with one name could not be told
 * apart, and a save under that name would then be ambiguous.
 */
export function renameSavedLayout(
  items: readonly SavedLayout[],
  id: string,
  name: string,
): SavedLayout[] | null {
  const at = items.findIndex((item) => item.id === id)
  if (at < 0) return null
  if (items.some((item, i) => i !== at && item.name === name)) return null
  return items.map((item, i) => (i === at ? { ...item, name } : item))
}

/**
 * The list after moving one layout up or down by `delta` places. Null when there
 * is no such layout or it is already at that end.
 *
 * Order is not decoration: the first nine are what the number shortcuts apply,
 * so this is how a layout is put on a key.
 */
export function moveSavedLayout(
  items: readonly SavedLayout[],
  id: string,
  delta: number,
): SavedLayout[] | null {
  const at = items.findIndex((item) => item.id === id)
  if (at < 0 || !Number.isInteger(delta) || delta === 0) return null
  const to = at + delta
  if (to < 0 || to >= items.length) return null
  const next = [...items]
  const [moved] = next.splice(at, 1)
  if (moved === undefined) return null
  next.splice(to, 0, moved)
  return next
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
