import type {
  LayoutNode,
  LayoutTree,
  PaneNode,
  SplitDirection,
  SplitLabel,
  SplitNode,
  TabsNode,
} from './schemas/layout.js'
import { LAYOUT_VERSION } from './schemas/layout.js'

/**
 * Pure operations on a layout tree.
 *
 * Every function returns a new tree and never mutates its input, so the store
 * can treat a layout change as a value swap and these can be unit-tested
 * without a DOM. They are shared code because the same normalisation has to
 * apply whether a tree came from the UI or off disk.
 *
 * Invariants maintained by `normalize`:
 *  - a split's `sizes` has one entry per child and sums to 1
 *  - a split or tab group with one child collapses into that child
 *  - a split or tab group with no children is removed
 *  - `activeIndex` stays within range
 *  - splits do not nest directly inside a split of the same direction
 */

let counter = 0
/** Ids only need to be unique within a tree; a counter plus a prefix suffices. */
export function newId(prefix = 'n'): string {
  counter += 1
  return `${prefix}${counter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export const pane = (widget: string, extra: Partial<Omit<PaneNode, 'kind'>> = {}): PaneNode => ({
  kind: 'pane',
  id: extra.id ?? newId('p'),
  widget,
  ...(extra.props ? { props: extra.props } : {}),
  ...(extra.state ? { state: extra.state } : {}),
})

export const tabs = (children: PaneNode[], activeIndex = 0): TabsNode => ({
  kind: 'tabs',
  id: newId('t'),
  children,
  activeIndex,
})

export const split = (
  direction: 'row' | 'column',
  children: LayoutNode[],
  sizes?: number[],
  label?: SplitLabel,
): SplitNode => ({
  kind: 'split',
  id: newId('s'),
  direction,
  children,
  sizes: sizes ?? evenSizes(children.length),
  ...(label ? { label } : {}),
})

const evenSizes = (n: number): number[] => Array.from({ length: n }, () => 1 / Math.max(n, 1))

/** Scales a size list so it sums to exactly 1, falling back to even split. */
export function normalizeSizes(sizes: number[], count: number): number[] {
  const usable = sizes.slice(0, count).filter((n) => Number.isFinite(n) && n > 0)
  if (usable.length !== count) return evenSizes(count)
  const total = usable.reduce((a, b) => a + b, 0)
  if (total <= 0) return evenSizes(count)
  return usable.map((n) => n / total)
}

/**
 * Enforces the tree invariants, bottom-up.
 *
 * Returns null when the node has collapsed to nothing, which lets a parent
 * drop it in the same pass.
 */
export function normalize(node: LayoutNode): LayoutNode | null {
  if (node.kind === 'pane') return node

  if (node.kind === 'tabs') {
    const children = node.children.filter((c) => c.kind === 'pane')
    if (children.length === 0) return null
    if (children.length === 1) return children[0] as PaneNode
    const activeIndex = Math.min(Math.max(node.activeIndex, 0), children.length - 1)
    return { ...node, children, activeIndex }
  }

  // Split: normalise children first, dropping any that collapsed.
  const kept: LayoutNode[] = []
  const keptSizes: number[] = []
  node.children.forEach((child, i) => {
    const normalized = normalize(child)
    if (normalized === null) return
    // Flatten a same-direction split into this one, so repeated splitting does
    // not build a deep chain that resizes unpredictably.
    if (normalized.kind === 'split' && normalized.direction === node.direction) {
      const share = node.sizes[i] ?? 1 / node.children.length
      normalized.children.forEach((grandchild, j) => {
        kept.push(grandchild)
        keptSizes.push(share * (normalized.sizes[j] ?? 1 / normalized.children.length))
      })
      return
    }
    kept.push(normalized)
    keptSizes.push(node.sizes[i] ?? 1 / node.children.length)
  })

  if (kept.length === 0) return null
  if (kept.length === 1) return kept[0] as LayoutNode

  return { ...node, children: kept, sizes: normalizeSizes(keptSizes, kept.length) }
}

/** Normalises a whole tree, substituting `fallback` if it collapsed entirely. */
export function normalizeTree(tree: LayoutTree, fallback: LayoutNode): LayoutTree {
  const root = normalize(tree.root)
  return { version: LAYOUT_VERSION, root: root ?? fallback }
}

/** Depth-first walk over every node. */
export function walk(node: LayoutNode, visit: (n: LayoutNode) => void): void {
  visit(node)
  if (node.kind === 'split' || node.kind === 'tabs') {
    for (const child of node.children) walk(child, visit)
  }
}

export function findNode(node: LayoutNode, id: string): LayoutNode | null {
  let found: LayoutNode | null = null
  walk(node, (n) => {
    if (found === null && n.id === id) found = n
  })
  return found
}

export function collectPanes(node: LayoutNode): PaneNode[] {
  const panes: PaneNode[] = []
  walk(node, (n) => {
    if (n.kind === 'pane') panes.push(n)
  })
  return panes
}

/** Replaces the node with `id`, or drops it when `replacement` is null. */
function replace(node: LayoutNode, id: string, replacement: LayoutNode | null): LayoutNode | null {
  if (node.id === id) return replacement

  if (node.kind === 'pane') return node

  if (node.kind === 'tabs') {
    const index = node.children.findIndex((c) => c.id === id)
    if (index === -1) return node
    const children = [...node.children]
    if (replacement === null) {
      children.splice(index, 1)
    } else if (replacement.kind === 'pane') {
      children[index] = replacement
    } else {
      // A tab group can only hold panes. Splitting a tab replaces the whole
      // group with the split, keeping the other tabs intact beside it.
      const others = children.filter((_, i) => i !== index)
      const rebuilt: LayoutNode =
        others.length === 0 ? replacement : split('row', [replacement, tabs(others)])
      return rebuilt
    }
    return { ...node, children, activeIndex: Math.min(node.activeIndex, children.length - 1) }
  }

  const children: LayoutNode[] = []
  const sizes: number[] = []
  let changed = false
  node.children.forEach((child, i) => {
    const next = replace(child, id, replacement)
    if (next !== child) changed = true
    if (next === null) return
    children.push(next)
    sizes.push(node.sizes[i] ?? 1 / node.children.length)
  })
  if (!changed) return node
  return { ...node, children, sizes: normalizeSizes(sizes, children.length) }
}

/** Where a node goes relative to another: on one side of it, or as a tab with it. */
export type Placement = SplitDirection | 'tab'

/**
 * Puts `incoming` beside the node `targetId`, without normalising.
 *
 * On a side, the target is replaced by a split of the two. As a tab, the target
 * (a pane or a group) becomes a group ending with `incoming` - every tab of it,
 * when `incoming` is a group - showing the first tab added. Returns null when
 * the target is missing, or is a split and so cannot take tabs.
 */
function placeBeside(
  root: LayoutNode,
  targetId: string,
  incoming: PaneNode | TabsNode,
  placement: Placement,
): LayoutNode | null {
  const target = findNode(root, targetId)
  if (target === null) return null

  if (placement === 'tab') {
    if (target.kind === 'split') return null
    const existing = target.kind === 'tabs' ? target.children : [target]
    const added = incoming.kind === 'tabs' ? incoming.children : [incoming]
    const children = [...existing, ...added]
    const group: TabsNode =
      target.kind === 'tabs'
        ? { ...target, children, activeIndex: existing.length }
        : tabs(children, existing.length)
    return replace(root, targetId, group)
  }

  const axis = placement === 'left' || placement === 'right' ? 'row' : 'column'
  const before = placement === 'left' || placement === 'up'
  return replace(root, targetId, split(axis, before ? [incoming, target] : [target, incoming]))
}

/**
 * Splits the pane with `paneId`, putting `incoming` on the given side.
 *
 * A no-op if the pane is not found, so a stale id from the UI cannot corrupt
 * the tree.
 */
export function splitPane(
  tree: LayoutTree,
  paneId: string,
  direction: SplitDirection,
  incoming: PaneNode,
): LayoutTree {
  const target = findNode(tree.root, paneId)
  if (target === null || target.kind !== 'pane') return tree
  const replaced = placeBeside(tree.root, paneId, incoming, direction)
  return normalizeTree({ ...tree, root: replaced ?? incoming }, incoming)
}

/** Removes a node (pane or whole group) and collapses what is left. */
export function closeNode(tree: LayoutTree, id: string, fallback: LayoutNode): LayoutTree {
  if (findNode(tree.root, id) === null) return tree
  const replaced = replace(tree.root, id, null)
  return normalizeTree({ ...tree, root: replaced ?? fallback }, fallback)
}

/** Adds a pane as a new tab beside `siblingPaneId`, creating a group if needed. */
export function addTab(tree: LayoutTree, siblingPaneId: string, incoming: PaneNode): LayoutTree {
  const target = findNode(tree.root, siblingPaneId)
  if (target === null || target.kind !== 'pane') return tree
  const anchor = findTabsContaining(tree.root, siblingPaneId) ?? target
  const replaced = placeBeside(tree.root, anchor.id, incoming, 'tab')
  return normalizeTree({ ...tree, root: replaced ?? incoming }, incoming)
}

/**
 * Moves a pane, or a whole tab group, to a side of another node or into it as
 * tabs: what dragging a pane by its title does.
 *
 * A tabbed pane is a target only through its group - dropping beside a tab means
 * beside the group it is drawn in. Returns the same tree when the move would
 * change nothing or cannot be made (onto itself, into the group it is already
 * in, into something it contains), so a caller can tell whether a drop would do
 * anything. The node keeps its id and state, so a moved shell keeps its session.
 */
export function moveNode(
  tree: LayoutTree,
  nodeId: string,
  targetId: string,
  placement: Placement,
): LayoutTree {
  const source = findNode(tree.root, nodeId)
  const target = findNode(tree.root, targetId)
  if (source === null || source.kind === 'split' || target === null) return tree

  const anchor =
    target.kind === 'pane' ? (findTabsContaining(tree.root, targetId) ?? target) : target
  if (findNode(source, anchor.id) !== null) return tree
  if (placement === 'tab' && findNode(anchor, nodeId) !== null) return tree

  // Detach without normalising, so the anchor keeps its id even when this empties
  // the group or split around it; normalising the result tidies up.
  const detached = replace(tree.root, nodeId, null)
  if (detached === null) return tree
  const placed = placeBeside(detached, anchor.id, source, placement)
  return placed === null ? tree : normalizeTree({ ...tree, root: placed }, placed)
}

/** The tab group directly holding `paneId`, if any. */
export function findTabsContaining(node: LayoutNode, paneId: string): TabsNode | null {
  let found: TabsNode | null = null
  walk(node, (n) => {
    if (found === null && n.kind === 'tabs' && n.children.some((c) => c.id === paneId)) {
      found = n
    }
  })
  return found
}

/**
 * The tab `delta` places from `paneId` in its group, wrapping round, or null
 * when the pane is not in a group of two or more.
 */
export function neighbourTab(node: LayoutNode, paneId: string, delta: number): string | null {
  const group = findTabsContaining(node, paneId)
  if (group === null || group.children.length < 2) return null
  const index = group.children.findIndex((c) => c.id === paneId)
  const count = group.children.length
  return group.children[(((index + delta) % count) + count) % count]?.id ?? null
}

/** Focuses a tab within its group. A no-op for a pane that is not tabbed. */
export function focusTab(tree: LayoutTree, paneId: string): LayoutTree {
  const group = findTabsContaining(tree.root, paneId)
  if (group === null) return tree
  const index = group.children.findIndex((c) => c.id === paneId)
  if (index === -1 || index === group.activeIndex) return tree
  const replaced = replace(tree.root, group.id, { ...group, activeIndex: index })
  return replaced === null ? tree : { ...tree, root: replaced }
}

/** Sets a split's child sizes, renormalised. A no-op for a bad id or arity. */
export function resizeSplit(tree: LayoutTree, splitId: string, sizes: number[]): LayoutTree {
  const node = findNode(tree.root, splitId)
  if (node === null || node.kind !== 'split') return tree
  if (sizes.length !== node.children.length) return tree
  const replaced = replace(tree.root, splitId, {
    ...node,
    sizes: normalizeSizes(sizes, node.children.length),
  })
  return replaced === null ? tree : { ...tree, root: replaced }
}

/** Replaces a pane's `state`, e.g. to record which session it adopted. */
export function setPaneState(
  tree: LayoutTree,
  paneId: string,
  state: Record<string, unknown>,
): LayoutTree {
  const node = findNode(tree.root, paneId)
  if (node === null || node.kind !== 'pane') return tree
  const replaced = replace(tree.root, paneId, { ...node, state })
  return replaced === null ? tree : { ...tree, root: replaced }
}

/** The pane that should have focus: the active tab of its group, or the pane. */
export function visiblePanes(node: LayoutNode): PaneNode[] {
  if (node.kind === 'pane') return [node]
  if (node.kind === 'tabs') {
    const active = node.children[node.activeIndex]
    return active ? [active] : []
  }
  return node.children.flatMap(visiblePanes)
}
