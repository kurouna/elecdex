import { defaultLayout, fallbackNode } from '@shared/default-layout'
import {
  addTab,
  closeNode,
  collectPanes,
  findNode,
  findTabsContaining,
  focusTab,
  neighbourTab,
  normalize,
  normalizeSizes,
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
} from '@shared/schemas/layout'
import { describe, expect, it } from 'vitest'

const tree = (root: LayoutNode): LayoutTree => ({ version: LAYOUT_VERSION, root })

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

  it('splitting a tabbed pane keeps the other tabs', () => {
    const a = pane('a')
    const b = pane('b')
    const c = pane('c')
    const group = tabs([a, b, c], 1)
    const incoming = pane('d')
    const result = splitPane(tree(group), b.id, 'right', incoming)
    const ids = collectPanes(result.root).map((p) => p.id)
    expect(ids).toEqual(expect.arrayContaining([a.id, b.id, c.id, incoming.id]))
    expect(ids).toHaveLength(4)
    assertInvariants(result.root)
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
