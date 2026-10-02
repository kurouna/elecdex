import { type ElectronApplication, expect, type Page, test } from '@playwright/test'
import { launch } from './support.js'

/**
 * The DOCKER pane, on main's stand-in engine (support.ts sets
 * ELECDEX_DOCKER_STUB=1): this machine's Docker is never reached, and none of its
 * containers started or stopped. The engine is changed through
 * globalThis.__elecdexDocker.
 */

interface Hooks {
  set(containers: Record<string, unknown>[]): void
  change(name: string, patch: Record<string, unknown>): void
  link(state: 'up' | 'down' | 'denied'): void
  presses(): string[]
  lists(): number
  streams(): number
  statsReads(): number
}

type HookName = 'presses' | 'lists' | 'streams' | 'statsReads'
const ask = (app: ElectronApplication, name: HookName) =>
  app.evaluate(
    (_electron, what) =>
      (globalThis as unknown as { __elecdexDocker: Hooks }).__elecdexDocker[what as HookName](),
    name,
  )

const change = (app: ElectronApplication, name: string, patch: Record<string, unknown>) =>
  app.evaluate(
    (_electron, [who, what]) => {
      ;(globalThis as unknown as { __elecdexDocker: Hooks }).__elecdexDocker.change(
        who as string,
        what as Record<string, unknown>,
      )
    },
    [name, patch] as const,
  )

const linkTo = (app: ElectronApplication, state: 'up' | 'down' | 'denied') =>
  app.evaluate((_electron, to) => {
    ;(globalThis as unknown as { __elecdexDocker: Hooks }).__elecdexDocker.link(to)
  }, state)

const inTabs = (front: string) => ({
  version: 1,
  root: {
    kind: 'tabs',
    id: 't',
    activeIndex: front === 'docker' ? 0 : 1,
    children: [
      { kind: 'pane', id: 'dk', widget: 'docker' },
      { kind: 'pane', id: 'c', widget: 'clock' },
    ],
  },
})

const row = (page: Page, name: string) =>
  page.locator(`[data-testid=docker-row][data-name="${name}"]`)

test('lists the containers by project, follows the engine, and presses one', async () => {
  const { app, page, close } = await launch(undefined, { layout: inTabs('docker') })
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
    await change(app, 'redis', { state: 'exited', status: 'Exited (0) 1 second ago' })
    await expect(row(page, 'redis').getByTestId('docker-state')).toContainText('EXITED')
    await expect(page.getByTestId('docker-row')).toHaveCount(4)

    // Stop asks twice; the row stays where it was.
    const order = await page
      .getByTestId('docker-row')
      .evaluateAll((rows) => rows.map((r) => (r as HTMLElement).dataset.name))
    await row(page, 'shop-api-1').hover()
    await row(page, 'shop-api-1').getByTestId('docker-stop').click({ delay: 20 })
    await expect(row(page, 'shop-api-1').getByTestId('docker-stop')).toHaveText('STOP?')
    expect(await ask(app, 'presses')).toEqual([])
    await row(page, 'shop-api-1').getByTestId('docker-stop').click({ delay: 20 })
    await expect(row(page, 'shop-api-1').getByTestId('docker-state')).toContainText('EXITED')
    expect(await ask(app, 'presses')).toEqual(['stop shop-api-1'])
    expect(
      await page
        .getByTestId('docker-row')
        .evaluateAll((rows) => rows.map((r) => (r as HTMLElement).dataset.name)),
    ).toEqual(order)

    // Start goes at once.
    await row(page, 'shop-worker-1').hover()
    await row(page, 'shop-worker-1').getByTestId('docker-start').click({ delay: 20 })
    await expect(row(page, 'shop-worker-1').getByTestId('docker-state')).toContainText('UP')
    expect(await ask(app, 'presses')).toEqual(['stop shop-api-1', 'start shop-worker-1'])

    // RUN keeps what is up.
    await page.getByTestId('docker-filter-running').click({ delay: 20 })
    await expect(page.getByTestId('docker-row')).toHaveCount(2)
    await page.getByTestId('docker-filter-all').click({ delay: 20 })
    await expect(page.getByTestId('docker-row')).toHaveCount(4)

    // Resting on a name opens its card; the rest of the row opens none, so the card never comes
    // up over the presses of the rows below on the way to them (user report, 2026-09-27).
    await row(page, 'shop-db-1').getByTestId('docker-image').hover()
    await page.waitForTimeout(700)
    await expect(page.getByTestId('docker-card')).toHaveCount(0)
    await row(page, 'shop-api-1').getByTestId('docker-name').hover()
    await expect(page.getByTestId('docker-card')).toContainText('/home/dev/shop')
    await row(page, 'shop-db-1').hover()
    await row(page, 'shop-db-1').getByTestId('docker-restart').hover()
    await expect(page.getByTestId('docker-card')).toHaveCount(0)
    await page.waitForTimeout(700)
    await expect(page.getByTestId('docker-card')).toHaveCount(0)
    await row(page, 'shop-db-1').getByTestId('docker-restart').click({ delay: 20 })
    await expect(row(page, 'shop-db-1').getByTestId('docker-restart')).toHaveText('RESTART?')

    // The engine gone: the pane says so, and lists again when it is back.
    await linkTo(app, 'down')
    await expect(page.getByTestId('docker-link')).toContainText('NO DAEMON')
    await expect(page.getByTestId('docker-down')).toBeVisible()
    await linkTo(app, 'up')
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
    const copied = () =>
      app.evaluate(
        () =>
          (
            globalThis as unknown as {
              __elecdexClipboard: { current(): { text: string } | null }
            }
          ).__elecdexClipboard.current()?.text,
      )
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
  try {
    await expect(page.getByTestId('pane')).toHaveCount(2)
    await page.waitForTimeout(2000)
    expect(await ask(app, 'lists')).toBe(0)
    expect(await ask(app, 'streams')).toBe(0)
    expect(await page.evaluate(() => window.elecdex.docker.watching())).toEqual([])
    // A page that does not show the list cannot press a container.
    expect(await page.evaluate(() => window.elecdex.docker.control('0123456789ab', 'stop'))).toBe(
      'unsupported',
    )

    await page.locator('[data-testid=tab][data-pane-id=dk]').click({ delay: 20 })
    await expect(page.getByTestId('docker-row')).toHaveCount(4)
    expect(await ask(app, 'streams')).toBe(1)

    await page.locator('[data-testid=tab][data-pane-id=c]').click({ delay: 20 })
    await expect.poll(() => page.evaluate(() => window.elecdex.docker.watching())).toEqual([])
    expect(await ask(app, 'streams')).toBe(0)
    const lists = await ask(app, 'lists')
    const stats = await ask(app, 'statsReads')
    await change(app, 'redis', { state: 'exited' })
    await page.waitForTimeout(6000)
    expect(await ask(app, 'lists')).toBe(lists)
    expect(await ask(app, 'statsReads')).toBe(stats)
  } finally {
    await close()
  }
})
