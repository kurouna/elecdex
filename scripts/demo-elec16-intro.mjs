/**
 * The ELEC-16 introduced, for a landscape video (X, YouTube): the pocket computer and the
 * scientific calculator side by side, each then brought forward in turn and used as a hand
 * uses it, its captions under it. No games (PLAY-320 has its
 * own take, demo:games). About four and a half minutes:
 *
 *   pocket     switched off and on; a calculation, ANS, 0.1+0.2 exact, a string answered
 *   strings    LEFT$, MID$, RIGHT$; SPACE$ and STRING$
 *   kana       KANA mode from the body's key: PRINT "ｶﾀﾅ"
 *   program    AUTO numbering a scale of DATA, READ and BEEP; RUN; RENUM 100 and LIST
 *   graphics   LINE ...,B and CIRCLE ...,F at the prompt; GPRINT's little face
 *   monitor    MON: 32 bytes written with E, U to read them back, G to run, Q, CALL 28672
 *   soft card  FILES in the panel: SINEWAVE picked, its help read, LOAD ▸, RUN
 *   code       TypeScript compiled in CODE, its three levels, RUN on the machine
 *   skins      TUNE: three of the pocket's skins
 *   calculator 2D and exact: sin 45° + ½ = (1+√2)/2, F⇄D; →PRIME; SI prefixes and ENG
 *   calculus   Σ(1/X, 1, 4) = 25/12 exact; ∫(X², 0, 3) = 9
 *   science    CONST: h × 5×10¹⁴ Hz; CPLX: (1+2i)(3−i); MATRIX: MatA⁻¹ on the grid
 *   equations  EQUATION: x² − 2x − 1 = 0 and its vertex; X² − 2X − 1 ≤ 0
 *   data       STATS: a line through four points; nlow(1.96); BASE: HEX AND, BIN's dots
 *   bodies     the calculator forward: SLATE, PLAIN, SIMPLE (an everyday calculator), CHALK
 *
 * The calculator's key sequences are demo:sci's and demo:whatsnew44's, the BASIC lines the
 * BASIC and E16 manuals' examples (their tests run them). Everything shown is the panes' own:
 * two new units on a demo profile (demo-take.mjs), nothing of this machine read, pressed or
 * kept awake but the clock.
 *
 * Windows only, like the other takes. Run `npm run build` first, then
 * `npm run demo:elec16-intro`. The window is 1600x900, a 16:9 frame; record the window. The
 * take starts after the lead (`--lead`, 8 s) and ends by itself; close the window to end, or
 * pass `--exit` to close it when the take is over. The options are demo-take.mjs's
 * (`takeOptions`): `--pace` on every pause, `--theme`, `--shots=<dir>` to look the take over,
 * `--no-captions`.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { beats } from './demo-beats.mjs'
import { openTake, prepareData, say, takeOptions } from './demo-take.mjs'

// The Black theme, as demo:sci: the CHALK body bright on it, the pocket's CLASSIC beside it.
const options = takeOptions({ width: 1600, height: 900, lead: 8, theme: 'black' })
const exit = process.argv.includes('--exit')

/** The pocket on the left, the calculator on the right: each pane its own unit. */
const tree = {
  version: 1,
  root: {
    kind: 'split',
    id: 's-elec16',
    direction: 'row',
    sizes: [0.62, 0.38],
    children: [
      {
        kind: 'pane',
        id: 'p-pocket',
        widget: 'elec16',
        state: { unit: 'u1', skin: 'classic', panel: false, tab: 'files' },
      },
      {
        kind: 'pane',
        id: 'p-sci',
        widget: 'elec16',
        state: { unit: 'u2', sciSkin: 'chalk', panel: false, tab: 'tune' },
      },
    ],
  },
}

/** The profile's units: a new POCKET-48 and a new SCI-128, their RAM empty. */
function twoUnits(profile) {
  mkdirSync(path.join(profile, 'elec16'), { recursive: true })
  const unit = { clock: 4, autoOff: 10, created: 0 }
  const units = [
    { ...unit, id: 'u1', name: 'UNIT 1', model: 'pocket-48' },
    { ...unit, id: 'u2', name: 'SCI 1', model: 'sci-128', xram: 0 },
  ]
  writeFileSync(path.join(profile, 'elec16', 'units.json'), JSON.stringify({ version: 1, units }))
}

/** BASIC's scale (docs/elec16-basic.md section 8.1), typed after AUTO: its lines' words alone. */
const SCALE = [
  'REM SCALE: DO RE MI WITH BEEP',
  'FOR I=1 TO 8',
  'READ F:BEEP F,250',
  'NEXT I',
  'DATA 523,587,659,698,784,880,988,1047',
]

/** The E16 manual's monitor example: 32 bytes that print A to Z (docs/elec16-e16.md). */
const MONITOR = [
  'E 7000 F1 05 00 78 1F 0E 02 00',
  'E 7008 C2 04 05 10 27 00 00 00',
  'E 7010 09 18 1F DC 02 00 93 0C',
  'E 7018 E3 FF 00 58 11 04 02 21',
]

/** CODE's program (demo:elec16's): a pattern, dot by dot, as machine code. */
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

const { standIn } = await prepareData()
const { app, page, wait, settled, run, caption } = await openTake({
  items: [{ id: 'elec16', name: 'elec-16', tree }],
  options,
  standIn,
  prepare: twoUnits,
})
const beat = beats({ app, page, wait, settled, theme: options.theme })
const { away } = beat

const pocket = page.locator('[data-testid=pane][data-pane-id=p-pocket]')
const sci = page.locator('[data-testid=pane][data-pane-id=p-sci]')
const pocketMachine = pocket.getByTestId('elec16')
const sciMachine = sci.getByTestId('elec16')

/** A machine asleep at its prompt (or waiting for keys). */
const asleep = (machine) =>
  machine.and(page.locator('[data-asleep=true]')).waitFor({ timeout: 30_000 })

/** A press on one of a pane's buttons, the pointer brought to it first. */
async function button(locator, pause = 500) {
  await locator.hover()
  await wait(250)
  await locator.click({ delay: 60 })
  await wait(pause)
}

/** A key of the pocket's body (shared/elec16/keys.ts ids). */
const pocketKey = (id, pause = 400) =>
  button(pocket.locator(`[data-testid=elec16-key][data-key="${id}"]`), pause)

/** Typed on the pocket from the PC, as a person would, ENTER after it unless told not to. */
async function typeLine(text, { delay = 55, enter = true } = {}) {
  await pocketMachine.focus()
  await page.keyboard.type(text, { delay })
  if (enter) await page.keyboard.press('Enter')
}

/** A line typed, then its answer held for `hold` ms. */
async function line(text, hold = 1300, delay = 55) {
  await typeLine(text, { delay })
  await wait(hold)
}

/** The pocket's panel open or closed. */
async function pocketPanel(open) {
  const shown = (await pocket.getByTestId('elec16-panel').count()) > 0
  if (shown !== open) await button(pocket.getByTestId('elec16-panel-toggle'), 700)
}

const pocketTab = (name) =>
  button(pocket.locator(`[data-testid=elec16-tab][data-tab=${name}]`), 600)

/** The calculator's keys (shared/elec16/sci-keys.ts ids, spaces between), pressed as a hand does. */
async function keys(ids, gap = 230) {
  for (const id of ids.split(' ').filter((k) => k !== '')) {
    await sci.locator(`[data-testid=elec16-sci-key][data-key="${id}"]`).hover()
    await page.mouse.down()
    await wait(110)
    await page.mouse.up()
    await wait(gap)
  }
}

/** A calculator scene: its caption, its keys (`gap` ms apart), the answer held for `hold` ms. */
async function scene(name, text, ids, hold, gap = 230) {
  say(`sci: ${name}`)
  await caption(text)
  await keys(ids, gap)
  await wait(hold)
}

/** A pane brought forward, or put back: its machine given the keyboard, then Ctrl+Shift+Z. */
async function forward(machine) {
  await machine.focus()
  await wait(300)
  await page.keyboard.press('Control+Shift+KeyZ')
  await wait(900)
  await away()
}

await run(async () => {
  await settled()
  const started = Date.now()
  await asleep(pocketMachine)
  await asleep(sciMachine)
  await caption('ELEC-16 — a 16-bit pocket computer and a scientific calculator of its own')
  await wait(3000)

  /* ---------------- the pocket computer, brought forward ---------------- */

  await caption(null)
  await forward(pocketMachine)

  say('pocket: power')
  await caption('POCKET-48: BASIC in ROM, a 240 × 48 dot LCD, a card for files')
  await button(pocket.getByTestId('elec16-power'), 1200)
  await button(pocket.getByTestId('elec16-power'), 300)
  await asleep(pocketMachine)
  await wait(1500)

  say('pocket: as a calculator')
  await caption('A calculator at the prompt: decimal arithmetic, ANS, strings')
  await line('7/2', 900)
  await pocketKey('ans', 300)
  await line('*2', 1100, 120)
  await line('0.1+0.2', 1300)
  await line('"ELEC"+"-16"', 1600)

  say('pocket: strings')
  await caption('String functions: LEFT$, MID$, RIGHT$, SPACE$, STRING$')
  await pocketKey('cls')
  await line('A$="HELLO":PRINT LEFT$(A$,2);MID$(A$,2,3);RIGHT$(A$,2)', 1600, 35)
  await line('PRINT "[";SPACE$(3);"]";STRING$(5,"-");STRING$(2,65)', 2000, 35)

  say('pocket: kana')
  await caption('KANA mode on its own key: the JIS kana layout')
  await typeLine('PRINT "', { enter: false })
  await pocketKey('kana', 300)
  await typeLine('tqu', { enter: false, delay: 200 })
  await pocketKey('kana', 300)
  await line('"', 2000)

  say('pocket: a program')
  await caption('A program: AUTO numbers the lines, DATA and READ feed BEEP')
  await pocketKey('cls')
  await line('NEW', 400)
  await line('AUTO', 500)
  for (const text of SCALE) await line(text, 250, 40)
  // A line number alone ends AUTO.
  await line('', 600)
  await line('RUN', 3200)
  await caption('RENUM renumbers, LIST shows it')
  await line('RENUM 100', 600)
  await line('LIST', 2600)

  say('pocket: graphics')
  await caption('Graphics at the prompt: LINE, CIRCLE, and GPRINT’s columns of dots')
  await pocketKey('cls')
  await line('CLS:LINE (0,0)-(239,47),B:CIRCLE (200,24),16,F:LINE (10,40)-(150,8)', 2400, 35)
  await pocketKey('cls')
  await line('PRINT "HELLO ";:GPRINT "3C4295A1A195423C"', 2200, 40)

  say('pocket: the monitor')
  await caption('MON: machine code written byte by byte, read back, run')
  await pocketKey('cls')
  await line('MON', 900)
  for (const text of MONITOR) await line(text, 350, 40)
  await line('U 7000', 2000)
  await line('G 7000', 1800)
  await line('Q', 900)
  await line('CALL 28672', 2000)

  say('pocket: the soft card')
  await caption('The SOFT CARD: programs to read, each with its help')
  await pocketKey('cls')
  await pocketPanel(true)
  await pocketTab('files')
  await button(pocket.locator('[data-testid=elec16-soft-file][data-name="SINEWAVE.BAS"]'), 1800)
  await button(pocket.getByTestId('elec16-load'), 600)
  await asleep(pocketMachine)
  // Two cycles drawn dot by dot take about eight seconds at 4 MHz.
  await line('RUN', 8500)
  // SINEWAVE waits for a key at its end.
  await pocketMachine.focus()
  await page.keyboard.press('x')
  await wait(900)
  await pocketKey('cls')

  say('pocket: CODE')
  await caption('CODE: TypeScript compiled for the E16, three levels to compare')
  await button(pocket.getByTestId('elec16-view-toggle'), 800)
  const source = pocket.getByTestId('elec16-source')
  await source.click()
  await page.keyboard.press('Control+A')
  await page.keyboard.press('Delete')
  await page.keyboard.type(PATTERN, { delay: 12 })
  await wait(800)
  await button(pocket.getByTestId('elec16-compile'), 300)
  await pocket.getByTestId('elec16-levels').waitFor({ timeout: 60_000 })
  await wait(1200)
  for (const level of [0, 1, 2]) {
    await button(pocket.locator(`[data-testid=elec16-level][data-level="${level}"]`), 1200)
  }
  await caption('RUN ▸ puts it in RAM and calls it')
  // RUN ▸ shows the machine again as it calls the code.
  await button(pocket.getByTestId('elec16-run'), 300)
  await wait(3800)

  say('pocket: skins')
  await caption('Skins in TUNE, the body drawn in light')
  await pocketTab('tune')
  for (const skin of ['alloy', 'glass', 'mochi', 'classic']) {
    await button(pocket.locator(`[data-testid=elec16-skin][data-skin="${skin}"]`), 1500)
  }
  await pocketPanel(false)
  await pocketKey('cls')
  await caption(null)
  await forward(pocketMachine)

  /* ---------------- the calculator, brought forward ---------------- */

  await forward(sciMachine)
  await caption('SCI-128: the same machine as a scientific calculator, its own ROM')
  await wait(2600)
  await scene(
    'exact',
    'Typed in 2D, answered exactly: sin 45° + ½ = (1+√2)/2',
    'sin 4 5 rp add 1 frac 2 eq',
    2600,
  )
  await scene('decimal', 'F⇄D for the decimal', 'fd', 2000)
  await scene('prime', '→PRIME: 360 = 2³ × 3² × 5', 'ac 3 6 0 eq func down down 3', 2600)
  await scene(
    'prefix',
    'SI prefixes: 47k × 220p, then ENG',
    'ac 4 7 func down 1 mul 2 2 0 func down 8 eq',
    1600,
    190,
  )
  await keys('shift fd')
  await wait(1200)
  await keys('shift fd')
  await wait(2200)
  await scene(
    'sigma',
    'Σ kept exact: Σ(1/X, 1, 4) = 25/12',
    'ac func 0 1 frac alpha lp right shift lp 1 shift lp 4 rp eq',
    2600,
    170,
  )
  await scene(
    'integral',
    '∫ worked out numerically: ∫(X², 0, 3) = 9',
    'ac func 9 alpha lp sq shift lp 0 shift lp 3 rp eq',
    2400,
    170,
  )
  await scene(
    'constant',
    'CONST: physical constants - h × 5×10¹⁴ Hz',
    'ac shift func 2 mul 5 exp 1 4 eq',
    2400,
  )
  await scene(
    'complex',
    'CPLX: (1+2i)(3−i) = 5+5i',
    'ac menu 6 lp 1 add 2 hyp rp lp 3 sub hyp rp eq',
    2400,
    170,
  )
  await scene(
    'matrix',
    'MATRIX: a 2×2 put in on the grid, then MatA⁻¹',
    'menu 7 func down down 1 2 2 1 eq 2 eq 3 eq 4 eq',
    1200,
    170,
  )
  await keys('eq func 1 inv eq')
  await wait(2600)
  await scene(
    'equation',
    'EQUATION: x² − 2x − 1 = 0, its roots exact',
    'eq menu 5 3 1 eq neg 2 eq neg 1 eq eq',
    2600,
  )
  await scene('vertex', '▼ for the vertex', 'down', 2000)
  await scene(
    'inequality',
    'Inequalities: X² − 2X − 1 ≤ 0, its bounds exact',
    'ac menu 5 down 4 1 eq neg 2 eq neg 1 eq eq',
    2800,
  )
  await scene(
    'stats',
    'STATS: a line fitted through four points',
    'ac menu 2 2 1 eq 2 eq 3 eq 4 eq right up up up up 3 eq 5 eq 7 eq 9 eq eq',
    3000,
    150,
  )
  await scene(
    'normal',
    'The normal distribution: nlow(1.96) = 0.975',
    'menu 1 ac func down down down down down down 1 1 dot 9 6 rp eq',
    2400,
    170,
  )
  await scene(
    'base',
    'BASE: 32-bit HEX, DEC, OCT, BIN, with logic',
    'ac menu 3 func 1 sin 0 1 6 func down 1 0 neg tan tan 0 eq',
    3000,
    170,
  )
  await keys('menu 1 ac')

  // The bodies, in TUNE beside it.
  say('sci: bodies')
  await caption('Three colours, and SIMPLE: an everyday calculator')
  await button(sci.getByTestId('elec16-panel-toggle'), 700)
  await button(sci.locator('[data-testid=elec16-tab][data-tab=tune]'), 600)
  for (const skin of ['slate', 'plain']) {
    await button(sci.locator(`[data-testid=elec16-sci-skin][data-skin="${skin}"]`), 2000)
  }
  // SIMPLE: the LCD and the number keys alone, four across, as an everyday calculator.
  await button(sci.locator(`[data-testid=elec16-sci-skin][data-skin="chalk"]`), 600)
  await button(sci.locator('[data-testid=elec16-body][data-body=simple]'), 1200)
  await keys('ac 1 2 3 4 mul 5 6 7 8 eq', 200)
  await wait(2400)
  await button(sci.locator('[data-testid=elec16-body][data-body=auto]'), 1200)
  await button(sci.getByTestId('elec16-panel-toggle'), 600)
  await caption(null)
  await forward(sciMachine)

  await caption('elecdex — github.com/kurouna/elecdex')
  await wait(3200)
  await caption(null)
  say(`take: ${((Date.now() - started) / 1000).toFixed(1)} s`)
  if (exit) await app.close().catch(() => {})
})
