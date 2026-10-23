import { expect, type Page, test } from '@playwright/test'
import {
  type Launched,
  type LaunchOptions,
  launch,
  NO_SWITCH_PROMPT,
  paneById,
  savedLayout,
  savedSettings,
  settleLayout,
  single,
  typeInto,
} from './support.js'

/**
 * The action palette in the running app (docs/palette.md section 7.4): opened by its key,
 * a row doing what that row's key does, through the workspace's own shortcuts.
 */

const pane = (id: string, widget: string) => ({ kind: 'pane', id, widget })
const ONE_CLOCK = single('clock', { id: 'c' })
const TWO_CLOCK_TABS = {
  version: 1,
  root: {
    kind: 'tabs',
    id: 't',
    activeIndex: 0,
    children: [pane('a', 'clock'), pane('b', 'clock')],
  },
}
const SHELL_AND_CLOCK = {
  version: 1,
  root: {
    kind: 'split',
    id: 's',
    direction: 'row',
    sizes: [0.5, 0.5],
    children: [pane('sh', 'terminal'), pane('c', 'clock')],
  },
}

const palette = (page: Page) => page.getByTestId('action-palette')
const selectedRow = (page: Page) =>
  page.locator('[data-testid=action-palette-row][aria-selected=true]')
const panes = (page: Page) => page.locator('[data-testid=pane]:not(.hidden)')

async function start(layout: unknown, options: LaunchOptions = {}): Promise<Launched> {
  const launched = await launch(undefined, { layout, ...options })
  await settleLayout(launched.page)
  return launched
}

/** Opens the palette, types into it and waits for the row the words lead to. */
async function find(page: Page, words: string, key: string): Promise<void> {
  if (!(await palette(page).isVisible())) await page.keyboard.press('Control+Shift+KeyP')
  await expect(palette(page)).toBeVisible()
  await page.getByTestId('action-palette-filter').fill(words)
  await expect(selectedRow(page)).toHaveAttribute('data-key', key)
}

/** The layout main last wrote, without the ids a new pane is given afresh each time. */
function shape(userData: string): unknown {
  const text = savedLayout(userData)
  if (text === null) return null
  return JSON.parse(text, (key, value) => (key === 'id' || key === 'state' ? undefined : value))
}

/** settings.json's theme as main last wrote it. */
const theme = (userData: string) => savedSettings(userData)?.theme

test('a row does what its key does: split right as Ctrl+Shift+E would', async () => {
  const byKey = await start(ONE_CLOCK)
  let expected: unknown
  try {
    await paneById(byKey.page, 'c').click()
    await byKey.page.keyboard.press('Control+Shift+KeyE')
    await expect(panes(byKey.page)).toHaveCount(2)
    await expect.poll(() => JSON.stringify(shape(byKey.userData))).toContain('"split"')
    expected = shape(byKey.userData)
  } finally {
    await byKey.close()
  }

  const { page, userData, close } = await start(ONE_CLOCK)
  try {
    await paneById(page, 'c').click()
    await find(page, 'split right', 'action:pane.splitRight')
    await page.keyboard.press('Enter')
    await expect(palette(page)).toHaveCount(0)
    await expect(panes(page)).toHaveCount(2)
    await expect.poll(() => shape(userData)).toEqual(expected)
  } finally {
    await close()
  }
})

test('a row that does nothing now says why and stays; from a tab group it runs', async () => {
  const lone = await start(ONE_CLOCK)
  try {
    await paneById(lone.page, 'c').click()
    await find(lone.page, 'next tab', 'action:tab.next')
    await expect(selectedRow(lone.page)).toHaveClass(/unavailable/)
    await expect(selectedRow(lone.page)).toContainText('not in a tab group')
    await lone.page.keyboard.press('Enter')
    await expect(palette(lone.page)).toBeVisible()
  } finally {
    await lone.close()
  }

  const { page, close } = await start(TWO_CLOCK_TABS)
  try {
    await page.locator('[data-testid=tab][data-pane-id=a]').click()
    await find(page, 'next tab', 'action:tab.next')
    await expect(selectedRow(page)).not.toHaveClass(/unavailable/)
    await page.keyboard.press('Enter')
    await expect(palette(page)).toHaveCount(0)
    await expect(page.locator('.tab.active [data-testid=tab]')).toHaveAttribute('data-pane-id', 'b')
  } finally {
    await close()
  }
})

test('while it is open, the shortcuts and the shell get nothing', async () => {
  const { page, close } = await start(SHELL_AND_CLOCK)
  try {
    const shell = paneById(page, 'sh')
    await shell.locator('.xterm-helper-textarea').focus()
    await page.keyboard.press('Control+Shift+KeyP')
    await expect(palette(page)).toBeVisible()
    await page.keyboard.press('Control+Shift+KeyE')
    await page.keyboard.press('Control+Shift+KeyW')
    await page.keyboard.type('zqxjpalette')
    await expect(page.getByTestId('action-palette-filter')).toHaveValue('zqxjpalette')
    await page.keyboard.press('Escape')
    await expect(palette(page)).toHaveCount(0)
    await expect(panes(page)).toHaveCount(2)
    // The shell is drawn on a canvas: its search reads what it holds. A line typed now is
    // found, and the letters typed into the palette are not, before it or anywhere.
    await typeInto(page, shell, 'echo palette-sentinel')
    await page.keyboard.press('Control+Shift+KeyF')
    const box = shell.getByTestId('terminal-search-box')
    const tally = shell.getByTestId('terminal-search-tally')
    const search = async (words: string): Promise<string> => {
      await box.fill('')
      await box.fill(words)
      return `${await tally.getAttribute('class')} ${await tally.textContent()}`
    }
    // A count for the line typed; "none" for the palette's letters.
    await expect.poll(() => search('palette-sentinel'), { timeout: 20_000 }).toMatch(/ \d/)
    await expect.poll(() => search('zqxj')).toMatch(/\bnone\b/)
  } finally {
    await close()
  }
})

test('the reset asks by a second Enter when its own question is turned off', async () => {
  const { page, close } = await start(SHELL_AND_CLOCK, {
    settings: NO_SWITCH_PROMPT,
  })
  try {
    await find(page, 'reset layout', 'action:layout.reset')
    await page.keyboard.press('Enter')
    await expect(selectedRow(page)).toContainText('enter again to reset')
    await expect(panes(page)).toHaveCount(2)
    await page.keyboard.press('Enter')
    await expect(palette(page)).toHaveCount(0)
    await settleLayout(page)
    await expect(paneById(page, 'c')).toHaveCount(0)
  } finally {
    await close()
  }
})

test('a theme is used once chosen, and nothing changes on Escape', async () => {
  const { page, userData, close } = await start(ONE_CLOCK)
  try {
    await find(page, 'amber', 'theme:amber')
    await page.keyboard.press('Escape')
    await expect(palette(page)).toHaveCount(0)
    expect(theme(userData) ?? 'tron').toBe('tron')
    await find(page, 'amber', 'theme:amber')
    await page.keyboard.press('Enter')
    await expect.poll(() => theme(userData)).toBe('amber')
    await page.keyboard.press('Control+Shift+KeyP')
    await page.getByTestId('action-palette-filter').fill('amber')
    await expect(selectedRow(page)).toContainText('current')
  } finally {
    await close()
  }
})

test('a settings row opens the dialog at its section, out of the palette’s line', async () => {
  const { page, close } = await start(ONE_CLOCK)
  try {
    await find(page, 'settings keyboard', 'settings:keyboard')
    await page.keyboard.press('Enter')
    const dialog = page.getByTestId('settings-dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('style', /--crt-delay/)
    await expect(
      page.locator('[data-testid=settings-section][data-section=keyboard]'),
    ).toHaveAttribute('aria-current', 'page')
  } finally {
    await close()
  }
})

test('a preset with shells open asks first, as its key does', async () => {
  const { page, close } = await start(SHELL_AND_CLOCK)
  try {
    await find(page, 'standard', 'preset:standard')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('switch-layout-dialog')).toBeVisible()
    await page.getByTestId('switch-layout-cancel').click()
    await expect(panes(page)).toHaveCount(2)
  } finally {
    await close()
  }
})

test('it opens over a pane popped up, which goes; other keys stay shut out there', async () => {
  const { page, close } = await start(ONE_CLOCK)
  try {
    // With no launcher in the layout, its key pops one up.
    await page.keyboard.press('Control+Shift+KeyL')
    await expect(page.getByTestId('popup-pane')).toBeVisible()
    await page.keyboard.press('Control+Shift+KeyA')
    await expect(page.getByTestId('pane-picker')).toHaveCount(0)
    await page.keyboard.press('Control+Shift+KeyP')
    await expect(palette(page)).toBeVisible()
    await expect(page.getByTestId('popup-pane')).toHaveCount(0)
  } finally {
    await close()
  }
})

test('opened over a pane popped up from a shell, it gives the keyboard back to the shell', async () => {
  // Found in review (2026-10-20): the palette took the popup's field as where to give the
  // keyboard back, and that field was gone by the time it closed.
  const { page, close } = await start(SHELL_AND_CLOCK)
  try {
    const shell = page.locator('[data-testid=pane][data-pane-id=sh] .xterm-helper-textarea')
    await shell.focus()
    await page.keyboard.press('Control+Shift+KeyL')
    await expect(page.getByTestId('popup-pane')).toBeVisible()
    await page.keyboard.press('Control+Shift+KeyP')
    await expect(palette(page)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(palette(page)).toHaveCount(0)
    await expect(shell).toBeFocused()
  } finally {
    await close()
  }
})

test('a pane row pops up what can be, and adds what cannot beside the focused pane', async () => {
  const { page, close } = await start(ONE_CLOCK)
  try {
    await paneById(page, 'c').click()
    await find(page, 'calendar', 'pane:calendar')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('popup-pane')).toBeVisible()
    await expect(panes(page)).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('popup-pane')).toHaveCount(0)
    await paneById(page, 'c').click()
    await find(page, 'terminal', 'pane:terminal')
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-testid=pane][data-widget=terminal]')).toHaveCount(1)
    await expect(panes(page)).toHaveCount(2)
  } finally {
    await close()
  }
})

test('a saved layout row asks first while shells are open, as its number key does', async () => {
  // A first start, given the presets as saved layouts: the default layout, with its shells.
  const { page, close } = await start(undefined, { env: { ELECDEX_SEED_LAYOUTS: '1' } })
  try {
    const before = await panes(page).count()
    await page.keyboard.press('Control+Shift+KeyP')
    await page.getByTestId('action-palette-filter').fill('network')
    await expect(selectedRow(page)).toHaveAttribute('data-key', /^layout:/)
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('switch-layout-dialog')).toBeVisible()
    await page.getByTestId('switch-layout-cancel').click()
    await expect(panes(page)).toHaveCount(before)
  } finally {
    await close()
  }
})

test('a key the user rebound opens it, and the rows name the keys as bound', async () => {
  const { page, close } = await start(ONE_CLOCK, {
    settings: {
      keybindings: { 'palette.open': 'Ctrl+Alt+KeyK', 'pane.splitRight': 'Ctrl+Alt+KeyR' },
    },
  })
  try {
    await page.keyboard.press('Control+Shift+KeyP')
    await expect(palette(page)).toHaveCount(0)
    await page.keyboard.press('Control+Alt+KeyK')
    await expect(palette(page)).toBeVisible()
    await page.getByTestId('action-palette-filter').fill('split right')
    await expect(selectedRow(page).locator('.chord')).toHaveText('Ctrl+Alt+R')
  } finally {
    await close()
  }
})
