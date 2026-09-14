import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { type Launched, launch, SINGLE_TERMINAL, terminalPane, typeInto } from './support.js'

let launched: Launched
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
 * exit codes) is ordinary Svelte DOM in the pane header and is asserted directly.
 */

test.beforeAll(async () => {
  // A lone terminal: several tests here turn it into a tab group and count tabs.
  launched = await launch(undefined, { layout: SINGLE_TERMINAL })
  ;({ page, platform } = launched)
  await expect(terminalPane(page).getByTestId('terminal-host')).toBeVisible()
})

test.afterAll(async () => {
  await launched?.close()
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
  const screen = terminalPane(page).locator('.xterm-screen').first()
  await expect(screen).toBeVisible()

  const box = await screen.boundingBox()
  expect(box?.width ?? 0).toBeGreaterThan(200)
  expect(box?.height ?? 0).toBeGreaterThan(100)

  // WebGL renderer: content is drawn to a canvas inside the screen element.
  await expect(terminalPane(page).locator('.xterm-screen canvas').first()).toBeVisible()
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
  const cwd = terminalPane(page).first().getByTestId('pane-subtitle')

  await expect
    .poll(async () => (await cwd.innerText()).trim(), { timeout: 40_000, intervals: [300] })
    .toMatch(/[A-Za-z0-9._-]{2,}/)

  const text = (await cwd.innerText()).trim()
  expect(text).not.toBe('…')
  expect(text).not.toBe('no tracking')
})

test('the working directory follows a cd', async () => {
  const command = platform === 'win32' ? 'cd $env:TEMP' : 'cd /tmp'
  const expected = platform === 'win32' ? /temp/i : /tmp/

  await typeInto(page, terminalPane(page).first(), command)

  await expect
    .poll(() => terminalPane(page).first().getByTestId('pane-subtitle').innerText(), {
      timeout: 40_000,
      intervals: [300],
    })
    .toMatch(expected)
})

test('a non-zero exit code is surfaced on the pane', async () => {
  const command = platform === 'win32' ? 'cmd /c exit 42' : '(exit 42)'
  await typeInto(page, terminalPane(page).first(), command)

  await expect(terminalPane(page).first().getByTestId('pane-badge')).toHaveText('42', {
    timeout: 40_000,
  })
})

test('history survives the terminal being remounted into a tab group', async () => {
  // Regression: Ctrl+Shift+T on a lone terminal remounts it as a background tab.
  // Fitting that hidden pane sent the shell a 12x5 size, ConPTY rewrapped its
  // buffer to it, and the repaint that followed garbled every line on screen.
  const marker = `REMOUNT-MARKER-${Date.now()}`
  const pane = terminalPane(page).first()
  await typeInto(page, pane, `echo ${marker}`)

  const sessionsBefore = (await page.evaluate(() => window.elecdex.pty.list())).map((s) => s.id)
  await pane.locator('.xterm-helper-textarea').first().focus()
  await page.keyboard.press('Control+Shift+KeyT')
  const strip = page.getByTestId('tabs-host').getByTestId('tab')
  await expect.poll(() => strip.count(), { timeout: 20_000 }).toBe(2)
  await page.waitForTimeout(1500) // the new tab's shell starts; any repaint lands
  await strip.first().click()
  await page.waitForTimeout(1500)

  // Read the original session's screen as a reattaching pane would receive it.
  const screens = await page.evaluate(async (ids) => {
    const decoder = new TextDecoder()
    const out: string[] = []
    for (const id of ids) {
      let text = ''
      const detach = await window.elecdex.pty.attach(id, {
        onData: (chunk) => {
          text += decoder.decode(chunk, { stream: true })
        },
        onExit: () => {},
        onCwd: () => {},
        onCommandEnd: () => {},
        onIntegrationUnavailable: () => {},
      })
      await new Promise((r) => setTimeout(r, 800))
      detach()
      out.push(text)
    }
    return out
  }, sessionsBefore)

  const ESC = String.fromCharCode(27)
  const lines = screens
    .join('\n')
    // Drop escape sequences, keeping the text each line was drawn with.
    .replaceAll(new RegExp(`${ESC}\\[[0-9;?]*[A-Za-z]`, 'g'), '')
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
  expect(lines.some((line) => line.endsWith(`echo ${marker}`))).toBe(true)
  expect(lines).toContain(marker)
})

test('terminal tabs are not capped at five', async () => {
  // The original pre-allocated exactly four extra ports and stopped there.
  await terminalPane(page).first().locator('.xterm-helper-textarea').first().focus()
  for (let i = 0; i < 7; i++) await page.keyboard.press('Control+Shift+KeyT')

  const strip = page.getByTestId('tabs-host').getByTestId('tab')
  await expect.poll(() => strip.count(), { timeout: 40_000 }).toBe(9)

  await expect
    .poll(async () => (await page.evaluate(() => window.elecdex.pty.list())).length, {
      timeout: 40_000,
    })
    .toBeGreaterThanOrEqual(9)
})

test('closing a tab ends its session once the layout settles', async () => {
  const before = (await page.evaluate(() => window.elecdex.pty.list())).length
  await page.getByTestId('tabs-host').getByTestId('tab-close').last().click()

  // Unmounting a pane deliberately keeps its shell alive (a reload must not
  // lose work); the workspace reaps unclaimed sessions a few seconds later.
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

test('a reattaching pane receives the screen, then live output', async () => {
  const marker = `replay-${Date.now()}`
  const after = `live-${Date.now()}`
  const replayed = await page.evaluate(
    async ({ token, next }) => {
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

      // Second attach: the screen should arrive without running anything, and
      // output produced afterwards should follow it on the same port.
      let second = ''
      const detach2 = await window.elecdex.pty.attach(session.id, {
        ...noop,
        onData: (chunk) => {
          second += decoder.decode(chunk, { stream: true })
        },
      })
      await new Promise((r) => setTimeout(r, 1500))
      const snapshot = second
      window.elecdex.pty.write(
        session.id,
        `echo ${next}
`,
      )
      const liveDeadline = Date.now() + 20_000
      while (!second.slice(snapshot.length).includes(next) && Date.now() < liveDeadline) {
        await new Promise((r) => setTimeout(r, 200))
      }
      detach2()

      await window.elecdex.pty.dispose(session.id)
      return { first, snapshot, live: second.slice(snapshot.length) }
    },
    { token: marker, next: after },
  )

  expect(replayed.first).toContain(marker)
  expect(replayed.snapshot).toContain(marker)
  expect(replayed.live).toContain(after)
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

test('selecting text copies it, and a right-click pastes', async () => {
  const pane = terminalPane(page).first()
  const host = pane.getByTestId('terminal-host')
  await typeInto(page, pane, 'echo SELECT-ME')
  const box = await host.boundingBox()
  if (box === null) throw new Error('terminal host has no box')

  // Copy: drag across the top rows, which hold the command just typed or the banner.
  const readClipboard = () => launched.app.evaluate(({ clipboard }) => clipboard.readText())
  await launched.app.evaluate(({ clipboard }) => clipboard.writeText(''))
  await page.mouse.move(box.x + 10, box.y + 8)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width - 10, box.y + 60, { steps: 8 })
  await page.mouse.up()
  await expect.poll(readClipboard, { timeout: 5000 }).not.toBe('')

  // Paste: the clipboard's text reaches the shell, which echoes it back.
  const marker = `PASTED-${Date.now()}`
  await launched.app.evaluate(({ clipboard }, text) => clipboard.writeText(text), marker)
  // Earlier tests leave several sessions; listen to all of them for the echo.
  const echoed = page.evaluate(async () => {
    const decoder = new TextDecoder()
    let text = ''
    const ids = (await window.elecdex.pty.list()).map((session) => session.id)
    const detachers = await Promise.all(
      ids.map((id) =>
        window.elecdex.pty.attach(id, {
          onData: (chunk) => {
            text += decoder.decode(chunk, { stream: true })
          },
          onExit: () => {},
          onCwd: () => {},
          onCommandEnd: () => {},
          onIntegrationUnavailable: () => {},
        }),
      ),
    )
    await new Promise((resolve) => setTimeout(resolve, 4000))
    for (const detach of detachers) detach()
    return text
  })
  await page.waitForTimeout(800)
  await host.click({ button: 'right', position: { x: box.width / 2, y: box.height / 2 } })
  expect(await echoed).toContain(marker)
})

test('Ctrl+Shift+Arrow switches the shell tabs, and Ctrl+Shift+S takes focus back', async () => {
  const strip = page.getByTestId('tabs-host').getByTestId('tab')
  if ((await strip.count()) < 2) {
    await terminalPane(page).first().locator('.xterm-helper-textarea').first().focus()
    await page.keyboard.press('Control+Shift+KeyT')
    await expect.poll(() => strip.count(), { timeout: 20_000 }).toBeGreaterThanOrEqual(2)
  }
  const activeTab = () =>
    page.locator('[data-testid=tabs-host] li.active [data-testid=tab]').getAttribute('data-pane-id')
  const focusedPane = () =>
    page.evaluate(
      () =>
        document.activeElement?.closest('[data-testid=pane]')?.getAttribute('data-pane-id') ?? null,
    )

  await strip.first().click()
  const first = await activeTab()
  await expect.poll(focusedPane).toBe(first)

  await page.keyboard.press('Control+Shift+ArrowRight')
  await expect.poll(activeTab).not.toBe(first)
  const second = await activeTab()
  await expect.poll(focusedPane).toBe(second)
  await page.keyboard.press('Control+Shift+ArrowLeft')
  await expect.poll(activeTab).toBe(first)

  // Focus leaves the shell; the shortcut brings it back to the selected tab.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await expect.poll(focusedPane).toBeNull()
  await page.keyboard.press('Control+Shift+KeyS')
  await expect.poll(focusedPane).toBe(first)
})

test('every shell pane can grow its own tabs, and Ctrl+Alt+Shift+Arrow moves between shell panes', async () => {
  const twoShells = {
    version: 1,
    root: {
      kind: 'split',
      id: 's',
      direction: 'row',
      sizes: [0.4, 0.3, 0.3],
      children: [
        { kind: 'pane', id: 'left', widget: 'terminal' },
        { kind: 'pane', id: 'clock', widget: 'clock' },
        { kind: 'pane', id: 'right', widget: 'terminal' },
      ],
    },
  }
  const own = await launch(undefined, { layout: twoShells })
  const p = own.page
  try {
    const left = p.locator('[data-testid=pane][data-pane-id=left]')
    const right = p.locator('[data-testid=pane][data-pane-id=right]')
    // A shell on its own has a tab strip with its one tab and a +, and closes from the tab.
    for (const shell of [left, right]) {
      await expect(shell.getByTestId('tab')).toHaveCount(1)
      await expect(shell.getByTestId('tab-new')).toHaveCount(1)
      await expect(shell.getByTestId('tab-close')).toHaveCount(1)
      await expect(shell.getByTestId('pane-close')).toHaveCount(0)
    }

    // Both shells grow tabs of their own: one group each.
    await right.getByTestId('tab-new').click()
    const groups = p.getByTestId('tabs-host')
    await expect(groups).toHaveCount(1)
    await expect(groups.getByTestId('tab')).toHaveCount(2)
    await left.getByTestId('tab-new').click()
    await expect(groups).toHaveCount(2)
    await expect(groups.nth(0).getByTestId('tab')).toHaveCount(2)
    await expect(groups.nth(1).getByTestId('tab')).toHaveCount(2)
    await groups.nth(1).getByTestId('tab-new').click()
    await expect(groups.nth(1).getByTestId('tab')).toHaveCount(3)
    await expect(groups.nth(0).getByTestId('tab')).toHaveCount(2)

    const focusedPane = () =>
      p.evaluate(
        () =>
          document.activeElement?.closest('[data-testid=pane]')?.getAttribute('data-pane-id') ??
          null,
      )
    const selectedIn = (index: number) =>
      groups.nth(index).locator('li.active [data-testid=tab]').getAttribute('data-pane-id')
    const leftSelected = await selectedIn(0)
    const rightSelected = await selectedIn(1)

    // From a shell, the chord goes to the selected shell of the other group, the keyboard with it.
    await groups.nth(0).locator('.pane:not(.hidden) .xterm-helper-textarea').first().focus()
    await expect.poll(focusedPane).toBe(leftSelected)
    await p.keyboard.press('Control+Alt+Shift+ArrowRight')
    await expect.poll(focusedPane).toBe(rightSelected)
    // Wrapping round, both ways.
    await p.keyboard.press('Control+Alt+Shift+ArrowRight')
    await expect.poll(focusedPane).toBe(leftSelected)
    await p.keyboard.press('Control+Alt+Shift+ArrowLeft')
    await expect.poll(focusedPane).toBe(rightSelected)

    // From a pane that is not a shell, the chord does nothing.
    await p.locator('[data-testid=pane][data-pane-id=clock]').click()
    await expect.poll(focusedPane).not.toBe(rightSelected)
    await p.keyboard.press('Control+Alt+Shift+ArrowRight')
    await p.waitForTimeout(300)
    expect(await focusedPane()).not.toBe(leftSelected)
    expect(await focusedPane()).not.toBe(rightSelected)
  } finally {
    await own.close()
  }
})

test('a shell pane is headed TERMINAL, and its tabs are named by folder, with parents only on a clash', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'elecdex-tabs-'))
  const a = path.join(root, 'a', 'src')
  const b = path.join(root, 'b', 'src')
  mkdirSync(a, { recursive: true })
  mkdirSync(b, { recursive: true })
  const own = await launch(undefined, { layout: SINGLE_TERMINAL })
  const p = own.page
  const separator = path.sep
  const labels = () => p.getByTestId('tab-label').allInnerTexts()
  const visibleShell = () => p.locator('[data-testid=pane][data-widget=terminal]:not(.hidden)')
  try {
    const header = p.locator('header.hud-label > span').first()
    // innerText, as shown: the header upper-cases the registry title.
    await expect.poll(() => header.innerText()).toBe('TERMINAL')
    // A new shell starts at home, named by its folder rather than a bare ~.
    const { home } = (await p.evaluate(() => window.elecdex.system.info())).host
    const homeName =
      home
        .split(/[\\/]/)
        .filter((part) => part !== '')
        .pop() ?? ''
    await expect.poll(labels, { timeout: 40_000 }).toEqual([homeName])

    await typeInto(p, visibleShell(), `cd '${a}'`)
    await expect.poll(labels, { timeout: 40_000 }).toEqual(['src'])
    // The header keeps the full path, written as the platform writes it; the tab has it on hover.
    const subtitle = visibleShell().getByTestId('pane-subtitle')
    await expect(subtitle).toContainText(`a${separator}src`)
    await expect(p.getByTestId('tab').first()).toHaveAttribute('title', /src$/)

    await p.getByTestId('tab-new').click()
    await expect.poll(labels, { timeout: 40_000 }).toEqual(['src', homeName])
    await expect
      .poll(() => p.getByTestId('tabs-host').locator('header.hud-label > span').first().innerText())
      .toBe('TERMINAL')
    await typeInto(p, visibleShell(), `cd '${b}'`)
    await expect.poll(labels, { timeout: 40_000 }).toEqual([`a${separator}src`, `b${separator}src`])

    // Once they no longer clash, both go back to the folder alone.
    await typeInto(p, visibleShell(), `cd '${root}'`)
    await expect.poll(labels, { timeout: 40_000 }).toEqual(['src', path.basename(root)])
  } finally {
    await own.close()
    rmSync(root, { recursive: true, force: true })
  }
})
