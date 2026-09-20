import { pane } from '@shared/layout-ops'
import { render } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: { play: vi.fn() } }))

// The terminal widget, registered with the rest, adopts its stylesheet on import.
document.adoptedStyleSheets = []
CSSStyleSheet.prototype.replaceSync ??= () => {}

const { default: PaneHost } = await import('../../src/renderer/layout/PaneHost.svelte')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
await import('../../src/renderer/widgets/builtins.ts')

/**
 * A pane just added powers on once, and the class goes when the animation ends.
 *
 * It went only then. A power-on cut short never ends: a tab put behind another
 * before it had played is display:none, which cancels the animation without a
 * word, and a pane brought forward has its animation replaced by the flight. The
 * class stayed, and the power-on played again - when the tab was next shown, or
 * in front of everything as the flight landed.
 */
beforeEach(() => {
  vi.stubGlobal('elecdex', { layout: { save: vi.fn(async () => {}) } })
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
})

afterEach(() => {
  layout.pinnedPaneId = null
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function arrive(tabbed: boolean) {
  const node = pane('clock')
  vi.spyOn(layout, 'arrived').mockImplementation((id) => id === node.id)
  const view = render(PaneHost, { props: { node, visible: true, tabbed } })
  flushSync()
  const element = view.container.querySelector('[data-testid=pane]') as HTMLElement
  return { node, view, element }
}

describe('a new pane powering on', () => {
  it('has the class until its animation ends', () => {
    const { element } = arrive(false)
    expect(element.classList.contains('crt-on')).toBe(true)
    const ended = new Event('animationend', { bubbles: true })
    Object.assign(ended, { animationName: 'crt-power-on' })
    element.dispatchEvent(ended)
    flushSync()
    expect(element.classList.contains('crt-on')).toBe(false)
  })

  it('is over for a tab put behind another, which will never see it end', async () => {
    const { view, element } = arrive(true)
    expect(element.classList.contains('crt-on')).toBe(true)
    await view.rerender({ visible: false })
    flushSync()
    expect(element.classList.contains('crt-on')).toBe(false)
    // And shown again, it is simply there.
    await view.rerender({ visible: true })
    flushSync()
    expect(element.classList.contains('crt-on')).toBe(false)
  })

  it('is over for a pane brought forward, whose flight takes its place', () => {
    const { node, element } = arrive(false)
    expect(element.classList.contains('crt-on')).toBe(true)
    layout.pinnedPaneId = node.id
    flushSync()
    expect(element.classList.contains('crt-on')).toBe(false)
    layout.pinnedPaneId = null
    flushSync()
    expect(element.classList.contains('crt-on')).toBe(false)
  })
})
