/**
 * The CLOCK pane's faces, for a landscape video (X, the release notes), in the standard preset
 * the clock is the top of: the system column gives it a strip of its own across the column's
 * width, and each face uses that width differently.
 *
 *   opening    WEEK brought forward (Ctrl+Shift+Z) from the first frame, then back in the strip
 *   faces      each face in turn, in the strip and then brought forward: LONGITUDE, the default,
 *              AHEAD (two alarms this take sets and the made-up tasks falling due), TAPE, DIGITAL,
 *              SEGMENT, VECTOR, DIAL, and KARMAN, the wind tunnel solved for real, the longest
 *   settings   last and short: the settings dialog's clock list, LONGITUDE chosen there
 *
 * Everything is the other takes' stand-ins (demo-take.mjs): the made-up tasks come with the
 * profile (preset-shots.mjs), and the two alarms are made by this script through the app's own
 * API, in the take's throwaway profile. Nothing of this machine is read or kept.
 *
 * Windows only, like the other takes. Run `npm run build` first, then `npm run demo:clock`.
 * The window is 1600x900, a 16:9 frame; record the window. The take starts after the lead
 * (`--lead`, 8 s) and ends by itself in about 60 s; pass `--exit` to close the window when it
 * is over. The options are demo-take.mjs's (`takeOptions`): `--pace`, `--theme`,
 * `--shots=<dir>`, `--no-captions`.
 */
import { beats } from './demo-beats.mjs'
import { MAIN, openTake, prepareData, say, takeOptions, withDemoState } from './demo-take.mjs'
import { presetTrees } from './preset-shots.mjs'

const options = takeOptions({ width: 1600, height: 900, lead: 8 })
const exit = process.argv.includes('--exit')

const { standIn } = await prepareData()
const trees = await presetTrees(MAIN)
const standard = trees.get('standard')
if (standard === undefined) throw new Error('no preset standard in the built app')

const items = [
  {
    id: 'clockstandard',
    name: 'standard',
    preset: 'standard',
    tree: withDemoState(standard, standIn),
  },
]

const { app, page, wait, settled, run, caption } = await openTake({
  items,
  options,
  standIn,
  // The take begins on WEEK, brought forward at once (opening, below).
  settings: { clock: { face: 'week' } },
})
const { paneOf, press, away } = beats({ app, page, wait, settled, theme: options.theme })
const clock = paneOf('clock')

/** The faces after the opening's WEEK, each with what its caption says. */
const FACES = [
  [
    'longitude',
    'LONGITUDE, the default: where in the world it is day, cities at their own times',
  ],
  ['ahead', 'AHEAD: the next 24 hours on a log scale - your alarms and the tasks falling due'],
  ['tape', 'TAPE: the day as a tape of ticks running ahead of you, the night as a band'],
  ['digital', 'DIGITAL: the face elecdex began with, its digits rolling as they change'],
  ['segment', 'SEGMENT: seven segments, like a vacuum fluorescent display'],
  ['vector', 'VECTOR: single strokes, redrawn as if by a plotter'],
  ['dial', 'DIAL: an analog dial, the figures beside it on one line'],
]

const setFace = (face) =>
  page.evaluate((f) => window.elecdex.settings.patch({ clock: { face: f } }), face)

/**
 * The clock brought forward: pressed first so the keyboard is the clock pane's (the first shell
 * holds it after the take types into it), and waited for, so a press that came too early is not
 * taken for a zoom.
 */
async function bringForward() {
  await press(clock)
  await page.keyboard.press('Control+Shift+KeyZ')
  const zoomed = page.locator('[data-testid=pane][data-widget=clock][data-zoomed=true]')
  const came = await zoomed
    .waitFor({ timeout: 1500 })
    .then(() => true)
    .catch(() => false)
  if (!came) {
    await press(clock)
    await page.keyboard.press('Control+Shift+KeyZ')
    await zoomed.waitFor({ timeout: 5000 })
  }
}

/** The clock brought forward and back: the face laid out again for the room. */
async function forward(ms) {
  await bringForward()
  await wait(ms)
  await page.keyboard.press('Escape')
  await away()
  await wait(400)
}

/** Two alarms for AHEAD: one in a few minutes, one tomorrow morning. */
async function setAlarms() {
  const soon = new Date(Date.now() + 9 * 60_000)
  await page.evaluate(
    async ([hour, minute]) => {
      await window.elecdex.alarms.add({ label: 'stand-up', hour, minute, days: [] })
      await window.elecdex.alarms.add({ label: 'wake', hour: 7, minute: 30, days: [] })
    },
    [soon.getHours(), soon.getMinutes()],
  )
}

/**
 * The opening: WEEK brought forward at once, the first thing on screen, so the take shows a face
 * before anyone has read a caption (a viewer leaves in the first seconds; user request
 * 2026-11-22). Then back into the strip it was made for.
 */
async function opening() {
  await caption('The clock has faces now. WEEK: this week beside the time, today lit')
  await bringForward()
  await wait(3600)
  await caption('Each face lays itself out for the room: forward a block, in its strip a band')
  await wait(3000)
  // Straight on to the next face: a caption of its own back in the strip held the take up
  // (user request 2026-11-22).
  await page.keyboard.press('Escape')
  await away()
  await wait(400)
}

async function faces() {
  for (const [face, text] of FACES) {
    await setFace(face)
    await caption(text)
    await wait(1800)
    await forward(2600)
  }
}

async function karman() {
  await setFace('karman')
  await caption('KARMAN: a wind tunnel. The digits are the obstacles; the smoke flows around them')
  await wait(2600)
  await bringForward()
  await caption('Navier-Stokes, solved ten times a second - listed as using more CPU, and it does')
  await wait(7000)
  await caption('Each second the digits change shape, and the wake behind them with it')
  await wait(5000)
  await page.keyboard.press('Escape')
  await away()
  await wait(400)
}

/**
 * How a face is chosen, last and short (user request 2026-11-22: shown after WEEK it held the
 * faces back): the settings dialog's list, LONGITUDE, the default, chosen there, and the take
 * ends on it in the strip.
 */
async function settings() {
  await caption('Chosen in settings - every clock pane draws the same face')
  await page.keyboard.press('Control+Shift+Period')
  const dialog = page.getByTestId('settings-dialog')
  await dialog.waitFor({ timeout: 10_000 })
  const select = dialog.getByTestId('settings-clock-face')
  await select.scrollIntoViewIfNeeded()
  await wait(900)
  await select.selectOption('longitude')
  await wait(1800)
  await page.keyboard.press('Escape')
  await away()
  await caption('Nine faces, one table: a new face is a folder and a row')
  await wait(3200)
  await caption(null)
}

await run(async () => {
  await settled()
  await setAlarms()
  const started = Date.now()
  await opening()
  await faces()
  await karman()
  await settings()
  say(`take: ${((Date.now() - started) / 1000).toFixed(1)} s`)
  if (exit) await app.close().catch(() => {})
})
