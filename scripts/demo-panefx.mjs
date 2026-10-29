/**
 * The panes at work, for a short landscape video: how the workspace moves, in the dev preset.
 *
 *   arrive      the standard layout, then the dev preset's key: the screen powers off and dev
 *               comes up pane by pane
 *   keys        Ctrl+Shift+Arrow walks the keyboard round the panes by where they are, each
 *               pane's frame flaring as the keyboard reaches it
 *   tabs        Ctrl+Tab through the clipboard's group and back with Ctrl+Shift+Tab, each tab
 *               flickering on as a set changing channel
 *   split       a shell split off beside the containers: it powers on, and the group that gave
 *               it room lights the edge that moved
 *   move        the new shell dragged by its title: brackets mark where it would land, it flies
 *               there, and the panes it leaves extend into the room
 *   as a tab    dragged again with Ctrl held, into the repository's group: it flickers on there
 *   forward     the group brought to the front and put back
 *   undo        the agents pane closed, powering off as its neighbours extend, and put back from
 *               its notice: it powers on again where it was
 *
 * Everything shown is a stand-in (demo-take.mjs): the agent's session, the repository, the
 * containers, the clipboard. The system column is this machine's readings, as in every take.
 * About 52 seconds from the first frame, captioned in English.
 *
 * Windows only, like the screenshots. Run `npm run build` first, then `npm run demo:panefx`.
 * 1600x900 unless told otherwise; the options are demo-take.mjs's (`takeOptions`) - `--theme`,
 * `--pace`, `--shots=<dir>` to look it over, `--no-captions` - and `--exit` closes the window at
 * the end.
 */
import { beats } from './demo-beats.mjs'
import { MAIN, openTake, prepareData, say, takeOptions, withDemoState } from './demo-take.mjs'
import { presetTrees } from './preset-shots.mjs'

const options = takeOptions({ width: 1600, height: 900, lead: 10 })
const exit = process.argv.includes('--exit')

/** The captions, in the order the take puts them up. */
const CAPTIONS = {
  arrive: 'One key to the dev preset: the screen powers off, and dev comes up pane by pane',
  keys: 'Ctrl+Shift+Arrows move the keyboard by where the panes are — the frame flares',
  tabs: 'Ctrl+Tab steps through a group — each tab flickers on, like a changed channel',
  split: 'Split a pane: the new one powers on, and the edge that gave it room lights',
  move: 'Drag a pane by its title: brackets mark where it lands, and it flies there',
  tab: 'Hold Ctrl to drop it in as a tab — it flickers on in its new group',
  forward: 'Ctrl+Shift+Z brings a pane to the front, and puts it back',
  close: 'Close one by mistake — its neighbours take the room',
  undo: 'Undo puts it back where it was',
  outro: 'elecdex — panes that move like a CRT',
}

const { standIn } = await prepareData()
const trees = await presetTrees(MAIN)
const preset = (id, i) => {
  const tree = trees.get(id)
  if (tree === undefined) throw new Error(`no preset ${id} in the built app`)
  return { id: `panefx${i}${id}`, name: id, preset: id, tree: withDemoState(tree, standIn) }
}

const { app, page, wait, settled, run, caption } = await openTake({
  items: [preset('standard', 0), preset('dev', 1)],
  options,
  standIn,
})
const { paneOf, press, away } = beats({ app, page, wait, settled, theme: options.theme })

/** The pane that has the keyboard, by its widget, as the frame marks it. */
const focused = () =>
  page.evaluate(
    () => document.querySelector('[data-testid=pane].focused')?.getAttribute('data-widget') ?? '',
  )

/** Nothing typed into: a field keeps Ctrl+Shift+Arrow and Ctrl+Tab for itself. */
const letGo = () => page.evaluate(() => document.activeElement?.blur())

/** A key pressed with the keyboard nowhere in particular, then a pause to see it. */
async function key(chord, ms) {
  await letGo()
  await page.keyboard.press(chord)
  say(`${chord}: ${await focused()}`)
  await wait(ms)
}

/** Waits until nothing is flying, extending or lit any more. */
const still = () =>
  page
    .locator('[data-testid=workspace][data-switching=false][data-reflowing=false]')
    .waitFor({ timeout: 15_000 })
    .catch(() => {})

/** A shown pane's box, by a locator. */
async function boxOf(locator) {
  const box = await locator.boundingBox()
  if (box === null) throw new Error('nothing to measure')
  return box
}

/**
 * Drags `handle` to (x, y) slowly, as a hand would, holding over the target so the brackets are
 * seen before it is dropped. With `ctrl`, Ctrl is pressed over the target: a drop as a tab.
 */
async function drag(handle, x, y, { ctrl = false } = {}) {
  const from = await boxOf(handle)
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await wait(300)
  await page.mouse.down()
  await page.mouse.move(x, y, { steps: 45 })
  // Ctrl pressed over the target, as a hand does: the brackets turn into the strip's caret.
  if (ctrl) {
    await wait(600)
    await page.keyboard.down('Control')
  }
  await wait(1100)
  await page.mouse.up()
  if (ctrl) await page.keyboard.up('Control')
  await still()
}

/**
 * Starts noting every effect the panes and groups play, to say at the end: they last a few
 * hundred milliseconds, too short for the shots taken every two seconds to be sure of.
 */
const noteEffects = () =>
  page.evaluate(() => {
    const seen = new Set()
    Object.assign(window, { panefxSeen: seen })
    const note = (element) => {
      for (const name of element.classList) if (name.startsWith('crt-')) seen.add(name)
    }
    new MutationObserver((records) => {
      for (const { target } of records) if (target instanceof HTMLElement) note(target)
    }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] })
  })

/** The new shell's own header: the shell pane outside any group. */
const loneShell = () =>
  page.locator('[data-testid=pane][data-widget=terminal][data-chrome=shell]:not(.hidden)')

await run(async () => {
  const started = Date.now()
  await noteEffects()
  await away()
  await wait(2500)

  // The dev preset's key: a switch to the layout made from it.
  await caption(CAPTIONS.arrive)
  await letGo()
  await page.keyboard.press('Control+Shift+F4')
  await settled()
  await wait(3200)

  await caption(CAPTIONS.keys)
  await paneOf('agents').click({ position: { x: 60, y: 80 } })
  await wait(900)
  for (const [chord, ms] of [
    ['Control+Shift+ArrowRight', 1100],
    ['Control+Shift+ArrowLeft', 1000],
    ['Control+Shift+ArrowDown', 1000],
    ['Control+Shift+ArrowDown', 1000],
    ['Control+Shift+ArrowLeft', 1100],
    ['Control+Shift+ArrowRight', 1000],
    ['Control+Shift+ArrowUp', 1000],
    ['Control+Shift+ArrowUp', 1200],
  ]) {
    await key(chord, ms)
  }

  await caption(CAPTIONS.tabs)
  await paneOf('clipboard').click({ position: { x: 60, y: 80 } })
  await wait(800)
  for (const chord of ['Control+Tab', 'Control+Tab', 'Control+Shift+Tab', 'Control+Shift+Tab']) {
    await key(chord, 1100)
  }

  // The shell behind the containers, split off to the right of their group.
  await caption(CAPTIONS.split)
  // Its tab by the pane's id: a shell's tab is named after its folder.
  const group = page.getByTestId('tabs-host').filter({ has: paneOf('docker') })
  const shellId = await group
    .locator('[data-testid=pane][data-widget=terminal]')
    .getAttribute('data-pane-id')
  await press(group.locator(`[data-testid=tab][data-pane-id="${shellId}"]`))
  await wait(900)
  await letGo()
  await page.keyboard.press('Control+Shift+KeyE')
  await still()
  await wait(2200)

  // Dropped beside the repository's group, on its left: the room it leaves is taken back.
  await caption(CAPTIONS.move)
  const repo = await boxOf(page.getByTestId('tabs-host').filter({ has: paneOf('git') }))
  await drag(loneShell().locator('.pane-head'), repo.x + 24, repo.y + repo.height / 2)
  await wait(2000)

  // And into the repository's group as a tab, on its strip.
  await caption(CAPTIONS.tab)
  const strip = await boxOf(
    page
      .getByTestId('tabs-host')
      .filter({ has: paneOf('git') })
      .getByTestId('tab-strip'),
  )
  await drag(
    loneShell().locator('.pane-head'),
    strip.x + strip.width * 0.8,
    strip.y + strip.height / 2,
    {
      ctrl: true,
    },
  )
  const joined = await page
    .getByTestId('tabs-host')
    .filter({ has: paneOf('git') })
    .locator('[data-testid=pane][data-widget=terminal]')
    .count()
  say(`as a tab: ${joined > 0 ? 'joined the group' : 'did not join'}`)
  await wait(2200)

  // Round to the repository's own tab, then the group to the front with its diff.
  await caption(CAPTIONS.forward)
  await key('Control+Tab', 1000)
  await page.keyboard.press('Control+Shift+KeyZ')
  await wait(3200)
  await page.keyboard.press('Escape')
  await wait(1800)

  await caption(CAPTIONS.close)
  await paneOf('agents').click({ position: { x: 60, y: 80 } })
  await wait(700)
  await letGo()
  await page.keyboard.press('Control+Shift+KeyW')
  await still()
  await wait(1600)
  await caption(CAPTIONS.undo)
  const notice = page.getByTestId('toast').filter({ hasText: 'closed' })
  await press(notice.getByTestId('toast-action').filter({ hasText: 'undo' }))
  await still()
  await away()
  await wait(2400)

  await caption(CAPTIONS.outro)
  await key('Control+Shift+ArrowRight', 1200)
  await key('Control+Shift+ArrowLeft', 2600)
  await caption(null)
  await wait(800)
  const seen = await page.evaluate(() => [...window.panefxSeen].sort().join(' '))
  say(`effects played: ${seen}`)
  say(`panefx: ${((Date.now() - started) / 1000).toFixed(0)} s`)
  if (exit) await app.close().catch(() => {})
})
