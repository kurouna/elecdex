/**
 * What v0.0.38 added, for a landscape video (X, the release notes): the ELEC-16's five new
 * skins, modelled in light, each with keytops in a typeface of its own.
 *
 *   classic   the ELEC-16 as it was, SINEWAVE from its SOFT CARD running
 *   skins     TUNE open beside it, the five new skins in turn while the waves run: ALLOY (brushed
 *             metal, a black deck), GRAPHITE (a matte moulding, a near-white keypad), NEO (low
 *             keys, a paper-like screen), MOCHI (sakura and polka dots, glazed keys), GLASS (clear
 *             glass, the board deep inside)
 *   close     TUNE folded; GLASS full size, a few keys pressed on its keyboard
 *   theme     GLASS follows the theme: Business Light found in the action palette (a light
 *             glass, the accent's ENTER), then the take's own theme back
 *   last      MOCHI, then ALLOY, to end on
 *
 * Everything shown is the pane's own: the unit is a new one on a demo profile (demo-take.mjs),
 * and nothing of this machine is read, pressed or kept awake but the system's own clock.
 *
 * Windows only, like the other takes. Run `npm run build` first, then `npm run demo:whatsnew38`.
 * The window is 1600x900, a 16:9 frame; record the window. The take starts after the lead
 * (`--lead`, 8 s) and ends by itself; close the window to end, or pass `--exit` to close it when
 * the take is over. The options are demo-take.mjs's (`takeOptions`): `--pace` on every pause,
 * `--theme`, `--shots=<dir>` to look the take over, `--no-captions`.
 */
import { beats } from './demo-beats.mjs'
import { openTake, prepareData, say, takeOptions } from './demo-take.mjs'

const options = takeOptions({ width: 1600, height: 900, lead: 8 })
const exit = process.argv.includes('--exit')

const tree = {
  version: 1,
  root: {
    kind: 'pane',
    id: 'p-elec16',
    widget: 'elec16',
    state: { skin: 'classic', panel: false, tab: 'tune' },
  },
}

const { standIn } = await prepareData()
const { app, page, wait, settled, run, caption } = await openTake({
  items: [{ id: 'skins', name: 'elec-16', tree }],
  options,
  standIn,
})
const beat = beats({ app, page, wait, settled, theme: options.theme })
const { press, away } = beat
const pane = beat.paneOf('elec16').first()
const machine = pane.getByTestId('elec16')

/** A skin's chip pressed in TUNE, then held while the waves run. */
async function skin(id, text, hold) {
  say(`skin: ${id}`)
  await caption(text)
  await press(pane.locator(`[data-testid=elec16-skin][data-skin="${id}"]`))
  await wait(hold)
}

/** Keys pressed on the screen's keyboard, as a hand does, the waves stopped first. */
async function keys(ids) {
  for (const id of ids) {
    const key = pane.locator(`[data-testid=elec16-key][data-key="${id}"]`)
    await key.hover()
    await page.mouse.down()
    await wait(140)
    await page.mouse.up()
    await wait(260)
  }
}

await run(async () => {
  await settled()
  const started = Date.now()
  await machine.and(page.locator('[data-asleep=true]')).waitFor({ timeout: 20_000 })

  // The machine as it was, a program running.
  await caption('ELEC-16 — the pocket computer, as it was')
  await press(machine)
  await page.keyboard.type('load "sinewave"', { delay: 45 })
  await page.keyboard.press('Enter')
  await wait(600)
  await page.keyboard.type('run', { delay: 45 })
  await page.keyboard.press('Enter')
  await away()
  await wait(2600)

  // TUNE beside it: the five new skins in turn, the waves running on.
  await press(pane.getByTestId('elec16-panel-toggle'))
  await press(pane.getByTestId('elec16-tab').and(page.locator('[data-tab=tune]')))
  await wait(700)
  await skin('alloy', 'ALLOY — brushed metal, a black deck', 2600)
  await skin('graphite', 'GRAPHITE — a matte moulding, a near-white keypad', 2600)
  await skin('neo', 'NEO — a pocket computer made today', 2600)
  await skin('mochi', 'MOCHI — sakura, polka dots and glazed keys', 2600)
  await skin('glass', 'GLASS — clear glass, the board deep inside', 2600)

  // GLASS at full size: the waves stopped, a few keys pressed on its glass keyboard.
  await press(pane.getByTestId('elec16-panel-toggle'))
  await away()
  await caption('Each skin has keytops in a typeface of its own')
  await wait(1800)
  await machine.focus()
  await page.keyboard.press('Pause')
  await wait(500)
  await keys(['p', 'r', 'i', 'n', 't', ' ', '4', '*', '9', 'enter'])
  await wait(1600)

  // GLASS follows the theme: a light glass on a light theme, the accent's ENTER.
  await caption('GLASS follows the theme, light or dark')
  await beat.palette('business light', { hold: 1600 })
  await wait(3200)
  await beat.palette(options.theme, { hold: 1000 })
  await wait(1200)

  // To end on: the cute one, then the metal one.
  await press(pane.getByTestId('elec16-panel-toggle'))
  await press(pane.getByTestId('elec16-tab').and(page.locator('[data-tab=tune]')))
  await wait(500)
  await skin('mochi', 'Thirteen skins in all', 2000)
  await skin('alloy', 'Thirteen skins in all', 1600)
  await press(pane.getByTestId('elec16-panel-toggle'))
  await away()
  await wait(2200)
  await caption(null)
  say(`take: ${((Date.now() - started) / 1000).toFixed(1)} s`)
  if (exit) await app.close().catch(() => {})
})
