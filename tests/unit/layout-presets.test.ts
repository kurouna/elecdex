import { readFileSync } from 'node:fs'
import { clusterTier, showCores } from '@shared/cluster'
import { describe, expect, it } from 'vitest'
import {
  defaultLayoutNode,
  LEFT_COLUMN,
  SYSTEM_COLUMN_WIDTH,
} from '../../src/shared/default-layout.js'
import { collectPanes, normalize } from '../../src/shared/layout-ops.js'
import {
  freeLayoutName,
  LAYOUT_PRESET_IDS,
  LAYOUT_PRESETS,
  type LayoutPreset,
  layoutFromPreset,
  presetBadge,
  presetById,
  presetCards,
  presetTree,
  seededLayouts,
  WITH_SYSTEM_COLUMN,
  withPresetLayout,
  withPresetRestored,
} from '../../src/shared/layout-presets.js'
import { layoutShape } from '../../src/shared/layout-shape.js'
import {
  KEYED_LAYOUTS,
  MAX_SAVED_LAYOUTS,
  type SavedLayout,
  SavedLayoutsFileSchema,
  summarize,
} from '../../src/shared/layouts.js'
import type { LayoutNode, PaneNode } from '../../src/shared/schemas/layout.js'
import { WEB_PRESETS } from '../../src/shared/web.js'

/**
 * The widgets the page registers, read from builtins.ts as text: the registry
 * imports Svelte components, which a node test cannot load.
 */
function builtinWidgets(): Map<string, { w: number; h: number; multiple: boolean }> {
  const source = readFileSync(
    new URL('../../src/renderer/widgets/builtins.ts', import.meta.url),
    'utf8',
  )
  const widgets = new Map<string, { w: number; h: number; multiple: boolean }>()
  for (const block of source.split('registerBuiltin({').slice(1)) {
    const id = /^\s*id: '([^']+)',/m.exec(block)?.[1]
    const size = /minSize: \{ w: (\d+), h: (\d+) \}/.exec(block)
    if (id === undefined || size === null) continue
    widgets.set(id, {
      w: Number(size[1]),
      h: Number(size[2]),
      multiple: /multiple: true/.test(block),
    })
  }
  // A web pane per preset, all with one registration (see the loop in builtins.ts).
  const web =
    /registerBuiltin\(\{\s*id: webWidgetId\(preset\)[\s\S]*?minSize: \{ w: (\d+), h: (\d+) \}/.exec(
      source,
    )
  for (const preset of WEB_PRESETS) {
    widgets.set(`web.${preset.id}`, { w: Number(web?.[1]), h: Number(web?.[2]), multiple: true })
  }
  return widgets
}

const WIDGETS = builtinWidgets()
let counter = 0
const makeId = (): string => `id${(counter++).toString(36).padStart(4, '0')}`

const entry = (name: string, id = makeId()): SavedLayout => ({
  id,
  name,
  tree: presetTree(LAYOUT_PRESETS[0] as LayoutPreset),
})

describe('LAYOUT_PRESETS', () => {
  it('lists every id once, in the order the ids give', () => {
    expect(LAYOUT_PRESETS.map((p) => p.id)).toEqual([...LAYOUT_PRESET_IDS])
    expect(new Set(LAYOUT_PRESETS.map((p) => p.name)).size).toBe(LAYOUT_PRESETS.length)
  })

  it('is named apart from any pane, so "earth" never reads as the ORBIT pane', () => {
    for (const preset of LAYOUT_PRESETS) expect(WIDGETS.has(preset.name)).toBe(false)
  })

  it('makes standard the default layout itself', () => {
    const standard = presetById('standard')
    expect(standard?.build).toBe(defaultLayoutNode)
  })

  it('names only widgets that exist, and a widget that cannot be doubled only once', () => {
    expect(WIDGETS.size).toBeGreaterThan(20)
    for (const preset of LAYOUT_PRESETS) {
      const panes = collectPanes(preset.build())
      for (const node of panes) expect(WIDGETS.has(node.widget), node.widget).toBe(true)
      for (const [widget, def] of WIDGETS) {
        if (def.multiple) continue
        const count = panes.filter((node) => node.widget === widget).length
        expect(count, `${preset.id}: ${widget}`).toBeLessThanOrEqual(1)
      }
    }
  })

  it('is already normal: nothing in a preset is changed by loading it', () => {
    for (const preset of LAYOUT_PRESETS) {
      const tree = preset.build()
      expect(normalize(tree), preset.id).toEqual(tree)
    }
  })

  it('keeps the system column, at the same width and heights, on the left of every one but cockpit', () => {
    const column = layoutShape(defaultLayoutNode()).filter((r) => LEFT_COLUMN.includes(r.widget))
    expect([...WITH_SYSTEM_COLUMN]).toEqual(LAYOUT_PRESET_IDS.filter((id) => id !== 'cockpit'))
    for (const preset of LAYOUT_PRESETS.filter((p) => WITH_SYSTEM_COLUMN.includes(p.id))) {
      const shape = layoutShape(preset.build())
      const left = shape.filter((r) => LEFT_COLUMN.includes(r.widget))
      expect(left, preset.id).toEqual(column)
      expect(left.every((r) => r.x === 0 && Math.abs(r.w - SYSTEM_COLUMN_WIDTH) < 1e-4)).toBe(true)
      // And nothing else sits in it.
      expect(shape.filter((r) => r.x < SYSTEM_COLUMN_WIDTH - 1e-4)).toHaveLength(left.length)
    }
  })

  it('shares the stage out to the full width, for each preset', () => {
    for (const preset of LAYOUT_PRESETS) {
      const area = layoutShape(preset.build()).reduce((sum, r) => sum + r.w * r.h, 0)
      expect(area, preset.id).toBeCloseTo(1, 2)
    }
  })

  /*
   * Every pane gets at least the room its widget asks for: at 1920x1080 all of
   * them, and at 1366x768 the stage (the system column's clock is a line
   * shorter than its minimum there, in the default layout too). The workspace is
   * the window less the title strip and the status bar.
   */
  const SCREENS = [
    { name: '1920x1080', w: 1920, h: 1030, stageOnly: false },
    { name: '1366x768', w: 1366, h: 718, stageOnly: true },
  ]
  for (const screen of SCREENS) {
    it(`gives every pane its minimum size at ${screen.name}`, () => {
      for (const preset of LAYOUT_PRESETS) {
        for (const rect of layoutShape(preset.build())) {
          if (screen.stageOnly && LEFT_COLUMN.includes(rect.widget)) continue
          const min = WIDGETS.get(rect.widget)
          const where = `${preset.id}: ${rect.widget}`
          expect(rect.w * screen.w, where).toBeGreaterThanOrEqual(min?.w ?? 0)
          expect(rect.h * screen.h, where).toBeGreaterThanOrEqual(min?.h ?? 0)
        }
      }
    })
  }

  it('puts X in front of the feeds in media, as tabs', () => {
    const media = layoutShape(presetTree(presetById('media') as LayoutPreset))
    expect(media.find((r) => r.tabs === 2)?.widget).toBe('web.x')
  })

  /** Each place in a preset, left to right and top to bottom, as the widgets of its tabs. */
  function places(id: string): string[][] {
    const out: string[][] = []
    const walk = (node: LayoutNode): void => {
      if (node.kind === 'pane') out.push([node.widget])
      else if (node.kind === 'tabs') out.push(node.children.map((child) => child.widget))
      else for (const child of node.children) walk(child)
    }
    walk((presetById(id) as LayoutPreset).build())
    return out.filter((widgets) => !widgets.every((w) => LEFT_COLUMN.includes(w)))
  }

  it('tabs dev as the user asked, the panes that read only while seen in front', () => {
    expect(places('dev')).toEqual([
      ['agents'],
      ['docker', 'terminal'],
      ['clipboard', 'timer', 'terminal'],
      ['git', 'aichat'],
    ])
    const shown = layoutShape(presetTree(presetById('dev') as LayoutPreset))
    expect(shown.filter((r) => r.tabs > 1).map((r) => r.widget)).toEqual([
      'docker',
      'clipboard',
      'git',
    ])
  })

  it('stacks two chats beside the council in ai, the council with the wider column', () => {
    expect(places('ai')).toEqual([['aichat'], ['aichat'], ['elec']])
    const shape = layoutShape(presetTree(presetById('ai') as LayoutPreset))
    const width = (widget: string) => shape.find((r) => r.widget === widget)?.w ?? 0
    expect(width('elec')).toBeGreaterThan(width('aichat'))
  })

  it('gives cockpit the CLUSTER pane in place of the system column, at its widest with every core', () => {
    // Three shells: one under CLUSTER, two one over the other on the right (user decision 2026-10-10).
    expect(places('cockpit')).toEqual([['cluster'], ['terminal'], ['terminal'], ['terminal']])
    const shape = layoutShape(presetTree(presetById('cockpit') as LayoutPreset))
    expect(shape.some((r) => LEFT_COLUMN.includes(r.widget))).toBe(false)
    const cluster = shape.find((r) => r.widget === 'cluster')
    expect(cluster?.x).toBe(0)
    expect(cluster?.y).toBe(0)
    // The README's shot is taken at 1600x900, a workspace of about 1600x850; a pane's body is
    // about 30 px shorter than the pane and 2 px narrower.
    for (const [w, h] of [
      [1600, 850],
      [1920, 1030],
    ] as const) {
      const width = (cluster?.w ?? 0) * w - 2
      const height = (cluster?.h ?? 0) * h - 30
      expect(clusterTier(width, height), `${w}x${h}`).toBe('wide')
      expect(showCores('wide', width, height), `${w}x${h}`).toBe(true)
    }
  })

  it('puts both machines behind one tab strip in retro, the spectrum under them at 16 bands', () => {
    expect(places('retro')).toEqual([['elec16', 'chip8'], ['spectrum']])
    const tree = (presetById('retro') as LayoutPreset).build()
    const panes: PaneNode[] = []
    const walk = (node: LayoutNode): void => {
      if (node.kind === 'pane') panes.push(node)
      else for (const child of node.children) walk(child as LayoutNode)
    }
    walk(tree)
    expect(panes.find((p) => p.widget === 'spectrum')?.state).toEqual({ bands: 16 })
    const shape = layoutShape(presetTree(presetById('retro') as LayoutPreset))
    const at = (widget: string) => shape.find((r) => r.widget === widget)
    expect(at('elec16')?.h ?? 0).toBeGreaterThan(at('spectrum')?.h ?? 0)
    expect(at('elec16')?.w).toBe(at('spectrum')?.w)
  })

  /** Each pane behind a tab, with the room its tab group is given. */
  function behindTabs(preset: LayoutPreset): { widget: string; w: number; h: number }[] {
    const groups = places(preset.id).filter((widgets) => widgets.length > 1)
    return layoutShape(preset.build()).flatMap((rect) => {
      const group = rect.tabs > 1 ? groups.find((widgets) => widgets[0] === rect.widget) : undefined
      return (group ?? []).map((widget) => ({ widget, w: rect.w, h: rect.h }))
    })
  }

  it('gives a pane behind a tab its minimum size too, at 1366x768', () => {
    for (const preset of LAYOUT_PRESETS) {
      for (const { widget, w, h } of behindTabs(preset)) {
        const min = WIDGETS.get(widget)
        expect(w * 1366, `${preset.id}: ${widget}`).toBeGreaterThanOrEqual(min?.w ?? 0)
        expect(h * 718, `${preset.id}: ${widget}`).toBeGreaterThanOrEqual(min?.h ?? 0)
      }
    }
    expect(behindTabs(presetById('dev') as LayoutPreset)).toHaveLength(7)
  })

  it('builds a fresh tree every time, with ids of its own', () => {
    for (const preset of LAYOUT_PRESETS) {
      const a = collectPanes(preset.build()).map((p) => p.id)
      const b = collectPanes(preset.build()).map((p) => p.id)
      expect(
        a.some((id) => b.includes(id)),
        preset.id,
      ).toBe(false)
    }
  })

  it('makes trees the saved layouts file accepts', () => {
    const items = seededLayouts(makeId)
    const parsed = SavedLayoutsFileSchema.parse({ version: 1, items, active: null })
    expect(parsed.items).toHaveLength(LAYOUT_PRESETS.length)
  })
})

describe('presetById', () => {
  it('finds a preset, and nothing for what is not one', () => {
    expect(presetById('earth')?.name).toBe('earth')
    expect(presetById('orbit')).toBeNull()
    expect(presetById(undefined)).toBeNull()
    expect(presetById({ id: 'dev' })).toBeNull()
  })
})

describe('freeLayoutName', () => {
  it('takes the preset name when it is free, and numbers it when it is not', () => {
    expect(freeLayoutName([], 'dev')).toBe('dev')
    expect(freeLayoutName([{ name: 'dev' }], 'dev')).toBe('dev 2')
    expect(freeLayoutName([{ name: 'dev' }, { name: 'dev 2' }], 'dev')).toBe('dev 3')
  })
})

describe('withPresetLayout', () => {
  it('adds a layout made from the preset at the end, and says which', () => {
    const added = withPresetLayout([entry('mine')], 'earth', 'newid')
    expect(added?.id).toBe('newid')
    expect(added?.items.map((l) => [l.name, l.preset])).toEqual([
      ['mine', undefined],
      ['earth', 'earth'],
    ])
  })

  it('finds the layout already made from it rather than adding or replacing one', () => {
    const worked: SavedLayout = { ...entry('earth', 'kept'), preset: 'earth' }
    const added = withPresetLayout([entry('mine'), worked], 'earth', 'newid')
    expect(added?.id).toBe('kept')
    expect(added?.items).toHaveLength(2)
    // What was done in it since is kept: the tree is the one it had.
    expect(added?.items[1]).toBe(worked)
  })

  it('finds it by the preset, not the name, after the user renamed it', () => {
    const renamed: SavedLayout = { ...entry('my studio', 'kept'), preset: 'media' }
    expect(withPresetLayout([renamed], 'media', 'newid')?.id).toBe('kept')
  })

  it('gives it a name of its own beside a user layout of the same name', () => {
    const added = withPresetLayout([entry('desk')], 'desk', 'newid')
    expect(added?.items[1]?.name).toBe('desk 2')
  })

  it('refuses an unknown preset and a full list', () => {
    expect(withPresetLayout([], 'orbit', 'newid')).toBeNull()
    const full = Array.from({ length: MAX_SAVED_LAYOUTS }, (_, i) => entry(`l${i}`))
    expect(withPresetLayout(full, 'dev', 'newid')).toBeNull()
  })

  it('still finds one already there when the list is full', () => {
    const full = Array.from({ length: MAX_SAVED_LAYOUTS }, (_, i) => entry(`l${i}`))
    full[3] = { ...(full[3] as SavedLayout), preset: 'dev' }
    expect(withPresetLayout(full, 'dev', 'newid')?.id).toBe(full[3]?.id)
  })
})

describe('withPresetRestored', () => {
  it('puts the tree back to the preset, keeping the name, id and place', () => {
    const worked: SavedLayout = { ...entry('my dev', 'kept'), preset: 'dev' }
    const list = withPresetRestored([entry('a'), worked], 'kept')
    const back = list?.[1]
    expect(back?.id).toBe('kept')
    expect(back?.name).toBe('my dev')
    expect(back?.preset).toBe('dev')
    const widgets = collectPanes(back?.tree.root ?? defaultLayoutNode()).map((p) => p.widget)
    expect(widgets).toContain('git')
    expect(widgets).toContain('agents')
  })

  it('refuses a layout the user saved, an unknown preset and an unknown id', () => {
    expect(withPresetRestored([entry('a', 'aaaa')], 'aaaa')).toBeNull()
    expect(withPresetRestored([{ ...entry('a', 'aaaa'), preset: 'future' }], 'aaaa')).toBeNull()
    expect(withPresetRestored([entry('a')], 'nope')).toBeNull()
  })
})

describe('seededLayouts', () => {
  it('is every preset in order, each with an id no other has', () => {
    const items = seededLayouts(makeId)
    expect(items.map((l) => l.preset)).toEqual([...LAYOUT_PRESET_IDS])
    expect(items.map((l) => l.name)).toEqual(LAYOUT_PRESETS.map((p) => p.name))
    expect(new Set(items.map((l) => l.id)).size).toBe(items.length)
  })

  it('asks for each id knowing the ones already given', () => {
    const seen: number[] = []
    seededLayouts((taken) => {
      seen.push(taken.length)
      return makeId()
    })
    expect(seen).toEqual(LAYOUT_PRESETS.map((_, i) => i))
  })

  it('fits on the number keys', () => {
    expect(LAYOUT_PRESETS.length).toBeLessThanOrEqual(KEYED_LAYOUTS)
  })
})

describe('the order of the presets', () => {
  // The LAYOUTS dialog's shelf, the first start's numbered list and the Ctrl+Shift+F keys all
  // follow this order; retro is last, after cockpit (user decision 2026-10-10).
  const ORDER = ['standard', 'network', 'earth', 'dev', 'media', 'desk', 'ai', 'cockpit', 'retro']

  it('is the one the user set, retro last', () => {
    expect([...LAYOUT_PRESET_IDS]).toEqual(ORDER)
    expect(LAYOUT_PRESETS.map((preset) => preset.id)).toEqual(ORDER)
  })

  it('lays the dialog’s shelf out in it, cockpit then retro', () => {
    const shelf = presetCards([]).map((card) => card.id)
    expect(shelf).toEqual(ORDER)
    expect(shelf.indexOf('cockpit')).toBe(shelf.indexOf('retro') - 1)
    expect(shelf.at(-1)).toBe('retro')
  })
})

describe('presetCards', () => {
  it('says for each preset whether it is kept, on which key, and whether in use', () => {
    const items: SavedLayout[] = [
      entry('mine', 'aaaa'),
      { ...entry('dev', 'bbbb'), preset: 'dev' },
      ...Array.from({ length: 8 }, (_, i) => entry(`x${i}`)),
      { ...entry('desk', 'cccc'), preset: 'desk' },
    ]
    const cards = presetCards(summarize(items, 'bbbb'))
    const card = (id: string) => cards.find((c) => c.id === id)
    expect(cards.map((c) => c.id)).toEqual([...LAYOUT_PRESET_IDS])
    expect(card('dev')).toMatchObject({ savedId: 'bbbb', slot: 2, active: true })
    // Tenth in the list: kept, but on no key.
    expect(card('desk')).toMatchObject({ savedId: 'cccc', slot: null, active: false })
    expect(card('earth')).toMatchObject({ savedId: null, slot: null, active: false })
    expect(layoutFromPreset(items, 'dev')?.id).toBe('bbbb')
  })

  it('badges a card by where it stands', () => {
    const base = { id: 'dev' as const, name: 'dev', description: '' }
    expect(presetBadge({ ...base, savedId: 'a', slot: 2, active: true })).toBe('in this one')
    expect(presetBadge({ ...base, savedId: 'a', slot: 2, active: false })).toBe('on 2')
    expect(presetBadge({ ...base, savedId: 'a', slot: null, active: false })).toBe('kept')
    expect(presetBadge({ ...base, savedId: null, slot: null, active: false })).toBe('+ add')
  })
})
