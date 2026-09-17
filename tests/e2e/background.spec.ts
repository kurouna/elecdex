import { spawn } from 'node:child_process'
import type { ElectronApplication, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import electronPath from 'electron'
import { launch, MAIN } from './support.js'

/**
 * Running in the background (Windows): closing and minimising to the
 * notification area, the system-wide shortcut, the sign-in entry and a hidden
 * start. The tray, the shortcut registry and the Run key are main's in-memory
 * stubs (ELECDEX_BACKGROUND_STUB), driven through globalThis.__elecdexBackground.
 */

test.skip(process.platform !== 'win32', 'running in the background is Windows only for now')

/** One pane and no audio, so the only window is the elecdex window. */
const SINGLE_CLOCK = { version: 1, root: { kind: 'pane', id: 'c', widget: 'clock' } } as const

interface Hooks {
  pressShortcut(): void
  registered(): string[]
  take(accelerator: string): void
  tray: { visible: boolean; click(): void; menu(): string[]; choose(label: string): void }
  runKey: {
    entry: { args: string[]; enabled: boolean } | null
    writes: number
    setEnabled(enabled: boolean): void
  }
  hintsShown(): number
}

/** Runs `fn` against the main process's background stubs. */
function hooks<T>(app: ElectronApplication, fn: (hooks: Hooks) => T, arg?: unknown): Promise<T> {
  return app.evaluate(
    (_electron, [source, value]) => {
      const bound = (globalThis as unknown as { __elecdexBackground: Hooks }).__elecdexBackground
      // The test's own function, sent across as text.
      const run = new Function(`return (${source})`)() as (h: Hooks, v: unknown) => T
      return run(bound, value)
    },
    [fn.toString(), arg] as const,
  )
}

const facts = (app: ElectronApplication) =>
  app.evaluate(({ BrowserWindow }) => {
    const [win] = BrowserWindow.getAllWindows()
    return {
      visible: win?.isVisible() ?? false,
      minimized: win?.isMinimized() ?? false,
    }
  })

/** Whether the page was told its window is off screen, which stops its frame loop. */
const visibility = (page: Page) =>
  page.evaluate(() =>
    window.elecdex.system.windowState().then((state) => (state.hidden ? 'hidden' : 'visible')),
  )

const closeWindow = (app: ElectronApplication) =>
  app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.close())

const minimizeWindow = (app: ElectronApplication) =>
  app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.minimize())

function exited(app: ElectronApplication): Promise<void> {
  const child = app.process()
  if (child.exitCode !== null) return Promise.resolve()
  return new Promise((resolve) => child.once('exit', () => resolve()))
}

const withWindow = (options: Record<string, boolean>) => ({
  sound: { enabled: false },
  window: options,
})

test('by default, closing quits and minimising stays on the taskbar, with no tray icon', async () => {
  const { app, close } = await launch(undefined, { layout: SINGLE_CLOCK })
  try {
    expect(await hooks(app, (h) => h.tray.visible)).toBe(false)
    expect(await hooks(app, (h) => h.registered())).toEqual([])
    await minimizeWindow(app)
    await expect.poll(async () => (await facts(app)).minimized).toBe(true)
    expect(await hooks(app, (h) => h.tray.visible)).toBe(false)
    // Still on the taskbar: restoring needs no tray.
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.restore())
    await expect.poll(() => facts(app)).toEqual({ visible: true, minimized: false })

    const gone = exited(app)
    await closeWindow(app)
    await gone
  } finally {
    await close().catch(() => {})
  }
})

test('closing hides to the tray, which opens it again and quits it', async () => {
  const { app, page, close } = await launch(undefined, {
    layout: SINGLE_CLOCK,
    settings: withWindow({ closeToTray: true }),
  })
  try {
    // The icon is there while the option is on, not only once the window is hidden.
    expect(await hooks(app, (h) => h.tray.visible)).toBe(true)
    expect(await hooks(app, (h) => h.tray.menu())).toEqual([
      'Open elecdex',
      'Settings',
      'Quit elecdex',
    ])
    expect(await hooks(app, (h) => h.hintsShown())).toBe(0)

    await closeWindow(app)
    await expect.poll(() => facts(app)).toEqual({ visible: false, minimized: false })
    expect(app.process().exitCode).toBeNull()
    // Hidden, the page is told, so its frame loop stops.
    await expect.poll(() => visibility(page)).toBe('hidden')
    expect(await hooks(app, (h) => h.hintsShown())).toBe(1)

    // A click opens; a second click does not hide it again (as in Teams or Slack).
    await hooks(app, (h) => h.tray.click())
    await expect.poll(() => facts(app)).toEqual({ visible: true, minimized: false })
    await expect.poll(() => visibility(page)).toBe('visible')
    await hooks(app, (h) => h.tray.click())
    expect(await facts(app)).toEqual({ visible: true, minimized: false })

    // The hint is shown once ever, not on every close.
    await closeWindow(app)
    await expect.poll(() => facts(app)).toEqual({ visible: false, minimized: false })
    expect(await hooks(app, (h) => h.hintsShown())).toBe(1)

    // "Settings" brings the window back with the dialog open.
    await hooks(app, (h) => h.tray.choose('Settings'))
    await expect.poll(() => facts(app)).toEqual({ visible: true, minimized: false })
    await expect(page.getByTestId('settings-dialog')).toBeVisible()

    const gone = exited(app)
    await hooks(app, (h) => h.tray.choose('Quit elecdex'))
    await gone
  } finally {
    await close().catch(() => {})
  }
})

test('the quit shortcut quits even when closing only hides', async () => {
  const { app, page, close } = await launch(undefined, {
    layout: SINGLE_CLOCK,
    settings: withWindow({ closeToTray: true, minimizeToTray: true }),
  })
  try {
    const gone = exited(app)
    await page.evaluate(() => window.elecdex.system.quit())
    await gone
  } finally {
    await close().catch(() => {})
  }
})

test('minimising hides to the tray and opening restores the window', async () => {
  const { app, page, close } = await launch(undefined, {
    layout: SINGLE_CLOCK,
    settings: withWindow({ minimizeToTray: true }),
  })
  try {
    expect(await hooks(app, (h) => h.tray.visible)).toBe(true)
    // The page's own minimise (the shortcut and the fullscreen corner) goes the same way.
    await page.evaluate(() => window.elecdex.system.minimize())
    await expect.poll(async () => (await facts(app)).visible).toBe(false)
    await expect.poll(() => visibility(page)).toBe('hidden')
    expect(await hooks(app, (h) => h.hintsShown())).toBe(1)

    await hooks(app, (h) => h.tray.choose('Open elecdex'))
    await expect.poll(() => facts(app)).toEqual({ visible: true, minimized: false })
    await expect.poll(() => visibility(page)).toBe('visible')

    // Closing still quits: only minimising was chosen.
    const gone = exited(app)
    await closeWindow(app)
    await gone
  } finally {
    await close().catch(() => {})
  }
})

test('turning a tray option off removes the icon, unless the window is hidden', async () => {
  const { app, page, close } = await launch(undefined, {
    layout: SINGLE_CLOCK,
    settings: withWindow({ closeToTray: true }),
  })
  try {
    await closeWindow(app)
    await expect.poll(async () => (await facts(app)).visible).toBe(false)
    await page.evaluate(() => window.elecdex.settings.patch({ window: { closeToTray: false } }))
    // Hidden, the icon is the way back.
    expect(await hooks(app, (h) => h.tray.visible)).toBe(true)
    await hooks(app, (h) => h.tray.click())
    await expect.poll(async () => (await facts(app)).visible).toBe(true)
    await expect.poll(() => hooks(app, (h) => h.tray.visible)).toBe(false)
  } finally {
    await close()
  }
})

test('the system-wide shortcut is off until turned on, and then shows and hides', async () => {
  const { app, page, close } = await launch(undefined, {
    layout: SINGLE_CLOCK,
    settings: withWindow({ closeToTray: true }),
  })
  try {
    await page.keyboard.press('Control+Shift+Period')
    await page.locator('[data-testid=settings-section][data-section=window]').click()
    const box = page.getByTestId('settings-global-shortcut')
    await expect(box).not.toBeChecked()
    // The keys are in plain sight before the user turns them on.
    await expect(page.getByTestId('settings-global-shortcut-chord')).toHaveText('Ctrl+Alt+Shift+E')
    // Not in the app's own shortcut list.
    await page.locator('[data-testid=settings-section][data-section=keyboard]').click()
    await expect(page.locator('[data-testid=keybinding][data-action="window.toggle"]')).toHaveCount(
      0,
    )
    await page.locator('[data-testid=settings-section][data-section=window]').click()
    expect(await hooks(app, (h) => h.registered())).toEqual([])

    await box.check()
    await expect
      .poll(() => hooks(app, (h) => h.registered()))
      .toEqual(['CommandOrControl+Alt+Shift+E'])
    await expect(page.getByTestId('settings-global-shortcut-problem')).toHaveCount(0)
    await page.keyboard.press('Escape')

    // Hidden: the shortcut brings it back.
    await closeWindow(app)
    await expect.poll(async () => (await facts(app)).visible).toBe(false)
    await hooks(app, (h) => h.pressShortcut())
    await expect.poll(() => facts(app)).toEqual({ visible: true, minimized: false })

    // In front: the shortcut puts it away, to the tray as closing does.
    const focused = await app.evaluate(({ BrowserWindow }) => {
      const [win] = BrowserWindow.getAllWindows()
      win?.focus()
      return win?.isFocused() ?? false
    })
    if (focused) {
      await hooks(app, (h) => h.pressShortcut())
      await expect.poll(async () => (await facts(app)).visible).toBe(false)
      await hooks(app, (h) => h.pressShortcut())
      await expect.poll(async () => (await facts(app)).visible).toBe(true)
    }

    // New keys replace the old ones.
    await page.evaluate(() =>
      window.elecdex.settings.patch({ keybindings: { 'window.toggle': 'Ctrl+Alt+KeyF' } }),
    )
    await expect.poll(() => hooks(app, (h) => h.registered())).toEqual(['CommandOrControl+Alt+F'])
    // And turning it off releases them.
    await page.evaluate(() => window.elecdex.settings.patch({ window: { globalShortcut: false } }))
    await expect.poll(() => hooks(app, (h) => h.registered())).toEqual([])
  } finally {
    await close()
  }
})

test('keys another app holds turn the shortcut back off, and say so', async () => {
  const { app, page, close } = await launch(undefined, { layout: SINGLE_CLOCK })
  try {
    await hooks(app, (h) => h.take('CommandOrControl+Alt+Shift+E'))
    await page.keyboard.press('Control+Shift+Period')
    await page.locator('[data-testid=settings-section][data-section=window]').click()
    const box = page.getByTestId('settings-global-shortcut')
    // Not check(): the box is turned back off at once.
    await box.click()
    await expect(page.getByTestId('settings-global-shortcut-problem')).toHaveText(
      /in use by another app/i,
    )
    await expect(box).not.toBeChecked()
    const saved = await page.evaluate(() => window.elecdex.settings.get())
    expect(saved.window.globalShortcut).toBe(false)

    // Other keys, recorded here: punctuation is refused for a system-wide shortcut.
    await page.getByTestId('settings-global-shortcut-chord').click()
    await page.keyboard.press('Control+Alt+Period')
    await expect(page.getByText(/use a letter, a digit or a function key/i)).toBeVisible()
    await page.keyboard.press('Control+Alt+Shift+KeyD')
    await expect(page.getByTestId('settings-global-shortcut-chord')).toHaveText('Ctrl+Alt+Shift+D')
    await expect(page.getByTestId('settings-global-shortcut-problem')).toHaveCount(0)
    await box.check()
    await expect
      .poll(() => hooks(app, (h) => h.registered()))
      .toEqual(['CommandOrControl+Alt+Shift+D'])
    await expect(box).toBeChecked()
  } finally {
    await close()
  }
})

test('new keys another app holds turn the shortcut off too, recorded or reset', async () => {
  const { app, page, close } = await launch(undefined, {
    layout: SINGLE_CLOCK,
    settings: {
      sound: { enabled: false },
      window: { globalShortcut: true },
      keybindings: { 'window.toggle': 'Ctrl+Alt+Shift+KeyD' },
    },
  })
  try {
    await expect
      .poll(() => hooks(app, (h) => h.registered()))
      .toEqual(['CommandOrControl+Alt+Shift+D'])
    await hooks(app, (h) => h.take('CommandOrControl+Alt+Shift+F'))
    await hooks(app, (h) => h.take('CommandOrControl+Alt+Shift+E'))
    await page.keyboard.press('Control+Shift+Period')
    await page.locator('[data-testid=settings-section][data-section=window]').click()
    const box = page.getByTestId('settings-global-shortcut')
    const problem = page.getByTestId('settings-global-shortcut-problem')
    await expect(box).toBeChecked()

    // Recorded keys that cannot be had: off, with the reason, rather than on and doing nothing.
    await page.getByTestId('settings-global-shortcut-chord').click()
    await page.keyboard.press('Control+Alt+Shift+KeyF')
    await expect(problem).toHaveText(/in use by another app/i)
    await expect(box).not.toBeChecked()
    await expect
      .poll(async () => (await page.evaluate(() => window.elecdex.settings.get())).window)
      .toMatchObject({ globalShortcut: false })
    expect(await hooks(app, (h) => h.registered())).toEqual([])

    // Free keys, recorded while off, then turned on.
    await page.getByTestId('settings-global-shortcut-chord').click()
    await page.keyboard.press('Control+Alt+Shift+KeyG')
    await expect(problem).toHaveCount(0)
    await box.check()
    await expect
      .poll(() => hooks(app, (h) => h.registered()))
      .toEqual(['CommandOrControl+Alt+Shift+G'])
    // The same through the default button, whose keys are taken as well.
    await page.getByTestId('settings-global-shortcut-reset').click()
    await expect(problem).toHaveText(/in use by another app/i)
    await expect(box).not.toBeChecked()
  } finally {
    await close()
  }
})

test('the sign-in entry follows the switch, the start option and Task Manager', async () => {
  const { app, page, close } = await launch(undefined, { layout: SINGLE_CLOCK })
  try {
    await page.keyboard.press('Control+Shift+Period')
    await page.locator('[data-testid=settings-section][data-section=window]').click()
    const login = page.getByTestId('settings-launch-at-login')
    const background = page.getByTestId('settings-start-in-background')
    await expect(login).not.toBeChecked()
    await expect(login).toBeEnabled()
    // Only with the sign-in entry, and off until chosen.
    await expect(background).toBeDisabled()
    await expect(background).not.toBeChecked()
    expect(await hooks(app, (h) => h.runKey.entry)).toBeNull()

    await login.check()
    await expect
      .poll(() => hooks(app, (h) => h.runKey.entry))
      .toMatchObject({
        args: [],
        enabled: true,
      })
    await expect(background).toBeEnabled()
    await background.check()
    await expect.poll(() => hooks(app, (h) => h.runKey.entry?.args)).toEqual(['--hidden'])
    // Other settings leave the Run key alone.
    const writes = await hooks(app, (h) => h.runKey.writes)
    await page.evaluate(() => window.elecdex.settings.patch({ motion: 'reduced' }))
    await page.evaluate(() => window.elecdex.settings.patch({ window: { closeToTray: true } }))
    expect(await hooks(app, (h) => h.runKey.writes)).toBe(writes)
    await background.uncheck()
    await expect.poll(() => hooks(app, (h) => h.runKey.entry?.args)).toEqual([])

    // Turned off in Task Manager: shown as off, with the reason, on the next opening.
    await hooks(app, (h) => h.runKey.setEnabled(false))
    await page.keyboard.press('Escape')
    await page.keyboard.press('Control+Shift+Period')
    await expect(login).not.toBeChecked()
    await expect(page.getByTestId('settings-launch-note')).toHaveText(/Task Manager/)
    await login.check()
    await expect.poll(() => hooks(app, (h) => h.runKey.entry?.enabled)).toBe(true)
    await expect(page.getByTestId('settings-launch-note')).toHaveCount(0)

    await login.uncheck()
    await expect.poll(() => hooks(app, (h) => h.runKey.entry)).toBeNull()
    await expect(background).toBeDisabled()
  } finally {
    await close()
  }
})

test('a start in the background stays hidden until opened, and skips the intro', async () => {
  const { app, page, userData, close } = await launch(undefined, {
    layout: SINGLE_CLOCK,
    intro: true,
    args: ['--hidden'],
  })
  try {
    expect(await facts(app)).toEqual({ visible: false, minimized: false })
    expect(await hooks(app, (h) => h.tray.visible)).toBe(true)
    expect((await page.evaluate(() => window.elecdex.system.info())).intro).toBe(false)
    await expect.poll(() => visibility(page)).toBe('hidden')

    // Starting elecdex again from the Start menu brings this one forward -
    // but another sign-in start does not.
    const again = (extra: string[]) =>
      new Promise<void>((resolve) => {
        const child = spawn(
          electronPath as unknown as string,
          [MAIN, '--windowed', `--user-data-dir=${userData}`, ...extra],
          { env: { ...process.env, ELECDEX_BACKGROUND_STUB: '1' }, stdio: 'ignore' },
        )
        child.once('exit', () => resolve())
      })
    await again(['--hidden'])
    await page.waitForTimeout(500)
    expect((await facts(app)).visible).toBe(false)
    await again([])
    await expect.poll(() => facts(app)).toEqual({ visible: true, minimized: false })
    await expect.poll(() => visibility(page)).toBe('visible')
    // The option is off, so the icon goes once the window is out.
    await expect.poll(() => hooks(app, (h) => h.tray.visible)).toBe(false)
  } finally {
    await close()
  }
})
