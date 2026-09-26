import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { type ElectronApplication, expect, type Page, test } from '@playwright/test'
import { launch, removeDir, savedLayout, settleLayout, showStatusBar } from './support.js'

/**
 * The UTILITY pane (docs/architecture.md section 5.16), on main's stand-ins:
 * support.ts sets ELECDEX_AWAKE_STUB=1, so no run keeps this machine awake,
 * ELECDEX_CLIPBOARD_STUB=1, so copies land in main's memory, and
 * ELECDEX_AI_KEYS_STUB=1, so sealing opens no Keychain or keyring.
 */

interface AwakeHooks {
  held(): string[]
  asked(): string[]
  battery(on: boolean): void
}

interface ClipboardHooks {
  current(): { text: string } | null
  image(): Uint8Array | null
}

const held = (app: ElectronApplication) =>
  app.evaluate(() =>
    (globalThis as unknown as { __elecdexAwake: AwakeHooks }).__elecdexAwake.held(),
  )

const asked = (app: ElectronApplication) =>
  app.evaluate(() =>
    (globalThis as unknown as { __elecdexAwake: AwakeHooks }).__elecdexAwake.asked(),
  )

const clipboardImage = (app: ElectronApplication) =>
  app.evaluate(() => {
    const png = (
      globalThis as unknown as { __elecdexClipboard: ClipboardHooks }
    ).__elecdexClipboard.image()
    return png === null ? null : [...png.subarray(0, 8)]
  })

const clipboardText = (app: ElectronApplication) =>
  app.evaluate(
    () =>
      (globalThis as unknown as { __elecdexClipboard: ClipboardHooks }).__elecdexClipboard.current()
        ?.text ?? null,
  )

/** The utility pane beside a clock, so it can be closed and leave the layout standing. */
const beside = {
  version: 1,
  root: {
    kind: 'split',
    id: 's',
    direction: 'row',
    sizes: [60, 40],
    children: [
      { kind: 'pane', id: 'u', widget: 'utility' },
      { kind: 'pane', id: 'c', widget: 'clock' },
    ],
  },
}

const pane = (page: Page) => page.locator('[data-testid=pane][data-widget=utility]')

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

test('AWAKE holds, goes on with the pane closed, and is taken up again after a restart', async () => {
  const first = await launch(undefined, { layout: beside })
  const dir = first.userData
  let running = first
  try {
    const { app, page } = first
    await expect(page.getByTestId('awake-state')).toHaveText('RELEASED')
    expect(await held(app)).toEqual([])

    await page.locator('[data-testid=awake-level][data-level=system]').click({ delay: 20 })
    await expect(page.getByTestId('awake-state')).toHaveText('HOLD · SYSTEM')
    await expect(page.getByTestId('awake-face')).toHaveText('∞')
    expect(await held(app)).toEqual(['prevent-app-suspension'])

    // A length while holding starts it again from now; +30M adds to it.
    await page.locator('[data-testid=awake-for][data-for="1800000"]').click({ delay: 20 })
    await expect(page.getByTestId('awake-face')).toHaveText(/^00:(29:[0-5]\d|30:00)$/)
    await page.getByTestId('awake-extend').click({ delay: 20 })
    await expect(page.getByTestId('awake-face')).toHaveText(/^(00:59:[0-5]\d|01:00:00)$/)

    // DISPLAY takes its request before letting go of SYSTEM's.
    await page.locator('[data-testid=awake-level][data-level=display]').click({ delay: 20 })
    await expect(page.getByTestId('awake-state')).toHaveText('HOLD · DISPLAY')
    expect(await held(app)).toEqual(['prevent-display-sleep'])
    expect(await asked(app)).toEqual(['prevent-app-suspension', 'prevent-display-sleep'])

    // The other tools still say it holds.
    await page.locator('[data-testid=utility-mode][data-module=codec]').click({ delay: 20 })
    await expect(page.getByTestId('utility-hold-aside')).toContainText('display · until')
    await page.getByTestId('utility-hold-aside').click({ delay: 20 })
    await expect(page.getByTestId('awake')).toBeVisible()

    // Closed, the pane takes nothing with it: the status bar says so and opens it again.
    await pane(page).getByTestId('pane-close').click({ delay: 20 })
    await expect(pane(page)).toHaveCount(0)
    await settleLayout(page)
    expect(await held(app)).toEqual(['prevent-display-sleep'])
    await expect(page.locator('.status-handle.holding')).toHaveCount(1)
    await showStatusBar(page)
    await expect(page.getByTestId('status-awake')).toContainText('awake · display · until')
    await page.getByTestId('status-awake').click({ delay: 20 })
    await expect(page.getByTestId('popup-pane').getByTestId('awake-state')).toHaveText(
      'HOLD · DISPLAY',
    )
    await page.getByTestId('popup-close').click({ delay: 20 })

    // Quit and start again: the hold is taken up before anything else.
    await first.quit()
    running = await launch(dir)
    expect(await held(running.app)).toEqual(['prevent-display-sleep'])
    await showStatusBar(running.page)
    await expect(running.page.getByTestId('status-awake')).toContainText('awake · display')

    // OFF lets go, and the file says so.
    await running.page.getByTestId('status-awake').click({ delay: 20 })
    await running.page.locator('[data-testid=awake-level][data-level=off]').click({ delay: 20 })
    await expect(running.page.getByTestId('awake-state')).toHaveText('RELEASED')
    expect(await held(running.app)).toEqual([])
    expect(JSON.parse(readFileSync(path.join(dir, 'awake.json'), 'utf8'))).toMatchObject({
      level: 'off',
      until: null,
    })
  } finally {
    await running.quit()
    removeDir(dir)
  }
})

test('a hold that ended while elecdex was not running is off at the start', async () => {
  const first = await launch(undefined, { layout: beside })
  const dir = first.userData
  let running = first
  try {
    await first.quit()
    const now = Date.now()
    writeFileSync(
      path.join(dir, 'awake.json'),
      JSON.stringify({ version: 1, level: 'system', until: now - 60_000, since: now - 3_660_000 }),
    )
    running = await launch(dir)
    await expect(running.page.getByTestId('awake-state')).toHaveText('RELEASED')
    expect(await held(running.app)).toEqual([])
    expect(JSON.parse(readFileSync(path.join(dir, 'awake.json'), 'utf8'))).toMatchObject({
      level: 'off',
    })
  } finally {
    await running.quit()
    removeDir(dir)
  }
})

test('QR draws a code, copies it as a PNG, and keeps a Wi-Fi password only sealed', async () => {
  const first = await launch(undefined, { layout: beside })
  const dir = first.userData
  let running = first
  try {
    const { app, page } = first
    await page.locator('[data-testid=utility-mode][data-module=qr]').click({ delay: 20 })
    await page.getByTestId('qr-text').fill('elecdex 日本')
    await expect(page.getByTestId('qr-canvas')).toHaveAttribute('data-modules', '21')
    await expect(page.getByTestId('qr-figures')).toContainText('v1 · M · 21×21 · 14/2331 B')
    await page.getByTestId('qr-copy').click({ delay: 20 })
    await expect(page.getByTestId('qr-copy')).toHaveText('COPIED')
    expect(await clipboardImage(app)).toEqual(PNG)

    await page.locator('[data-testid=qr-kind][data-kind=wifi]').click({ delay: 20 })
    await page.getByTestId('qr-ssid').fill('lab')
    await page.getByTestId('qr-password').fill('correct horse')
    // A code with the password in it waits to be revealed.
    await expect(page.getByTestId('qr-reveal')).toBeVisible()
    await expect(page.getByTestId('qr-seal')).toHaveText('saved, sealed by the system')
    await expect
      .poll(() => savedLayout(dir) ?? '', { timeout: 10_000 })
      .toMatch(/"wifiSealed":\s*"v1:/)
    expect(savedLayout(dir)).not.toContain('correct horse')
    await page.getByTestId('qr-reveal').click({ delay: 20 })
    await expect(page.getByTestId('qr-reveal')).toHaveCount(0)

    // After a restart the sealed password is opened again, and the code veiled again.
    await first.quit()
    running = await launch(dir)
    await expect(running.page.getByTestId('qr-seal')).toHaveText('saved, sealed by the system')
    await expect(running.page.getByTestId('qr-password')).toHaveValue('')
    await expect(running.page.getByTestId('qr-reveal')).toBeVisible()
  } finally {
    await running.quit()
    removeDir(dir)
  }
})

test('CODEC works as the input changes, copies through main, and writes no input to disk', async () => {
  const { app, page, userData, close } = await launch(undefined, { layout: beside })
  try {
    await page.locator('[data-testid=utility-mode][data-module=codec]').click({ delay: 20 })
    await page.locator('[data-testid=codec-op][data-op=sha256]').click({ delay: 20 })
    await page.getByTestId('codec-input').fill('abc')
    await expect(page.getByTestId('codec-output')).toHaveText(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
    await page.getByTestId('codec-copy').click({ delay: 20 })
    await expect(page.getByTestId('codec-copy')).toHaveText('COPIED')
    expect(await clipboardText(app)).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )

    await page.locator('[data-testid=codec-op][data-op=unb64]').click({ delay: 20 })
    await page.getByTestId('codec-input').fill('not base64!')
    await expect(page.getByTestId('codec-error')).toHaveText('not Base64')

    await page.locator('[data-testid=codec-op][data-op=b64]').click({ delay: 20 })
    await page.getByTestId('codec-input').fill('hunter2-never-on-disk')
    await expect(page.getByTestId('codec-output')).toHaveText('aHVudGVyMi1uZXZlci1vbi1kaXNr')
    // The operation is saved with the pane; the input is not.
    await page.locator('[data-testid=codec-op][data-op=hex]').click({ delay: 20 })
    await expect.poll(() => savedLayout(userData) ?? '').toMatch(/"codecOp":\s*"hex"/)
    expect(savedLayout(userData)).not.toContain('hunter2')
  } finally {
    await close()
  }
})
