import type { ElectronApplication, Page } from '@playwright/test'

/**
 * CPU seconds used so far by every Electron process together (`all`), and by `page`'s own
 * renderer alone (`page`): what a test of a loop that runs in the page measures, as the whole
 * app's figure also carries the GPU process's wandering.
 */
export async function cpuSecondsWithPage(
  app: ElectronApplication,
  page: Page,
): Promise<{ all: number; page: number }> {
  const pagePid = await (await app.browserWindow(page)).evaluate((win) =>
    win.webContents.getOSProcessId(),
  )
  return app.evaluate(({ app: electronApp }, pid) => {
    let all = 0
    let own = 0
    for (const m of electronApp.getAppMetrics()) {
      const used = m.cpu.cumulativeCPUUsage ?? 0
      all += used
      if (m.pid === pid) own += used
    }
    return { all, page: own }
  }, pagePid)
}
