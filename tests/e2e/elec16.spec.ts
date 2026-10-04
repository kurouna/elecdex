import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
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

/** A wide, short pane under the clock: the room the tour once gave it. */
const UNDER_CLOCK = {
  version: 1,
  root: {
    kind: 'split',
    id: 's',
    direction: 'column',
    sizes: [63, 37],
    children: [
      { kind: 'pane', id: 'clock', widget: 'clock' },
      { kind: 'pane', id: 'e16', widget: 'elec16', state: { panel: false } },
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

/** Switched on: BASIC's banner, asleep at its prompt. */
async function booted(page: Page): Promise<void> {
  await expect.poll(() => lcdLines(page), { timeout: 15_000 }).toContain('ELEC-16 BASIC 1.0')
  await expect(page.getByTestId('elec16')).toHaveAttribute('data-asleep', 'true')
}

/** Types a line into the focused pane, a key at a time. */
async function typeLine(page: Page, line: string): Promise<void> {
  await page.keyboard.type(line, { delay: 15 })
  await page.keyboard.press('Enter')
}

/** From BASIC's prompt to the monitor's (MON), on a cleared screen (CLS is Home). */
async function toMonitor(page: Page): Promise<void> {
  await page.getByTestId('elec16').focus()
  await typeLine(page, 'mon')
  await expect.poll(() => lcdLines(page)).toContain('ELEC-16 MONITOR 0.1')
  await page.keyboard.press('Home')
  await expect.poll(async () => (await lcdLines(page))[0]).toBe('*')
}

test('boots to BASIC, sleeps at its prompt, takes keys only while it has the focus, and MON reaches the monitor', async () => {
  const { page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await settleLayout(page)
    await booted(page)
    await expect(page.getByTestId('elec16-lamp-cpu')).toHaveAttribute('data-lamp', 'sleep')
    // Not focused: the keys go elsewhere.
    await page.keyboard.type('d')
    await expect.poll(() => lcdLines(page)).toContain('>')
    await page.getByTestId('elec16').focus()
    await expect(page.getByTestId('elec16-lamp-keys')).toHaveText('keys')
    await typeLine(page, 'print 6*7')
    await expect.poll(() => lcdLines(page)).toContain('42')
    await toMonitor(page)
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
    await toMonitor(page)
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
    await toMonitor(page)
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
    await toMonitor(page)
    // Above BASIC's room for a program, where switching on writes nothing.
    await typeLine(page, 'e 7000 5a')
    await page.getByTestId('elec16-tab').and(page.locator('[data-tab=tune]')).click()
    await page.locator('[data-testid=elec16-model][data-model=pocket-64]').click()
    await expect.poll(async () => (await lcdLines(page)).length).toBe(8)
    await booted(page)
    await toMonitor(page)
    await typeLine(page, 'd 7000')
    await expect
      .poll(() => lcdLines(page))
      .toEqual(expect.arrayContaining([expect.stringMatching(/^7000: 5A/)]))
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
    await toMonitor(page)
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
    // writes the screen every frame pays for thirty frames a second as well. The limits are
    // half as much again as those figures: what else the machine is doing moves the reading
    // (user decision 2026-10-04).
    const room = 1.5
    expect(asleep - paused, `asleep over paused, ${power}`).toBeLessThan(
      process.env.CI ? 1 : 0.02 * room,
    )
    expect(spin4 - asleep, `4 MHz spinning over asleep, ${power}`).toBeLessThan(
      process.env.CI ? 1.5 : 0.08 * room,
    )
    expect(draw4 - asleep, `4 MHz drawing over asleep, ${power}`).toBeLessThan(
      process.env.CI ? 1.5 : 0.25 * room,
    )
  } finally {
    await close()
  }
})

const TWO_PANES = {
  version: 1,
  root: {
    kind: 'split',
    id: 's',
    direction: 'row',
    sizes: [50, 50],
    children: [
      { kind: 'pane', id: 'a', widget: 'elec16' },
      { kind: 'pane', id: 'b', widget: 'elec16' },
    ],
  },
}

/** A pane's LCD text, by the pane's id. */
const linesOf = (page: Page, id: string) => async (): Promise<string[]> =>
  (
    (await page
      .locator(`[data-testid=pane][data-pane-id=${id}]`)
      .getByTestId('elec16-text')
      .textContent()) ?? ''
  )
    .split('\n')
    .map((l) => l.trimEnd())

test("keeps the program through a restart: the unit's battery backup", async () => {
  const first = await launch(undefined, { layout: BESIDE_CLOCK })
  let second: Awaited<ReturnType<typeof first.relaunch>> | null = null
  try {
    await settleLayout(first.page)
    await booted(first.page)
    await first.page.getByTestId('elec16').focus()
    await typeLine(first.page, '10 PRINT "KEPT"')
    await expect.poll(() => lcdLines(first.page)).toContain('>10 PRINT "KEPT"')
    second = await first.relaunch()
    await settleLayout(second.page)
    await booted(second.page)
    await second.page.getByTestId('elec16').focus()
    await typeLine(second.page, 'run')
    await expect.poll(() => lcdLines(second?.page as Page)).toContain('KEPT')
  } finally {
    await (second ?? first).close()
  }
})

test('a second pane on the same unit is told so, and MOVE HERE takes the machine with its RAM', async () => {
  const { page, close } = await launch(undefined, { layout: TWO_PANES })
  try {
    await settleLayout(page)
    const a = page.locator('[data-testid=pane][data-pane-id=a]')
    const b = page.locator('[data-testid=pane][data-pane-id=b]')
    // Whichever pane started first runs UNIT 1; the other is told.
    const sheet = page.getByTestId('elec16-sheet')
    await expect(sheet).toHaveCount(1)
    await expect(sheet).toHaveAttribute('data-phase', 'held')
    const [runs, waits, waitsId] =
      (await a.getByTestId('elec16-sheet').count()) === 0 ? [a, b, 'b'] : [b, a, 'a']
    await runs.getByTestId('elec16').focus()
    await typeLine(page, 'z=42')
    await waits.getByTestId('elec16-move-here').click()
    await expect(runs.getByTestId('elec16-sheet')).toHaveAttribute('data-phase', 'gone')
    await expect(waits.getByTestId('elec16-sheet')).toHaveCount(0)
    await waits.getByTestId('elec16').focus()
    await typeLine(page, 'print z')
    await expect.poll(linesOf(page, waitsId)).toContain('42')
    // NEW UNIT in the pane that lost it: a unit of its own, afresh.
    await runs.getByTestId('elec16-new-unit').click()
    await expect(runs.getByTestId('elec16-sheet')).toHaveCount(0)
    await runs.getByTestId('elec16').focus()
    await typeLine(page, 'print z')
    await expect.poll(linesOf(page, waitsId === 'a' ? 'b' : 'a')).toContain('0')
  } finally {
    await close()
  }
})

test('IMPORT puts a picked listing on the card and EXPORT gives it back as text', async () => {
  const { app, page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  const outside = mkdtempSync(path.join(tmpdir(), 'elecdex-elec16-pick-'))
  try {
    await settleLayout(page)
    await booted(page)
    const listing = path.join(outside, 'hello.bas')
    writeFileSync(listing, '10 PRINT "HI"\r\n20 END\r\n')
    await app.evaluate(({ dialog }, answer) => {
      dialog.showOpenDialog = (async () => ({ canceled: false, filePaths: [answer] })) as never
    }, listing)
    await page.getByTestId('elec16-tab').and(page.locator('[data-tab=files]')).click()
    await page.getByTestId('elec16-import').click()
    await expect(page.getByTestId('elec16-files-said')).toHaveText('Imported as HELLO.BAS.')
    await expect(page.getByTestId('elec16-file')).toHaveAttribute('data-name', 'HELLO.BAS')
    // An unreadable character is refused, with its line.
    writeFileSync(listing, '10 PRINT "\u3042"\n')
    await page.getByTestId('elec16-import').click()
    await expect(page.getByTestId('elec16-files-said')).toContainText('Line 1 has')
    const target = path.join(outside, 'out.bas')
    await app.evaluate(({ dialog }, answer) => {
      dialog.showSaveDialog = (async () => ({ canceled: false, filePath: answer })) as never
    }, target)
    await page.getByTestId('elec16-file').click()
    await page.getByTestId('elec16-export').click()
    await expect(page.getByTestId('elec16-files-said')).toHaveText('Exported HELLO.BAS.')
    expect(readFileSync(target, 'utf8')).toBe('10 PRINT "HI"\r\n20 END\r\n')
  } finally {
    await close()
    rmSync(outside, { recursive: true, force: true })
  }
})

test("SAVE and LOAD go through main to the unit's card, and FILES lists what is there", async () => {
  const { page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await settleLayout(page)
    await booted(page)
    await page.getByTestId('elec16').focus()
    await typeLine(page, '10 print 5*7')
    await typeLine(page, 'save "calc"')
    await typeLine(page, 'new')
    await typeLine(page, 'load "calc"')
    await typeLine(page, 'run')
    await expect.poll(() => lcdLines(page)).toContain('35')
    await page.getByTestId('elec16-tab').and(page.locator('[data-tab=files]')).click()
    await expect(page.getByTestId('elec16-file')).toHaveAttribute('data-name', 'CALC.BAS')
  } finally {
    await close()
  }
})

test("FILES shows the SOFT CARD with each program's card, LOAD types its LOAD, and PASTE types the clipboard", async () => {
  const { page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await settleLayout(page)
    await booted(page)
    await page.getByTestId('elec16-tab').and(page.locator('[data-tab=files]')).click()
    const primes = page
      .getByTestId('elec16-soft-file')
      .and(page.locator('[data-name="PRIMES.BAS"]'))
    await primes.hover()
    await expect(page.getByTestId('elec16-file-card')).toContainText('THE PRIMES UP TO A NUMBER')
    await expect(page.getByTestId('elec16-file-card')).toContainText('LOAD "PRIMES.BAS"')
    // Nothing picked: how to see a program's help. Picked: how to use it, under the list.
    await expect(page.getByTestId('elec16-soft-help')).toHaveCount(0)
    await expect(page.getByTestId('elec16-files')).toContainText(
      'Pick a program to see how to use it',
    )
    await primes.click()
    await expect(page.getByTestId('elec16-soft-help')).toContainText('PRIMES.BAS')
    await expect(page.getByTestId('elec16-soft-help')).toContainText('every prime up to it')
    await page.getByTestId('elec16-load').click()
    await expect.poll(() => lcdLines(page)).toContain('>LOAD "PRIMES.BAS"')
    // The clipboard is the page's stand-in, never this machine's.
    await page.evaluate(() => {
      Object.defineProperty(navigator.clipboard, 'readText', {
        value: async () => 'RUN\n30\n',
        configurable: true,
      })
    })
    await page.getByTestId('elec16-tab').and(page.locator('[data-tab=tune]')).click()
    await page.getByTestId('elec16-paste').click()
    await expect.poll(() => lcdLines(page)).toContain('2 3 5 7 11 13 17 19 23 29')
    await expect(page.getByTestId('elec16-paste')).toHaveText('paste')
  } finally {
    await close()
  }
})

test('CORE stops the machine at a breakpoint typed in, goes on from it, and steps', async () => {
  const { page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await settleLayout(page)
    await booted(page)
    await toMonitor(page)
    await page.getByTestId('elec16-tab').and(page.locator('[data-tab=core]')).click()
    await page.getByTestId('elec16-break-input').fill('7000')
    await page.getByTestId('elec16-break-input').press('Enter')
    await expect(page.getByTestId('elec16-breakpoint')).toHaveAttribute('data-address', '7000')
    await page.getByTestId('elec16').focus()
    // c.j 0 at 0x7000: a jump to itself, stopped before it every time round.
    await typeLine(page, 'e 7000 01 a0')
    await typeLine(page, 'g 7000')
    await expect(page.getByTestId('elec16-instret')).toContainText('stopped at 7000')
    await expect(page.getByTestId('elec16-pc')).toHaveText('7000')
    await page.getByTestId('elec16-step').click()
    await expect(page.getByTestId('elec16-pc')).toHaveText('7000')
    await page.getByTestId('elec16-go').click()
    await expect(page.getByTestId('elec16-instret')).toContainText('stopped at 7000')
    // Without it, the machine runs on until BRK.
    await page.getByTestId('elec16-breakpoint').click()
    await expect(page.getByTestId('elec16-breakpoint')).toHaveCount(0)
    await page.getByTestId('elec16-go').click()
    await expect(page.getByTestId('elec16-lamp-cpu')).toHaveAttribute('data-lamp', 'run')
    await page.getByTestId('elec16-brk').click()
    await expect.poll(() => lcdLines(page)).toContain('BREAK AT 7000')
  } finally {
    await close()
  }
})

test('TUNE throws another unit away on a second press, and never the one the pane runs', async () => {
  const { page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await settleLayout(page)
    await booted(page)
    await page.getByTestId('elec16-tab').and(page.locator('[data-tab=tune]')).click()
    await page.getByTestId('elec16-unit-new').click()
    await expect(page.getByTestId('elec16-unit')).toHaveCount(2)
    const gone = page.getByTestId('elec16-unit-delete')
    await expect(gone).toHaveCount(1)
    await gone.click()
    await expect(gone).toContainText('?')
    await expect(page.getByTestId('elec16-unit')).toHaveCount(2)
    await gone.click()
    await expect(page.getByTestId('elec16-unit')).toHaveCount(1)
    await expect(page.getByTestId('elec16-unit-delete')).toHaveCount(0)
  } finally {
    await close()
  }
})

test('CODE compiles TypeScript at every level, keeps it on the card, and RUN runs it on the machine', async () => {
  const { page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await settleLayout(page)
    await booted(page)
    await page.getByTestId('elec16-view-toggle').click()
    const source = page.getByTestId('elec16-source')
    await expect(source).toHaveValue(/export function main\(\): void/)
    await source.fill(
      [
        "const WORDS = str('MADE IN TS')",
        'export function main(): void {',
        '  cls()',
        '  puts(WORDS)',
        '  newline()',
        '  putnum(6 * 7)',
        '  newline()',
        '}',
      ].join('\n'),
    )
    await page.getByTestId('elec16-compile').click()
    const rows = page.getByTestId('elec16-levels').locator('tbody tr')
    await expect(rows).toHaveCount(3, { timeout: 60_000 })
    for (const level of [0, 1, 2]) {
      await expect(rows.nth(level).getByTestId('elec16-level-bytes')).toHaveText(/^\d[\d,]*$/)
      await expect(rows.nth(level).getByTestId('elec16-level-cycles')).toHaveText(/^\d[\d,]*$/)
    }
    await expect(page.getByTestId('elec16-asm')).toContainText('main:')
    // An error says where.
    await source.fill('export function main(): void { return 1 / 2 }')
    await page.getByTestId('elec16-compile').click()
    await expect(page.getByTestId('elec16-code-errors')).toContainText('MAIN.TS:1:')
    await source.fill(
      [
        "const WORDS = str('MADE IN TS')",
        'export function main(): void {',
        '  puts(WORDS)',
        '}',
      ].join('\n'),
    )
    await page.getByTestId('elec16-compile').click()
    await expect(page.getByTestId('elec16-run')).toBeEnabled({ timeout: 60_000 })
    await page.getByTestId('elec16-run').click()
    await expect(page.getByTestId('elec16-code-view')).toHaveCount(0)
    await expect.poll(() => lcdLines(page), { timeout: 15_000 }).toContain('>CALL 28672')
    await expect.poll(async () => (await lcdLines(page)).join('\n')).toMatch(/MADE IN TS/)
    // The source is a file on the unit's card.
    await page.getByTestId('elec16-tab').and(page.locator('[data-tab=files]')).click()
    await expect(
      page.getByTestId('elec16-file').and(page.locator('[data-name="MAIN.TS"]')),
    ).toHaveCount(1)
  } finally {
    await close()
  }
})

test('RESET starts the machine again with its program kept, and the plate lamp follows POWER', async () => {
  const { page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await settleLayout(page)
    await booted(page)
    await expect(page.getByTestId('elec16-plate')).toContainText('16-BIT POCKET COMPUTER')
    const lamp = page.getByTestId('elec16-power-lamp')
    await expect(lamp).toHaveClass(/\bon\b/)
    await page.getByTestId('elec16').focus()
    await typeLine(page, '10 print 6*7')
    await page.getByTestId('elec16-reset').click()
    // Started again, the program's ten bytes still used, and asleep at the prompt.
    await expect.poll(() => lcdLines(page), { timeout: 15_000 }).toContain('26612 BYTES FREE')
    await expect(page.getByTestId('elec16')).toHaveAttribute('data-asleep', 'true')
    await page.getByTestId('elec16').focus()
    await typeLine(page, 'run')
    await expect.poll(() => lcdLines(page)).toContain('42')
    await page.getByTestId('elec16-power').click()
    await expect(lamp).not.toHaveClass(/\bon\b/)
    // The Business skins have no plate, as their themes have no ornament.
    await page.getByTestId('elec16-tab').and(page.locator('[data-tab=tune]')).click()
    await page.locator('[data-testid=elec16-skin][data-skin="business-dark"]').click()
    await expect(page.getByTestId('elec16-plate')).toHaveCount(0)
  } finally {
    await close()
  }
})

test('a short, wide pane gets a body that fits it, plate and keys whole, never clipped', async () => {
  const { app, page, close } = await launch(undefined, { layout: UNDER_CLOCK })
  try {
    await atDesignSize(app, page)
    await settleLayout(page)
    await booted(page)
    const device = page.getByTestId('elec16-device')
    const room = page.locator('[data-testid=pane][data-pane-id=e16] .fit')
    const inside = async () => {
      const [d, r] = await Promise.all([device.boundingBox(), room.boundingBox()])
      // An arriving pane powers on scaled from a line: measure it once it stands whole.
      if (d === null || r === null || r.height < 100) return 'unmeasured'
      return d.y >= r.y - 0.5 && d.y + d.height <= r.y + r.height + 0.5 ? 'inside' : 'clipped'
    }
    await expect.poll(inside).not.toBe('unmeasured')
    await expect.poll(inside).toBe('inside')
    await expect(page.getByTestId('elec16-plate')).toBeVisible()
  } finally {
    await close()
  }
})

test('CODE compiles the sample it shows, as it is, and says so on every level', async () => {
  const { page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await settleLayout(page)
    await booted(page)
    await page.getByTestId('elec16-view-toggle').click()
    await expect(page.getByTestId('elec16-source')).toHaveValue(/HELLO FROM TYPESCRIPT/)
    await page.getByTestId('elec16-compile').click()
    const rows = page.getByTestId('elec16-levels').locator('tbody tr')
    await expect(rows).toHaveCount(3, { timeout: 30_000 })
    await expect(page.getByTestId('elec16-compile')).toBeEnabled()
    await expect(page.getByTestId('elec16-run')).toBeEnabled()
  } finally {
    await close()
  }
})

test('CODE keeps what is typed after a RUN when the level is changed', async () => {
  // The pane's state changing (a level chosen) read the card again over the text typed.
  const { page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await settleLayout(page)
    await booted(page)
    await page.getByTestId('elec16-view-toggle').click()
    const source = page.getByTestId('elec16-source')
    await expect(source).toHaveValue(/HELLO FROM TYPESCRIPT/)
    await page.getByTestId('elec16-compile').click()
    await expect(page.getByTestId('elec16-run')).toBeEnabled({ timeout: 30_000 })
    await page.getByTestId('elec16-run').click()
    await expect(page.getByTestId('elec16-code-view')).toHaveCount(0)
    await expect.poll(() => lcdLines(page), { timeout: 15_000 }).toContain('HELLO FROM TYPESCRIPT')
    await page.getByTestId('elec16-view-toggle').click()
    await expect(source).toHaveValue(/HELLO FROM TYPESCRIPT/)
    const edited = (await source.inputValue()).replace('HELLO FROM TYPESCRIPT', 'EDITED AFTER RUN')
    await source.fill(edited)
    await page.getByTestId('elec16-level').and(page.locator('[data-level="1"]')).click()
    await page.waitForTimeout(500)

    await expect(source).toHaveValue(/EDITED AFTER RUN/)
    await page.getByTestId('elec16-level').and(page.locator('[data-level="2"]')).click()
    await page.waitForTimeout(500)
    await expect(source).toHaveValue(/EDITED AFTER RUN/)
  } finally {
    await close()
  }
})

test("FILES' LOAD stops a program waiting for a key first, rather than typing into it", async () => {
  const { page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await settleLayout(page)
    await booted(page)
    await page.getByTestId('elec16-tab').and(page.locator('[data-tab=files]')).click()
    const soft = (name: string) =>
      page.getByTestId('elec16-soft-file').and(page.locator(`[data-name="${name}"]`))
    await soft('SINEWAVE.BAS').click()
    await page.getByTestId('elec16-load').click()
    await expect.poll(() => lcdLines(page)).toContain('>LOAD "SINEWAVE.BAS"')
    await page.getByTestId('elec16').focus()
    await typeLine(page, 'run')
    await expect(page.getByTestId('elec16-lamp-cpu')).toHaveAttribute('data-lamp', 'sleep', {
      timeout: 15_000,
    })
    // SINEWAVE waits for any key: the L of LOAD once ended it, and the rest was a SYNTAX error.
    await soft('CLOCK.BAS').click()
    await page.getByTestId('elec16-load').click()
    await expect.poll(() => lcdLines(page), { timeout: 15_000 }).toContain('>LOAD "CLOCK.BAS"')
    expect((await lcdLines(page)).join('\n')).not.toMatch(/ERR/)
  } finally {
    await close()
  }
})

test("the dots' shadows follow the dots after the window was too small to draw them", async () => {
  // Dots three device pixels and more have shadows; smaller, none is drawn - and when the
  // window grew again, the shadows of what the screen showed before were still there.
  const { app, page, close } = await launch(undefined, {
    layout: {
      version: 1,
      root: { kind: 'pane', id: 'e16', widget: 'elec16', state: { panel: false } },
    },
  })
  const size = (w: number, h: number) =>
    app.evaluate(
      ({ BrowserWindow }, [cw, ch]) => BrowserWindow.getAllWindows()[0]?.setContentSize(cw, ch),
      [w, h] as const,
    )
  const scale = () => page.getByTestId('elec16-screen').getAttribute('data-scale')
  try {
    await size(1600, 900)
    await settleLayout(page)
    await booted(page)
    await expect.poll(async () => Number(await scale())).toBeGreaterThanOrEqual(3)
    await page.getByTestId('elec16').focus()
    await typeLine(page, 'FOR I=1 TO 5:PRINT "GUESS?";I*111:NEXT')
    await expect.poll(() => lcdLines(page)).toContain('GUESS?555')
    await size(700, 500)
    await expect.poll(async () => Number(await scale())).toBeLessThan(3)
    await page.getByTestId('elec16').focus()
    await typeLine(page, 'CLS:PRINT "HELLO"')
    await expect.poll(() => lcdLines(page)).toContain('HELLO')
    await size(1600, 900)
    await expect.poll(async () => Number(await scale())).toBeGreaterThanOrEqual(3)
    await page.waitForTimeout(1000)
    // Every shadow is a lit dot's: none is left of what the screen showed before.
    const stray = await page.locator('[data-testid=elec16-lcd] canvas').evaluateAll((els) => {
      const [shadow, dots] = els.map((c) => {
        const cv = c as HTMLCanvasElement
        return cv.getContext('2d')?.getImageData(0, 0, cv.width, cv.height).data
      })
      if (shadow === undefined || dots === undefined) return -1
      let n = 0
      for (let k = 3; k < dots.length; k += 4) if ((shadow[k] ?? 0) > 0 && (dots[k] ?? 0) === 0) n++
      return n
    })
    expect(stray).toBe(0)
  } finally {
    await close()
  }
})

/** PLAY-320's screen text, each row trimmed (it centres its words). */
const playLines = async (page: Page): Promise<string[]> =>
  (await lcdLines(page)).map((l) => l.trim())

test('TUNE makes the unit PLAY-320: its start screen alone, its extended RAM, CODE run on it, and back with RAM cleared', async () => {
  // docs/elec16-play.md, G2: the PLAY ROM's start screen, no FILES and no auto power-off,
  // extended RAM in TUNE and MEM, CODE's RUN calling the program itself.
  test.setTimeout(180_000)
  const { page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await settleLayout(page)
    await booted(page)
    await toMonitor(page)
    await typeLine(page, 'e 7000 5a')
    const tab = (name: string) =>
      page.getByTestId('elec16-tab').and(page.locator(`[data-tab=${name}]`))
    await tab('tune').click()
    await page.locator('[data-testid=elec16-model][data-model=play-320]').click()
    await expect(page.getByTestId('elec16-play-screen')).toBeVisible()
    await expect(page.getByTestId('elec16-device')).toHaveCount(0)
    await expect.poll(() => playLines(page), { timeout: 15_000 }).toContain('ELEC-16 PLAY')
    await expect.poll(() => playLines(page)).toContain('RAM 32K  XRAM 512K')
    await expect(page.getByTestId('elec16')).toHaveAttribute('data-asleep', 'true')
    await expect(tab('files')).toHaveCount(0)
    await expect(page.getByTestId('elec16-auto-off')).toHaveCount(0)
    await expect(page.getByTestId('elec16-xram')).toHaveCount(4)
    await page.locator('[data-testid=elec16-xram][data-kb="128"]').click()
    await expect.poll(() => playLines(page)).toContain('RAM 32K  XRAM 128K')

    await tab('mem').click()
    await expect(page.getByTestId('elec16-mem-space')).toHaveCount(3)
    await page.locator('[data-testid=elec16-mem-space][data-space=xram]').click()
    await expect(page.getByTestId('elec16-mem-rows')).toContainText('20:C000')

    await page.getByTestId('elec16-view-toggle').click()
    await page.getByTestId('elec16-compile').click()
    await expect(page.getByTestId('elec16-run')).toBeEnabled({ timeout: 60_000 })
    await page.getByTestId('elec16-run').click()
    await expect.poll(() => playLines(page), { timeout: 15_000 }).toContain('HELLO FROM TYPESCRIPT')
    // BRK brings the start screen back.
    await page.getByTestId('elec16-brk').click({ delay: 20 })
    await expect.poll(() => playLines(page)).toContain('ELEC-16 PLAY')

    await tab('tune').click()
    await page.locator('[data-testid=elec16-model][data-model=pocket-48]').click()
    await booted(page)
    await toMonitor(page)
    await typeLine(page, 'd 7000')
    await expect
      .poll(() => lcdLines(page))
      .toEqual(expect.arrayContaining([expect.stringMatching(/^7000: 00/)]))
  } finally {
    await close()
  }
})

test("PLAY-320's body: its buttons pressed from the keys, the pointer and a program's view of them", async () => {
  // docs/elec16-play.md, G3: the tall or wide body, the twelve buttons drawn pressed from any
  // source, and PAD read by a program; the screen alone as the fourth choice.
  test.setTimeout(180_000)
  const { page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await settleLayout(page)
    await booted(page)
    const tab = (name: string) =>
      page.getByTestId('elec16-tab').and(page.locator(`[data-tab=${name}]`))
    await tab('tune').click()
    await page.locator('[data-testid=elec16-model][data-model=play-320]').click()
    const body = page.getByTestId('elec16-play-body')
    await expect(body).toBeVisible()
    await expect(body).toHaveAttribute('data-skin', 'graphite')
    await expect(page.getByTestId('elec16-pad-button')).toHaveCount(12)
    await expect.poll(() => playLines(page), { timeout: 15_000 }).toContain('ELEC-16 PLAY')

    // A program that waits until a button is held, then writes PAD in hex.
    await page.getByTestId('elec16-view-toggle').click()
    await page
      .getByTestId('elec16-source')
      .fill(
        'export function main(): void {\n  cls()\n  let p: u16 = 0\n  while (p === 0) p = peek16(0xf810)\n  puthex(p)\n}\n',
      )
    await page.getByTestId('elec16-compile').click()
    await expect(page.getByTestId('elec16-run')).toBeEnabled({ timeout: 60_000 })
    await page.getByTestId('elec16-run').click()
    await expect(page.getByTestId('elec16-code-view')).toHaveCount(0)
    await page.getByTestId('elec16').focus()
    const button = (name: string) =>
      page.locator(`[data-testid=elec16-pad-button][data-button=${name}]`)
    await page.keyboard.down('z')
    await expect(button('a')).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(() => playLines(page)).toContain('0010')
    await page.keyboard.up('z')
    await expect(button('a')).toHaveAttribute('aria-pressed', 'false')
    // A held arm is drawn held, never as the down arm (the class once shared that name).
    await page.keyboard.down('ArrowRight')
    await expect(button('right')).toHaveClass(/(^| )held( |$)/)
    await expect(button('right')).not.toHaveClass(/(^| )down( |$)/)
    await page.keyboard.up('ArrowRight')
    await expect(button('right')).not.toHaveClass(/(^| )held( |$)/)

    // The pointer holds a button while it is down, and the pane keeps the keys.
    const start = button('start')
    await start.hover()
    await page.mouse.down()
    await expect(start).toHaveAttribute('aria-pressed', 'true')
    await page.mouse.up()
    await expect(start).toHaveAttribute('aria-pressed', 'false')

    // The wide body, another colour, and the screen alone.
    await page.locator('[data-testid=elec16-play-body-mode][data-body=wide]').click()
    await expect(body).toHaveAttribute('data-body', 'wide')
    await page.locator('[data-testid=elec16-play-skin][data-skin=coral]').click()
    await expect(body).toHaveAttribute('data-skin', 'coral')
    await page.locator('[data-testid=elec16-play-body-mode][data-body=screen]').click()
    await expect(body).toHaveCount(0)
    await expect(page.getByTestId('elec16-play-screen')).toBeVisible()
  } finally {
    await close()
  }
})

test("PLAY-320's cartridge: GAMES puts the demo in, START plays it, and it goes on after a restart", async () => {
  // docs/elec16-play.md section 7, G4: the shelf, the slot, CART through LINK (on by default),
  // the ROM put back after a restore, and the slot emptied by GAMES.
  test.setTimeout(240_000)
  const first = await launch(undefined, { layout: BESIDE_CLOCK })
  let running: Awaited<ReturnType<typeof launch>> | null = first
  try {
    const { page } = first
    await settleLayout(page)
    await booted(page)
    const tab = (name: string) =>
      page.getByTestId('elec16-tab').and(page.locator(`[data-tab=${name}]`))
    await tab('tune').click()
    await page.locator('[data-testid=elec16-model][data-model=play-320]').click()
    await expect.poll(() => playLines(page), { timeout: 15_000 }).toContain('ELEC-16 PLAY')
    await expect(tab('files')).toHaveCount(0)
    await tab('games').click()
    await expect(page.getByTestId('elec16-game-slot')).toHaveText('empty')
    await page.locator('[data-testid=elec16-game][data-game=DEMO]').click()
    await expect(page.getByTestId('elec16-game-slot')).toHaveText('ELEC-16 PLAY DEMO')
    // Put in, the start screen names it (a person's press: CART is asked).
    await expect.poll(() => playLines(page)).toContain('ELEC-16 PLAY DEMO')
    await expect.poll(() => playLines(page)).toContain('PRESS START')

    await page.getByTestId('elec16').focus()
    await page.keyboard.press('Enter')
    await expect.poll(() => playLines(page)).toContain('D-PAD MOVES  A COLOUR  START ENDS')

    // A restart while it plays: the backup has no ROM, which the pane puts back from the shelf.
    running = null
    await first.quit()
    const again = await launch(first.userData)
    running = again
    await settleLayout(again.page)
    await expect
      .poll(() => playLines(again.page), { timeout: 15_000 })
      .toContain('D-PAD MOVES  A COLOUR  START ENDS')
    await again.page.getByTestId('elec16').focus()
    await again.page.keyboard.press('Enter')
    await expect.poll(() => playLines(again.page)).toContain('PRESS START')

    // Taken out: the start screen says so, and START finds nothing.
    const tab2 = (name: string) =>
      again.page.getByTestId('elec16-tab').and(again.page.locator(`[data-tab=${name}]`))
    await tab2('games').click()
    await again.page.getByTestId('elec16-game-eject').click()
    await expect(again.page.getByTestId('elec16-game-slot')).toHaveText('empty')
    await expect.poll(() => playLines(again.page)).toContain('NO CARTRIDGE')

    // CART off in the LINK panel: the start screen says that instead.
    await tab2('games').click()
    await again.page.locator('[data-testid=elec16-game][data-game=DEMO]').click()
    await tab2('link').click()
    await again.page
      .locator('[data-testid=elec16-link-service][data-service=cart][data-on=false]')
      .click()
    await again.page.getByTestId('elec16-reset').click()
    await expect.poll(() => playLines(again.page)).toContain('LINK CART IS OFF')
  } finally {
    await running?.close()
  }
})

test("PLAY-320's mode 1: SCROLL draws its tiles and sprite, the ship moving with the d-pad", async () => {
  // docs/elec16-play.md section 4, G5: the tile engine drawn by the page, at the machine's
  // own resolution - a dot of the canvas read back to see the ship move.
  test.setTimeout(180_000)
  const { page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await settleLayout(page)
    await booted(page)
    const tab = (name: string) =>
      page.getByTestId('elec16-tab').and(page.locator(`[data-tab=${name}]`))
    await tab('tune').click()
    await page.locator('[data-testid=elec16-model][data-model=play-320]').click()
    await page.locator('[data-testid=elec16-play-body-mode][data-body=screen]').click()
    await expect.poll(() => playLines(page), { timeout: 15_000 }).toContain('ELEC-16 PLAY')
    await tab('games').click()
    await page.locator('[data-testid=elec16-game][data-game=SCROLL]').click()
    await expect.poll(() => playLines(page)).toContain('ELEC-16 PLAY SCROLL')
    await page.getByTestId('elec16').focus()
    await page.keyboard.press('Enter')
    // Mode 1 has no text to read back: the start screen's words are gone.
    await expect.poll(() => playLines(page), { timeout: 15_000 }).toEqual([''])
    /** The colour of a dot of the screen's canvas (the machine's own 320 x 288). */
    const dot = (x: number, y: number) =>
      page
        .getByTestId('elec16-play-screen')
        .evaluate(
          (canvas, [px, py]) =>
            Array.from(
              (canvas as HTMLCanvasElement).getContext('2d')?.getImageData(px ?? 0, py ?? 0, 1, 1)
                .data ?? [],
            ).slice(0, 3),
          [x, y],
        )
    const hull = [222, 231, 239]
    // The ship's middle, 16 x 16 from (152, 200): its hull.
    await expect.poll(() => dot(160, 209), { timeout: 10_000 }).toEqual(hull)
    await page.keyboard.down('ArrowLeft')
    await page.waitForTimeout(500)
    await page.keyboard.up('ArrowLeft')
    await expect.poll(() => dot(160, 209)).not.toEqual(hull)
    await page.keyboard.press('Enter')
    await expect.poll(() => playLines(page)).toContain('PRESS START')
  } finally {
    await close()
  }
})
