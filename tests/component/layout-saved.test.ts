import { pane } from '@shared/layout-ops'
import { LAYOUT_VERSION, type LayoutTree } from '@shared/schemas/layout'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: { play: vi.fn() } }))

const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')

/**
 * Switching between saved layouts.
 *
 * A layout follows the work: main writes every save of the live tree back into
 * the layout being worked in. That makes the order of two messages matter - a
 * save still on its way when the next layout is applied would be written into
 * the layout that was just applied, carrying the arrangement of the one being
 * left into it and leaving that one as it was.
 *
 * So what is asserted is not an order of events after the fact but the thing
 * that matters: the apply must not reach main while a save is outstanding.
 */

const ONE: LayoutTree = { version: LAYOUT_VERSION, root: pane('clock') }
const TWO: LayoutTree = { version: LAYOUT_VERSION, root: pane('terminal') }

/** Whether a save has been sent and not yet answered. */
let outstanding = false
/** What `outstanding` was when the apply reached main; null while none has. */
let appliedWhileSaving: boolean | null
/** The same for keeping the arrangement under a name. */
let keptWhileSaving: boolean | null
let answerSave: (() => void) | null

const stub = (): void => {
  vi.stubGlobal('elecdex', {
    layout: {
      load: async () => ONE,
      save: vi.fn(() => {
        outstanding = true
        // Held open until the test answers it, which is what a save in flight is.
        return new Promise<LayoutTree>((resolve) => {
          answerSave = () => {
            outstanding = false
            resolve(ONE)
          }
        })
      }),
      saved: {
        list: async () => [{ id: 'two', name: 'two', active: true }],
        apply: vi.fn(async () => {
          appliedWhileSaving = outstanding
          return TWO
        }),
        save: vi.fn(async () => {
          keptWhileSaving = outstanding
          return []
        }),
        remove: vi.fn(async () => []),
      },
    },
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  outstanding = false
  appliedWhileSaving = null
  keptWhileSaving = null
  answerSave = null
  layout.loaded = false
  layout.tree = ONE
  stub()
})

afterEach(async () => {
  answerSave?.()
  layout.settle()
  await layout.flush()
  vi.clearAllMocks()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

/** Splits a pane, which schedules the debounced save. */
function rearrange(): void {
  const first = layout.panes[0]
  if (first === undefined) throw new Error('no pane to change')
  layout.split(first.id, 'right', 'clock')
}

describe('applying a saved layout', () => {
  it('waits for a save already on its way', async () => {
    await layout.load()
    rearrange()
    // The debounce fires: the save is in flight, unanswered.
    await vi.advanceTimersByTimeAsync(1000)
    expect(outstanding).toBe(true)

    const applied = layout.applySaved('two')
    // Every pending microtask runs here; an apply that did not wait lands now.
    await vi.advanceTimersByTimeAsync(10)
    expect(appliedWhileSaving).toBeNull()

    answerSave?.()
    await applied
    expect(appliedWhileSaving).toBe(false)
  })

  it('writes a change still behind its debounce before it switches', async () => {
    await layout.load()
    rearrange()
    // No time passes: the save has not been sent yet.
    expect(outstanding).toBe(false)

    const applied = layout.applySaved('two')
    await vi.advanceTimersByTimeAsync(10)
    // Sent by the flush, and holding the apply up until it is answered.
    expect(outstanding).toBe(true)
    expect(appliedWhileSaving).toBeNull()

    answerSave?.()
    await applied
    expect(appliedWhileSaving).toBe(false)
  })

  it('writes the pending save out before keeping the arrangement under a new name', async () => {
    // Saving under a new name is entering that layout, so what came before it
    // belongs to the one being left. Left to the debounce, whether it does is a
    // race: the same few seconds of work land in one layout or the other
    // depending on how long the user took to type the name.
    await layout.load()
    rearrange()
    const kept = layout.saveAs('two')
    await vi.advanceTimersByTimeAsync(10)
    expect(keptWhileSaving).toBeNull()

    answerSave?.()
    await kept
    expect(keptWhileSaving).toBe(false)
  })

  it('never writes the layout being left into the one being entered while it powers off', async () => {
    // Main makes the new layout the active one before the page has adopted its tree: a
    // save of the old arrangement landing in that gap (a shell's session id arriving late,
    // say) would be written into the new layout. It holds while the save's debounce is
    // longer than the power-off; this pins that down.
    layout.closeMotion = { animates: () => true, frames: () => new Map() }
    try {
      await layout.load()
      const old = layout.panes[0]
      if (old === undefined) throw new Error('no pane')
      const applied = layout.applySaved('two')
      await vi.advanceTimersByTimeAsync(10)
      const save = vi.mocked(window.elecdex.layout.save)
      save.mockClear()
      // The old pane's widget, not yet gone, records something while the screen goes dark.
      layout.setPaneState(old.id, { sessionId: 'late' })
      await vi.advanceTimersByTimeAsync(5000)
      answerSave?.()
      await applied
      for (const [tree] of save.mock.calls) expect(tree).toMatchObject({ root: TWO.root })
    } finally {
      layout.closeMotion = null
    }
  })

  it('does the same for a reset, which belongs to no saved layout', async () => {
    vi.stubGlobal('elecdex', {
      layout: {
        load: async () => ONE,
        save: vi.fn(() => {
          outstanding = true
          return new Promise<LayoutTree>((resolve) => {
            answerSave = () => {
              outstanding = false
              resolve(ONE)
            }
          })
        }),
        reset: vi.fn(async () => {
          appliedWhileSaving = outstanding
          return ONE
        }),
        saved: { list: async () => [], apply: vi.fn(), save: vi.fn(), remove: vi.fn() },
      },
    })
    await layout.load()
    rearrange()
    await vi.advanceTimersByTimeAsync(1000)

    const done = layout.reset()
    await vi.advanceTimersByTimeAsync(10)
    expect(appliedWhileSaving).toBeNull()

    answerSave?.()
    await done
    expect(appliedWhileSaving).toBe(false)
  })
})
