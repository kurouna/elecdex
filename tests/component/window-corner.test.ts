import { flushSync, mount, unmount } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { appearance } from '../../src/renderer/stores/appearance.svelte.ts'
import WindowCorner from '../../src/renderer/WindowCorner.svelte'
import { defaultSettings } from '../../src/shared/settings.ts'

/**
 * The controls that slide down in fullscreen, where the window has no frame of
 * its own: what their close button does.
 *
 * Closing means here what it means on an ordinary window, so with "keep running
 * in the notification area" on it hides at one click and otherwise it asks
 * first. The end-to-end test for it can only run on Windows (tests/e2e/background.spec.ts);
 * this covers the other platforms, where the option is in the file but not
 * acted on, and a setting changed while the controls are on screen.
 */

const quit = vi.fn()
const closeWindow = vi.fn()
let component: Record<string, unknown> | null = null

class FakeResizeObserver {
  observe(): void {}
  disconnect(): void {}
}

function show(platform: NodeJS.Platform, closeToTray: boolean): HTMLElement {
  vi.stubGlobal('elecdex', {
    system: {
      platform,
      quit,
      closeWindow,
      minimize: () => {},
      setFullscreen: () => {},
      windowState: () => Promise.resolve({ fullscreen: true, hidden: false }),
      onWindowState: () => () => {},
    },
  })
  appearance.settings = {
    ...defaultSettings(),
    // Interface sounds would need an audio context that jsdom has not got.
    sound: { enabled: false, volume: 0 },
    window: { ...defaultSettings().window, closeToTray },
  }
  component = mount(WindowCorner, { target: document.body }) as Record<string, unknown>
  const button = document.querySelector<HTMLElement>('[data-testid=window-quit]')
  if (button === null) throw new Error('no close button')
  return button
}

/** The button as it is after the click or setting change just made. */
const closeButton = (): HTMLElement => {
  flushSync()
  const button = document.querySelector<HTMLElement>('[data-testid=window-quit]')
  if (button === null) throw new Error('no close button')
  return button
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', FakeResizeObserver)
  quit.mockClear()
  closeWindow.mockClear()
})

afterEach(() => {
  if (component !== null) unmount(component)
  component = null
  appearance.settings = defaultSettings()
  document.body.replaceChildren()
  vi.unstubAllGlobals()
})

describe('the fullscreen corner close button', () => {
  it('hides at one click, without asking, when closing keeps elecdex running', () => {
    const button = show('win32', true)
    expect(button.title).toMatch(/notification area/i)
    button.click()
    expect(closeWindow).toHaveBeenCalledOnce()
    expect(quit).not.toHaveBeenCalled()
    // Nothing to confirm: the button is unchanged and one click was enough.
    expect(closeButton().textContent?.trim()).toBe('✕')
  })

  it('asks before quitting when closing ends elecdex', () => {
    const button = show('win32', false)
    expect(button.title).toMatch(/quit/i)
    button.click()
    expect(quit).not.toHaveBeenCalled()
    expect(closeButton().textContent).toMatch(/click again to exit/i)
    closeButton().click()
    expect(quit).toHaveBeenCalledOnce()
    expect(closeWindow).not.toHaveBeenCalled()
  })

  it('asks on the platforms that do not run in the background, option or not', () => {
    // settings.json carries the option everywhere; only Windows acts on it.
    const button = show('linux', true)
    expect(button.title).toMatch(/quit/i)
    button.click()
    closeButton().click()
    expect(quit).toHaveBeenCalledOnce()
    expect(closeWindow).not.toHaveBeenCalled()
  })

  it('follows the setting while the controls are on screen', () => {
    show('win32', false)
    appearance.settings = {
      ...appearance.settings,
      window: { ...appearance.settings.window, closeToTray: true },
    }
    expect(closeButton().title).toMatch(/notification area/i)
    closeButton().click()
    expect(closeWindow).toHaveBeenCalledOnce()
    expect(quit).not.toHaveBeenCalled()

    appearance.settings = {
      ...appearance.settings,
      window: { ...appearance.settings.window, closeToTray: false },
    }
    expect(closeButton().title).toMatch(/quit/i)
    closeButton().click()
    expect(closeButton().textContent).toMatch(/click again to exit/i)
  })
})
