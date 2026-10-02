/**
 * The panes added since v0.0.16 - DOCKER, CLIPBOARD, NOW PLAYING and UTILITY - side by side,
 * for a short landscape video (X): under thirty seconds from the first move to the last, the
 * pauses kept short so nobody scrolls past.
 *
 * The take, pane by pane:
 *   DOCKER      a container turns healthy, a name's card opens, a stopped one starts, a running
 *               one stops (asked twice), RUN and back to ALL
 *   CLIPBOARD   three copies land (an address, a colour, a command), a card opens, one goes back
 *   NOW PLAYING the next track and its cover, a seek with the keyboard, the spectrum dancing
 *   UTILITY     AWAKE held with the display on for an hour, a QR code typed, a SHA-256 typed
 *
 * Everything shown is made up: the stand-in engine (ELECDEX_DOCKER_STUB=demo), clipboard, sound
 * and media session (its covers drawn in main/media/demo-art.ts), and a stand-in power-save
 * blocker, so the recording machine is neither read nor kept awake. The window is 1280x720 at a zoom of 1, a 16:9 frame; record the window. The
 * take starts after the lead (`--lead`, 6 s) and ends by itself; close the window to end, or
 * pass `--exit` to close it when the take is over. Windows only, like the screenshots. Run
 * `npm run build` first, then `npm run demo:panes`. The options are demo-take.mjs's
 * (`takeOptions`): `--pace=0.9` for a quicker take, `--shots=<dir>` to look it over.
 */
import { openTake, prepareData, say, takeOptions } from './demo-take.mjs'

const options = takeOptions({ width: 1280, height: 720, zoom: 1, lead: 6 })
const exit = process.argv.includes('--exit')

/** DOCKER and CLIPBOARD down the left; NOW PLAYING, the spectrum and UTILITY down the right. */
const tree = {
  version: 1,
  root: {
    kind: 'split',
    id: 's-root',
    direction: 'row',
    sizes: [0.56, 0.44],
    children: [
      {
        kind: 'split',
        id: 's-left',
        direction: 'column',
        sizes: [0.52, 0.48],
        children: [
          { kind: 'pane', id: 'p-docker', widget: 'docker' },
          { kind: 'pane', id: 'p-clip', widget: 'clipboard' },
        ],
      },
      {
        kind: 'split',
        id: 's-right',
        direction: 'column',
        sizes: [0.34, 0.24, 0.42],
        children: [
          { kind: 'pane', id: 'p-np', widget: 'nowplaying' },
          // The music the track plays, so the take looks as if it were heard.
          { kind: 'pane', id: 'p-spectrum', widget: 'spectrum', state: { bands: 16 } },
          { kind: 'pane', id: 'p-util', widget: 'utility', state: { module: 'awake' } },
        ],
      },
    ],
  },
}

const { standIn } = await prepareData()
const { app, page, wait, settled, run } = await openTake({
  items: [{ id: 'new-panes', name: 'new panes', tree }],
  options,
  standIn,
})

/** A change the engine would announce: a container's state, as `docker` elsewhere made it. */
const engine = (name, patch) =>
  app.evaluate(
    (_electron, [who, what]) => globalThis.__elecdexDocker.change(who, what),
    [name, patch],
  )

/** A copy made in another application. */
const copy = (text) =>
  app.evaluate((_electron, what) => globalThis.__elecdexClipboard.copy(what), text)

const row = (name) => page.locator(`[data-testid=docker-row][data-name="${name}"]`)
/** Presses a button the way a hand does: held for a moment (CLAUDE.md, test craft). */
const press = (locator) => locator.click({ delay: 20 })

async function docker() {
  say('docker')
  await engine('shop-search-1', { status: 'Up 1 minute (healthy)' })
  await wait(700)
  await row('shop-db-1').getByTestId('docker-name').hover()
  await wait(1300)
  await row('shop-worker-1').hover()
  await wait(250)
  await press(row('shop-worker-1').getByTestId('docker-start'))
  await wait(900)
  await row('shop-api-1').hover()
  await wait(250)
  await press(row('shop-api-1').getByTestId('docker-stop'))
  await wait(550)
  await press(row('shop-api-1').getByTestId('docker-stop'))
  await wait(900)
  await press(page.getByTestId('docker-filter-running'))
  await wait(900)
  await press(page.getByTestId('docker-filter-all'))
  await wait(500)
}

async function clipboard() {
  say('clipboard')
  await page.mouse.move(10, 700)
  await copy('https://github.com/kurouna/elecdex')
  await wait(650)
  await copy('#00E5FF')
  await wait(650)
  await copy('docker compose up -d')
  await wait(800)
  const second = page.getByTestId('clip-entry').nth(1)
  await second.hover()
  await wait(1000)
  await press(second)
  await wait(900)
}

async function nowPlaying() {
  say('now playing')
  await press(page.getByTestId('np-next'))
  await wait(1100)
  await page.getByTestId('np-bar').focus()
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('ArrowRight')
    await wait(110)
  }
  // No pause: the stand-in sound the spectrum shows plays on, and would not stop with it.
  await wait(900)
}

async function utility() {
  say('utility')
  const util = page.getByTestId('utility')
  await press(util.locator('[data-testid=awake-level][data-level=display]'))
  await wait(500)
  await press(util.locator('[data-testid=awake-for][data-for="3600000"]'))
  await wait(1000)
  await press(util.locator('[data-testid=utility-mode][data-module=qr]'))
  await wait(350)
  await press(util.locator('[data-testid=qr-kind][data-kind=url]'))
  await util.getByTestId('qr-url').click()
  await page.keyboard.type('https://github.com/kurouna/elecdex', { delay: 16 })
  await wait(1300)
  await press(util.locator('[data-testid=utility-mode][data-module=codec]'))
  await wait(350)
  await press(util.locator('[data-testid=codec-op][data-op=sha256]'))
  await util.getByTestId('codec-input').click()
  await page.keyboard.type('elecdex', { delay: 40 })
  await wait(1200)
}

await run(async () => {
  await settled()
  const started = Date.now()
  await docker()
  await clipboard()
  await nowPlaying()
  await utility()
  // The last look at all four, then the end.
  await page.mouse.move(10, 700)
  await wait(1200)
  say(`take: ${((Date.now() - started) / 1000).toFixed(1)} s`)
  if (exit) await app.close().catch(() => {})
})
