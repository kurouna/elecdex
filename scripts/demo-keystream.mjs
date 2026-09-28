/**
 * KEYSTREAM, the sample plugin, for a video: its menu heard, a track played through while the
 * instrument changes under it, and the result.
 *
 * The take:
 *   MENU    the pane takes the keys; the cursor goes round the genre tabs and rests on a few
 *           tracks, each heard as the menu previews it (`--previews`, ids from songs/)
 *   CHOOSE  the track to play (`--song`) on its tab, its instrument picked on the menu (the
 *           first of `--instruments`), its levels opened and one chosen (`--level`)
 *   PLAY    every note typed on time, the instrument changing every few bars through the rest
 *           of `--instruments` (the number row's keys: 1 E.PIANO, 2 PIANO, 3 GUITAR, 4 SYNTH LEAD,
 *           5 CHIP, 6 ORGAN, 7 MARIMBA, 8 E.BASS, 9 PAD, 0 PLUCK, - SYNTH BASS)
 *   RESULT  the score counted up and the rank, left on screen (`--result` seconds)
 *
 * The notes are typed on time as demo-keystream-kit.mjs says, and the track is read from the
 * plugin's own files for the menu's route and the bars where the instrument changes.
 *
 * The window is 1600x900, a 16:9 frame (the tour's): the default layout's system column on the
 * left, as every preset has it, and the game beside it; record the window, and leave it
 * in front: the game pauses when the window loses the keyboard. Nothing of this machine is
 * shown beyond what the tour's system column shows (the profile is new, the user and host made
 * up, the plugin copied into it from examples/). The take starts after
 * the lead (`--lead`, 6 s); close the window to end, or pass `--exit` to close it when the take
 * is over. Windows only, like the other takes. Run `npm run build` first, then
 * `npm run demo:keystream`. demo-take.mjs has the other options: `--probe`, `--theme`,
 * `--pace`, `--shots=<dir>` to look the take over; `--volume` is the plugin's (80), `--jitter` how
 * far from each note a key may land (8 ms; SYNC is 40, 30 on HARD).
 */
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  autoplay,
  copyKeystream,
  KEYS,
  keystreamMenu,
  keystreamPane,
  keystreamSettings,
  trackPlan,
} from './demo-keystream-kit.mjs'
import { openTake, prepareData, say, takeOptions } from './demo-take.mjs'

const options = takeOptions({ width: 1600, height: 900, zoom: 1, lead: 6 })
const option = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]
const exit = process.argv.includes('--exit')
const SONG = option('song') ?? 'boot-sequence'
const LEVEL = option('level') ?? 'normal'
const PREVIEWS = (option('previews') ?? 'sakura-signal,zero-gravity,pixel-rush').split(',')
const [FIRST_INSTRUMENT, ...CHANGES] = (option('instruments') ?? '2,3,5,6,7,4,2').split(',')
const LISTEN_S = Number(option('listen') ?? 6)
const RESULT_S = Number(option('result') ?? 10)
const JITTER_MS = Number(option('jitter') ?? 8)
/** The plugin's volume setting: the guide's notes are told apart by their level, a share of it. */
const VOLUME = Number(option('volume') ?? 80)

// The app's default layout, read as Node reads TypeScript (demo-keystream-kit.mjs's hooks).
const { SYSTEM_COLUMN_WIDTH, systemColumn } = await import(
  pathToFileURL(path.resolve('src/shared/default-layout.ts')).href
)

const { chart, plan } = trackPlan({
  song: SONG,
  level: LEVEL,
  changes: CHANGES,
  volume: VOLUME,
  jitter: JITTER_MS,
})

/** The default layout's system column on the left, as every preset keeps it; the game beside it. */
const tree = {
  version: 1,
  root: {
    kind: 'split',
    id: 's-root',
    direction: 'row',
    sizes: [SYSTEM_COLUMN_WIDTH, 1 - SYSTEM_COLUMN_WIDTH],
    children: [systemColumn(), keystreamPane('p-keystream')],
  },
}

const { standIn } = await prepareData()
const { app, page, wait, settled, run } = await openTake({
  items: [{ id: 'keystream', name: 'keystream', tree }],
  options,
  standIn,
  settings: { plugins: keystreamSettings(VOLUME) },
  prepare: copyKeystream,
})

// The worker's messages are caught from its first: the page is loaded again with the catch in.
await app.context().addInitScript(autoplay, KEYS)
await page.reload()
const pane = page.locator('[data-testid=plugin-pane][data-plugin=keystream]')
await page
  .locator('[data-testid=plugin-pane][data-plugin=keystream][data-status=ready]')
  .waitFor({ timeout: 20_000 })

const menu = keystreamMenu(page, wait)

async function browse() {
  say('menu: the pane takes the keys')
  await pane.getByTestId('plugin-canvas').click({ delay: 20 })
  await wait(2500)
  for (const id of PREVIEWS) {
    say(`menu: ${id}`)
    await menu.toTrack(id)
    await wait(LISTEN_S * 1000)
  }
}

async function choose() {
  say(`menu: ${SONG}, ${LEVEL}`)
  await menu.toTrack(SONG)
  await wait(1800)
  await menu.start(LEVEL, FIRST_INSTRUMENT, plan)
}

await run(async () => {
  await settled()
  const started = Date.now()
  await browse()
  await choose()
  say(`play: ${SONG} (${chart.notes.length} notes, ${(chart.duration / 1000).toFixed(0)} s)`)
  await page.waitForFunction(() => window.__keystreamDemo.done, null, {
    timeout: chart.duration + 30_000,
    polling: 500,
  })
  const pressed = await page.evaluate(() => window.__keystreamDemo.pressed)
  say(`result: ${pressed} of ${chart.notes.length} notes typed`)
  await wait(RESULT_S * 1000)
  say(`take: ${((Date.now() - started) / 1000).toFixed(1)} s`)
  if (exit) await app.close().catch(() => {})
})
