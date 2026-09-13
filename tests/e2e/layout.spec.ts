import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { expect, type Locator, type Page, test } from '@playwright/test'
import type { LayoutNode } from '@shared/schemas/layout'
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
      'disk',
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

test('the app starts with the shell focused, ready to type into', async () => {
  const { page, close } = await launch()
  try {
    // The shell is not the first pane in tree order; focus must still land on it.
    await expect
      .poll(
        () =>
          page.evaluate(() => document.activeElement?.classList.contains('xterm-helper-textarea')),
        {
          timeout: 20_000,
        },
      )
      .toBe(true)
    await expect(terminalPane(page).locator('.xterm-helper-textarea:focus')).toHaveCount(1)
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
    await expect(second.page.locator('[data-testid=pane]')).toHaveCount(17)
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
    await expect(page.locator('[data-testid=pane]')).toHaveCount(17)
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

/** Presses on `handle`, moves to (x, y) in steps as a hand would, and optionally releases. */
async function drag(page: Page, handle: Locator, x: number, y: number, release = true) {
  const box = await handle.boundingBox()
  if (box === null) throw new Error('drag handle is not visible')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(x, y, { steps: 12 })
  if (release) await page.mouse.up()
}

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox()
  if (box === null) throw new Error('not visible')
  return box
}

test('dragging a pane by its title onto the edge of another moves it there, and it persists', async () => {
  const { page, userData, close } = await launch()
  try {
    const cpu = page.locator('[data-testid=pane][data-widget=cpu]')
    const shell = page.getByTestId('tabs-host')
    const target = await boxOf(shell)

    await drag(
      page,
      cpu.locator('.module-title'),
      target.x + target.width - 20,
      target.y + target.height / 2,
      false,
    )
    await expect(page.getByTestId('pane-drop-preview')).toHaveAttribute('data-placement', 'right')
    await page.mouse.up()
    await expect(page.getByTestId('pane-drag')).toHaveCount(0)

    // The CPU pane now sits to the right of the shell group, in the middle column.
    await expect.poll(async () => (await boxOf(cpu)).x).toBeGreaterThan((await boxOf(shell)).x)
    await expect(page.locator('[data-testid=pane][data-widget=cpu]')).toHaveCount(1)
    await waitForSaved(userData, (json) => {
      const tree = JSON.parse(json) as { root: LayoutNode }
      const holder = findParentSplit(tree.root, (n) => n.kind === 'tabs')
      return holder?.children.some((c) => c.kind === 'pane' && c.widget === 'cpu') ?? false
    })
  } finally {
    await close()
  }
})

test('a shell tab dragged out of its group keeps its session and its header', async () => {
  const { page, close } = await launch()
  try {
    const strip = page.getByTestId('tabs-host').getByTestId('tab')
    await expect(strip).toHaveCount(3)
    await expect
      .poll(async () => (await page.evaluate(() => window.elecdex.pty.list())).length, {
        timeout: 20_000,
      })
      .toBe(3)
    const sessions = (await page.evaluate(() => window.elecdex.pty.list())).map((s) => s.id).sort()
    const moved = await strip.last().getAttribute('data-pane-id')
    const globe = await boxOf(page.locator('[data-testid=pane][data-widget=globe]'))

    await drag(page, strip.last(), globe.x + globe.width / 2, globe.y + 8)

    await expect(strip).toHaveCount(2)
    const pane = page.locator(`[data-testid=pane][data-pane-id="${moved}"]`)
    await expect(pane).toHaveAttribute('data-chrome', 'shell')
    await expect(pane.getByTestId('terminal-host')).toBeVisible()
    await expect(pane.getByTestId('pane-subtitle')).not.toHaveText('', { timeout: 20_000 })
    // Nothing started or ended: the pane reattached to the shell it already had.
    await page.waitForTimeout(3000)
    const after = (await page.evaluate(() => window.elecdex.pty.list())).map((s) => s.id).sort()
    expect(after).toEqual(sessions)
  } finally {
    await close()
  }
})

test('Escape cancels a pane drag, and a drop onto itself changes nothing', async () => {
  const { page, close } = await launch()
  try {
    const widgets = () =>
      page.$$eval('[data-testid=pane]', (els) => els.map((e) => e.getAttribute('data-widget')))
    const before = await widgets()
    const memory = page.locator('[data-testid=pane][data-widget=memory]')
    const globe = await boxOf(page.locator('[data-testid=pane][data-widget=globe]'))

    await drag(
      page,
      memory.locator('.module-title'),
      globe.x + globe.width / 2,
      globe.y + globe.height / 2,
      false,
    )
    await expect(page.getByTestId('pane-drop-preview')).toHaveAttribute('data-placement', 'tab')
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('pane-drag')).toHaveCount(0)
    await page.mouse.up()

    const own = await boxOf(memory)
    await drag(
      page,
      memory.locator('.module-title'),
      own.x + own.width / 2,
      own.y + own.height / 2,
      false,
    )
    await expect(page.getByTestId('pane-drag')).toHaveCount(1)
    await expect(page.getByTestId('pane-drop-preview')).toHaveCount(0)
    await page.mouse.up()

    expect(await widgets()).toEqual(before)
  } finally {
    await close()
  }
})

test('an untitled pane is dragged by the strip along its top rule', async () => {
  const { page, close } = await launch()
  try {
    const clock = page.locator('[data-testid=pane][data-widget=clock]')
    const weather = await boxOf(page.locator('[data-testid=pane][data-widget=weather]'))
    await drag(
      page,
      clock.getByTestId('pane-drag-strip'),
      weather.x + 10,
      weather.y + weather.height / 2,
    )
    await expect.poll(async () => (await boxOf(clock)).x).toBeGreaterThan(weather.x - 20)
  } finally {
    await close()
  }
})

/** The split that directly holds a node matching `match`, searched depth first. */
function findParentSplit(
  node: LayoutNode,
  match: (n: LayoutNode) => boolean,
): Extract<LayoutNode, { kind: 'split' }> | null {
  if (node.kind !== 'split') return null
  if (node.children.some(match)) return node
  for (const child of node.children) {
    const found = findParentSplit(child, match)
    if (found !== null) return found
  }
  return null
}
