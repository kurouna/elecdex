import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { launch, removeDir, SINGLE_TERMINAL, showStatusBar } from './support.js'

/**
 * Themes and settings: switching without a reload, following hand edits to the
 * files, user themes, and persistence.
 */

const rootVar = (page: Page, name: string) =>
  page.evaluate((n) => document.documentElement.style.getPropertyValue(n), name)

/** A value only this page load has, to prove no reload happened. */
const markPage = (page: Page) =>
  page.evaluate(() => {
    ;(window as unknown as { __loadMark: number }).__loadMark = 42
  })
const pageMark = (page: Page) =>
  page.evaluate(() => (window as unknown as { __loadMark?: number }).__loadMark)

test('switching theme restyles everything without reloading, and is saved', async () => {
  const { page, userData, close } = await launch(undefined, { layout: SINGLE_TERMINAL })
  try {
    await expect.poll(() => rootVar(page, '--accent-h')).toBe('183')
    await markPage(page)
    const viewport = page.locator('.xterm-scrollable-element').first()
    const before = await viewport.evaluate((el) => getComputedStyle(el).backgroundColor)

    await showStatusBar(page)
    await page.getByTestId('theme-select').selectOption('amber')

    await expect.poll(() => rootVar(page, '--accent-h')).toBe('36')
    await expect(page.locator('html')).toHaveAttribute('data-scanlines', 'on')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'amber')
    // The terminal was restyled in place, not rebuilt.
    await expect
      .poll(() => viewport.evaluate((el) => getComputedStyle(el).backgroundColor))
      .not.toBe(before)
    expect(await pageMark(page)).toBe(42)

    await expect
      .poll(() => readFileSync(path.join(userData, 'settings.json'), 'utf8'))
      .toMatch(/"theme":\s*"amber"/)
  } finally {
    await close()
  }
})

test('business themes set neutral text, system fonts and their mode, and leaving them resets all of it', async () => {
  const { page, close } = await launch(undefined, { layout: SINGLE_TERMINAL })
  const bodyStyle = () =>
    page.evaluate(() => {
      const style = getComputedStyle(document.body)
      const probe = document.createElement('span')
      probe.style.color = 'var(--warn)'
      document.body.append(probe)
      const warn = getComputedStyle(probe).color
      probe.remove()
      return { color: style.color, font: style.fontFamily, warn }
    })
  try {
    await expect.poll(() => rootVar(page, '--accent-h')).toBe('183')
    const tron = await bodyStyle()

    await showStatusBar(page)
    await page.getByTestId('theme-select').selectOption('business-dark')
    await expect.poll(async () => (await bodyStyle()).color).toBe('rgb(255, 255, 255)')
    expect((await bodyStyle()).font).toContain('Segoe UI')
    await expect(page.locator('html')).toHaveAttribute('data-scanlines', 'off')
    await expect(page.locator('html')).not.toHaveAttribute('data-glow', 'on')
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark')
    const dark = await bodyStyle()

    // Light: dark text, and status colours darkened to read on white.
    await page.getByTestId('theme-select').selectOption('business-light')
    await expect.poll(async () => (await bodyStyle()).color).toBe('rgb(26, 26, 26)')
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'light')
    expect((await bodyStyle()).warn).not.toBe(dark.warn)

    // No variable of a business theme may linger once another theme is chosen.
    await page.getByTestId('theme-select').selectOption('tron')
    await expect.poll(bodyStyle).toEqual(tron)
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark')
  } finally {
    await close()
  }
})

test('a hand edit to settings.json applies while the app runs', async () => {
  const { page, userData, close } = await launch()
  try {
    await expect.poll(() => rootVar(page, '--accent-h')).toBe('183')
    await markPage(page)
    writeFileSync(
      path.join(userData, 'settings.json'),
      JSON.stringify({ theme: 'phosphor', sound: { enabled: false } }, null, 2),
    )
    await expect.poll(() => rootVar(page, '--accent-h'), { timeout: 10_000 }).toBe('128')
    await expect(page.getByTestId('theme-select')).toHaveValue('phosphor')
    expect(await pageMark(page)).toBe(42)

    // A half-written file is ignored, not quarantined.
    writeFileSync(path.join(userData, 'settings.json'), '{ "theme": ')
    await page.waitForTimeout(1000)
    expect(await rootVar(page, '--accent-h')).toBe('128')
    expect(readFileSync(path.join(userData, 'settings.json'), 'utf8')).toBe('{ "theme": ')

    // A change from the UI replaces it, but keeps the broken edit in .bak.
    await showStatusBar(page)
    await page.getByTestId('theme-select').selectOption('amber')
    await expect.poll(() => rootVar(page, '--accent-h')).toBe('36')
    expect(readFileSync(path.join(userData, 'settings.json.bak'), 'utf8')).toBe('{ "theme": ')
    expect(JSON.parse(readFileSync(path.join(userData, 'settings.json'), 'utf8')).theme).toBe(
      'amber',
    )
  } finally {
    await close()
  }
})

test('a settings.json broken before launch is kept through startup and quit', async () => {
  const first = await launch()
  const dir = first.userData
  const file = path.join(dir, 'settings.json')
  const broken = '{ "theme": "amber", '
  let running: Awaited<ReturnType<typeof launch>> | null = null
  try {
    await first.app.close()
    writeFileSync(file, broken)
    const broke = await launch(dir)
    running = broke
    // Defaults apply, but the user's file is where they left it.
    await expect.poll(() => rootVar(broke.page, '--accent-h')).toBe('183')
    expect(readFileSync(file, 'utf8')).toBe(broken)
    running = null
    await broke.app.close()
    expect(readFileSync(file, 'utf8')).toBe(broken)
    expect(existsSync(`${file}.bak`)).toBe(false)

    // Fixing it by hand while the app runs applies it.
    const fixed = await launch(dir)
    running = fixed
    writeFileSync(file, JSON.stringify({ theme: 'phosphor', sound: { enabled: false } }))
    await expect.poll(() => rootVar(fixed.page, '--accent-h'), { timeout: 10_000 }).toBe('128')
  } finally {
    await running?.app.close()
    removeDir(dir)
  }
})

test('a theme dropped into the themes folder appears and can be chosen', async () => {
  const { page, userData, close } = await launch()
  try {
    const dir = path.join(userData, 'themes')
    mkdirSync(dir, { recursive: true })
    writeFileSync(
      path.join(dir, 'ice.json'),
      JSON.stringify({
        id: 'ice',
        name: 'Ice',
        accent: { h: 200, s: 60, l: 70 },
        surfaces: { s0: '#000000', s1: '#010203', s2: '#040506', line: '#101820' },
      }),
    )
    writeFileSync(path.join(dir, 'broken.json'), JSON.stringify({ id: 'broken' }))

    const select = page.getByTestId('theme-select')
    await expect(select.locator('option[value=ice]')).toHaveCount(1, { timeout: 10_000 })
    await expect(select.locator('option[value=broken]')).toHaveCount(0)
    const catalog = await page.evaluate(() => window.elecdex.themes.list())
    expect(catalog.problems.map((p) => p.file)).toEqual(['broken.json'])

    // And the settings say why, rather than leaving the file silently missing
    // from the list of themes.
    await page.keyboard.press('Control+Shift+Period')
    const problems = page.getByTestId('theme-problems')
    await expect(problems).toContainText('broken.json')
    await expect(problems).toContainText('accent')
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('settings-dialog')).toHaveCount(0)

    await showStatusBar(page)
    await select.selectOption('ice')
    await expect.poll(() => rootVar(page, '--accent-h')).toBe('200')
  } finally {
    await close()
  }
})

test('the theme and sound setting survive a restart', async () => {
  let launched = await launch()
  try {
    await showStatusBar(launched.page)
    await launched.page.getByTestId('theme-select').selectOption('phosphor')
    const sound = launched.page.getByTestId('sound-toggle')
    await expect(sound).toHaveAttribute('aria-pressed', 'false')
    await sound.click()
    await expect(sound).toHaveAttribute('aria-pressed', 'true')
    await sound.click()
    await expect(sound).toHaveAttribute('aria-pressed', 'false')

    launched = await launched.relaunch()
    await expect.poll(() => rootVar(launched.page, '--accent-h')).toBe('128')
    await expect(launched.page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'false')
  } finally {
    await launched.close()
  }
})

test('an unknown theme id falls back to the default', async () => {
  const { page, close } = await launch(undefined, {
    settings: { theme: 'no-such-theme', sound: { enabled: false } },
  })
  try {
    await expect.poll(() => rootVar(page, '--accent-h')).toBe('183')
    await expect(page.getByTestId('theme-select')).toHaveValue('tron')
  } finally {
    await close()
  }
})
