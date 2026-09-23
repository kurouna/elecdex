import { expect, test } from '@playwright/test'
import { launch } from './support.js'

/**
 * The connections pane, against the made-up socket table
 * (ELECDEX_SOCKETS_STUB, set for every run in support.ts): the real one would
 * make this test depend on whatever the machine happened to be doing, and would
 * put the addresses this machine has visited into a trace.
 *
 * What is checked here is what only the running app can show: that the table
 * reaches the pane at all through the collector, the preload and the store;
 * that the pane stops reading it when it goes away; and that the choices it
 * keeps survive a restart.
 */

const single = (widget: string, state?: Record<string, unknown>) => ({
  version: 1,
  root: { kind: 'pane', id: 'p', widget, ...(state ? { state } : {}) },
})

test('the socket table reaches the pane, grouped by the program holding it', async () => {
  const { page, close } = await launch(undefined, { layout: single('connections') })
  try {
    const rows = page.getByTestId('connection-row')
    await expect.poll(() => rows.count(), { timeout: 20_000 }).toBeGreaterThan(0)

    // The stub's first rows: a browser holding two sockets to the same peer.
    await expect(page.getByTestId('connections-group-head').first()).toContainText('firefox')
    await expect(rows.first()).toContainText('93.184.216.34:443')
    // Placed with the bundled database, on this machine. Which country an address
    // is in is the database's business and changes when it is updated, so what is
    // pinned here is that every peer was placed at all.
    const codes = await page
      .getByTestId('connections-country')
      .evaluateAll((tags) => tags.map((tag) => tag.getAttribute('data-code')))
    expect(codes.length).toBeGreaterThan(0)
    for (const code of codes) expect(code).toMatch(/^[A-Z]{2}$/)
    await expect(page.getByTestId('connections')).toContainText('nothing is looked up online')
  } finally {
    await close()
  }
})

test('the listening view shows the doors, and the choice survives a restart', async () => {
  let launched = await launch(undefined, { layout: single('connections') })
  try {
    const { page } = launched
    await expect
      .poll(() => page.getByTestId('connection-row').count(), { timeout: 20_000 })
      .toBeGreaterThan(0)
    await expect(page.getByTestId('connection-row').first()).toContainText('93.184.216.34')

    await page.getByTestId('connections-view').filter({ hasText: 'LISTENING' }).click()
    await expect(page.getByTestId('connection-row').first()).toHaveAttribute('data-state', 'listen')
    // Listening rows group by program too, busiest first - nginx holds two ports.
    await expect(page.getByTestId('connections-group-head').first()).toContainText('nginx')
    await expect(page.getByTestId('connections-list')).toContainText('sshd')

    launched = await launched.relaunch()
    await expect(launched.page.getByTestId('connection-row').first()).toHaveAttribute(
      'data-state',
      'listen',
      {
        timeout: 20_000,
      },
    )
  } finally {
    await launched.close()
  }
})

test('keeps drawing as sockets come and go, reading after reading', async () => {
  // The pane froze on the first reading that added a socket: an effect that both
  // read and wrote the set of new rows ran itself for ever, and everything on the
  // page stopped. Nothing but a running app shows that, so the stub's table gains
  // and loses a socket every other reading and the page is watched for the throw.
  const { page, close } = await launch(undefined, { layout: single('connections') })
  const thrown: string[] = []
  page.on('pageerror', (error) => thrown.push(error.message))
  try {
    const rows = page.getByTestId('connection-row')
    await expect.poll(() => rows.count(), { timeout: 20_000 }).toBeGreaterThan(0)
    // Long enough for several readings, with a socket arriving and going in them.
    await page.waitForTimeout(12_000)
    expect(thrown).toEqual([])

    // Still answering: the switch works and the list redraws.
    await page.getByTestId('connections-view').filter({ hasText: 'LISTENING' }).click()
    await expect(rows.first()).toHaveAttribute('data-state', 'listen')
    expect(thrown).toEqual([])
  } finally {
    await close()
  }
})

test('masking hides the half of an address that names a machine', async () => {
  const { page, close } = await launch(undefined, { layout: single('connections') })
  try {
    const first = page.getByTestId('connection-row').first()
    await expect(first).toContainText('93.184.216.34', { timeout: 20_000 })
    await page.getByTestId('connections-mask').click()
    await expect(first).toContainText('93.184.')
    await expect(page.getByTestId('connections')).not.toContainText('216.34')
  } finally {
    await close()
  }
})

test('nothing reads the socket table once the pane has gone', async () => {
  const { page, close } = await launch(undefined, {
    layout: {
      version: 1,
      root: {
        kind: 'split',
        id: 's',
        direction: 'row',
        sizes: [50, 50],
        children: [
          { kind: 'pane', id: 'p', widget: 'connections' },
          { kind: 'pane', id: 'q', widget: 'clock' },
        ],
      },
    },
  })
  try {
    await expect
      .poll(() => page.getByTestId('connection-row').count(), { timeout: 20_000 })
      .toBeGreaterThan(0)
    const active = async () =>
      (await page.evaluate(() => window.elecdex.metrics.stats())).active ?? []
    expect(await active()).toContain('net.sockets')

    await page.getByTestId('pane-close').first().click()
    await expect(page.getByTestId('connections')).toHaveCount(0)
    // The collector must stop reading it: this is the rule every source keeps.
    await expect.poll(active, { timeout: 15_000 }).not.toContain('net.sockets')
  } finally {
    await close()
  }
})
