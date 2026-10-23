import { pane, split } from '@shared/layout-ops'
import { LAYOUT_VERSION } from '@shared/schemas/layout'
import { render } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: { play: vi.fn() } }))

const { default: PanePicker } = await import('../../src/renderer/layout/PanePicker.svelte')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { ui } = await import('../../src/renderer/stores/ui.svelte.ts')
const { registerBuiltin } = await import('../../src/renderer/widgets/registry.ts')

/**
 * The add-pane picker against the real layout store: a widget that allows one
 * pane and already has it is focused, wherever it was asked to go - never added
 * or popped up a second time. pickerChoice (popup.test.ts) decides; this holds
 * the picker to asking it with the pane that is on screen, and to doing what it
 * answered.
 */

Element.prototype.scrollIntoView = () => {}

registerBuiltin({ id: 'memory', title: 'Memory', popup: true } as never)
registerBuiltin({ id: 'terminal', title: 'Terminal', multiple: true } as never)

const shell = pane('terminal')
const memory = pane('memory')

beforeEach(() => {
  vi.stubGlobal('elecdex', { layout: { save: vi.fn(async () => {}) } })
  // Motion reduced: the picker opens and closes without the power transitions jsdom cannot run.
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
  layout.tree = { version: LAYOUT_VERSION, root: split('row', [shell, memory]) }
  layout.focusedPaneId = shell.id
})

afterEach(async () => {
  ui.closePanePicker()
  ui.closePopup()
  layout.settle()
  await layout.flush()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

const item = (widget: string) =>
  document.querySelector<HTMLButtonElement>(
    `[data-testid=pane-picker-item][data-widget="${widget}"]`,
  )
const placement = (id: string) =>
  document.querySelector<HTMLButtonElement>(
    `[data-testid=pane-picker-placement][data-placement="${id}"]`,
  )
const panesOf = (widget: string) => layout.panes.filter((p) => p.widget === widget)

describe('a single-instance widget already on screen', () => {
  it.each(['right', 'popup'])('is focused from the %s placement, not duplicated', (where) => {
    render(PanePicker)
    ui.openPanePicker()
    flushSync()
    placement(where)?.click()
    flushSync()
    expect(item('memory')?.querySelector('.state')?.textContent?.trim()).toBe('on screen · focus')

    item('memory')?.click()
    flushSync()
    expect(ui.panePickerOpen).toBe(false)
    expect(ui.popup).toBeNull()
    expect(panesOf('memory').map((p) => p.id)).toEqual([memory.id])
    expect(layout.focusedPaneId).toBe(memory.id)
  })

  it('is added again only for a widget that may repeat', () => {
    render(PanePicker)
    ui.openPanePicker()
    flushSync()
    item('terminal')?.click()
    flushSync()
    expect(panesOf('terminal')).toHaveLength(2)
  })
})
