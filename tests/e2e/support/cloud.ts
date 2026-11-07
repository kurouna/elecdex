import type { ElectronApplication } from '@playwright/test'

/**
 * The CLI panes' stand-ins (src/main/cloud-cli/stub-aws.ts, stub-github.ts; support.ts sets
 * ELECDEX_CLOUD_STUB=1): their mode changed while the app runs, and the URLs main would open
 * noted in place of the browser. The shared app puts `shell.openExternal` back after each test.
 */

/** Sets the stand-in's mode (demo, signedout, nocli, …), or back to the variable's with null. */
export const cloudMode = (app: ElectronApplication, tool: 'aws' | 'github', mode: string | null) =>
  app.evaluate(
    (_electron, { tool, mode }) => {
      const g = globalThis as { __elecdexCloud?: Record<string, string> }
      const next = { ...g.__elecdexCloud }
      if (mode === null) delete next[tool]
      else next[tool] = mode
      g.__elecdexCloud = next
    },
    { tool, mode },
  )

/** Notes every URL main would open, in place of the browser. */
export const captureOpens = (app: ElectronApplication) =>
  app.evaluate(({ shell }) => {
    const notes = globalThis as { __e2eOpened?: string[] }
    notes.__e2eOpened = []
    shell.openExternal = async (url: string) => {
      notes.__e2eOpened?.push(url)
    }
  })

export const opened = (app: ElectronApplication) =>
  app.evaluate(() => (globalThis as { __e2eOpened?: string[] }).__e2eOpened ?? [])
