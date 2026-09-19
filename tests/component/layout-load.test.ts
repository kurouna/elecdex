import { pane, split } from '@shared/layout-ops'
import { LAYOUT_VERSION, type LayoutTree } from '@shared/schemas/layout'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: { play: vi.fn() } }))

const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { toasts } = await import('../../src/renderer/stores/toasts.svelte.ts')

/**
 * Reading the layout from main, and what happens when that fails.
 *
 * The boot sequence waits for `loaded` before it plays, and the workspace draws
 * nothing without it, so a load that never finishes leaves the window on the
 * intro for good. A load that failed must also not be written over: the file on
 * disk is the user's arrangement, and the default tree the page falls back to
 * would replace it at the first change.
 */

const A_LAYOUT: LayoutTree = {
  version: LAYOUT_VERSION,
  root: split('row', [pane('clock'), pane('terminal')]),
}

let save: ReturnType<typeof vi.fn>

const stub = (load: () => Promise<LayoutTree>): void => {
  vi.stubGlobal('elecdex', { layout: { load, save } })
}

/** Changes the tree and gives the debounced save every chance to run. */
async function changeAndSettle(): Promise<void> {
  const [first] = layout.panes
  if (first === undefined) throw new Error('no pane to change')
  layout.split(first.id, 'right', 'clock')
  await vi.advanceTimersByTimeAsync(1000)
  await layout.flush()
}

beforeEach(() => {
  vi.useFakeTimers()
  save = vi.fn(async () => {})
  layout.loaded = false
  layout.tree = { version: LAYOUT_VERSION, root: pane('clock') }
})

afterEach(() => {
  layout.settle()
  toasts.clear()
  vi.clearAllMocks()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('loading the layout', () => {
  it('reads it, and saves changes from then on', async () => {
    stub(async () => A_LAYOUT)
    await layout.load()

    expect(layout.loaded).toBe(true)
    expect(layout.panes).toHaveLength(2)
    await changeAndSettle()
    expect(save).toHaveBeenCalled()
  })

  it('comes up anyway when it cannot be read, and leaves the file alone', async () => {
    stub(async () => {
      throw new Error('no handler registered')
    })

    await expect(layout.load()).resolves.toBeUndefined()

    // Left false, the intro never ends and the workspace stays empty.
    expect(layout.loaded).toBe(true)
    expect(layout.panes.length).toBeGreaterThan(0)

    // The arrangement on disk was not read, so nothing is written over it.
    await changeAndSettle()
    expect(save).not.toHaveBeenCalled()

    // And the user is told, in a toast that stays until it is answered.
    const toast = toasts.items.at(-1)
    expect(toast).toMatchObject({ tone: 'danger', timeoutMs: 0 })
    expect(toast?.actions.map((action) => action.label)).toContain('try again')
  })

  it('saves again once a retry has read it', async () => {
    stub(async () => {
      throw new Error('no handler registered')
    })
    await layout.load()
    expect(save).not.toHaveBeenCalled()

    stub(async () => A_LAYOUT)
    const retry = toasts.items.at(-1)?.actions.find((action) => action.label === 'try again')
    expect(retry).toBeDefined()
    await retry?.run()
    await vi.advanceTimersByTimeAsync(0)

    expect(layout.panes).toHaveLength(2)
    await changeAndSettle()
    expect(save).toHaveBeenCalled()
  })

  it('keeps holding the file back when the retry fails too', async () => {
    stub(async () => {
      throw new Error('no handler registered')
    })
    await layout.load()
    const retry = toasts.items.at(-1)?.actions.find((action) => action.label === 'try again')
    await retry?.run()
    await vi.advanceTimersByTimeAsync(0)

    await changeAndSettle()
    expect(save).not.toHaveBeenCalled()
  })
})
