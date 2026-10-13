import { emptyState, type GitFile, type GitState } from '@shared/git'
import { describe, expect, it } from 'vitest'
import {
  fileListRows,
  isNews,
  menuPlace,
  opensInTree,
} from '../../src/renderer/widgets/git/rows.js'

/** The git pane's row keys, its menu's place and its lamp, found wanting in review. */

const file = (path: string, area: GitFile['area'], code: GitFile['code'] = 'M'): GitFile => ({
  path,
  area,
  code,
  added: 1,
  deleted: 0,
  binary: false,
})

const keys = (files: GitFile[]) =>
  fileListRows(files, false)
    .filter((row) => row.kind === 'file')
    .map((row) => row.key)

describe('the rows of the file list', () => {
  it('keeps the working tree row when a file staged and edited again is committed', () => {
    // Before, the unstaged row's key changed at the commit, so the row that stayed folded out.
    const both = keys([file('a.ts', 'staged'), file('a.ts', 'unstaged')])
    const after = keys([file('a.ts', 'unstaged')])
    expect(both).toEqual(['file:a.ts:staged', 'file:a.ts'])
    expect(after).toEqual(['file:a.ts'])
    // Staging the whole file moves its one row.
    expect(keys([file('a.ts', 'staged')])).toEqual(['file:a.ts'])
  })

  it('counts each list in its head', () => {
    const rows = fileListRows(
      [file('a', 'unstaged'), file('b', 'unstaged'), file('c', 'staged')],
      false,
    )
    expect(rows.filter((row) => row.kind === 'head').map((row) => [row.key, row.count])).toEqual([
      ['head:staged', 1],
      ['head:unstaged', 2],
    ])
  })

  it("does not open a commit's deleted file, which the working tree no longer has", () => {
    expect(opensInTree(file('gone.ts', 'staged', 'D'), true)).toBe(false)
    expect(opensInTree(file('gone.ts', 'unstaged', 'D'), false)).toBe(true)
    expect(opensInTree(file('a.ts', 'staged', 'M'), true)).toBe(true)
  })
})

describe('the context menu', () => {
  const size = { width: 100, height: 80 }
  const room = { width: 300, top: 200, height: 200 }

  it('goes at the click when it fits', () => {
    expect(menuPlace({ x: 10, y: 220 }, size, room)).toEqual({ x: 10, y: 220 })
  })

  it('opens above the click near the bottom, and left of it near the right edge', () => {
    // Before, a menu on the last rows was cut off by the list.
    expect(menuPlace({ x: 280, y: 380 }, size, room)).toEqual({ x: 200, y: 300 })
  })

  it('stays inside a list too short for it either way', () => {
    expect(menuPlace({ x: 0, y: 250 }, { width: 100, height: 150 }, room)).toEqual({ x: 0, y: 250 })
    expect(
      menuPlace({ x: 0, y: 260 }, { width: 100, height: 150 }, { ...room, height: 160 }),
    ).toEqual({ x: 0, y: 210 })
  })
})

describe('the receive lamp', () => {
  const read = (readAt: number, head = 'main'): GitState => ({
    ...emptyState('0123456789abcdef'),
    readAt,
    branch: { head, oid: 'a'.repeat(40), upstream: null, ahead: 0, behind: 0 },
  })

  it('lights for a new reading', () => {
    expect(isNews(read(1), read(2, 'other'), false)).toBe(true)
    // A file written again with the same counts is still news while the pane is open.
    expect(isNews(read(1), read(2), false)).toBe(true)
  })

  it('stays dark for the first reading, and for what a return brings back unchanged', () => {
    // Found in review: it lit on every return from a hidden tab.
    expect(isNews(null, read(1), false)).toBe(false)
    expect(isNews(read(0), read(1), false)).toBe(false)
    expect(isNews(read(5), read(5), true)).toBe(false)
    expect(isNews(read(5), read(6), true)).toBe(false)
    expect(isNews(read(5), read(6, 'other'), true)).toBe(true)
  })
})
