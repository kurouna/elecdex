import { LAYOUT_VERSION } from '@shared/schemas/layout'
import type { WebAppearance, WebRect, WebState } from '@shared/web'
import { render, screen } from '@testing-library/svelte'
import { flushSync, tick } from 'svelte'
import { SvelteMap } from 'svelte/reactivity'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: { play: vi.fn() } }))

const { default: WebWidget } = await import('../../src/renderer/widgets/web/WebWidget.svelte')
const { default: LayoutNodeView } = await import('../../src/renderer/layout/LayoutNodeView.svelte')
const { registerBuiltin } = await import('../../src/renderer/widgets/registry.ts')
registerBuiltin({ id: 'web.youtube', title: 'youtube', component: WebWidget })
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { boot } = await import('../../src/renderer/stores/boot.svelte.ts')
const { ui } = await import('../../src/renderer/stores/ui.svelte.ts')
const { paneDrag } = await import('../../src/renderer/layout/pane-drag.svelte.ts')
const { appearance } = await import('../../src/renderer/stores/appearance.svelte.ts')
const { web } = await import('../../src/renderer/stores/web.svelte.ts')

/**
 * A web pane against a hand-driven main: where its view is shown, when it steps
 * aside for something drawn above it (and leaves a picture), and what becomes of
 * the view when the pane is moved or closed.
 */

const BODY: WebRect = { x: 10, y: 40, width: 300, height: 200 }

let states = new Map<string, (state: WebState) => void>()
let pictures = new Map<string, (image: string) => void>()
let shortcutOff = vi.fn()
/** IPC clones what it sends, and cannot clone a state proxy: neither can these. */
const sent = <A extends unknown[]>(...args: A): A => structuredClone(args)

const api = {
  open: vi.fn(async (paneId: string, claim: string, widget: string, url: string | null) => {
    sent(paneId, claim, widget, url)
    return stateOf(paneId, url)
  }),
  show: vi.fn((paneId: string, claim: string, rect: WebRect) => void sent(paneId, claim, rect)),
  hide: vi.fn(async (paneId: string, claim: string, snapshot: boolean) => {
    sent(paneId, claim, snapshot)
    return snapshot ? 'data:image/jpeg;base64,AAAA' : null
  }),
  command: vi.fn((paneId: string, command: unknown) => void sent(paneId, command)),
  close: vi.fn((paneId: string, claim: string | null) => void sent(paneId, claim)),
  list: vi.fn(async () => []),
  setAppearance: vi.fn((appearance: WebAppearance) => void sent(appearance)),
  focus: vi.fn(),
  focusWorkspace: vi.fn(),
  clearData: vi.fn(async () => {}),
  onState: (paneId: string, handler: (state: WebState) => void) => {
    states.set(paneId, handler)
    return () => states.delete(paneId)
  },
  onSnapshot: (paneId: string, handler: (image: string) => void) => {
    pictures.set(paneId, handler)
    return () => pictures.delete(paneId)
  },
  onShortcut: () => shortcutOff,
  onFocused: () => () => {},
}

function stateOf(paneId: string, url: string | null, patch: Partial<WebState> = {}): WebState {
  return {
    paneId,
    url: url ?? '',
    title: '',
    loading: false,
    canGoBack: false,
    canGoForward: false,
    error: null,
    ...patch,
  }
}

/** Every element measures as the page body; a hidden one (display: none) is empty. */
let bodyRect: WebRect | null = BODY
let overlays = new Map<Element, WebRect>()
function rectOf(box: WebRect | null): DOMRect {
  const { x, y, width, height } = box ?? { x: 0, y: 0, width: 0, height: 0 }
  return { x, y, width, height, left: x, top: y, right: x + width, bottom: y + height } as DOMRect
}

let resized: Array<() => void> = []

beforeEach(() => {
  states = new Map()
  pictures = new Map()
  shortcutOff = vi.fn()
  bodyRect = BODY
  overlays = new Map()
  resized = []
  vi.stubGlobal('elecdex', { web: api, layout: { save: vi.fn(async () => {}) } })
  vi.stubGlobal(
    'ResizeObserver',
    class {
      readonly callback: () => void
      constructor(callback: () => void) {
        this.callback = callback
        resized.push(callback)
      }
      observe() {}
      disconnect() {}
    },
  )
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const overlay = overlays.get(this)
    if (overlay !== undefined) return rectOf(overlay)
    return rectOf(this.getAttribute('data-testid') === 'web-page' ? bodyRect : null)
  })
  layout.tree = {
    version: LAYOUT_VERSION,
    root: {
      kind: 'pane',
      id: 'p',
      widget: 'web.youtube',
      state: { url: 'https://www.youtube.com/watch?v=1' },
    },
  }
  boot.phase = 'done'
})

/** Any claim: each mount makes its own. */
const CLAIM = expect.any(String)

afterEach(() => {
  ui.closeSettings()
  paneDrag.source = null
  vi.clearAllMocks()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await tick()
  flushSync()
}

type Props = { visible?: boolean; transitioning?: boolean; active?: boolean; widget?: string }

function mount(props: Props = {}) {
  const widget = props.widget ?? 'web.youtube'
  const node = layout.tree.root.kind === 'pane' ? layout.tree.root : null
  return render(WebWidget, {
    props: {
      paneId: 'p',
      title: 'youtube',
      props: undefined,
      state: node?.state,
      active: props.active ?? false,
      visible: props.visible ?? true,
      transitioning: props.transitioning ?? false,
      widget,
    },
  })
}

describe('WebWidget', () => {
  it('opens the page it was last on and shows it over its body', async () => {
    mount()
    await settle()
    expect(api.open).toHaveBeenCalledWith(
      'p',
      CLAIM,
      'web.youtube',
      'https://www.youtube.com/watch?v=1',
    )
    expect(api.show).toHaveBeenLastCalledWith('p', CLAIM, BODY)
    expect(screen.getByTestId('web').dataset.showing).toBe('true')
  })

  it('places the view again when the body moves, and not when nothing changed', async () => {
    mount()
    await settle()
    api.show.mockClear()
    for (const callback of resized) callback()
    await settle()
    expect(api.show).not.toHaveBeenCalled()
    bodyRect = { ...BODY, x: 50 }
    for (const callback of resized) callback()
    await settle()
    expect(api.show).toHaveBeenCalledWith('p', CLAIM, { ...BODY, x: 50 })
  })

  it('steps aside for a dialog, leaving a picture, and comes back when it closes', async () => {
    mount()
    await settle()
    ui.openSettings()
    await settle()
    expect(api.hide).toHaveBeenLastCalledWith('p', CLAIM, true)
    expect(screen.getByTestId('web-snapshot').getAttribute('src')).toBe(
      'data:image/jpeg;base64,AAAA',
    )
    api.show.mockClear()
    ui.closeSettings()
    await settle()
    expect(api.show).toHaveBeenCalledWith('p', CLAIM, BODY)
    expect(screen.queryByTestId('web-snapshot')).toBeNull()
  })

  it('steps aside while a pane is dragged and while the pane powers on or off', async () => {
    const view = mount()
    await settle()
    paneDrag.source = 'other'
    await settle()
    expect(api.hide).toHaveBeenLastCalledWith('p', CLAIM, true)
    paneDrag.source = null
    await settle()
    expect(screen.getByTestId('web').dataset.showing).toBe('true')

    api.hide.mockClear()
    await view.rerender({ transitioning: true })
    await settle()
    expect(api.hide).toHaveBeenLastCalledWith('p', CLAIM, true)
  })

  it('is not shown before the boot reveal ends', async () => {
    boot.phase = 'reveal'
    mount()
    await settle()
    expect(api.show).not.toHaveBeenCalled()
    boot.phase = 'done'
    await settle()
    expect(api.show).toHaveBeenCalledWith('p', CLAIM, BODY)
  })

  it('hides without a picture as a tab behind another', async () => {
    const view = mount()
    await settle()
    bodyRect = null
    await view.rerender({ visible: false })
    await settle()
    expect(api.hide).toHaveBeenLastCalledWith('p', CLAIM, false)
    expect(screen.queryByTestId('web-snapshot')).toBeNull()
    bodyRect = BODY
    await view.rerender({ visible: true })
    await settle()
    expect(api.show).toHaveBeenLastCalledWith('p', CLAIM, BODY)
  })

  it('steps aside for an overlay only while the overlay meets it and shows', async () => {
    mount()
    await settle()
    const notice = document.createElement('div')
    document.body.append(notice)
    // Reactive, as an overlay's own state is.
    const showing = new SvelteMap([['now', false]])
    overlays.set(notice, { x: 200, y: 100, width: 50, height: 20 })
    const detach = web.cover(() => showing.get('now') === true)(notice)
    await settle()
    expect(api.hide).not.toHaveBeenCalled()

    showing.set('now', true)
    await settle()
    expect(api.hide).toHaveBeenLastCalledWith('p', CLAIM, true)

    // Moved away (it resized, or its transition ended): the page comes back.
    overlays.set(notice, { x: 400, y: 0, width: 50, height: 20 })
    notice.dispatchEvent(new Event('transitionend'))
    api.show.mockClear()
    await settle()
    expect(api.show).toHaveBeenCalledWith('p', CLAIM, BODY)

    overlays.set(notice, { x: 0, y: 0, width: 50, height: 50 })
    notice.dispatchEvent(new Event('transitionend'))
    await settle()
    expect(screen.getByTestId('web').dataset.showing).toBe('false')
    if (typeof detach === 'function') detach()
    await settle()
    expect(screen.getByTestId('web').dataset.showing).toBe('true')
    notice.remove()
  })

  it('hides its view when moved (the pane stays) and closes it when the pane is gone', async () => {
    const moved = mount()
    await settle()
    moved.unmount()
    await settle()
    expect(api.hide).toHaveBeenLastCalledWith('p', CLAIM, false)
    expect(api.close).not.toHaveBeenCalled()

    const closed = mount()
    await settle()
    layout.tree = { version: LAYOUT_VERSION, root: { kind: 'pane', id: 'q', widget: 'clock' } }
    closed.unmount()
    await settle()
    expect(api.close).toHaveBeenCalledWith('p', CLAIM)
  })

  it("speaks for its own mount only: a moved pane's old component cannot hide the new one's page", async () => {
    const old = mount()
    await settle()
    const fresh = mount()
    await settle()
    const oldClaim = api.open.mock.calls[0]?.[1]
    const freshClaim = api.open.mock.calls[1]?.[1]
    expect(oldClaim).not.toBe(freshClaim)
    expect(api.show).toHaveBeenLastCalledWith('p', freshClaim, BODY)

    // The old one goes last; what it says carries its own claim, which main ignores.
    old.unmount()
    await settle()
    expect(api.hide).toHaveBeenLastCalledWith('p', oldClaim, false)
    expect(api.hide).not.toHaveBeenCalledWith('p', freshClaim, expect.anything())
    fresh.unmount()
  })

  it('opens once per mount, though saving the page gives its pane a new node', async () => {
    // Through the real pane host, whose props follow the node object.
    const view = render(LayoutNodeView, { props: { node: layout.tree.root } })
    await settle()
    expect(api.open).toHaveBeenCalledTimes(1)
    states.get('p')?.(stateOf('p', 'https://www.youtube.com/watch?v=2'))
    await settle()
    const saved = layout.tree.root
    expect(saved.kind === 'pane' && saved.state).toEqual({
      url: 'https://www.youtube.com/watch?v=2',
    })
    await view.rerender({ node: saved })
    await settle()
    expect(api.open).toHaveBeenCalledTimes(1)
    expect(api.hide).not.toHaveBeenCalled()
    expect(api.show).toHaveBeenCalledTimes(1)
    view.unmount()
  })

  it('keeps where the page went in pane state, and shows its title', async () => {
    mount()
    await settle()
    states.get('p')?.(stateOf('p', 'https://www.youtube.com/watch?v=2', { title: 'Video two' }))
    await settle()
    const node = layout.tree.root.kind === 'pane' ? layout.tree.root : null
    expect(node?.state).toEqual({ url: 'https://www.youtube.com/watch?v=2' })
    expect(screen.getByTestId('web-where').textContent).toBe('www.youtube.com/watch')
  })

  it('marks an error and shows why', async () => {
    mount()
    await settle()
    states.get('p')?.(stateOf('p', 'https://www.youtube.com/', { error: 'ERR_NAME_NOT_RESOLVED' }))
    await settle()
    expect(screen.getByTestId('web-error').textContent).toBe('ERR_NAME_NOT_RESOLVED')
  })

  it('in the browser, shows nothing until an address is opened', async () => {
    layout.tree = {
      version: LAYOUT_VERSION,
      root: { kind: 'pane', id: 'p', widget: 'web.browser' },
    }
    mount({ widget: 'web.browser' })
    await settle()
    expect(api.open).toHaveBeenCalledWith('p', CLAIM, 'web.browser', null)
    expect(api.show).not.toHaveBeenCalled()
    expect(screen.getByTestId('web-empty')).toBeTruthy()
    expect(screen.queryByTestId('web-home')).toBeNull()

    const input = screen.getByTestId('web-address') as HTMLInputElement
    input.value = 'example.com'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.form?.requestSubmit()
    await settle()
    expect(api.command).toHaveBeenCalledWith('p', { t: 'address', input: 'example.com' })

    states.get('p')?.(stateOf('p', 'https://example.com/'))
    await settle()
    expect(api.show).toHaveBeenCalledWith('p', CLAIM, BODY)
    expect(input.value).toBe('https://example.com/')
  })

  it('sends the navigation buttons as commands', async () => {
    mount()
    await settle()
    states.get('p')?.(stateOf('p', 'https://www.youtube.com/', { canGoBack: true }))
    await settle()
    screen.getByTestId('web-back').click()
    screen.getByTestId('web-home').click()
    screen.getByTestId('web-reload').click()
    screen.getByTestId('web-external').click()
    expect(
      api.command.mock.calls
        .map((call) => call[1] as { t: string })
        .filter((command) => command.t !== 'tint'),
    ).toEqual([{ t: 'back' }, { t: 'home' }, { t: 'reload' }, { t: 'external' }])
    expect((screen.getByTestId('web-forward') as HTMLButtonElement).disabled).toBe(true)
  })

  it('hands the keyboard to the page when focused from afar, not when pressed', async () => {
    const view = mount()
    await settle()
    await view.rerender({ active: true })
    await settle()
    expect(api.focus).toHaveBeenCalledWith('p')

    api.focus.mockClear()
    await view.rerender({ active: false })
    screen.getByTestId('web').dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await view.rerender({ active: true })
    await settle()
    expect(api.focus).not.toHaveBeenCalled()

    // Nor when the press was on the pane's title, outside the widget: that may be a drag.
    await view.rerender({ active: false })
    const title = document.createElement('header')
    document.body.append(title)
    title.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await view.rerender({ active: true })
    await settle()
    expect(api.focus).not.toHaveBeenCalled()
    title.remove()
  })

  it('tells main how to draw pages while a web pane is mounted', async () => {
    appearance.settings = { ...appearance.settings, theme: 'tron', web: { tint: true } }
    const first = mount()
    await settle()
    expect(api.setAppearance).toHaveBeenCalledTimes(1)
    expect(api.setAppearance.mock.calls[0]?.[0]).toMatchObject({
      accent: expect.stringMatching(/^#[0-9a-f]{6}$/),
      tint: true,
    })

    appearance.settings = { ...appearance.settings, web: { tint: false } }
    await settle()
    expect(api.setAppearance).toHaveBeenLastCalledWith(expect.objectContaining({ tint: false }))

    first.unmount()
    api.setAppearance.mockClear()
    appearance.settings = { ...appearance.settings, web: { tint: true } }
    await settle()
    expect(api.setAppearance).not.toHaveBeenCalled()
  })

  it('has a switch for its own tint, which follows the setting until it is used', async () => {
    appearance.settings = { ...appearance.settings, theme: 'tron', web: { tint: true } }
    // Through the real pane host, so the pane's own answer reaches it back as a prop.
    const view = render(LayoutNodeView, { props: { node: layout.tree.root } })
    await settle()
    const button = screen.getByTestId('web-tint')
    expect(button.getAttribute('aria-pressed')).toBe('true')
    // Nothing of its own yet: main is told to follow the setting.
    expect(api.command).toHaveBeenLastCalledWith('p', { t: 'tint', on: null })

    button.click()
    await view.rerender({ node: layout.tree.root })
    await settle()
    expect(api.command).toHaveBeenLastCalledWith('p', { t: 'tint', on: false })
    expect(screen.getByTestId('web-tint').getAttribute('aria-pressed')).toBe('false')
    const node = layout.tree.root.kind === 'pane' ? layout.tree.root : null
    expect(node?.state).toMatchObject({ tint: false })

    // Its own answer stands while the setting changes under it.
    api.command.mockClear()
    appearance.settings = { ...appearance.settings, web: { tint: false } }
    await settle()
    expect(screen.getByTestId('web-tint').getAttribute('aria-pressed')).toBe('false')
    expect(api.command).not.toHaveBeenCalled()

    screen.getByTestId('web-tint').click()
    await view.rerender({ node: layout.tree.root })
    await settle()
    expect(api.command).toHaveBeenLastCalledWith('p', { t: 'tint', on: true })
    expect(screen.getByTestId('web-tint').getAttribute('aria-pressed')).toBe('true')
    view.unmount()
  })

  it('offers no tint in a theme that shows sites in their own colours', async () => {
    appearance.settings = { ...appearance.settings, theme: 'business-dark', web: { tint: true } }
    mount()
    await settle()
    const button = screen.getByTestId('web-tint') as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(button.getAttribute('aria-pressed')).toBe('false')
    appearance.settings = { ...appearance.settings, theme: 'tron' }
    await settle()
    expect((screen.getByTestId('web-tint') as HTMLButtonElement).disabled).toBe(false)
  })

  it('takes a fresh picture of a hidden view whose colours changed', async () => {
    mount()
    await settle()
    ui.openSettings()
    await settle()
    expect(screen.getByTestId('web-snapshot').getAttribute('src')).toBe(
      'data:image/jpeg;base64,AAAA',
    )

    pictures.get('p')?.('data:image/jpeg;base64,BBBB')
    await settle()
    expect(screen.getByTestId('web-snapshot').getAttribute('src')).toBe(
      'data:image/jpeg;base64,BBBB',
    )
  })
})
