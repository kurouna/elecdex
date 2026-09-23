import { graphRows } from '@shared/git-graph'
import { describe, expect, it } from 'vitest'

/**
 * The git pane's commit graph. Histories are written child first, as
 * `git log --topo-order` prints them; each case is a shape a real repository
 * has.
 */

const c = (oid: string, ...parents: string[]) => ({ oid, parents })
/** A row as columns and lines, short enough to read in a test. */
const shape = (rows: ReturnType<typeof graphRows>) =>
  rows.map((row) => ({
    at: row.column,
    top: row.top.map((e) => `${e.from}>${e.to}`).join(' '),
    bottom: row.bottom.map((e) => `${e.from}>${e.to}`).join(' '),
  }))

describe('the commit graph', () => {
  it('draws a straight history as one line in one colour', () => {
    const rows = graphRows([c('c', 'b'), c('b', 'a'), c('a')])
    expect(shape(rows)).toEqual([
      { at: 0, top: '', bottom: '0>0' },
      { at: 0, top: '0>0', bottom: '0>0' },
      { at: 0, top: '0>0', bottom: '' },
    ])
    expect(new Set(rows.map((r) => r.color)).size).toBe(1)
    expect(rows.every((r) => r.width === 1)).toBe(true)
  })

  it('opens a lane for a branch and closes it at the merge', () => {
    // m merges f into main; f and b both come from a.
    const rows = graphRows([c('m', 'b', 'f'), c('f', 'a'), c('b', 'a'), c('a')])
    expect(shape(rows)).toEqual([
      { at: 0, top: '', bottom: '0>0 0>1' },
      { at: 1, top: '0>0 1>1', bottom: '0>0 1>1' },
      { at: 0, top: '0>0 1>1', bottom: '0>0 1>1' },
      // Both lanes wait for a: the branch's joins the main line there.
      { at: 0, top: '0>0 1>0', bottom: '' },
    ])
    expect(rows[0]?.merge).toBe(true)
    expect(rows[1]?.color).not.toBe(rows[0]?.color)
  })

  it('joins a second parent to the lane already waiting for it', () => {
    // Two tips (x on its own lane) and a merge whose second parent is x's parent.
    const rows = graphRows([c('x', 'p'), c('m', 'q', 'p'), c('q', 'r'), c('p', 'r'), c('r')])
    // m's second parent p already has x's lane: m joins it rather than opening a third.
    expect(rows[1]).toMatchObject({ column: 1, width: 2 })
    expect(rows[1]?.bottom.map((e) => `${e.from}>${e.to}`)).toContain('1>0')
    expect(Math.max(...rows.map((r) => r.width))).toBe(2)
  })

  it('gives each parent of an octopus merge a lane of its own', () => {
    const rows = graphRows([c('o', 'a', 'b', 'd'), c('d', 'z'), c('b', 'z'), c('a', 'z'), c('z')])
    expect(rows[0]?.bottom.map((e) => `${e.from}>${e.to}`)).toEqual(['0>0', '0>1', '0>2'])
    expect(rows.at(-1)?.top.map((e) => e.to)).toEqual([0, 0, 0])
  })

  it('takes a freed column again, so the graph stays narrow', () => {
    // A branch merged and gone, then another opened: it reuses column 1.
    const rows = graphRows([
      c('m2', 'm1', 'g'),
      c('g', 'm1'),
      c('m1', 'b', 'f'),
      c('f', 'b'),
      c('b'),
    ])
    expect(rows.map((r) => r.column)).toEqual([0, 1, 0, 1, 0])
    expect(Math.max(...rows.map((r) => r.width))).toBe(2)
  })

  it('runs a lane off the bottom when its parent is past the page', () => {
    // Only the newest commits were read: b's parent is not in the list.
    const rows = graphRows([c('c', 'b'), c('b', 'a')])
    expect(rows.at(-1)?.bottom).toEqual([{ from: 0, to: 0, color: rows[0]?.color }])
  })

  it('puts two unrelated tips side by side', () => {
    const rows = graphRows([c('x', 'w'), c('y', 'v'), c('w'), c('v')])
    expect(rows.map((r) => r.column)).toEqual([0, 1, 0, 1])
    expect(rows[1]?.top.map((e) => `${e.from}>${e.to}`)).toEqual(['0>0'])
  })
})
