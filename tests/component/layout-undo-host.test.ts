import { pane, split } from '@shared/layout-ops'
import { LAYOUT_VERSION, type LayoutTree } from '@shared/schemas/layout'
import { render } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { framesOf } from './support/frames.ts'
import { settle } from './support/settle.ts'

vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: { play: vi.fn() } }))

const { default: LayoutRoot } = await import('./LayoutRoot.svelte')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { toasts } = await import('../../src/renderer/stores/toasts.svelte.ts')
const { appearance } = await import('../../src/renderer/stores/appearance.svelte.ts')

/**
 * A close put back from its toast, through the real pane hosts: the pane put back
 * powers on as it mounts, and that arrival is spent there, not kept for later.
 */

beforeEach(() => {
  vi.stubGlobal('elecdex', { layout: { save: vi.fn(async (_tree: LayoutTree) => {}) } })
  layout.closeMotion = { animates: () => true, frames: () => framesOf(layout.tree) }
  // Said outright, so the store does not ask the system (jsdom has no matchMedia).
  appearance.settings = { ...appearance.settings, motion: 'full' }
})

afterEach(async () => {
  layout.settle()
  layout.closeMotion = null
  toasts.clear()
  await layout.flush()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('undo of a close', () => {
  it('powers the pane on as it is put back, though it is undone while it still powers off', async () => {
    const a = pane('clock')
    const b = pane('calendar')
    layout.tree = { version: LAYOUT_VERSION, root: split('row', [a, b]) }
    const view = render(LayoutRoot)
    await settle()
    layout.close(a.id)
    expect(layout.closingId).toBe(a.id)
    layout.undoClose()
    await settle()
    // The host put back asked as it mounted: nothing is left for a later remount (a move)
    // to take for an arrival. Its host once stayed mounted, and the arrival waited.
    expect(layout.arrived(a.id)).toBe(false)
    expect(view.container.querySelector(`[data-pane-id="${a.id}"]`)?.className).toContain('crt-on')
    view.unmount()
  })
})
