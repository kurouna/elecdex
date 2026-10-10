import { pane, split } from '@shared/layout-ops'
import { LAYOUT_VERSION, type LayoutTree } from '@shared/schemas/layout'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: { play: vi.fn() } }))

const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { toasts } = await import('../../src/renderer/stores/toasts.svelte.ts')

/**
 * What the user is told when main cannot keep or give a layout: a save that fails
 * quietly loses the arrangement at the next launch, and a key that does nothing
 * looks like a key that is broken.
 */

const A_LAYOUT: LayoutTree = {
  version: LAYOUT_VERSION,
  root: split('row', [pane('clock'), pane('calendar')]),
}

let save: ReturnType<typeof vi.fn>
let list: ReturnType<typeof vi.fn>

function stub(extra: Record<string, unknown> = {}, saved: Record<string, unknown> = {}): void {
  vi.stubGlobal('elecdex', {
    layout: {
      load: async () => A_LAYOUT,
      save,
      saved: { list, ...saved },
      ...extra,
    },
  })
}

/** Changes the tree and lets the debounced save go out and come back. */
async function changeAndSave(): Promise<void> {
  const [first] = layout.panes
  if (first === undefined) throw new Error('no pane to change')
  layout.split(first.id, 'right', 'clock')
  await vi.advanceTimersByTimeAsync(1000)
  await layout.flush()
}

const dangers = () => toasts.items.filter((toast) => toast.tone === 'danger')

beforeEach(async () => {
  vi.useFakeTimers()
  save = vi.fn(async () => {})
  list = vi.fn(async () => [])
  stub()
  await layout.load()
  toasts.clear()
})

afterEach(async () => {
  layout.settle()
  await layout.flush()
  toasts.clear()
  vi.clearAllMocks()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('saving the layout', () => {
  it('says so once when a save fails, not again for every save that fails after it', async () => {
    save.mockRejectedValue(new Error('disk full'))
    await changeAndSave()
    expect(dangers()).toHaveLength(1)
    expect(dangers()[0]?.title).toMatch(/could not save the layout/i)
    await changeAndSave()
    expect(dangers()).toHaveLength(1)
  })

  it('says so again after a save has gone through in between', async () => {
    save.mockRejectedValueOnce(new Error('disk full'))
    await changeAndSave()
    toasts.clear()
    await changeAndSave()
    expect(dangers()).toHaveLength(0)
    save.mockRejectedValueOnce(new Error('disk full'))
    await changeAndSave()
    expect(dangers()).toHaveLength(1)
  })
})

describe('resetting the layout', () => {
  it('says so and keeps the workspace when main cannot reset it', async () => {
    stub({ reset: vi.fn(async () => Promise.reject(new Error('gone'))) })
    const before = layout.tree
    await expect(layout.reset()).resolves.toBeUndefined()
    expect(layout.tree).toBe(before)
    expect(dangers()).toHaveLength(1)
  })
})

describe('applying a saved layout', () => {
  it('says so and reads the list again when main no longer has it', async () => {
    list.mockResolvedValue([
      { id: 'gone', name: 'gone', active: false, preset: null, shape: [] },
      { id: 'kept', name: 'kept', active: true, preset: null, shape: [] },
    ])
    stub({}, { apply: vi.fn(async () => null) })
    await layout.loadSaved()
    list.mockResolvedValue([{ id: 'kept', name: 'kept', active: true, preset: null, shape: [] }])

    expect(await layout.applySaved('gone')).toBe(false)
    expect(toasts.items.at(-1)?.title).toMatch(/could not be applied/i)
    expect(layout.savedLayouts.map((entry) => entry.id)).toEqual(['kept'])
  })
})
