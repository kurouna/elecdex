import type { Page } from '@playwright/test'

/**
 * Terminal panes that are on screen. Background tabs stay mounted (their shells
 * keep running) but are not displayed, so they are left out.
 */
export const terminalPane = (page: Page) =>
  page.locator('[data-testid=pane][data-widget=terminal]:not(.hidden)')

/** Types a command into a terminal pane and presses Enter. */
export async function typeInto(page: Page, pane: ReturnType<Page['locator']>, text: string) {
  await pane.locator('.xterm-helper-textarea').first().focus()
  await page.keyboard.type(text)
  await page.keyboard.press('Enter')
}

/**
 * Runs a command on a throwaway session and returns everything the shell wrote, once it
 * matches `expected`.
 *
 * Deliberately uses its own session rather than the visible pane so the test is not racing the
 * UI, and so a failure points at the data path rather than at rendering.
 *
 * No pane claims such a session, so the workspace's reaper - which runs once, a few seconds after
 * the panes last changed - ends it if it is alive just then. That was always the third capture
 * after a launch, which then waited out its whole timeout on a shell that was gone. A session
 * that ends before it has answered is the reaper's doing, and the capture starts over on a new
 * one.
 */
export async function runCapture(page: Page, command: string, expected: RegExp): Promise<string> {
  return page.evaluate(
    async ({ cmd, pattern }) => {
      const re = new RegExp(pattern)

      /** One session's output once it matches, or null when the session was ended first. */
      const attempt = async (): Promise<string | null> => {
        const session = await window.elecdex.pty.create({ cols: 120, rows: 40 })
        const decoder = new TextDecoder()
        let output = ''

        const result = await new Promise<string | null>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error(`timeout; saw: ${output}`)), 25_000)
          const settle = (value: string | null): void => {
            clearTimeout(timer)
            resolve(value)
          }

          void window.elecdex.pty
            .attach(session.id, {
              onData: (chunk) => {
                output += decoder.decode(chunk, { stream: true })
                if (re.test(output)) settle(output)
              },
              onExit: () => settle(null),
              onCwd: () => {},
              onCommandEnd: () => {},
              onIntegrationUnavailable: () => {},
            })
            .then(() => {
              // wait: no prompt event to wait on; the shell gets a moment to print its first one.
              setTimeout(() => window.elecdex.pty.write(session.id, `${cmd}\r`), 1200)
            })
            // Reaped between create and attach: there is no session to attach to.
            .catch(() => settle(null))
        })

        await window.elecdex.pty.dispose(session.id)
        return result
      }

      for (let tries = 0; tries < 3; tries++) {
        const result = await attempt()
        if (result !== null) return result
      }
      throw new Error('the session was ended before it answered, three times over')
    },
    { cmd: command, pattern: expected.source },
  )
}

/** The ids of the shell sessions main is running now. */
export const sessionIds = (page: Page): Promise<string[]> =>
  page.evaluate(async () => (await window.elecdex.pty.list()).map((session) => session.id))

/**
 * Starts listening to shell sessions (every one main runs, or `ids`) and answers a function that
 * resolves, once `until` appears in what they wrote or `ms` has passed, with all of it. Start it
 * before the action whose output is awaited, then await the answer.
 */
export async function listenToSessions(
  page: Page,
  options: { until?: string; ms?: number; ids?: string[] } = {},
): Promise<() => Promise<string>> {
  const handle = page.evaluateHandle(
    async ({ until, ms, ids }) => {
      const decoder = new TextDecoder()
      let text = ''
      const sessions = ids ?? (await window.elecdex.pty.list()).map((session) => session.id)
      let done: () => void = () => {}
      const finished = new Promise<void>((resolve) => {
        done = resolve
      })
      const detachers = await Promise.all(
        sessions.map((id) =>
          window.elecdex.pty.attach(id, {
            onData: (chunk) => {
              text += decoder.decode(chunk, { stream: true })
              if (until !== undefined && text.includes(until)) done()
            },
            onExit: () => {},
            onCwd: () => {},
            onCommandEnd: () => {},
            onIntegrationUnavailable: () => {},
          }),
        ),
      )
      // wait: the listening window is the caller's bound on how long output may take.
      const timer = setTimeout(done, ms)
      // Wrapped, not returned: evaluateHandle waits for a promise it is given, and the listening
      // would be over before the caller's action.
      return {
        text: finished.then(() => {
          clearTimeout(timer)
          for (const detach of detachers) detach()
          return text
        }),
      }
    },
    { until: options.until, ms: options.ms ?? 10_000, ids: options.ids },
  )
  const listening = await handle
  return () => listening.evaluate((held) => held.text)
}
