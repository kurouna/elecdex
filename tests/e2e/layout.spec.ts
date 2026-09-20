import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { launch, SINGLE_TERMINAL, showStatusBar, terminalPane, typeInto } from './support.js'

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
    // No column headers (eDEX-UI's PANEL / SYSTEM): panes move between columns, so
    // the only label pair left is the shell's own header.
    await expect(page.locator('header.hud-label')).toHaveCount(1)
    await expect(page.getByTestId('tabs-host').locator('header.hud-label')).toHaveCount(1)
    await expect(page.getByText(/^panel$/i)).toHaveCount(0)
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

test('a layout saved with column headers still loads, without them', async () => {
  const pane = (id: string, widget: string) => ({ kind: 'pane', id, widget })
  const layout = {
    version: 1,
    root: {
      kind: 'split',
      id: 'root',
      direction: 'row',
      children: [
        {
          kind: 'split',
          id: 'left',
          direction: 'column',
          children: [pane('cpu', 'cpu'), pane('memory', 'memory')],
          sizes: [0.5, 0.5],
          label: { left: 'panel', right: 'system' },
        },
        pane('shell', 'terminal'),
      ],
      sizes: [0.3, 0.7],
    },
  }
  const { page, userData, close } = await launch(undefined, { layout })
  try {
    // The saved arrangement, not the default one it would fall back to.
    const widgets = await page.$$eval('[data-testid=pane]', (els) =>
      els.map((e) => e.getAttribute('data-widget')),
    )
    expect(widgets).toEqual(['cpu', 'memory', 'terminal'])
    await expect(page.getByText(/^system$/i)).toHaveCount(0)
    // The next save writes the tree without the header.
    await page.getByTestId('split-handle').first().focus()
    await page.keyboard.press('ArrowRight')
    const saved = await waitForSaved(userData, (json) => !json.includes('"label"'))
    expect(saved).toContain('"id": "left"')
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
        sizes: [0.4, 0.3, 0.3],
        children: [
          { kind: 'pane', id: 'a', widget: 'terminal' },
          { kind: 'pane', id: 'b', widget: 'plugin:not-installed' },
          { kind: 'pane', id: 'c', widget: 'no-such-widget' },
        ],
      },
    }),
    'utf8',
  )

  const second = await launch(userData)
  try {
    await expect(second.page.getByTestId('pane-missing')).toContainText('no-such-widget')
    // A plugin pane says the plugin is not in the folder, and keeps its place for when it is.
    const plugin = second.page.locator('[data-pane-id=b] [data-testid=plugin-pane]')
    await expect(plugin).toHaveAttribute('data-status', 'missing')
    await expect(plugin).toContainText('not-installed is not in the plugins folder')
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

/**
 * Keeps the workspace under a name from the layouts dialog, and closes it again.
 * Four tests here do this, so it lives once.
 */
async function keepLayout(page: Page, name: string): Promise<void> {
  await page.keyboard.press('Control+Shift+KeyG')
  await page.getByTestId('layouts-name').fill(name)
  await page.getByTestId('layouts-save').click()
  await expect(page.getByTestId('layouts-item').filter({ hasText: name })).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('layouts-dialog')).toHaveCount(0)
}

/**
 * Switching between saved layouts without the question about the shells, which
 * has its own test: these are about the layouts, not about being asked.
 */
const NO_SWITCH_PROMPT = { layout: { confirmSwitch: false } } as const

test('a layout can be saved by name, applied again and forgotten', async () => {
  const { page, userData, close } = await launch(undefined, {
    layout: SINGLE_TERMINAL,
    settings: NO_SWITCH_PROMPT,
  })
  try {
    // One terminal, saved as "one".
    await page.keyboard.press('Control+Shift+KeyG')
    const dialog = page.getByTestId('layouts-dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByTestId('layouts-name').fill('one')
    await dialog.getByTestId('layouts-save').click()
    await expect(dialog.getByTestId('layouts-item')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)

    // A second name for the same arrangement, which is now the one being worked
    // in - so the split below belongs to "two" and leaves "one" as it is. (That
    // is the whole point of a layout following the work; rearranging before
    // saving the second name would put the split into "one" as well.)
    await page.keyboard.press('Control+Shift+KeyG')
    await dialog.getByTestId('layouts-name').fill('two')
    await dialog.getByTestId('layouts-save').click()
    await expect(dialog.getByTestId('layouts-item')).toHaveCount(2)
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)

    await terminalPane(page).first().locator('.xterm-helper-textarea').first().focus()
    await page.keyboard.press('Control+Shift+KeyE')
    await expect(terminalPane(page)).toHaveCount(2)

    // The saved layouts live in a file of their own: layout.json still means
    // the one live arrangement.
    const saved = JSON.parse(readFileSync(path.join(userData, 'layouts.json'), 'utf8'))
    expect(saved.items.map((item: { name: string }) => item.name)).toEqual(['one', 'two'])

    // The shortcut for the first slot brings the single terminal back, and the
    // live layout on disk follows.
    await page.keyboard.press('Control+Shift+Digit1')
    await expect(terminalPane(page)).toHaveCount(1)
    await waitForSaved(userData, (json) => (json.match(/"terminal"/g) ?? []).length === 1)

    // And the second slot puts the split back.
    await page.keyboard.press('Control+Shift+Digit2')
    await expect(terminalPane(page)).toHaveCount(2)

    // Saving over a name updates that entry rather than adding another.
    await page.keyboard.press('Control+Shift+KeyG')
    await dialog.getByTestId('layouts-name').fill('two')
    await expect(dialog.getByTestId('layouts-save')).toHaveText('update')
    await dialog.getByTestId('layouts-save').click()
    await expect(dialog.getByTestId('layouts-item')).toHaveCount(2)

    // Forgetting one takes two clicks, as every destructive button here does.
    const remove = dialog.getByTestId('layouts-remove').first()
    await remove.click()
    await remove.click()
    await expect(dialog.getByTestId('layouts-item')).toHaveCount(1)
    await expect(dialog.getByTestId('layouts-item')).toHaveAttribute('data-name', 'two')
  } finally {
    await close()
  }
})

test('the layout being worked in keeps what is done to the workspace', async () => {
  const { page, userData, close } = await launch(undefined, {
    layout: SINGLE_TERMINAL,
    settings: NO_SWITCH_PROMPT,
  })
  try {
    const split = async () => {
      const before = await terminalPane(page).count()
      await terminalPane(page).first().locator('.xterm-helper-textarea').first().focus()
      await page.keyboard.press('Control+Shift+KeyE')
      await expect(terminalPane(page)).toHaveCount(before + 1)
    }

    // Both names taken while the workspace is one terminal, so what is
    // rearranged next belongs to "two" alone.
    await keepLayout(page, 'one')
    await keepLayout(page, 'two')

    // Rearrange inside "two", then leave it and come back: the change is there.
    // Switching writes the pending save out first, so nothing waits on a timer.
    await split()
    await split()
    await expect(terminalPane(page)).toHaveCount(3)
    await page.keyboard.press('Control+Shift+Digit1')
    await expect(terminalPane(page)).toHaveCount(1)
    await page.keyboard.press('Control+Shift+Digit2')
    await expect(terminalPane(page)).toHaveCount(3)

    // And the layout being worked in is the one that is marked.
    await page.keyboard.press('Control+Shift+KeyG')
    const items = page.getByTestId('layouts-item')
    await expect(items.nth(0)).toHaveAttribute('data-active', 'false')
    await expect(items.nth(1)).toHaveAttribute('data-active', 'true')
    await page.keyboard.press('Escape')

    // A reset belongs to no layout: what is arranged after it must not be
    // written back into the one that was being worked in.
    await page.keyboard.press('Control+Shift+Backspace')
    await expect(page.locator('[data-testid=pane]')).toHaveCount(17)
    await terminalPane(page).first().locator('.xterm-helper-textarea').first().focus()
    await page.keyboard.press('Control+Shift+KeyE')
    await expect(terminalPane(page)).toHaveCount(2)
    await page.keyboard.press('Control+Shift+Digit2')
    await expect(terminalPane(page)).toHaveCount(3)

    const saved = JSON.parse(readFileSync(path.join(userData, 'layouts.json'), 'utf8'))
    expect(saved.items.map((item: { name: string }) => item.name)).toEqual(['one', 'two'])
  } finally {
    await close()
  }
})

test('a saved layout survives a restart, and an empty slot leaves its keys alone', async () => {
  let launched = await launch(undefined, { layout: SINGLE_TERMINAL, settings: NO_SWITCH_PROMPT })
  try {
    // Nothing is saved yet: the slot shortcut must not swallow the key.
    await launched.page.keyboard.press('Control+Shift+Digit1')
    await expect(terminalPane(launched.page)).toHaveCount(1)

    await launched.page.keyboard.press('Control+Shift+KeyG')
    await launched.page.getByTestId('layouts-name').fill('kept')
    await launched.page.getByTestId('layouts-save').click()
    await expect(launched.page.getByTestId('layouts-item')).toHaveCount(1)
    await launched.page.keyboard.press('Escape')

    launched = await launched.relaunch()
    await launched.page.keyboard.press('Control+Shift+KeyG')
    await expect(launched.page.getByTestId('layouts-item')).toHaveAttribute('data-name', 'kept')
  } finally {
    await launched.close()
  }
})

test('a switch is asked about while shells are open, and can be told to stop asking', async () => {
  const { page, userData, close } = await launch(undefined, { layout: SINGLE_TERMINAL })
  try {
    await keepLayout(page, 'one')
    await terminalPane(page).first().locator('.xterm-helper-textarea').first().focus()
    await page.keyboard.press('Control+Shift+KeyE')
    await expect(terminalPane(page)).toHaveCount(2)
    await keepLayout(page, 'two')

    // Going back to "one" would end two shells, so it asks first, and saying no
    // leaves the workspace exactly as it was.
    await page.keyboard.press('Control+Shift+Digit1')
    const ask = page.getByTestId('switch-layout-dialog')
    await expect(ask).toBeVisible()
    await expect(ask.getByTestId('switch-layout-name')).toHaveText('one')
    await expect(ask.getByTestId('switch-layout-cost')).toContainText('2 shells')
    await page.keyboard.press('Escape')
    await expect(ask).toHaveCount(0)
    await expect(terminalPane(page)).toHaveCount(2)

    // Saying yes goes.
    await page.keyboard.press('Control+Shift+Digit1')
    await ask.getByTestId('switch-layout-go').click()
    await expect(terminalPane(page)).toHaveCount(1)

    // And "stop asking" both goes and writes the setting, so the next switch is
    // not asked about at all.
    await page.keyboard.press('Control+Shift+Digit2')
    await expect(ask).toBeVisible()
    await ask.getByTestId('switch-layout-always').click()
    await expect(terminalPane(page)).toHaveCount(2)
    await expect
      .poll(
        () =>
          JSON.parse(readFileSync(path.join(userData, 'settings.json'), 'utf8')).layout
            ?.confirmSwitch,
      )
      .toBe(false)

    await page.keyboard.press('Control+Shift+Digit1')
    await expect(terminalPane(page)).toHaveCount(1)
    await expect(ask).toHaveCount(0)

    // And the settings turn the question back on, so the link is not a one-way
    // door.
    await page.keyboard.press('Control+Shift+Period')
    await page.getByTestId('settings-confirm-switch').check()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('settings-dialog')).toHaveCount(0)
    await page.keyboard.press('Control+Shift+Digit2')
    await expect(ask).toBeVisible()
    await ask.getByTestId('switch-layout-cancel').click()
    await expect(terminalPane(page)).toHaveCount(1)
  } finally {
    await close()
  }
})

test('a saved layout can be renamed, and moved onto another number key', async () => {
  const { page, close } = await launch(undefined, {
    layout: SINGLE_TERMINAL,
    settings: NO_SWITCH_PROMPT,
  })
  try {
    const dialog = page.getByTestId('layouts-dialog')
    await keepLayout(page, 'one')
    await keepLayout(page, 'two')
    // Rearranged while "two" is the one being worked in, so the two layouts
    // differ by a split.
    await terminalPane(page).first().locator('.xterm-helper-textarea').first().focus()
    await page.keyboard.press('Control+Shift+KeyE')
    await expect(terminalPane(page)).toHaveCount(2)
    await page.keyboard.press('Control+Shift+KeyG')

    // Rename the second.
    await dialog.getByTestId('layouts-rename').nth(1).click()
    const box = dialog.getByTestId('layouts-rename-box')
    await expect(box).toBeFocused()
    await box.fill('split')
    await box.press('Enter')
    await expect(dialog.getByTestId('layouts-item').nth(1)).toHaveAttribute('data-name', 'split')

    // A name another layout already has is refused, and the old one stays.
    await dialog.getByTestId('layouts-rename').nth(1).click()
    await dialog.getByTestId('layouts-rename-box').fill('one')
    await dialog.getByTestId('layouts-rename-box').press('Enter')
    await expect(dialog.getByTestId('layouts-item').nth(1)).toHaveAttribute('data-name', 'split')

    // Moving it up puts it on key 1, and the key applies it.
    await dialog.getByTestId('layouts-up').nth(1).click()
    await expect(dialog.getByTestId('layouts-item').nth(0)).toHaveAttribute('data-name', 'split')
    await expect(dialog.getByTestId('layouts-up').nth(0)).toBeDisabled()
    await expect(dialog.getByTestId('layouts-down').nth(1)).toBeDisabled()
    await page.keyboard.press('Escape')

    await page.keyboard.press('Control+Shift+Digit2')
    await expect(terminalPane(page)).toHaveCount(1)
    await page.keyboard.press('Control+Shift+Digit1')
    await expect(terminalPane(page)).toHaveCount(2)
  } finally {
    await close()
  }
})

test('the status bar carries a numbered button per saved layout', async () => {
  const { page, close } = await launch(undefined, {
    layout: SINGLE_TERMINAL,
    settings: NO_SWITCH_PROMPT,
  })
  try {
    await keepLayout(page, 'one')
    await keepLayout(page, 'two')
    await terminalPane(page).first().locator('.xterm-helper-textarea').first().focus()
    await page.keyboard.press('Control+Shift+KeyE')
    await expect(terminalPane(page)).toHaveCount(2)

    await showStatusBar(page)
    const slots = page.getByTestId('layout-slot')
    await expect(slots).toHaveCount(2)
    await expect(slots.nth(0)).toHaveText('1')
    await expect(slots.nth(1)).toHaveAttribute('data-name', 'two')
    // The one being worked in is marked rather than offered.
    await expect(slots.nth(1)).toHaveAttribute('aria-pressed', 'true')

    await slots.nth(0).click()
    await expect(terminalPane(page)).toHaveCount(1)
    await showStatusBar(page)
    await expect(page.getByTestId('layout-slot').nth(0)).toHaveAttribute('aria-pressed', 'true')
  } finally {
    await close()
  }
})

test('a save that only carries the state of this run leaves the saved layouts untouched', async () => {
  const { page, userData, close } = await launch(undefined, {
    layout: SINGLE_TERMINAL,
    settings: NO_SWITCH_PROMPT,
  })
  try {
    await page.keyboard.press('Control+Shift+KeyG')
    await page.getByTestId('layouts-name').fill('one')
    await page.getByTestId('layouts-save').click()
    await expect(page.getByTestId('layouts-item')).toHaveCount(1)
    await page.keyboard.press('Escape')

    const saved = path.join(userData, 'layouts.json')
    await expect.poll(() => existsSync(saved)).toBe(true)
    // A saved layout holds no session id, so what is kept for this run must not
    // rewrite it - a shell is created on every reload, and every launch.
    expect(readFileSync(saved, 'utf8')).not.toContain('sessionId')
    const before = statSync(saved).mtimeMs

    const written = await page.evaluate(async () => {
      const tree = await window.elecdex.layout.load()
      const root = tree.root as { state?: Record<string, unknown> }
      root.state = { ...root.state, sessionId: `made-up-${Date.now()}` }
      await window.elecdex.layout.save(tree)
      return root.state.sessionId as string
    })

    await expect
      .poll(() => readFileSync(layoutFile(userData), 'utf8').includes(written), { timeout: 10_000 })
      .toBe(true)
    expect(statSync(saved).mtimeMs, 'layouts.json was not rewritten').toBe(before)
    expect(readFileSync(saved, 'utf8')).not.toContain(written)
  } finally {
    await close()
  }
})

test('a broken entry in layouts.json costs only that entry, and broken JSON is kept aside', async () => {
  const good = {
    id: 'aaaa1111',
    name: 'good',
    tree: { version: 1, root: { kind: 'pane', id: 'p', widget: 'calendar' } },
  }
  const file = (userData: string) => path.join(userData, 'layouts.json')

  // One entry that is not a layout: the others must survive it. Losing eleven
  // arrangements to one bad one is the failure this guards against.
  let launched = await launch(undefined, {
    layout: SINGLE_TERMINAL,
    settings: NO_SWITCH_PROMPT,
  })
  try {
    writeFileSync(
      file(launched.userData),
      JSON.stringify({
        version: 1,
        active: null,
        items: [
          { id: 'bbbb2222', name: 'broken', tree: { version: 1, root: { kind: 'nonsense' } } },
          good,
          'not an entry at all',
        ],
      }),
      'utf8',
    )
    launched = await launched.relaunch()
    await launched.page.keyboard.press('Control+Shift+KeyG')
    const items = launched.page.getByTestId('layouts-item')
    await expect(items).toHaveCount(1)
    await expect(items).toHaveAttribute('data-name', 'good')
    // And it still works: the layout applies.
    await items.click()
    await expect(launched.page.locator('[data-testid=pane][data-widget=calendar]')).toHaveCount(1)
  } finally {
    await launched.close()
  }

  // A file that is not JSON at all is moved aside rather than overwritten, so a
  // hand edit gone wrong can be got back.
  launched = await launch(undefined, { layout: SINGLE_TERMINAL, settings: NO_SWITCH_PROMPT })
  try {
    writeFileSync(file(launched.userData), '{ this is not json', 'utf8')
    launched = await launched.relaunch()
    await launched.page.keyboard.press('Control+Shift+KeyG')
    await expect(launched.page.getByTestId('layouts-item')).toHaveCount(0)
    await expect.poll(() => existsSync(`${file(launched.userData)}.bak`)).toBe(true)
    expect(readFileSync(`${file(launched.userData)}.bak`, 'utf8')).toContain('not json')
  } finally {
    await launched.close()
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
