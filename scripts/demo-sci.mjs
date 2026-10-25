/**
 * ELEC-16 SCI, the calculator model SCI-128, for a landscape video (X, YouTube): one pane, its
 * body's keys pressed as a hand does, CORE beside it showing the E16 running the ROM.
 * v2's parts first, then the rest:
 *
 *   constant   CONST: h x 5ᴇ14 Hz, a photon's energy; CONV: 100 °F in °C
 *   calculus   Σ(1/X, 1, 4) = 25/12 kept exact; ∫(X², 0, 3) = 9
 *   complex    CPLX: (1+2i)(3-i) = 5+5i, F⇄D for 7.071067812 ∠45
 *   matrix     MATRIX: MatA = [[1,2],[3,4]] put in, MatA⁻¹ on the grid
 *   program    PROG: ?→A:?→B:√(A²+B²), asked 3 and 4, answered 5
 *   exact      sin(45)+1/2 set in 2D as it is typed, answered (1+√2)/2; F⇄D for the decimal
 *   percent    500+25% is 625
 *   constant   34+57=, then 45= adds the 57 again (K)
 *   equation   x²−2x−1=0: X1 = 1+√2, X2 = 1−√2, ▼ for the vertex
 *   stats      a line through four points: n, x̄, ȳ, r, a, b
 *   base       HEX D016 AND 0AFF0, BIN's dots under it
 *   bodies     TUNE: SLATE, PLAIN (the theme's own colours), back to CHALK
 *
 * Everything shown is the pane's own: the unit is a new SCI-128 on a demo profile
 * (demo-take.mjs), and nothing of this machine is read, pressed or kept awake but the clock.
 *
 * Windows only, like the other takes. Run `npm run build` first, then `npm run demo:sci`.
 * The window is 1600x900, a 16:9 frame; record the window. The take starts after the lead
 * (`--lead`, 8 s) and ends by itself; close the window to end, or pass `--exit` to close it when
 * the take is over. The options are demo-take.mjs's (`takeOptions`): `--pace` on every pause,
 * `--theme`, `--shots=<dir>` to look the take over, `--no-captions`.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { beats } from './demo-beats.mjs'
import { openTake, prepareData, say, takeOptions } from './demo-take.mjs'

// The Black theme, the CHALK body bright on it (user decision 2026-10-25).
const options = takeOptions({ width: 1600, height: 900, lead: 8, theme: 'black' })
const exit = process.argv.includes('--exit')

const tree = {
  version: 1,
  root: {
    kind: 'pane',
    id: 'p-sci',
    widget: 'elec16',
    state: { unit: 'u1', sciSkin: 'chalk', panel: true, tab: 'core' },
  },
}

/** The profile's unit: a new SCI-128, its RAM empty. */
function sciUnit(profile) {
  mkdirSync(path.join(profile, 'elec16'), { recursive: true })
  const unit = { id: 'u1', name: 'SCI 1', clock: 4, model: 'sci-128', autoOff: 10, xram: 0 }
  writeFileSync(
    path.join(profile, 'elec16', 'units.json'),
    JSON.stringify({ version: 1, units: [{ ...unit, created: 0 }] }),
  )
}

const { standIn } = await prepareData()
const { app, page, wait, settled, run, caption } = await openTake({
  items: [{ id: 'sci', name: 'elec-16 sci', tree }],
  options,
  standIn,
  prepare: sciUnit,
  // The calculator fills the bottom centre: the captions go between it and CORE.
  captionPlace: { left: '900px', right: '330px', bottom: '140px' },
})
const beat = beats({ app, page, wait, settled, theme: options.theme })
const { press, away } = beat
const pane = beat.paneOf('elec16').first()
const machine = pane.getByTestId('elec16')

/** The body's keys (shared/elec16/sci-keys.ts ids, spaces between), pressed as a hand does. */
async function keys(ids, gap = 230) {
  for (const id of ids.split(' ').filter((k) => k !== '')) {
    await pane.locator(`[data-testid=elec16-sci-key][data-key="${id}"]`).hover()
    await page.mouse.down()
    await wait(110)
    await page.mouse.up()
    await wait(gap)
  }
}

/** A scene: its caption, its keys (`gap` ms apart), then the answer held for `hold` ms. */
async function scene(name, text, ids, hold, gap = 230) {
  say(`sci: ${name}`)
  await caption(text)
  await keys(ids, gap)
  await wait(hold)
}

/** A body chosen in TUNE, held for `hold` ms. */
async function body(id, hold) {
  say(`body: ${id}`)
  await press(pane.locator(`[data-testid=elec16-sci-skin][data-skin="${id}"]`))
  await away()
  await wait(hold)
}

await run(async () => {
  await settled()
  const started = Date.now()
  await machine.and(page.locator('[data-asleep=true]')).waitFor({ timeout: 20_000 })
  await caption('ELEC-16 SCI — a scientific calculator on a 16-bit machine of its own')
  await wait(2600)

  // v2 first: physical constants and units, a sum and an integral, complex numbers, matrices, programs.
  await scene(
    'const',
    'CONST: twenty physical constants - h × 5×10¹⁴ Hz',
    'shift func 2 mul 5 exp 1 4 eq',
    2400,
  )
  await scene(
    'conv',
    'CONV: twenty pairs of units - 100 °F in °C',
    'ac 1 0 0 shift menu down down 1',
    2400,
  )
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
    'complex',
    'CPLX: (1+2i)(3−i) = 5+5i',
    'menu 6 lp 1 add 2 hyp rp lp 3 sub hyp rp eq',
    2200,
    170,
  )
  await scene('polar', 'F⇄D for r∠θ', 'fd', 2000)
  await scene(
    'matrix',
    'MATRIX: a 2×2 put in on the grid',
    'menu 7 func down down 1 2 2 1 eq 2 eq 3 eq 4 eq',
    2000,
    170,
  )
  await scene('inverse', 'MatA⁻¹, shown on the grid', 'eq func 1 inv eq', 2600)
  await scene(
    'program',
    'PROG: ?→A:?→B:√(A²+B²) - the hypotenuse',
    'eq menu 8 1 func 1 sto alpha neg func 4 func 1 sto alpha dms func 4 root alpha neg sq add alpha dms sq',
    1400,
    150,
  )
  await scene('run', 'Run it: A = 3, B = 4', 'eq 3 eq 4 eq', 2600, 400)
  await keys('ac menu 1 ac')

  // Exact answers, set as a textbook sets them.
  await scene(
    'exact',
    'Typed in 2D, answered exactly: sin 45° + ½ = (1+√2)/2',
    'sin 4 5 rp add 1 frac 2 eq',
    2600,
  )
  await scene('decimal', 'F⇄D for the decimal', 'fd', 2200)

  // Percent of what it is added to, and a constant kept.
  await scene(
    'percent',
    '% of what it is added to: 500 + 25% = 625',
    'ac 5 0 0 add 2 5 func 3 eq',
    2200,
  )
  await scene('constant', 'Constant calculation: 34 + 57, then 45 + 57', 'ac 3 4 add 5 7 eq', 900)
  await keys('4 5 eq')
  await wait(2200)

  // EQUATION: a quadratic, its roots exact, then its vertex.
  await scene(
    'equation',
    'EQUATION: x² − 2x − 1 = 0, its roots exact',
    'menu 5 3 1 eq neg 2 eq neg 1 eq eq',
    2800,
  )
  await scene('vertex', '▼ for the vertex', 'down', 2200)

  // STATS: a line through four points.
  await scene(
    'stats',
    'STATS: one variable or six kinds of regression',
    'ac menu 2 2 1 eq 2 eq 3 eq 4 eq right up up up up 3 eq 5 eq 7 eq 9 eq eq',
    3200,
    150,
  )

  // BASE: HEX, a logic operation, BIN's bits as dots.
  await scene(
    'base',
    'BASE: 32-bit HEX, DEC, OCT, BIN and base 5, with logic',
    'menu 3 func 1 sin 0 1 6 func down 1 0 neg tan tan 0 eq',
    3200,
    170,
  )
  await keys('menu 1 ac')

  // The bodies, in TUNE beside it.
  await caption('Three bodies: CHALK, SLATE and PLAIN in the theme’s own colours')
  await press(pane.getByTestId('elec16-tab').and(page.locator('[data-tab=tune]')))
  await wait(600)
  await body('slate', 2200)
  await body('plain', 2200)
  await body('chalk', 1200)
  await press(pane.getByTestId('elec16-tab').and(page.locator('[data-tab=core]')))
  await away()
  await caption('elecdex — github.com/kurouna/elecdex')
  await wait(3000)
  await caption(null)
  say(`take: ${((Date.now() - started) / 1000).toFixed(1)} s`)
  if (exit) await app.close().catch(() => {})
})
