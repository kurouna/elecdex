import { copyFileSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { type ElectronApplication, expect, type Page, test } from '@playwright/test'
import { atDesignSize, launch, removeDir, settleLayout, zoomSettled } from './support.js'

/**
 * The CHIP-8 pane (docs/architecture.md section 5.18): the library, a program running on
 * a whole number of device pixels a dot, the keys only while the pane has the focus, the
 * pause out of sight, the machine surviving a remount and a restart bringing the program
 * back paused. Sound is off in every run (support.ts), so no audio context is made.
 */

const BESIDE_CLOCK = {
  version: 1,
  root: {
    kind: 'split',
    id: 's',
    direction: 'row',
    sizes: [35, 65],
    children: [
      { kind: 'pane', id: 'clock', widget: 'clock' },
      { kind: 'pane', id: 'c8', widget: 'chip8' },
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
      { kind: 'pane', id: 'c8', widget: 'chip8' },
      { kind: 'pane', id: 'clock', widget: 'clock' },
    ],
  },
}

/** A program's row in the list shown - not in one powering off after a tab change (inert). */
const row = (page: Page, id: string) =>
  page.locator(`[role=listbox]:not([inert]) [data-testid=chip8-program][data-program="${id}"]`)

async function loadProgram(page: Page, id: string): Promise<void> {
  await row(page, id).click()
  await page.getByTestId('chip8-load').click()
  await expect(page.getByTestId('chip8-run')).toHaveAttribute('data-status', 'running')
}

/** The running program's screen, or the library's attract screen. */
const runScreen = (page: Page) => page.getByTestId('chip8-run').getByTestId('chip8-screen')
const attractScreen = (page: Page) => page.getByTestId('chip8-attract').getByTestId('chip8-screen')

/** The lit dots on a screen's canvas (anything brighter than the ground). */
const litDots = (page: Page, screen = runScreen(page)) =>
  screen.evaluate((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')
    if (ctx === null) return 0
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let lit = 0
    for (let k = 0; k < data.length; k += 4)
      if ((data[k] ?? 0) + (data[k + 1] ?? 0) + (data[k + 2] ?? 0) > 150) lit++
    return lit
  })

const cycles = async (page: Page) =>
  Number(await page.getByTestId('chip8-cycles').getAttribute('data-cycles'))
const scale = async (page: Page) => Number(await runScreen(page).getAttribute('data-scale'))

async function designSize(app: ElectronApplication, page: Page): Promise<void> {
  await atDesignSize(app, page)
  await settleLayout(page)
}

test('the library loads a program, which draws at a whole number of pixels a dot', async () => {
  const { app, page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await designSize(app, page)
    await expect(page.getByTestId('chip8-program')).toHaveCount(112)
    await expect(page.locator('[data-testid=chip8-filter][data-filter=all]')).toHaveText(
      /all\s*112/,
    )
    await expect(page.locator('[data-testid=chip8-filter][data-filter=diag]')).toHaveText(
      /diag\s*8/,
    )
    await page.locator('[data-testid=chip8-filter][data-filter=diag]').click()
    await loadProgram(page, 'diag/3-corax+')
    // Corax+ ticks its checks off; the picture fills in within a moment.
    await expect.poll(() => litDots(page)).toBeGreaterThan(200)
    const dots = await scale(page)
    expect(Number.isInteger(dots)).toBe(true)
    expect(dots).toBeGreaterThanOrEqual(4)
    await expect(page.getByTestId('chip8-resolution')).toHaveText('LORES')
    await expect(page.getByTestId('chip8-core')).toBeVisible()
    await expect(page.locator('[data-testid=pane][data-pane-id=c8]')).toContainText('running')
    // Back in the library the machine stops.
    await page.getByTestId('chip8-back').click()
    await expect(page.getByTestId('chip8-library')).toBeVisible()
  } finally {
    await close()
  }
})

test('the keys reach the machine only while the pane has the focus, and never with Ctrl', async () => {
  const { app, page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await designSize(app, page)
    await loadProgram(page, 'diag/6-keypad')
    await expect(page.getByTestId('chip8-lamp-keys')).toHaveClass(/on/)
    const pad = page.locator('[data-testid=chip8-pad][data-key="5"]')
    await page.keyboard.down('KeyW')
    await expect(pad).toHaveClass(/down/)
    await page.keyboard.up('KeyW')
    await expect(pad).not.toHaveClass(/down/)
    // Octo's second keys: the arrows and Space.
    await page.keyboard.down('ArrowLeft')
    await expect(page.locator('[data-testid=chip8-pad][data-key="7"]')).toHaveClass(/down/)
    await page.keyboard.up('ArrowLeft')
    // Held with Ctrl, a key is the app's.
    await page.keyboard.down('Control')
    await page.keyboard.down('KeyW')
    await expect(pad).not.toHaveClass(/down/)
    await page.keyboard.up('KeyW')
    await page.keyboard.up('Control')
    // The focus elsewhere: the lamp goes out and nothing is taken.
    await page.locator('[data-testid=pane][data-pane-id=clock]').click()
    await expect(page.getByTestId('chip8-lamp-keys')).not.toHaveClass(/on/)
    await page.keyboard.down('KeyW')
    await expect(pad).not.toHaveClass(/down/)
    await page.keyboard.up('KeyW')
    // A press on the pad itself works with the pointer.
    await pad.dispatchEvent('pointerdown', { pointerId: 1, button: 0 })
    await expect(pad).toHaveClass(/down/)
    await pad.dispatchEvent('pointerup', { pointerId: 1, button: 0 })
    await expect(pad).not.toHaveClass(/down/)
  } finally {
    await close()
  }
})

test('P pauses and resumes, Enter steps one frame while paused', async () => {
  const { app, page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await designSize(app, page)
    await loadProgram(page, 'diag/3-corax+')
    // Once it has drawn its checks it waits in a loop that draws nothing, so a frame is
    // its whole 1000 instructions (drawing, VIP's display wait would end one early).
    await expect.poll(() => cycles(page)).toBeGreaterThan(20_000)
    await page.keyboard.press('KeyP')
    await expect(page.getByTestId('chip8-run')).toHaveAttribute('data-status', 'paused')
    await expect(page.getByTestId('chip8-paused')).toBeVisible()
    const still = await cycles(page)
    await page.waitForTimeout(400)
    expect(await cycles(page)).toBe(still)
    await page.keyboard.press('Enter')
    await expect.poll(() => cycles(page)).toBe(still + 1000)
    await page.getByTestId('chip8-step').click()
    await expect.poll(() => cycles(page)).toBe(still + 1001)
    await page.keyboard.press('KeyP')
    await expect(page.getByTestId('chip8-run')).toHaveAttribute('data-status', 'running')
    await expect.poll(() => cycles(page)).toBeGreaterThan(still + 5000)
  } finally {
    await close()
  }
})

test('out of sight it pauses, and stays paused when seen again', async () => {
  const { app, page, close } = await launch(undefined, { layout: BEHIND_A_TAB })
  try {
    await designSize(app, page)
    await loadProgram(page, 'diag/3-corax+')
    await page.locator('[data-testid=tab][data-pane-id=clock]').click()
    await expect(page.getByTestId('chip8-run')).toHaveAttribute('data-status', 'paused')
    const still = await cycles(page)
    await page.waitForTimeout(500)
    expect(await cycles(page)).toBe(still)
    await page.locator('[data-testid=tab][data-pane-id=c8]').click()
    await page.waitForTimeout(300)
    await expect(page.getByTestId('chip8-run')).toHaveAttribute('data-status', 'paused')
    expect(await cycles(page)).toBe(still)
  } finally {
    await close()
  }
})

test('brought forward the dots grow, and put back they are as they were', async () => {
  const { app, page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await designSize(app, page)
    await loadProgram(page, 'diag/2-ibm-logo')
    await settleLayout(page)
    const before = await scale(page)
    await page.locator('[data-testid=pane][data-pane-id=c8]').hover()
    await page.keyboard.press('Control+Shift+KeyZ')
    await zoomSettled(page)
    await expect.poll(() => scale(page)).toBeGreaterThan(before)
    await page.keyboard.press('Escape')
    await zoomSettled(page)
    await expect.poll(() => scale(page)).toBe(before)
  } finally {
    await close()
  }
})

test('a pane split beside it keeps its machine going, and a restart brings the program back paused', async () => {
  let launched = await launch(undefined, { layout: BESIDE_CLOCK })
  const profile = launched.userData
  try {
    const { app, page } = launched
    await designSize(app, page)
    await loadProgram(page, 'diag/3-corax+')
    await expect.poll(() => cycles(page)).toBeGreaterThan(20_000)
    const before = await cycles(page)
    // Splitting the pane remounts its widget: the machine is taken up where it was.
    await page.keyboard.press('Control+Shift+KeyE')
    await expect(page.getByTestId('pane')).toHaveCount(3)
    await expect(page.getByTestId('chip8-run')).toBeVisible()
    expect(await cycles(page)).toBeGreaterThanOrEqual(before)

    await page.getByTestId('chip8-panel-toggle').click()
    const kept = await cycles(page)
    launched = await launched.relaunch()
    await expect(launched.page.getByTestId('chip8-run')).toHaveAttribute('data-status', 'paused')
    await expect(launched.page.getByTestId('chip8-run')).toContainText('Corax+')
    // From AUTO, written as the app went: where it was, not the first instruction. The
    // registers are CORE's, in the panel the half pane has folded away.
    await designSize(launched.app, launched.page)
    await launched.page.getByTestId('chip8-panel-toggle').click()
    expect(await cycles(launched.page)).toBeGreaterThanOrEqual(kept)
  } finally {
    await launched.close()
    removeDir(profile)
  }
})

/** CPU seconds used by every Electron process. */
const cpuSeconds = (app: ElectronApplication) =>
  app.evaluate(({ app: electronApp }) =>
    electronApp.getAppMetrics().reduce((sum, m) => sum + (m.cpu.cumulativeCPUUsage ?? 0), 0),
  )

test('a program running costs little more than the pane standing still', async () => {
  // The game's own 60 fps loop is the one exception to the 10 fps loop (section 16):
  // measured here so a change that makes it expensive shows. The library's attract mode
  // plays while someone is at it and rests after half a minute; resting, the library costs
  // what a still pane does.
  test.setTimeout(150_000)
  const { app, page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await designSize(app, page)
    const WINDOW_MS = 10_000
    const measure = async () => {
      const start = await cpuSeconds(app)
      await page.waitForTimeout(WINDOW_MS)
      return ((await cpuSeconds(app)) - start) / (WINDOW_MS / 1000)
    }
    await page.waitForTimeout(3000)
    const attract = await measure()
    await expect(page.getByTestId('chip8-library')).toHaveAttribute('data-awake', 'false', {
      timeout: 40_000,
    })
    const resting = await measure()
    await page.locator('[data-testid=chip8-filter][data-filter=diag]').click()
    await loadProgram(page, 'diag/3-corax+')
    await page.waitForTimeout(2000)
    const running = await measure()
    await page.keyboard.press('KeyP')
    await page.waitForTimeout(1000)
    const paused = await measure()
    const pct = (n: number) => `${(n * 100).toFixed(1)}%`
    console.log(
      `chip8: library attract ${pct(attract)}, resting ${pct(resting)}, running ${pct(running)}, paused ${pct(paused)} of one core`,
    )
    expect(running - resting).toBeLessThan(process.env.CI ? 1.5 : 0.15)
    expect(attract - resting).toBeLessThan(process.env.CI ? 1.5 : 0.35)
    expect(paused).toBeLessThan(running)
  } finally {
    await close()
  }
})
test('a program no longer in the library sends the pane back to it, saying so', async () => {
  const { page, close } = await launch(undefined, {
    layout: {
      version: 1,
      root: {
        kind: 'pane',
        id: 'c8',
        widget: 'chip8',
        state: { view: 'run', program: 'diag/gone' },
      },
    },
  })
  try {
    await expect(page.getByTestId('chip8-library')).toBeVisible()
    await expect(page.getByTestId('chip8-missing')).toContainText('diag/gone')
    await expect(page.getByTestId('chip8')).toHaveAttribute('data-view', 'library')
  } finally {
    await close()
  }
})

test('RESET starts the program again and draws it from the start', async () => {
  const { app, page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await designSize(app, page)
    await loadProgram(page, 'diag/3-corax+')
    await expect.poll(() => cycles(page)).toBeGreaterThan(20_000)
    await expect.poll(() => litDots(page)).toBeGreaterThan(200)
    // Reset while paused: back at the first instruction, still paused, and the canvas shows
    // the new machine's blank screen - not the old one's picture.
    await page.keyboard.press('KeyP')
    await page.getByTestId('chip8-reset').click()
    await expect.poll(() => cycles(page)).toBe(0)
    await expect(page.getByTestId('chip8-run')).toHaveAttribute('data-status', 'paused')
    await expect.poll(() => litDots(page)).toBe(0)
    // One frame on, Corax+ has drawn its first check.
    await page.keyboard.press('Enter')
    await expect.poll(() => litDots(page)).toBeGreaterThan(0)
  } finally {
    await close()
  }
})

test('the library searches everything, hides a machine, and plays the chosen program by itself', async () => {
  const { app, page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await designSize(app, page)
    // Every row has its preview.
    await expect(page.locator('[data-testid=chip8-program] canvas')).toHaveCount(112)
    // A search looks through every tab, whichever is open.
    await page.locator('[data-testid=chip8-filter][data-filter=story]').click()
    await page.getByTestId('chip8-search').fill('timendus')
    await expect(page.getByTestId('chip8-program')).toHaveCount(8)
    await expect(row(page, 'diag/5-quirks')).toBeVisible()
    await page.getByTestId('chip8-search').fill('')
    await page.locator('[data-testid=chip8-filter][data-filter=all]').click()
    // Hiding XO-CHIP leaves the other two.
    await page.locator('[data-testid=chip8-machine][data-platform=xochip]').click()
    await expect(page.getByTestId('chip8-program')).toHaveCount(112 - 28)
    await page.locator('[data-testid=chip8-machine][data-platform=xochip]').click()
    // The chosen program plays by itself beside its details.
    await row(page, 'archive/br8kout').click()
    await expect(page.getByTestId('chip8-attract')).toHaveAttribute(
      'data-program',
      'archive/br8kout',
    )
    await expect.poll(() => litDots(page, attractScreen(page))).toBeGreaterThan(20)
    await expect(page.getByTestId('chip8-detail-keys').locator('i.on')).not.toHaveCount(0)
  } finally {
    await close()
  }
})

test('a row rested on opens its card, which goes when the row does', async () => {
  const { app, page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await designSize(app, page)
    await row(page, 'archive/octoma').hover()
    const card = page.getByTestId('chip8-card')
    await expect(card).toContainText('XO-CHIP')
    await expect(card).toContainText('10,000 instructions a frame')
    // The row goes from under the pointer: no leave comes, and the card goes all the same.
    await page.getByTestId('chip8-search').fill('snake')
    await expect(card).toHaveCount(0)
  } finally {
    await close()
  }
})

test('a program from chip8Archive loads and runs in its own colours when asked', async () => {
  const { app, page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await designSize(app, page)
    await page.getByTestId('chip8-search').fill('br8kout')
    await loadProgram(page, 'archive/br8kout')
    await expect.poll(() => litDots(page)).toBeGreaterThan(20)
    const ground = () =>
      runScreen(page).evaluate((canvas: HTMLCanvasElement) => {
        const [r, g, b] = canvas.getContext('2d')?.getImageData(0, 0, 1, 1).data ?? []
        return [r, g, b]
      })
    const themed = await ground()
    await page.locator('[data-testid=chip8-tab][data-tab=tune]').click()
    await page.getByTestId('chip8-original').click()
    // Br8kout's author made its ground #ca2553.
    await expect.poll(ground).toEqual([0xca, 0x25, 0x53])
    expect(themed).not.toEqual([0xca, 0x25, 0x53])
  } finally {
    await close()
  }
})

test('the attract mode rests after half a minute with nobody at the library', async () => {
  test.setTimeout(90_000)
  const { app, page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await designSize(app, page)
    await expect(page.getByTestId('chip8-library')).toHaveAttribute('data-awake', 'true')
    await expect(page.getByTestId('chip8-library')).toHaveAttribute('data-awake', 'false', {
      timeout: 40_000,
    })
    // Resting, its screen stands still.
    const still = await attractScreen(page).evaluate((c: HTMLCanvasElement) => c.toDataURL())
    await page.waitForTimeout(1000)
    expect(await attractScreen(page).evaluate((c: HTMLCanvasElement) => c.toDataURL())).toBe(still)
    // The pointer over the library wakes it.
    await page.getByTestId('chip8-library').hover()
    await page.mouse.move(1200, 500)
    await expect(page.getByTestId('chip8-library')).toHaveAttribute('data-awake', 'true')
  } finally {
    await close()
  }
})

test('a program whose screen is turned is drawn turned, in the middle of its frame', async () => {
  const { app, page, close } = await launch(undefined, {
    layout: {
      ...BESIDE_CLOCK,
      root: {
        ...BESIDE_CLOCK.root,
        children: [
          BESIDE_CLOCK.root.children[0],
          {
            kind: 'pane',
            id: 'c8',
            widget: 'chip8',
            state: { view: 'run', program: 'archive/sub8' },
          },
        ],
      },
    },
  })
  try {
    await designSize(app, page)
    await expect(page.getByTestId('chip8-run')).toBeVisible()
    // Measured once the view has powered on (it opens from a line).
    const boxes = async () => ({
      bezel: await page.getByTestId('chip8-bezel').boundingBox(),
      screen: await runScreen(page).boundingBox(),
    })
    await expect
      .poll(async () => {
        const { screen } = await boxes()
        return screen !== null && screen.height > screen.width
      })
      .toBe(true)
    const { bezel, screen } = await boxes()
    if (bezel === null || screen === null) throw new Error('no screen')
    // Sub-Terr8nia is turned 270 degrees: taller than wide, and centred in the bezel.
    expect(Math.abs(screen.x + screen.width / 2 - (bezel.x + bezel.width / 2))).toBeLessThan(2)
    expect(Math.abs(screen.y + screen.height / 2 - (bezel.y + bezel.height / 2))).toBeLessThan(2)
  } finally {
    await close()
  }
})

const tab = (page: Page, name: string) => page.locator(`[data-testid=chip8-tab][data-tab=${name}]`)
const slot = (page: Page, name: string) =>
  page.locator(`[data-testid=chip8-slot][data-slot="${name}"]`)
const OWN = "program's own"

test('LOAD goes on from where the program was left, NEW starts it again', async () => {
  const { app, page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await designSize(app, page)
    await page.locator('[data-testid=chip8-filter][data-filter=diag]').click()
    await row(page, 'diag/3-corax+').click()
    // Nothing kept yet: LOAD, and no NEW.
    await expect(page.getByTestId('chip8-load')).toHaveText(/load/)
    await expect(page.getByTestId('chip8-new')).toHaveCount(0)
    await loadProgram(page, 'diag/3-corax+')
    await expect.poll(() => cycles(page)).toBeGreaterThan(20_000)
    await page.getByTestId('chip8-back').click()
    await expect(page.getByTestId('chip8-auto')).toContainText('left at')
    await expect(page.getByTestId('chip8-load')).toHaveText(/continue/)

    // A reload loses the machine in the page: CONTINUE takes it up from AUTO.
    await page.reload()
    await expect(page.getByTestId('chip8-library')).toBeVisible()
    await expect(page.getByTestId('chip8-load')).toHaveText(/continue/)
    await page.getByTestId('chip8-load').click()
    await expect(page.getByTestId('chip8-run')).toHaveAttribute('data-status', 'running')
    expect(await cycles(page)).toBeGreaterThan(20_000)
    // CORE types where it goes on from, and then the line is whole.
    const boot = page.getByTestId('chip8-boot')
    await expect(boot).toHaveAttribute('data-line', /^RESUME [0-9A-F]{3} · 761 B · VIP$/)
    await expect(boot).toHaveText(/^RESUME .* VIP$/)

    await page.getByTestId('chip8-back').click()
    await page.getByTestId('chip8-new').click()
    await expect(page.getByTestId('chip8-run')).toHaveAttribute('data-status', 'running')
    expect(await cycles(page)).toBeLessThan(20_000)
    await expect(boot).toHaveText(/^LOAD 200 · .* VIP$/)
    // Paused, FRAME runs one frame, as Enter does.
    await page.keyboard.press('KeyP')
    const at = await cycles(page)
    await page.getByTestId('chip8-frame').click()
    await expect.poll(() => cycles(page)).toBeGreaterThan(at)
  } finally {
    await close()
  }
})

test('SAVE keeps a machine in a slot and LOAD goes back to it; writing over asks once more', async () => {
  const { app, page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await designSize(app, page)
    await page.locator('[data-testid=chip8-filter][data-filter=diag]').click()
    await loadProgram(page, 'diag/3-corax+')
    await expect.poll(() => cycles(page)).toBeGreaterThan(5_000)
    await page.keyboard.press('KeyP')
    await expect(page.getByTestId('chip8-run')).toHaveAttribute('data-status', 'paused')
    const at = await cycles(page)

    await tab(page, 'save').click()
    await expect(slot(page, '1')).toHaveAttribute('data-filled', 'false')
    await slot(page, '1').getByTestId('chip8-slot-save').click()
    await expect(slot(page, '1')).toHaveAttribute('data-filled', 'true')
    // Its screen is the machine's.
    await expect(slot(page, '1').locator('canvas')).toHaveCount(1)

    // A few frames on, then back to the slot: where it was, still paused.
    for (let k = 0; k < 5; k++) await page.keyboard.press('Enter')
    await tab(page, 'core').click()
    await expect.poll(() => cycles(page)).toBeGreaterThan(at)
    await tab(page, 'save').click()
    await slot(page, '1').getByTestId('chip8-slot-load').click()
    await tab(page, 'core').click()
    await expect.poll(() => cycles(page)).toBe(at)
    await expect(page.getByTestId('chip8-run')).toHaveAttribute('data-status', 'paused')

    // Over a filled slot SAVE arms first.
    await tab(page, 'save').click()
    const save = slot(page, '1').getByTestId('chip8-slot-save')
    await save.click()
    await expect(save).toHaveText('over?')
    await save.click()
    await expect(save).toHaveText('save')
    // AUTO is only read here: no SAVE of its own.
    await expect(slot(page, 'auto').getByTestId('chip8-slot-save')).toHaveCount(0)
  } finally {
    await close()
  }
})

test('TUNE is kept for the program, in the library and next time, and OWN puts its own back', async () => {
  const launched = await launch(undefined, { layout: BESIDE_CLOCK })
  let current = launched
  try {
    await designSize(launched.app, launched.page)
    const { page } = launched
    await page.locator('[data-testid=chip8-filter][data-filter=diag]').click()
    await loadProgram(page, 'diag/3-corax+')
    await tab(page, 'tune').click()
    await expect(page.getByTestId('chip8-tuning')).toHaveText(OWN)
    await page.locator('[data-testid=chip8-ipf][data-ipf="100"]').click()
    await expect(page.getByTestId('chip8-tuning')).toHaveText('yours')
    await page.getByTestId('chip8-back').click()
    await expect(page.getByTestId('chip8-detail')).toContainText('100 a frame · tuned')

    current = await launched.relaunch()
    const again = current.page
    await expect(again.getByTestId('chip8-detail')).toContainText('100 a frame · tuned')
    await again.getByTestId('chip8-new').click()
    await tab(again, 'tune').click()
    await expect(again.locator('[data-testid=chip8-ipf][data-ipf="100"]')).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await again.getByTestId('chip8-own').click()
    await expect(again.getByTestId('chip8-tuning')).toHaveText(OWN)
    await again.getByTestId('chip8-back').click()
    await expect(again.getByTestId('chip8-detail')).not.toContainText('tuned')
  } finally {
    await current.close()
    removeDir(launched.userData)
  }
})

test('a star puts a program in the starred tab, and taking it off leaves the tab empty', async () => {
  const { app, page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await designSize(app, page)
    const starred = page.locator('[data-testid=chip8-filter][data-filter=starred]')
    const listed = page.locator('[role=listbox]:not([inert]) [data-testid=chip8-program]')
    await expect(starred).toHaveCount(0)
    await page.locator('[data-testid=chip8-filter][data-filter=diag]').click()
    await row(page, 'diag/2-ibm-logo').click()
    await page.getByTestId('chip8-star').click()
    await expect(page.getByTestId('chip8-star')).toHaveAttribute('aria-pressed', 'true')
    await expect(starred).toHaveText(/1/)
    await starred.click()
    await expect(listed).toHaveCount(1)
    await page.getByTestId('chip8-star').click()
    // The tab stays while it is open, with nothing in it.
    await expect(starred).toHaveText(/0/)
    await expect(listed).toHaveCount(0)

    // Starring a program left somewhere keeps CONTINUE as it is: the list changing is not a
    // new choice (it went back to LOAD for a moment, and asked main again).
    await page.locator('[data-testid=chip8-filter][data-filter=diag]').click()
    await loadProgram(page, 'diag/3-corax+')
    await page.getByTestId('chip8-back').click()
    await expect(page.getByTestId('chip8-load')).toHaveText(/continue/)
    await page.evaluate(() => {
      const w = window as unknown as { loadFlickered: boolean }
      w.loadFlickered = false
      new MutationObserver(() => {
        const text = document.querySelector('[data-testid=chip8-load]')?.textContent ?? ''
        if (!text.includes('continue')) w.loadFlickered = true
      }).observe(document.body, { subtree: true, childList: true, characterData: true })
    })
    await page.getByTestId('chip8-star').click()
    await expect(page.getByTestId('chip8-star')).toHaveAttribute('aria-pressed', 'true')
    await page.waitForTimeout(500)
    expect(
      await page.evaluate(() => (window as unknown as { loadFlickered: boolean }).loadFlickered),
    ).toBe(false)
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
      { kind: 'pane', id: 'a', widget: 'chip8' },
      { kind: 'pane', id: 'b', widget: 'chip8' },
    ],
  },
}

/** Replaces main's file picker with one that answers `file`. */
async function pickerAnswers(app: ElectronApplication, file: string): Promise<void> {
  await app.evaluate(({ dialog }, answer) => {
    dialog.showOpenDialog = (async () => ({ canceled: false, filePaths: [answer] })) as never
  }, file)
}

test('IMPORT takes a picked file in, to rename, run as another machine and remove', async () => {
  const { app, page, close } = await launch(undefined, { layout: TWO_PANES })
  const outside = mkdtempSync(path.join(tmpdir(), 'elecdex-chip8-pick-'))
  try {
    await designSize(app, page)
    const a = page.locator('[data-testid=pane][data-pane-id=a]')
    const b = page.locator('[data-testid=pane][data-pane-id=b]')
    // Nothing to take: an empty file is refused, saying why.
    const empty = path.join(outside, 'empty.ch8')
    writeFileSync(empty, '')
    await pickerAnswers(app, empty)
    await a.getByTestId('chip8-import').click()
    await expect(a.getByTestId('chip8-import-problem')).toHaveText('That file is empty.')

    const file = path.join(outside, 'ibm_logo.ch8')
    copyFileSync(path.join('resources', 'chip8', 'test-suite', '2-ibm-logo.ch8'), file)
    await pickerAnswers(app, file)
    await a.getByTestId('chip8-import').click()
    const sheet = a.getByTestId('chip8-import-sheet')
    await expect(sheet).toContainText('imported')
    await expect(sheet.getByTestId('chip8-import-guess')).toContainText('only CHIP-8 instructions')
    await expect(sheet.getByTestId('chip8-import-title')).toHaveValue('ibm logo')
    await sheet.getByTestId('chip8-import-title').fill('Big Blue')
    await sheet.locator('[data-testid=chip8-import-machine][data-platform=schip]').click()
    await sheet.getByTestId('chip8-import-done').click()
    await expect(sheet).toHaveCount(0)
    // In both panes' libraries, under its new name and machine.
    const importedTab = (pane: typeof a) =>
      pane.locator('[data-testid=chip8-filter][data-filter=imported]')
    await expect(importedTab(a)).toHaveText(/1/)
    await expect(importedTab(b)).toHaveText(/1/)
    const imported = a.locator('[role=listbox]:not([inert]) [data-testid=chip8-program]')
    await expect(imported).toHaveCount(1)
    await expect(imported).toContainText('Big Blue')
    await expect(imported).toContainText('SC')

    // It runs, in the other pane too; removed from here, that pane goes back to its library.
    const id = await imported.getAttribute('data-program')
    await importedTab(b).click()
    await b.locator(`[role=listbox]:not([inert]) [data-program="${id}"]`).click()
    await b.getByTestId('chip8-load').click()
    await expect(b.getByTestId('chip8-run')).toHaveAttribute('data-status', 'running')
    await expect
      .poll(() => litDots(page, b.getByTestId('chip8-run').getByTestId('chip8-screen')))
      .toBeGreaterThan(50)

    // The same file again is the same program.
    await pickerAnswers(app, file)
    await a.getByTestId('chip8-import').click()
    await expect(sheet).toContainText('already in the library')
    const remove = sheet.getByTestId('chip8-import-remove')
    await remove.click()
    await expect(remove).toHaveText('remove?')
    await remove.click()
    await expect(sheet).toHaveCount(0)
    await expect(importedTab(a)).toHaveCount(0)
    await expect(b.getByTestId('chip8-library')).toBeVisible()
    await expect(b.getByTestId('chip8-missing')).toContainText('Big Blue')
  } finally {
    await close()
    removeDir(outside)
  }
})

test('the line between the library list and the details is dragged, kept, and put back', async () => {
  let launched = await launch(undefined, { layout: BESIDE_CLOCK })
  const profile = launched.userData
  try {
    await designSize(launched.app, launched.page)
    const width = async (page: Page) =>
      (await page.locator('[role=listbox]:not([inert])').boundingBox())?.width ?? 0
    const page = launched.page
    await expect(page.getByTestId('chip8-split')).toBeVisible()
    // Measured once the list has powered on (it opens from a line).
    await expect.poll(() => width(page)).toBeGreaterThan(300)
    const before = await width(page)
    const box = await page.getByTestId('chip8-split').boundingBox()
    if (box === null) throw new Error('no splitter')
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x + 60, y)
    await page.mouse.move(x + 120, y)
    await page.mouse.up()
    const after = await width(page)
    expect(after).toBeGreaterThan(before + 100)

    launched = await launched.relaunch()
    await designSize(launched.app, launched.page)
    await expect.poll(async () => Math.abs((await width(launched.page)) - after)).toBeLessThan(4)
    // A double-click puts it back at half.
    await launched.page.getByTestId('chip8-split').dblclick()
    await expect.poll(async () => Math.abs((await width(launched.page)) - before)).toBeLessThan(4)
  } finally {
    await launched.close()
    removeDir(profile)
  }
})

test('MEM shows the memory round PC or I, the wheel frees it, and the bytes at I as a sprite', async () => {
  const { app, page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await designSize(app, page)
    await page.locator('[data-testid=chip8-filter][data-filter=diag]').click()
    await loadProgram(page, 'diag/2-ibm-logo')
    await page.keyboard.press('KeyP')
    await expect(page.getByTestId('chip8-run')).toHaveAttribute('data-status', 'paused')
    await tab(page, 'mem').click()
    const grid = page.getByTestId('chip8-mem-grid')
    await expect(grid).toBeVisible()
    // Following PC: the instruction about to run is in the window, marked.
    const pc = Number.parseInt(
      (await page.getByTestId('chip8').locator('.key.pc').textContent())?.slice(3) ?? '',
      16,
    )
    const start = Number(await grid.getAttribute('data-start'))
    expect(pc).toBeGreaterThanOrEqual(start)
    expect(pc).toBeLessThan(start + 128)
    await expect(grid.locator('.byte.pc')).toHaveCount(2)
    // The IBM logo draws from I: its sprite has lit dots.
    await expect(page.getByTestId('chip8-sprite').locator('i.on').first()).toBeVisible()
    await page.locator('[data-testid=chip8-mem-follow][data-follow=i]').click()
    await expect(grid.locator('.byte.at-i')).toHaveCount(1)

    // The wheel moves the window by rows and lets go of what it followed.
    const before = Number(await grid.getAttribute('data-start'))
    await grid.hover()
    await page.mouse.wheel(0, 200)
    await expect(page.locator('[data-testid=chip8-mem-follow][data-follow=free]')).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await expect.poll(async () => Number(await grid.getAttribute('data-start'))).toBe(before + 16)
  } finally {
    await close()
  }
})
