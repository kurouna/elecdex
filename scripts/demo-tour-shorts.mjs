/**
 * The introduction tour (demo-tour.mjs) for a vertical video (YouTube Shorts), under two
 * minutes: a tall window, layouts in two tiers under a thin strip of the clock and the system,
 * and the same beats (demo-beats.mjs).
 *
 *   boot        the boot sequence, welcoming a made-up user
 *   shell       the shells typed into over the globe, the globe brought forward and back
 *   network     through the layouts dialog: the Wi-Fi link over the connections
 *   earth       ORBIT with the pointer resting on the ISS, over the quakes
 *   dev         coding agents at work over the repository, a commit's card
 *   docker      a container stopped (asked twice), copies landing in the clipboard history
 *   media       the television (a stand-in) over the track with its cover and the spectrum
 *   utility     a QR code typed, over the tasks
 *   council     the ELEC system pane: a motion put, three units voting (a stand-in model)
 *   themes      every built-in theme in turn, on the shells
 *
 * The presets are laid out for a wide screen, so these are layouts of the take's own, kept as
 * saved layouts and reached by their number keys; each keeps the strip on top in the same place.
 * What is shown is made up or a stand-in, as in the landscape tour. The window is 540x960 at a
 * zoom of 0.75, so the workspace lays out as 720x1280 - a 9:16 frame that fits a 1080-pixel-high
 * screen; record the window and scale it to 1080x1920. Windows only, like the screenshots. Run
 * `npm run build` first, then `npm run demo:tour-shorts`: the window opens after the lead
 * (`--lead`, 10 s), plays the boot and the tour follows; close it to end, or pass `--exit`.
 * `--no-intro` skips the boot. The other options are demo-take.mjs's (`takeOptions`).
 */
import { beats, startCouncil } from './demo-beats.mjs'
import { openTake, prepareData, say, takeOptions, withDemoState } from './demo-take.mjs'

const options = takeOptions({ width: 540, height: 960, zoom: 0.75, lead: 10 })
const intro = !process.argv.includes('--no-intro')
const exit = process.argv.includes('--exit')

let nextId = 0
const pane = (widget, state) => ({
  kind: 'pane',
  id: `v${nextId++}`,
  widget,
  ...(state === undefined ? {} : { state }),
})
const split = (direction, children, sizes) => ({
  kind: 'split',
  id: `vs${nextId++}`,
  direction,
  children,
  sizes,
})
const tabs = (...children) => ({ kind: 'tabs', id: `vt${nextId++}`, children, activeIndex: 0 })

/** The strip on top of every layout: the time and the machine, in the same place throughout. */
const STRIP = 0.08
/** A layout: the strip, then its two tiers at their shares of the rest. */
const stack = (top, bottom, share) => ({
  version: 1,
  root: split(
    'column',
    [split('row', [pane('clock'), pane('sysinfo')], [0.5, 0.5]), top, bottom],
    [STRIP, share * (1 - STRIP), (1 - share) * (1 - STRIP)],
  ),
})

/*
 * The layouts, in the order the tour goes through them (Ctrl+Shift+1 .. 9 by their place). The
 * map and the television are given the width's own proportions; the lists the height they need.
 */
const LAYOUTS = [
  ['shell', () => stack(tabs(pane('terminal'), pane('terminal')), pane('globe'), 0.6)],
  ['network', () => stack(pane('wifi', { window: '1m' }), pane('connections'), 0.56)],
  ['earth', () => stack(pane('orbit'), pane('quakes'), 0.56)],
  ['dev', () => stack(pane('agents'), pane('git'), 0.42)],
  ['docker', () => stack(pane('docker'), pane('clipboard'), 0.52)],
  [
    'media',
    () =>
      stack(
        pane('web.youtubetv'),
        split('column', [pane('nowplaying'), pane('spectrum')], [0.55, 0.45]),
        0.38,
      ),
  ],
  ['utility', () => stack(pane('utility', { module: 'qr', qrKind: 'url' }), pane('todo'), 0.6)],
  ['council', () => stack(pane('elec'), pane('globe'), 0.74)],
]
const slot = (name) => LAYOUTS.findIndex(([n]) => n === name) + 1

const council = await startCouncil()
const { standIn } = await prepareData()
const items = LAYOUTS.map(([name, build], i) => ({
  id: `vtour${i}${name}`,
  name,
  tree: withDemoState(build(), standIn),
}))

if (!options.probe) {
  say(`the window opens in ${options.lead} s - start the recorder`)
  await new Promise((resolve) => setTimeout(resolve, options.lead * 1000))
}
const { app, page, wait, settled, run } = await openTake({
  items,
  options: { ...options, lead: 0 },
  standIn,
  intro,
  env: { ELECDEX_AWAKE_STUB: '1' },
  settings: council.settings,
})
const beat = beats({ app, page, wait, settled, theme: options.theme })

await run(async () => {
  const started = Date.now()
  await wait(1000)
  await beat.forward('globe', 2600)
  await beat.throughTheDialog('network')
  await wait(3500)
  await beat.toLayout(slot('earth'), 'earth')
  await wait(1200)
  await beat.issCard(2400)
  await wait(800)
  await beat.toLayout(slot('dev'), 'dev')
  await wait(2200)
  await beat.commitCard(2400)
  await beat.toLayout(slot('docker'), 'docker')
  await wait(1200)
  await beat.stopContainer()
  await beat.copies()
  await wait(600)
  await beat.toLayout(slot('media'), 'media')
  await wait(2000)
  await beat.nextTrack(3000)
  await beat.toLayout(slot('utility'), 'utility')
  await wait(800)
  await beat.qrCode(2000)
  await beat.toLayout(slot('council'), 'council')
  await wait(800)
  await beat.councilSits(4500)
  await beat.toLayout(slot('shell'), 'shell')
  // The switch ended the shells: the new one is given something to show while the themes change.
  await beat.shellTypes()
  await beat.themes(1600)
  await wait(2000)
  say(`tour: ${((Date.now() - started) / 1000).toFixed(0)} s after the boot`)
  council.close()
  if (exit) await app.close().catch(() => {})
})
