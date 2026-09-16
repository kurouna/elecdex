import { z } from 'zod'

/**
 * The workspace layout, as a persisted tree.
 *
 * The original project hardcoded five screen regions (two module columns, the
 * shell, the filesystem browser and the keyboard) and a fixed five terminal
 * tabs. Here the layout is data: a tree of splits and tab groups whose leaves
 * are widgets. A terminal is a leaf like any other, which is what makes
 * tmux-style splitting, arbitrary panel placement and workspace presets fall
 * out without new plumbing. See docs/architecture.md section 5.
 */

/** Current schema version. Bump when a change needs a migration below. */
export const LAYOUT_VERSION = 1

const NodeId = z.string().min(1).max(64)

/** A leaf: exactly one widget, plus its configuration and restorable state. */
export const PaneNodeSchema = z.object({
  kind: z.literal('pane'),
  id: NodeId,
  /** Registry id. `plugin:<id>` resolves to a plugin-provided widget. */
  widget: z.string().min(1).max(128),
  /** Widget-specific configuration, validated by the widget itself. */
  props: z.record(z.string(), z.unknown()).optional(),
  /** Volatile state worth restoring, e.g. a terminal's session id. */
  state: z.record(z.string(), z.unknown()).optional(),
})
export type PaneNode = z.infer<typeof PaneNodeSchema>

/** Panes stacked as tabs, only one visible at a time. */
export const TabsNodeSchema = z.object({
  kind: z.literal('tabs'),
  id: NodeId,
  children: z.array(PaneNodeSchema),
  activeIndex: z.number().int().min(0),
})
export type TabsNode = z.infer<typeof TabsNodeSchema>

export type SplitNode = {
  kind: 'split'
  id: string
  direction: 'row' | 'column'
  children: LayoutNode[]
  /** Fractions, one per child, summing to 1. */
  sizes: number[]
}

export type LayoutNode = SplitNode | TabsNode | PaneNode

// Splits nest, so the schema has to be recursive - hence the explicit
// annotation rather than plain inference.
export const SplitNodeSchema: z.ZodType<SplitNode> = z.lazy(() =>
  z.object({
    kind: z.literal('split'),
    id: NodeId,
    direction: z.enum(['row', 'column']),
    children: z.array(LayoutNodeSchema),
    sizes: z.array(z.number().positive()),
    // Older layouts carry a column header, eDEX-UI's "PANEL ... SYSTEM". It was
    // dropped because panes move between columns, so a fixed name stopped
    // describing a column; parsing strips the key, so those files still load.
  }),
) as z.ZodType<SplitNode>

export const LayoutNodeSchema: z.ZodType<LayoutNode> = z.lazy(() =>
  z.union([SplitNodeSchema, TabsNodeSchema, PaneNodeSchema]),
)

export const LayoutTreeSchema = z.object({
  version: z.number().int().positive(),
  root: LayoutNodeSchema,
})
export type LayoutTree = z.infer<typeof LayoutTreeSchema>

/** Where a new pane goes relative to an existing one. */
export type SplitDirection = 'left' | 'right' | 'up' | 'down'

/**
 * Migrates a tree from an older version.
 *
 * Returns null when the tree is from a future version or cannot be migrated -
 * the caller then falls back to the default layout rather than guessing.
 */
export function migrateLayout(tree: LayoutTree): LayoutTree | null {
  if (tree.version === LAYOUT_VERSION) return tree
  if (tree.version > LAYOUT_VERSION) return null
  // No older versions exist yet; this switch is where they will go.
  return null
}
