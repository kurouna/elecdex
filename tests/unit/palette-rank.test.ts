import {
  armVerb,
  nameParts,
  nextKind,
  PALETTE_KINDS,
  type PaletteItem,
  type PaletteKind,
  RECENT_MAX,
  rankItems,
  remember,
} from '@shared/palette'
import { describe, expect, it } from 'vitest'

/**
 * The action palette's ordering (docs/palette.md section 2): with nothing typed, the recent
 * rows and then a heading per kind; with words typed, every kind ranked together.
 */

const item = (key: string, kind: PaletteKind, label: string, extra: Partial<PaletteItem> = {}) =>
  ({
    key,
    kind,
    label,
    detail: '',
    words: [],
    chord: null,
    note: null,
    state: { kind: 'ready' },
    arm: false,
    ...extra,
  }) satisfies PaletteItem

const ITEMS: PaletteItem[] = [
  item('action:pane.splitRight', 'action', 'Split right'),
  item('action:tab.next', 'action', 'Next tab', {
    state: { kind: 'off', reason: 'not in a tab group' },
  }),
  item('action:pane.newTab', 'action', 'New tab'),
  item('layout:a', 'layout', 'Work'),
  item('preset:dev', 'preset', 'dev', { words: ['preset'] }),
  item('theme:amber', 'theme', 'Amber', { detail: 'orange phosphor', words: ['theme', 'amber'] }),
  item('theme:tron', 'theme', 'Tron', { state: { kind: 'current' }, words: ['theme', 'tron'] }),
  item('pane:clock', 'pane', 'Clock'),
  item('settings:keyboard', 'settings', 'Settings: keyboard', { words: ['settings'] }),
]

const keys = (rows: ReturnType<typeof rankItems>) => rows.map((row) => row.item.key)

describe('rankItems with nothing typed', () => {
  it('puts the recent rows first, then each kind under its heading, in the sources’ order', () => {
    const rows = rankItems(ITEMS, '', 'all', ['theme:amber', 'action:pane.newTab'])
    expect(keys(rows)).toEqual([
      'theme:amber',
      'action:pane.newTab',
      'action:pane.splitRight',
      'action:tab.next',
      'action:pane.newTab',
      'layout:a',
      'preset:dev',
      'theme:amber',
      'theme:tron',
      'pane:clock',
      'settings:keyboard',
    ])
    expect(rows.map((row) => row.heading ?? null)).toEqual([
      'recent',
      null,
      'action',
      null,
      null,
      'layout',
      'preset',
      'theme',
      null,
      'pane',
      'settings',
    ])
  })

  it('leaves out a recent key that is no longer offered, and has no recent heading without one', () => {
    const rows = rankItems(ITEMS, '', 'all', ['layout:gone'])
    expect(rows[0]?.heading).toBe('action')
    expect(keys(rows)).not.toContain('layout:gone')
  })

  it('shows one kind alone, without the recent rows or headings', () => {
    const rows = rankItems(ITEMS, '', 'theme', ['action:pane.newTab'])
    expect(keys(rows)).toEqual(['theme:amber', 'theme:tron'])
    expect(rows.every((row) => row.heading === undefined)).toBe(true)
  })

  it('takes a query of spaces alone as nothing typed', () => {
    expect(rankItems(ITEMS, '   ', 'all', [])).toEqual(rankItems(ITEMS, '', 'all', []))
  })

  it('covers every kind in its order', () => {
    const headings = rankItems(ITEMS, '', 'all', [])
      .map((row) => row.heading)
      .filter((heading) => heading !== undefined)
    expect(headings).toEqual([...PALETTE_KINDS])
  })
})

describe('rankItems with words typed', () => {
  it('matches a word as letters in order in the name, ignoring case, with no headings', () => {
    const rows = rankItems(ITEMS, 'SPRT', 'all', [])
    expect(keys(rows)).toEqual(['action:pane.splitRight'])
    expect(rows[0]?.heading).toBeUndefined()
    // S, P of Split and R, T of right.
    expect(rows[0]?.spans).toEqual([0, 1, 6, 10])
  })

  it('needs every word to match', () => {
    expect(keys(rankItems(ITEMS, 'tab new', 'all', []))).toEqual(['action:pane.newTab'])
    expect(rankItems(ITEMS, 'tab zzz', 'all', [])).toEqual([])
  })

  it('ranks a word starting a word, and a run of letters, above letters spread out', () => {
    const items = [
      item('a', 'action', 'Lots of tabs'),
      item('b', 'action', 'Tablet'),
      item('c', 'action', 'Stable'),
    ]
    expect(keys(rankItems(items, 'tab', 'all', []))).toEqual(['b', 'a', 'c'])
    const spread = [item('x', 'action', 'True-ambient blend'), item('y', 'action', 'Tab')]
    expect(keys(rankItems(spread, 'tab', 'all', []))).toEqual(['y', 'x'])
  })

  it('finds the words and the detail behind a row only as they are written', () => {
    expect(keys(rankItems(ITEMS, 'phosphor', 'all', []))).toEqual(['theme:amber'])
    expect(keys(rankItems(ITEMS, 'theme', 'all', []))).toEqual(['theme:amber', 'theme:tron'])
    // Letters spread through a row's words do not count: in the mock "tab" found themes
    // through "t…a…b" in their words.
    expect(keys(rankItems(ITEMS, 'tmh', 'all', []))).toEqual([])
    expect(rankItems(ITEMS, 'phosphor', 'all', [])[0]?.spans).toEqual([])
  })

  it('ranks a match in the name above one in the words behind it', () => {
    const items = [
      item('w', 'action', 'Open settings', { words: ['amber'] }),
      item('n', 'theme', 'Amber'),
    ]
    expect(keys(rankItems(items, 'amber', 'all', []))).toEqual(['n', 'w'])
  })

  it('keeps a row that cannot run now, below every one that can', () => {
    const rows = keys(rankItems(ITEMS, 'tab', 'all', []))
    expect(rows).toEqual(['action:pane.newTab', 'action:tab.next'])
  })

  it('keeps the sources’ order between equal matches', () => {
    const items = [item('1', 'action', 'Go one'), item('2', 'action', 'Go two')]
    expect(keys(rankItems(items, 'go', 'all', []))).toEqual(['1', '2'])
    expect(keys(rankItems([...items].reverse(), 'go', 'all', []))).toEqual(['2', '1'])
  })

  it('keeps to the kind chosen', () => {
    expect(keys(rankItems(ITEMS, 't', 'pane', []))).toEqual([])
    expect(keys(rankItems(ITEMS, 'cl', 'pane', []))).toEqual(['pane:clock'])
  })

  it('takes every prefix of a name typed letter by letter', () => {
    const name = 'Bring the pane forward'
    const items = [item('z', 'action', name)]
    for (let i = 1; i <= name.length; i++) {
      expect(keys(rankItems(items, name.slice(0, i), 'all', [])), name.slice(0, i)).toEqual(['z'])
    }
  })
})

describe('remember', () => {
  it('puts the key first, once, and keeps at most a few', () => {
    expect(remember([], 'a')).toEqual(['a'])
    expect(remember(['a', 'b'], 'b')).toEqual(['b', 'a'])
    const full = ['1', '2', '3', '4', '5']
    expect(full).toHaveLength(RECENT_MAX)
    expect(remember(full, '6')).toEqual(['6', '1', '2', '3', '4'])
  })
})

describe('nextKind', () => {
  it('goes round all and every kind, either way', () => {
    const order = ['all', ...PALETTE_KINDS]
    let kind: PaletteKind | 'all' = 'all'
    const seen: string[] = []
    for (let i = 0; i < order.length; i++) {
      kind = nextKind(kind, 1)
      seen.push(kind)
    }
    expect(seen).toEqual([...order.slice(1), 'all'])
    expect(nextKind('all', -1)).toBe('settings')
    expect(nextKind('action', -1)).toBe('all')
  })
})

describe('nameParts', () => {
  it('cuts a name into runs of plain and matched letters', () => {
    expect(nameParts('Split right', [0, 1, 6, 10])).toEqual([
      { text: 'Sp', hit: true },
      { text: 'lit ', hit: false },
      { text: 'r', hit: true },
      { text: 'igh', hit: false },
      { text: 't', hit: true },
    ])
    expect(nameParts('Clock', [])).toEqual([{ text: 'Clock', hit: false }])
    expect(nameParts('', [])).toEqual([])
  })
})

describe('armVerb', () => {
  it('names what the second Enter does', () => {
    expect(armVerb('app.quit')).toBe('quit')
    expect(armVerb('shell.clear')).toBe('clear')
    expect(armVerb('layout.reset')).toBe('reset')
    expect(armVerb('pane.close')).toBe('run')
  })
})
