import { readFileSync } from 'node:fs'
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

  it('keeps the system column, at the same width and heights, on the left of every one', () => {
    const column = layoutShape(defaultLayoutNode()).filter((r) => LEFT_COLUMN.includes(r.widget))
    for (const preset of LAYOUT_PRESETS) {
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
