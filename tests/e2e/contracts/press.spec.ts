import { expect, type Locator, type Page, test } from '@playwright/test'
import { settleLayout } from '../support/workspace.js'
import { PANES } from './panes.js'
import { type ContractApp, contractPane, launchContracts, tabOf } from './world.js'

/**
 * The press contract (styles/press.css; user decision 2026-11-06): every button a built-in pane
 * shows flashes the accent while it is held, but those that say `data-press="off"`
 * (tests/unit/press.test.ts names each). One app holds every pane as the tabs of one group; each
 * pane's buttons on show are held in turn, and a failure names every pane and button that broke
 * the contract at once. The row's `pressless` says why a pane has no button to hold.
 */

let ctx: ContractApp

test.beforeAll(async () => {
  ctx = await launchContracts()
})

test.afterAll(async () => {
  await ctx?.dispose()
})

/**
 * The animation on a button held down: the pointer leaves before the release, so no click. Null
 * for a button a pointer cannot reach where it is laid out (scrolled out of its box, or under a
 * panel drawn over it): pressing there presses what is on top.
 */
async function held(page: Page, button: Locator): Promise<string | null> {
  // What the rule is held to is a button pressed (`:active`). A press that missed it - the pane
  // still scrolling it into view, or its list still coming in above it - is made again.
  for (let attempt = 0; attempt < 3; attempt++) {
    await button.scrollIntoViewIfNeeded()
    const box = await button.boundingBox()
    if (!box) return null
    const at = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    const reachable = await button.evaluate((el, point) => {
      const top = document.elementFromPoint(point.x, point.y)
      return top !== null && el.contains(top)
    }, at)
    if (!reachable) return null
    await page.mouse.move(at.x, at.y)
    await page.mouse.down()
    try {
      const name = await button.evaluate((el) =>
        el.matches(':active') ? getComputedStyle(el).animationName : null,
      )
      if (name !== null) return name
    } finally {
      await page.mouse.move(2, 2)
      await page.mouse.up()
    }
  }
  return null
}

/** A button's name in a failure: its test id, its label or its text. */
const nameOf = (button: Locator) =>
  button.evaluate(
    (el) =>
      (el as HTMLElement).dataset.testid ??
      el.getAttribute('aria-label') ??
      el.textContent?.trim().slice(0, 24) ??
      el.className,
  )

/** At most this many of a pane's buttons, in order: enough to find a rule of the pane's own. */
const PER_PANE = 6

test('every built-in pane’s buttons flash the accent while held', async () => {
  const { page } = ctx
  const failed: Record<string, string[]> = {}
  const counted: Record<string, number> = {}
  for (const row of PANES) {
    await tabOf(page, row.widget).click()
    const pane = contractPane(page, row.widget)
    await expect(pane).toBeVisible()
    await settleLayout(page)
    // The widget's own buttons: in its body, shown, enabled, and not left out.
    const buttons = pane.locator(
      '.body :is(button, [role="button"]):visible:not(:disabled, [aria-disabled="true"], [data-press="off"])',
    )
    const count = await buttons.count()
    let pressed = 0
    for (let i = 0; i < count && pressed < PER_PANE; i++) {
      const button = buttons.nth(i)
      const name = await held(page, button)
      if (name === null) continue
      pressed++
      if (name !== 'press') {
        failed[row.widget] = [...(failed[row.widget] ?? []), `${await nameOf(button)}: ${name}`]
      }
    }
    counted[row.widget] = pressed
  }
  expect(failed).toEqual({})
  // A pane said to have no button has none to hold: one that gains a button is held too. The
  // other way is not held to: on a small screen a pane's buttons may all be out of reach (the
  // Linux runner's mixer, its mute buttons below the pane's edge), and are then not pressed.
  const gained = PANES.filter((row) => row.pressless && (counted[row.widget] ?? 0) > 0)
  expect(gained.map((row) => row.widget)).toEqual([])
  // Most panes are held, wherever it runs: not a contract emptied by a screen too small.
  const panesHeld = Object.values(counted).filter((count) => count > 0).length
  expect(panesHeld).toBeGreaterThanOrEqual(PANES.filter((row) => !row.pressless).length - 3)
})

test('a group’s corner flashes as its panes’ buttons do', async () => {
  const { page } = ctx
  const row = PANES.find((r) => r.widget === 'cpu') ?? PANES[0]
  if (!row) throw new Error('no pane')
  await tabOf(page, row.widget).click()
  // The group's corner, beside the tabs: its close button.
  const close = page.getByTestId('group-close')
  await expect(close).toBeVisible()
  expect(await held(page, close)).toBe('press')
})
