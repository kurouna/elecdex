/**
 * The Wi-Fi pane on a train, for a vertical video (YouTube Shorts): a tall window with a thin
 * strip of the clock and the system over the WI-FI pane, fed by the collector's `train` stub -
 * the way out lost for eight seconds in every forty (a tunnel, the gateway still answering), a
 * new access point every thirty (a change of car), a day of drops in the log.
 *
 * The take waits for what the stub does rather than timing it: the verdict turning to UPSTREAM
 * LOST, the handover landing in the log. On the way the pointer rests on the figures that tell
 * the story, so their cards open with what they read at that moment: the INTERNET station in
 * the tunnel, the verdict, the handover, the timeline's crosshair and the call score. About a
 * minute from the first frame; nothing about this machine or its network is shown.
 *
 * The window is 540x960 at a zoom of 0.75, so the workspace lays out as 720x1280 - a 9:16 frame
 * that fits a 1080-pixel-high screen; record the window and scale it to 1080x1920. Windows only,
 * like the screenshots. Run `npm run build` first, then `npm run demo:wifi`. Close the window
 * to end it. The options are demo-take.mjs's (`takeOptions`); `--window=1m` sets the timeline's
 * span (1m, 5m, 15m or 60m).
 */
import { openTake, prepareData, say, takeOptions } from './demo-take.mjs'

const options = takeOptions({ width: 540, height: 960, zoom: 0.75, lead: 6 })
const span = process.argv.find((a) => a.startsWith('--window='))?.split('=')[1] ?? '1m'

/** The strip on top, then the pane: at 720x1280 it has room to stack every part it has. */
const STRIP = 0.08
const tree = {
  version: 1,
  root: {
    kind: 'split',
    id: 's-root',
    direction: 'column',
    sizes: [STRIP, 1 - STRIP],
    children: [
      {
        kind: 'split',
        id: 's-strip',
        direction: 'row',
        sizes: [0.5, 0.5],
        children: [
          { kind: 'pane', id: 'p-clock', widget: 'clock' },
          { kind: 'pane', id: 'p-sys', widget: 'sysinfo' },
        ],
      },
      { kind: 'pane', id: 'p-wifi', widget: 'wifi', state: { window: span } },
    ],
  },
}

const { standIn } = await prepareData()
const { page, wait, run } = await openTake({
  items: [{ id: 'wifi-train', name: 'wi-fi', tree }],
  options,
  standIn,
  env: { ELECDEX_WIFI_STUB: 'train' },
})

const station = (name) => page.locator(`[data-testid=wifi-station][data-station=${name}]`)
const verdict = page.getByTestId('wifi-verdict')

/** Rests the pointer on an element long enough for its card to open and be read. */
async function rest(locator, label, seconds) {
  say(`card: ${label}`)
  await locator.first().hover()
  await wait(seconds * 1000)
}

/** Takes the pointer off the pane, so no card is left open. */
async function away(seconds) {
  await page.mouse.move(4, 4)
  await wait(seconds * 1000)
}

await run(async () => {
  say('watching the link')
  await wait(4000)

  say('waiting for the tunnel')
  await verdict.filter({ hasText: 'UPSTREAM LOST' }).waitFor({ timeout: 90_000 })
  await wait(1200)
  await rest(station('internet'), 'the internet, silent', 3.5)
  await rest(verdict, 'the verdict', 3.5)
  await away(1.5)

  say('waiting for the change of car')
  const handover = page.locator('[data-testid=wifi-event][data-kind=handover]')
  await handover.first().waitFor({ timeout: 60_000 })
  await wait(1200)
  await rest(handover, 'the handover', 3)

  const plot = page.locator('[data-testid=wifi-timeline] .plot')
  const box = await plot.boundingBox()
  if (box !== null) {
    say('crosshair')
    for (const at of [0.62, 0.72, 0.82, 0.92]) {
      await page.mouse.move(box.x + box.width * at, box.y + box.height * 0.5, { steps: 8 })
      await wait(700)
    }
  }
  await rest(page.getByTestId('wifi-mos'), 'the call score', 3)
  await away(3)
})
