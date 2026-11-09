import { expect, type Page } from '@playwright/test'
import { captureOpens, cloudMode, nineHundredHigh, opened, popUp } from '../support/cloud.js'
import { test } from '../support/shared.js'
import { launch, reloadWorkspace, single, tabbed } from '../support.js'

/**
 * GITHUB STATUS (docs/github.md), on main's stand-in gh (support.ts sets ELECDEX_CLOUD_STUB=1):
 * this machine's gh, its account and the network are never reached. The mode is changed through
 * globalThis.__elecdexCloud; nothing is opened in a browser, only noted.
 */

const inTabs = (front: 'github' | 'clock') =>
  tabbed(['github', 'clock'], front === 'github' ? 0 : 1)

/** The tab of the workspace's one group: 0 GITHUB STATUS, 1 the clock. */
const tab = (page: Page, index: 0 | 1) => page.getByTestId('tab').nth(index)

const watching = (page: Page) => page.evaluate(() => window.elecdex.github.watching())

test('opens on the repositories, reads the queue from gh while shown, and opens a row on github.com', async () => {
  const { app, page, close } = await launch(undefined, { layout: inTabs('github') })
  try {
    await captureOpens(app)
    await expect(page.getByTestId('github-link')).toContainText('LINKED')
    // REPOS is the tab a pane opens on (the user's decision 2026-11-08).
    await expect(page.getByTestId('github-tile').first()).toBeVisible()
    await page.getByTestId('github-tab-queue').click({ delay: 20 })
    await expect(page.getByTestId('github-queue-row').first()).toBeVisible()
    // The red default branch comes from the runs, read on the first showing.
    await expect(page.getByTestId('github-red')).toBeVisible()
    expect(await watching(page)).toHaveLength(1)

    await page.getByTestId('github-queue-row').first().click({ delay: 20 })
    await expect.poll(() => opened(app)).toHaveLength(1)
    expect((await opened(app))[0]).toMatch(/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\//)

    // The repositories and their drill-down.
    await page.getByTestId('github-tab-repos').click({ delay: 20 })
    await expect(page.getByTestId('github-tile').first()).toBeVisible()
    await page.getByTestId('github-tile').first().click({ delay: 20 })
    await expect(page.getByTestId('github-crumbs')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('github-crumbs')).toHaveCount(0)
  } finally {
    await close()
  }
})

// The pane measured its 30 rem in 16 px, but the page's rem follows the window's height (13.3 px
// on a 900-high window), so a popped-up GITHUB STATUS, 36 rem high, dropped its contribution band.
test('popped up on a 900-high window, it keeps its contribution band', async () => {
  const { app, page, close } = await launch(undefined, { layout: single('clock') })
  try {
    await nineHundredHigh(app, page)
    const popup = await popUp(page, 'github')
    await expect(popup.getByTestId('github-tile').first()).toBeVisible()
    await expect(popup.getByTestId('github-band')).toBeVisible()
  } finally {
    await close()
  }
})

test('stops reading behind a tab, and keeps what it showed', async () => {
  const { app, page, close } = await launch(undefined, { layout: inTabs('github') })
  try {
    await expect(page.getByTestId('github-link')).toContainText('LINKED')
    await expect(page.getByTestId('github-tile').first()).toBeVisible()
    await tab(page, 1).click({ delay: 20 })
    await expect.poll(() => watching(page)).toEqual([])
    // gh gone while hidden: what shows again is what main kept.
    await cloudMode(app, 'github', 'offline')
    await tab(page, 0).click({ delay: 20 })
    await expect(page.getByTestId('github-tile').first()).toBeVisible()
    await expect.poll(() => watching(page)).toHaveLength(1)
    // The tabbed pane stayed mounted, so that alone could be the page's memory: a reload drops
    // it, and the tiles that come back with gh still gone can only be main's.
    await reloadWorkspace(page)
    await expect(page.getByTestId('github-tile').first()).toBeVisible()
  } finally {
    await cloudMode(app, 'github', null)
    await close()
  }
})

test('says the way out when signed out, and when gh is not there', async () => {
  const { app, page, close } = await launch(undefined, { layout: inTabs('clock') })
  try {
    await cloudMode(app, 'github', 'signedout')
    await tab(page, 0).click({ delay: 20 })
    await expect(page.getByTestId('github-signin')).toContainText('gh auth login')
    await expect(page.getByTestId('github-link')).toContainText('SIGNED OUT')

    // gh uninstalled meanwhile: REFRESH reads at once, even a board stopped at the sign-in.
    await cloudMode(app, 'github', 'nocli')
    await page.getByTestId('github-refresh').click({ delay: 20 })
    await expect(page.getByTestId('github-nocli')).toBeVisible()
    await expect(page.getByTestId('github-signin')).toHaveCount(0)
  } finally {
    await cloudMode(app, 'github', null)
    await close()
  }
})
