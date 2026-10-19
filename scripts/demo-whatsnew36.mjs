/**
 * What v0.0.35 and v0.0.36 added since v0.0.34, for a landscape video (X, the release notes):
 * the ETHERNET pane, on a cable that damages frames, and the action palette.
 *
 *   network   the network preset, where the take opens: Wi-Fi over the new ETHERNET pane, the
 *             globe over the connections
 *   ethernet  ETHERNET brought forward (Ctrl+Shift+Z): the verdict blaming the link for its CRC
 *             errors, the CRC figure coloured and not the speed, the LINK station's card and the
 *             CRC figure's, then the LOG behind its tab with the CRC ERRORS row and its card
 *   palette   the new action palette (Ctrl+Shift+P): a theme found by typing and applied, and the
 *             take's own brought back the same way
 *
 * Everything shown is made up or a stand-in (demo-take.mjs): the wired link is the collector's
 * `crc` stub (damaged frames at 0.3 % of what arrives), the Wi-Fi link, the sockets and the
 * addresses the demo's own. Nothing of this machine is read, pressed or kept awake, but the
 * system column's own readings.
 *
 * Windows only, like the other takes. Run `npm run build` first, then `npm run demo:whatsnew36`.
 * The window is 1600x900, a 16:9 frame; record the window. The take starts after the lead
 * (`--lead`, 8 s) and ends by itself; close the window to end, or pass `--exit` to close it when
 * the take is over. The options are demo-take.mjs's (`takeOptions`): `--pace` on every pause,
 * `--theme`, `--shots=<dir>` to look the take over.
 */
import { beats } from './demo-beats.mjs'
import { MAIN, openTake, prepareData, say, takeOptions, withDemoState } from './demo-take.mjs'
import { presetTrees, withState } from './preset-shots.mjs'

const options = takeOptions({ width: 1600, height: 900, lead: 8 })
const exit = process.argv.includes('--exit')

const { standIn } = await prepareData()
const trees = await presetTrees(MAIN)
const network = trees.get('network')
if (network === undefined) throw new Error('no preset network in the built app')
// Both links on the minute: the seconds watched since the take began fill the timelines.
const items = [
  {
    id: 'newnetwork',
    name: 'network',
    preset: 'network',
    tree: withState(withDemoState(network, standIn), {
      wifi: { window: '1m' },
      ethernet: { window: '1m' },
    }),
  },
]

const { app, page, wait, settled, run } = await openTake({
  items,
  options,
  standIn,
  // A cable that damages frames: the verdict blames the link, as a worn cable's would.
  env: { ELECDEX_ETHER_STUB: 'crc' },
})
const beat = beats({ app, page, wait, settled, theme: options.theme })
const { paneOf, press, away } = beat

/** Rests the pointer on what a card opens for, long enough to read it. */
async function card(target, label, hold = 2600) {
  if ((await target.count()) === 0) return
  say(label)
  await target.first().hover()
  await wait(hold)
}

/* ---- 1. The network preset ---- */

async function networkPreset() {
  const ether = paneOf('ethernet')
  await ether.getByTestId('ether-verdict').filter({ hasText: 'LINK' }).waitFor({ timeout: 40_000 })
  say('network: Wi-Fi over the new ETHERNET pane')
  await wait(3200)
}

/* ---- 2. ETHERNET brought forward ---- */

async function ethernetForward() {
  const ether = paneOf('ethernet')
  say('ethernet: brought forward')
  // The press that gives it the keyboard lands on its title, where nothing opens.
  await ether.click({ position: { x: 160, y: 10 } })
  await wait(300)
  await page.keyboard.press('Control+Shift+KeyZ')
  await wait(2600)
  say('ethernet: the link blamed for its CRC errors, the speed left alone')
  await card(ether.locator('[data-testid=ether-station][data-station=link]'), 'ethernet: LINK')
  await card(ether.getByTestId('ether-crc'), 'ethernet: the CRC figure', 2800)
  await away()
  const log = ether.locator('[data-testid=ether-view][data-view=log]')
  if ((await log.count()) > 0) await press(log)
  const row = ether.getByTestId('ether-event').filter({ hasText: 'CRC ERRORS' })
  await row.first().waitFor({ timeout: 10_000 })
  await wait(1200)
  await card(row, 'ethernet: the CRC ERRORS row', 2600)
  await away()
  await page.keyboard.press('Control+Shift+KeyZ')
  await wait(1300)
}

/* ---- 3. The action palette ---- */

async function actionPalette() {
  // A theme found by typing, then the take's own back the same way.
  await beat.palette('black', { hold: 1800 })
  await wait(2600)
  await beat.palette(options.theme, { hold: 1200 })
  await wait(1500)
}

await run(async () => {
  await settled()
  const started = Date.now()
  await networkPreset()
  await ethernetForward()
  await actionPalette()
  say(`take: ${((Date.now() - started) / 1000).toFixed(1)} s`)
  if (exit) await app.close().catch(() => {})
})
