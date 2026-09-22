import { pane, tabs } from '@shared/layout-ops'
import { render } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: { play: vi.fn() } }))

// The terminal widget, registered with the rest, adopts its stylesheet on import.
document.adoptedStyleSheets = []
CSSStyleSheet.prototype.replaceSync ??= () => {}

const { default: PaneHost } = await import('../../src/renderer/layout/PaneHost.svelte')
const { default: TabsHost } = await import('../../src/renderer/layout/TabsHost.svelte')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
await import('../../src/renderer/widgets/builtins.ts')

/**
 * The corner every pane has: ⤢ and × at the top right. A module pane's are its
 * own; a tab group's act on the group as a whole - the × closes every tab, the
 * ⤢ brings the group forward for the tab it shows - and a tab inside it has
 * none, since the group's corner is its corner.
 */
beforeEach(() => {
  // A readout pane (netstat) subscribes to its source as it mounts.
  vi.stubGlobal('elecdex', {
    layout: { save: vi.fn(async () => {}) },
    metrics: { subscribe: vi.fn(() => () => {}) },
  })
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
})

afterEach(() => {
  layout.settle()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const byTestId = (root: HTMLElement, id: string) =>
  root.querySelector<HTMLButtonElement>(`[data-testid=${id}]`)

describe('a pane of its own', () => {
  it('carries a × and, for a widget that is brought forward, a ⤢', () => {
    const node = pane('clock')
    const { container } = render(PaneHost, { props: { node, visible: true, tabbed: false } })
    flushSync()
    expect(byTestId(container, 'pane-close')).not.toBeNull()
    expect(byTestId(container, 'pane-close')?.getAttribute('aria-label')).toBe('close clock')
    expect(byTestId(container, 'pane-zoom')).not.toBeNull()
    expect(byTestId(container, 'group-close')).toBeNull()
  })

  it('offers no ⤢ for a readout', () => {
    const node = pane('netstat')
    const { container } = render(PaneHost, { props: { node, visible: true, tabbed: false } })
    flushSync()
    expect(byTestId(container, 'pane-close')).not.toBeNull()
    expect(byTestId(container, 'pane-zoom')).toBeNull()
  })

  it('has none as a tab: the group carries them', () => {
    const node = pane('clock')
    const { container } = render(PaneHost, { props: { node, visible: true, tabbed: true } })
    flushSync()
    expect(byTestId(container, 'pane-close')).toBeNull()
    expect(byTestId(container, 'pane-zoom')).toBeNull()
  })

  it('closes and brings forward through the store', () => {
    const node = pane('clock')
    const close = vi.spyOn(layout, 'close').mockImplementation(() => {})
    const zoom = vi.spyOn(layout, 'toggleZoom').mockImplementation(() => {})
    const { container } = render(PaneHost, { props: { node, visible: true, tabbed: false } })
    flushSync()
    byTestId(container, 'pane-zoom')?.click()
    expect(zoom).toHaveBeenCalledWith(node.id)
    byTestId(container, 'pane-close')?.click()
    expect(close).toHaveBeenCalledWith(node.id)
  })
})

describe('a tab group', () => {
  it('carries the same corner, acting on the group and the tab it shows', () => {
    const shown = pane('clock')
    const behind = pane('netstat')
    const node = tabs([shown, behind], 0)
    const close = vi.spyOn(layout, 'close').mockImplementation(() => {})
    const zoom = vi.spyOn(layout, 'toggleZoom').mockImplementation(() => {})
    const { container } = render(TabsHost, { props: { node } })
    flushSync()
    // Its own, once: the tabs inside carry none.
    expect(container.querySelectorAll('[data-testid=group-close]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-testid=pane-close]')).toHaveLength(0)
    expect(byTestId(container, 'group-zoom')).not.toBeNull()
    // The strip keeps a × per tab, and no ⤢ of its own.
    expect(container.querySelectorAll('[data-testid=tab-close]')).toHaveLength(2)
    expect(container.querySelector('[data-testid=tab-zoom]')).toBeNull()

    byTestId(container, 'group-zoom')?.click()
    expect(zoom).toHaveBeenCalledWith(shown.id)
    byTestId(container, 'group-close')?.click()
    expect(close).toHaveBeenCalledWith(node.id)
  })

  it('says its × takes every tab, and shows which while the × is aimed', () => {
    const node = tabs([pane('clock'), pane('netstat'), pane('clock')], 0)
    const { container } = render(TabsHost, { props: { node } })
    flushSync()
    const close = byTestId(container, 'group-close') as HTMLButtonElement
    expect(close.getAttribute('aria-label')).toBe('close all 3 tabs')
    expect(close.title).toMatch(/all 3 tabs/)
    const doomed = () => container.querySelectorAll('.tab.doomed').length

    // Under the pointer, every tab dims: this × is not a browser's one-tab ×.
    expect(doomed()).toBe(0)
    close.dispatchEvent(new PointerEvent('pointerenter'))
    flushSync()
    expect(doomed()).toBe(3)
    close.dispatchEvent(new PointerEvent('pointerleave'))
    flushSync()
    expect(doomed()).toBe(0)
    // And under the keyboard.
    close.dispatchEvent(new FocusEvent('focus'))
    flushSync()
    expect(doomed()).toBe(3)
    close.dispatchEvent(new FocusEvent('blur'))
    flushSync()
    expect(doomed()).toBe(0)
  })

  it('offers the ⤢ only while the tab it shows can be brought forward', async () => {
    const shown = pane('netstat')
    const behind = pane('clock')
    const node = tabs([shown, behind], 0)
    const view = render(TabsHost, { props: { node } })
    flushSync()
    expect(byTestId(view.container, 'group-zoom')).toBeNull()
    expect(byTestId(view.container, 'group-close')).not.toBeNull()
    await view.rerender({ node: { ...node, activeIndex: 1 } })
    flushSync()
    expect(byTestId(view.container, 'group-zoom')).not.toBeNull()
  })

  it('powers off as one while it closes, out of reach', () => {
    const node = tabs([pane('clock'), pane('netstat')], 0)
    const { container } = render(TabsHost, { props: { node } })
    flushSync()
    const host = container.querySelector('[data-testid=tabs-host]') as HTMLElement
    expect(host.classList.contains('crt-off')).toBe(false)
    layout.closingId = node.id
    flushSync()
    expect(host.classList.contains('crt-off')).toBe(true)
    expect(host.classList.contains('crt-beam')).toBe(true)
    expect(host.inert).toBe(true)
    layout.closingId = null
    flushSync()
    expect(host.classList.contains('crt-off')).toBe(false)
  })
})
