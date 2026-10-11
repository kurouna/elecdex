import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { type Launched, launch, SINGLE_TERMINAL, terminalPane, typeInto } from './support.js'

/**
 * The terminal after its GPU context is lost.
 *
 * A video driver that crashes takes Chromium's GPU process with it, and every
 * WebGL context in the page is lost; the shell carries on regardless. A pane
 * once went on taking what was typed while showing neither the command's output
 * nor the next prompt after such a crash. What the shell wrote is in the bytes
 * either way (terminal.spec.ts reads them), so this reads the screen itself: a
 * picture of the pane, filled with solid blocks by one command and emptied by
 * another, after the context has gone in each of the ways it can go.
 */

let launched: Launched
let page: Page

test.afterEach(async () => {
  await launched?.close()
})

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

interface Ink {
  /** Share of the screen's pixels that stand clear of its ground. */
  share: number
  /** The same for the screen's bottom edge, where the prompt is after a fill. */
  bottomShare: number
  /** The right edge of the rightmost ink, in page pixels; null when there is none. */
  right: number | null
  /** The left edge of the leftmost ink in that bottom strip: where the prompt begins. */
  bottomLeft: number | null
  /** Where xterm says its screen is. */
  screen: Rect
}

/** Less than a row: the strip along the screen's bottom edge that a fill leaves to the prompt. */
const BOTTOM_BAND_PX = 8

/** A picture of part of the window: BGRA pixels, and the page area they cover. */
interface Picture {
  width: number
  height: number
  pixels: Buffer
  area: Rect
}

/** Takes a picture of `area` of the window, in page pixels. */
async function picture(area: Rect): Promise<Picture> {
  const rect = {
    x: Math.round(area.x),
    y: Math.round(area.y),
    width: Math.round(area.width),
    height: Math.round(area.height),
  }
  const taken = await launched.app.evaluate(async ({ BrowserWindow }, r) => {
    const window = BrowserWindow.getAllWindows().find((w) => w.isVisible())
    if (window === undefined) throw new Error('no window')
    const image = await window.webContents.capturePage(r)
    return { ...image.getSize(), pixels: image.toBitmap().toString('base64') }
  }, rect)
  return { ...taken, pixels: Buffer.from(taken.pixels, 'base64'), area: rect }
}

/** Every pixel of a picture, with where it lies on the page. */
function* pixelsOf(pic: Picture): Generator<{ i: number; px: number; py: number }> {
  const sx = pic.area.width / pic.width
  const sy = pic.area.height / pic.height
  for (let y = 0; y < pic.height; y++) {
    for (let x = 0; x < pic.width; x++) {
      yield { i: (y * pic.width + x) * 4, px: pic.area.x + x * sx, py: pic.area.y + y * sy }
    }
  }
}

const within = (r: Rect, px: number, py: number): boolean =>
  px >= r.x && px < r.x + r.width && py >= r.y && py < r.y + r.height

/** The commonest colour round the screen, in the host's padding, where nothing is drawn. */
function groundOf(pic: Picture, screen: Rect): number[] {
  const counts = new Map<number, number>()
  for (const { i, px, py } of pixelsOf(pic)) {
    if (within(screen, px, py)) continue
    // Blue, green, red: the bitmap is BGRA, and the ground is compared byte for byte.
    const key = pic.pixels.readUIntBE(i, 3)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const ground = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0
  return [(ground >> 16) & 255, (ground >> 8) & 255, ground & 255]
}

/** Whether a pixel stands clear of the ground: ink. */
function inked(pic: Picture, i: number, ground: number[]): boolean {
  let d = 0
  for (let c = 0; c < 3; c++) d += Math.abs((pic.pixels[i + c] ?? 0) - (ground[c] ?? 0))
  return d > 60
}

/** Reads the visible terminal's screen from a picture of the window. */
async function ink(): Promise<Ink> {
  const screen = await terminalPane(page).locator('.xterm-screen').boundingBox()
  // The pane's whole host: its padding round the screen gives the ground colour.
  const host = await terminalPane(page).getByTestId('terminal-host').boundingBox()
  if (screen === null || host === null) throw new Error('the terminal is not on screen')
  const pic = await picture(host)
  const ground = groundOf(pic, screen)
  const band = { ...screen, y: screen.y + screen.height - BOTTOM_BAND_PX, height: BOTTOM_BAND_PX }
  const sx = pic.area.width / pic.width
  let [inside, dark, bandInside, bandInked] = [0, 0, 0, 0]
  let right = -1
  let bottomLeft = Number.POSITIVE_INFINITY
  for (const { i, px, py } of pixelsOf(pic)) {
    if (!within(screen, px, py)) continue
    const inBand = within(band, px, py)
    inside += 1
    if (inBand) bandInside += 1
    if (!inked(pic, i, ground)) continue
    dark += 1
    right = Math.max(right, px + sx)
    if (!inBand) continue
    bandInked += 1
    bottomLeft = Math.min(bottomLeft, px)
  }
  return {
    share: inside === 0 ? 0 : dark / inside,
    bottomShare: bandInside === 0 ? 0 : bandInked / bandInside,
    right: right < 0 ? null : right,
    bottomLeft: Number.isFinite(bottomLeft) ? bottomLeft : null,
    screen,
  }
}

/**
 * A screenful of solid blocks less a column and the two rows a prompt needs, sized
 * by what the shell itself reports. The block is written as its UTF-8 bytes in
 * octal: macOS's bash 3.2 printf knows no \u and printed it as six characters.
 */
function fillCommand(platform: NodeJS.Platform): string {
  return platform === 'win32'
    ? '$s = $Host.UI.RawUI.WindowSize; 1..($s.Height - 2) | % { [string][char]0x2588 * ($s.Width - 1) }'
    : "for i in $(seq $(($(tput lines) - 2))); do printf '\\342\\226\\210%.0s' $(seq $(($(tput cols) - 1))); echo; done"
}

const clearCommand = (platform: NodeJS.Platform): string =>
  platform === 'win32' ? 'Clear-Host' : 'clear'

/**
 * Whether the blocks are drawn where xterm laid its cells out: most of the screen
 * inked, its last column left empty (the blocks stop one short) and its last row
 * holding the prompt, drawn from its first column. A picture drawn at the wrong
 * scale fails one of these (larger, the blocks run to the edges and hide the
 * prompt; smaller, they stop short), and so does one that has lost glyphs: the
 * prompt's text was once missing while the cursor after it was drawn.
 */
function filled(found: Ink): boolean {
  const { right, screen, share, bottomShare, bottomLeft } = found
  if (right === null || share < 0.6 || bottomShare > 0.3) return false
  // One cell is about 7 px at the 13 px font.
  if (bottomLeft === null || bottomLeft - screen.x > 10) return false
  const gap = screen.x + screen.width - right
  // The blocks stop one cell short of the edge, give or take.
  return gap >= 2 && gap <= 25
}

/** Fills the screen and empties it again: the picture must follow the shell both ways. */
async function screenFollows(label: string): Promise<void> {
  const pane = terminalPane(page)
  let last: Ink | null = null
  await typeInto(page, pane, fillCommand(launched.platform))
  await expect
    .poll(
      async () => {
        last = await ink()
        return filled(last)
      },
      { timeout: 15_000, message: `${label}: the blocks fill the screen` },
    )
    .toBe(true)
    .catch((error: unknown) => {
      throw new Error(`${String(error)}\nlast reading: ${JSON.stringify(last)}`)
    })
  await typeInto(page, pane, clearCommand(launched.platform))
  await expect
    .poll(async () => (await ink()).share, {
      timeout: 15_000,
      message: `${label}: the screen empties`,
    })
    .toBeLessThan(0.05)
}

async function start(): Promise<void> {
  launched = await launch(undefined, { layout: SINGLE_TERMINAL })
  page = launched.page
  await expect(terminalPane(page).locator('.xterm-screen canvas').first()).toBeVisible()
  // The first prompt before typing.
  await page.waitForTimeout(2500)
  // Before anything is lost: the measure itself holds.
  await screenFollows('before')
}

/** Loses the visible terminal's WebGL context, as a crashed driver does, and maybe gives it back. */
async function loseContext(restoreAfterMs: number | null): Promise<void> {
  const lost = await terminalPane(page)
    .locator('.xterm-screen')
    .evaluate((screen, after) => {
      for (const canvas of screen.querySelectorAll('canvas')) {
        const gl = canvas.getContext('webgl2')
        const ext = gl?.getExtension('WEBGL_lose_context')
        if (gl === null || gl === undefined || ext === null || ext === undefined) continue
        ext.loseContext()
        if (after !== null) setTimeout(() => ext.restoreContext(), after)
        return true
      }
      return false
    }, restoreAfterMs)
  expect(lost).toBe(true)
}

/** Ends Chromium's GPU process, as a crashing video driver does. */
async function crashGpu(): Promise<void> {
  const killed = await launched.app.evaluate(({ app }) => {
    const gpu = app.getAppMetrics().find((m) => m.type === 'GPU')
    if (gpu === undefined) return false
    process.kill(gpu.pid)
    return true
  })
  test.skip(!killed, 'no separate GPU process here')
}

/**
 * Long enough for the GPU process to come back and the pane to take a fresh WebGL
 * addon (WEBGL_RETRY_MS after the loss): the renderer, and so the cell size and
 * the columns, change once more on the way.
 */
const RECOVERY_MS = 5000

/** Whether the visible terminal is drawn by WebGL, rather than xterm's DOM renderer. */
function drawnByWebgl(): Promise<boolean> {
  return terminalPane(page)
    .locator('.xterm-screen')
    .evaluate((screen) =>
      [...screen.querySelectorAll('canvas')].some((canvas) => {
        const gl = canvas.getContext('webgl2')
        return gl !== null && !gl.isContextLost()
      }),
    )
}

test('the screen follows the shell after the WebGL context is lost and given back', async () => {
  await start()
  await loseContext(500)
  // Never waited for: the pane takes a fresh addon instead of the one given back.
  await page.waitForTimeout(RECOVERY_MS)
  expect(await drawnByWebgl()).toBe(true)
  await screenFollows('restored')
})

test('the screen follows the shell after the WebGL context is lost for good', async () => {
  await start()
  await loseContext(null)
  // The lost context is the old canvas's alone: a fresh addon has a new one.
  await page.waitForTimeout(RECOVERY_MS)
  expect(await drawnByWebgl()).toBe(true)
  await screenFollows('never restored')
})

test('the screen follows the shell after the GPU process crashes', async () => {
  await start()
  await crashGpu()
  await page.waitForTimeout(RECOVERY_MS)
  expect(await drawnByWebgl()).toBe(true)
  await screenFollows('GPU process crashed')
})

test('a terminal behind a tab while the GPU process crashes draws true once shown', async () => {
  await start()
  await terminalPane(page).locator('.xterm-helper-textarea').first().focus()
  await page.keyboard.press('Control+Shift+KeyT')
  const strip = page.getByTestId('tabs-host').getByTestId('tab')
  await expect.poll(() => strip.count(), { timeout: 20_000 }).toBe(2)
  await page.waitForTimeout(2500)
  await crashGpu()
  await page.waitForTimeout(RECOVERY_MS)
  await strip.first().click()
  // Shown, it takes WebGL back.
  await page.waitForTimeout(1000)
  expect(await drawnByWebgl()).toBe(true)
  await screenFollows('behind a tab, shown again')
  await strip.nth(1).click()
  await page.waitForTimeout(1000)
  expect(await drawnByWebgl()).toBe(true)
  await screenFollows('the tab that was in front')
})

test('a terminal in a minimised window while the GPU process crashes draws true once shown', async () => {
  await start()
  await launched.app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()
      .find((w) => w.isVisible())
      ?.minimize(),
  )
  await page.waitForTimeout(1000)
  await crashGpu()
  await page.waitForTimeout(RECOVERY_MS)
  await launched.app.evaluate(({ BrowserWindow }) => {
    const window = BrowserWindow.getAllWindows().find((w) => w.isMinimized())
    window?.restore()
    window?.focus()
  })
  await page.waitForTimeout(1000)
  expect(await drawnByWebgl()).toBe(true)
  await screenFollows('minimised')
})

test('the screen follows the shell once repeated GPU crashes have turned the GPU off', async () => {
  await start()
  // Chromium gives up on the GPU after a few crashes and composites in software,
  // with WebGL off: the terminal is left on xterm's DOM renderer.
  for (let i = 0; i < 4; i++) {
    await crashGpu()
    await page.waitForTimeout(3000)
  }
  await page.waitForTimeout(RECOVERY_MS)
  expect(await drawnByWebgl()).toBe(false)
  await screenFollows('GPU turned off')
})
