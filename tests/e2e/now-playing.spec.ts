import { type ElectronApplication, expect, test } from '@playwright/test'
import { launch } from './support.js'

/**
 * The NOW PLAYING pane, on main's stand-in media session (support.ts sets
 * ELECDEX_NOWPLAYING_STUB=1): nothing this machine plays is read, and no player
 * of its is pressed. The track is changed through globalThis.__elecdexNowPlaying.
 */

interface Hooks {
  set(track: Record<string, unknown> | null): void
  presses(): string[]
  reads(): number
  open(): boolean
}

const reads = (app: ElectronApplication) =>
  app.evaluate(() =>
    (globalThis as unknown as { __elecdexNowPlaying: Hooks }).__elecdexNowPlaying.reads(),
  )

const presses = (app: ElectronApplication) =>
  app.evaluate(() =>
    (globalThis as unknown as { __elecdexNowPlaying: Hooks }).__elecdexNowPlaying.presses(),
  )

const setTrack = (app: ElectronApplication, track: Record<string, unknown> | null) =>
  app.evaluate((_electron, value) => {
    ;(globalThis as unknown as { __elecdexNowPlaying: Hooks }).__elecdexNowPlaying.set(value)
  }, track)

const inTabs = (front: string) => ({
  version: 1,
  root: {
    kind: 'tabs',
    id: 't',
    activeIndex: front === 'nowplaying' ? 0 : 1,
    children: [
      { kind: 'pane', id: 'np', widget: 'nowplaying' },
      { kind: 'pane', id: 'c', widget: 'clock' },
    ],
  },
})

test('shows the track, counts on, and presses the player', async () => {
  const { app, page, close } = await launch(undefined, { layout: inTabs('nowplaying') })
  try {
    await expect(page.getByTestId('np-title')).toHaveText('Test Track')
    await expect(page.getByTestId('np-artist')).toHaveText('Test Artist')
    await expect(page.getByTestId('np-album')).toHaveText('Test Album')
    await expect(page.getByTestId('np-app')).toHaveText('Spotify')
    await expect(page.getByTestId('np-state')).toContainText('PLAYING')
    // The stand-in started ten seconds in: the pane counts on from there.
    const first = await page.getByTestId('np-time').innerText()
    await expect
      .poll(() => page.getByTestId('np-time').innerText(), { timeout: 5000 })
      .not.toBe(first)

    await page.getByTestId('np-play').click({ delay: 20 })
    await expect(page.getByTestId('np-state')).toContainText('PAUSED')
    await expect(page.getByTestId('np-play')).toHaveAttribute('aria-label', 'play')
    await page.getByTestId('np-next').click({ delay: 20 })
    await expect(page.getByTestId('np-title')).toHaveText('Second Track')
    expect(await presses(app)).toEqual(['playPause', 'next'])

    // A change made in the player itself shows within a look or two.
    await setTrack(app, { title: 'Changed Elsewhere' })
    await expect(page.getByTestId('np-title')).toHaveText('Changed Elsewhere')

    // A web pane of elecdex playing: Windows names the app's own id, shown as the app's name.
    await setTrack(app, { app: 'DEV.KUROUNA.ELECDEX' })
    await expect(page.getByTestId('np-app')).toHaveText('elecdex')
    await setTrack(app, { app: 'Spotify.exe' })
    await expect(page.getByTestId('np-app')).toHaveText('Spotify')

    // The player gone: the pane says so, and offers no button.
    await setTrack(app, null)
    await expect(page.getByTestId('np-state')).toContainText('NO SESSION')
    await expect(page.getByTestId('np-empty')).toBeVisible()
    await expect(page.getByTestId('np-play')).toBeDisabled()
  } finally {
    await close()
  }
})

test('behind another tab nothing is read or pressed, and shown again it reads at once', async () => {
  const { app, page, close } = await launch(undefined, { layout: inTabs('clock') })
  try {
    await expect(page.getByTestId('pane')).toHaveCount(2)
    await page.waitForTimeout(2000)
    expect(await reads(app)).toBe(0)
    expect(await page.evaluate(() => window.elecdex.nowPlaying.watching())).toBe(false)
    // A page that does not show the session cannot press its player.
    expect(await page.evaluate(() => window.elecdex.nowPlaying.control('next'))).toBe('unsupported')
    expect(await presses(app)).toEqual([])

    await page.locator('[data-testid=tab][data-pane-id=np]').click({ delay: 20 })
    await expect(page.getByTestId('np-title')).toHaveText('Test Track')
    expect(await page.evaluate(() => window.elecdex.nowPlaying.watching())).toBe(true)

    // Put behind again, the reading stops (the reader is let go a little later).
    await page.locator('[data-testid=tab][data-pane-id=c]').click({ delay: 20 })
    await expect.poll(() => page.evaluate(() => window.elecdex.nowPlaying.watching())).toBe(false)
    const stopped = await reads(app)
    await page.waitForTimeout(1500)
    expect(await reads(app)).toBe(stopped)
  } finally {
    await close()
  }
})
