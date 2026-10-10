/**
 * The cockpit preset on its own, for a short landscape video: CLUSTER, the machine on one pane,
 * with shells under it and beside it, in the Black theme.
 *
 *   arrive      the preset as it opens, its lanes filling during the lead
 *   cards       the pointer resting on the CPU lane, the cores, what the machine is and the
 *               address, each card saying what its row has no room for
 *   load        a busy loop on every core, started in the right-hand shell: the cores go amber
 *               into red, and after ten seconds the CPU lamp lights and the message line says
 *               which program; the loop stopped, the pane settles back
 *   forward     the pane brought to the front of the workspace and put back
 *   resize      the divider dragged narrower in two steps, the pane laying itself out again at
 *               each (two columns of lanes, then one), and back
 *   themes      Black, White and Black again from the status bar
 *
 * What CLUSTER shows is this machine's own readings, as the system column does in every take;
 * the load is the take's own node process, a busy thread per core, stopped by Ctrl+C before the
 * take goes on (node must be on the PATH, as it is wherever the app is built). Everything else is made up
 * or a stand-in (demo-take.mjs). About a minute from the first frame.
 *
 * Windows only, like the screenshots. Run `npm run build` first, then `npm run demo:cockpit`.
 * 1600x900 unless told otherwise; the options are demo-take.mjs's (`takeOptions`) - `--theme`
 * to take it in another theme, `--shots=<dir>` to look it over - and `--exit` closes the window
 * at the end.
 */
import { MAIN, openTake, prepareData, say, takeOptions, withDemoState } from './demo-take.mjs'
import { presetTrees } from './preset-shots.mjs'

const options = takeOptions({ width: 1600, height: 900, lead: 12 })
const theme = process.argv.some((a) => a.startsWith('--theme=')) ? options.theme : 'black'
const exit = process.argv.includes('--exit')

const { standIn } = await prepareData()
const trees = await presetTrees(MAIN)
const cockpit = trees.get('cockpit')
if (cockpit === undefined) throw new Error('no preset cockpit in the built app')

const { app, page, wait, settled, run } = await openTake({
  items: [
    { id: 'cockpit', name: 'cockpit', preset: 'cockpit', tree: withDemoState(cockpit, standIn) },
  ],
  options: { ...options, theme },
  standIn,
})

const size = () => page.evaluate(() => ({ width: innerWidth, height: innerHeight }))
/** The pointer out of the way: off the cards and the status bar's edge. */
const away = async () => page.mouse.move((await size()).width / 2, 4)

/** Rests the pointer on an element long enough for its card to open and be read. */
async function rest(testid, label, seconds) {
  say(`card: ${label}`)
  await page.getByTestId(testid).first().hover()
  await wait(seconds * 1000)
}

/** The right-hand shells, top first. */
const shells = page.locator('[data-testid=pane][data-widget=terminal]:not(.hidden) .xterm-screen')

/** A line typed into the top right-hand shell. */
async function typeInShell(line) {
  const count = await shells.count()
  await shells.nth(count > 1 ? 1 : 0).click()
  await page.keyboard.type(line, { delay: 18 })
  await page.keyboard.press('Enter')
}

/** The divider between CLUSTER's column and the shells beside it: the tallest handle. */
async function divider() {
  const handles = page.getByTestId('split-handle')
  let best = null
  for (let i = 0; i < (await handles.count()); i++) {
    const box = await handles.nth(i).boundingBox()
    if (box !== null && (best === null || box.height > best.height)) best = box
  }
  return best
}

/** Drags the divider to `x` (a share of the page's width), slowly enough to see each layout. */
async function dragTo(box, from, to) {
  const { width } = await size()
  const y = box.y + box.height / 2
  await page.mouse.move(from, y)
  await page.mouse.down()
  await page.mouse.move(width * to, y, { steps: 30 })
  await page.mouse.up()
}

await run(async () => {
  const started = Date.now()
  await away()
  await wait(3000)

  await rest('cluster-figure-cpu', 'the CPU lane', 2.6)
  await rest('cluster-cores-figure', 'every core', 2.6)
  await rest('cluster-spec', 'what the machine is', 2.6)
  await rest('cluster-slot-address', 'the address', 2.2)
  await away()
  await wait(1000)

  say('load: a busy loop on every core')
  // One process, a busy thread per core: every core full at once, stopped by Ctrl+C.
  await typeInShell(
    `node -e "const{Worker}=require('worker_threads');for(const _ of require('os').cpus())new Worker('for(;;){}',{eval:true})"`,
  )
  await away()
  // The cores go hot at once; the CPU lamp waits for ten seconds of it.
  await page
    .locator('[data-testid=cluster-lamps] [data-lamp=cpu]:not([data-state=off])')
    .waitFor({ timeout: 25_000 })
    .catch(() => {})
  await wait(2000)
  await rest('cluster-message', 'what is lit', 2.6)
  say('load: stopped')
  const count = await shells.count()
  await shells.nth(count > 1 ? 1 : 0).click()
  await page.keyboard.press('Control+C')
  await away()
  await wait(4000)

  say('forward and back')
  await page
    .locator('[data-testid=pane][data-widget=cluster]')
    .click({ position: { x: 40, y: 60 } })
  await wait(300)
  await page.keyboard.press('Control+Shift+KeyZ')
  await wait(3500)
  await page.keyboard.press('Control+Shift+KeyZ')
  await wait(1500)
  await settled()

  // Narrower in two steps - short, two columns of lanes; compact, one - and back to cockpit's own.
  const box = await divider()
  if (box !== null) {
    say('resize: the divider')
    const { width } = await size()
    let at = box.x + box.width / 2
    for (const to of [0.45, 0.3, 0.7]) {
      await dragTo(box, at, to)
      at = width * to
      await wait(to === 0.7 ? 1500 : 2200)
    }
  }
  await away()

  say('themes')
  const { width, height } = await size()
  await page.mouse.move(width / 2, height - 2)
  await page.getByTestId('status-bar').and(page.locator('[data-shown=true]')).waitFor()
  await wait(600)
  const select = page.getByTestId('theme-select')
  for (const next of ['white', theme === 'black' ? 'tron' : 'black', theme]) {
    await select.selectOption(next)
    await wait(1800)
  }
  await away()
  await wait(2000)
  say(`cockpit: ${((Date.now() - started) / 1000).toFixed(0)} s`)
  if (exit) await app.close().catch(() => {})
})
