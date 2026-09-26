import type {
  LayoutNode,
  LayoutTree,
  PaneNode,
  SplitDirection,
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
): SplitNode => ({
  kind: 'split',
  id: newId('s'),
  direction,
  children,
  sizes: sizes ?? evenSizes(children.length),
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
      // Keep showing the same tab: removing one before it moves it down by one.
      // Removing the shown tab itself shows the one that took its place.
      const activeIndex =
        index < node.activeIndex
          ? node.activeIndex - 1
          : Math.min(node.activeIndex, children.length - 1)
      return { ...node, children, activeIndex }
    }
    // A group holds only panes. Everything that puts a split or a group beside a
    // tab anchors on the group instead (splitPane, addTab, moveNode), so this
    // refuses rather than build a tree the schema does not allow.
    if (replacement.kind !== 'pane') return node
    children[index] = replacement
    return { ...node, children }
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
 * Puts `incoming` into the group `target` is, or becomes, at the gap `index`
 * among the tabs already there, without normalising.
 *
 * A pane target becomes a group of the two; a group incoming brings all of its
 * tabs, as one block. The group shows the first tab that arrived, wherever it
 * landed. `index` is clamped, so a caller may hand over a gap from a strip it
 * measured before the tree changed.
 */
function placeAsTab(
  root: LayoutNode,
  target: PaneNode | TabsNode,
  incoming: PaneNode | TabsNode,
  index: number,
): LayoutNode | null {
  const existing = target.kind === 'tabs' ? target.children : [target]
  const at = Math.min(Math.max(index, 0), existing.length)
  const added = incoming.kind === 'tabs' ? incoming.children : [incoming]
  const children = [...existing.slice(0, at), ...added, ...existing.slice(at)]
  const group: TabsNode =
    target.kind === 'tabs' ? { ...target, children, activeIndex: at } : tabs(children, at)
  return replace(root, target.id, group)
}

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
    const end = target.kind === 'tabs' ? target.children.length : 1
    return placeAsTab(root, target, incoming, end)
  }

  const axis = placement === 'left' || placement === 'right' ? 'row' : 'column'
  const before = placement === 'left' || placement === 'up'
  return replace(root, targetId, split(axis, before ? [incoming, target] : [target, incoming]))
}

/**
 * Splits the pane with `paneId`, putting `incoming` on the given side. A tabbed
 * pane is split through its group, so the new pane sits beside the whole group
 * and every tab stays where it was.
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
  const anchor = findTabsContaining(tree.root, paneId) ?? target
  const replaced = placeBeside(tree.root, anchor.id, incoming, direction)
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

/**
 * Moves a pane, or a whole group's tabs, into the strip of another pane or group
 * at the gap `index`: what dragging a tab along a strip does. A pane target
 * becomes a group of the two, and a tab as a target means the group it is drawn
 * in, whose strip the gaps belong to.
 *
 * `index` counts the gaps in that strip as it looks now - before the tab being
 * moved has left it - so a tab moving within its own group lands in the gap the
 * pointer is over rather than one place short of it. Out-of-range indices are
 * clamped. Returns the same tree when the move would change nothing or cannot be
 * made, so a caller can tell whether a drop would do anything. The node keeps its
 * id and state, so a moved shell keeps its session.
 */
export function moveTabTo(
  tree: LayoutTree,
  nodeId: string,
  targetId: string,
  index: number,
): LayoutTree {
  const source = findNode(tree.root, nodeId)
  const target = findNode(tree.root, targetId)
  if (source === null || source.kind === 'split' || target === null) return tree

  const anchor =
    target.kind === 'pane' ? (findTabsContaining(tree.root, targetId) ?? target) : target
  // A split holds no tabs, and nothing goes inside itself or inside what it holds.
  if (anchor.kind === 'split' || anchor.id === nodeId) return tree
  if (findNode(source, anchor.id) !== null) return tree

  const existing = anchor.kind === 'tabs' ? anchor.children : [anchor]
  const at = Math.min(Math.max(index, 0), existing.length)
  // Taking the tab out shifts every gap after it down by one, which is also why
  // the two gaps either side of a tab both leave it exactly where it was.
  const from = existing.findIndex((child) => child.id === nodeId)
  const landing = from !== -1 && from < at ? at - 1 : at
  if (from === landing) return tree

  // Detach without normalising, so the anchor keeps its id even when this empties
  // the group or split around it; normalising the result tidies up.
  const detached = replace(tree.root, nodeId, null)
  if (detached === null) return tree
  const kept = findNode(detached, anchor.id)
  if (kept === null || kept.kind === 'split') return tree
  const placed = placeAsTab(detached, kept, source, landing)
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

/**
 * The shell to focus `delta` shells on from the one `paneId` is in, wrapping
 * round, or null when `paneId` is not a shell or there is no other to go to.
 *
 * A shell here is where a shell is shown: a shell pane on its own, or a tab group
 * holding one - its selected tab when that is a shell, its first shell otherwise.
 * Shells are taken in tree order, which runs left to right and top to bottom.
 */
export function neighbourShell(
  node: LayoutNode,
  paneId: string,
  delta: number,
  isShell: (widget: string) => boolean,
): string | null {
  const focused = findNode(node, paneId)
  if (focused === null || focused.kind !== 'pane' || !isShell(focused.widget)) return null
  const stops: Array<{ panes: string[]; target: string }> = []
  const visit = (n: LayoutNode): void => {
    if (n.kind === 'split') {
      n.children.forEach(visit)
      return
    }
    const panes = n.kind === 'tabs' ? n.children : [n]
    const selected = n.kind === 'tabs' ? n.children[n.activeIndex] : n
    const target =
      selected && isShell(selected.widget) ? selected : panes.find((p) => isShell(p.widget))
    if (target) stops.push({ panes: panes.map((p) => p.id), target: target.id })
  }
  visit(node)
  const index = stops.findIndex((stop) => stop.panes.includes(paneId))
  if (index === -1 || stops.length < 2) return null
  const count = stops.length
  return stops[(((index + delta) % count) + count) % count]?.target ?? null
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

/**
 * Merges `patch` into a pane's state as the tree holds it now; a key set to
 * undefined is removed. A widget that spread the state it was given and added
 * its change lost an earlier change made in the same moment, since the state
 * comes back to it as a prop only on the next render.
 */
export function patchPaneState(
  tree: LayoutTree,
  paneId: string,
  patch: Record<string, unknown>,
): LayoutTree {
  const node = findNode(tree.root, paneId)
  if (node === null || node.kind !== 'pane') return tree
  const state = mergePaneState(node.state, patch)
  // Nothing new: the same tree, so no save and no new round for what reads it.
  return state === null ? tree : setPaneState(tree, paneId, state)
}

/**
 * A pane's state with `patch` merged in, a key set to undefined removed; null
 * when nothing changes, so the caller can keep what it has. Values are compared
 * by identity: a new object is a change, even if it holds the same values.
 */
export function mergePaneState(
  before: Record<string, unknown> | undefined,
  patch: Record<string, unknown>,
): Record<string, unknown> | null {
  const state: Record<string, unknown> = { ...before }
  let changed = false
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) {
      if (key in state) changed = true
      delete state[key]
    } else {
      if (!Object.is(state[key], value)) changed = true
      state[key] = value
    }
  }
  return changed ? state : null
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
