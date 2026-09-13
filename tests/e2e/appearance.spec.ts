import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { launch, SINGLE_TERMINAL, showStatusBar } from './support.js'

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
  } finally {
    await close()
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
