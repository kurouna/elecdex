import type { ElectronApplication, Page } from '@playwright/test'
import { cpuSeconds } from './launch.js'
import { powerNote } from './os.js'

/** What the collector is doing: the sources it polls, and how often it has read each so far. */
export const metricsStats = (page: Page) => page.evaluate(() => window.elecdex.metrics.stats())

/** The memory every process of the app holds together, and the GPU process's share of it, in MB. */
export const appMemory = (app: ElectronApplication) =>
  app.evaluate(({ app: electronApp }) => {
    const metrics = electronApp.getAppMetrics()
    return {
      workingSetMb: metrics.reduce((sum, m) => sum + m.memory.workingSetSize, 0) / 1024,
      gpuMb: (metrics.find((m) => m.type === 'GPU')?.memory.workingSetSize ?? 0) / 1024,
    }
  })

/** An idle measurement: the CPU the app used over the window, and where its power came from. */
export interface IdleCpu {
  /** CPU time over the window, as a percentage of one core. */
  percentOfOneCore: number
  /** {@link powerNote}'s words, to print beside the figure and its failure. */
  power: string
}

/**
 * Measures the app at rest: after `warmupMs` (start-up collections, fonts, first paints, a window
 * just put away settling), the CPU every process used over `windowMs`. A measurement is a span of
 * time, which no signal can stand in for.
 */
export async function idleCpu(
  app: ElectronApplication,
  page: Page,
  { warmupMs = 0, windowMs }: { warmupMs?: number; windowMs: number },
): Promise<IdleCpu> {
  if (warmupMs > 0) {
    // wait: a warm-up before a CPU measurement; what it lets settle has no signal of its own.
    await page.waitForTimeout(warmupMs)
  }
  const start = await cpuSeconds(app)
  // wait: the measurement window itself.
  await page.waitForTimeout(windowMs)
  const end = await cpuSeconds(app)
  const power = await powerNote(app, page)
  return { percentOfOneCore: ((end - start) / (windowMs / 1000)) * 100, power }
}

/**
 * Every change the page makes inside the elements `selectors` find over `ms`, counted by a
 * MutationObserver: the selectors where anything changed, with their counts (empty when nothing
 * did). An element that is not there is not watched.
 */
export function mutationsIn(
  page: Page,
  selectors: string[],
  ms: number,
): Promise<Record<string, number>> {
  return page.evaluate(
    async ({ selectors, ms }) => {
      const counts: Record<string, number> = {}
      const observers = selectors.map((selector) => {
        const observer = new MutationObserver((records) => {
          counts[selector] = (counts[selector] ?? 0) + records.length
        })
        const el = document.querySelector(selector)
        if (el !== null)
          observer.observe(el, {
            subtree: true,
            childList: true,
            attributes: true,
            characterData: true,
          })
        return observer
      })
      // wait: the window being watched is the measurement: nothing may change in it.
      await new Promise((resolve) => setTimeout(resolve, ms))
      for (const observer of observers) observer.disconnect()
      return counts
    },
    { selectors, ms },
  )
}

/** Whether the app's first window is fullscreen. */
export const isFullScreen = (app: ElectronApplication) =>
  app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.isFullScreen() ?? false)

/**
 * Gives the app's first window a content size of `width` x `height`, as it is asked - unlike
 * {@link atDesignSize}, nothing zooms when the screen is smaller.
 */
export const sizeWindow = (app: ElectronApplication, width: number, height: number) =>
  app.evaluate(
    ({ BrowserWindow }, [w, h]) => {
      BrowserWindow.getAllWindows()[0]?.setContentSize(w as number, h as number)
    },
    [width, height],
  )
