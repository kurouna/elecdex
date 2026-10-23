import { readFileSync } from 'node:fs'
import path from 'node:path'
import { expect } from '@playwright/test'
import { SONGS } from '../../../examples/plugins/keystream/songs/index'
import { keystreamProfile } from '../support/plugins.js'
import { test } from '../support/shared.js'
import { launch, quietFor, removeDir, single } from '../support.js'

/**
 * KEYSTREAM, the sample plugin for canvas blocks, keys and sound
 * (examples/plugins/keystream), running as a user would install it: the folder copied into
 * the plugins folder, agreed to. Its volume is 0, so nothing is heard; the pane counts the
 * notes the host's synthesiser took (data-notes).
 */

const LAYOUT = single('plugin:keystream', { id: 'p1' })

test('the sample draws on its canvas, takes the keys only while focused, and plays a track', async ({
  shared,
}) => {
  const app = await shared({ layout: LAYOUT, ...keystreamProfile() })
  const { page } = app
  const pane = page.locator('[data-testid=plugin-pane][data-plugin=keystream]')
  const notes = async () => Number(await pane.getAttribute('data-notes'))
  try {
    await expect(pane).toHaveAttribute('data-status', 'ready')
    const canvas = pane.getByTestId('plugin-canvas')
    await expect(canvas).toBeVisible()
    await expect(pane.getByTestId('plugin-error')).toHaveCount(0)
    await expect(pane.getByTestId('plugin-problem')).toHaveCount(0)

    // No keys until the pane is clicked, and the lamp says when it has them.
    await expect(pane.getByTestId('plugin-keys')).toHaveCount(0)
    await canvas.click()
    await expect(pane.getByTestId('plugin-keys')).toBeVisible()

    // A key's note is played by the host itself, the moment the key goes down.
    const before = await notes()
    await page.keyboard.press('a')
    await expect.poll(notes).toBeGreaterThan(before)

    // Enter chooses the first track and Enter again its level: the boot log's ticks, then the
    // band a few seconds ahead at a time - more goes to the host while the track plays,
    // never the song at once.
    const idle = await notes()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Enter')
    await expect.poll(notes, { timeout: 8000 }).toBeGreaterThan(idle + 20)
    const first = await notes()
    await expect.poll(notes, { timeout: 10_000 }).toBeGreaterThan(first + 20)

    // Pausing and quitting to the menu raise nothing.
    await page.keyboard.press('Escape')
    await page.keyboard.press('q')
    await expect(pane.getByTestId('plugin-error')).toHaveCount(0)

    // The keyboard leaves while a track loads: it waits, paused before its count, playing
    // nothing but the boot log's ticks - and goes on from the count once the pane is back.
    const loading = await notes()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Enter')
    // Past the chosen level's blink, so the track is loading when the keyboard goes.
    // wait: the blink is drawn on the plugin's canvas; nothing outside the worker marks its end.
    await page.waitForTimeout(700)
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await expect(pane.getByTestId('plugin-keys')).toHaveCount(0)
    // wait: the boot log's ticks may still sound while it waits, so the count is not quiet;
    // what is checked is that no more than those few were played over this window.
    await page.waitForTimeout(2500)
    expect(await notes()).toBeLessThanOrEqual(loading + 4)
    await canvas.click()
    await expect(pane.getByTestId('plugin-keys')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect.poll(notes, { timeout: 8000 }).toBeGreaterThan(loading + 20)
    await page.keyboard.press('Escape')
    await page.keyboard.press('q')

    // The keyboard leaves the pane: the lamp goes out, and a key plays nothing.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await expect(pane.getByTestId('plugin-keys')).toHaveCount(0)
    const away = await notes()
    await page.keyboard.press('a')
    await quietFor(300, notes, 'the notes played')
    expect(await notes()).toBe(away)
  } finally {
    await app.close()
  }
})

test('FREE mode holds the keys, and plays a track’s band underneath until told to stop', async ({
  shared,
}) => {
  // Motion reduced, so FREE PLAY opens at once rather than after its row's blink: the keys
  // below must reach FREE mode, not the menu (the blink takes no keys).
  const app = await shared({
    layout: LAYOUT,
    ...keystreamProfile({ motion: 'reduced' }),
  })
  const { page } = app
  const pane = page.locator('[data-testid=plugin-pane][data-plugin=keystream]')
  const notes = async () => Number(await pane.getAttribute('data-notes'))
  try {
    await expect(pane).toHaveAttribute('data-status', 'ready')
    await pane.getByTestId('plugin-canvas').click()
    await expect(pane.getByTestId('plugin-keys')).toBeVisible()
    // FREE PLAY comes after the tracks: up from the first goes round to it.
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('Enter')

    // A key held sounds once, however long it is held; a chord is three.
    const before = await notes()
    await page.keyboard.down('a')
    await page.keyboard.down('d')
    await page.keyboard.down('g')
    await expect.poll(notes).toBe(before + 3)
    await quietFor(400, notes, 'the notes played')
    expect(await notes()).toBe(before + 3)
    for (const key of ['a', 'd', 'g']) await page.keyboard.up(key)

    // A band underneath, a few seconds at a time: the arrows choose it, Enter starts and stops it.
    const quiet = await notes()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await quietFor(300, notes, 'the notes played')
    expect(await notes()).toBe(quiet)
    await page.keyboard.press('Enter')
    await expect.poll(notes, { timeout: 8000 }).toBeGreaterThan(quiet + 10)
    await page.keyboard.press('Enter')
    // wait: no signal in the app (needs a hook): notes the band had already handed to the host
    // may still be counted; nothing says when the stop has reached the synthesiser.
    await page.waitForTimeout(500)
    const stopped = await quietFor(4000, notes, 'the notes played')

    // Comma steps back round the list; a digit is an instrument and starts no band.
    await page.keyboard.press('3')
    await page.keyboard.press(',')
    await page.keyboard.press(',')
    await page.keyboard.press(',')
    await quietFor(500, notes, 'the notes played')
    expect(await notes()).toBe(stopped)
    await page.keyboard.press('Enter')
    await expect.poll(notes, { timeout: 8000 }).toBeGreaterThan(stopped + 10)
    await page.keyboard.press('Enter')

    await page.keyboard.press('Escape')
    await expect(pane.getByTestId('plugin-error')).toHaveCount(0)
  } finally {
    await app.close()
  }
})

test('a genre tab and an instrument chosen are where the pane comes back to', async () => {
  let app = await launch(undefined, { layout: LAYOUT, ...keystreamProfile() })
  const dir = app.userData
  const pane = () => app.page.locator('[data-testid=plugin-pane][data-plugin=keystream]')
  // What the pane saved, as the layout holds it.
  const saved = () => {
    const tree = JSON.parse(readFileSync(path.join(dir, 'layout.json'), 'utf8'))
    return (tree.root.state?.plugin ?? {}) as { shelf?: string; song?: string; instrument?: string }
  }
  try {
    await expect(pane()).toHaveAttribute('data-status', 'ready')
    await pane().getByTestId('plugin-canvas').click()
    await expect(pane().getByTestId('plugin-keys')).toBeVisible()
    for (let i = 0; i < 3; i++) await app.page.keyboard.press('ArrowRight')
    await expect.poll(() => saved().shelf).toBe('dance')
    expect(SONGS.find((song) => song.id === saved().song)?.genre).toBe('dance')
    await app.page.keyboard.press('3')
    await expect.poll(() => saved().instrument).toBe('guitar')

    app = await app.relaunch()
    await expect(pane()).toHaveAttribute('data-status', 'ready')
    await pane().getByTestId('plugin-canvas').click()
    await expect(pane().getByTestId('plugin-keys')).toBeVisible()
    // Down the tab it came back on: still a dance track.
    const before = saved().song
    await app.page.keyboard.press('ArrowDown')
    await expect.poll(() => saved().song).not.toBe(before)
    expect(saved().shelf).toBe('dance')
    expect(SONGS.find((song) => song.id === saved().song)?.genre).toBe('dance')
    expect(saved().instrument).toBe('guitar')
  } finally {
    await app.quit()
    removeDir(dir)
  }
})
