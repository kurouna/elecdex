import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import { launch } from '../support.js'

/**
 * A profile written by the last release, opened by this build (docs/e2e-design.md, section 3.3):
 * the files a user has by now - settings with a theme, the live layout and a saved one, notes,
 * tasks (one done), an alarm, a snippet, a repository and a log the pane followed, both now gone
 * from the disk - are read, nothing is set aside or lost, and every pane of the layout draws
 * without a fault.
 *
 * tests/e2e/fixtures/profiles/v0.0.39 was written by v0.0.39's own code, driven through its API,
 * with the paths made neutral. A release that changes a schema adds the next version's profile
 * beside it, and this spec opens each.
 */

const PROFILES = path.resolve('tests/e2e/fixtures/profiles')

for (const version of readdirSync(PROFILES)) {
  test(`a profile from ${version} opens whole: nothing set aside, nothing lost, no pane faults`, async () => {
    const dir = path.join(PROFILES, version)
    const files = Object.fromEntries(
      readdirSync(dir).map((name) => [name, readFileSync(path.join(dir, name), 'utf8')]),
    )
    const { page, userData, close } = await launch(undefined, { files })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    try {
      // Every pane of the live layout draws, tab by tab.
      const tabs = page.getByTestId('tab')
      const count = await tabs.count()
      expect(count).toBeGreaterThan(4)
      for (let i = 0; i < count; i++) {
        await tabs.nth(i).click()
        await expect(page.getByTestId('pane-fault')).toHaveCount(0)
      }

      // What the user had, read back through main.
      const now = await page.evaluate(async () => ({
        theme: (await window.elecdex.settings.get()).theme,
        notes: (await window.elecdex.notes.list()).notes.map((n) => n.body),
        tasks: (await window.elecdex.tasks.list()).tasks.map((t) => [t.title, t.done]),
        alarms: (await window.elecdex.alarms.list()).alarms.map((a) => a.label),
        snippets: (await window.elecdex.snippets.list()).map((s) => s.name),
        saved: (await window.elecdex.layout.saved.list()).map((l) => l.name),
      }))
      expect(now).toEqual({
        theme: 'phosphor',
        notes: ['# shopping\n12 + 30\nmilk\n'],
        tasks: [
          ['renew the domain', false],
          ['water the plants', true],
        ],
        alarms: ['stand up'],
        snippets: ['signature'],
        saved: ['desk and code'],
      })
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'phosphor')

      // Nothing was set aside as unreadable, and every file is still there.
      const left = readdirSync(userData)
      expect(left.filter((name) => /\.(bak|corrupt|broken|invalid)/.test(name))).toEqual([])
      for (const name of Object.keys(files)) expect(left, name).toContain(name)
      expect(errors).toEqual([])
    } finally {
      await close()
    }
  })
}
