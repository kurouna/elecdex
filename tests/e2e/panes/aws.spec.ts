import { expect, type Page } from '@playwright/test'
import { captureOpens, cloudMode, opened } from '../support/cloud.js'
import { test } from '../support/shared.js'
import { beside, launch, tabbed } from '../support.js'

/**
 * AWS STATUS (docs/aws.md), on main's stand-in AWS CLI (support.ts sets ELECDEX_CLOUD_STUB=1):
 * this machine's CLI, its profiles and accounts, and the network are never reached, and nothing
 * paid is ever called - Cost Explorer's answers are the stand-in's too. Console pages are noted,
 * never opened.
 */

const REGIONS = ['ap-northeast-1', 'us-east-1']

const layout = (front: 'aws' | 'clock', state: Record<string, unknown> = {}) => {
  const tree = tabbed(['aws', 'clock'], front === 'aws' ? 0 : 1)
  const panes = tree.root.children as { id: string; state?: Record<string, unknown> }[]
  const aws = panes.find((p) => p.id === 'aws')
  if (aws) aws.state = { regions: REGIONS, ...state }
  return tree
}

const tab = (page: Page, index: 0 | 1) => page.getByTestId('tab').nth(index)
const watching = (page: Page) => page.evaluate(() => window.elecdex.aws.watching())

test('shows what needs attention, and drills from ACTIVE to one instance and back', async () => {
  const { app, page, close } = await launch(undefined, { layout: layout('aws') })
  try {
    await captureOpens(app)
    await expect(page.getByTestId('aws-link')).toContainText('LINKED')
    await expect(page.getByTestId('aws-alarms')).toContainText('1')
    await page.getByTestId('aws-tab-attention').click({ delay: 20 })
    await expect(page.getByTestId('aws-attention-row').first()).toContainText('ALARM')
    expect(await watching(page)).toHaveLength(1)

    // ACTIVE: the services billing now, the dearest first; EC2 says one idle instance.
    await page.getByTestId('aws-tab-active').click({ delay: 20 })
    await expect(page.getByTestId('aws-active-row').first()).toContainText('EC2')
    await expect(page.getByTestId('aws-active-row').first()).toContainText('1 IDLE')
    await expect(page.getByTestId('aws-estimate')).toContainText('Estimates at list prices')

    // The second step: facets and the list; a facet bar filters it.
    await page.getByTestId('aws-active-row').first().click({ delay: 20 })
    await expect(page.getByTestId('aws-crumbs')).toContainText('EC2')
    await expect(page.getByTestId('aws-drill-row')).toHaveCount(6)
    await page.getByTestId('aws-facet-bar').filter({ hasText: 'idle' }).click({ delay: 20 })
    await expect(page.getByTestId('aws-drill-row')).toHaveCount(1)
    await expect(page.getByTestId('aws-drill-row')).toContainText('dev-box')

    // The third step: one instance, from the keyboard; its console page is main's URL.
    await page.getByTestId('aws-drill-row').first().focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('aws-drill-item')).toContainText('dev-box')
    await page.getByTestId('aws-console').click({ delay: 20 })
    await expect.poll(() => opened(app)).toHaveLength(1)
    expect((await opened(app))[0]).toMatch(
      /^https:\/\/ap-northeast-1\.console\.aws\.amazon\.com\/ec2\/home\?region=ap-northeast-1#InstanceDetails:instanceId=i-/,
    )
    await page.getByTestId('aws-history').click({ delay: 20 })
    await expect(page.getByTestId('aws-drill-item')).toContainText('StartInstances')

    // Escape goes up a step at a time.
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('aws-drill-list')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('aws-crumbs')).toHaveCount(0)
    await expect(page.getByTestId('aws-meter')).toBeVisible()
  } finally {
    await close()
  }
})

/** What RESOURCES says has the focus now (its `data-focus`). */
const focused = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null
    return el?.dataset.focus ?? null
  })

test('opens on RESOURCES: a card or a tile to its list and back, a forgotten row to its resource and KEEP', async () => {
  const { page, close } = await launch(undefined, { layout: layout('aws') })
  try {
    // RESOURCES is the first tab, and a pane whose state names none opens on it (aws.md §14.0).
    await expect(page.getByTestId('aws-tab-resources')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('aws-forgotten-row').first()).toBeVisible()
    await expect(page.getByTestId('aws-res-figures')).toContainText('LOOKS FORGOTTEN')
    // The services are cards by default (aws.md §14.12): in use of all.
    await expect(page.getByTestId('aws-rcard').first()).toBeVisible()
    await expect(page.getByTestId('aws-tile')).toHaveCount(0)
    await expect(page.getByTestId('aws-rcard-ratio').first()).toHaveText(/^\d+$/)

    // A card from the keyboard: its list, then Escape back to the same card.
    const card = page.getByTestId('aws-rcard').nth(1)
    const kind = await card.getAttribute('data-card')
    await card.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('aws-crumbs')).toContainText('RESOURCES')
    await expect(page.getByTestId('aws-drill-row').first()).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('aws-resources')).toBeVisible()
    await expect.poll(() => focused(page)).toBe(`card:${kind}`)

    // DETAIL: the tiles, the choice kept by the pane, the focus still on the switch.
    await page.getByTestId('aws-res-view-detail').click({ delay: 20 })
    await expect(page.getByTestId('aws-tile').first()).toBeVisible()
    await expect(page.getByTestId('aws-rcard')).toHaveCount(0)
    await expect(page.getByTestId('aws-res-view-detail')).toBeFocused()
    await expect(page.getByTestId('aws-elsewhere')).toBeVisible()

    // A tile from the keyboard: its list, then Escape back to the same tile, still in DETAIL.
    const tile = page.getByTestId('aws-tile').first()
    const service = await tile.getAttribute('data-tile')
    await tile.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('aws-drill-row').first()).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('aws-resources')).toBeVisible()
    await expect.poll(() => focused(page)).toBe(`tile:${service}`)
    await page.getByTestId('aws-res-view-cards').click({ delay: 20 })
    await expect(page.getByTestId('aws-rcard').first()).toBeVisible()

    // A LOOKS FORGOTTEN row is its resource at once: why it looks forgotten, and KEEP.
    const row = page.getByTestId('aws-forgotten-row').first()
    const name = (await row.locator('.nm').textContent()) ?? ''
    expect(name.length).toBeGreaterThan(0)
    await row.click({ delay: 20 })
    await expect(page.getByTestId('aws-drill-item')).toContainText(name)
    await expect(page.getByTestId('aws-item-quiet')).toBeVisible()
    await page.getByTestId('aws-item-keep').click({ delay: 20 })
    await expect(page.getByTestId('aws-item-keep')).toHaveText('KEPT')
    // Back goes straight to RESOURCES, where the kept one is off the list and counted.
    await page.getByRole('button', { name: 'back a step' }).click({ delay: 20 })
    await expect(page.getByTestId('aws-forgotten-head')).toContainText('1 kept')
    await expect(page.getByTestId('aws-forgotten-row').filter({ hasText: name })).toHaveCount(0)
  } finally {
    await close()
  }
})

test('ELSEWHERE opens the regions the pane does not show, with a sweep on demand', async () => {
  const { page, close } = await launch(undefined, { layout: layout('aws') })
  try {
    await expect(page.getByTestId('aws-elsewhere')).toContainText('us-west-2')
    await page.getByTestId('aws-elsewhere').click({ delay: 20 })
    await expect(page.getByTestId('aws-crumbs')).toContainText('ELSEWHERE')
    await expect(page.getByTestId('aws-drill-row')).toHaveCount(3)
    await expect(page.getByTestId('aws-facet-bar').filter({ hasText: 'us-west-2' })).toHaveCount(1)
    await expect(page.getByTestId('aws-sweep-now')).toBeEnabled()
    await page.getByTestId('aws-sweep-now').click({ delay: 20 })
    await expect(page.getByTestId('aws-sweep-line')).toContainText('asked')
    await page.keyboard.press('Escape')
    await expect.poll(() => focused(page)).toBe('elsewhere')
  } finally {
    await close()
  }
})

test("asks once about Cost Explorer, and the answer is the account's", async () => {
  const { page, close } = await launch(undefined, { layout: layout('aws') })
  try {
    await expect(page.getByTestId('aws-ce-ask')).toBeVisible()
    await page.getByTestId('aws-ce-off').click({ delay: 20 })
    await expect(page.getByTestId('aws-ce-ask')).toHaveCount(0)
    await page.getByTestId('aws-tab-cost').click({ delay: 20 })
    await expect(page.getByTestId('aws-ce-off-line')).toContainText('Cost Explorer is off')
    // A pane shown again asks no more.
    await tab(page, 1).click({ delay: 20 })
    await tab(page, 0).click({ delay: 20 })
    await expect(page.getByTestId('aws-link')).toContainText('LINKED')
    await expect(page.getByTestId('aws-ce-ask')).toHaveCount(0)
  } finally {
    await close()
  }
})

test('stops reading behind a tab, and keeps what it showed', async () => {
  const { app, page, close } = await launch(undefined, { layout: layout('aws') })
  try {
    await expect(page.getByTestId('aws-link')).toContainText('LINKED')
    await page.getByTestId('aws-tab-attention').click({ delay: 20 })
    await expect(page.getByTestId('aws-attention-row').first()).toBeVisible()
    await tab(page, 1).click({ delay: 20 })
    await expect.poll(() => watching(page)).toEqual([])
    await expect.poll(() => page.evaluate(() => window.elecdex.cloud.watching())).toEqual([])
    // The CLI gone while hidden: what shows again is what main kept.
    await cloudMode(app, 'aws', 'offline')
    await tab(page, 0).click({ delay: 20 })
    await expect(page.getByTestId('aws-attention-row').first()).toContainText('ALARM')
    await expect.poll(() => watching(page)).toHaveLength(1)
  } finally {
    await cloudMode(app, 'aws', null)
    await close()
  }
})

test('says the way out when signed out, and when the CLI is not there', async () => {
  const { app, page, close } = await launch(undefined, { layout: layout('clock') })
  try {
    await cloudMode(app, 'aws', 'signedout')
    await tab(page, 0).click({ delay: 20 })
    await expect(page.getByTestId('aws-signin')).toContainText('aws login --profile=default')
    await expect(page.getByTestId('aws-link')).toContainText('SIGNED OUT')

    await cloudMode(app, 'aws', 'nocli')
    await page.getByTestId('aws-refresh').click({ delay: 20 })
    await expect(page.getByTestId('aws-nocli')).toBeVisible()
  } finally {
    await cloudMode(app, 'aws', null)
    await close()
  }
})

test("PARTIAL's refused operations wrap inside a narrow pane, never past its edge", async () => {
  const { page, close } = await launch(undefined, {
    layout: beside('aws', { state: { regions: REGIONS }, sizes: [12, 88] }),
    env: { ELECDEX_CLOUD_STUB: 'partial' },
  })
  try {
    const notice = page.getByTestId('aws-denied')
    await expect(notice).toContainText('guardduty:ListDetectors')
    // The list was one line that ran on over the pane beside it (white-space: nowrap).
    const overrun = await notice.evaluate((element) => {
      const range = document.createRange()
      range.selectNodeContents(element)
      const pane = element.closest('[data-testid=pane]')?.getBoundingClientRect()
      return pane === undefined ? Number.NaN : range.getBoundingClientRect().right - pane.right
    })
    expect(overrun).toBeLessThanOrEqual(0)
  } finally {
    await close()
  }
})
