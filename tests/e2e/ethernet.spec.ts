import { expect, type Page, test } from '@playwright/test'
import { beside, catchPageCopies, launch, quietFor } from './support.js'

/**
 * The Ethernet pane, on the collector's stub (support.ts sets ELECDEX_ETHER_STUB=1,
 * a steady gigabit link; `problem` adds a reader's failure to every reading; the
 * other cases are played into the pane by tests/component/ethernet-widget.test.ts).
 * Nothing of this machine's adapters is read and no echo leaves it.
 */

/** The Ethernet pane beside a clock, given the larger share. */
const alone = () => beside('ethernet', { id: 'e', sizes: [60, 40] })

const station = (page: Page, id: string) =>
  page.locator(`[data-testid=ether-station][data-station=${id}]`)

test('shows the link, its verdict and its call score, masks it, and copies a report', async () => {
  const { page, close } = await launch(undefined, { layout: alone() })
  try {
    await expect(page.getByTestId('ether-state')).toContainText('ONLINE', { timeout: 20_000 })
    await expect(page.getByTestId('ether-verdict')).toContainText('CLEAR', { timeout: 15_000 })
    await expect(station(page, 'link')).toContainText('1 Gb/s full')
    await expect(station(page, 'gateway')).toContainText('<1 ms')
    await expect(page.getByTestId('ether-mos')).toContainText(/4\.\d/)

    await page.getByTestId('ether-mask').click()
    const copies = await catchPageCopies(page)
    await page.getByTestId('ether-copy').click()
    await expect(page.getByTestId('ether-copy')).toHaveText('COPIED')
    const report = (await copies()).at(-1) ?? ''
    expect(report).toContain('elecdex Ethernet report')
    expect(report).toContain('CLEAR')
    expect(report).not.toContain('192.0.2.31')
    expect(report).not.toContain('02:00:5e')
  } finally {
    await close()
  }
})

test('what the reader could not read is said once as a toast, and the pane goes on', async () => {
  const { page, close } = await launch(undefined, {
    layout: alone(),
    env: { ELECDEX_ETHER_STUB: 'problem' },
  })
  try {
    const toast = page.getByTestId('toast').filter({ hasText: 'ETHERNET' })
    await expect(toast).toContainText('a made-up failure', { timeout: 40_000 })
    await expect(page.getByTestId('ether-verdict')).toContainText('CLEAR')
    // A reading a second goes on carrying it: still one toast.
    await quietFor(3000, () => toast.count(), 'the ETHERNET toasts')
    await expect(toast).toHaveCount(1)
  } finally {
    await close()
  }
})
