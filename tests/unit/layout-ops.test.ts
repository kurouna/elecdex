import { defaultLayout, fallbackNode } from '@shared/default-layout'
import {
  addTab,
  closeNode,
  collectPanes,
  findNode,
  findTabsContaining,
  focusTab,
  moveNode,
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

  it('keeps a column label when the column survives', () => {
    const [a, b, c] = [pane('a'), pane('b'), pane('c')]
    const label = { left: 'PANEL', right: 'SYSTEM' }
    const column = split('column', [a, b, c], undefined, label)
    const t = tree(split('row', [column, pane('shell')]))
    const result = moveNode(t, c.id, a.id, 'up')
    expect(findNode(result.root, column.id)).toMatchObject({ label })
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
    if (op < 0.5) return addTab(t, target.id, pane('terminal'))
    if (op < 0.75) return closeNode(t, target.id, fallbackNode())
    if (op < 0.85) return focusTab(t, target.id)
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
