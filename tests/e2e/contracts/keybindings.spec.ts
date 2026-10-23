import { type ElectronApplication, expect, type Page, test } from '@playwright/test'
import { KEYBINDING_ACTIONS } from '../../../src/shared/keybindings.js'
import type { LayoutTree } from '../../../src/shared/schemas/layout.js'
import {
  launch,
  NO_SWITCH_PROMPT,
  paneById,
  quietFor,
  reloadWorkspace,
  SINGLE_CLOCK,
  settleLayout,
  single,
  typeInto,
} from '../support.js'
import { type InWorld, KEY_ROWS, type PageAction, pressable } from './keys.js'

/**
 * The keybindings contract (docs/e2e-design.md, section 3.2): every page action of
 * src/shared/keybindings.ts does what it says when its default chord is pressed in the running
 * app. The table is contracts/keys.ts; each world below presses its rows in one app, and a
 * failure names every action that broke the contract at once. What each action does in detail
 * (a tab group's edges, a web page keeping keys, the question before a switch) stays in the
 * spec of what it acts on.
 */

/** The default chord of `action`, as Playwright presses it. */
function chordOf(action: PageAction): string {
  const definition = KEYBINDING_ACTIONS.find((a) => a.id === action)
  if (definition === undefined) throw new Error(`no action ${action}`)
  return pressable(definition.chord)
}

/** Runs `check` for each action, and fails once at the end naming every action that failed. */
async function eachAction<A extends PageAction>(
  actions: A[],
  check: (action: A) => Promise<void>,
): Promise<void> {
  const failed: Record<string, string> = {}
  for (const action of actions) {
    try {
      await check(action)
    } catch (error) {
      failed[action] = String((error as Error).message).split('\n')[0] ?? ''
    }
  }
  expect(failed).toEqual({})
}

// --- The workspace: two shells, a clock behind one of them, and a clock alone. -------------

/**
 * A tab group of a shell and a clock, a shell alone and a clock alone, in a row: every page
 * action has something to act on, and something to go to. Put back before every row.
 */
const WORKSPACE = {
  version: 1,
  root: {
    kind: 'split',
    id: 'row',
    direction: 'row',
    sizes: [40, 30, 30],
    children: [
      {
        kind: 'tabs',
        id: 'g',
        activeIndex: 0,
        children: [
          { kind: 'pane', id: 'sh1', widget: 'terminal' },
          { kind: 'pane', id: 'clk', widget: 'clock' },
        ],
      },
      { kind: 'pane', id: 'sh2', widget: 'terminal' },
      { kind: 'pane', id: 'solo', widget: 'clock' },
    ],
  },
}

const WORKSPACE_IDS = ['clk', 'sh1', 'sh2', 'solo']

interface World {
  app: ElectronApplication
  page: Page
  platform: NodeJS.Platform
  /** Presses the row's default chord. */
  press(): Promise<void>
}

const ids = (page: Page) =>
  page
    .getByTestId('pane')
    .evaluateAll((panes) => panes.map((p) => (p as HTMLElement).dataset.paneId ?? '').sort())

/** The pane the layout has focused (`layout.focusedPaneId`), as the frame marks it. */
const focusedPane = (page: Page) =>
  page.evaluate(
    () => document.querySelector<HTMLElement>('[data-testid=pane].focused')?.dataset.paneId ?? null,
  )

/** The pane the keyboard is in. */
const keyboardIn = (page: Page) =>
  page.evaluate(() => {
    const pane = document.activeElement?.closest<HTMLElement>('[data-testid=pane]')
    return pane ? { id: pane.dataset.paneId ?? '', widget: pane.dataset.widget ?? '' } : null
  })

/** Focuses a pane that is not a shell as a press on it does, the keyboard left nowhere. */
async function focus(page: Page, id: string): Promise<void> {
  await paneById(page, id).evaluate((el) => {
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    ;(document.activeElement as HTMLElement | null)?.blur()
  })
  await expect.poll(() => focusedPane(page), { message: `${id} focused` }).toBe(id)
}

/** Puts the keyboard in shell pane `id`. */
async function focusShell(page: Page, id: string): Promise<void> {
  await paneById(page, id).locator('.xterm-helper-textarea').first().focus()
  await expect.poll(() => focusedPane(page), { message: `${id} focused` }).toBe(id)
}

/** The selected tab of the tab group. */
const activeTab = (page: Page) =>
  page.locator('[data-testid=tabs-host] li.active [data-testid=tab]').getAttribute('data-pane-id')

/** The pane a split of `of` added: one more pane, of `of`'s widget. */
async function splitOff(page: Page, of: string): Promise<string> {
  await expect.poll(() => ids(page)).toHaveLength(WORKSPACE_IDS.length + 1)
  const id = (await ids(page)).find((i) => !WORKSPACE_IDS.includes(i)) ?? ''
  expect(await widgetOf(page, id)).toBe(await widgetOf(page, of))
  return id
}

const widgetOf = (page: Page, id: string) => paneById(page, id).getAttribute('data-widget')

/** Both panes' boxes, measured together. */
async function boxes(page: Page, a: string, b: string) {
  const box = async (id: string) => {
    const found = await paneById(page, id).boundingBox()
    if (found === null) throw new Error(`${id} has no box`)
    return found
  }
  return { a: await box(a), b: await box(b) }
}

/** The shells' type size in the settings. */
const fontSize = (page: Page) =>
  page.evaluate(async () => (await window.elecdex.settings.get()).terminal.fontSize)

/** The window is fullscreen, as main has it. */
const isFullScreen = (app: ElectronApplication) =>
  app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.isFullScreen() ?? false)

/**
 * What each workspace action must do, from the four panes put back. The table's type makes a
 * workspace row without a check here a compile error.
 */
const WORKSPACE_CHECKS: Record<InWorld<'workspace'>, (w: World) => Promise<void>> = {
  'pane.add': async ({ page, press }) => {
    await focus(page, 'solo')
    await press()
    await expect(page.getByTestId('pane-picker')).toBeVisible()
  },
  'pane.splitRight': async ({ page, press }) => {
    await focus(page, 'solo')
    await press()
    const added = await splitOff(page, 'solo')
    await expect
      .poll(async () => {
        const { a, b } = await boxes(page, 'solo', added)
        return b.x >= a.x + a.width - 2 && Math.abs(b.y - a.y) <= 2
      })
      .toBe(true)
  },
  'pane.splitDown': async ({ page, press }) => {
    await focus(page, 'solo')
    await press()
    const added = await splitOff(page, 'solo')
    await expect
      .poll(async () => {
        const { a, b } = await boxes(page, 'solo', added)
        return b.y >= a.y + a.height - 2 && Math.abs(b.x - a.x) <= 2
      })
      .toBe(true)
  },
  'pane.newTab': async ({ page, press }) => {
    await focusShell(page, 'sh1')
    await press()
    const group = page.getByTestId('tabs-host')
    await expect(group).toHaveCount(1)
    await expect(group.getByTestId('tab')).toHaveCount(3)
    await expect.poll(() => ids(page)).toHaveLength(WORKSPACE_IDS.length + 1)
  },
  'pane.close': async ({ page, press }) => {
    await focus(page, 'solo')
    await press()
    await expect(paneById(page, 'solo')).toHaveCount(0)
    await expect.poll(() => ids(page)).toEqual(['clk', 'sh1', 'sh2'])
  },
  'pane.zoom': async ({ page, press }) => {
    await focus(page, 'solo')
    await press()
    await expect(paneById(page, 'solo')).toHaveClass(/\bzoomed\b/)
  },
  'focus.next': async ({ page, press }) => {
    // In the order the panes are shown: the group's shell, the shell alone, the clock alone.
    await focusShell(page, 'sh2')
    await press()
    await expect.poll(() => focusedPane(page)).toBe('solo')
  },
  'focus.previous': async ({ page, press }) => {
    await focusShell(page, 'sh2')
    await press()
    await expect.poll(() => focusedPane(page)).toBe('sh1')
  },
  'layout.reset': async ({ page, press }) => {
    // Shells are open, so the reset asks first, as a switch does (layout.spec has the rest).
    await focus(page, 'solo')
    await press()
    const ask = page.getByTestId('switch-layout-dialog')
    await expect(ask).toContainText('reset layout')
    await ask.getByTestId('switch-layout-go').click()
    await settleLayout(page)
    await expect(paneById(page, 'solo')).toHaveCount(0)
    await expect(page.getByTestId('pane').first()).toBeVisible()
  },
  'layout.saved': async ({ page, press }) => {
    await focus(page, 'solo')
    await press()
    await expect(page.getByTestId('layouts-dialog')).toBeVisible()
  },
  'launcher.focus': async ({ page, press }) => {
    // No launcher pane in the layout: it pops up (layout/summon.ts).
    await focus(page, 'solo')
    await press()
    await expect(page.getByTestId('popup-pane')).toHaveAttribute('data-widget', 'launcher')
  },
  'utility.focus': async ({ page, press }) => {
    await focus(page, 'solo')
    await press()
    await expect(page.getByTestId('popup-pane')).toHaveAttribute('data-widget', 'utility')
  },
  'shell.focus': async ({ page, press }) => {
    await focus(page, 'solo')
    await press()
    await expect.poll(async () => (await keyboardIn(page))?.widget).toBe('terminal')
  },
  'shell.find': async ({ page, press }) => {
    await focusShell(page, 'sh2')
    await press()
    await expect(paneById(page, 'sh2').getByTestId('terminal-search-box')).toBeFocused()
  },
  'shell.clear': async ({ page, press, platform }) => {
    // A scrollback first: xterm's slider's share of its track is the screen's share of the
    // buffer, small with 300 lines behind it and the whole track once they are cleared.
    const shell = paneById(page, 'sh2')
    await expect(shell.getByTestId('pane-subtitle')).toHaveText(/[\\/~]/, { timeout: 40_000 })
    const share = () =>
      shell.locator('.xterm-scrollable-element .scrollbar.vertical').evaluate((track) => {
        const slider = track.querySelector('.slider')
        const whole = track.getBoundingClientRect().height
        return whole === 0 || slider === null ? 1 : slider.getBoundingClientRect().height / whole
      })
    await typeInto(page, shell, platform === 'win32' ? '1..300 | % { $_ }' : 'seq 300')
    // Cleared only once every line has arrived, or those after the clear make a scrollback again.
    await expect(async () => {
      expect(await share()).toBeLessThan(0.5)
      await quietFor(1000, share, 'the scrollback')
    }).toPass({ timeout: 30_000 })
    await focusShell(page, 'sh2')
    await press()
    await expect.poll(share, { timeout: 5000 }).toBeGreaterThan(0.75)
  },
  'shell.fontBigger': async ({ page, press }) => {
    const before = await fontSize(page)
    await focus(page, 'solo')
    await press()
    await expect.poll(() => fontSize(page)).toBeGreaterThan(before)
  },
  'shell.fontSmaller': async ({ page, press }) => {
    const before = await fontSize(page)
    await focus(page, 'solo')
    await press()
    await expect.poll(() => fontSize(page)).toBeLessThan(before)
  },
  'tab.next': async ({ page, press }) => {
    await focusShell(page, 'sh1')
    await press()
    await expect.poll(() => activeTab(page)).toBe('clk')
  },
  'tab.previous': async ({ page, press }) => {
    // Two tabs: back from the first is round to the last.
    await focusShell(page, 'sh1')
    await press()
    await expect.poll(() => activeTab(page)).toBe('clk')
  },
  'shell.next': async ({ page, press }) => {
    await focusShell(page, 'sh1')
    await press()
    await expect.poll(async () => (await keyboardIn(page))?.id).toBe('sh2')
  },
  'shell.previous': async ({ page, press }) => {
    await focusShell(page, 'sh1')
    await press()
    await expect.poll(async () => (await keyboardIn(page))?.id).toBe('sh2')
  },
  'settings.open': async ({ page, press }) => {
    await focus(page, 'solo')
    await press()
    await expect(page.getByTestId('settings-dialog')).toBeVisible()
  },
  'palette.open': async ({ page, press }) => {
    await focus(page, 'solo')
    await press()
    await expect(page.getByTestId('action-palette')).toBeVisible()
  },
  'window.fullscreen': async ({ app, page, press }) => {
    await focus(page, 'solo')
    try {
      await press()
      const entered = await expect
        .poll(() => isFullScreen(app), { timeout: 10_000 })
        .toBe(true)
        .then(() => true)
        .catch(() => false)
      // A macOS CI runner has no user session to open a fullscreen Space in (chrome.spec).
      if (!entered) {
        test.info().annotations.push({
          type: 'skipped',
          description: 'window.fullscreen: the window cannot go fullscreen here',
        })
        return
      }
      await press()
      await expect.poll(() => isFullScreen(app), { timeout: 10_000 }).toBe(false)
    } finally {
      await app.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0]?.setFullScreen(false),
      )
    }
  },
}

test('every workspace action does what it says when its default chord is pressed', async () => {
  test.setTimeout(400_000)
  const launched = await launch(undefined, { layout: WORKSPACE })
  const { app, page, platform } = launched
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const size = await fontSize(page)

  /** The four panes back, as a layout saved by main and drawn afresh, and the type size. */
  const putBack = async () => {
    if ((await fontSize(page)) !== size) {
      await page.evaluate(
        (fontSize) => window.elecdex.settings.patch({ terminal: { fontSize } }),
        size,
      )
    }
    // A save of the page's own still pending is written as it unloads, over the one put
    // back: then it is put back again.
    await expect(async () => {
      await page.evaluate((tree) => window.elecdex.layout.save(tree), WORKSPACE as LayoutTree)
      await reloadWorkspace(page)
      expect(await ids(page)).toEqual(WORKSPACE_IDS)
      // The tab in front too: a late save can keep the panes and the tab a row switched to.
      expect(await activeTab(page)).toBe('sh1')
    }).toPass({ timeout: 30_000 })
    await settleLayout(page)
  }

  try {
    const actions = Object.keys(WORKSPACE_CHECKS) as InWorld<'workspace'>[]
    await eachAction(actions, async (action) => {
      await putBack()
      const chord = chordOf(action)
      await WORKSPACE_CHECKS[action]({
        app,
        page,
        platform,
        press: () => page.keyboard.press(chord),
      })
    })
    expect(errors).toEqual([])
  } finally {
    await launched.close()
  }
})

// --- The slots: ten saved layouts on the number keys, and one to start from. -----------------

/** The saved layout in slot `n` (1-10): one clock, of an id that says which. */
const slotLayout = (n: number) => single('clock', { id: `slot${n}` })

test('every saved-layout key goes to the layout in its slot', async () => {
  const slots = Object.entries(KEY_ROWS)
    .filter(([, row]) => 'world' in row && row.world === 'slots')
    .map(([id]) => id as InWorld<'slots'>)
  const number = (action: string) => Number(/(\d+)$/.exec(action)?.[1])
  // The slots first, by place, and the layout worked in after them (main checks the ids).
  const items = [
    ...slots.map((action) => ({
      id: `slotlayout${number(action)}`,
      name: `slot ${number(action)}`,
      tree: slotLayout(number(action)),
    })),
    { id: 'home', name: 'home', tree: single('clock', { id: 'home' }) },
  ]
  const launched = await launch(undefined, {
    layout: single('clock', { id: 'home' }),
    files: { 'layouts.json': JSON.stringify({ version: 1, items, active: 'home' }) },
  })
  const { page } = launched
  try {
    await expect(paneById(page, 'home')).toBeVisible()
    await eachAction(slots, async (action) => {
      await page.keyboard.press(chordOf(action))
      await settleLayout(page)
      await expect(paneById(page, `slot${number(action)}`)).toBeVisible()
    })
  } finally {
    await launched.close()
  }
})

// --- The presets: each key goes to the layout made from its preset. --------------------------

test("every preset's key adds the layout made from it and goes there", async () => {
  test.setTimeout(300_000)
  const presets = Object.entries(KEY_ROWS)
    .filter(([, row]) => 'world' in row && row.world === 'presets')
    .map(([id]) => id as InWorld<'presets'>)
  // No question before each switch: the presets open shells, and the question is layout.spec's.
  const launched = await launch(undefined, { layout: SINGLE_CLOCK, settings: NO_SWITCH_PROMPT })
  const { page } = launched
  const active = () =>
    page.evaluate(
      async () => (await window.elecdex.layout.saved.list()).find((s) => s.active)?.preset ?? null,
    )
  try {
    await eachAction(presets, async (action) => {
      const preset = action.replace('layout.preset.', '')
      await page.keyboard.press(chordOf(action))
      await expect.poll(active, { timeout: 20_000 }).toBe(preset)
      await settleLayout(page)
      await expect(page.getByTestId('pane').first()).toBeVisible()
    })
    // Each added once, in the order its key was pressed.
    const made = await page.evaluate(async () =>
      (await window.elecdex.layout.saved.list()).map((s) => s.preset),
    )
    expect(made).toEqual(presets.map((action) => action.replace('layout.preset.', '')))
  } finally {
    await launched.close()
  }
})
