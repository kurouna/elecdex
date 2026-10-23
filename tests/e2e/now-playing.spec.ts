import { expect, test } from '@playwright/test'
import { stubOf } from './support/stub-hooks.js'
import { launch, quietFor, tabbed } from './support.js'

/**
 * The NOW PLAYING pane, on main's stand-in media session (support.ts sets
 * ELECDEX_NOWPLAYING_STUB=1): nothing this machine plays is read, and no player
 * of its is pressed. The track is changed through globalThis.__elecdexNowPlaying.
 */

const inTabs = (front: 'nowplaying' | 'clock') =>
  tabbed(['nowplaying', 'clock'], front === 'nowplaying' ? 0 : 1)

test('shows the track, counts on, and presses the player', async () => {
  const { app, page, close } = await launch(undefined, { layout: inTabs('nowplaying') })
  const player = stubOf(app, 'nowPlaying')
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
    expect(await player.presses()).toEqual(['playPause', 'next'])

    // The stand-in takes a new position: the bar has a head, and the keyboard moves it.
    const bar = page.getByTestId('np-bar')
    await expect(bar).toHaveAttribute('data-seekable', 'true')
    await bar.focus()
    await page.keyboard.press('End')
    await expect.poll(() => player.presses()).toContain('seek 200')
    await expect(page.getByTestId('np-time')).toHaveText('3:20 / 3:20')
    // A player that does not: a plain meter.
    await player.set({ seek: false })
    await expect(bar).toHaveAttribute('data-seekable', 'false')

    // Resting on the art opens the track's card, with the larger art main keeps.
    await player.set({ art: '/9j/4AAQSkZJRgABAQ' })
    await expect(page.getByTestId('np-art')).toHaveAttribute('data-art', 'image')
    await page.getByTestId('np-art').hover()
    await expect(page.getByTestId('np-card-title')).toHaveText('Second Track')
    await expect(page.getByTestId('np-card-art')).toHaveAttribute('data-large', 'true')
    await expect(page.getByTestId('np-card')).toContainText('640 × 640 px')
    await page.getByTestId('np-title').hover()
    await expect(page.getByTestId('np-card')).toHaveCount(0)

    // A change made in the player itself shows within a look or two.
    await player.set({ title: 'Changed Elsewhere' })
    await expect(page.getByTestId('np-title')).toHaveText('Changed Elsewhere')

    // A web pane of elecdex playing: Windows names the app's own id, shown as the app's name.
    await player.set({ app: 'DEV.KUROUNA.ELECDEX' })
    await expect(page.getByTestId('np-app')).toHaveText('elecdex')
    await player.set({ app: 'Spotify.exe' })
    await expect(page.getByTestId('np-app')).toHaveText('Spotify')

    // The player gone: the pane says so, and offers no button.
    await player.set(null)
    await expect(page.getByTestId('np-state')).toContainText('NO SESSION')
    await expect(page.getByTestId('np-empty')).toBeVisible()
    await expect(page.getByTestId('np-play')).toBeDisabled()
  } finally {
    await close()
  }
})

test('behind another tab nothing is read or pressed, and shown again it reads at once', async () => {
  const { app, page, close } = await launch(undefined, { layout: inTabs('clock') })
  const player = stubOf(app, 'nowPlaying')
  try {
    await expect(page.getByTestId('pane')).toHaveCount(2)
    const reads = () => player.reads()
    expect(await quietFor(2000, reads, 'the session reads')).toBe(0)
    expect(await page.evaluate(() => window.elecdex.nowPlaying.watching())).toEqual([])
    // A page that does not show the session cannot press its player.
    expect(await page.evaluate(() => window.elecdex.nowPlaying.control('next'))).toBe('unsupported')
    expect(await player.presses()).toEqual([])

    await page.locator('[data-testid=tab][data-pane-id=nowplaying]').click({ delay: 20 })
    await expect(page.getByTestId('np-title')).toHaveText('Test Track')
    expect(await page.evaluate(() => window.elecdex.nowPlaying.watching())).toEqual(['session'])

    // Put behind again, the reading stops (the reader is let go a little later).
    await page.locator('[data-testid=tab][data-pane-id=clock]').click({ delay: 20 })
    await expect.poll(() => page.evaluate(() => window.elecdex.nowPlaying.watching())).toEqual([])
    await quietFor(1500, reads, 'the session reads')
  } finally {
    await close()
  }
})
