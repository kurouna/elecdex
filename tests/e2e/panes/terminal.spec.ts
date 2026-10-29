import { mkdirSync, mkdtempSync, realpathSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { test } from '../support/shared.js'
import { readScreen, screenLines } from '../support/terminal.js'
import {
  type Launched,
  launch,
  listenToSessions,
  paneById,
  quietFor,
  removeDir,
  runCapture,
  SINGLE_TERMINAL,
  sessionIds,
  terminalPane,
  typeInto,
  waitForSaved,
} from '../support.js'

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

test('captures in a row all answer, the one the reaper ends too', async () => {
  // First in the file on purpose: four captures take about five seconds, so one of
  // them is alive when the reaper runs, four seconds after the launch. Before the
  // capture started over, that one waited 25 s for a shell that had been ended.
  for (let i = 0; i < 4; i++) {
    const marker = `capture-${i}-${Date.now()}`
    expect(await runCapture(page, `echo ${marker}`, new RegExp(`${marker}\\r?\\n`))).toContain(
      marker,
    )
  }
})

test('a shell starts and its output reaches the renderer', async () => {
  const marker = `elecdex-ok-${Date.now()}`
  const output = await runCapture(page, `echo ${marker}`, new RegExp(marker))
  expect(output).toContain(marker)
})

test('the shell runs on a real pty, not a pipe', async () => {
  // An interactive shell on a pipe reports a very different width; a sized tty
  // is what curses applications need.
  const command =
    platform === 'win32' ? 'Write-Output "COLS=$($Host.UI.RawUI.WindowSize.Width)"' : 'tty'
  const expected = platform === 'win32' ? /COLS=\d+/ : /(pts|tty|dev)/
  const output = await runCapture(page, command, expected)
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

test('PowerShell does not keep the integration script in its environment', async () => {
  // The script reaches PowerShell in an environment variable, so the command
  // line stays short (a long or encoded one held main for over a second at
  // startup). It takes itself out, or every program the shell starts inherits it.
  test.skip(platform !== 'win32', 'only PowerShell is handed its script this way')
  const shell = terminalPane(page).first()
  await typeInto(
    page,
    shell,
    'if ($env:ELECDEX_PS_INIT) { cd $env:SystemRoot } else { cd $env:ProgramFiles }',
  )
  // The header follows the cd, so it says which branch the shell took.
  await expect
    .poll(() => shell.getByTestId('pane-subtitle').innerText(), {
      timeout: 40_000,
      intervals: [300],
    })
    .toMatch(/program files/i)
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

test('a non-zero exit code does not badge the pane', async () => {
  // The exit code badge was turned off on purpose (273c706); the shell's own
  // prompt reports a failure. Only a shell that exits gets a badge.
  const command = platform === 'win32' ? 'cmd /c exit 42' : '(exit 42)'
  const shell = terminalPane(page).first()
  const subtitle = shell.getByTestId('pane-subtitle')
  const before = await subtitle.innerText()
  await typeInto(page, shell, command)
  // A later command's cwd report shows the integration handled the failing one.
  await typeInto(page, shell, 'cd ..')
  await expect
    .poll(() => subtitle.innerText(), { timeout: 40_000, intervals: [300] })
    .not.toBe(before)
  await expect(shell.getByTestId('pane-badge')).toHaveCount(0)
})

test('Ctrl+Shift+F finds text in the scrollback and leaves the clipboard alone', async () => {
  const pane = terminalPane(page).first()
  const needle = `FINDME${Date.now()}`
  // Deliberately before the tests that fill this pane with tabs: what there is
  // to find is what the shell echoed back, so it must be the live one.
  await typeInto(page, pane, `echo ${needle}`)

  // Selecting text in this terminal copies it, and a search moves the selection
  // over every match - so the clipboard is what tells us a search is not being
  // mistaken for a selection the user made.
  const readClipboard = () => launched.app.evaluate(({ clipboard }) => clipboard.readText())
  const sentinel = `KEEP-${Date.now()}`
  await launched.app.evaluate(({ clipboard }, text) => clipboard.writeText(text), sentinel)

  await pane.locator('.xterm-helper-textarea').first().focus()
  await page.keyboard.press('Control+Shift+KeyF')
  const box = pane.getByTestId('terminal-search-box')
  await expect(box).toBeFocused()

  await page.keyboard.type(needle)
  const tally = pane.getByTestId('terminal-search-tally')
  // Each attempt searches again: a search runs when the term changes, so waiting
  // on the tally alone would wait forever if the shell had not echoed yet.
  const search = async (): Promise<string> => {
    await box.fill('')
    await box.fill(needle)
    return (await tally.textContent()) ?? ''
  }
  await expect.poll(search, { timeout: 20_000 }).toMatch(/^\d/)

  // Step through the matches; the clipboard still holds what it did.
  await page.keyboard.press('Enter')
  await page.keyboard.press('Shift+Enter')
  expect(await readClipboard()).toBe(sentinel)

  // A word that is not there says so, and Escape closes the bar and gives the
  // keyboard back to the shell.
  await box.fill(`ABSENT${Date.now()}`)
  await expect(tally).toHaveText('no matches')
  await page.keyboard.press('Escape')
  await expect(box).toBeHidden()
  expect(await readClipboard()).toBe(sentinel)
})

test('history survives the terminal being remounted into a tab group', async () => {
  // Regression: Ctrl+Shift+T on a lone terminal remounts it as a background tab.
  // Fitting that hidden pane sent the shell a 12x5 size, ConPTY rewrapped its
  // buffer to it, and the repaint that followed garbled every line on screen.
  const marker = `REMOUNT-MARKER-${Date.now()}`
  const pane = terminalPane(page).first()
  await typeInto(page, pane, `echo ${marker}`)

  const sessionsBefore = await sessionIds(page)
  await pane.locator('.xterm-helper-textarea').first().focus()
  await page.keyboard.press('Control+Shift+KeyT')
  const strip = page.getByTestId('tabs-host').getByTestId('tab')
  await expect.poll(() => strip.count(), { timeout: 20_000 }).toBe(2)
  // wait: the new tab's shell starts and any repaint lands - the garbling this guards against
  // came with that repaint, and nothing marks it done.
  await page.waitForTimeout(1500)
  await strip.first().click()
  // wait: the same for the remount back to the first tab.
  await page.waitForTimeout(1500)

  // Read the original session's screen as a reattaching pane would receive it.
  const screens: string[] = []
  for (const id of sessionsBefore) screens.push(await readScreen(page, id, 800))

  const lines = screenLines(screens.join('\n'))
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

/**
 * What the page looks like around a tab's ×, and which pointer events reached what,
 * for a close that did not happen.
 *
 * Once on the macOS runner (2026-09-24) a click on a tab's × took focus but the tab
 * stayed, for twenty seconds, and nothing on this machine does it; this is what the
 * next time should tell.
 */
async function closeDiagnosis(paneId: string): Promise<string> {
  const state = await page.evaluate((id) => {
    const describe = (element: Element | null): string | null => {
      if (element === null) return null
      const testId = element.getAttribute('data-testid')
      const pane = element.getAttribute('data-pane-id')
      return `${element.tagName.toLowerCase()}${testId ? `[${testId}]` : ''}${pane ? `(${pane})` : ''}.${element.className}`
    }
    const close = document.querySelector(`[data-testid=tab-close][data-pane-id="${id}"]`)
    const box = close?.getBoundingClientRect()
    const centre = box
      ? document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
      : null
    const group = close?.closest('[data-testid=tabs-host]') ?? null
    return {
      events: (window as { __closeLog?: string[] }).__closeLog ?? [],
      tabs: [...document.querySelectorAll('[data-testid=tab]')].map(
        (tab) => `${tab.getAttribute('data-pane-id')} ${tab.closest('li')?.className ?? ''}`,
      ),
      close: describe(close),
      box: box ? [box.x, box.y, box.width, box.height].map(Math.round) : null,
      atCentre: describe(centre),
      group: group ? `${group.className} inert=${(group as HTMLElement).inert}` : null,
      active: describe(document.activeElement),
      offscreen: document.documentElement.dataset.offscreen ?? null,
    }
  }, paneId)
  const sessions = await page.evaluate(() => window.elecdex.pty.list())
  return JSON.stringify({ ...state, sessions: sessions.length }, null, 2)
}

test('closing a tab ends its session once the layout settles', async () => {
  // A tab of its own, rather than the last of those an earlier test opened: a retry
  // starts on a lone shell, where there were none to close.
  const tabs = page.getByTestId('tab')
  const idsBefore = await tabs.evaluateAll((all) => all.map((t) => t.getAttribute('data-pane-id')))
  const listed = async () => (await page.evaluate(() => window.elecdex.pty.list())).length
  const before = await listed()
  await page.getByTestId('tab-new').first().click()
  await expect(tabs).toHaveCount(idsBefore.length + 1)
  const ids = await tabs.evaluateAll((all) => all.map((t) => t.getAttribute('data-pane-id')))
  const added = ids.find((id) => !idsBefore.includes(id))
  if (added == null) throw new Error(`no new tab among ${ids.join(', ')}`)
  await expect.poll(listed, { timeout: 20_000 }).toBe(before + 1)

  // Every pointer event from here on, and where it landed, for the diagnosis.
  await page.evaluate(() => {
    const log: string[] = []
    ;(window as { __closeLog?: string[] }).__closeLog = log
    const start = performance.now()
    for (const type of ['pointerdown', 'pointerup', 'click']) {
      window.addEventListener(
        type,
        (event) => {
          const target = event.target as Element
          const where = `${target.tagName.toLowerCase()}[${target.getAttribute('data-testid') ?? ''}]`
          const note = event.defaultPrevented ? ' prevented' : ''
          log.push(`${Math.round(performance.now() - start)}ms ${type} ${where}${note}`)
        },
        { capture: true },
      )
    }
  })
  await page.locator(`[data-testid=tab-close][data-pane-id="${added}"]`).click()

  // The tab goes first; only then is its shell's end worth waiting for.
  try {
    await expect(page.locator(`[data-testid=tab][data-pane-id="${added}"]`)).toHaveCount(0)
  } catch (error) {
    const diagnosis = await closeDiagnosis(added)
    console.warn(`[e2e] the closed tab ${added} is still there:\n${diagnosis}`)
    await test
      .info()
      .attach('close-diagnosis', { body: diagnosis, contentType: 'application/json' })
    throw error
  }

  // Unmounting a pane deliberately keeps its shell alive (a reload must not
  // lose work); the workspace reaps unclaimed sessions a few seconds later.
  await expect.poll(listed, { timeout: 20_000 }).toBe(before)
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

test('typing still reaches a shell after a later attach of its session lets go', async () => {
  // Preload kept one port per session for writes: a second attach took the
  // first one's place, and letting it go left the pane still attached writing
  // into nothing - its keys never reached the shell.
  const marker = `still-${Date.now()}`
  const output = await page.evaluate(async (text) => {
    const noop = {
      onData: () => {},
      onExit: () => {},
      onCwd: () => {},
      onCommandEnd: () => {},
      onIntegrationUnavailable: () => {},
    }
    const session = await window.elecdex.pty.create({ cols: 120, rows: 40 })
    const decoder = new TextDecoder()
    let seen = ''
    const first = await window.elecdex.pty.attach(session.id, {
      ...noop,
      onData: (chunk) => {
        seen += decoder.decode(chunk, { stream: true })
      },
    })
    const second = await window.elecdex.pty.attach(session.id, noop)
    second()
    // wait: no prompt event to wait on; the shell gets a moment to print its first one.
    await new Promise((r) => setTimeout(r, 1200))
    window.elecdex.pty.write(session.id, `echo ${text}\r`)
    const deadline = Date.now() + 15_000
    while (!new RegExp(`${text}\\r?\\n`).test(seen) && Date.now() < deadline) {
      // wait: the poll's interval, bounded by the deadline above.
      await new Promise((r) => setTimeout(r, 100))
    }
    first()
    await window.elecdex.pty.dispose(session.id)
    return seen
  }, marker)
  expect(output).toMatch(new RegExp(`${marker}\\r?\\n`))
})

test('two attaches of one session asked at once both get their port', async () => {
  // Preload waited for one port per session: a second attach asked before the
  // first one's port arrived took its place, and the first waited for ever.
  const settled = await page.evaluate(async () => {
    const noop = {
      onData: () => {},
      onExit: () => {},
      onCwd: () => {},
      onCommandEnd: () => {},
      onIntegrationUnavailable: () => {},
    }
    const session = await window.elecdex.pty.create({})
    const timeout = new Promise<'timeout'>((r) => setTimeout(() => r('timeout'), 5000))
    const both = Promise.all([
      window.elecdex.pty.attach(session.id, noop),
      window.elecdex.pty.attach(session.id, noop),
    ])
    const result = await Promise.race([both, timeout])
    if (result !== 'timeout') for (const detach of result) detach()
    await window.elecdex.pty.dispose(session.id)
    return result === 'timeout' ? 'timeout' : 'both'
  })
  expect(settled).toBe('both')
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
      // wait: no prompt event to wait on; the shell gets a moment to print its first one.
      await new Promise((r) => setTimeout(r, 1200))
      window.elecdex.pty.write(session.id, `echo ${token}\r`)
      const deadline = Date.now() + 20_000
      while (!first.includes(token) && Date.now() < deadline) {
        // wait: the poll's interval, bounded by the deadline above.
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
      // wait: the replayed screen has no end mark; what came in this window is the snapshot.
      await new Promise((r) => setTimeout(r, 1500))
      const snapshot = second
      window.elecdex.pty.write(
        session.id,
        `echo ${next}
`,
      )
      const liveDeadline = Date.now() + 20_000
      while (!second.slice(snapshot.length).includes(next) && Date.now() < liveDeadline) {
        // wait: the poll's interval, bounded by the deadline above.
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
  const echoed = await listenToSessions(page, { until: marker, ms: 4000 })
  await host.click({ button: 'right', position: { x: box.width / 2, y: box.height / 2 } })
  expect(await echoed()).toContain(marker)
})

test('Ctrl+Tab switches the shell tabs, and Ctrl+Shift+S takes focus back', async () => {
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

  await page.keyboard.press('Control+Tab')
  await expect.poll(activeTab).not.toBe(first)
  const second = await activeTab()
  await expect.poll(focusedPane).toBe(second)
  await page.keyboard.press('Control+Shift+Tab')
  await expect.poll(activeTab).toBe(first)

  // Focus leaves the shell; the shortcut brings it back to the selected tab.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await expect.poll(focusedPane).toBeNull()
  await page.keyboard.press('Control+Shift+KeyS')
  await expect.poll(focusedPane).toBe(first)
})

test('every shell pane can grow its own tabs, and Ctrl+Alt+Shift+Arrow moves between shell panes', async ({
  shared,
}) => {
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
  const own = await shared({ layout: twoShells })
  const p = own.page
  try {
    const left = paneById(p, 'left')
    const right = paneById(p, 'right')
    // A shell on its own has a tab strip with its one tab and a +, closes from the
    // tab as well as from the corner every pane has, and comes forward from there.
    for (const shell of [left, right]) {
      await expect(shell.getByTestId('tab')).toHaveCount(1)
      await expect(shell.getByTestId('tab-new')).toHaveCount(1)
      await expect(shell.getByTestId('tab-close')).toHaveCount(1)
      await expect(shell.getByTestId('pane-close')).toHaveCount(1)
      await expect(shell.getByTestId('pane-zoom')).toHaveCount(1)
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
    await quietFor(300, focusedPane, 'the focused pane')
    expect(await focusedPane()).not.toBe(leftSelected)
    expect(await focusedPane()).not.toBe(rightSelected)
  } finally {
    await own.close()
  }
})

test('a shell pane comes back in its last folder; a new pane, or one whose folder has gone, starts where the settings say', async () => {
  // The folder's own name, as the shell reports it: the Windows runner's temporary folder
  // is C:\Users\RUNNER~1\..., which PowerShell gives back as C:\Users\runneradmin\....
  const root = realpathSync.native(mkdtempSync(path.join(tmpdir(), 'elecdex-cwd-')))
  const start = path.join(root, 'start-here')
  // Outside ASCII: PowerShell sends it unencoded (OSC 9;9), the others percent-encoded UTF-8.
  const kept = path.join(root, 'kept-フォルダ é')
  mkdirSync(start)
  mkdirSync(kept)
  let own = await launch(undefined, {
    layout: SINGLE_TERMINAL,
    settings: { terminal: { startDirectory: start } },
  })
  const subtitle = (p: Page, n = 0) =>
    p.locator('[data-testid=pane][data-widget=terminal]').nth(n).getByTestId('pane-subtitle')
  try {
    await expect(subtitle(own.page)).toContainText('start-here', { timeout: 40_000 })
    await typeInto(own.page, terminalPane(own.page).first(), `cd '${kept}'`)
    await expect(subtitle(own.page)).toContainText('kept-フォルダ é', { timeout: 40_000 })
    // The pane keeps the folder in its state, so it is saved with the layout.
    await waitForSaved(own.userData, (text) => JSON.parse(text).root?.state?.cwd === kept, 10_000)

    own = await own.relaunch()
    await expect(subtitle(own.page)).toContainText('kept-フォルダ é', { timeout: 40_000 })
    // A pane opened now has no folder of its own yet.
    await own.page.keyboard.press('Control+Shift+KeyA')
    await own.page.locator('[data-testid=pane-picker-item][data-widget=terminal]').click()
    await expect(subtitle(own.page, 1)).toContainText('start-here', { timeout: 40_000 })

    await own.quit()
    rmSync(kept, { recursive: true, force: true })
    own = await launch(own.userData)
    await expect(subtitle(own.page)).toContainText('start-here', { timeout: 40_000 })
  } finally {
    await own.quit()
    removeDir(own.userData)
    rmSync(root, { recursive: true, force: true })
  }
})

test('a shell pane is headed TERMINAL, and its tabs are named by folder, with parents only on a clash', async ({
  shared,
}) => {
  const root = mkdtempSync(path.join(tmpdir(), 'elecdex-tabs-'))
  const a = path.join(root, 'a', 'src')
  const b = path.join(root, 'b', 'src')
  mkdirSync(a, { recursive: true })
  mkdirSync(b, { recursive: true })
  const own = await shared({ layout: SINGLE_TERMINAL })
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
