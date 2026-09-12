import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import type { ElectronApplication, Page } from '@playwright/test'
import { _electron as electron, expect, test } from '@playwright/test'

const MAIN = fileURLToPath(new URL('../../out/main/index.js', import.meta.url))

let app: ElectronApplication
let page: Page
let platform: NodeJS.Platform

/**
 * Note on what is asserted where.
 *
 * The terminal renders through xterm's WebGL addon, which draws to a canvas -
 * there is no DOM text to read. So screen content is asserted at the data layer
 * (attach to a session and read the bytes that come back, which exercises the
 * whole pty -> MessagePort -> preload -> renderer path), and the render layer is
 * asserted structurally. Everything the UI derives from shell integration (cwd,
 * exit codes) is ordinary Svelte DOM and is asserted directly.
 */

test.beforeAll(async () => {
  app = await electron.launch({ args: [MAIN, '--windowed'] })
  page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')
  platform = await app.evaluate(() => process.platform)
  await expect(page.getByTestId('terminal-host').first()).toBeVisible()
})

test.afterAll(async () => {
  await app?.close()
})

/**
 * Runs a command on a throwaway session and returns everything the shell wrote.
 *
 * Deliberately uses its own session rather than the visible pane so the test is
 * not racing the UI, and so a failure points at the data path rather than at
 * rendering.
 */
async function runCapture(command: string, expected: RegExp): Promise<string> {
  return page.evaluate(
    async ({ cmd, pattern }) => {
      const session = await window.elecdex.pty.create({ cols: 120, rows: 40 })
      const decoder = new TextDecoder()
      let output = ''

      const re = new RegExp(pattern)
      const result = await new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`timeout; saw: ${output}`)), 25_000)

        void window.elecdex.pty
          .attach(session.id, {
            onData: (chunk) => {
              output += decoder.decode(chunk, { stream: true })
              if (re.test(output)) {
                clearTimeout(timer)
                resolve(output)
              }
            },
            onExit: () => {},
            onCwd: () => {},
            onCommandEnd: () => {},
            onIntegrationUnavailable: () => {},
          })
          .then(() => {
            // Give the shell a moment to print its first prompt before typing.
            setTimeout(() => window.elecdex.pty.write(session.id, `${cmd}\r`), 1200)
          })
      })

      await window.elecdex.pty.dispose(session.id)
      return result
    },
    { cmd: command, pattern: expected.source },
  )
}

test('a shell starts and its output reaches the renderer', async () => {
  const marker = `elecdex-ok-${Date.now()}`
  const output = await runCapture(`echo ${marker}`, new RegExp(marker))
  expect(output).toContain(marker)
})

test('the shell runs on a real pty, not a pipe', async () => {
  // An interactive shell on a pipe reports a very different width; a sized tty
  // is what curses applications need.
  const command =
    platform === 'win32' ? 'Write-Output "COLS=$($Host.UI.RawUI.WindowSize.Width)"' : 'tty'
  const expected = platform === 'win32' ? /COLS=\d+/ : /(pts|tty|dev)/
  const output = await runCapture(command, expected)
  expect(output).toMatch(expected)
})

test('the terminal renders into a sized canvas', async () => {
  const screen = page.locator('.pane.active .xterm-screen').first()
  await expect(screen).toBeVisible()

  const box = await screen.boundingBox()
  expect(box?.width ?? 0).toBeGreaterThan(200)
  expect(box?.height ?? 0).toBeGreaterThan(100)

  // WebGL renderer: content is drawn to a canvas inside the screen element.
  await expect(page.locator('.pane.active .xterm-screen canvas').first()).toBeVisible()
})

test('nothing listens on a TCP port', async () => {
  // The original project tunnelled every pty over ws://127.0.0.1:3000+, one
  // port per tab. elecdex uses a MessagePort, so those ports stay free.
  // Checked from the test process: "nothing is listening" is exactly what an
  // outside observer should be able to confirm.
  const free: number[] = []
  for (let port = 3000; port <= 3005; port++) {
    const ok = await new Promise<boolean>((resolve) => {
      const server = createServer()
      server.once('error', () => resolve(false))
      server.listen(port, '127.0.0.1', () => server.close(() => resolve(true)))
    })
    if (ok) free.push(port)
  }
  expect(free).toEqual([3000, 3001, 3002, 3003, 3004, 3005])
})

test('shell integration reports the working directory on this platform', async () => {
  // The capability the original project could not provide on Windows at all.
  const tab = page.getByTestId('tab').first()

  await expect
    .poll(async () => (await tab.innerText()).toLowerCase(), { timeout: 40_000, intervals: [300] })
    .not.toContain('no tracking')

  const text = await tab.innerText()
  expect(text).not.toMatch(/…\s*$/) // no longer the pending placeholder
  expect(text).toMatch(/[A-Za-z0-9._-]/)
})

test('the working directory follows a cd', async () => {
  const tab = page.getByTestId('tab').first()
  const command = platform === 'win32' ? 'cd $env:TEMP' : 'cd /tmp'
  const expected = platform === 'win32' ? /temp/i : /tmp/

  await page.locator('.pane.active .xterm-helper-textarea').first().focus()
  await page.keyboard.type(command)
  await page.keyboard.press('Enter')

  await expect.poll(() => tab.innerText(), { timeout: 40_000, intervals: [300] }).toMatch(expected)
})

test('a non-zero exit code is surfaced on the tab', async () => {
  const tab = page.getByTestId('tab').first()
  const command = platform === 'win32' ? 'cmd /c exit 42' : '(exit 42)'

  await page.locator('.pane.active .xterm-helper-textarea').first().focus()
  await page.keyboard.type(command)
  await page.keyboard.press('Enter')

  await expect.poll(() => tab.innerText(), { timeout: 40_000, intervals: [300] }).toContain('42')
})

test('tabs are not capped at five', async () => {
  // The original pre-allocated exactly four extra ports and stopped there.
  const before = await page.getByTestId('tab').count()
  for (let i = 0; i < 7; i++) await page.getByTestId('tab-new').click()

  await expect.poll(() => page.getByTestId('tab').count(), { timeout: 40_000 }).toBe(before + 7)

  const sessions = await page.evaluate(() => window.elecdex.pty.list())
  expect(sessions.length).toBeGreaterThanOrEqual(before + 7)
})

test('closing a tab ends its session', async () => {
  const before = (await page.evaluate(() => window.elecdex.pty.list())).length
  await page.getByTestId('tab-close').last().click()

  await expect
    .poll(async () => (await page.evaluate(() => window.elecdex.pty.list())).length, {
      timeout: 20_000,
    })
    .toBe(before - 1)
})

test('detaching leaves the session alive, and it can be reattached', async () => {
  // This is what decouples pane lifetime from session lifetime: a pane can be
  // moved, reloaded or reparented without the shell noticing.
  const id = await page.evaluate(async () => {
    const noop = {
      onData: () => {},
      onExit: () => {},
      onCwd: () => {},
      onCommandEnd: () => {},
      onIntegrationUnavailable: () => {},
    }
    const session = await window.elecdex.pty.create({})
    const detach = await window.elecdex.pty.attach(session.id, noop)
    detach()
    return session.id
  })

  const alive = await page.evaluate(
    async (sessionId) => (await window.elecdex.pty.list()).some((s) => s.id === sessionId),
    id,
  )
  expect(alive).toBe(true)

  const reattached = await page.evaluate(async (sessionId) => {
    const noop = {
      onData: () => {},
      onExit: () => {},
      onCwd: () => {},
      onCommandEnd: () => {},
      onIntegrationUnavailable: () => {},
    }
    const detach = await window.elecdex.pty.attach(sessionId, noop)
    detach()
    return true
  }, id)
  expect(reattached).toBe(true)

  await page.evaluate((sessionId) => window.elecdex.pty.dispose(sessionId), id)
})

test('a reattaching pane receives replayed scrollback', async () => {
  const marker = `replay-${Date.now()}`
  const replayed = await page.evaluate(
    async ({ token }) => {
      const noop = {
        onExit: () => {},
        onCwd: () => {},
        onCommandEnd: () => {},
        onIntegrationUnavailable: () => {},
      }
      const decoder = new TextDecoder()
      const session = await window.elecdex.pty.create({ cols: 120, rows: 40 })

      // First attach: run a command and wait for its output.
      let first = ''
      const detach1 = await window.elecdex.pty.attach(session.id, {
        ...noop,
        onData: (chunk) => {
          first += decoder.decode(chunk, { stream: true })
        },
      })
      await new Promise((r) => setTimeout(r, 1200))
      window.elecdex.pty.write(session.id, `echo ${token}\r`)
      const deadline = Date.now() + 20_000
      while (!first.includes(token) && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 200))
      }
      detach1()

      // Second attach: the backlog should arrive without running anything.
      let second = ''
      const detach2 = await window.elecdex.pty.attach(session.id, {
        ...noop,
        onData: (chunk) => {
          second += decoder.decode(chunk, { stream: true })
        },
      })
      await new Promise((r) => setTimeout(r, 1500))
      detach2()

      await window.elecdex.pty.dispose(session.id)
      return { first, second }
    },
    { token: marker },
  )

  expect(replayed.first).toContain(marker)
  expect(replayed.second).toContain(marker)
})

test('attaching to an unknown session is refused', async () => {
  const error = await page.evaluate(async () => {
    try {
      await window.elecdex.pty.attach('00000000-0000-0000-0000-000000000000', {
        onData: () => {},
        onExit: () => {},
        onCwd: () => {},
        onCommandEnd: () => {},
        onIntegrationUnavailable: () => {},
      })
      return null
    } catch (cause) {
      return cause instanceof Error ? cause.message : String(cause)
    }
  })
  expect(error).toContain('No such terminal session')
})

test('the renderer still has no node access', async () => {
  const exposure = await page.evaluate(() => ({
    require: typeof (globalThis as Record<string, unknown>).require,
    process: typeof (globalThis as Record<string, unknown>).process,
    ipcRenderer: typeof (window.elecdex as unknown as Record<string, unknown>).ipcRenderer,
  }))
  expect(exposure).toEqual({ require: 'undefined', process: 'undefined', ipcRenderer: 'undefined' })
})
