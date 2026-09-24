/**
 * The layout presets, driven for a screen recording (a post on X): from standard, the layouts
 * dialog opens, the keyboard goes onto the shelf of presets, steps along to the next card and
 * Enter takes it - network, earth, dev, media, desk - and last back round to standard, each one
 * left on screen for a moment.
 *
 * Each preset is already among the saved layouts, with the state its panes need (a repository,
 * a feed), so choosing its card goes to that layout: the card is what is chosen, and what comes
 * up is the preset with something in it. The data is the README screenshots' (demo-take.mjs).
 *
 * Windows only, like the screenshots. Run `npm run build` first, then `npm run demo:presets`.
 * Close the window to end it. The options are demo-take.mjs's (`takeOptions`); the window is
 * 1600x900 unless told otherwise.
 */

import { MAIN, openTake, prepareData, say, takeOptions, withDemoState } from './demo-take.mjs'
import { presetTrees } from './preset-shots.mjs'

const options = takeOptions({ width: 1600, height: 900 })

/** The presets in the order the dialog lists them. */
const ORDER = ['standard', 'network', 'earth', 'dev', 'media', 'desk']

const { standIn } = await prepareData()
const trees = await presetTrees(MAIN)
const items = ORDER.map((id, i) => {
  const tree = trees.get(id)
  if (tree === undefined) throw new Error(`no preset ${id} in the built app`)
  return { id: `demo${i}${id}`, name: id, preset: id, tree: withDemoState(tree, standIn) }
})

const { page, wait, settled, run } = await openTake({ items, options, standIn })

/**
 * The layouts dialog, onto the card of the preset in use, one step along the shelf, Enter: the
 * chosen card blinks, the dialog powers off and the next preset comes up pane by pane. From
 * desk, the step along comes round to standard.
 */
async function nextPreset(from, name) {
  say('dialog: open')
  await page.keyboard.press('Control+Shift+KeyG')
  await page.getByTestId('layouts-dialog').waitFor()
  await wait(700)
  say(`shelf: ${from}`)
  // Onto the shelf from the keyboard, so the card shows the keyboard's ring.
  await page.locator(`[data-testid=layouts-preset][data-preset="${from}"]`).focus()
  await wait(500)
  say(`shelf: along to ${name}`)
  await page.keyboard.press('ArrowRight')
  await wait(500)
  say(`shelf: ${name}`)
  await page.keyboard.press('Enter')
  await wait(400)
  await settled()
  // Out of the way of the panes, and of any card a pointer would bring up.
  await page.mouse.move(options.width / 2, 4)
  await wait(options.stay * 1000)
}

await run(async () => {
  for (const [i, name] of [...ORDER.slice(1), ORDER[0]].entries()) {
    await nextPreset(ORDER[i], name)
  }
})
