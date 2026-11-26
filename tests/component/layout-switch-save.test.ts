import { pane } from '@shared/layout-ops'
import { LAYOUT_VERSION, type LayoutTree } from '@shared/schemas/layout'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SWITCH_GAP_MS, SWITCH_OFF_MS } from '../../src/renderer/lib/crt-timing.ts'

vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: { play: vi.fn() } }))

const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')

/**
 * A switch with motion: main makes the next layout the active one at once, and the page goes on
 * showing the layout being left while it powers off (SWITCH_OFF_MS + SWITCH_GAP_MS). Main writes
 * every save into the active layout, so a save of the tree still on screen sent in that time -
 * a change made to it then, flushed by a second switch pressed before the first had finished -
 * landed in the layout just switched to, and replaced its arrangement with the one being left.
 */

const ONE: LayoutTree = { version: LAYOUT_VERSION, root: pane('clock') }
const TWO: LayoutTree = { version: LAYOUT_VERSION, root: pane('terminal') }
const THREE: LayoutTree = { version: LAYOUT_VERSION, root: pane('calc') }

/** Main, as far as a switch goes: which layout is active, and what each save wrote into which. */
let active: string
let written: Array<{ into: string; widget: string | undefined }>
const trees: Record<string, LayoutTree> = { one: ONE, two: TWO, three: THREE }

const widgetOf = (tree: LayoutTree): string | undefined =>
  tree.root.kind === 'pane' ? tree.root.widget : undefined

beforeEach(() => {
  vi.useFakeTimers()
  active = 'one'
  written = []
  layout.loaded = false
  layout.tree = ONE
  vi.stubGlobal('elecdex', {
    layout: {
      load: async () => ONE,
      save: vi.fn(async (tree: LayoutTree) => {
        written.push({ into: active, widget: widgetOf(tree) })
        return tree
      }),
      saved: {
        list: async () => Object.keys(trees).map((id) => ({ id, name: id, active: id === active })),
        apply: vi.fn(async (id: string) => {
          active = id
          return trees[id] ?? null
        }),
      },
    },
  })
  // Motion on, as in the running app: the switch powers the old layout off first.
  layout.closeMotion = { animates: () => true, frames: () => new Map() }
})

afterEach(async () => {
  layout.closeMotion = null
  await vi.advanceTimersByTimeAsync(5000)
  layout.settle()
  await layout.flush()
  vi.clearAllMocks()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('a second switch while the first is still powering off', () => {
  it('writes nothing of the layout being left into the one switched to', async () => {
    await layout.load()
    const first = layout.saved.apply('two')
    await vi.advanceTimersByTimeAsync(10)
    // Main has made two active; ONE is still on screen, powering off, and is changed then.
    expect(active).toBe('two')
    expect(widgetOf(layout.tree)).toBe('clock')
    const shown = layout.panes[0]
    if (shown === undefined) throw new Error('no pane')
    layout.patchPaneState(shown.id, { view: 'changed' })
    // The second switch, before the first has brought TWO up.
    expect(SWITCH_OFF_MS + SWITCH_GAP_MS).toBeGreaterThan(100)
    await vi.advanceTimersByTimeAsync(100)
    const second = layout.saved.apply('three')
    await vi.advanceTimersByTimeAsync(5000)
    await Promise.all([first, second])

    expect(written.filter((save) => save.into === 'two' && save.widget === 'clock')).toEqual([])
    expect(widgetOf(layout.tree)).toBe('calc')
  })

  it('still writes a change made before the first switch into the layout it was made in', async () => {
    await layout.load()
    const shown = layout.panes[0]
    if (shown === undefined) throw new Error('no pane')
    layout.patchPaneState(shown.id, { view: 'changed' })
    const applied = layout.saved.apply('two')
    await vi.advanceTimersByTimeAsync(5000)
    await applied
    expect(written).toEqual([{ into: 'one', widget: 'clock' }])
  })
})
