/**
 * The ELEC-16's keys pressed from the PC, and TUNE's SCREEN, for a short landscape video (X):
 * a pocket model and the calculator side by side, the PC's keyboard typing on both.
 *
 *   typing     PRINT "HI!" typed on the PC: each key goes down on the body as it is held
 *   shift      the PC's Shift alone lights SHIFT; ! (a shifted face) presses SHIFT and 1
 *   kana       the かな key switches KANA (its key lights for a moment), ｶﾅ typed by the JIS layout
 *   brk        a loop that never ends, Pause held: BRK goes down and gets the machine back
 *   screen     TUNE's SCREEN: COPY TEXT, COPY IMAGE, SAVE PNG
 *   sci        the calculator: s is SIN, ! is x! (SHIFT and x⁻¹ together), Enter is =
 *
 * The かな key's key-up never reaches a page under the Japanese input method, so the take sends
 * its key-down alone, as the pane sees it there (Playwright has no KanaMode key). SAVE PNG's
 * dialog is answered by the take, a file in the temporary folder removed at the end, so no
 * system dialog shows.
 * Everything else is the pane's own: two new units on a demo profile (demo-take.mjs), and
 * nothing of this machine is read, pressed or kept awake but the clock.
 *
 * Windows only, like the other takes. Run `npm run build` first, then `npm run demo:elec16-keys`.
 * The window is 1600x900; record the window. The take starts after the lead (`--lead`, 8 s) and
 * ends by itself; `--exit` closes the window then. The options are demo-take.mjs's
 * (`takeOptions`): `--pace`, `--theme`, `--shots=<dir>`, `--no-captions`.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { beats } from './demo-beats.mjs'
import { openTake, prepareData, say, takeOptions } from './demo-take.mjs'

const options = takeOptions({ width: 1600, height: 900, lead: 8 })
const exit = process.argv.includes('--exit')

const tree = {
  version: 1,
  root: {
    kind: 'split',
    id: 's',
    direction: 'row',
    sizes: [62, 38],
    children: [
      {
        kind: 'pane',
        id: 'p-pocket',
        widget: 'elec16',
        state: { unit: 'u1', skin: 'classic', panel: true, tab: 'tune' },
      },
      {
        kind: 'pane',
        id: 'p-sci',
        widget: 'elec16',
        state: { unit: 'u2', sciSkin: 'chalk', panel: false },
      },
    ],
  },
}

/** The profile's units: a new POCKET-48 and a new SCI-128, their RAM empty. */
function units(profile) {
  mkdirSync(path.join(profile, 'elec16'), { recursive: true })
  const unit = (id, name, model) => ({
    id,
    name,
    clock: 4,
    model,
    autoOff: 10,
    xram: 0,
    created: 0,
  })
  writeFileSync(
    path.join(profile, 'elec16', 'units.json'),
    JSON.stringify({
      version: 1,
      units: [unit('u1', 'UNIT 1', 'pocket-48'), unit('u2', 'SCI 1', 'sci-128')],
    }),
  )
}

const { standIn } = await prepareData()
const { app, page, wait, settled, run, caption } = await openTake({
  items: [{ id: 'keys', name: 'elec-16 keys', tree }],
  options,
  standIn,
  prepare: units,
  // The calculator fills the right's bottom: the captions go under the pocket body.
  captionPlace: { left: '20px', right: '940px', bottom: '160px' },
})
const beat = beats({ app, page, wait, settled, theme: options.theme })
const { press, away } = beat
const pocket = beat.paneOf('elec16').first()
const sci = beat.paneOf('elec16').nth(1)

/** A PC key held as a hand holds it, long enough to see its key go down on the body. */
async function tap(key, hold = 110, gap = 70) {
  await page.keyboard.down(key)
  await wait(hold)
  await page.keyboard.up(key)
  await wait(gap)
}

/** Text typed on the PC a key at a time; a character on a shifted face is typed with Shift. */
const SHIFTED = { '!': 'Digit1', '"': 'Quote', '*': 'Digit8', '(': 'Digit9', ')': 'Digit0' }
async function type(text, hold = 110, gap = 70) {
  for (const ch of text) {
    const code = SHIFTED[ch]
    if (code === undefined) {
      await tap(ch === ' ' ? 'Space' : ch, hold, gap)
      continue
    }
    await page.keyboard.down('Shift')
    await tap(code, hold, 0)
    await page.keyboard.up('Shift')
    await wait(gap)
  }
}

/** The かな key as the pane sees it under the Japanese input method: a key-down, no key-up. */
const kana = () =>
  page.evaluate(() => {
    const el = document.querySelectorAll('[data-testid=elec16]')[0]
    el?.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KanaMode', key: 'KanaMode', bubbles: true }),
    )
  })

const capture = (what) => pocket.locator(`[data-testid=elec16-capture][data-what=${what}]`)

await run(async () => {
  await settled()
  const started = Date.now()
  for (const pane of [pocket, sci]) {
    await pane
      .getByTestId('elec16')
      .and(page.locator('[data-asleep=true]'))
      .waitFor({ timeout: 20_000 })
  }
  // SAVE PNG's dialog answered by the take: a file in the temporary folder.
  const saved = path.join(tmpdir(), `elecdex-demo-${Date.now()}.png`)
  await app.evaluate(({ dialog }, file) => {
    dialog.showSaveDialog = async () => ({ canceled: false, filePath: file })
  }, saved)

  await pocket.getByTestId('elec16').focus()
  say('typing')
  await caption('Type on the PC — the ELEC-16’s own keys go down with yours')
  await type('print "hi')
  say('shift')
  await caption('Shift lights SHIFT; a shifted character presses both')
  await page.keyboard.down('Shift')
  await wait(700)
  await tap('Digit1', 260, 0)
  await page.keyboard.up('Shift')
  await type('"', 110, 120)
  await tap('Enter', 160, 500)

  say('kana')
  await caption('The かな key switches KANA — its key lights for a moment')
  await type('print "')
  await kana()
  await wait(500)
  await tap('KeyT', 160, 120)
  await tap('KeyU', 160, 120)
  await kana()
  await wait(400)
  await type('"')
  await tap('Enter', 160, 900)

  say('brk')
  await caption('Pause is BRK: held, it goes down and gets the machine back')
  await type('10 goto 10', 90, 50)
  await tap('Enter', 120, 120)
  await type('run', 90, 50)
  await tap('Enter', 120, 600)
  await tap('Pause', 450, 900)

  say('screen')
  await caption('New in TUNE: SCREEN copies the screen as text or a picture')
  await press(capture('text'))
  await wait(900)
  await press(capture('image'))
  await wait(900)
  await caption('…and saves it as a PNG, named by the app')
  await press(capture('png'))
  await wait(1400)
  await away()

  say('sci')
  await sci.getByTestId('elec16').focus()
  await caption('On SCI-128, s is SIN — and ! is x!, SHIFT and x⁻¹ together')
  await tap('KeyS', 160, 120)
  await type('30)+3', 140, 110)
  await page.keyboard.down('Shift')
  await tap('Digit1', 450, 0)
  await page.keyboard.up('Shift')
  await wait(200)
  await tap('Enter', 200, 2200)

  await caption('elecdex — github.com/kurouna/elecdex')
  await wait(2600)
  await caption(null)
  rmSync(saved, { force: true })
  say(`take: ${((Date.now() - started) / 1000).toFixed(1)} s`)
  if (exit) await app.close().catch(() => {})
})
