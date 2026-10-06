/**
 * What v0.0.22 added since v0.0.21, for a landscape video (X, the release notes): the pocket
 * computer's new BASIC first, then the PLAY-320's three games, then the new instruction as CODE
 * compiles it.
 *
 *   pocket   a POCKET-64 (eight rows, so a line typed stays on screen with what it printed):
 *            `\` and MOD; a pyramid of SPACE$ and STRING$; a computed GOSUB (100+K*10); a
 *            subroutine's FOR left by RETURN with the caller's loop going on, then RENUM and
 *            LIST, `GOTO 100 REM` renumbered with the rest
 *   games    the panel opened and UNIT 2 picked in TUNE: the pane becomes a PLAY-320. From
 *            GAMES: ELECLANCE in the tall coral body (the LANCE, a bomb), ELECDRILL made wide and
 *            ivory as it digs, the theme Business (Light) (chains), ELECAIRCOMBAT made the
 *            screen alone as it flies (the HUD, the gun, a lock and a missile), CORE live beside
 *            each
 *   mulq     back to UNIT 1 and into CODE: e16c's new mulShift typed, compiled, the listing
 *            scrolled to its one MULQ, and RUN on the machine
 *
 * Everything shown is the pane's own: new units on a demo profile, no system column, the games'
 * music the page's synthesiser playing the machine's channels, no gamepad (demo-take.mjs
 * `noGamepads`). Nothing of this machine is read, pressed or kept awake.
 *
 * Windows only, like the other takes. Run `npm run build` first, then `npm run demo:whatsnew22`.
 * The window is 1600x900, a 16:9 frame, the page zoomed to 1.3 so the LCD reads on a phone;
 * record the window. The take starts after the lead
 * (`--lead`, 8 s) and ends by itself; close the window to end, or pass `--exit` to close it when
 * the take is over. The options are demo-take.mjs's (`takeOptions`): `--pace` on every pause,
 * `--theme`, `--shots=<dir>` to look the take over.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  airDogfight,
  airTakeOff,
  drillDig,
  drillStart,
  hands,
  lanceStart,
  lanceWeave,
  letGoAll,
} from './demo-play-kit.mjs'
import { openTake, prepareData, say, takeOptions } from './demo-take.mjs'

const options = takeOptions({ width: 1600, height: 900, lead: 8, zoom: 1.3 })
const exit = process.argv.includes('--exit')

/*
 * One pane, two units: the pocket computer, then the game console picked in TUNE. (Two layouts
 * of a lone ELEC-16 pane each would not do: switched from one to the other, the second pane
 * comes up on the first one's unit.)
 */
const items = [
  {
    id: 'elec16',
    name: 'elec-16',
    tree: {
      version: 1,
      root: {
        kind: 'pane',
        id: 'w-elec16',
        widget: 'elec16',
        state: {
          unit: 'u1',
          skin: 'classic',
          panel: false,
          tab: 'tune',
          playBody: 'tall',
          playSkin: 'coral',
        },
      },
    },
  },
]

/** New units: a POCKET-64 and a PLAY-320 with nothing in its slot. */
function units(profile) {
  mkdirSync(path.join(profile, 'elec16'), { recursive: true })
  const unit = { clock: 4, autoOff: 10, created: 0 }
  writeFileSync(
    path.join(profile, 'elec16', 'units.json'),
    JSON.stringify({
      version: 1,
      units: [
        { ...unit, id: 'u1', name: 'UNIT 1', model: 'pocket-64' },
        { ...unit, id: 'u2', name: 'UNIT 2', model: 'play-320', xram: 512 },
      ],
    }),
  )
}

/* ---- What is typed on the pocket computer ---- */

/** A GOSUB to a line worked out as it runs; each line fits the LCD's forty columns. */
const DISPATCH = [
  '10 FOR K=1 TO 3:GOSUB 100+K*10:NEXT:END',
  '110 PRINT "ONE":RETURN',
  '120 PRINT "TWO":RETURN',
  '130 PRINT "THREE":RETURN',
]

/** The subroutine leaves its own loop by RETURN; the caller's goes on. Line 20 for RENUM. */
const LOOPS = [
  '10 FOR I=1 TO 3:GOSUB 50:PRINT:NEXT I',
  '20 GOTO 100 REM DONE',
  '50 FOR J=1 TO 9:IF J>I THEN RETURN',
  '60 PRINT J;:NEXT J',
  '100 PRINT "DONE"',
]

const { standIn } = await prepareData()
const { app, page, wait, settled, run } = await openTake({
  items,
  options,
  standIn,
  prepare: units,
})

const visible = (testId) => page.locator(`[data-testid=pane]:not(.hidden) [data-testid=${testId}]`)
const machine = () => visible('elec16').first()
const gate = hands()

/** The pointer out of the way: off the pane's cards and the status bar's edge. */
const away = async () => {
  const width = await page.evaluate(() => innerWidth)
  await page.mouse.move(width / 2, 4)
}

/** A press on one of the pane's buttons, the pointer brought to it first; the keys back after. */
async function press(locator, pause = 500) {
  await locator.hover()
  await wait(250)
  await locator.click({ delay: 60 })
  await machine().focus()
  await wait(pause)
}

const tab = (name, pause) =>
  press(page.locator(`[data-testid=elec16-tab][data-tab=${name}]`), pause)

/* ---- 1. The pocket computer's BASIC ---- */

const asleep = () =>
  page.locator('[data-testid=elec16][data-asleep=true]').first().waitFor({ timeout: 30_000 })

/** Typed on the machine's keys, as a person would, ENTER after it. */
async function typeLine(text, delay = 40) {
  await machine().focus()
  await page.keyboard.type(text, { delay })
  await page.keyboard.press('Enter')
}

/** The CLS key (Home on the PC): a clean screen for the next thing shown. */
async function cls() {
  await machine().focus()
  await page.keyboard.press('Home')
  await wait(350)
}

async function program(lines) {
  await typeLine('NEW', 45)
  await wait(200)
  await cls()
  for (const line of lines) {
    await typeLine(line, 20)
    await wait(120)
  }
  await wait(400)
}

async function pocket() {
  await asleep()
  await away()
  await wait(800)

  say('basic: \\ and MOD')
  await typeLine('PRINT 17\\5;17 MOD 5', 55)
  await wait(2200)

  say('basic: SPACE$ and STRING$')
  await cls()
  await typeLine('FOR I=1 TO 5:PRINT SPACE$(20-2*I);STRING$(4*I-3,"*"):NEXT I', 35)
  await wait(2500)

  say('basic: a computed GOSUB')
  await program(DISPATCH)
  await cls()
  await typeLine('RUN', 60)
  await wait(2200)

  say('basic: FOR in a subroutine, RENUM')
  await program(LOOPS)
  await cls()
  await typeLine('RUN', 60)
  await wait(2400)
  await cls()
  await typeLine('RENUM', 55)
  await wait(500)
  await typeLine('LIST', 55)
  await wait(3500)
}

/* ---- 2. The games ---- */

/** The body (tall, wide, screen) and its colour (graphite, ivory, coral), from TUNE. */
async function body(shape, colour = null, back = 'core') {
  say(`body: ${shape}${colour === null ? '' : ` ${colour}`}`)
  await tab('tune', 300)
  await press(page.locator(`[data-testid=elec16-play-body-mode][data-body=${shape}]`), 700)
  if (colour !== null) {
    await press(page.locator(`[data-testid=elec16-play-skin][data-skin=${colour}]`), 700)
  }
  await tab(back, 300)
}

/** The app's theme from the status bar's select, as a hand would; the keys back to the machine. */
async function theme(id) {
  say(`theme: ${id}`)
  const { width, height } = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }))
  await page.mouse.move(width / 2, height - 2, { steps: 6 })
  await page.getByTestId('status-bar').and(page.locator('[data-shown=true]')).waitFor()
  await wait(400)
  await page.getByTestId('theme-select').selectOption(id)
  await wait(400)
  await away()
  await machine().focus()
}

/** A game from the shelf into the slot (the machine starts again at its start screen). */
async function insert(id) {
  say(`games: ${id} into the slot`)
  await tab('games', 500)
  await press(page.locator(`[data-testid=elec16-game][data-game=${id}]`), 1100)
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

/** The panel opened on TUNE, and UNIT 2 picked: the pane becomes a PLAY-320. */
async function toPlay() {
  say('tune: UNIT 2, the PLAY-320')
  await press(page.getByTestId('elec16-panel-toggle'), 700)
  await press(page.locator('[data-testid=elec16-unit][data-unit=u2]'), 300)
  await page.getByTestId('elec16-play-screen').waitFor({ timeout: 15_000 })
  await away()
  await wait(1000)
}

async function lance() {
  await insert('ELECLANCE')
  await tab('core', 200)
  await lanceStart(page, wait)
  await wait(2100)
  await lanceWeave(page, wait, 5000, { bombAt: 3800, lanceEvery: 4 })
  await letGoAll(page)
}

async function drill() {
  await insert('ELECDRILL')
  await drillStart(page, wait, { title: 2200, controls: 1600 })
  await alongside(
    () => drillDig(page, wait, 7000, { gate }),
    [
      [1200, () => body('wide', 'ivory')],
      [1200, () => theme('business-light')],
    ],
  )
  await letGoAll(page)
}

async function aircombat() {
  await insert('ELECAIRCOMBAT')
  await airTakeOff(page, wait, { title: 2800, controls: 1500, briefing: 1500 })
  // Head-on with the first ace: the gun, and a missile once it is locked.
  await page.keyboard.down('KeyZ')
  await wait(800)
  await page.keyboard.press('KeyX')
  await wait(1800)
  await page.keyboard.up('KeyZ')
  await alongside(() => airDogfight(page, wait, 5500, { gate }), [[1500, () => body('screen')]])
  await letGoAll(page)
}

/* ---- 3. MULQ, through e16c's mulShift in CODE ---- */

/** A fixed-point multiply in CODE: e16c's mulShift is one MULQ. */
const MULSHIFT = `// mulShift(a, b, k): (a * b) >> k as one MULQ.
export function main(): void {
  cls()
  let x: i16 = 256 // 1.0 in Q8
  for (let k: u16 = 0; k < 6; k++) {
    putnum(u16(x))
    newline()
    x = mulShift(x, 384, 8) // times 1.5
  }
}
`

async function mulq() {
  say('tune: back to UNIT 1')
  await tab('tune', 300)
  await press(page.locator('[data-testid=elec16-unit][data-unit=u1]'), 300)
  await asleep()
  await wait(600)
  say('code: mulShift')
  await press(visible('elec16-view-toggle'), 600)
  const source = visible('elec16-source')
  await source.click()
  await page.keyboard.press('Control+A')
  await page.keyboard.press('Delete')
  await page.keyboard.type(MULSHIFT, { delay: 9 })
  await wait(500)
  await press(visible('elec16-compile'), 300)
  await visible('elec16-levels').waitFor({ timeout: 60_000 })
  await away()
  // The listing brought to the MULQ, as a hand scrolls to it.
  await visible('elec16-asm').evaluate((pre) => {
    const lines = pre.textContent.split('\n')
    const at = lines.findIndex((l) => l.trim().startsWith('mulq '))
    if (at < 0) return
    const step = pre.scrollHeight / lines.length
    pre.scrollTo({ top: Math.max(0, (at - 4) * step), behavior: 'smooth' })
  })
  await wait(700)
  // And the pointer brought to the end of the line, as a hand points at it.
  const line = await visible('elec16-asm').evaluate((pre) => {
    const text = [...pre.childNodes].find((n) => n.nodeType === Node.TEXT_NODE)
    const content = text?.textContent ?? ''
    const start = content.search(/^[ \t]*mulq\s/m)
    if (text === undefined || start < 0) return null
    const end = content.indexOf('\n', start)
    const range = document.createRange()
    range.setStart(text, start)
    range.setEnd(text, end < 0 ? content.length : end)
    const box = range.getBoundingClientRect()
    return { x: box.right + 6, y: box.top + box.height / 2 }
  })
  if (line !== null) await page.mouse.move(line.x, line.y, { steps: 14 })
  say(line === null ? 'code: no MULQ line found' : `code: pointing at ${Math.round(line.y)}`)
  await wait(2200)
  say('code: RUN')
  await press(visible('elec16-run'), 300)
  await wait(2600)
}

await run(async () => {
  await settled()
  const started = Date.now()
  const at = (what) => say(`${what} at ${((Date.now() - started) / 1000).toFixed(1)} s`)

  at('pocket')
  await pocket()

  at('games')
  await toPlay()
  at('ELECLANCE')
  await lance()
  at('ELECDRILL')
  await drill()
  at('ELECAIRCOMBAT')
  await aircombat()

  at('mulq')
  await mulq()
  at('end')
  await wait(800)
  if (exit) await app.close().catch(() => {})
})
