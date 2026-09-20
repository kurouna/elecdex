import { flushSync, mount, unmount } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { appearance } from '../../src/renderer/stores/appearance.svelte.ts'
import { background } from '../../src/renderer/stores/background.svelte.ts'
import WindowCorner from '../../src/renderer/WindowCorner.svelte'
import { backgroundCapabilities } from '../../src/shared/background.ts'
import { defaultSettings } from '../../src/shared/settings.ts'

/**
 * The controls that slide down in fullscreen, where the window has no frame of
 * its own: what their close button does.
 *
 * Closing means here what it means on an ordinary window, so where the machine
 * can keep elecdex running outside the window it hides at one click, and
 * otherwise it asks first. The end-to-end test for it can only run on Windows
 * (tests/e2e/background.spec.ts); this covers the other platforms, where the
 * option may be in the file without the machine being able to act on it, and a
 * setting changed while the controls are on screen.
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
  background.state = null
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

  it('asks where the machine cannot put the window away, option or not', () => {
    // settings.json carries the option everywhere - it travels between machines -
    // but a Linux desktop with nowhere to put an icon does not act on it.
    const button = show('linux', true)
    expect(button.title).toMatch(/quit/i)
    button.click()
    closeButton().click()
    expect(quit).toHaveBeenCalledOnce()
    expect(closeWindow).not.toHaveBeenCalled()
  })

  it('is not there at all on macOS, which draws its own fullscreen controls', () => {
    background.state = {
      capabilities: backgroundCapabilities({ platform: 'darwin' }),
      loginItem: { available: false, registered: false, disabledByOs: false },
      shortcut: { state: 'off', chord: null },
    }
    expect(() => show('darwin', true)).toThrow(/no close button/)
  })

  it('hides on a Linux desktop that does have a tray', () => {
    background.state = {
      capabilities: backgroundCapabilities({ platform: 'linux', trayAvailable: true }),
      loginItem: { available: false, registered: false, disabledByOs: false },
      shortcut: { state: 'off', chord: null },
    }
    const button = show('linux', true)
    expect(button.title).toMatch(/system tray/i)
    button.click()
    expect(closeWindow).toHaveBeenCalledOnce()
    expect(quit).not.toHaveBeenCalled()
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
