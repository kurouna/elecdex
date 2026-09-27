/**
 * A tour of elecdex for an introduction video: what it is at a glance, what only it does, and
 * what looks best - in about two minutes.
 *
 *   boot        the boot sequence, welcoming a made-up user
 *   standard    the shells typed into, the globe brought forward and put back
 *   network     through the layouts dialog: the Wi-Fi link segment by segment, the connections
 *   earth       ORBIT with the pointer resting on the ISS, the quakes, the weather
 *   dev         coding agents at work, a container stopped (asked twice), a commit's card
 *   media       the television and the timeline (stand-ins), the next track with its cover, the
 *               spectrum dancing
 *   desk        copies landing in the clipboard history, a QR code typed
 *   council     the ELEC system pane: a motion put, three units voting (a stand-in model)
 *   themes      every built-in theme in turn, back to Tron
 *
 * Everything shown is made up or a stand-in (demo-take.mjs): the home, the repository, the Claude
 * Code folder, the sockets, the Wi-Fi link, the sound, the clipboard, the media session and its
 * covers, the Docker engine, the web pages, and the council's answers, served from here with no
 * model and no key. Only the orbital elements, the weather, the markets and the earthquakes are
 * real, fetched as the panes would. Nothing of this machine is read, pressed or kept awake.
 *
 * Windows only, like the screenshots. Run `npm run build` first, then `npm run demo:tour`. The
 * window opens after the lead (`--lead`, 10 s: start the recorder on the region the --probe
 * run showed), plays the boot, and the tour follows; close the window to end, or pass `--exit`.
 * `--no-intro` skips the boot. The other options are demo-take.mjs's (`takeOptions`): 1600x900
 * unless told otherwise, `--pace` on every pause, `--shots=<dir>` to look the take over.
 */
import { createServer } from 'node:http'
import { PROJECT } from './demo-fixtures.mjs'
import { MAIN, openTake, prepareData, say, takeOptions, withDemoState } from './demo-take.mjs'
import { presetTrees, withState } from './preset-shots.mjs'

const options = takeOptions({ width: 1600, height: 900, lead: 10 })
const intro = !process.argv.includes('--no-intro')
const exit = process.argv.includes('--exit')

/** The presets in the order the layouts dialog lists them: Ctrl+Shift+F1 .. F6. */
const ORDER = ['standard', 'network', 'earth', 'dev', 'media', 'desk']

/* ---- The council's stand-in: answers as a local model streams them ---- */

const MOTION = 'Should we move the team to a four-day working week next quarter?'
const VOTES = {
  'UNIT-1':
    'The trials we have point one way: output per hour rose and costs fell with the office days. The risk is in customer hours, which a rota can cover.\nVERDICT: APPROVE\nCONFIDENCE: 78',
  'UNIT-2':
    'Those on hourly contracts would lose pay unless the change protects them, and **nothing in the motion does**. Fairness first, then the long weekend.\nVERDICT: REJECT\nCONFIDENCE: 64',
  'UNIT-3':
    'People are tired. A long weekend is the kind of promise that makes a team want to stay - it feels right, and it would be felt.\nVERDICT: APPROVE\nCONFIDENCE: 85',
}

const council = createServer((req, res) => {
  let raw = ''
  req.on('data', (piece) => {
    raw += piece
  })
  req.on('end', () => {
    const system = JSON.parse(raw).messages?.[0]?.content ?? ''
    const answer = VOTES[/UNIT-\d/.exec(system)?.[0] ?? 'UNIT-1']
    res.writeHead(200, { 'content-type': 'text/event-stream' })
    const pieces = answer.match(/.{1,10}/gs) ?? []
    const step = () => {
      const piece = pieces.shift()
      if (piece === undefined) {
        const usage = { prompt_tokens: 214, completion_tokens: 71 }
        res.write(`data: ${JSON.stringify({ choices: [], usage })}\n\n`)
        res.end('data: [DONE]\n\n')
        return
      }
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: piece } }] })}\n\n`)
      setTimeout(step, 70)
    }
    setTimeout(step, 600)
  })
})
await new Promise((resolve) => council.listen(0, '127.0.0.1', resolve))

/* ---- The saved layouts: the six presets, then the council ---- */

let nextId = 0
const pane = (widget) => ({ kind: 'pane', id: `t${nextId++}`, widget })
const split = (direction, children, sizes) => ({
  kind: 'split',
  id: `ts${nextId++}`,
  direction,
  children,
  sizes,
})
/** The ELEC pane in the middle, the system column and the world either side. */
const councilTree = {
  version: 1,
  root: split(
    'row',
    [
      split(
        'column',
        ['clock', 'sysinfo', 'cpu', 'memory', 'disk', 'toplist', 'netstat', 'throughput'].map(pane),
        [0.04, 0.125, 0.19, 0.12, 0.116, 0.189, 0.055, 0.165],
      ),
      pane('elec'),
      split(
        'column',
        ['globe', 'markets', 'weather', 'calendar'].map(pane),
        [0.3, 0.25, 0.22, 0.23],
      ),
    ],
    [0.18, 0.64, 0.18],
  ),
}

const { standIn } = await prepareData()
const trees = await presetTrees(MAIN)
const items = ORDER.map((id, i) => {
  const tree = trees.get(id)
  if (tree === undefined) throw new Error(`no preset ${id} in the built app`)
  const shown = withDemoState(tree, standIn)
  return {
    id: `tour${i}${id}`,
    name: id,
    preset: id,
    // The desk's utility pane opens on QR, ready for an address.
    tree: id === 'desk' ? withState(shown, { utility: { module: 'qr', qrKind: 'url' } }) : shown,
  }
})
items.push({ id: 'tourcouncil', name: 'council', tree: councilTree })

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
  settings: {
    ai: {
      providers: [
        {
          id: 'ollama',
          name: 'Ollama',
          kind: 'openai',
          baseUrl: `http://127.0.0.1:${council.address().port}/v1`,
          model: 'qwen3:14b',
        },
      ],
    },
  },
})

const { width: W, height: H } = options
const paneOf = (widget) => page.locator(`[data-testid=pane][data-widget=${widget}]`)
/** Presses the way a hand does: held for a moment (CLAUDE.md, test craft). */
const press = (locator) => locator.click({ delay: 20 })
/** The pointer out of the way: off the panes' cards and the status bar's edge. */
const away = () => page.mouse.move(W / 2, 4)
/** Nothing with the keyboard: a field typed into keeps a layout's number key for itself. */
const letGo = () => page.evaluate(() => document.activeElement?.blur())

/** A switch by a preset's own key, then the arrangement's power-on. */
async function toPreset(id) {
  say(`preset: ${id}`)
  await letGo()
  await page.keyboard.press(`Control+Shift+F${ORDER.indexOf(id) + 1}`)
  await wait(300)
  await settled()
}

async function standard() {
  say('standard: the globe forward and back')
  await wait(1200)
  await paneOf('globe').click({ position: { x: 40, y: 60 } })
  await wait(400)
  await page.keyboard.press('Control+Shift+KeyZ')
  await wait(3200)
  await page.keyboard.press('Control+Shift+KeyZ')
  await wait(1400)
}

/** The layouts dialog: the shelf of presets, one step along to network, Enter. */
async function throughTheDialog() {
  say('dialog: the presets')
  await page.keyboard.press('Control+Shift+KeyG')
  await page.getByTestId('layouts-dialog').waitFor()
  await wait(900)
  await page.locator('[data-testid=layouts-preset][data-preset="standard"]').focus()
  await wait(500)
  await page.keyboard.press('ArrowRight')
  await wait(500)
  await page.keyboard.press('Enter')
  await wait(300)
  await settled()
  await away()
  await wait(4000)
}

async function earth() {
  await toPreset('earth')
  await wait(1500)
  const map = page.getByTestId('orbit-map')
  const box = await map.boundingBox()
  const marks = JSON.parse((await map.getAttribute('data-stations').catch(() => null)) ?? '{}')
  if (box !== null && marks.ISS) {
    say('orbit: the ISS')
    await page.mouse.move(box.x + marks.ISS[0], box.y + marks.ISS[1], { steps: 12 })
    await wait(2600)
  } else await wait(2000)
  await away()
  await wait(1500)
}

async function dev() {
  await toPreset('dev')
  await wait(2000)
  say('docker: stop a container')
  const row = page.locator('[data-testid=docker-row][data-name="shop-api-1"]')
  await row.hover()
  await wait(300)
  await press(row.getByTestId('docker-stop'))
  await wait(600)
  await press(row.getByTestId('docker-stop'))
  await wait(1400)
  say('git: a commit card')
  await page
    .locator('[data-testid=git-commit]', { hasText: 'bright in sunlight' })
    .hover({ position: { x: 120, y: 10 } })
  await wait(2600)
  await away()
}

async function media() {
  await toPreset('media')
  await wait(2500)
  say('now playing: the next track')
  await press(page.getByTestId('np-next'))
  await wait(3500)
}

async function desk() {
  await toPreset('desk')
  await wait(1200)
  say('clipboard: copies land')
  for (const text of ['https://github.com/kurouna/elecdex', '#00E5FF', 'npm run demo:tour']) {
    await app.evaluate((_electron, what) => globalThis.__elecdexClipboard.copy(what), text)
    await wait(600)
  }
  say('utility: a QR code')
  await page.getByTestId('qr-url').click()
  await page.keyboard.type('https://github.com/kurouna/elecdex', { delay: 18 })
  await away()
  await wait(2200)
}

async function councilSits() {
  say('council')
  await letGo()
  await page.keyboard.press('Control+Shift+Digit7')
  await wait(300)
  await settled()
  await wait(800)
  const elec = paneOf('elec')
  await elec.getByTestId('elec-input').click()
  await page.keyboard.type(MOTION, { delay: 28 })
  await wait(400)
  await page.keyboard.press('Enter')
  await away()
  await elec.getByTestId('elec-outcome').waitFor({ timeout: 90_000 })
  say('council: resolved')
  await wait(5000)
}

/** Every built-in theme in turn on the standard layout, back to the one the tour began in. */
const THEMES = ['amber', 'phosphor', 'white', 'business-dark', 'business-light']

async function themes() {
  await toPreset('standard')
  // The switch ended the shells: the new one is given something to show while the themes change.
  say('shell: types')
  await page
    .locator('[data-testid=pane-subtitle], [data-testid=group-subtitle]')
    .filter({ hasText: /[\\/]/ })
    .first()
    .waitFor({ timeout: 20_000 })
    .catch(() => {})
  await wait(800)
  await page
    .locator('[data-testid=pane][data-widget=terminal]:not(.hidden) .xterm-screen')
    .first()
    .click()
  await page.keyboard.type(`cd "${PROJECT}"; Get-ChildItem -Name`, { delay: 18 })
  await page.keyboard.press('Enter')
  await wait(900)
  say('themes')
  await page.mouse.move(W / 2, H - 2)
  await page.getByTestId('status-bar').and(page.locator('[data-shown=true]')).waitFor()
  await wait(600)
  const select = page.getByTestId('theme-select')
  for (const theme of [...THEMES.filter((t) => t !== options.theme), options.theme]) {
    await select.selectOption(theme)
    await wait(1900)
  }
  await away()
  await wait(2500)
}

await run(async () => {
  const started = Date.now()
  await standard()
  await throughTheDialog()
  await earth()
  await dev()
  await media()
  await desk()
  await councilSits()
  await themes()
  say(`tour: ${((Date.now() - started) / 1000).toFixed(0)} s after the boot`)
  council.close()
  if (exit) await app.close().catch(() => {})
})
