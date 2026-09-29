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

    launched = await launched.relaunch()
    await expect(launched.page.getByTestId('chip8-run')).toHaveAttribute('data-status', 'paused')
    await expect(launched.page.getByTestId('chip8-run')).toContainText('Corax+')
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
