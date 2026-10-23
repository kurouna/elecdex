import type { ElectronApplication } from '@playwright/test'

/**
 * Makes main's `shell.openExternal` keep the addresses it is given instead of opening the
 * browser, for a test of what a press would open: nothing leaves the machine and no browser
 * window appears in front of whoever runs the suite.
 */
export async function stubOpenExternal(app: ElectronApplication): Promise<void> {
  await app.evaluate(({ shell }) => {
    const opened: string[] = []
    ;(globalThis as { __opened?: string[] }).__opened = opened
    shell.openExternal = async (url: string) => {
      opened.push(url)
    }
  })
}

/** What main has asked the browser to open since {@link stubOpenExternal}, in order. */
export const openedExternally = (app: ElectronApplication): Promise<string[]> =>
  app.evaluate(() => (globalThis as { __opened?: string[] }).__opened ?? [])
