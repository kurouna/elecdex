import { defaultLayoutNode, upgradeDefaultHeights } from '@shared/default-layout'
import { normalize, pane, split } from '@shared/layout-ops'
import type { LayoutNode } from '@shared/schemas/layout'
import { describe, expect, it } from 'vitest'

const OLD = [0.04, 0.075, 0.19, 0.12, 0.116, 0.239, 0.055, 0.165]
const LEFT = ['clock', 'sysinfo', 'cpu', 'memory', 'disk', 'toplist', 'netstat', 'throughput']

function leftColumn(root: LayoutNode) {
  if (root.kind !== 'split') throw new Error('expected a split')
  const column = root.children[0]
  if (column?.kind !== 'split') throw new Error('expected the left column')
  return column
}

/** The default layout as v0.0.4 saved it: the same tree with the old heights. */
function savedByOldVersion(): LayoutNode {
  const root = defaultLayoutNode()
  if (root.kind !== 'split') throw new Error('expected a split')
  const column = leftColumn(root)
  return { ...root, children: [{ ...column, sizes: [...OLD] }, ...root.children.slice(1)] }
}

describe('upgradeDefaultHeights', () => {
  it('gives an untouched old left column the current heights', () => {
    const saved = savedByOldVersion()
    const upgraded = upgradeDefaultHeights(saved)
    expect(leftColumn(upgraded).sizes).toEqual(leftColumn(defaultLayoutNode()).sizes)
    // The system pane got taller; nothing else in the tree moved.
    expect(leftColumn(upgraded).sizes[1]).toBeGreaterThan(OLD[1] ?? 1)
    if (upgraded.kind !== 'split' || saved.kind !== 'split') throw new Error('expected a split')
    expect(upgraded.sizes).toEqual(saved.sizes)
    expect(upgraded.children.slice(1)).toEqual(saved.children.slice(1))
  })

  it('recognises the old heights after they were normalised and saved', () => {
    const saved = normalize(savedByOldVersion())
    if (!saved) throw new Error('normalised to nothing')
    const upgraded = upgradeDefaultHeights(saved)
    expect(leftColumn(upgraded).sizes).toEqual(leftColumn(defaultLayoutNode()).sizes)
  })

  it('keeps pane ids and pane state', () => {
    const saved = savedByOldVersion()
    const before = leftColumn(saved)
    const after = leftColumn(upgradeDefaultHeights(saved))
    expect(after.children).toEqual(before.children)
  })

  it('leaves a column the user resized alone', () => {
    const root = savedByOldVersion()
    if (root.kind !== 'split') throw new Error('expected a split')
    const resized = [0.04, 0.08, 0.185, 0.12, 0.116, 0.239, 0.055, 0.165]
    const custom: LayoutNode = {
      ...root,
      children: [{ ...leftColumn(root), sizes: resized }, ...root.children.slice(1)],
    }
    expect(upgradeDefaultHeights(custom)).toBe(custom)
  })

  it('leaves a column with other panes or another order alone', () => {
    const reordered = split(
      'column',
      [...LEFT].reverse().map((w) => pane(w)),
      [...OLD],
    )
    expect(upgradeDefaultHeights(reordered)).toBe(reordered)
    const fewer = split(
      'column',
      LEFT.slice(1).map((w) => pane(w)),
      OLD.slice(1),
    )
    expect(upgradeDefaultHeights(fewer)).toBe(fewer)
    const row = split(
      'row',
      LEFT.map((w) => pane(w)),
      [...OLD],
    )
    expect(upgradeDefaultHeights(row)).toBe(row)
  })

  it('finds the column wherever it was moved in the tree', () => {
    const column = split(
      'column',
      LEFT.map((w) => pane(w)),
      [...OLD],
    )
    const root = split('row', [pane('globe'), split('column', [pane('terminal'), column])])
    const upgraded = upgradeDefaultHeights(root)
    expect(upgraded).not.toBe(root)
    const found = JSON.stringify(upgraded)
    expect(found).toContain(JSON.stringify(leftColumn(defaultLayoutNode()).sizes))
  })

  it('does nothing to the current default layout or a lone pane', () => {
    const current = defaultLayoutNode()
    expect(upgradeDefaultHeights(current)).toBe(current)
    const lone = pane('terminal')
    expect(upgradeDefaultHeights(lone)).toBe(lone)
  })
})
