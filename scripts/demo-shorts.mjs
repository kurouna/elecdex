/**
 * The layouts demo for a vertical video (YouTube Shorts): a tall window, and layouts stacked in
 * two or three tiers under a thin strip of the clock and the system, switched one after another
 * from the layouts dialog - down one row, Enter - and last back round to the first.
 *
 * The presets are laid out for a wide screen, so these are layouts of the take's own, kept as
 * saved layouts: the dialog lists them, and each keeps the strip on top in the same place, as
 * the presets keep the system column, so a switch changes what is under it. The data is the
 * README screenshots' (demo-take.mjs).
 *
 * The window is 540x960 at a zoom of 0.75, so the workspace lays out as 720x1280 - a 9:16 frame
 * that fits a 1080-pixel-high screen; record the window and scale it to 1080x1920. Windows only,
 * like the screenshots. Run `npm run build` first, then `npm run demo:shorts`. Close the window
 * to end it. The options are demo-take.mjs's (`takeOptions`), and:
 *
 *   --tiers=3        2 for layouts in two tiers under the strip, 3 for three
 */
import { openTake, prepareData, say, takeOptions, withDemoState } from './demo-take.mjs'

const options = takeOptions({ width: 540, height: 960, zoom: 0.75 })
const TIERS = process.argv.find((a) => a.startsWith('--tiers='))?.split('=')[1] === '2' ? 2 : 3

let nextId = 0
const pane = (widget) => ({ kind: 'pane', id: `p${nextId++}`, widget })
const split = (direction, children, sizes) => ({
  kind: 'split',
  id: `s${nextId++}`,
  direction,
  children,
  sizes,
})
const tabs = (...children) => ({ kind: 'tabs', id: `t${nextId++}`, children, activeIndex: 0 })
const row = (...widgets) =>
  split(
    'row',
    widgets.map(pane),
    widgets.map(() => 1 / widgets.length),
  )

/** The strip on top of every layout: the time and the machine, in the same place throughout. */
const STRIP = 0.08
const strip = () => row('clock', 'sysinfo')

/** A layout: the strip, then its tiers top to bottom at their shares of the rest. */
const stack = (tiers, shares) => ({
  version: 1,
  root: split(
    'column',
    [strip(), ...tiers],
    [STRIP, ...shares.map((share) => share * (1 - STRIP))],
  ),
})

/*
 * The tiers, each chosen for a tall, narrow frame: the map and the television at the width's
 * own proportions, lists below them where they have the height lists need.
 */
const LAYOUTS = {
  2: [
    ['shell', () => stack([tabs(pane('terminal'), pane('terminal')), pane('globe')], [0.62, 0.38])],
    ['network', () => stack([pane('globe'), pane('connections')], [0.52, 0.48])],
    ['earth', () => stack([pane('orbit'), pane('quakes')], [0.55, 0.45])],
    ['dev', () => stack([pane('agents'), pane('git')], [0.42, 0.58])],
    ['media', () => stack([pane('web.youtubetv'), tabs(pane('web.x'), pane('rss'))], [0.36, 0.64])],
    ['desk', () => stack([pane('notes'), pane('todo')], [0.5, 0.5])],
  ],
  3: [
    [
      'shell',
      () =>
        stack(
          [tabs(pane('terminal'), pane('terminal')), row('cpu', 'memory'), pane('globe')],
          [0.48, 0.22, 0.3],
        ),
    ],
    [
      'network',
      () => stack([pane('globe'), pane('connections'), pane('throughput')], [0.44, 0.34, 0.22]),
    ],
    ['earth', () => stack([pane('orbit'), pane('quakes'), pane('weather')], [0.48, 0.28, 0.24])],
    [
      'dev',
      () =>
        stack(
          [pane('agents'), tabs(pane('terminal'), pane('terminal')), pane('git')],
          [0.36, 0.22, 0.42],
        ),
    ],
    [
      'media',
      () =>
        stack(
          [pane('web.youtubetv'), row('spectrum', 'mixer'), tabs(pane('web.x'), pane('rss'))],
          [0.36, 0.22, 0.42],
        ),
    ],
    ['desk', () => stack([pane('notes'), row('timer', 'calc'), pane('todo')], [0.4, 0.22, 0.38])],
  ],
}

const { standIn } = await prepareData()
const chosen = LAYOUTS[TIERS]
const items = chosen.map(([name, build], i) => ({
  id: `short${TIERS}${i}${name}`,
  name,
  tree: withDemoState(build(), standIn),
}))

const { page, wait, settled, run } = await openTake({ items, options, standIn })

/**
 * The layouts dialog, one row down, Enter: the chosen row blinks, the dialog powers off and the
 * next layout comes up pane by pane. From the last, the row down comes round to the first.
 */
async function nextLayout(name) {
  say('dialog: open')
  await page.keyboard.press('Control+Shift+KeyG')
  await page.getByTestId('layouts-dialog').waitFor()
  await wait(700)
  say(`dialog: down to ${name}`)
  await page.keyboard.press('ArrowDown')
  await wait(500)
  say(`dialog: ${name}`)
  await page.keyboard.press('Enter')
  await wait(400)
  await settled()
  // Out of the way of the panes, and of any card a pointer would bring up.
  await page.mouse.move(4, 4)
  await wait(options.stay * 1000)
}

await run(async () => {
  const names = chosen.map(([name]) => name)
  for (const name of [...names.slice(1), names[0]]) await nextLayout(name)
})
