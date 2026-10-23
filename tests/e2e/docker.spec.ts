import { expect, type Page, test } from '@playwright/test'
import { clipboardText, stubOf } from './support/stub-hooks.js'
import { launch, quietFor, tabbed } from './support.js'

/**
 * The DOCKER pane, on main's stand-in engine (support.ts sets
 * ELECDEX_DOCKER_STUB=1): this machine's Docker is never reached, and none of its
 * containers started or stopped. The engine is changed through
 * globalThis.__elecdexDocker.
 */

const inTabs = (front: 'docker' | 'clock') =>
  tabbed(['docker', 'clock'], front === 'docker' ? 0 : 1)

/** Whether a container's card is open, as a probe for a rest that must open none. */
const cards = (page: Page) => page.getByTestId('docker-card').count()

const row = (page: Page, name: string) =>
  page.locator(`[data-testid=docker-row][data-name="${name}"]`)

test('lists the containers by project, follows the engine, and presses one', async () => {
  const { app, page, close } = await launch(undefined, { layout: inTabs('docker') })
  const engine = stubOf(app, 'docker')
  try {
    await expect(page.getByTestId('docker-link')).toContainText('LINKED')
    await expect(page.getByTestId('docker-row')).toHaveCount(4)
    await expect(page.getByTestId('docker-group')).toHaveCount(2)
    await expect(row(page, 'shop-api-1').getByTestId('docker-state')).toContainText('HEALTHY')
    await expect(row(page, 'shop-worker-1').getByTestId('docker-state')).toContainText('EXITED 137')
    await expect(row(page, 'redis').getByTestId('docker-ports')).toHaveText('6379→6379')
    await expect(page.getByTestId('docker-engine')).toContainText('engine 27.3.1')
    // What a running container uses arrives on the five seconds.
    await expect(row(page, 'shop-api-1').getByTestId('docker-mem')).toContainText('212M', {
      timeout: 12_000,
    })

    // A change made elsewhere (`docker stop` in a shell) shows at the next event.
    await engine.change('redis', { state: 'exited', status: 'Exited (0) 1 second ago' })
    await expect(row(page, 'redis').getByTestId('docker-state')).toContainText('EXITED')
    await expect(page.getByTestId('docker-row')).toHaveCount(4)

    // Stop asks twice; the row stays where it was.
    const order = await page
      .getByTestId('docker-row')
      .evaluateAll((rows) => rows.map((r) => (r as HTMLElement).dataset.name))
    await row(page, 'shop-api-1').hover()
    await row(page, 'shop-api-1').getByTestId('docker-stop').click({ delay: 20 })
    await expect(row(page, 'shop-api-1').getByTestId('docker-stop')).toHaveText('STOP?')
    expect(await engine.presses()).toEqual([])
    await row(page, 'shop-api-1').getByTestId('docker-stop').click({ delay: 20 })
    await expect(row(page, 'shop-api-1').getByTestId('docker-state')).toContainText('EXITED')
    expect(await engine.presses()).toEqual(['stop shop-api-1'])
    expect(
      await page
        .getByTestId('docker-row')
        .evaluateAll((rows) => rows.map((r) => (r as HTMLElement).dataset.name)),
    ).toEqual(order)

    // Start goes at once.
    await row(page, 'shop-worker-1').hover()
    await row(page, 'shop-worker-1').getByTestId('docker-start').click({ delay: 20 })
    await expect(row(page, 'shop-worker-1').getByTestId('docker-state')).toContainText('UP')
    expect(await engine.presses()).toEqual(['stop shop-api-1', 'start shop-worker-1'])

    // RUN keeps what is up.
    await page.getByTestId('docker-filter-running').click({ delay: 20 })
    await expect(page.getByTestId('docker-row')).toHaveCount(2)
    await page.getByTestId('docker-filter-all').click({ delay: 20 })
    await expect(page.getByTestId('docker-row')).toHaveCount(4)

    // Resting on a name opens its card; the rest of the row opens none, so the card never comes
    // up over the presses of the rows below on the way to them (user report, 2026-09-27).
    await row(page, 'shop-db-1').getByTestId('docker-image').hover()
    await quietFor(700, () => cards(page), 'the cards open')
    await expect(page.getByTestId('docker-card')).toHaveCount(0)
    await row(page, 'shop-api-1').getByTestId('docker-name').hover()
    await expect(page.getByTestId('docker-card')).toContainText('/home/dev/shop')
    await row(page, 'shop-db-1').hover()
    await row(page, 'shop-db-1').getByTestId('docker-restart').hover()
    await expect(page.getByTestId('docker-card')).toHaveCount(0)
    await quietFor(700, () => cards(page), 'the cards open')
    await row(page, 'shop-db-1').getByTestId('docker-restart').click({ delay: 20 })
    await expect(row(page, 'shop-db-1').getByTestId('docker-restart')).toHaveText('RESTART?')

    // The engine gone: the pane says so, and lists again when it is back.
    await engine.link('down')
    await expect(page.getByTestId('docker-link')).toContainText('NO DAEMON')
    await expect(page.getByTestId('docker-down')).toBeVisible()
    await engine.link('up')
    await expect(page.getByTestId('docker-link')).toContainText('LINKED', { timeout: 15_000 })
    await expect(page.getByTestId('docker-row')).toHaveCount(4)
  } finally {
    await close()
  }
})

test('copies through main, into the stand-in clipboard', async () => {
  const { app, page, close } = await launch(undefined, { layout: inTabs('docker') })
  try {
    await row(page, 'redis').getByTestId('docker-name').click({ delay: 20 })
    await expect(row(page, 'redis').getByTestId('docker-name')).toHaveText('COPIED')
    const copied = () => clipboardText(app)
    expect(await copied()).toBe('redis')
    await row(page, 'redis').hover()
    await row(page, 'redis').getByTestId('docker-exec').click({ delay: 20 })
    await expect.poll(copied).toBe('docker exec -it redis sh')
  } finally {
    await close()
  }
})

test('behind another tab nothing is asked of the engine, and shown again it links at once', async () => {
  const { app, page, close } = await launch(undefined, { layout: inTabs('clock') })
  const engine = stubOf(app, 'docker')
  try {
    await expect(page.getByTestId('pane')).toHaveCount(2)
    const asked = async () => [await engine.lists(), await engine.streams()]
    expect(await quietFor(2000, asked, 'the lists and streams')).toEqual([0, 0])
    expect(await page.evaluate(() => window.elecdex.docker.watching())).toEqual([])
    // A page that does not show the list cannot press a container.
    expect(await page.evaluate(() => window.elecdex.docker.control('0123456789ab', 'stop'))).toBe(
      'unsupported',
    )

    await page.locator('[data-testid=tab][data-pane-id=docker]').click({ delay: 20 })
    await expect(page.getByTestId('docker-row')).toHaveCount(4)
    expect(await engine.streams()).toBe(1)

    await page.locator('[data-testid=tab][data-pane-id=clock]').click({ delay: 20 })
    await expect.poll(() => page.evaluate(() => window.elecdex.docker.watching())).toEqual([])
    expect(await engine.streams()).toBe(0)
    const reads = async () => [await engine.lists(), await engine.statsReads()]
    const before = await reads()
    await engine.change('redis', { state: 'exited' })
    expect(await quietFor(6000, reads, 'the lists and stats readings')).toEqual(before)
  } finally {
    await close()
  }
})
