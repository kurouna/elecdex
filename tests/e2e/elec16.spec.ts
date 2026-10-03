import { type ElectronApplication, expect, type Page, test } from '@playwright/test'
import { atDesignSize, launch, powerNote, settleLayout } from './support.js'

/**
 * The ELEC-16 pane (docs/elec16.md): the monitor in ROM booting on the LCD, keys from the
 * PC only while the pane has the focus and from the screen's keyboard, BRK getting a
 * runaway program back, sleeping at the prompt, pausing out of sight and coming back by
 * itself from the prompt, and TUNE's LCD and skin.
 */

const BESIDE_CLOCK = {
  version: 1,
  root: {
    kind: 'split',
    id: 's',
    direction: 'row',
    sizes: [20, 80],
    children: [
      { kind: 'pane', id: 'clock', widget: 'clock' },
      { kind: 'pane', id: 'e16', widget: 'elec16' },
    ],
  },
}

const BEHIND_A_TAB = {
  version: 1,
  root: {
    kind: 'tabs',
    id: 't',
    activeIndex: 0,
    children: [
      { kind: 'pane', id: 'e16', widget: 'elec16' },
      { kind: 'pane', id: 'clock', widget: 'clock' },
    ],
  },
}

/** The LCD's text, read back through the font (the screen reader's copy), row by row. */
const lcdLines = async (page: Page): Promise<string[]> =>
  ((await page.getByTestId('elec16-text').textContent()) ?? '').split('\n').map((l) => l.trimEnd())

async function booted(page: Page): Promise<void> {
  await expect.poll(() => lcdLines(page), { timeout: 15_000 }).toContain('ELEC-16 MONITOR 0.1')
  await expect(page.getByTestId('elec16')).toHaveAttribute('data-asleep', 'true')
}

/** Types a line into the focused pane, a key at a time. */
async function typeLine(page: Page, line: string): Promise<void> {
  await page.keyboard.type(line, { delay: 15 })
  await page.keyboard.press('Enter')
}

test('boots to the monitor, sleeps at its prompt, and takes keys only while it has the focus', async () => {
  const { page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await settleLayout(page)
    await booted(page)
    await expect(page.getByTestId('elec16-lamp-cpu')).toHaveAttribute('data-lamp', 'sleep')
    // Not focused: the keys go elsewhere.
    await page.keyboard.type('d')
    await expect.poll(() => lcdLines(page)).toContain('*')
    await page.getByTestId('elec16').focus()
    await expect(page.getByTestId('elec16-lamp-keys')).toHaveText('keys')
    await typeLine(page, 'd 0')
    await expect
      .poll(() => lcdLines(page))
      .toEqual(expect.arrayContaining([expect.stringMatching(/^0000:/)]))
    // A symbol on a shifted face, and a letter with the PC Shift: CAPS is on, so it is small.
    await page.keyboard.type('!')
    await page.keyboard.press('Shift+KeyA')
    await expect.poll(async () => (await lcdLines(page)).includes('*!a')).toBe(true)
  } finally {
    await close()
  }
})

test("the screen's keys type, and BRK gets a program that never ends back", async () => {
  const { page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await settleLayout(page)
    await booted(page)
    const keys = page.getByTestId('elec16-keys')
    // Wide enough for the whole keyboard, or else at least the row a compact body keeps.
    await expect(keys).toBeVisible()
    await page.getByTestId('elec16').focus()
    // c.j 0 at 0x7000: a jump to itself.
    await typeLine(page, 'e 7000 01 a0')
    await typeLine(page, 'g 7000')
    await expect(page.getByTestId('elec16-lamp-cpu')).toHaveAttribute('data-lamp', 'run')
    await page.getByTestId('elec16-brk').click()
    await expect.poll(() => lcdLines(page)).toContain('BREAK AT 7000')
    await expect(page.getByTestId('elec16-lamp-cpu')).toHaveAttribute('data-lamp', 'sleep')
    await keys.locator('[data-key=cls]').click()
    await expect.poll(() => lcdLines(page)).toEqual(['*', '', '', '', '', ''])
  } finally {
    await close()
  }
})

test('pauses behind a tab, and comes back by itself when it was asleep at its prompt', async () => {
  const { page, close } = await launch(undefined, { layout: BEHIND_A_TAB })
  try {
    await settleLayout(page)
    await booted(page)
    const root = page.getByTestId('elec16')
    await page.getByTestId('tab').nth(1).click()
    await expect(root).toHaveAttribute('data-status', 'paused')
    await page.getByTestId('tab').nth(0).click()
    await expect(root).toHaveAttribute('data-status', 'running')
  } finally {
    await close()
  }
})

test('a pane split beside it keeps its machine, RAM, screen and all', async () => {
  const { page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await settleLayout(page)
    await booted(page)
    await page.getByTestId('elec16').focus()
    await typeLine(page, 'e 7000 5a')
    await page.keyboard.type('d 7', { delay: 15 })
    // Splitting the pane remounts its widget (the new one beside it is a second ELEC-16): the
    // machine is taken up where it was, the half-typed line with it.
    await page.keyboard.press('Control+Shift+KeyE')
    await expect(page.getByTestId('pane')).toHaveCount(3)
    const original = page.locator('[data-testid=pane][data-pane-id=e16]')
    const lines = async () =>
      ((await original.getByTestId('elec16-text').textContent()) ?? '')
        .split('\n')
        .map((l) => l.trimEnd())
    await expect.poll(lines).toContain('*D 7')
    await original.getByTestId('elec16').focus()
    await page.keyboard.type('000', { delay: 15 })
    await page.keyboard.press('Enter')
    await expect.poll(lines).toEqual(expect.arrayContaining([expect.stringMatching(/^7000: 5A/)]))
  } finally {
    await close()
  }
})

test('TUNE fits another LCD, keeping the RAM, and changes the skin', async () => {
  const { page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await settleLayout(page)
    await booted(page)
    await page.getByTestId('elec16').focus()
    await typeLine(page, 'e 100 5a')
    await page.getByTestId('elec16-tab').and(page.locator('[data-tab=tune]')).click()
    await page.locator('[data-testid=elec16-model][data-model=pocket-64]').click()
    await expect.poll(async () => (await lcdLines(page)).length).toBe(8)
    await booted(page)
    await page.getByTestId('elec16').focus()
    await typeLine(page, 'd 100')
    await expect
      .poll(() => lcdLines(page))
      .toEqual(expect.arrayContaining([expect.stringMatching(/^0100: 5A/)]))
    await page.locator('[data-testid=elec16-skin][data-skin=night]').click()
    await expect(page.getByTestId('elec16-device')).toHaveAttribute('data-skin', 'night')
  } finally {
    await close()
  }
})

/** CPU seconds used by every Electron process. */
const cpuSeconds = (app: ElectronApplication) =>
  app.evaluate(({ app: electronApp }) =>
    electronApp.getAppMetrics().reduce((sum, m) => sum + (m.cpu.cumulativeCPUUsage ?? 0), 0),
  )

test('asleep at its prompt it costs what a paused pane does; running costs by its clock', async () => {
  // The emulators' loop is the one exception to the 10 fps loop (decisions.md): measured here
  // so a change that makes it expensive shows, and the clocks logged for the 32 MHz limit.
  test.setTimeout(240_000)
  const { app, page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await atDesignSize(app, page)
    await settleLayout(page)
    await booted(page)
    const WINDOW_MS = 8_000
    const measure = async () => {
      const start = await cpuSeconds(app)
      await page.waitForTimeout(WINDOW_MS)
      return ((await cpuSeconds(app)) - start) / (WINDOW_MS / 1000)
    }
    const root = page.getByTestId('elec16')
    await page.waitForTimeout(2000)
    const asleep = await measure()
    await page.getByTestId('elec16-pause').click()
    await expect(root).toHaveAttribute('data-status', 'paused')
    const paused = await measure()
    await page.getByTestId('elec16-pause').click()
    await root.focus()
    // A loop that writes the screen every turn - its last byte, away from the banner, so the
    // window watched while the test runs does not seem to flicker where text is - and one that
    // only spins.
    await typeLine(page, 'e 7000 1f fc 2c 07 09 12 07 00 26 00 f5 bf')
    await typeLine(page, 'e 7100 01 a0')
    const run = async (clock: string, at: string) => {
      await page.getByTestId('elec16-tab').and(page.locator('[data-tab=tune]')).click()
      await page.locator(`[data-testid=elec16-clock][data-clock="${clock}"]`).click()
      await root.focus()
      await typeLine(page, `g ${at}`)
      await expect(page.getByTestId('elec16-lamp-cpu')).toHaveAttribute('data-lamp', 'run')
      await page.waitForTimeout(1000)
      const used = await measure()
      await page.getByTestId('elec16-brk').click()
      await expect(page.getByTestId('elec16-lamp-cpu')).toHaveAttribute('data-lamp', 'sleep')
      return used
    }
    const spin4 = await run('4', '7100')
    const draw4 = await run('4', '7000')
    const spin32 = await run('32', '7100')
    const draw32 = await run('32', '7000')
    const spinMax = await run('max', '7100')
    const pct = (n: number) => `${(n * 100).toFixed(1)}%`
    const power = await powerNote(app, page)
    console.log(
      `elec16: asleep ${pct(asleep)}, paused ${pct(paused)}; 4 MHz spinning ${pct(spin4)}, drawing ${pct(draw4)}; 32 MHz spinning ${pct(spin32)}, drawing ${pct(draw32)}; MAX ${pct(spinMax)} of one core, ${power}`,
    )
    // Asleep it costs what it does stopped; running at the default clock, a program that
    // only computes stays within the spec's 8% (docs/elec16.md section 9), and one that
    // writes the screen every frame pays for thirty frames a second as well.
    expect(asleep - paused, `asleep over paused, ${power}`).toBeLessThan(process.env.CI ? 1 : 0.02)
    expect(spin4 - asleep, `4 MHz spinning over asleep, ${power}`).toBeLessThan(
      process.env.CI ? 1.5 : 0.08,
    )
    expect(draw4 - asleep, `4 MHz drawing over asleep, ${power}`).toBeLessThan(
      process.env.CI ? 1.5 : 0.25,
    )
  } finally {
    await close()
  }
})
