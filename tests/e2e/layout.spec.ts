import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import { launch, SINGLE_TERMINAL, terminalPane, typeInto } from './support.js'

/**
 * Layout engine, end to end. Each test gets its own userData directory because
 * the layout persists - that persistence is exactly what is under test.
 */

const layoutFile = (userData: string) => path.join(userData, 'layout.json')

/** Waits until the debounced save has written a layout matching `predicate`. */
async function waitForSaved(
  userData: string,
  predicate: (json: string) => boolean,
): Promise<string> {
  let last = ''
  await expect
    .poll(
      () => {
        if (!existsSync(layoutFile(userData))) return false
        last = readFileSync(layoutFile(userData), 'utf8')
        return predicate(last)
      },
      { timeout: 15_000, intervals: [200] },
    )
    .toBe(true)
  return last
}

test('the default layout recreates the original arrangement', async () => {
  const { page, close } = await launch()
  try {
    const widgets = await page.$$eval('[data-testid=pane]', (els) =>
      els.map((e) => e.getAttribute('data-widget')),
    )
    expect(widgets).toEqual([
      'clock',
      'sysinfo',
      'cpu',
      'memory',
      'toplist',
      'netstat',
      'throughput',
      'terminal',
      'terminal',
      'terminal',
      'launcher',
      'filesystem',
      'globe',
      'markets',
      'weather',
      'calendar',
    ])
    // The column headers of the original: PANEL / SYSTEM and PANEL / NETWORK.
    await expect(page.getByTestId('split-label')).toHaveCount(2)
    await expect(page.getByTestId('split-label').first()).toContainText(/panel/i)
    await expect(terminalPane(page).getByTestId('terminal-host')).toBeVisible()
    // The shell opens as three tabs, each a live shell.
    await expect(page.getByTestId('tabs-host').getByTestId('tab')).toHaveCount(3)
    await expect
      .poll(async () => (await page.evaluate(() => window.elecdex.pty.list())).length, {
        timeout: 20_000,
      })
      .toBe(3)
  } finally {
    await close()
  }
})

test('keyboard split creates a second live terminal beside the first', async () => {
  const { page, close } = await launch(undefined, { layout: SINGLE_TERMINAL })
  try {
    await terminalPane(page).locator('.xterm-helper-textarea').first().focus()
    await page.keyboard.press('Control+Shift+KeyE')

    await expect(terminalPane(page)).toHaveCount(2)
    await expect(page.locator('[data-widget=terminal] [data-testid=terminal-host]')).toHaveCount(2)
    await expect
      .poll(async () => (await page.evaluate(() => window.elecdex.pty.list())).length, {
        timeout: 20_000,
      })
      .toBe(2)

    // The new pane is to the right of the original, in a row split.
    const boxes = await terminalPane(page).evaluateAll((els) =>
      els.map((e) => e.getBoundingClientRect().left),
    )
    expect(boxes[1]).toBeGreaterThan(boxes[0] ?? 0)
  } finally {
    await close()
  }
})

test('closing a pane collapses the split and focus moves to a survivor', async () => {
  const { page, close } = await launch(undefined, { layout: SINGLE_TERMINAL })
  try {
    await terminalPane(page).locator('.xterm-helper-textarea').first().focus()
    await page.keyboard.press('Control+Shift+KeyO')
    await expect(terminalPane(page)).toHaveCount(2)

    await page.keyboard.press('Control+Shift+KeyW')
    await expect(terminalPane(page)).toHaveCount(1)
    await expect(page.locator('[data-testid=pane].focused')).toHaveCount(1)
  } finally {
    await close()
  }
})

test('a divider resizes its neighbours from the keyboard and the size persists', async () => {
  const { page, userData, close } = await launch()
  try {
    const rootSplit = page.locator('[data-testid=split]').first()
    const handle = rootSplit.locator(':scope > [data-testid=split-handle]').first()
    const firstSlot = rootSplit.locator(':scope > .slot').first()

    const before = (await firstSlot.boundingBox())?.width ?? 0
    await handle.focus()
    for (let i = 0; i < 5; i++) await page.keyboard.press('Shift+ArrowRight')
    await expect
      .poll(async () => (await firstSlot.boundingBox())?.width ?? 0)
      .toBeGreaterThan(before + 50)

    const saved = await waitForSaved(userData, (json) => {
      const sizes = (JSON.parse(json) as { root: { sizes?: number[] } }).root.sizes
      return sizes !== undefined && (sizes[0] ?? 0) > 0.4
    })
    // Default 0.18, plus five Shift+ArrowRight steps of 0.05.
    expect(JSON.parse(saved).root.sizes[0]).toBeCloseTo(0.43, 2)
  } finally {
    await close()
  }
})

test('the layout and its shells survive a window reload', async () => {
  const { page, close } = await launch(undefined, { layout: SINGLE_TERMINAL })
  try {
    await terminalPane(page).locator('.xterm-helper-textarea').first().focus()
    await page.keyboard.press('Control+Shift+KeyE')
    await expect(terminalPane(page)).toHaveCount(2)

    await expect
      .poll(async () => (await page.evaluate(() => window.elecdex.pty.list())).length, {
        timeout: 20_000,
      })
      .toBe(2)
    const sessionsBefore = (await page.evaluate(() => window.elecdex.pty.list()))
      .map((s) => s.id)
      .sort()

    // Leave a marker in a shell, so we can prove it is the same shell afterwards.
    await typeInto(page, terminalPane(page).first(), 'cd ..')
    await page.waitForTimeout(1500) // let the debounced layout save land

    await page.reload()
    await expect(page.getByTestId('workspace')).toHaveAttribute('data-loaded', 'true')
    await expect(terminalPane(page)).toHaveCount(2)

    // Same session ids: the panes re-adopted their shells rather than spawning new ones.
    await expect
      .poll(
        async () => (await page.evaluate(() => window.elecdex.pty.list())).map((s) => s.id).sort(),
        { timeout: 20_000 },
      )
      .toEqual(sessionsBefore)
  } finally {
    await close()
  }
})

test('the layout survives an app restart, with fresh shells', async () => {
  let launched = await launch(undefined, { layout: SINGLE_TERMINAL })
  try {
    const { page, userData } = launched
    await terminalPane(page).locator('.xterm-helper-textarea').first().focus()
    await page.keyboard.press('Control+Shift+KeyO')
    await expect(terminalPane(page)).toHaveCount(2)
    await waitForSaved(userData, (json) => (json.match(/"widget": "terminal"/g) ?? []).length === 2)

    launched = await launched.relaunch()
    await expect(terminalPane(launched.page)).toHaveCount(2)
    // Shells do not survive the process, so both panes start new ones.
    await expect
      .poll(async () => (await launched.page.evaluate(() => window.elecdex.pty.list())).length, {
        timeout: 20_000,
      })
      .toBe(2)
  } finally {
    await launched.close()
  }
})

test('a corrupt layout.json is quarantined, not lost, and the default is used', async () => {
  const first = await launch()
  const { userData } = first
  await first.app.close()

  writeFileSync(layoutFile(userData), '{ "version": 1, "root": { this is not json', 'utf8')

  const second = await launch(userData)
  try {
    await expect(second.page.locator('[data-testid=pane]')).toHaveCount(16)
    const backup = `${layoutFile(userData)}.bak`
    expect(existsSync(backup)).toBe(true)
    expect(readFileSync(backup, 'utf8')).toContain('this is not json')
  } finally {
    await second.close()
  }
})

test('a hand-edited layout.json is honoured and normalised', async () => {
  const first = await launch()
  const { userData } = first
  await first.app.close()

  // A split with one child and unnormalised sizes: the engine must collapse it.
  writeFileSync(
    layoutFile(userData),
    JSON.stringify({
      version: 1,
      root: {
        kind: 'split',
        id: 'root',
        direction: 'row',
        sizes: [7, 3],
        children: [
          { kind: 'pane', id: 'a', widget: 'terminal' },
          {
            kind: 'split',
            id: 'inner',
            direction: 'column',
            sizes: [1],
            children: [{ kind: 'pane', id: 'b', widget: 'cpu' }],
          },
        ],
      },
    }),
    'utf8',
  )

  const second = await launch(userData)
  try {
    const widgets = await second.page.$$eval('[data-testid=pane]', (els) =>
      els.map((e) => e.getAttribute('data-widget')),
    )
    expect(widgets).toEqual(['terminal', 'cpu'])
    // The one-child inner split collapsed, leaving a single root split.
    await expect(second.page.locator('[data-testid=split]')).toHaveCount(1)
  } finally {
    await second.close()
  }
})

test('an unknown widget id renders a visible placeholder instead of breaking the layout', async () => {
  const first = await launch()
  const { userData } = first
  await first.app.close()

  writeFileSync(
    layoutFile(userData),
    JSON.stringify({
      version: 1,
      root: {
        kind: 'split',
        id: 'root',
        direction: 'row',
        sizes: [0.5, 0.5],
        children: [
          { kind: 'pane', id: 'a', widget: 'terminal' },
          { kind: 'pane', id: 'b', widget: 'plugin:not-installed' },
        ],
      },
    }),
    'utf8',
  )

  const second = await launch(userData)
  try {
    await expect(second.page.getByTestId('pane-missing')).toContainText('plugin:not-installed')
    await expect(terminalPane(second.page).getByTestId('terminal-host')).toBeVisible()
  } finally {
    await second.close()
  }
})

test('reset restores the default layout', async () => {
  const { page, close } = await launch(undefined, { layout: SINGLE_TERMINAL })
  try {
    await terminalPane(page).locator('.xterm-helper-textarea').first().focus()
    await page.keyboard.press('Control+Shift+KeyE')
    await expect(terminalPane(page)).toHaveCount(2)

    await page.keyboard.press('Control+Shift+Backspace')
    await expect(page.locator('[data-testid=pane]')).toHaveCount(16)
    await expect(terminalPane(page)).toHaveCount(1)
  } finally {
    await close()
  }
})

test('a malformed save from the renderer is rejected and the good layout kept', async () => {
  const { page, userData, close } = await launch()
  try {
    await page.waitForTimeout(1500)
    const good = await page.evaluate(() => window.elecdex.layout.load())

    const result = await page.evaluate(() =>
      // @ts-expect-error - deliberately sending a structurally invalid tree.
      window.elecdex.layout.save({ version: 1, root: { kind: 'window' } }),
    )
    expect(result).toEqual(good)
    if (existsSync(layoutFile(userData))) {
      expect(readFileSync(layoutFile(userData), 'utf8')).not.toContain('"window"')
    }
  } finally {
    await close()
  }
})

test('a hand edit made while the app is running survives a reload', async () => {
  const { page, userData, close } = await launch()
  try {
    // Let startup settle, including the terminal recording its session id.
    await page.waitForTimeout(3000)

    writeFileSync(
      layoutFile(userData),
      JSON.stringify({ version: 1, root: { kind: 'pane', id: 'edited', widget: 'terminal' } }),
      'utf8',
    )
    await page.reload()
    await expect(page.getByTestId('workspace')).toHaveAttribute('data-loaded', 'true')

    // Before the fix, the page's unload handler rewrote its old tree over the edit.
    await expect(page.locator('[data-testid=pane]')).toHaveCount(1)
  } finally {
    await close()
  }
})
