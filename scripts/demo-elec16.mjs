/**
 * The ELEC-16 on its own, for a recording: a window that holds the one pane, sized to the
 * pocket computer, and a take of its everyday use - switched on, a calculation and the ANS key,
 * a BASIC program typed in, LISTed, RUN, stopped with BRK and RUN again; programs from the SOFT
 * CARD loaded from FILES (SINEWAVE, LANDER landed, BOUNCE, ASMDEMO); TypeScript compiled in
 * CODE, its levels compared and RUN on the machine; the skins in turn. About three minutes.
 *
 * Nothing of this machine is shown: the unit is a new one on a demo profile, and the take is
 * all the pane's own. The window is 1280x600, the body with a little room round it; record it
 * as it is. Windows only, like the
 * screenshots. Run `npm run build` first, then `npm run demo:elec16`, and close the window to
 * end it. The options are demo-take.mjs's (`takeOptions`): `--probe` to place the window,
 * `--pace` to slow or quicken it, `--shots=<dir>` to look the take over.
 */
import { openTake, prepareData, say, takeOptions } from './demo-take.mjs'

const options = takeOptions({ width: 1280, height: 600, zoom: 1, lead: 6 })

const tree = {
  version: 1,
  root: {
    kind: 'pane',
    id: 'p-elec16',
    widget: 'elec16',
    state: { skin: 'classic', panel: false, tab: 'files' },
  },
}

/** BASIC's moving circle (docs/elec16-basic.md): a key ends it. */
const CIRCLE = [
  '10 REM MOVING CIRCLE',
  '20 W=LCDW:H=LCDH:Y=INT(H/2):R=Y-2',
  '30 FOR X=R TO W-R-1 STEP 3',
  '40 CLS:CIRCLE (X,Y),R:WAIT 1',
  '50 IF INKEY$<>"" THEN END',
  '60 NEXT X',
  '70 FOR X=W-R-1 TO R STEP -3',
  '80 CLS:CIRCLE (X,Y),R:WAIT 1',
  '90 IF INKEY$<>"" THEN END',
  '100 NEXT X',
  '110 GOTO 30',
]

/** CODE's program: a pattern dot by dot, as machine code. */
const PATTERN = `// A pattern, dot by dot: TypeScript compiled for the ELEC-16.
export function main(): void {
  cls()
  const w = peek16(0xff20)
  const h = peek16(0xff22)
  for (let y: u16 = 0; y < h; y++) {
    for (let x: u16 = 0; x < w; x++) {
      if (((x ^ y) & 8) !== 0) pset(x, y)
    }
  }
}
`

/** LANDER landed (docs/elec16-soft.md): 13 seconds, touching down at 2.5 m/s. */
const BURNS = [10, 10, 10, 10, 10, 10, 10, 15, 25, 30, 30, 30, 25]

const SKINS = ['tron', 'ivory', 'night', 'business-light', 'business-dark', 'elec', 'classic']

const { standIn } = await prepareData()
const { page, wait, run } = await openTake({
  items: [{ id: 'elec16', name: 'elec-16', tree }],
  options,
  standIn,
})

const machine = page.getByTestId('elec16')
const byId = (id) => page.getByTestId(id)

/** Asleep at a prompt (or waiting for keys at an INPUT). */
const asleep = () =>
  page.locator('[data-testid=elec16][data-asleep=true]').waitFor({ timeout: 30_000 })

/** A press on one of the pane's buttons, the pointer brought to it first. */
async function press(locator, pause = 500) {
  await locator.hover()
  await wait(250)
  await locator.click({ delay: 60 })
  await wait(pause)
}

/** Typed on the machine's keys, as a person would, ENTER after it unless told not to. */
async function typeLine(text, { delay = 55, enter = true } = {}) {
  await machine.focus()
  await page.keyboard.type(text, { delay })
  if (enter) await page.keyboard.press('Enter')
}

/** A key that ends a program waiting for one (INKEY$), and the screen cleared after it. */
async function anyKey() {
  await machine.focus()
  await page.keyboard.press('x')
  await wait(900)
  await clearScreen()
}

/** The CLS key: what a program drew goes before the next thing is shown. */
const clearScreen = () => press(page.locator('[data-testid=elec16-key][data-key=cls]'), 600)

async function panel(open) {
  const shown = (await byId('elec16-panel').count()) > 0
  if (shown !== open) await press(byId('elec16-panel-toggle'), 700)
}

const tab = (name) => press(page.locator(`[data-testid=elec16-tab][data-tab=${name}]`), 600)
const soft = (name) => page.locator(`[data-testid=elec16-soft-file][data-name="${name}"]`)

/**
 * A SOFT CARD program picked (its help shows) and loaded with LOAD ▸, on a cleared screen: a
 * program draws on what the last one left, as BASIC keeps the screen.
 */
async function loadSoft(name, read = 1800) {
  say(`soft card: ${name}`)
  await press(page.locator('[data-testid=elec16-key][data-key=cls]'), 300)
  await press(soft(name), read)
  await press(byId('elec16-load'), 600)
  await asleep()
  await wait(500)
}

await run(async () => {
  await asleep()
  await wait(1000)

  say('power: off and on')
  await press(byId('elec16-power'), 1200)
  await press(byId('elec16-power'), 300)
  await asleep()
  await wait(1800)

  say('a calculation, ANS')
  await typeLine('3*4+SIN 30')
  await wait(1200)
  await press(page.locator('[data-testid=elec16-key][data-key=ans]'), 300)
  await typeLine('*2', { delay: 120 })
  await wait(1200)
  await typeLine('SQR 2*PI')
  await wait(1800)

  say('a program typed in')
  await typeLine('NEW')
  await wait(400)
  await press(page.locator('[data-testid=elec16-key][data-key=cls]'), 400)
  for (const line of CIRCLE) {
    await typeLine(line, { delay: 35 })
    await wait(150)
  }
  await wait(600)
  await typeLine('LIST 10-50')
  await wait(2500)

  say('RUN, BRK, RUN')
  await typeLine('RUN')
  await wait(5000)
  await press(byId('elec16-brk'), 1800)
  await typeLine('RUN')
  await wait(4500)
  await anyKey()
  await wait(1200)

  say('the SOFT CARD')
  await panel(true)
  await tab('files')
  await loadSoft('SINEWAVE.BAS')
  await typeLine('RUN')
  await wait(6000)
  await anyKey()

  await loadSoft('LANDER.BAS')
  await typeLine('RUN')
  await wait(1200)
  for (const burn of BURNS) {
    await typeLine(String(burn), { delay: 90 })
    await wait(550)
  }
  await wait(2500)

  await loadSoft('BOUNCE.BAS')
  await typeLine('RUN')
  await wait(5500)
  await anyKey()

  await loadSoft('ASMDEMO.BIN')
  await wait(2500)
  await clearScreen()

  say('CODE: TypeScript')
  await press(byId('elec16-view-toggle'), 800)
  const source = byId('elec16-source')
  await source.click()
  await page.keyboard.press('Control+A')
  await page.keyboard.press('Delete')
  await page.keyboard.type(PATTERN, { delay: 14 })
  await wait(800)
  await press(byId('elec16-compile'), 300)
  await byId('elec16-levels').waitFor({ timeout: 60_000 })
  await wait(1500)
  for (const level of [0, 1, 2]) {
    await press(page.locator(`[data-testid=elec16-level][data-level="${level}"]`), 1300)
  }
  await press(byId('elec16-run'), 300)
  await wait(4000)
  await clearScreen()

  say('the skins, over SINEWAVE')
  await typeLine('LOAD "SINEWAVE"')
  await asleep()
  await typeLine('RUN')
  await wait(3500)
  await tab('tune')
  for (const skin of SKINS) {
    await press(page.locator(`[data-testid=elec16-skin][data-skin="${skin}"]`), 1500)
  }
  await panel(false)
  await wait(2500)
  await anyKey()
  await wait(1500)
})
