/**
 * The introduction tour (demo-tour.mjs) for a vertical video (YouTube Shorts), under two
 * minutes: a tall window, layouts in two tiers under a thin strip of the clock and the system,
 * and the same beats (demo-beats.mjs).
 *
 *   boot        the boot sequence, welcoming a made-up user
 *   shell       the shells typed into over the globe
 *   network     through the layouts dialog: the Wi-Fi link over the connections
 *   earth       ORBIT over the quakes, brought forward, the pointer resting on the ISS for its
 *               card, and put back
 *   dev         coding agents at work over the repository, a commit's card, LOG WATCH
 *               behind GIT's tab lighting ERROR BURST on a made-up log
 *   docker      a container stopped (asked twice), copies landing in the clipboard history
 *   media       the television (a stand-in) over KEYSTREAM's tracks playing, the next one
 *               from the button, and the spectrum moving with them
 *   utility     a QR code typed, over the tasks
 *   keystream   the sample plugin over the processor's chart: a track typed on time
 *   retro       the ELEC-16 and the CHIP-8 behind one tab strip over the spectrum, as the retro
 *               preset has them: the ELEC-16 runs SINEWAVE from its SOFT CARD, a PLAY-320 behind
 *               the next tab flies ELECAIRCOMBAT's first sortie (brought forward), then the CHIP-8
 *               library plays T8NKS by itself, loaded across the width (no panel),
 *               then paused
 *   cockpit     CLUSTER, the machine on one pane, over a shell: its CPU lane and spec line read
 *               card by card
 *   council     the ELEC system pane: a motion put, three units voting (a stand-in model)
 *   themes      every built-in theme in turn (Black among them), on the shells
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
import {
  beats,
  CAPTIONS,
  FIGHT_PANE,
  KEYSTREAM_VOLUME,
  OPENING,
  playUnits,
  prepareMusic,
  startCouncil,
} from './demo-beats.mjs'
import { copyKeystream, keystreamPane, keystreamSettings } from './demo-keystream-kit.mjs'
import { history, LOG_ID, live } from './demo-logfeed.mjs'
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
  ['dev', () => stack(pane('agents'), tabs(pane('git'), pane('logwatch', { file: LOG_ID })), 0.42)],
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
  ['keystream', () => stack(keystreamPane(`v${nextId++}`), pane('cpu'), 0.74)],
  // As the retro preset has them: the two machines behind one tab strip, the ELEC-16 in front,
  // the spectrum at sixteen bands under them.
  [
    'retro',
    () =>
      stack(
        tabs(
          pane('elec16', { unit: 'u1', skin: 'classic', panel: false }),
          pane('elec16', FIGHT_PANE),
          pane('chip8', {
            view: 'library',
            filter: 'action',
            program: 'archive/t8nks',
            panel: false,
            listShare: 0.42,
          }),
        ),
        pane('spectrum', { bands: 16 }),
        0.7,
      ),
  ],
  // The tenth and eleventh: past the number keys, reached through the layouts dialog, a row down.
  ['cockpit', () => stack(pane('cluster'), pane('terminal'), 0.8)],
  ['council', () => stack(pane('elec'), pane('globe'), 0.74)],
]
const slot = (name) => LAYOUTS.findIndex(([n]) => n === name) + 1

const council = await startCouncil()
const music = prepareMusic()
// The made-up log, written from now to the end: its pane behind GIT's tab shows it.
history()
live.start()
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
const { app, page, wait, settled, run, caption } = await openTake({
  items,
  options: { ...options, lead: 0 },
  standIn,
  intro,
  // What elecdex is, over the boot, as in the landscape tour (demo-beats.mjs).
  opening: OPENING,
  env: music.env,
  settings: { ...council.settings, plugins: keystreamSettings(KEYSTREAM_VOLUME) },
  prepare: (profile) => {
    copyKeystream(profile)
    playUnits(profile, { third: 'ELECAIRCOMBAT' })
  },
})
const beat = beats({ app, page, wait, settled, theme: options.theme, music })

await run(async () => {
  const started = Date.now()
  // Each caption goes up as its beat begins and stays until the next: none of them waits.
  await wait(600)
  await caption(CAPTIONS.layouts)
  await beat.throughTheDialog('network')
  await wait(700)
  await caption(CAPTIONS.earth)
  await beat.toLayout(slot('earth'), 'earth')
  await wait(600)
  // ORBIT brought forward, the ISS's card read on the map at its largest.
  await caption(CAPTIONS.orbit)
  await beat.forward('orbit', 600, { during: () => beat.issCard(1500) })
  await wait(800)
  // Errors start coming as the layout arrives: ERROR BURST is lit when LOG WATCH comes forward.
  live.burst(9000)
  await caption(CAPTIONS.agents)
  await beat.toLayout(slot('dev'), 'dev')
  await wait(900)
  await caption(CAPTIONS.commit)
  await beat.commitCard(1100)
  await caption(CAPTIONS.logwatch)
  await beat.logWatch(900)
  await caption(CAPTIONS.copies)
  await beat.toLayout(slot('docker'), 'docker')
  await wait(700)
  await beat.stopContainer()
  await beat.copies()
  await wait(300)
  await caption(CAPTIONS.media)
  await beat.toLayout(slot('media'), 'media')
  await beat.musicPlays()
  await wait(1000)
  await beat.nextTrack(1200)
  await beat.musicStops()
  await caption(CAPTIONS.tasks)
  await beat.toLayout(slot('utility'), 'utility')
  await wait(800)
  await beat.qrCode(800)
  await caption(CAPTIONS.keystream)
  await beat.keystream(() => beat.toLayout(slot('keystream'), 'keystream'), {
    previews: [],
    play: 2_000,
  })
  await caption(CAPTIONS.retro)
  await beat.toLayout(slot('retro'), 'retro')
  await beat.elec16(700)
  await caption(CAPTIONS.play)
  await beat.aircombat(1800, { nth: 1, title: 1500, controls: 900, briefing: 900 })
  await caption(CAPTIONS.chip8)
  await beat.toTab('CHIP-8')
  await beat.chip8(700, { mem: false })
  await caption(CAPTIONS.cockpit)
  await beat.throughTheDialog('cockpit')
  // Two cards, not three: the cut stays under its length with the beat in it.
  await beat.cluster(300, { cards: 750, which: ['cpu', 'spec'] })
  await caption(CAPTIONS.council)
  await beat.throughTheDialog('council')
  await wait(800)
  await beat.councilSits(500)
  await caption(null)
  await beat.toLayout(slot('shell'), 'shell')
  // The switch ended the shells: the new one is given something to show while the themes change.
  await beat.shellTypes()
  await caption(CAPTIONS.themes)
  await beat.themes(500)
  await caption(CAPTIONS.outro)
  await wait(600)
  say(`tour: ${((Date.now() - started) / 1000).toFixed(0)} s after the boot`)
  if (exit) await app.close().catch(() => {})
})
// Closed here, not in the take: a take the window ended early would leave the stand-in
// listening, and Node running with nothing to do.
council.close()
live.stop()
