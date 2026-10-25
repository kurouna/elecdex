/**
 * The pictures of the ELEC-16 guides (docs/elec16-guide/pocket.html and sci.html), written to
 * docs/elec16-guide/shots: the pocket computer and the calculator, each a new unit on a demo
 * profile, typed on and pressed as a hand does, the pane or its LCD alone cut out.
 *
 * Nothing of this machine is read or shown: a new profile, the stubs at their demo stand-ins,
 * sound off, one ELEC-16 pane filling the window.
 *
 * Windows only, like the other takes. Run `npm run build` first, then
 * `node scripts/elec16-guide-shots.mjs [pocket] [sci]` (both when neither is named).
 */
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { _electron as electron } from '@playwright/test'

const MAIN = path.resolve('out/main/index.js')
const OUT = path.resolve('docs/elec16-guide/shots')
const W = 1440
const H = 1000
const asked = process.argv.slice(2)
const wanted = (name) => asked.length === 0 || asked.includes(name)

mkdirSync(OUT, { recursive: true })

/** One unit of `model` in a new profile, one ELEC-16 pane on it filling the window. */
async function open(model, state, theme) {
  const profile = mkdtempSync(path.join(tmpdir(), 'elecdex-guide-'))
  mkdirSync(path.join(profile, 'elec16'), { recursive: true })
  const unit = { id: 'u1', name: 'UNIT 1', clock: 4, model, autoOff: 0, xram: 0, created: 0 }
  writeFileSync(
    path.join(profile, 'elec16', 'units.json'),
    JSON.stringify({ version: 1, units: [unit] }),
  )
  const tree = {
    version: 1,
    root: { kind: 'pane', id: 'p1', widget: 'elec16', state: { unit: 'u1', ...state } },
  }
  writeFileSync(path.join(profile, 'layout.json'), JSON.stringify(tree))
  writeFileSync(
    path.join(profile, 'settings.json'),
    JSON.stringify({ theme, sound: { enabled: false }, updates: { check: false } }),
  )
  const app = await electron.launch({
    args: [MAIN, '--windowed', '--no-intro', `--user-data-dir=${profile}`, '--lang=en-US'],
    env: {
      ...process.env,
      ELECDEX_AUDIO_STUB: '1',
      ELECDEX_WIFI_STUB: 'demo',
      ELECDEX_ETHER_STUB: 'demo',
      ELECDEX_CLIPBOARD_STUB: 'demo',
      ELECDEX_NOWPLAYING_STUB: 'demo',
      ELECDEX_DOCKER_STUB: 'demo',
      ELECDEX_GPU_STUB: 'demo',
      ELECDEX_AWAKE_STUB: '1',
    },
  })
  const page = await app.firstWindow()
  await app.evaluate(
    ({ BrowserWindow }, [w, h]) => {
      const win = BrowserWindow.getAllWindows()[0]
      win.setContentSize(w, h)
      win.center()
    },
    [W, H],
  )
  const machine = page.getByTestId('elec16')
  await machine.waitFor()
  // Asleep at its prompt or line: switched on and ready for keys.
  await page.waitForFunction(
    () => document.querySelector('[data-testid=elec16]')?.getAttribute('data-asleep') === 'true',
    null,
    { timeout: 30_000 },
  )
  await page.waitForTimeout(1000)
  await machine.focus()
  return { app, page, machine }
}

/** The pointer out of the pictures, and a moment for the LCD's afterglow to settle. */
async function still(page, ms = 900) {
  await page.mouse.move(W - 4, 4)
  await page.waitForTimeout(ms)
}

/** A picture of `locator` as shots/`name`.png. */
async function shot(page, locator, name) {
  await still(page)
  await locator.first().screenshot({ path: path.join(OUT, `${name}.png`) })
  console.log(`${name}.png`)
}

/* ---------------- the pocket computer ---------------- */

/** Lines typed at the prompt on the PC's keys, each ended by Enter. */
async function lines(page, ...typed) {
  for (const line of typed) {
    await page.keyboard.type(line, { delay: 25 })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(400)
  }
}

async function pocket() {
  const { app, page } = await open(
    'pocket-48',
    { skin: 'classic', panel: true, tab: 'core' },
    'tron',
  )
  const lcd = page.getByTestId('elec16-lcd')
  try {
    await shot(page, page.locator('[data-testid=pane]'), 'pocket-pane')
    await shot(page, lcd, 'pocket-start')
    await lines(page, 'CLS', '1+2*3', 'SQR 2')
    await shot(page, lcd, 'pocket-calc')
    await lines(page, 'NEW', 'CLS', '10 FOR I=1 TO 3', '20 PRINT "HELLO";I', '30 NEXT I', 'RUN')
    await page.waitForTimeout(800)
    await shot(page, lcd, 'pocket-program')
    await lines(page, 'CLS', 'MON')
    await page.waitForTimeout(600)
    await shot(page, lcd, 'pocket-monitor')
    // Out of the monitor with Q, back to BASIC's prompt.
    await lines(page, 'Q', 'CLS', 'LOAD "SINEWAVE"', 'RUN')
    await page.waitForTimeout(4000)
    await shot(page, lcd, 'pocket-graphics')
    await page.getByTestId('elec16-brk').click()
    await page.waitForTimeout(800)
    for (const tab of ['files', 'mem', 'link', 'tune']) {
      await page.locator(`[data-testid=elec16-tab][data-tab=${tab}]`).click()
      await page.waitForTimeout(900)
      // FILES with a SOFT CARD program picked, its help shown under the list.
      if (tab === 'files') {
        await page.locator('[data-testid=elec16-soft-file]', { hasText: 'SINEWAVE' }).click()
        await page.getByTestId('elec16-soft-help').waitFor()
      }
      // The tab's own view, not the whole panel's height below it.
      await shot(page, page.getByTestId(`elec16-${tab}`), `pocket-${tab}`)
    }
    // CODE with its sample compiled: the bytes and cycles filled in.
    await page.getByTestId('elec16-view-toggle').click()
    await page.getByTestId('elec16-compile').click()
    await page.getByTestId('elec16-compile-busy').waitFor({ state: 'hidden', timeout: 60_000 })
    await page.waitForTimeout(1500)
    await shot(page, page.locator('[data-testid=pane]'), 'pocket-code')
  } finally {
    await app.close()
  }
}

/* ---------------- the calculator ---------------- */

async function sci() {
  const { app, page } = await open(
    'sci-128',
    { sciSkin: 'chalk', panel: true, tab: 'core' },
    'tron',
  )
  const lcd = page.getByTestId('elec16-lcd')
  /** The body's keys by their ids (shared/elec16/sci-keys.ts), pressed as a hand does. */
  const keys = async (ids) => {
    for (const id of ids.split(' ').filter((k) => k !== '')) {
      await page.locator(`[data-testid=elec16-sci-key][data-key="${id}"]`).hover()
      await page.mouse.down()
      await page.waitForTimeout(60)
      await page.mouse.up()
      await page.waitForTimeout(160)
    }
  }
  const at = async (ids, name) => {
    await keys(ids)
    await shot(page, lcd, name)
  }
  try {
    await keys('sin 4 5 rp add 1 frac 2 eq')
    await shot(page, page.locator('[data-testid=pane]'), 'sci-pane')
    await shot(page, page.getByTestId('elec16-sci-device'), 'sci-body')
    await at('', 'sci-exact')
    await at('fd', 'sci-decimal')
    await at('ac 1 frac 3 right add 1 frac 6', 'sci-2d')
    await at('eq', 'sci-fraction')
    await at('ac menu', 'sci-menu')
    await at('ac setup', 'sci-setup')
    await at('ac func', 'sci-func')
    await at('ac shift func', 'sci-const')
    await at('ac shift menu', 'sci-conv')
    await at('ac ac func 0 1 frac alpha lp right shift lp 1 shift lp 4 rp eq', 'sci-sigma')
    await at('ac 3 6 0 eq func down down 3', 'sci-prime')
    await at('ac 4 7 func down 1 mul 2 2 0 func down 8 eq shift fd shift fd', 'sci-eng')
    await at('ac func down down down down down down 1 1 dot 9 6 rp eq', 'sci-dist')
    await at('ac 1 div 0 eq', 'sci-error')
    await at('ac menu 2 2 1 eq 2 eq 3 eq right up up up 2 eq 4 eq 7 eq', 'sci-stats-table')
    await at('eq', 'sci-stats-result')
    await at('ac ac menu 3 func 1 sin 0 1 6 func down 1 0 neg tan tan 0 eq', 'sci-base')
    await at('ac menu 4 alpha lp sq sub 2 alpha lp eq 1 eq 5 eq 1 eq', 'sci-table')
    await at('ac ac menu 5 3 1 eq neg 2 eq neg 1 eq eq', 'sci-equation')
    await at('ac ac menu 5 down 1 1 eq neg 1 eq neg 6 eq eq', 'sci-inequality')
    await at('ac ac menu 6 lp 1 add 2 hyp rp lp 3 sub hyp rp eq', 'sci-cplx')
    await at('ac menu 7 func down down 1 2 2 1 eq 2 eq 3 eq 4 eq', 'sci-matrix')
    // PROG's list with a program in P1: the hypotenuse, ?→A:?→B:√(A²+B²).
    await keys(
      'eq ac menu 8 1 func 1 sto alpha neg func 4 func 1 sto alpha dms func 4 root alpha neg sq add alpha dms sq',
    )
    await at('ac', 'sci-prog')
  } finally {
    await app.close()
  }
}

if (wanted('pocket')) await pocket()
if (wanted('sci')) await sci()
