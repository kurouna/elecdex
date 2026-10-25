/**
 * What v0.0.43 and v0.0.44 added, for a landscape video (X, the release notes): the retro
 * preset's calculator, ELEC-16 SCI, and the six functions v0.0.44 gave it.
 *
 *   standard  the standard preset, where the take opens
 *   retro     the LAYOUTS dialog's shelf of presets, stepped along from standard to retro, Enter
 *   tab       the tab named by its machine (v0.0.43): ELEC-16 SCI brought to the front, forward
 *   prime     360 →PRIME: 2³×3²×5
 *   prefix    47k × 220p typed with SI prefixes, answered 1.034ᴇ−5, ENG to 10.34ᴇ−6, ENG again
 *             to 10.34μ
 *   product   Π(X, 1, 5) = 120, as Σ is the sum
 *   mod       127 mod 16 = 15
 *   normal    nlow(1.96) = 0.975002105
 *   inequal   EQUATION's X² − 2X − 1 ≤ 0: 1−√2 ≤ X ≤ 1+√2 kept exact, F⇄D for the decimals
 *
 * Everything shown is the pane's own: the calculator is a new SCI-128 unit on a demo profile
 * (demo-take.mjs), the standard preset's panes the demo's stand-ins. Nothing of this machine is
 * read, pressed or kept awake but the system column's own readings.
 *
 * Windows only, like the other takes. Run `npm run build` first, then `npm run demo:whatsnew44`.
 * The window is 1600x900, a 16:9 frame; record the window. The take starts after the lead
 * (`--lead`, 8 s) and ends by itself; close the window to end, or pass `--exit` to close it when
 * the take is over. The options are demo-take.mjs's (`takeOptions`): `--pace` on every pause,
 * `--theme`, `--shots=<dir>` to look the take over, `--no-captions`.
 */
import { beats, playUnits } from './demo-beats.mjs'
import { MAIN, openTake, prepareData, say, takeOptions, withDemoState } from './demo-take.mjs'
import { presetTrees, withState } from './preset-shots.mjs'

const options = takeOptions({ width: 1600, height: 900, lead: 8 })
const exit = process.argv.includes('--exit')

const { standIn } = await prepareData()
const trees = await presetTrees(MAIN)
const preset = (id) => {
  const tree = trees.get(id)
  if (tree === undefined) throw new Error(`no preset ${id} in the built app`)
  return withDemoState(tree, standIn)
}

/**
 * The retro preset as it ships, its pocket ELEC-16 in front on the CLASSIC skin, the CHIP-8 on
 * T8NKS; the preset's calculator, which asks for a new unit (`fresh`), is given the take's
 * SCI-128 on the CHALK body.
 */
function withSci(node) {
  if (node.kind === 'split') return node.children.forEach(withSci)
  if (node.kind !== 'tabs') return
  const sci = node.children.find((c) => c.widget === 'elec16' && c.state?.fresh === 'sci-128')
  if (sci !== undefined) sci.state = { unit: 'u4', sciSkin: 'chalk', panel: false }
}
const retro = withState(preset('retro'), {
  elec16: { unit: 'u1', skin: 'classic', panel: false },
  chip8: { view: 'library', filter: 'action', program: 'archive/t8nks', panel: true },
})
withSci(retro.root)

const items = [
  { id: 'newstandard', name: 'standard', preset: 'standard', tree: preset('standard') },
  { id: 'newretro', name: 'retro', preset: 'retro', tree: retro },
]

const { app, page, wait, settled, run, caption } = await openTake({
  items,
  options,
  standIn,
  prepare: (profile) => playUnits(profile),
})
const beat = beats({ app, page, wait, settled, theme: options.theme })
const { press, away } = beat

/** The LAYOUTS dialog's shelf of presets, stepped along from standard to retro, then Enter. */
async function toRetro() {
  say('dialog: the presets, along to retro')
  await beat.letGo()
  await page.keyboard.press('Control+Shift+KeyG')
  await page.getByTestId('layouts-dialog').waitFor()
  await wait(900)
  await page.locator('[data-testid=layouts-preset][data-preset="standard"]').focus()
  await wait(600)
  const at = () => page.evaluate(() => document.activeElement?.getAttribute('data-preset'))
  for (let k = 0; k < 12 && (await at()) !== 'retro'; k++) {
    await page.keyboard.press('ArrowRight')
    await wait(380)
  }
  await wait(700)
  await page.keyboard.press('Enter')
  await wait(300)
  await settled()
  await away()
}

const sciPane = page.locator('[data-testid=pane][data-widget=elec16]', {
  has: page.getByTestId('elec16-sci-device'),
})

/** The body's keys (shared/elec16/sci-keys.ts ids, spaces between), pressed as a hand does. */
async function keys(ids, gap = 230) {
  for (const id of ids.split(' ').filter((k) => k !== '')) {
    await sciPane.locator(`[data-testid=elec16-sci-key][data-key="${id}"]`).hover()
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

await run(async () => {
  await settled()
  const started = Date.now()
  await caption('elecdex v0.0.44 — the standard preset')
  await wait(2600)

  // The presets' shelf, along to retro.
  await caption('LAYOUTS: ten presets, one press away')
  await toRetro()
  await caption('retro — the pocket ELEC-16, its calculator and CHIP-8')
  await wait(2400)

  // v0.0.43: tabs named by their machine; the calculator brought forward.
  await caption('Tabs named by their machine: ELEC-16 SCI')
  await beat.toTab('ELEC-16 SCI')
  // A machine brought in from behind a tab waits paused until it is resumed.
  const resume = sciPane.locator('[data-testid=elec16-pause][aria-label=resume]')
  if (await resume.isVisible()) await press(resume)
  await sciPane
    .getByTestId('elec16')
    .and(page.locator('[data-asleep=true]'))
    .waitFor({ timeout: 20_000 })
  await wait(1200)
  // The calculator given the keyboard, so Ctrl+Shift+Z brings its pane forward.
  await sciPane.getByTestId('elec16').focus()
  await wait(300)
  await page.keyboard.press('Control+Shift+KeyZ')
  await wait(900)
  await away()

  // v0.0.44: the six new functions, the most striking first.
  await scene('prime', '→PRIME: 360 = 2³ × 3² × 5', 'ac 3 6 0 eq func down down 3', 2600)
  await scene(
    'prefix',
    'SI prefixes: 47k × 220p',
    'ac 4 7 func down 1 mul 2 2 0 func down 8 eq',
    1800,
    190,
  )
  await scene('eng', 'ENG, then ENG again: 10.34μ', 'shift fd', 1300)
  await keys('shift fd')
  await wait(2400)
  await scene(
    'product',
    'Π, the product, as Σ is the sum: Π(X, 1, 5) = 120',
    'ac func down down 2 alpha lp shift lp 1 shift lp 5 rp eq',
    2400,
    190,
  )
  await scene('mod', 'mod: 127 mod 16 = 15', 'ac 1 2 7 func down down 1 1 6 eq', 2200)
  await scene(
    'normal',
    'The normal distribution: nlow(1.96) = 0.975',
    'ac func down down down down down down 1 1 dot 9 6 rp eq',
    2600,
    170,
  )
  await scene(
    'inequality',
    'Inequalities: X² − 2X − 1 ≤ 0, its bounds exact',
    'ac menu 5 down 4 1 eq neg 2 eq neg 1 eq eq',
    3000,
  )
  await scene('decimal', 'F⇄D for the decimals', 'fd', 2600)
  await keys('menu 1 ac')

  await page.keyboard.press('Control+Shift+KeyZ')
  await wait(900)
  await away()
  await caption('elecdex — github.com/kurouna/elecdex')
  await wait(3000)
  await caption(null)
  say(`take: ${((Date.now() - started) / 1000).toFixed(1)} s`)
  if (exit) await app.close().catch(() => {})
})
