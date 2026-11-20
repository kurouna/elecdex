import { readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import { shellReady } from '../support/terminal.js'
import {
  exited,
  keepLayout,
  launch,
  NO_SWITCH_PROMPT,
  SINGLE_TERMINAL,
  showStatusBar,
  terminalPane,
  typeInto,
} from '../support.js'

/** node-pty's drain before it ends a worker (FLUSH_DATA_INTERVAL), with room to spare. */
const WORKER_DRAIN_MS = 1500
/**
 * The quit after a shell ended by itself and its worker's drain, at most: QUIT_WAIT_MS and more
 * when the worker is left on. Measured (2026-11-19): about 250 ms ended, about 2240 ms left on.
 */
const QUIT_LIMIT_MS = 1500

/**
 * Leaving the app. In fullscreen the window has no frame and no close button,
 * so the app has to provide its own way out.
 */

test('the exit button asks for a second click, then quits', async () => {
  const { app, page, close } = await launch()
  try {
    await showStatusBar(page)
    const button = page.getByTestId('exit')
    await button.click()
    await expect(button).toHaveText(/click again/i)
    await expect(button).toHaveClass(/armed/)

    // The first click alone does not quit, and the confirmation lapses.
    await expect(button).not.toHaveClass(/armed/, { timeout: 6000 })
    expect(app.process().exitCode).toBeNull()

    const gone = exited(app)
    await button.click()
    await button.click()
    await gone
  } finally {
    await close().catch(() => {})
  }
})

test('a window still asking for sessions while the app quits gets an answer', async () => {
  const { app, page, close } = await launch()
  try {
    const stderr: string[] = []
    app.process().stderr?.on('data', (chunk: Buffer) => stderr.push(chunk.toString()))
    // What the orphan reaper or a mounting pane does if its moment falls in the quit:
    // the page is still open after before-quit, until its window closes.
    await page.evaluate(() => {
      window.addEventListener('beforeunload', () => {
        void window.elecdex.pty.list()
        void window.elecdex.settings.startDirectory()
      })
    })
    const gone = exited(app)
    await page.evaluate(() => window.elecdex.system.quit())
    await gone
    expect(stderr.join('')).not.toMatch(/No handler registered/)
  } finally {
    await close().catch(() => {})
  }
})

test('Ctrl+Shift+Q asks first, even with a terminal focused: no stays, yes quits', async () => {
  // Answering yes needed the mouse until ← and → chose (lib/question-keys.ts): found by hand.
  // Q lies under 1 and 2: a slip while switching layouts with Ctrl+Shift+1..9 quit at once.
  const { app, page, close } = await launch()
  try {
    const shell = page
      .locator('[data-testid=pane][data-widget=terminal]:not(.hidden) .xterm-helper-textarea')
      .first()
    await shell.focus()
    const dialog = page.getByTestId('quit-dialog')
    await page.keyboard.press('Control+Shift+KeyQ')
    await expect(dialog).toBeVisible()
    // The keyboard starts on no, out of the shell: a stray Enter stays.
    await expect(page.getByTestId('quit-no')).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(dialog).toHaveCount(0)
    expect(await page.evaluate(() => document.visibilityState)).toBe('visible')
    // And the shell has the keyboard again: it was left on nothing (found in review).
    await expect(shell).toBeFocused()
    await page.keyboard.press('Control+Shift+KeyQ')
    await expect(dialog).toBeVisible()
    // Answered from the keyboard alone: → to yes, back to no and over again, then Enter.
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('quit-yes')).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('quit-no')).toBeFocused()
    await page.keyboard.press('ArrowRight')
    const gone = exited(app)
    // The window can close before the key's release is delivered, which rejects it.
    await page.keyboard.press('Enter').catch(() => {})
    await gone
  } finally {
    await close().catch(() => {})
  }
})

test('shells opened and ended through layout switches leave a quit that ends cleanly', async () => {
  // Found by hand (2026-11-19): after shells had come and gone with the layouts, the app crashed
  // on its way out (0xC0000409, after the node environment's exit), and Windows held the dying
  // process for its error report - a quit of seconds, and an exit code that is not 0. Here the
  // output workers still being torn down did it five quits in six. GitHub's Windows runners kept
  // crashing about one quit in ten after that was fixed: their crash dumps showed node-pty
  // delivering a killed shell's exit notice while node freed its environment (native-exit.ts).
  // Three rounds.
  test.setTimeout(150_000)
  for (let round = 1; round <= 3; round++) {
    const { app, page, close } = await launch(undefined, {
      layout: SINGLE_TERMINAL,
      settings: NO_SWITCH_PROMPT,
    })
    // What main says on its way out, in the failure: a crash on CI is otherwise only its code.
    const said: string[] = []
    app.process().stderr?.on('data', (chunk: Buffer) => said.push(chunk.toString()))
    try {
      const split = async () => {
        const before = await terminalPane(page).count()
        await terminalPane(page).first().locator('.xterm-helper-textarea').first().focus()
        await page.keyboard.press('Control+Shift+KeyE')
        await expect(terminalPane(page)).toHaveCount(before + 1)
      }
      await keepLayout(page, 'one')
      await keepLayout(page, 'two')
      await split()
      await split()
      await page.keyboard.press('Control+Shift+Digit1')
      await expect(terminalPane(page)).toHaveCount(1)
      await page.keyboard.press('Control+Shift+Digit2')
      await expect(terminalPane(page)).toHaveCount(3)
      await page.keyboard.press('Control+Shift+Backspace')
      await expect(page.locator('[data-testid=pane]')).toHaveCount(17)
      await page.keyboard.press('Control+Shift+Digit2')
      await expect(terminalPane(page)).toHaveCount(3)

      const child = app.process()
      // Not past fifteen seconds: a crash held by the error report took twenty and more.
      const code = new Promise<number | string | null>((resolve) => {
        child.once('exit', (exitCode) => resolve(exitCode))
        setTimeout(() => resolve('still running after 15 s'), 15_000)
      })
      const started = Date.now()
      await page.evaluate(() => window.elecdex.system.quit())
      expect(await code, `round ${round}: the exit code; main said: ${said.join('')}`).toBe(0)
      // The shells' wait (QUIT_WAIT_MS at most: 1 s here, up to 3.4 s on GitHub's runners) and the
      // rest of the quit.
      expect(Date.now() - started, `round ${round}: how long the quit took`).toBeLessThan(8000)
    } finally {
      await close().catch(() => {})
    }
  }
})

test('a shell that ended by itself does not hold the quit up', async () => {
  // Found in self-review (2026-11-19): node-pty ends a shell's output worker only on kill, and a
  // shell ended by `exit` is never killed - its worker went on, and the quit waited the whole
  // QUIT_WAIT_MS for it. Ended as the shell ends, it is gone a second later at most.
  const { app, page, close } = await launch(undefined, {
    layout: SINGLE_TERMINAL,
    settings: NO_SWITCH_PROMPT,
  })
  try {
    await shellReady(page)
    const pane = terminalPane(page).first()
    await typeInto(page, pane, 'exit')
    await expect(pane.getByTestId('pane-badge')).toContainText('exited', { timeout: 20_000 })
    // Past node-pty's second of draining, so the quit itself is what is timed: a worker ended is
    // gone by then, one left on still holds the quit its whole QUIT_WAIT_MS. A slow runner's
    // drain is not counted against the limit (advised in review).
    // wait: the worker's end is main's, with no signal in the page; only a floor, never the answer.
    await page.waitForTimeout(WORKER_DRAIN_MS)
    const child = app.process()
    const gone = new Promise<number>((resolve) => child.once('exit', () => resolve(Date.now())))
    const started = Date.now()
    await page.evaluate(() => window.elecdex.system.quit())
    expect((await gone) - started, 'how long the quit took').toBeLessThan(QUIT_LIMIT_MS)
  } finally {
    await close().catch(() => {})
  }
})

test('asked to end by the system (SIGTERM), the app quits, shells and all', async () => {
  // Found on v0.1.0's tag (2026-11-19): on macOS the packaged app, sent SIGTERM as a logout or
  // `kill` sends it, ran on - Electron's own quit for the signal stopped at the shells' gate.
  test.skip(process.platform === 'win32', 'Windows ends a program without a signal')
  const { app, page, close } = await launch(undefined, {
    layout: SINGLE_TERMINAL,
    settings: NO_SWITCH_PROMPT,
  })
  try {
    await shellReady(page)
    const child = app.process()
    const code = new Promise<number | string | null>((resolve) => {
      child.once('exit', (exitCode, signal) => resolve(exitCode ?? signal))
      setTimeout(() => resolve('still running after 10 s'), 10_000)
    })
    child.kill('SIGTERM')
    expect(await code, 'how the app ended').toBe(0)
  } finally {
    await close().catch(() => {})
  }
})

test('a rearrangement made a moment before quitting is still saved, live and in its layout', async () => {
  // The save is debounced, so quitting straight after a change is the case that
  // loses it if the page does not write out on its way down - and with a layout
  // being worked in, it would be lost from two files rather than one.
  const { app, page, userData, close } = await launch(undefined, {
    layout: SINGLE_TERMINAL,
    settings: NO_SWITCH_PROMPT,
  })
  try {
    await keepLayout(page, 'one')
    await terminalPane(page).first().locator('.xterm-helper-textarea').first().focus()

    const gone = exited(app)
    // Split and quit in one task: the debounce cannot have fired in between, so
    // what reaches the disk can only have come from the flush on the way out.
    await page.evaluate(() => {
      const press = (code: string) =>
        window.dispatchEvent(
          new KeyboardEvent('keydown', {
            bubbles: true,
            code,
            key: code,
            ctrlKey: true,
            shiftKey: true,
          }),
        )
      press('KeyE')
      // What yes in the quit question does: Ctrl+Shift+Q itself asks first.
      window.elecdex.system.quit()
    })
    await gone

    const count = (file: string) =>
      (readFileSync(path.join(userData, file), 'utf8').match(/"terminal"/g) ?? []).length
    expect(count('layout.json'), 'the live layout').toBe(2)
    expect(count('layouts.json'), 'the layout being worked in').toBe(2)
  } finally {
    await close().catch(() => {})
  }
})
