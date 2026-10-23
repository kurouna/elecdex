import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Waits until the `index`th shell header (a pane's or a tab group's subtitle) shows a folder:
 * the shell has reported where it is, so its prompt is up and takes typing.
 */
export async function shellReady(page: Page, index = 0): Promise<void> {
  await expect
    .poll(
      () =>
        page
          .locator('[data-testid=pane-subtitle], [data-testid=group-subtitle]')
          .nth(index)
          .innerText()
          .catch(() => ''),
      { timeout: 40_000, intervals: [300] },
    )
    .toMatch(/[\\/~]/)
}

/**
 * Everything a session's screen shows, as a reattaching pane receives it: attached for `ms`,
 * then let go. The screen comes as one replay with no mark at its end, hence the window.
 */
export function readScreen(page: Page, sessionId: string, ms = 800): Promise<string> {
  return page.evaluate(
    async ({ id, wait }) => {
      const decoder = new TextDecoder()
      let text = ''
      const detach = await window.elecdex.pty.attach(id, {
        onData: (chunk) => {
          text += decoder.decode(chunk, { stream: true })
        },
        onExit: () => {},
        onCwd: () => {},
        onCommandEnd: () => {},
        onIntegrationUnavailable: () => {},
      })
      // wait: the replay of a screen has no end mark; this window is what is read of it.
      await new Promise((resolve) => setTimeout(resolve, wait))
      detach()
      return text
    },
    { id: sessionId, wait: ms },
  )
}

/** What a shell wrote, as lines of text: escape sequences dropped, trailing blanks trimmed. */
export function screenLines(text: string): string[] {
  const ESC = String.fromCharCode(27)
  return text
    .replaceAll(new RegExp(`${ESC}\\[[0-9;?]*[A-Za-z]`, 'g'), '')
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
}
