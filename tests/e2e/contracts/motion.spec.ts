import { expect, type Page, test } from '@playwright/test'
import { type Launched, LEAVING, launch } from '../support.js'
import { DIALOGS, type DialogRow, MOTION_LAYOUT } from './dialogs.js'

/**
 * The motion contract (docs/e2e-design.md, section 3.2; CLAUDE.md, "Open and close with the CRT
 * effect"): every dialog, popup, toast and notice over the workspace powers on (`crt-on`) as it
 * comes and powers off (`crtPower`, its beam playing, out of the way) as it goes; with motion
 * reduced it simply appears and simply goes. One app per motion setting brings up every row of
 * contracts/dialogs.ts in turn; a failure names every row that broke the contract at once. The
 * finer points of one dialog (a handover between two, a reopen while closing) stay in
 * tests/e2e/workspace/motion.spec.ts.
 */

/** What a row's element is doing a frame after it was sent away. */
interface Going {
  present: boolean
  leaving: boolean
  beamRunning: boolean
  /** Whether the backdrop it sits on, if it has one, lets clicks through while it goes. */
  backdropLeaving: boolean
}

/**
 * Sends `row` away and describes its element a frame later, in one task of the page: a power-off
 * lasts about 300 ms, too short to catch between separate Playwright calls.
 */
const sendAway = (page: Page, row: DialogRow): Promise<Going> =>
  page.evaluate(
    async ({ testid, close }) => {
      const selector = `[data-testid=${testid}]`
      if ('key' in close) {
        window.dispatchEvent(
          new KeyboardEvent('keydown', { bubbles: true, key: close.key, code: close.key }),
        )
      } else {
        document.querySelector<HTMLElement>(close.click)?.click()
      }
      await new Promise((resolve) => requestAnimationFrame(resolve))
      const el = document.querySelector<HTMLElement>(selector)
      const beamRunning = document.getAnimations().some((a) => {
        const effect = a.effect as KeyframeEffect | null
        return (
          el !== null &&
          effect?.target === el &&
          effect.pseudoElement === '::after' &&
          (a as CSSAnimation).animationName === 'crt-beam-off' &&
          a.playState === 'running'
        )
      })
      const backdrop = el?.closest<HTMLElement>('.backdrop') ?? null
      return {
        present: el !== null,
        leaving: el?.inert ?? false,
        beamRunning,
        backdropLeaving: backdrop === null || backdrop.inert,
      }
    },
    { testid: row.testid, close: row.close },
  )

/** The CRT animations playing on the element itself now, by name. */
const crtPlaying = (page: Page, testid: string): Promise<string[]> =>
  page
    .getByTestId(testid)
    .first()
    .evaluate((el) =>
      el
        .getAnimations()
        .filter((a) => {
          const effect = a.effect as KeyframeEffect | null
          return effect?.pseudoElement == null && a.playState === 'running'
        })
        .map((a) => (a as CSSAnimation).animationName)
        .filter((name) => name.startsWith('crt-')),
    )

/** Its computed `animation-name`, which names the power-on whether or not it is still playing. */
const animationName = (page: Page, testid: string): Promise<string> =>
  page
    .getByTestId(testid)
    .first()
    .evaluate((el) => getComputedStyle(el).animationName)

/** Brings up every row in `ctx` and checks it with `check`, naming every row that failed. */
async function everyDialog(
  ctx: Launched,
  check: (row: DialogRow) => Promise<void>,
): Promise<Record<string, string>> {
  const failed: Record<string, string> = {}
  for (const row of DIALOGS) {
    const shown = ctx.page.getByTestId(row.testid)
    try {
      await row.open({ app: ctx.app, page: ctx.page })
      await expect(shown.first()).toBeVisible({ timeout: row.within ?? 5_000 })
      await check(row)
      await expect(shown).toHaveCount(0)
    } catch (error) {
      failed[row.testid] = String((error as Error).message).split('\n')[0] ?? ''
      // Whatever is left goes, so the next row starts from a clear screen.
      await ctx.page.keyboard.press('Escape')
    }
  }
  return failed
}

async function launchWith(motion: 'full' | 'reduced'): Promise<Launched> {
  return launch(undefined, { layout: MOTION_LAYOUT, settings: { motion } })
}

test('every dialog, popup, toast and notice powers on as it comes and off as it goes', async () => {
  test.setTimeout(180_000)
  const ctx = await launchWith('full')
  const errors: string[] = []
  ctx.page.on('pageerror', (error) => errors.push(error.message))
  try {
    const failed = await everyDialog(ctx, async (row) => {
      expect(await animationName(ctx.page, row.testid), 'powers on').toMatch(/crt-power-on/)
      expect(await sendAway(ctx.page, row), 'powers off').toEqual({
        ...LEAVING,
        backdropLeaving: true,
      })
    })
    expect(failed).toEqual({})
    expect(errors).toEqual([])
  } finally {
    await ctx.close()
  }
})

test('with motion reduced, every dialog, popup, toast and notice just appears and just goes', async () => {
  test.setTimeout(180_000)
  const ctx = await launchWith('reduced')
  const errors: string[] = []
  ctx.page.on('pageerror', (error) => errors.push(error.message))
  try {
    const failed = await everyDialog(ctx, async (row) => {
      expect(await crtPlaying(ctx.page, row.testid), 'nothing plays as it comes').toEqual([])
      expect((await sendAway(ctx.page, row)).present, 'gone a frame after').toBe(false)
    })
    expect(failed).toEqual({})
    expect(errors).toEqual([])
  } finally {
    await ctx.close()
  }
})
