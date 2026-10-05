/**
 * The PLAY-320's three games, for an introduction video: each put in the slot from GAMES and
 * started, then played by a scripted pad while the body, its colour and the app's theme change
 * round it, and CORE beside it shows the E16 running the game - its registers and the code at
 * the program counter moving - with a look at MEM on the way.
 *
 *   opening        a PLAY-320 in its wide graphite body at the start screen, GAMES open, the
 *                  slot empty
 *   ELECAIRCOMBAT  put in, START, its title, controls and briefing; CORE; the first ace head-on,
 *                  the gun and a missile once it is locked; then the dogfight, flown by the HUD
 *                  (docs/elec16-elecaircombat.md), the body made the screen alone, the theme
 *                  Phosphor, a look at MEM
 *   ELECLANCE      put in (the machine starts again), the tall coral body, Business (Dark), EASY:
 *                  weaving and shooting, the LANCE, a bomb, MEM's video memory, CORE again
 *   ELECDRILL      put in, the wide ivory body, Business (Light), EASY: digging down through
 *                  LOAM, a chain or two, the body made tall, Amber
 *   close          the panel folded away, the well on its own
 *
 * The games' music and sounds are the page's own synthesiser playing the machine's sixteen
 * channels: nothing of this machine's sound is captured or shown. No gamepad reaches the page
 * (demo-take.mjs `noGamepads`), the unit is a new one on a demo profile, and the take is all the
 * pane's own, with the system column of every take beside it. About two minutes.
 *
 * Windows only, like the screenshots. Run `npm run build` first, then `npm run demo:games`. The
 * take starts after the lead (`--lead`, 8 s: start the recorder on the region the --probe run
 * showed); close the window to end, or pass `--exit`. The other options are demo-take.mjs's
 * (`takeOptions`): 1600x900 unless told otherwise, `--theme` (Tron), `--pace` on every pause,
 * `--shots=<dir>` to look the take over.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  airDogfight,
  drillDig,
  drillStart,
  hands,
  lanceStart,
  lanceWeave,
  letGoAll,
  padOf,
} from './demo-play-kit.mjs'
import { openTake, prepareData, say, takeOptions } from './demo-take.mjs'

const options = takeOptions({ width: 1600, height: 900, lead: 8 })
const exit = process.argv.includes('--exit')

/** The system column beside the machine, as the README's ELEC-16 shots have it, then the pane. */
const tree = {
  version: 1,
  root: {
    kind: 'split',
    id: 'g-row',
    direction: 'row',
    sizes: [0.17, 0.83],
    children: [
      {
        kind: 'split',
        id: 'g-system',
        direction: 'column',
        sizes: [0.08, 0.34, 0.24, 0.34],
        children: ['clock', 'cpu', 'memory', 'throughput'].map((widget) => ({
          kind: 'pane',
          id: `g-${widget}`,
          widget,
        })),
      },
      {
        kind: 'pane',
        id: 'g-play',
        widget: 'elec16',
        state: { unit: 'u1', tab: 'games', playBody: 'wide', playSkin: 'graphite', panel: true },
      },
    ],
  },
}

/** A new PLAY-320 with nothing in its slot: the take puts each game in from the shelf. */
function playUnit(profile) {
  mkdirSync(path.join(profile, 'elec16'), { recursive: true })
  const unit = { id: 'u1', name: 'UNIT 1', clock: 4, model: 'play-320', autoOff: 10, xram: 512 }
  writeFileSync(
    path.join(profile, 'elec16', 'units.json'),
    JSON.stringify({ version: 1, units: [{ ...unit, created: 0 }] }),
  )
}

const { standIn } = await prepareData()
const { app, page, wait, run } = await openTake({
  items: [{ id: 'games', name: 'games', tree }],
  options,
  standIn,
  prepare: playUnit,
})

const machine = page.getByTestId('elec16')
const byId = (id) => page.getByTestId(id)
const pad = padOf(page, wait)
const gate = hands()

/** The pointer out of the way: off the panes' cards and the status bar's edge. */
const away = async () => {
  const width = await page.evaluate(() => innerWidth)
  await page.mouse.move(width / 2, 4)
}

/** A press on one of the pane's buttons, the pointer brought to it first; the keys back after. */
async function press(locator, pause = 500) {
  await locator.hover()
  await wait(250)
  await locator.click({ delay: 60 })
  await machine.focus()
  await wait(pause)
}

const tab = (name, pause) =>
  press(page.locator(`[data-testid=elec16-tab][data-tab=${name}]`), pause)

/** The body (auto, tall, wide, screen) and its colour (graphite, ivory, coral), from TUNE. */
async function body(shape, colour = null, back = 'core') {
  say(`body: ${shape}${colour === null ? '' : ` ${colour}`}`)
  await tab('tune', 400)
  await press(page.locator(`[data-testid=elec16-play-body-mode][data-body=${shape}]`), 900)
  if (colour !== null) {
    await press(page.locator(`[data-testid=elec16-play-skin][data-skin=${colour}]`), 900)
  }
  await tab(back, 300)
}

/** The app's theme from the status bar's select, as a hand would; the keys back to the machine. */
async function theme(id) {
  say(`theme: ${id}`)
  const { width, height } = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }))
  await page.mouse.move(width / 2, height - 2, { steps: 6 })
  await page.getByTestId('status-bar').and(page.locator('[data-shown=true]')).waitFor()
  await wait(500)
  await byId('theme-select').selectOption(id)
  await wait(400)
  await away()
  await machine.focus()
}

/** MEM for a look (`space`: cpu, xram, video), then back to CORE. */
async function memLook(space, hold = 2600) {
  say(`mem: ${space}`)
  await tab('mem', 300)
  const button = page.locator(`[data-testid=elec16-mem-space][data-space=${space}]`)
  if ((await button.count()) > 0) await press(button, 0)
  await wait(hold)
  await tab('core', 300)
}

/** A game from the shelf into the slot (the machine starts again at its start screen). */
async function insert(id) {
  say(`games: ${id} into the slot`)
  await tab('games', 600)
  await press(page.locator(`[data-testid=elec16-game][data-game=${id}]`), 1400)
  await away()
}

/** Moves made beside the play, each with the pad let go of while the move is made. */
async function alongside(play, moves) {
  await Promise.all([
    play(),
    (async () => {
      for (const [after, move] of moves) {
        await wait(after)
        await gate.aside(wait, move)
      }
    })(),
  ])
}

await run(async () => {
  const started = Date.now()
  const at = (what) => say(`${what} at ${((Date.now() - started) / 1000).toFixed(1)} s`)
  await machine.waitFor()
  await wait(2500)

  /* ---- ELECAIRCOMBAT ---- */
  at('ELECAIRCOMBAT')
  await insert('ELECAIRCOMBAT')
  await machine.focus()
  await pad.hold('Enter')
  await wait(3500)
  await pad.hold('KeyZ')
  await wait(2500)
  await pad.hold('KeyZ')
  // The briefing: CORE comes up beside it, then A takes off.
  await wait(900)
  await tab('core', 1300)
  await pad.hold('KeyZ')
  await wait(500)
  // Head-on with the first ace: the gun, and a missile once it is locked.
  at('head-on')
  await wait(100)
  await pad.down('KeyZ')
  await wait(700)
  await pad.hold('KeyX', 100)
  await wait(2200)
  await pad.up('KeyZ')
  at('dogfight')
  await alongside(
    () => airDogfight(page, wait, 27_000, { gate }),
    [
      [5000, () => body('screen')],
      [5000, () => theme('phosphor')],
      [4000, () => memLook('cpu', 2400)],
    ],
  )
  await letGoAll(page)

  /* ---- ELECLANCE ---- */
  at('ELECLANCE')
  await insert('ELECLANCE')
  await body('tall', 'coral', 'core')
  await theme('business-dark')
  await lanceStart(page, wait)
  await wait(3200)
  at('stage')
  await alongside(
    () => lanceWeave(page, wait, 22_000, { bombAt: 15_000, lanceEvery: 5, gate }),
    [[9000, () => memLook('video', 2800)]],
  )
  await letGoAll(page)

  /* ---- ELECDRILL ---- */
  at('ELECDRILL')
  await insert('ELECDRILL')
  await body('wide', 'ivory', 'core')
  await theme('business-light')
  await drillStart(page, wait)
  at('well')
  await alongside(
    () => drillDig(page, wait, 24_000, { gate }),
    [
      [8000, () => body('tall', 'graphite')],
      [5000, () => theme('amber')],
    ],
  )
  await letGoAll(page)

  /* ---- close ---- */
  at('close')
  await press(byId('elec16-panel-toggle'), 300)
  await away()
  await drillDig(page, wait, 4000)
  await letGoAll(page)
  await wait(1500)
  at('end')
  if (exit) await app.close().catch(() => {})
})
