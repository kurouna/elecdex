/**
 * From the standard preset to a BASIC program running on the ELEC-16, for a landscape video
 * (X): how to find the pocket computer, then use it.
 *
 *   standard  the standard preset, where the take opens
 *   layouts   Ctrl+Shift+G: the LAYOUTS dialog, its list stepped down to retro, Enter
 *   retro     the pocket ELEC-16 in front, the calculator and CHIP-8 behind their tabs
 *   forward   the pane given the keyboard and brought forward (Ctrl+Shift+Z)
 *   program   a BASIC program typed on the PC, the body's keys going down with it
 *   list/run  LIST, then RUN: a table of squares
 *   back      Ctrl+Shift+Z again, the retro preset as it was
 *
 * The saved layouts are every preset, as a first start makes them; retro's pocket is a new
 * POCKET-48 on the CLASSIC skin and its calculator a new SCI-128. Everything else is the demo's
 * stand-ins (demo-take.mjs): nothing of this machine is read, pressed or kept awake but the
 * system column's own readings.
 *
 * Windows only, like the other takes. Run `npm run build` first, then `npm run demo:elec16-basic`.
 * The window is 1600x900, a 16:9 frame; record the window. The take starts after the lead
 * (`--lead`, 8 s) and ends by itself; `--exit` closes the window then. The options are
 * demo-take.mjs's (`takeOptions`): `--pace`, `--theme`, `--shots=<dir>`, `--no-captions`.
 */
import { beats, playUnits } from './demo-beats.mjs'
import { MAIN, openTake, prepareData, say, takeOptions, withDemoState } from './demo-take.mjs'
import { presetTrees, withState } from './preset-shots.mjs'

const options = takeOptions({ width: 1600, height: 900, lead: 8 })
const exit = process.argv.includes('--exit')

/** The presets in the order a first start saves them (shared/layout-presets.ts). */
const PRESETS = [
  'standard',
  'network',
  'earth',
  'dev',
  'media',
  'desk',
  'ai',
  'cockpit',
  'retro',
  'cloud',
  'blank',
]

const { standIn } = await prepareData()
const trees = await presetTrees(MAIN)
const preset = (id) => {
  const tree = trees.get(id)
  if (tree === undefined) throw new Error(`no preset ${id} in the built app`)
  return withDemoState(tree, standIn)
}

/** retro as it ships, its pocket in front on CLASSIC; its calculator given the take's SCI-128. */
function retroTree() {
  const tree = withState(preset('retro'), {
    elec16: { unit: 'u1', skin: 'classic', panel: false },
    chip8: { view: 'library', filter: 'action', program: 'archive/t8nks', panel: true },
  })
  const visit = (node) => {
    if (node.kind === 'split') return node.children.forEach(visit)
    if (node.kind !== 'tabs') return
    const sci = node.children.find((c) => c.widget === 'elec16' && c.state?.fresh === 'sci-128')
    if (sci !== undefined) sci.state = { unit: 'u4', sciSkin: 'chalk', panel: false }
  }
  visit(tree.root)
  return tree
}

const items = PRESETS.filter((id) => trees.has(id)).map((id) => ({
  id: `new${id}`,
  name: id,
  preset: id,
  tree: id === 'retro' ? retroTree() : preset(id),
}))

const { app, page, wait, settled, run, caption } = await openTake({
  items,
  options,
  standIn,
  prepare: (profile) => playUnits(profile),
})
const beat = beats({ app, page, wait, settled, theme: options.theme })
const { away } = beat
const pocket = page.locator('[data-testid=pane][data-widget=elec16]', {
  hasNot: page.getByTestId('elec16-sci-device'),
})
const machine = pocket.getByTestId('elec16')

/** A line typed on the PC a key at a time, each held long enough to see it go down, then Enter. */
async function line(text, hold = 70, gap = 45) {
  for (const ch of text) {
    await page.keyboard.down(ch === ' ' ? 'Space' : ch)
    await wait(hold)
    await page.keyboard.up(ch === ' ' ? 'Space' : ch)
    await wait(gap)
  }
  await wait(120)
  await page.keyboard.press('Enter')
  await wait(350)
}

await run(async () => {
  await settled()
  const started = Date.now()
  await caption('elecdex — the standard preset')
  await wait(2400)

  await caption('Ctrl+Shift+G opens LAYOUTS: pick retro')
  await beat.throughTheDialog('retro')
  await caption('retro: the ELEC-16 pocket computer, its calculator and CHIP-8')
  await machine.and(page.locator('[data-asleep=true]')).waitFor({ timeout: 20_000 })
  await wait(2200)

  // The pocket given the keyboard, then forward so its LCD reads at a glance.
  await machine.focus()
  await wait(200)
  await page.keyboard.press('Control+Shift+KeyZ')
  await wait(900)
  await away()
  await machine.focus()

  say('program')
  await caption('Type BASIC on your PC — the keys go down on the ELEC-16 too')
  await line('new')
  await line('10 cls')
  await line('20 for i=1 to 5')
  await line('30 print i;"squared is ";i*i')
  await line('40 next')
  await wait(500)
  await caption('LIST, then RUN')
  await line('list')
  await wait(1800)
  await line('run')
  await caption('A table of squares, computed by its own 16-bit CPU')
  await wait(3200)

  // Back into the layout, as it was.
  await page.keyboard.press('Control+Shift+KeyZ')
  await wait(900)
  await away()
  await caption('Ctrl+Shift+F9 goes to retro directly — github.com/kurouna/elecdex')
  await wait(3200)
  await caption(null)
  say(`take: ${((Date.now() - started) / 1000).toFixed(1)} s`)
  if (exit) await app.close().catch(() => {})
})
