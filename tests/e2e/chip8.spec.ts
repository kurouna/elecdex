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

async function loadProgram(page: Page, id: string): Promise<void> {
  await page.locator(`[data-testid=chip8-program][data-program="${id}"]`).click()
  await page.getByTestId('chip8-load').click()
  await expect(page.getByTestId('chip8-run')).toHaveAttribute('data-status', 'running')
}

/** The lit dots on the screen's canvas (anything brighter than the ground). */
const litDots = (page: Page) =>
  page.getByTestId('chip8-screen').evaluate((canvas: HTMLCanvasElement) => {
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
const scale = async (page: Page) =>
  Number(await page.getByTestId('chip8-screen').getAttribute('data-scale'))

async function designSize(app: ElectronApplication, page: Page): Promise<void> {
  await atDesignSize(app, page)
  await settleLayout(page)
}

test('the library loads a program, which draws at a whole number of pixels a dot', async () => {
  const { app, page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await designSize(app, page)
    await expect(page.getByTestId('chip8-program')).toHaveCount(8)
    await expect(page.getByTestId('chip8-filter')).toHaveText([/all\s*8/, /diag\s*8/])
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
  // measured here so a change that makes it expensive shows. Locally, on the design
  // size beside the clock, see the numbers the log prints.
  test.setTimeout(120_000)
  const { app, page, close } = await launch(undefined, { layout: BESIDE_CLOCK })
  try {
    await designSize(app, page)
    await page.waitForTimeout(8000)
    const WINDOW_MS = 10_000
    const measure = async () => {
      const start = await cpuSeconds(app)
      await page.waitForTimeout(WINDOW_MS)
      return ((await cpuSeconds(app)) - start) / (WINDOW_MS / 1000)
    }
    const library = await measure()
    await loadProgram(page, 'diag/3-corax+')
    await page.waitForTimeout(2000)
    const running = await measure()
    await page.keyboard.press('KeyP')
    await page.waitForTimeout(1000)
    const paused = await measure()
    console.log(
      `chip8: library ${(library * 100).toFixed(1)}%, running ${(running * 100).toFixed(1)}%, paused ${(paused * 100).toFixed(1)}% of one core`,
    )
    expect(running - library).toBeLessThan(process.env.CI ? 1.5 : 0.25)
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
    const full = await litDots(page)
    await page.keyboard.press('KeyP')
    await page.getByTestId('chip8-reset').click()
    await expect(page.getByTestId('chip8-run')).toHaveAttribute('data-status', 'running')
    // Paused again at once: the new machine has drawn a few of its checks (the VIP draws a
    // sprite a frame), and the canvas shows its screen, not the old one's picture.
    await page.keyboard.press('KeyP')
    expect(await cycles(page)).toBeLessThan(20_000)
    expect(await litDots(page)).toBeLessThan(full)
  } finally {
    await close()
  }
})
