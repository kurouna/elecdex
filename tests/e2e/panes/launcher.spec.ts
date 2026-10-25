import { execFileSync } from 'node:child_process'
import { expect } from '@playwright/test'
import { test } from '../support/shared.js'
import { beside, launch, quietFor, savedLayout, single } from '../support.js'

/**
 * The application launcher: its tiles, its lists, its search and its popup.
 */

const layout = (widget: string, state?: Record<string, unknown>) =>
  single(widget, state === undefined ? { id: 'p' } : { id: 'p', state })

test("the launcher names its tiles at the filesystem's size, two lines of it", async ({
  shared,
}) => {
  const { page, close } = await shared({
    layout: beside('launcher', { id: 'l', other: 'filesystem' }),
    settings: {
      launcher: {
        showSystem: false,
        items: [
          { name: 'Short', target: '/not/here/a' },
          { name: 'A rather long application name that wraps', target: '/not/here/b' },
        ],
      },
    },
  })
  try {
    await expect(page.getByTestId('launcher-entry')).toHaveCount(2)
    await expect(page.locator('[data-widget=filesystem] .tile .name').first()).toBeVisible({
      timeout: 20_000,
    })
    const sizes = await page.evaluate(() => {
      const root = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
      const rem = (selector: string) => {
        const el = document.querySelector(selector)
        return el === null ? null : Number.parseFloat(getComputedStyle(el).fontSize) / root
      }
      const tile = document.querySelectorAll('[data-testid=launcher-entry]')[1] as HTMLElement
      return {
        launcher: rem('[data-testid=launcher-entry] .name'),
        filesystem: rem('[data-widget=filesystem] .tile .name'),
        // A long name wraps inside its tile rather than spilling out of it.
        spills: tile.scrollHeight > tile.clientHeight + 1,
      }
    })
    // --step--1: a tile's name is what the pane is read by, in both panes alike.
    expect(sizes.launcher).toBeCloseTo(0.75, 2)
    expect(sizes.filesystem).toBeCloseTo(0.75, 2)
    expect(sizes.spills).toBe(false)
  } finally {
    await close()
  }
})

test('the launcher lists user entries first and reports a launch that fails', async ({
  shared,
}) => {
  const { page, close } = await shared({
    layout: layout('launcher'),
    settings: {
      sound: { enabled: false },
      launcher: {
        showSystem: false,
        items: [
          { name: 'Missing Tool', target: '/definitely/not/here/elecdex-e2e-missing' },
          { name: 'Another', target: '/also/not/here' },
        ],
      },
    },
  })
  try {
    const entries = page.getByTestId('launcher-entry')
    await expect(entries).toHaveCount(2)
    await expect(entries.first()).toHaveAttribute('data-source', 'user')
    await expect(entries.first()).toContainText('Missing Tool')

    await page.getByTestId('launcher-filter').fill('anoth')
    await expect(entries).toHaveCount(1)
    await page.getByTestId('launcher-filter').fill('missing')
    await page.getByTestId('launcher-filter').press('Enter')
    await expect(page.getByTestId('launcher-status')).toContainText(/missing tool/i)

    // The renderer can only launch what the list holds.
    const refused = await page.evaluate(() => window.elecdex.launcher.launch('not-an-id'))
    expect(refused).toEqual({ ok: false, error: 'not in the launcher' })
  } finally {
    await close()
  }
})

// Node itself, exiting at once: a program that really starts, on every platform.
// The comment in the script keeps entries' ids apart.
const quick = (name: string) => ({
  name,
  target: process.execPath,
  args: ['-e', `// ${name}`],
})

test('the launcher counts launches and lists the most used first', async () => {
  let launched = await launch(undefined, {
    layout: layout('launcher'),
    settings: {
      sound: { enabled: false },
      launcher: { showSystem: false, items: [quick('Alpha'), quick('Bravo')] },
    },
  })
  try {
    const entries = launched.page.getByTestId('launcher-entry')
    await expect(entries).toHaveCount(2)
    await expect(entries.first()).toContainText('Alpha')

    const bravo = entries.filter({ hasText: 'Bravo' })
    await bravo.click()
    // It blinks where it was clicked, and only then moves up.
    await expect(bravo).toHaveClass(/blinking/)
    await expect(entries.first()).toContainText('Alpha')
    await expect(launched.page.getByTestId('launcher-status')).toContainText(/started bravo/i)
    // Reordered at once, and counted.
    await expect(entries.first()).toContainText('Bravo')
    await expect(entries.first()).toHaveAttribute('data-launches', '1')
    await expect(entries.nth(1)).toHaveAttribute('data-launches', '0')

    // The count survives a restart.
    launched = await launched.relaunch()
    const again = launched.page.getByTestId('launcher-entry')
    await expect(again.first()).toContainText('Bravo')
    await expect(again.first()).toHaveAttribute('data-launches', '1')
  } finally {
    await launched.close()
  }
})

test('a shortcut puts the cursor in the launcher pane search, over and over', async ({
  shared,
}) => {
  const { page, close } = await shared({
    layout: beside('terminal', { id: 't', other: 'launcher', sizes: [0.5, 0.5] }),
    settings: { launcher: { showSystem: false, items: [] } },
  })
  try {
    const filter = page.getByTestId('launcher-filter')
    await page.locator('[data-testid=pane][data-widget=terminal]').dispatchEvent('pointerdown')
    await page.locator('.xterm-helper-textarea').first().focus()
    await page.keyboard.press('Control+Shift+KeyL')
    await expect(filter).toBeFocused()
    // The pane in the layout, not one popped up over it.
    await expect(page.getByTestId('popup-pane')).toHaveCount(0)
    await expect(page.locator('[data-testid=pane][data-widget=launcher]')).toHaveClass(/focused/)

    await page.keyboard.type('abc')
    await page.locator('[data-testid=pane][data-widget=terminal]').dispatchEvent('pointerdown')
    await page.locator('.xterm-helper-textarea').first().focus()
    await page.keyboard.press('Control+Shift+KeyL')
    await expect(filter).toBeFocused()
    // The old query is selected, so typing replaces it.
    await page.keyboard.type('x')
    await expect(filter).toHaveValue('x')
  } finally {
    await close()
  }
})

test('with no launcher in the layout, the shortcut pops one up and leaves the layout as it is', async () => {
  const layout = { version: 1, root: { kind: 'pane', id: 't', widget: 'terminal' } }
  const { page, userData, close } = await launch(undefined, {
    layout,
    settings: { launcher: { showSystem: false, items: [quick('Alpha')] } },
  })
  try {
    // What is on disk once the start has settled (a save of the tree as loaded may land first).
    // wait: that save may or may not come, so there is nothing to wait for but its debounce.
    await page.waitForTimeout(1000)
    const before = savedLayout(userData)
    const shell = page.locator('.xterm-helper-textarea').first()
    await shell.focus()

    await page.keyboard.press('Control+Shift+KeyL')
    const popup = page.getByTestId('popup-pane')
    await expect(popup).toBeVisible()
    await expect(popup).toHaveAttribute('data-widget', 'launcher')
    const filter = popup.getByTestId('launcher-filter')
    await expect(filter).toBeFocused()
    // Nothing was added to the layout: one pane, and no save on its way.
    await expect(page.getByTestId('pane')).toHaveCount(1)

    // Pressed again over it, the search takes the keyboard back, the query selected.
    await page.keyboard.type('abc')
    await popup.getByTestId('popup-close').focus()
    await page.keyboard.press('Control+Shift+KeyL')
    await expect(filter).toBeFocused()
    await page.keyboard.type('x')
    await expect(filter).toHaveValue('x')
    await expect(popup).toHaveCount(1)

    // The layout's own shortcuts stand down behind it: closing a pane closes nothing.
    await page.keyboard.press('Control+Shift+KeyW')
    await expect(page.getByTestId('pane')).toHaveCount(1)

    // Escape puts it away, and the keyboard goes back to the shell.
    await page.keyboard.press('Escape')
    await expect(popup).toHaveCount(0)
    await expect(shell).toBeFocused()
    await expect(page.getByTestId('pane')).toHaveCount(1)

    // Twice the save's debounce: had anything changed the tree, it would be on disk by now.
    await quietFor(1000, async () => savedLayout(userData), 'layout.json')
    expect(savedLayout(userData)).toBe(before)

    // The × puts it away as well.
    await page.keyboard.press('Control+Shift+KeyL')
    await expect(popup).toBeVisible()
    await popup.getByTestId('popup-close').click()
    await expect(popup).toHaveCount(0)

    // Popped up from the picker, it takes the keyboard in its search as well.
    await page.keyboard.press('Control+Shift+KeyA')
    const picker = page.getByTestId('pane-picker')
    await picker.locator('[data-testid=pane-picker-placement][data-placement=popup]').click()
    await picker.locator('[data-testid=pane-picker-item][data-widget=launcher]').click()
    await expect(filter).toBeFocused()
    await page.keyboard.type('al')
    await expect(filter).toHaveValue('al')
  } finally {
    await close()
  }
})

test('a launcher popped up goes once it has started something; a launcher pane stays', async () => {
  const { page, close } = await launch(undefined, {
    layout: { version: 1, root: { kind: 'pane', id: 't', widget: 'terminal' } },
    settings: { launcher: { showSystem: false, items: [quick('Alpha')] } },
  })
  try {
    await page.keyboard.press('Control+Shift+KeyL')
    const popup = page.getByTestId('popup-pane')
    await expect(popup.getByTestId('launcher-entry')).toHaveCount(1)
    await page.keyboard.type('alpha')
    await page.keyboard.press('Enter')
    // The start is seen - the tile blinks - and then the popup goes.
    await expect(popup.getByTestId('launcher-entry')).toHaveClass(/blinking/)
    await expect(popup).toHaveCount(0)
    await expect(page.getByTestId('pane')).toHaveCount(1)
  } finally {
    await close()
  }

  const { page: other, close: closeOther } = await launch(undefined, {
    layout: layout('launcher'),
    settings: { launcher: { showSystem: false, items: [quick('Alpha')] } },
  })
  try {
    const entry = other.getByTestId('launcher-entry')
    await entry.click()
    await expect(other.getByTestId('launcher-status')).toContainText(/started alpha/i)
    await expect(entry).toHaveAttribute('data-launches', '1')
    await expect(other.locator('[data-testid=pane][data-widget=launcher]')).toHaveCount(1)
  } finally {
    await closeOther()
  }
})

test('the launcher lists the platform applications, with icons in the theme colour', async ({
  shared,
}) => {
  const { page, close } = await shared({ layout: layout('launcher') })
  try {
    await expect
      .poll(() => page.getByTestId('launcher-entry').count(), { timeout: 20_000 })
      .toBeGreaterThan(0)
    // An icon is tinted: masked by its own shape over the accent colour.
    const icon = page.getByTestId('launcher-icon').first()
    await expect(icon).toBeVisible({ timeout: 20_000 })
    const style = await icon.evaluate((el) => {
      const s = getComputedStyle(el)
      return { mask: s.maskImage || s.webkitMaskImage, background: s.backgroundColor }
    })
    expect(style.mask).toMatch(/^url\(/)
    expect(style.background).not.toBe('rgba(0, 0, 0, 0)')
  } finally {
    await close()
  }
})

/** The name of a packaged app (Store or MSIX) on this machine, as the Start Menu shows it. */
function packagedAppName(): string | null {
  const script = [
    '[Console]::OutputEncoding = [Text.Encoding]::UTF8',
    "$apps = @((New-Object -ComObject Shell.Application).NameSpace('shell:AppsFolder').Items())",
    // A packaged id as the launcher accepts it, and a name its noise filter keeps ("Get Help" is dropped).
    "$apps | Where-Object { $_.Path -cmatch '^[A-Za-z0-9.-]{1,100}_[a-z0-9]{13}![A-Za-z][A-Za-z0-9.]{0,99}$' -and $_.Name -notmatch '(?i)uninstall|remove|readme|release notes|license|help|website|manual|アンインストール' } |",
    '  Select-Object -First 1 -ExpandProperty Name',
  ].join('\n')
  const out = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script])
  return out.toString('utf8').trim() || null
}

test('the launcher lists packaged apps that have no Start Menu shortcut, with their icons', async ({
  shared,
}) => {
  test.skip(process.platform !== 'win32', 'packaged apps are a Windows thing')
  // Teams, Outlook and the like have no .lnk; a server image may have none of them.
  const name = packagedAppName()
  test.skip(name === null, 'no packaged apps on this machine')
  const { page, close } = await shared({ layout: layout('launcher') })
  try {
    await page.getByTestId('launcher-filter').fill(name ?? '')
    const entry = page.getByTestId('launcher-entry').filter({
      has: page.locator('.name', { hasText: new RegExp(`^${escapeRegExp(name ?? '')}$`) }),
    })
    await expect(entry.first()).toBeVisible({ timeout: 20_000 })
    await expect(entry.first().getByTestId('launcher-icon')).toBeVisible({ timeout: 20_000 })
  } finally {
    await close()
  }
})

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

for (const theme of ['business-dark', 'business-light']) {
  test(`the launcher shows icons in their own colours in ${theme}`, async () => {
    const { page, close } = await launch(undefined, {
      layout: layout('launcher'),
      settings: { theme, sound: { enabled: false } },
    })
    try {
      const icon = page.getByTestId('launcher-icon').first()
      await expect(icon).toBeVisible({ timeout: 20_000 })
      const style = () =>
        icon.evaluate((el) => {
          const s = getComputedStyle(el)
          const img = getComputedStyle(el.querySelector('img') as Element)
          return {
            mask: s.maskImage || s.webkitMaskImage,
            background: s.backgroundColor,
            filter: img.filter,
            blend: img.mixBlendMode,
          }
        })
      await expect
        .poll(style)
        .toEqual({ mask: 'none', background: 'rgba(0, 0, 0, 0)', filter: 'none', blend: 'normal' })
    } finally {
      await close()
    }
  })
}
