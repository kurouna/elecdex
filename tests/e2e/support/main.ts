import type { Page } from '@playwright/test'

/** The main modules that answer `watching()`: what each is reading or fetching for a page. */
export const WATCHING_MODULES = [
  'weather',
  'markets',
  'feeds',
  'orbits',
  'git',
  'agents',
  'clipboard',
  'nowPlaying',
  'docker',
  'logwatch',
] as const
export type WatchingModule = (typeof WATCHING_MODULES)[number]

/** What one main module is watching now, sorted (empty when idle). */
export const watching = (page: Page, module: WatchingModule): Promise<string[]> =>
  page.evaluate((name) => window.elecdex[name].watching(), module)

/** The metric sources the collector is polling now. */
export const metricsActive = async (page: Page): Promise<string[]> =>
  (await page.evaluate(() => window.elecdex.metrics.stats())).active ?? []

/**
 * Everything main is doing for the pages at once: the metric sources and every module's
 * `watching()`. Compared whole, a test that expects one thing to stop also sees anything else
 * that did not.
 */
export async function watchingAll(
  page: Page,
): Promise<{ metrics: string[] } & Record<WatchingModule, string[]>> {
  const metrics = await metricsActive(page)
  const entries = await Promise.all(
    WATCHING_MODULES.map(async (module) => [module, await watching(page, module)] as const),
  )
  return { metrics, ...Object.fromEntries(entries) } as { metrics: string[] } & Record<
    WatchingModule,
    string[]
  >
}
