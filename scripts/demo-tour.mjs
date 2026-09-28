/**
 * A tour of elecdex for an introduction video: what it is at a glance, what only it does, and
 * what looks best - in about two minutes.
 *
 *   boot        the boot sequence, welcoming a made-up user
 *   standard    the shells typed into, the globe brought forward and put back
 *   network     through the layouts dialog: the Wi-Fi link segment by segment, the connections
 *   earth       ORBIT with the pointer resting on the ISS, the quakes, the weather
 *   dev         coding agents at work, a container stopped (asked twice), a commit's card
 *   media       the television and the timeline (stand-ins); KEYSTREAM's BOOT SEQUENCE playing,
 *               then FEVER CALL from the next button, the spectrum moving with what is heard
 *   desk        copies landing in the clipboard history, a QR code typed
 *   keystream   the sample plugin: its menu previewing a track, then a track typed on time
 *   council     the ELEC system pane: a motion put, three units voting (a stand-in model)
 *   themes      every built-in theme in turn, back to Tron
 *
 * Everything shown is made up or a stand-in (demo-take.mjs): the home, the repository, the Claude
 * Code folder, the sockets, the Wi-Fi link, the clipboard, the media session and its covers, the
 * music (KEYSTREAM's own tracks, rendered here and played by the spectrum's stand-in), the Docker
 * engine, the web pages, and the council's answers, served from here with no model and no key;
 * KEYSTREAM is copied into the profile from examples/ and typed by the take. Only the orbital
 * elements, the weather, the markets and the earthquakes are real, fetched as the panes would.
 * Nothing of this machine is read, pressed or kept awake.
 *
 * Windows only, like the screenshots. Run `npm run build` first, then `npm run demo:tour`. The
 * window opens after the lead (`--lead`, 10 s: start the recorder on the region the --probe
 * run showed), plays the boot, and the tour follows; close the window to end, or pass `--exit`.
 * `--no-intro` skips the boot. The other options are demo-take.mjs's (`takeOptions`): 1600x900
 * unless told otherwise, `--pace` on every pause, `--shots=<dir>` to look the take over.
 */
import { beats, KEYSTREAM_VOLUME, prepareMusic, startCouncil } from './demo-beats.mjs'
import { copyKeystream, keystreamPane, keystreamSettings } from './demo-keystream-kit.mjs'
import { MAIN, openTake, prepareData, say, takeOptions, withDemoState } from './demo-take.mjs'
import { presetTrees, withState } from './preset-shots.mjs'

const options = takeOptions({ width: 1600, height: 900, lead: 10 })
const intro = !process.argv.includes('--no-intro')
const exit = process.argv.includes('--exit')

/** The presets in the order the layouts dialog lists them: Ctrl+Shift+F1 .. F6. */
const ORDER = ['standard', 'network', 'earth', 'dev', 'media', 'desk']

const council = await startCouncil()
const music = prepareMusic()

/* ---- The saved layouts: the six presets, the council, then KEYSTREAM ---- */

let nextId = 0
const pane = (widget) => ({ kind: 'pane', id: `t${nextId++}`, widget })
const split = (direction, children, sizes) => ({
  kind: 'split',
  id: `ts${nextId++}`,
  direction,
  children,
  sizes,
})
/** The ELEC pane in the middle, the system column and the world either side. */
const councilTree = {
  version: 1,
  root: split(
    'row',
    [
      split(
        'column',
        ['clock', 'sysinfo', 'cpu', 'memory', 'disk', 'toplist', 'netstat', 'throughput'].map(pane),
        [0.04, 0.125, 0.19, 0.12, 0.116, 0.189, 0.055, 0.165],
      ),
      pane('elec'),
      split(
        'column',
        ['globe', 'markets', 'weather', 'calendar'].map(pane),
        [0.3, 0.25, 0.22, 0.23],
      ),
    ],
    [0.18, 0.64, 0.18],
  ),
}

/** The system column as the council has it, and the game beside it. */
const keystreamTree = {
  version: 1,
  root: split('row', [councilTree.root.children[0], keystreamPane('tkeystream')], [0.18, 0.82]),
}

const { standIn } = await prepareData()
const trees = await presetTrees(MAIN)
const items = ORDER.map((id, i) => {
  const tree = trees.get(id)
  if (tree === undefined) throw new Error(`no preset ${id} in the built app`)
  const shown = withDemoState(tree, standIn)
  return {
    id: `tour${i}${id}`,
    name: id,
    preset: id,
    // The desk's utility pane opens on QR, ready for an address.
    tree: id === 'desk' ? withState(shown, { utility: { module: 'qr', qrKind: 'url' } }) : shown,
  }
})
items.push({ id: 'tourcouncil', name: 'council', tree: councilTree })
items.push({ id: 'tourkeystream', name: 'keystream', tree: keystreamTree })

if (!options.probe) {
  say(`the window opens in ${options.lead} s - start the recorder`)
  await new Promise((resolve) => setTimeout(resolve, options.lead * 1000))
}
const { app, page, wait, settled, run } = await openTake({
  items,
  options: { ...options, lead: 0 },
  standIn,
  intro,
  env: { ELECDEX_AWAKE_STUB: '1', ...music.env },
  settings: { ...council.settings, plugins: keystreamSettings(KEYSTREAM_VOLUME) },
  prepare: copyKeystream,
})

const beat = beats({ app, page, wait, settled, theme: options.theme, music })

/** A switch by a preset's own key, then the arrangement's power-on. */
async function toPreset(id) {
  say(`preset: ${id}`)
  await beat.letGo()
  await page.keyboard.press(`Control+Shift+F${ORDER.indexOf(id) + 1}`)
  await wait(300)
  await settled()
}

/** The layouts dialog: the shelf of presets, one step along to network, Enter. */
async function throughTheShelf() {
  say('dialog: the presets')
  await page.keyboard.press('Control+Shift+KeyG')
  await page.getByTestId('layouts-dialog').waitFor()
  await wait(900)
  await page.locator('[data-testid=layouts-preset][data-preset="standard"]').focus()
  await wait(500)
  await page.keyboard.press('ArrowRight')
  await wait(500)
  await page.keyboard.press('Enter')
  await wait(300)
  await settled()
  await beat.away()
  await wait(4000)
}

await run(async () => {
  const started = Date.now()
  await wait(1200)
  await beat.forward('globe', 3200)
  await throughTheShelf()
  await toPreset('earth')
  await wait(1500)
  await beat.issCard()
  await wait(1500)
  await toPreset('dev')
  await wait(2000)
  await beat.stopContainer()
  await beat.commitCard()
  await toPreset('media')
  await beat.musicPlays()
  await wait(4000)
  await beat.nextTrack(4500)
  await toPreset('desk')
  await wait(1200)
  await beat.copies()
  await beat.qrCode()
  await beat.keystream(() => beat.toLayout(8, 'keystream'))
  await beat.toLayout(7, 'council')
  await wait(800)
  await beat.councilSits()
  await toPreset('standard')
  // The switch ended the shells: the new one is given something to show while the themes change.
  await beat.shellTypes()
  await beat.themes()
  await wait(2500)
  say(`tour: ${((Date.now() - started) / 1000).toFixed(0)} s after the boot`)
  council.close()
  if (exit) await app.close().catch(() => {})
})
