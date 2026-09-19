import { defaultLayout, fallbackNode } from '@shared/default-layout'
import {
  addTab,
  closeNode,
  collectPanes,
  findNode,
  findTabsContaining,
  focusTab,
  moveNode,
  moveTabTo,
  neighbourShell,
  neighbourTab,
  normalize,
  normalizeSizes,
  normalizeTree,
  type Placement,
  pane,
  resizeSplit,
  setPaneState,
  split,
  splitPane,
  tabs,
  visiblePanes,
  walk,
} from '@shared/layout-ops'
import {
  LAYOUT_VERSION,
  type LayoutNode,
  type LayoutTree,
  LayoutTreeSchema,
  migrateLayout,
  type PaneNode,
} from '@shared/schemas/layout'
import { describe, expect, it } from 'vitest'

const tree = (root: LayoutNode): LayoutTree => ({ version: LAYOUT_VERSION, root })

/** The panes' widgets in tree order, with each split and group spelled out. */
function shapeOf(node: LayoutNode): string {
  if (node.kind === 'pane') return node.widget
  const inner = node.children.map(shapeOf).join(' ')
  return node.kind === 'tabs' ? `tabs(${inner})` : `${node.direction}(${inner})`
}

/** Every invariant `normalize` promises, checked over a whole tree. */
function assertInvariants(root: LayoutNode): void {
  walk(root, (node) => {
    if (node.kind === 'split') {
      expect(node.children.length, `split ${node.id} arity`).toBeGreaterThanOrEqual(2)
      expect(node.sizes).toHaveLength(node.children.length)
      const total = node.sizes.reduce((a, b) => a + b, 0)
      expect(total).toBeCloseTo(1, 9)
      for (const child of node.children) {
        if (child.kind === 'split') expect(child.direction).not.toBe(node.direction)
      }
    }
    if (node.kind === 'tabs') {
      expect(node.children.length, `tabs ${node.id} arity`).toBeGreaterThanOrEqual(2)
      expect(node.activeIndex).toBeGreaterThanOrEqual(0)
      expect(node.activeIndex).toBeLessThan(node.children.length)
    }
  })
  const ids = new Set<string>()
  walk(root, (node) => {
    expect(ids.has(node.id), `duplicate id ${node.id}`).toBe(false)
    ids.add(node.id)
  })
}

describe('normalizeSizes', () => {
  it('scales to sum to 1', () => {
    expect(normalizeSizes([2, 2], 2)).toEqual([0.5, 0.5])
  })

  it.each([
    [[1], 2],
    [[0.5, 0], 2],
    [[0.5, -1], 2],
    [[Number.NaN, 1], 2],
    [[], 3],
  ])('falls back to an even split for %j with %i children', (sizes, count) => {
    const result = normalizeSizes(sizes, count)
    expect(result).toHaveLength(count)
    for (const s of result) expect(s).toBeCloseTo(1 / count, 9)
  })
})

describe('normalize', () => {
  it('collapses a one-child split into the child', () => {
    const only = pane('terminal')
    expect(normalize(split('row', [only]))).toBe(only)
  })

  it('removes an empty split and an empty tab group', () => {
    expect(normalize(split('row', []))).toBeNull()
    expect(normalize(tabs([]))).toBeNull()
  })

  it('collapses a one-tab group into the pane', () => {
    const only = pane('terminal')
    expect(normalize(tabs([only]))).toBe(only)
  })

  it('clamps an out-of-range active tab', () => {
    const node = normalize({ ...tabs([pane('a'), pane('b')]), activeIndex: 9 })
    expect(node?.kind === 'tabs' && node.activeIndex).toBe(1)
  })

  it('flattens a same-direction split and preserves proportions', () => {
    const a = pane('a')
    const b = pane('b')
    const c = pane('c')
    const nested = split('row', [a, split('row', [b, c], [0.5, 0.5])], [0.5, 0.5])
    const result = normalize(nested)
    expect(result?.kind).toBe('split')
    if (result?.kind !== 'split') return
    expect(result.children.map((n) => n.id)).toEqual([a.id, b.id, c.id])
    expect(result.sizes[0]).toBeCloseTo(0.5, 9)
    expect(result.sizes[1]).toBeCloseTo(0.25, 9)
    expect(result.sizes[2]).toBeCloseTo(0.25, 9)
  })

  it('keeps a perpendicular nested split', () => {
    const result = normalize(split('row', [pane('a'), split('column', [pane('b'), pane('c')])]))
    expect(result?.kind === 'split' && result.children[1]?.kind).toBe('split')
  })

  it('does not mutate its input', () => {
    const input = split('row', [pane('a'), split('row', [pane('b'), pane('c')])], [3, 1])
    const snapshot = structuredClone(input)
    normalize(input)
    expect(input).toEqual(snapshot)
  })
})

describe('splitPane', () => {
  it.each([
    ['right', 'row', 0],
    ['left', 'row', 1],
    ['down', 'column', 0],
    ['up', 'column', 1],
  ] as const)('%s creates a %s split with the original at index %i', (dir, axis, originalIndex) => {
    const original = pane('terminal')
    const incoming = pane('cpu')
    const result = splitPane(tree(original), original.id, dir, incoming)
    expect(result.root.kind).toBe('split')
    if (result.root.kind !== 'split') return
    expect(result.root.direction).toBe(axis)
    expect(result.root.children[originalIndex]?.id).toBe(original.id)
    assertInvariants(result.root)
  })

  it('splitting repeatedly in one direction stays flat', () => {
    const first = pane('terminal')
    let t = tree(first)
    let target = first.id
    for (let i = 0; i < 5; i++) {
      const next = pane('terminal')
      t = splitPane(t, target, 'right', next)
      target = next.id
    }
    expect(t.root.kind === 'split' && t.root.children.length).toBe(6)
    assertInvariants(t.root)
  })

  it('is a no-op for an unknown pane', () => {
    const t = tree(pane('terminal'))
    expect(splitPane(t, 'nope', 'right', pane('cpu'))).toBe(t)
  })

  it('is a no-op when asked to split a non-pane', () => {
    const s = split('row', [pane('a'), pane('b')])
    const t = tree(s)
    expect(splitPane(t, s.id, 'right', pane('c'))).toBe(t)
  })

  it.each([
    ['right', 'row', 0],
    ['left', 'row', 1],
    ['down', 'column', 0],
    ['up', 'column', 1],
  ] as const)('splits a tabbed pane beside its whole group, %s', (dir, axis, groupIndex) => {
    // Regression: the tab was pulled out of its group, and always into a row.
    const a = pane('a')
    const b = pane('b')
    const c = pane('c')
    const group = tabs([a, b, c], 1)
    const incoming = pane('d')
    const result = splitPane(tree(group), b.id, dir, incoming)
    expect(result.root).toMatchObject({ kind: 'split', direction: axis })
    if (result.root.kind !== 'split') return
    expect(result.root.children[groupIndex]).toEqual(group)
    assertInvariants(result.root)
  })
})

describe('moveNode', () => {
  it.each([
    ['left', 'row(c a b)'],
    ['right', 'row(a c b)'],
    ['up', 'row(column(c a) b)'],
    ['down', 'row(column(a c) b)'],
    ['tab', 'row(tabs(a c) b)'],
  ] as const)('puts a pane %s of another', (placement, expected) => {
    const a = pane('a')
    const c = pane('c')
    const t = tree(split('column', [split('row', [a, pane('b')]), c], [0.7, 0.3]))
    const result = moveNode(t, c.id, a.id, placement)
    expect(shapeOf(result.root)).toBe(expected)
    assertInvariants(result.root)
  })

  it('keeps the moved pane itself, with its id and state', () => {
    const shell = pane('terminal', { state: { sessionId: 's1' } })
    const other = pane('cpu')
    const result = moveNode(tree(split('row', [shell, other])), shell.id, other.id, 'down')
    expect(findNode(result.root, shell.id)).toEqual(shell)
  })

  it('shows the moved pane when it joins a group', () => {
    const a = pane('a')
    const b = pane('b')
    const c = pane('c')
    const group = tabs([a, b], 0)
    const result = moveNode(tree(split('row', [group, c])), c.id, group.id, 'tab')
    expect(result.root).toMatchObject({ kind: 'tabs', id: group.id, activeIndex: 2 })
  })

  it('drops beside a tab as beside its group', () => {
    const a = pane('a')
    const b = pane('b')
    const c = pane('c')
    const t = tree(split('row', [tabs([a, b], 1), c]))
    expect(shapeOf(moveNode(t, c.id, b.id, 'up').root)).toBe('column(c tabs(a b))')
    expect(shapeOf(moveNode(t, c.id, b.id, 'tab').root)).toBe('tabs(a b c)')
  })

  it('takes a tab out of its group to a side of that group', () => {
    const a = pane('a')
    const b = pane('b')
    const c = pane('c')
    const group = tabs([a, b, c], 2)
    const result = moveNode(tree(group), c.id, group.id, 'right')
    expect(shapeOf(result.root)).toBe('row(tabs(a b) c)')
    assertInvariants(result.root)
  })

  it('collapses a group of two when one tab leaves it', () => {
    const a = pane('a')
    const b = pane('b')
    const group = tabs([a, b], 0)
    const result = moveNode(tree(group), b.id, group.id, 'left')
    expect(shapeOf(result.root)).toBe('row(b a)')
    assertInvariants(result.root)
  })

  it('moves a whole group, and merges it into another as tabs', () => {
    const group = tabs([pane('a'), pane('b')])
    const c = pane('c')
    const d = pane('d')
    const t = tree(split('row', [group, split('column', [c, d])]))
    expect(shapeOf(moveNode(t, group.id, d.id, 'down').root)).toBe('column(c d tabs(a b))')
    const merged = moveNode(t, group.id, c.id, 'tab')
    expect(shapeOf(merged.root)).toBe('column(tabs(c a b) d)')
    assertInvariants(merged.root)
  })

  it('returns the same tree for a move that changes nothing or cannot be made', () => {
    const a = pane('a')
    const b = pane('b')
    const c = pane('c')
    const group = tabs([a, b])
    const t = tree(split('row', [group, c]))
    expect(moveNode(t, c.id, c.id, 'left')).toBe(t)
    expect(moveNode(t, a.id, b.id, 'tab')).toBe(t)
    expect(moveNode(t, group.id, a.id, 'right')).toBe(t)
    expect(moveNode(t, t.root.id, c.id, 'left')).toBe(t)
    expect(moveNode(t, c.id, t.root.id, 'tab')).toBe(t)
    expect(moveNode(t, 'nope', c.id, 'left')).toBe(t)
    expect(moveNode(t, c.id, 'nope', 'left')).toBe(t)
  })
})

describe('moveNode, details', () => {
  it('does not mutate the tree it is given', () => {
    const a = pane('a')
    const b = pane('b')
    const c = pane('c')
    const t = tree(split('row', [tabs([a, b], 1), c], [0.6, 0.4]))
    const before = structuredClone(t)
    moveNode(t, b.id, c.id, 'down')
    moveNode(t, c.id, a.id, 'tab')
    expect(t).toEqual(before)
  })

  it('keeps the proportions of the panes it does not touch', () => {
    const [a, b, c, d] = [pane('a'), pane('b'), pane('c'), pane('d')]
    const t = tree(split('row', [a, b, c, d], [0.4, 0.3, 0.2, 0.1]))
    const result = moveNode(t, d.id, a.id, 'tab')
    if (result.root.kind !== 'split') throw new Error('expected a split')
    const [ga, gb, gc] = result.root.sizes as [number, number, number]
    expect(ga / gb).toBeCloseTo(0.4 / 0.3, 9)
    expect(gb / gc).toBeCloseTo(0.3 / 0.2, 9)
  })

  it('gives the moved pane half of the pane it lands beside', () => {
    const [a, b, c] = [pane('a'), pane('b'), pane('c')]
    const t = tree(split('row', [a, b, c], [0.5, 0.25, 0.25]))
    const result = moveNode(t, c.id, a.id, 'right')
    if (result.root.kind !== 'split') throw new Error('expected a split')
    expect(result.root.children.map((n) => n.id)).toEqual([a.id, c.id, b.id])
    const [sa, sc, sb] = result.root.sizes as [number, number, number]
    expect(sa).toBeCloseTo(sc, 9)
    expect((sa + sc) / sb).toBeCloseTo(0.5 / 0.25, 9)
  })

  it('keeps the shown tab of the group a tab leaves', () => {
    const [a, b, c] = [pane('a'), pane('b'), pane('c')]
    const group = tabs([a, b, c], 2)
    const other = pane('d')
    const result = moveNode(tree(split('row', [group, other])), a.id, other.id, 'down')
    const left = findNode(result.root, group.id)
    if (left?.kind !== 'tabs') throw new Error('expected the group to remain')
    expect(left.children[left.activeIndex]?.id).toBe(c.id)
  })

  it('moves a pane out of a nested split and collapses what it leaves', () => {
    const [a, b, x] = [pane('a'), pane('b'), pane('x')]
    const t = tree(split('column', [x, split('row', [a, b])]))
    const result = moveNode(t, a.id, b.id, 'up')
    // row(b) collapses, and column(a b) flattens into the outer column.
    expect(shapeOf(result.root)).toBe('column(x a b)')
    assertInvariants(result.root)
  })

  it('moves a pane across the tree and back to the same shape', () => {
    const [a, b, c, d] = [pane('a'), pane('b'), pane('c'), pane('d')]
    const t = tree(split('row', [split('column', [a, b]), split('column', [c, d])]))
    const there = moveNode(t, b.id, d.id, 'down')
    expect(shapeOf(there.root)).toBe('row(a column(c d b))')
    const back = moveNode(there, b.id, a.id, 'down')
    expect(shapeOf(back.root)).toBe(shapeOf(t.root))
  })

  it('merges a group into a pane as tabs, showing the first tab that came with it', () => {
    const [a, b, c] = [pane('a'), pane('b'), pane('c')]
    const group = tabs([a, b], 1)
    const result = moveNode(tree(split('row', [group, c])), group.id, c.id, 'tab')
    expect(result.root).toMatchObject({ kind: 'tabs', activeIndex: 1 })
    expect(shapeOf(result.root)).toBe('tabs(c a b)')
  })

  it('refuses a tab placement onto a split, which cannot hold tabs', () => {
    const [a, b, c] = [pane('a'), pane('b'), pane('c')]
    const inner = split('column', [a, b])
    const t = tree(split('row', [inner, c]))
    expect(moveNode(t, c.id, inner.id, 'tab')).toBe(t)
  })
})

describe('moveTabTo', () => {
  /** tabs(a b c) with fresh panes, and their ids in order. */
  const trio = () => {
    const children = ['a', 'b', 'c'].map((w) => pane(w))
    return { group: tabs(children, 0), ids: children.map((p) => p.id) }
  }

  it.each([
    [0, 2, 'tabs(b a c)'],
    [0, 3, 'tabs(b c a)'],
    [1, 0, 'tabs(b a c)'],
    [1, 3, 'tabs(a c b)'],
    [2, 0, 'tabs(c a b)'],
    [2, 1, 'tabs(a c b)'],
  ])('reorders the tab at %i to index %i', (from, index, expected) => {
    const { group, ids } = trio()
    const result = moveTabTo(tree(group), ids[from] as string, group.id, index)
    expect(shapeOf(result.root)).toBe(expected)
    assertInvariants(result.root)
  })

  it('shows the tab it moved', () => {
    const { group, ids } = trio()
    const result = moveTabTo(tree(group), ids[0] as string, group.id, 3)
    if (result.root.kind !== 'tabs') throw new Error('expected the group to remain')
    expect(result.root.children[result.root.activeIndex]?.id).toBe(ids[0])
  })

  it.each([
    ['its own place', 0, 0],
    ['the gap just after itself, which is the same gap', 0, 1],
    ['its own place, last', 2, 2],
    ['past the end, from last place', 2, 3],
  ])('returns the same tree for a drop in %s', (_, from, index) => {
    const { group, ids } = trio()
    const t = tree(group)
    expect(moveTabTo(t, ids[from] as string, group.id, index)).toBe(t)
  })

  it('clamps an index outside the group', () => {
    const { group, ids } = trio()
    expect(shapeOf(moveTabTo(tree(group), ids[2] as string, group.id, -5).root)).toBe('tabs(c a b)')
    expect(shapeOf(moveTabTo(tree(group), ids[0] as string, group.id, 99).root)).toBe('tabs(b c a)')
  })

  it('keeps the moved pane itself, with its id and state', () => {
    const shell = pane('terminal', { state: { sessionId: 's1' } })
    const group = tabs([pane('a'), shell], 0)
    const result = moveTabTo(tree(group), shell.id, group.id, 0)
    expect(findNode(result.root, shell.id)).toEqual(shell)
  })

  it('inserts a tab from another group at the index, not at the end', () => {
    const [a, b, c, d] = [pane('a'), pane('b'), pane('c'), pane('d')]
    const from = tabs([a, b], 0)
    const to = tabs([c, d], 0)
    const result = moveTabTo(tree(split('row', [from, to])), a.id, to.id, 1)
    expect(shapeOf(result.root)).toBe('row(b tabs(c a d))')
    assertInvariants(result.root)
  })

  it('collapses the group a tab leaves when only one is left', () => {
    const [a, b, c] = [pane('a'), pane('b'), pane('c')]
    const from = tabs([a, b], 0)
    const result = moveTabTo(tree(split('row', [from, c])), b.id, c.id, 0)
    expect(shapeOf(result.root)).toBe('row(a tabs(b c))')
    assertInvariants(result.root)
  })

  it('keeps the shown tab of the group a tab leaves', () => {
    const [a, b, c] = [pane('a'), pane('b'), pane('c')]
    const from = tabs([a, b, c], 2)
    const other = pane('d')
    const result = moveTabTo(tree(split('row', [from, other])), a.id, other.id, 0)
    const left = findNode(result.root, from.id)
    if (left?.kind !== 'tabs') throw new Error('expected the group to remain')
    expect(left.children[left.activeIndex]?.id).toBe(c.id)
  })

  it('inserts a whole group as one block, showing the first tab that came with it', () => {
    const [a, b, c, d] = [pane('a'), pane('b'), pane('c'), pane('d')]
    const from = tabs([a, b], 1)
    const to = tabs([c, d], 0)
    const result = moveTabTo(tree(split('row', [from, to])), from.id, to.id, 1)
    expect(shapeOf(result.root)).toBe('tabs(c a b d)')
    expect(result.root).toMatchObject({ kind: 'tabs', activeIndex: 1 })
    assertInvariants(result.root)
  })

  it('makes a group of two out of a lone pane, on either side of its one tab', () => {
    const [a, b] = [pane('a'), pane('b')]
    const t = tree(split('row', [a, b]))
    expect(shapeOf(moveTabTo(t, a.id, b.id, 0).root)).toBe('tabs(a b)')
    expect(shapeOf(moveTabTo(t, a.id, b.id, 1).root)).toBe('tabs(b a)')
    expect(moveTabTo(t, a.id, b.id, 1).root).toMatchObject({ activeIndex: 1 })
  })

  it('takes a tab as a target to mean its group', () => {
    const [a, b, c] = [pane('a'), pane('b'), pane('c')]
    const group = tabs([a, b], 0)
    const t = tree(split('row', [group, c]))
    expect(shapeOf(moveTabTo(t, c.id, b.id, 0).root)).toBe('tabs(c a b)')
  })

  it('puts a tab at the end exactly as a tab placement does', () => {
    const [a, b, c] = [pane('a'), pane('b'), pane('c')]
    const group = tabs([a, b], 0)
    const t = tree(split('row', [group, c]))
    expect(moveTabTo(t, c.id, group.id, 2)).toEqual(moveNode(t, c.id, group.id, 'tab'))
  })

  it('returns the same tree for a move that cannot be made', () => {
    const [a, b, c, d] = [pane('a'), pane('b'), pane('c'), pane('d')]
    const group = tabs([a, b], 0)
    const inner = split('column', [c, d])
    const t = tree(split('row', [group, inner]))
    // A group into itself, by its own id or through one of its tabs.
    expect(moveTabTo(t, group.id, group.id, 0)).toBe(t)
    expect(moveTabTo(t, group.id, a.id, 0)).toBe(t)
    // A pane onto itself.
    expect(moveTabTo(t, c.id, c.id, 0)).toBe(t)
    // A split cannot be moved, and cannot hold tabs.
    expect(moveTabTo(t, inner.id, group.id, 0)).toBe(t)
    expect(moveTabTo(t, a.id, inner.id, 0)).toBe(t)
    expect(moveTabTo(t, a.id, t.root.id, 0)).toBe(t)
    // Ids that are not in the tree.
    expect(moveTabTo(t, 'nope', group.id, 0)).toBe(t)
    expect(moveTabTo(t, c.id, 'nope', 0)).toBe(t)
  })

  it('does not mutate the tree it is given', () => {
    const [a, b, c] = [pane('a'), pane('b'), pane('c')]
    const group = tabs([a, b], 1)
    const t = tree(split('row', [group, c], [0.6, 0.4]))
    const before = structuredClone(t)
    moveTabTo(t, a.id, group.id, 2)
    moveTabTo(t, c.id, group.id, 1)
    expect(t).toEqual(before)
  })

  it('swaps the two tabs of the smallest group there can be', () => {
    const [a, b] = [pane('a'), pane('b')]
    const group = tabs([a, b], 0)
    expect(shapeOf(moveTabTo(tree(group), a.id, group.id, 2).root)).toBe('tabs(b a)')
    expect(shapeOf(moveTabTo(tree(group), b.id, group.id, 0).root)).toBe('tabs(b a)')
  })

  it.each([
    [1, 3, 'tabs(a c b d e)'],
    [3, 1, 'tabs(a d b c e)'],
    [1, 4, 'tabs(a c d b e)'],
  ])('moves tab %i to gap %i in a group of five', (from, index, expected) => {
    const children = ['a', 'b', 'c', 'd', 'e'].map((w) => pane(w))
    const group = tabs(children, 0)
    const moving = children[from] as PaneNode
    expect(shapeOf(moveTabTo(tree(group), moving.id, group.id, index).root)).toBe(expected)
  })

  it('brings a whole group onto a lone pane, on either side of its one tab', () => {
    const [a, b, c] = [pane('a'), pane('b'), pane('c')]
    const group = tabs([a, b], 1)
    const t = tree(split('row', [group, c]))
    expect(shapeOf(moveTabTo(t, group.id, c.id, 0).root)).toBe('tabs(a b c)')
    expect(shapeOf(moveTabTo(t, group.id, c.id, 1).root)).toBe('tabs(c a b)')
    // Either way it shows the first tab that came with the group.
    expect(moveTabTo(t, group.id, c.id, 0).root).toMatchObject({ activeIndex: 0 })
    expect(moveTabTo(t, group.id, c.id, 1).root).toMatchObject({ activeIndex: 1 })
  })

  it('leaves the group a tab came from standing when two are left in it', () => {
    const [a, b, c, d] = [pane('a'), pane('b'), pane('c'), pane('d')]
    const from = tabs([a, b, c], 0)
    const to = tabs([d, pane('e')], 0)
    const result = moveTabTo(tree(split('row', [from, to])), b.id, to.id, 1)
    expect(shapeOf(result.root)).toBe('row(tabs(a c) tabs(d b e))')
    assertInvariants(result.root)
  })

  it('comes back to the same shape when a tab is sent to the end and back', () => {
    const children = ['a', 'b', 'c', 'd'].map((w) => pane(w))
    const group = tabs(children, 0)
    const t = tree(group)
    const moving = children[1] as PaneNode
    const there = moveTabTo(t, moving.id, group.id, 4)
    expect(shapeOf(there.root)).toBe('tabs(a c d b)')
    const back = moveTabTo(there, moving.id, group.id, 1)
    expect(shapeOf(back.root)).toBe(shapeOf(t.root))
    if (back.root.kind !== 'tabs') throw new Error('expected the group to remain')
    expect(back.root.children).toEqual(children)
    // The order is back; the tab that made the trip is the one being shown.
    expect(back.root.activeIndex).toBe(1)
  })

  it("keeps a pane's props as well as its state", () => {
    const kept = pane('terminal', { props: { shell: 'fish' }, state: { sessionId: 's1' } })
    const group = tabs([pane('a'), kept, pane('b')], 0)
    const result = moveTabTo(tree(group), kept.id, group.id, 0)
    expect(findNode(result.root, kept.id)).toEqual(kept)
  })

  it('collapses and flattens what a tab leaves behind, deep in the tree', () => {
    const [a, b, c, d] = [pane('a'), pane('b'), pane('c'), pane('d')]
    const from = tabs([a, b], 0)
    // column(d row(c column(tabs(a b)))) - taking a tab out empties the branch.
    const t = tree(split('column', [d, split('row', [c, from])]))
    const result = moveTabTo(t, a.id, d.id, 0)
    expect(shapeOf(result.root)).toBe('column(tabs(a d) row(c b))')
    assertInvariants(result.root)
  })

  it('keeps every tab of the group it joins, wherever the new one lands', () => {
    const children = ['a', 'b', 'c'].map((w) => pane(w))
    const to = tabs(children, 2)
    const incoming = pane('x')
    const t = tree(split('row', [to, incoming]))
    for (const index of [0, 1, 2, 3]) {
      const result = moveTabTo(t, incoming.id, to.id, index)
      const group = findNode(result.root, to.id)
      if (group?.kind !== 'tabs') throw new Error('expected the group to remain')
      expect(group.children.map((c) => c.widget)).toEqual([
        ...['a', 'b', 'c'].slice(0, index),
        'x',
        ...['a', 'b', 'c'].slice(index),
      ])
    }
  })

  it('keeps the proportions of the panes it does not touch', () => {
    const [a, b, c, d] = [pane('a'), pane('b'), pane('c'), pane('d')]
    const group = tabs([a, b], 0)
    const t = tree(split('row', [group, c, d], [0.5, 0.3, 0.2]))
    const result = moveTabTo(t, d.id, group.id, 0)
    if (result.root.kind !== 'split') throw new Error('expected a split')
    const [sg, sc] = result.root.sizes as [number, number]
    expect(sg / sc).toBeCloseTo(0.5 / 0.3, 9)
  })
})

describe('moveNode over generated layouts', () => {
  /** A small seeded generator (mulberry32), so a failure reproduces exactly. */
  function random(seed: number): () => number {
    let state = seed
    return () => {
      state = (state + 0x6d2b79f5) | 0
      let t = Math.imul(state ^ (state >>> 15), 1 | state)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }

  /** A random layout; the top level is always a split, so there is something to move. */
  function generate(
    rand: () => number,
    depth: number,
    direction: 'row' | 'column',
    top = true,
  ): LayoutNode {
    const roll = top ? 1 : rand()
    const leaf = () => pane(`w${Math.floor(rand() * 1000)}`, { state: { n: rand() } })
    if (depth === 0 || roll < 0.3) return leaf()
    if (roll < 0.5) return tabs(Array.from({ length: 2 + Math.floor(rand() * 3) }, leaf), 0)
    const next = direction === 'row' ? 'column' : 'row'
    const count = 2 + Math.floor(rand() * 3)
    const children = Array.from({ length: count }, () => generate(rand, depth - 1, next, false))
    return split(
      direction,
      children,
      children.map(() => 0.1 + rand()),
    )
  }

  const placements = ['left', 'right', 'up', 'down', 'tab'] as const

  /** Panes and groups: what the UI can drag, and what it can drop on. */
  const movable = (root: LayoutNode): LayoutNode[] => {
    const nodes: LayoutNode[] = []
    walk(root, (n) => {
      if (n.kind !== 'split') nodes.push(n)
    })
    return nodes
  }

  const paneIds = (node: LayoutNode): string[] => collectPanes(node).map((p) => p.id)

  /** The child of `parent` that holds pane `id`, and its index. */
  const childHolding = (parent: LayoutNode, id: string) => {
    if (parent.kind !== 'split') return null
    const index = parent.children.findIndex((c) => findNode(c, id) !== null)
    return index === -1 ? null : { index, child: parent.children[index] as LayoutNode }
  }

  /** The nearest split above node `id` whose direction is `axis`, and the child of it holding `id`. */
  function splitAbove(root: LayoutNode, id: string, axis: 'row' | 'column') {
    let found: { split: LayoutNode; index: number } | null = null
    walk(root, (n) => {
      if (n.kind !== 'split' || n.direction !== axis) return
      const holding = childHolding(n, id)
      if (holding === null) return
      // Deepest wins: walk visits parents first, so keep overwriting.
      found = { split: n, index: holding.index }
    })
    return found as { split: LayoutNode & { kind: 'split' }; index: number } | null
  }

  /** Whatever the move: a valid tree, the input untouched, and no pane lost, duplicated or altered. */
  function expectIntact(t: LayoutTree, before: LayoutTree, result: LayoutTree): void {
    expect(t, 'input untouched').toEqual(before)
    assertInvariants(result.root)
    expect(paneIds(result.root).sort()).toEqual(paneIds(t.root).sort())
    for (const p of collectPanes(t.root)) expect(findNode(result.root, p.id)).toEqual(p)
  }

  /**
   * Every group the move did not add to keeps showing the tab it showed, unless
   * that tab is the one that moved away.
   */
  function expectShownTabsKept(
    t: LayoutTree,
    result: LayoutTree,
    moving: string[],
    joined: string | null,
  ): void {
    walk(t.root, (n) => {
      if (n.kind !== 'tabs' || n.id === joined) return
      const shown = n.children[n.activeIndex]?.id as string
      if (moving.includes(shown)) return
      const after = findNode(result.root, n.id)
      if (after?.kind !== 'tabs') return
      expect(after.children[after.activeIndex]?.id, `group ${n.id} shows the same tab`).toBe(shown)
    })
  }

  /** As tabs: one group holding the target's panes, then the moved ones, showing the first moved. */
  function expectTabbed(result: LayoutTree, moving: string[], staying: string[]): void {
    const group = findTabsContaining(result.root, moving[0] as string)
    if (group === null) throw new Error('moved pane is not in a group')
    expect(group.children.map((c) => c.id)).toEqual([...staying, ...moving])
    expect(group.activeIndex).toBe(staying.length)
  }

  /** Beside: moved and target panes are neighbours in a split of the placement's axis, in its order. */
  function expectBeside(
    result: LayoutTree,
    moving: string[],
    staying: string[],
    placement: Exclude<Placement, 'tab'>,
  ): void {
    const axis = placement === 'left' || placement === 'right' ? 'row' : 'column'
    const above = splitAbove(result.root, moving[0] as string, axis)
    if (above === null) throw new Error(`no ${axis} split holds the moved pane`)
    const movedChild = above.split.children[above.index] as LayoutNode
    expect(paneIds(movedChild).sort()).toEqual([...moving].sort())
    const offset = placement === 'left' || placement === 'up' ? 1 : -1
    const neighbour = above.split.children[above.index + offset]
    if (neighbour === undefined) throw new Error('moved pane has no neighbour on that side')
    expect(paneIds(neighbour).sort()).toEqual([...staying].sort())
  }

  function checkMove(t: LayoutTree, source: LayoutNode, target: LayoutNode, placement: Placement) {
    const before = structuredClone(t)
    const result = moveNode(t, source.id, target.id, placement)
    expectIntact(t, before, result)

    const anchor = findTabsContaining(t.root, target.id) ?? target
    const moving = paneIds(source)
    const staying = paneIds(anchor).filter((id) => !moving.includes(id))
    const impossible =
      findNode(source, anchor.id) !== null ||
      (placement === 'tab' && findNode(anchor, source.id) !== null)
    if (impossible) {
      expect(result).toBe(t)
      return
    }
    expect(result).not.toBe(t)
    expectShownTabsKept(t, result, moving, placement === 'tab' ? anchor.id : null)
    if (placement === 'tab') expectTabbed(result, moving, staying)
    else expectBeside(result, moving, staying, placement)
  }

  /** As tabs at a gap: the target's panes with the moved ones spliced in, showing the first moved. */
  function expectTabbedAt(
    result: LayoutTree,
    moving: string[],
    staying: string[],
    landing: number,
  ): void {
    const group = findTabsContaining(result.root, moving[0] as string)
    if (group === null) throw new Error('moved pane is not in a group')
    expect(group.children.map((c) => c.id)).toEqual([
      ...staying.slice(0, landing),
      ...moving,
      ...staying.slice(landing),
    ])
    expect(group.activeIndex).toBe(landing)
  }

  function checkMoveTab(t: LayoutTree, source: LayoutNode, target: LayoutNode, index: number) {
    const before = structuredClone(t)
    const result = moveTabTo(t, source.id, target.id, index)
    expectIntact(t, before, result)

    const anchor = findTabsContaining(t.root, target.id) ?? target
    const moving = paneIds(source)
    const staying = paneIds(anchor).filter((id) => !moving.includes(id))
    // Where the moved tabs end up among the ones staying, worked out by counting
    // rather than by the op's own arithmetic: how many stay before that gap.
    const children = anchor.kind === 'tabs' ? anchor.children.map((c) => c.id) : [anchor.id]
    const at = Math.min(Math.max(index, 0), children.length)
    const landing = children.slice(0, at).filter((id) => !moving.includes(id)).length
    // A tab already sitting there has that many staying tabs before it too.
    const sitting = children.indexOf(source.id)

    const impossible = anchor.id === source.id || findNode(source, anchor.id) !== null
    if (impossible || (sitting !== -1 && landing === sitting)) {
      expect(result).toBe(t)
      return
    }
    expect(result).not.toBe(t)
    expectShownTabsKept(t, result, moving, anchor.id)
    expectTabbedAt(result, moving, staying, landing)
  }

  it.each(Array.from({ length: 40 }, (_, i) => i + 1))(
    'seed %i: every tab move keeps the tree valid and lands in the gap asked for',
    (seed) => {
      const rand = random(seed)
      let t = normalizeTree(tree(generate(rand, 3, 'row')), pane('fallback'))
      let moved = 0
      for (let step = 0; step < 50; step++) {
        const nodes = movable(t.root)
        const source = nodes[Math.floor(rand() * nodes.length)] as LayoutNode
        const target = nodes[Math.floor(rand() * nodes.length)] as LayoutNode
        const anchor = findTabsContaining(t.root, target.id) ?? target
        const span = anchor.kind === 'tabs' ? anchor.children.length : 1
        // One either side of the range as well, so clamping is exercised too.
        const index = Math.floor(rand() * (span + 3)) - 1
        checkMoveTab(t, source, target, index)
        const next = moveTabTo(t, source.id, target.id, index)
        if (next !== t) moved += 1
        t = next
      }
      // Most attempts land on a pane the source cannot join; enough must be real
      // moves that the checks above are proving something.
      expect(moved).toBeGreaterThan(8)
    },
  )

  it.each(Array.from({ length: 40 }, (_, i) => i + 1))(
    'seed %i: every move keeps the tree valid and lands where asked',
    (seed) => {
      const rand = random(seed)
      let t = normalizeTree(tree(generate(rand, 3, 'row')), pane('fallback'))
      let moved = 0
      for (let step = 0; step < 25; step++) {
        const nodes = movable(t.root)
        const source = nodes[Math.floor(rand() * nodes.length)] as LayoutNode
        const target = nodes[Math.floor(rand() * nodes.length)] as LayoutNode
        const placement = placements[Math.floor(rand() * placements.length)] as Placement
        checkMove(t, source, target, placement)
        // Carry on from the result, so later moves start from layouts moves made.
        const next = moveNode(t, source.id, target.id, placement)
        if (next !== t) moved += 1
        t = next
      }
      // Most attempts must be real moves, or the checks above prove little.
      expect(moved).toBeGreaterThan(10)
    },
  )
})

describe('closeNode, tabs', () => {
  it.each([
    // [closed index, active before, active after] - the same tab stays shown.
    [0, 1, 0],
    [0, 2, 1],
    [2, 1, 1],
    [1, 1, 1],
    [2, 2, 1],
  ])('closing tab %i while %i is shown shows index %i', (closed, before, after) => {
    // Regression: closing a tab before the shown one switched to the tab after it.
    const panes = [pane('a'), pane('b'), pane('c')]
    const group = tabs(panes, before)
    const result = closeNode(tree(group), (panes[closed] as PaneNode).id, fallbackNode())
    expect(result.root).toMatchObject({ kind: 'tabs', activeIndex: after })
  })

  it('keeps the shown tab when closing a tab before it leaves the rest', () => {
    const [a, b, c, d] = [pane('a'), pane('b'), pane('c'), pane('d')]
    const result = closeNode(tree(tabs([a, b, c, d], 2)), a.id, fallbackNode())
    if (result.root.kind !== 'tabs') throw new Error('expected tabs')
    expect(result.root.children[result.root.activeIndex]?.id).toBe(c.id)
  })
})

describe('closeNode', () => {
  it('collapses the parent split when one of two panes closes', () => {
    const a = pane('a')
    const b = pane('b')
    const result = closeNode(tree(split('row', [a, b])), b.id, fallbackNode())
    expect(result.root).toEqual(a)
  })

  it('redistributes size among the survivors', () => {
    const a = pane('a')
    const b = pane('b')
    const c = pane('c')
    const result = closeNode(tree(split('row', [a, b, c], [0.5, 0.25, 0.25])), c.id, fallbackNode())
    if (result.root.kind !== 'split') throw new Error('expected split')
    expect(result.root.sizes[0]).toBeCloseTo(2 / 3, 9)
    expect(result.root.sizes[1]).toBeCloseTo(1 / 3, 9)
  })

  it('substitutes the fallback when the last pane closes', () => {
    const only = pane('cpu')
    const fallback = pane('terminal')
    const result = closeNode(tree(only), only.id, fallback)
    expect(result.root).toBe(fallback)
  })

  it('closing a tab keeps the group when two or more remain', () => {
    const a = pane('a')
    const b = pane('b')
    const c = pane('c')
    const result = closeNode(tree(tabs([a, b, c], 2)), c.id, fallbackNode())
    expect(result.root.kind).toBe('tabs')
    if (result.root.kind !== 'tabs') return
    expect(result.root.children.map((p) => p.id)).toEqual([a.id, b.id])
    expect(result.root.activeIndex).toBe(1)
  })

  it('removes a whole subtree when a split id is closed', () => {
    const keep = pane('keep')
    const inner = split('column', [pane('x'), pane('y')])
    const result = closeNode(tree(split('row', [keep, inner])), inner.id, fallbackNode())
    expect(result.root).toEqual(keep)
  })

  it('is a no-op for an unknown id', () => {
    const t = tree(pane('a'))
    expect(closeNode(t, 'nope', fallbackNode())).toBe(t)
  })
})

describe('tabs', () => {
  it('addTab turns a lone pane into a two-tab group focused on the new tab', () => {
    const a = pane('terminal')
    const b = pane('terminal')
    const result = addTab(tree(a), a.id, b)
    expect(result.root.kind).toBe('tabs')
    if (result.root.kind !== 'tabs') return
    expect(result.root.children.map((p) => p.id)).toEqual([a.id, b.id])
    expect(result.root.activeIndex).toBe(1)
  })

  it('addTab appends to an existing group', () => {
    const a = pane('a')
    const b = pane('b')
    const c = pane('c')
    const result = addTab(tree(tabs([a, b])), a.id, c)
    if (result.root.kind !== 'tabs') throw new Error('expected tabs')
    expect(result.root.children).toHaveLength(3)
    expect(result.root.activeIndex).toBe(2)
  })

  it('addTab works on a pane nested inside splits', () => {
    const target = pane('terminal')
    const incoming = pane('terminal')
    const root = split('row', [pane('cpu'), split('column', [target, pane('mem')])])
    const result = addTab(tree(root), target.id, incoming)
    expect(findTabsContaining(result.root, incoming.id)).not.toBeNull()
    assertInvariants(result.root)
  })

  it('focusTab activates the chosen tab and returns the same tree when already active', () => {
    const a = pane('a')
    const b = pane('b')
    const t = tree(tabs([a, b], 0))
    const focused = focusTab(t, b.id)
    expect(focused.root.kind === 'tabs' && focused.root.activeIndex).toBe(1)
    expect(focusTab(focused, b.id)).toBe(focused)
  })

  it('neighbourTab steps through a group, wrapping at both ends', () => {
    const a = pane('a')
    const b = pane('b')
    const c = pane('c')
    const root = split('row', [tabs([a, b, c], 0), pane('d')])
    expect(neighbourTab(root, a.id, 1)).toBe(b.id)
    expect(neighbourTab(root, c.id, 1)).toBe(a.id)
    expect(neighbourTab(root, a.id, -1)).toBe(c.id)
  })

  it('neighbourTab is null for a pane outside a group of two or more', () => {
    const lone = pane('a')
    expect(neighbourTab(split('row', [lone, pane('b')]), lone.id, 1)).toBeNull()
    const only = pane('a')
    expect(neighbourTab(tabs([only]), only.id, 1)).toBeNull()
  })

  describe('neighbourShell', () => {
    const isShell = (widget: string) => widget === 'terminal'

    it('steps through shell panes and groups of shell tabs in tree order, wrapping round', () => {
      const left = pane('terminal')
      const t1 = pane('terminal')
      const t2 = pane('terminal')
      const right = pane('terminal')
      const root = split('row', [left, split('column', [pane('cpu'), tabs([t1, t2], 1)]), right])
      // A group is one stop, entered at its selected tab.
      expect(neighbourShell(root, left.id, 1, isShell)).toBe(t2.id)
      expect(neighbourShell(root, t1.id, 1, isShell)).toBe(right.id)
      expect(neighbourShell(root, t2.id, 1, isShell)).toBe(right.id)
      expect(neighbourShell(root, right.id, 1, isShell)).toBe(left.id)
      expect(neighbourShell(root, left.id, -1, isShell)).toBe(right.id)
      expect(neighbourShell(root, right.id, -1, isShell)).toBe(t2.id)
    })

    it('enters a mixed group at its first shell when a shell is not selected', () => {
      const lone = pane('terminal')
      const shell = pane('terminal')
      const root = split('row', [lone, tabs([pane('globe'), shell], 0)])
      expect(neighbourShell(root, lone.id, 1, isShell)).toBe(shell.id)
    })

    it('is null from a pane that is not a shell, or with no other shell to go to', () => {
      const shell = pane('terminal')
      const cpu = pane('cpu')
      const other = pane('terminal')
      const root = split('row', [shell, cpu, other])
      expect(neighbourShell(root, cpu.id, 1, isShell)).toBeNull()
      // Tabs of one group are for Ctrl+Shift+Arrow, not this.
      const a = pane('terminal')
      const b = pane('terminal')
      expect(neighbourShell(split('row', [tabs([a, b]), pane('cpu')]), a.id, 1, isShell)).toBeNull()
      expect(neighbourShell(split('row', [shell, pane('cpu')]), shell.id, 1, isShell)).toBeNull()
      expect(neighbourShell(root, 'missing', 1, isShell)).toBeNull()
    })
  })

  it('visiblePanes returns only the active tab of each group', () => {
    const a = pane('a')
    const b = pane('b')
    const c = pane('c')
    const root = split('row', [tabs([a, b], 1), c])
    expect(visiblePanes(root).map((p) => p.id)).toEqual([b.id, c.id])
  })
})

describe('resizeSplit and setPaneState', () => {
  it('renormalises sizes', () => {
    const s = split('row', [pane('a'), pane('b')])
    const result = resizeSplit(tree(s), s.id, [3, 1])
    if (result.root.kind !== 'split') throw new Error('expected split')
    expect(result.root.sizes).toEqual([0.75, 0.25])
  })

  it('ignores a size list of the wrong arity', () => {
    const s = split('row', [pane('a'), pane('b')])
    const t = tree(s)
    expect(resizeSplit(t, s.id, [1, 1, 1])).toBe(t)
  })

  it('records pane state without touching siblings', () => {
    const a = pane('terminal')
    const b = pane('terminal')
    const t = tree(split('row', [a, b]))
    const result = setPaneState(t, a.id, { sessionId: 'abc' })
    const updated = findNode(result.root, a.id)
    expect(updated?.kind === 'pane' && updated.state).toEqual({ sessionId: 'abc' })
    expect(findNode(result.root, b.id)).toBe(b)
  })
})

describe('schema and default layout', () => {
  it('the default layout is valid, normalised and recreates the original arrangement', () => {
    const layout = defaultLayout()
    expect(LayoutTreeSchema.safeParse(layout).success).toBe(true)
    assertInvariants(layout.root)
    const widgets = collectPanes(layout.root).map((p) => p.widget)
    expect(widgets).toContain('terminal')
    expect(widgets).toEqual(expect.arrayContaining(['cpu', 'memory', 'netstat', 'globe']))
  })

  it('round-trips through JSON', () => {
    const layout = defaultLayout()
    const parsed = LayoutTreeSchema.safeParse(JSON.parse(JSON.stringify(layout)))
    expect(parsed.success && parsed.data).toEqual(layout)
  })

  it('loads a layout saved with column headers, dropping them', () => {
    const column = (id: string, label: { left: string; right: string }) => ({
      kind: 'split',
      id,
      direction: 'column',
      children: [
        { kind: 'pane', id: `${id}-a`, widget: 'cpu' },
        { kind: 'pane', id: `${id}-b`, widget: 'memory' },
      ],
      sizes: [0.5, 0.5],
      label,
    })
    const saved = {
      version: 1,
      root: {
        kind: 'split',
        id: 'root',
        direction: 'row',
        children: [
          column('left', { left: 'panel', right: 'system' }),
          { kind: 'pane', id: 'shell', widget: 'terminal' },
          column('right', { left: 'panel', right: 'world' }),
        ],
        sizes: [0.2, 0.6, 0.2],
      },
    }
    const parsed = LayoutTreeSchema.safeParse(saved)
    expect(parsed.success).toBe(true)
    if (!parsed.success) return
    expect(JSON.stringify(parsed.data)).not.toContain('label')
    expect(shapeOf(parsed.data.root)).toBe('row(column(cpu memory) terminal column(cpu memory))')
    walk(parsed.data.root, (node) => expect(node).not.toHaveProperty('label'))
  })

  it('draws no column headers in the default layout', () => {
    walk(defaultLayout().root, (node) => expect(node).not.toHaveProperty('label'))
  })

  it.each([
    [{ version: 1, root: { kind: 'window', id: 'x' } }],
    [{ version: 1, root: { kind: 'pane', id: '', widget: 'terminal' } }],
    [
      {
        version: 1,
        root: { kind: 'split', id: 's', direction: 'diagonal', children: [], sizes: [] },
      },
    ],
    [{ version: 'one', root: { kind: 'pane', id: 'p', widget: 'terminal' } }],
    [{ root: { kind: 'pane', id: 'p', widget: 'terminal' } }],
  ])('rejects malformed input %j', (input) => {
    expect(LayoutTreeSchema.safeParse(input).success).toBe(false)
  })

  it('refuses a layout from a newer version instead of guessing', () => {
    expect(migrateLayout({ version: LAYOUT_VERSION + 1, root: pane('terminal') })).toBeNull()
  })

  it('passes the current version through unchanged', () => {
    const layout = defaultLayout()
    expect(migrateLayout(layout)).toBe(layout)
  })
})

describe('random operation sequences keep the invariants', () => {
  // A tiny seeded PRNG so a failure is reproducible.
  function rng(seed: number): () => number {
    let s = seed
    return () => {
      s = (s * 1664525 + 1013904223) % 2 ** 32
      return s / 2 ** 32
    }
  }

  const directions = ['left', 'right', 'up', 'down'] as const

  /** Resizes a randomly chosen split to random proportions. */
  function randomResize(t: LayoutTree, rand: () => number): LayoutTree {
    const splits: string[] = []
    walk(t.root, (n) => {
      if (n.kind === 'split') splits.push(n.id)
    })
    const id = splits[Math.floor(rand() * splits.length)]
    const node = id === undefined ? null : findNode(t.root, id)
    if (id === undefined || node?.kind !== 'split') return t
    return resizeSplit(
      t,
      id,
      node.children.map(() => rand() + 0.01),
    )
  }

  /** Drags a pane into some pane's strip, at any gap in it. */
  function randomTabMove(
    t: LayoutTree,
    rand: () => number,
    nodeId: string,
    panes: PaneNode[],
  ): LayoutTree {
    const other = panes[Math.floor(rand() * panes.length)]
    if (!other) return t
    const group = findTabsContaining(t.root, other.id)
    const span = group === null ? 1 : group.children.length
    return moveTabTo(t, nodeId, other.id, Math.floor(rand() * (span + 1)))
  }

  /** Applies one randomly chosen operation to a randomly chosen pane. */
  function randomStep(t: LayoutTree, rand: () => number): LayoutTree {
    const panes = collectPanes(t.root)
    const target = panes[Math.floor(rand() * panes.length)]
    if (!target) return t

    const op = rand()
    if (op < 0.3) {
      const direction = directions[Math.floor(rand() * directions.length)] ?? 'right'
      return splitPane(t, target.id, direction, pane('terminal'))
    }
    if (op < 0.45) return addTab(t, target.id, pane('terminal'))
    if (op < 0.65) return closeNode(t, target.id, fallbackNode())
    if (op < 0.75) return focusTab(t, target.id)
    if (op < 0.9) return randomTabMove(t, rand, target.id, panes)
    return randomResize(t, rand)
  }

  it.each([1, 7, 42, 1234, 99999])('seed %i', (seed) => {
    const rand = rng(seed)
    let t = defaultLayout()

    for (let step = 0; step < 200; step++) {
      t = randomStep(t, rand)
      assertInvariants(t.root)
      expect(LayoutTreeSchema.safeParse(t).success).toBe(true)
      expect(collectPanes(t.root).length).toBeGreaterThanOrEqual(1)
    }
  })
})
