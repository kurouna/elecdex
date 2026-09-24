import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { launch, SINGLE_TERMINAL, settleLayout, showStatusBar, terminalPane } from './support.js'

/**
 * Layout presets (shared/layout-presets.ts, architecture.md §5.6): the shelf in
 * the LAYOUTS dialog, what a first start is given, putting a layout back to its
 * preset, and the blink a choice makes before the switch.
 *
 * support.ts turns the first start's presets off for every other spec; these
 * turn them back on.
 */

const SEED = { ELECDEX_SEED_LAYOUTS: '1' }
const NO_SWITCH_PROMPT = { layout: { confirmSwitch: false } } as const
const PRESETS = ['standard', 'network', 'earth', 'dev', 'media', 'desk']

const widget = (page: Page, id: string) => page.locator(`[data-testid=pane][data-widget="${id}"]`)
const card = (page: Page, id: string) =>
  page.locator(`[data-testid=layouts-preset][data-preset="${id}"]`)

const savedFile = (userData: string) =>
  JSON.parse(readFileSync(path.join(userData, 'layouts.json'), 'utf8')) as {
    items: { id: string; name: string; preset?: string }[]
    active: string | null
  }

async function openLayouts(page: Page): Promise<void> {
  await page.keyboard.press('Control+Shift+KeyG')
  await expect(page.getByTestId('layouts-dialog')).toBeVisible()
}

/** Remembers, in the page, whether anything in the dialog was ever marked as chosen. */
async function watchChoice(page: Page): Promise<void> {
  await page.evaluate(() => {
    const seen = window as unknown as { __chosen?: boolean }
    seen.__chosen = false
    new MutationObserver(() => {
      if (document.querySelector('[data-chosen=true]') !== null) seen.__chosen = true
    }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-chosen'] })
  })
}

const choiceWasSeen = (page: Page) =>
  page.evaluate(() => (window as unknown as { __chosen?: boolean }).__chosen === true)

test('a first start has every preset on the number keys, and only a first start', async () => {
  let launched = await launch(undefined, { env: SEED })
  const first = launched
  const { userData } = first
  try {
    const saved = savedFile(userData)
    expect(saved.items.map((l) => l.preset)).toEqual(PRESETS)
    expect(saved.items.map((l) => l.name)).toEqual(PRESETS)
    // The workspace is the default arrangement, which is the first of them.
    expect(saved.active).toBe(saved.items[0]?.id)

    await showStatusBar(first.page)
    const slots = first.page.getByTestId('layout-slot')
    await expect(slots).toHaveCount(PRESETS.length)
    await expect(slots.nth(2)).toHaveAttribute('data-name', 'earth')
    await expect(slots.nth(0)).toHaveAttribute('aria-pressed', 'true')

    await openLayouts(first.page)
    await expect(first.page.getByTestId('layouts-item')).toHaveCount(PRESETS.length)
    // A thumbnail per row and per card.
    await expect(first.page.getByTestId('layouts-dialog').getByTestId('layout-thumb')).toHaveCount(
      PRESETS.length * 2,
    )
    await expect(card(first.page, 'standard').getByTestId('layouts-preset-badge')).toHaveText(
      'in this one',
    )
    await expect(card(first.page, 'desk').getByTestId('layouts-preset-badge')).toHaveText('on 6')

    // One forgotten, and the app started again: nothing comes back.
    const remove = first.page.getByTestId('layouts-remove').nth(5)
    await remove.click()
    await remove.click()
    await expect(first.page.getByTestId('layouts-item')).toHaveCount(PRESETS.length - 1)
    await expect(card(first.page, 'desk').getByTestId('layouts-preset-badge')).toHaveText('+ add')
    await first.page.keyboard.press('Escape')

    launched = await first.relaunch()
    expect(savedFile(userData).items.map((l) => l.preset)).toEqual(PRESETS.slice(0, -1))
    await openLayouts(launched.page)
    await expect(launched.page.getByTestId('layouts-item')).toHaveCount(PRESETS.length - 1)
  } finally {
    await launched.close()
  }
})

test('an existing profile is given no presets, and a card adds one and goes there', async () => {
  const { page, userData, close } = await launch(undefined, {
    env: SEED,
    layout: SINGLE_TERMINAL,
    settings: NO_SWITCH_PROMPT,
  })
  try {
    await openLayouts(page)
    // layout.json was there before: this is not a first start.
    await expect(page.getByTestId('layouts-item')).toHaveCount(0)
    await expect(page.getByTestId('layouts-preset')).toHaveCount(PRESETS.length)
    for (const badge of await page.getByTestId('layouts-preset-badge').all()) {
      await expect(badge).toHaveText('+ add')
    }

    await watchChoice(page)
    await card(page, 'desk').click()
    await expect(page.getByTestId('layouts-dialog')).toHaveCount(0)
    await settleLayout(page)
    expect(await choiceWasSeen(page), 'the card blinked before the switch').toBe(true)
    for (const id of ['notes', 'todo', 'calendar', 'timer', 'calc', 'cpu']) {
      await expect(widget(page, id), id).toHaveCount(1)
    }
    await expect(terminalPane(page)).toHaveCount(0)

    let saved = savedFile(userData)
    expect(saved.items.map((l) => [l.name, l.preset])).toEqual([['desk', 'desk']])
    expect(saved.active).toBe(saved.items[0]?.id)

    // From the keyboard: Tab onto the shelf, along it to dev, Enter.
    await openLayouts(page)
    await expect(card(page, 'desk').getByTestId('layouts-preset-badge')).toHaveText('in this one')
    await card(page, 'earth').focus()
    await page.keyboard.press('ArrowRight')
    await expect(card(page, 'dev')).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('layouts-dialog')).toHaveCount(0)
    await settleLayout(page)
    await expect(widget(page, 'git')).toHaveCount(1)
    await expect(widget(page, 'agents')).toHaveCount(1)

    // The desk card again goes back to the layout made from it; nothing is added.
    await openLayouts(page)
    await card(page, 'desk').click()
    await expect(page.getByTestId('layouts-dialog')).toHaveCount(0)
    await settleLayout(page)
    await expect(widget(page, 'notes')).toHaveCount(1)
    saved = savedFile(userData)
    expect(saved.items.map((l) => l.preset)).toEqual(['desk', 'dev'])
  } finally {
    await close()
  }
})

test('a layout made from a preset keeps the work done in it, and can be put back', async () => {
  const { page, userData, close } = await launch(undefined, {
    env: SEED,
    layout: SINGLE_TERMINAL,
    settings: NO_SWITCH_PROMPT,
  })
  try {
    await openLayouts(page)
    await card(page, 'desk').click()
    await settleLayout(page)

    // The timer closed: the layout follows the work, so desk no longer has one.
    await widget(page, 'timer').click()
    await page.keyboard.press('Control+Shift+KeyW')
    await expect(widget(page, 'timer')).toHaveCount(0)
    await expect.poll(() => JSON.stringify(savedFile(userData).items[0])).not.toContain('"timer"')

    // A layout the user saved has no restore; one made from a preset has.
    await openLayouts(page)
    await page.getByTestId('layouts-name').fill('mine')
    await page.getByTestId('layouts-save').click()
    await expect(page.getByTestId('layouts-item')).toHaveCount(2)
    await expect(page.getByTestId('layouts-restore')).toHaveCount(1)
    await page.keyboard.press('Escape')

    // Back to desk, which is where the timer was closed, and put it back.
    await page.keyboard.press('Control+Shift+Digit1')
    await settleLayout(page)
    await openLayouts(page)
    const restore = page.getByTestId('layouts-restore')
    await restore.click()
    await expect(restore).toHaveText('click again to restore')
    await restore.click()
    await settleLayout(page)
    // The layout being worked in was put back, so the workspace went back with it.
    await expect(widget(page, 'timer')).toHaveCount(1)
    await expect.poll(() => JSON.stringify(savedFile(userData).items[0])).toContain('"timer"')
    // Its name and place are kept, and "mine" is untouched.
    expect(savedFile(userData).items.map((l) => l.name)).toEqual(['desk', 'mine'])
  } finally {
    await close()
  }
})

test('a preset asks about the shells first, and no leaves the list as it was', async () => {
  const { page, userData, close } = await launch(undefined, { env: SEED, layout: SINGLE_TERMINAL })
  try {
    await openLayouts(page)
    await card(page, 'earth').click()
    const ask = page.getByTestId('switch-layout-dialog')
    await expect(ask).toBeVisible()
    await expect(ask.getByTestId('switch-layout-name')).toHaveText('earth')
    await ask.getByTestId('switch-layout-cancel').click()
    await expect(ask).toHaveCount(0)
    await expect(terminalPane(page)).toHaveCount(1)
    await expect(widget(page, 'orbit')).toHaveCount(0)
    // Nothing was added.
    await openLayouts(page)
    await expect(page.getByTestId('layouts-item')).toHaveCount(0)
    expect(() => savedFile(userData)).toThrow()
  } finally {
    await close()
  }
})

test('with motion reduced, a choice in the layouts dialog does not blink', async () => {
  const { page, close } = await launch(undefined, {
    env: SEED,
    layout: SINGLE_TERMINAL,
    settings: { motion: 'reduced', ...NO_SWITCH_PROMPT },
  })
  try {
    await openLayouts(page)
    await watchChoice(page)
    await card(page, 'desk').click()
    await expect(page.getByTestId('layouts-dialog')).toHaveCount(0)
    await expect(widget(page, 'notes')).toHaveCount(1)
    expect(await choiceWasSeen(page)).toBe(false)
  } finally {
    await close()
  }
})
