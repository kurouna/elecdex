/**
 * What the introduction tours share (demo-tour.mjs, landscape; demo-tour-shorts.mjs, vertical):
 * the council's stand-in model, and the beats themselves - the ISS's card, a container stopped,
 * copies landing, a QR code typed, KEYSTREAM played, a motion put to the council, the themes in
 * turn. A tour lays
 * out its own layouts and chooses its beats; the beats do not care which frame they are in, so
 * a release that changes a pane changes its beat here, once, for both.
 */
import { createServer } from 'node:http'
import { PROJECT } from './demo-fixtures.mjs'
import { autoplay, KEYS, keystreamMenu, trackPlan } from './demo-keystream-kit.mjs'
import { say } from './demo-take.mjs'

/* ---- The council's stand-in: answers as a local model streams them, no model and no key ---- */

export const MOTION = 'Should we move the team to a four-day working week next quarter?'
const VOTES = {
  'UNIT-1':
    'The trials we have point one way: output per hour rose and costs fell with the office days. The risk is in customer hours, which a rota can cover.\nVERDICT: APPROVE\nCONFIDENCE: 78',
  'UNIT-2':
    'Those on hourly contracts would lose pay unless the change protects them, and **nothing in the motion does**. Fairness first, then the long weekend.\nVERDICT: REJECT\nCONFIDENCE: 64',
  'UNIT-3':
    'People are tired. A long weekend is the kind of promise that makes a team want to stay - it feels right, and it would be felt.\nVERDICT: APPROVE\nCONFIDENCE: 85',
}

/** The stand-in, listening: `settings` names it as the AI provider the council sits on. */
export async function startCouncil() {
  const server = createServer((req, res) => {
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
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const provider = {
    id: 'ollama',
    name: 'Ollama',
    kind: 'openai',
    baseUrl: `http://127.0.0.1:${server.address().port}/v1`,
    model: 'qwen3:14b',
  }
  return { settings: { ai: { providers: [provider] } }, close: () => server.close() }
}

/* ---- KEYSTREAM: the sample plugin, installed in the take's profile and played ---- */

/** The plugin's volume in the tours; the guide's notes are told apart by it. */
export const KEYSTREAM_VOLUME = 80
/** The track the tours play, on NORMAL, and the instrument it is played in (the number row's). */
const TRACK = trackPlan({
  song: 'boot-sequence',
  level: 'normal',
  volume: KEYSTREAM_VOLUME,
  jitter: 8,
})
const TRACK_INSTRUMENT = '2'

/* ---- The beats ---- */

/** The built-in themes the tours end on, in turn, before the one they began in. */
const THEMES = ['tron', 'amber', 'phosphor', 'white', 'business-dark', 'business-light']

/** The beats on an open take (demo-take.mjs `openTake`); `theme` is the one it began in. */
export function beats({ app, page, wait, settled, theme }) {
  /** The page's own size in CSS pixels, which a zoomed window makes larger than the window. */
  const size = () => page.evaluate(() => ({ width: innerWidth, height: innerHeight }))
  const paneOf = (widget) => page.locator(`[data-testid=pane][data-widget=${widget}]`)
  /** Presses the way a hand does: held for a moment (CLAUDE.md, test craft). */
  const press = (locator) => locator.click({ delay: 20 })
  /** The pointer out of the way: off the panes' cards and the status bar's edge. */
  const away = async () => page.mouse.move((await size()).width / 2, 4)
  /** Nothing with the keyboard: a field typed into keeps a layout's number key for itself. */
  const letGo = () => page.evaluate(() => document.activeElement?.blur())

  /** A saved layout by its number key, then the arrangement's power-on. */
  async function toLayout(slot, name) {
    say(`layout: ${name}`)
    await letGo()
    await page.keyboard.press(`Control+Shift+Digit${slot}`)
    await wait(300)
    await settled()
  }

  /** The layouts dialog: from the row of the layout in use one row down, Enter. */
  async function throughTheDialog(name) {
    say(`dialog: down to ${name}`)
    await letGo()
    await page.keyboard.press('Control+Shift+KeyG')
    await page.getByTestId('layouts-dialog').waitFor()
    await wait(800)
    await page.keyboard.press('ArrowDown')
    await wait(500)
    await page.keyboard.press('Enter')
    await wait(300)
    await settled()
    await away()
  }

  /** Something in the shell a switch has just started. */
  async function shellTypes() {
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
  }

  /** A pane brought forward, and put back. */
  async function forward(widget, hold = 3000) {
    say(`${widget}: forward and back`)
    await paneOf(widget).click({ position: { x: 40, y: 60 } })
    await wait(400)
    await page.keyboard.press('Control+Shift+KeyZ')
    await wait(hold)
    await page.keyboard.press('Control+Shift+KeyZ')
    await wait(1200)
  }

  /** The pointer on the ISS on the ORBIT map, for its card. */
  async function issCard(hold = 2600) {
    const map = page.getByTestId('orbit-map')
    const box = await map.boundingBox()
    const marks = JSON.parse((await map.getAttribute('data-stations').catch(() => null)) ?? '{}')
    if (box === null || !marks.ISS) return
    say('orbit: the ISS')
    await page.mouse.move(box.x + marks.ISS[0], box.y + marks.ISS[1], { steps: 12 })
    await wait(hold)
    await away()
  }

  /** A running container stopped from its row: asked twice. */
  async function stopContainer(name = 'shop-api-1') {
    say(`docker: stop ${name}`)
    const row = page.locator(`[data-testid=docker-row][data-name="${name}"]`)
    await row.hover()
    await wait(300)
    await press(row.getByTestId('docker-stop'))
    await wait(600)
    await press(row.getByTestId('docker-stop'))
    await wait(1400)
  }

  /** The card of the demo repository's merged commit. */
  async function commitCard(hold = 2600) {
    say('git: a commit card')
    await page
      .locator('[data-testid=git-commit]', { hasText: 'bright in sunlight' })
      .hover({ position: { x: 120, y: 10 } })
    await wait(hold)
    await away()
  }

  /** Copies made elsewhere, landing in the clipboard history one after another. */
  async function copies(
    texts = ['https://github.com/kurouna/elecdex', '#00E5FF', 'npm run build'],
  ) {
    say('clipboard: copies land')
    for (const text of texts) {
      await app.evaluate((_electron, what) => globalThis.__elecdexClipboard.copy(what), text)
      await wait(600)
    }
  }

  /** The next track, with its cover. */
  async function nextTrack(hold = 3000) {
    say('now playing: the next track')
    await press(page.getByTestId('np-next'))
    await wait(hold)
  }

  /** An address typed into the utility pane's QR module (open on URL). */
  async function qrCode(hold = 2200) {
    say('utility: a QR code')
    await page.getByTestId('qr-url').click()
    await page.keyboard.type('https://github.com/kurouna/elecdex', { delay: 18 })
    await away()
    await wait(hold)
  }

  /**
   * KEYSTREAM: the catch laid before `arrive` brings its pane (the worker is made as it mounts),
   * the menu previewing a track or two (`previews`), then the first stretch of a track typed on
   * time (`play` ms). The catch is disarmed at the end: what the game plays after is the band's.
   */
  async function keystream(arrive, { previews = ['pixel-rush'], play = 14_000 } = {}) {
    await page.evaluate(autoplay, KEYS)
    await arrive()
    const pane = page.locator('[data-testid=plugin-pane][data-plugin=keystream]')
    await pane.and(page.locator('[data-status=ready]')).waitFor({ timeout: 20_000 })
    say('keystream: the pane takes the keys')
    await press(pane.getByTestId('plugin-canvas'))
    await wait(1800)
    const menu = keystreamMenu(page, wait)
    for (const id of previews) {
      say(`keystream: ${id}`)
      await menu.toTrack(id)
      await wait(2600)
    }
    await menu.toTrack('boot-sequence')
    await wait(900)
    say('keystream: plays')
    await menu.start('normal', TRACK_INSTRUMENT, TRACK.plan)
    await wait(play)
    await page.evaluate(() => {
      window.__keystreamDemo.armed = false
    })
  }

  /** A motion put to the council, the vote, and the resolution held on screen. */
  async function councilSits(hold = 5000) {
    say('council: a motion')
    const elec = paneOf('elec')
    await elec.getByTestId('elec-input').click()
    await page.keyboard.type(MOTION, { delay: 28 })
    await wait(400)
    await page.keyboard.press('Enter')
    await away()
    await elec.getByTestId('elec-outcome').waitFor({ timeout: 90_000 })
    say('council: resolved')
    await wait(hold)
  }

  /** Every built-in theme in turn from the status bar, back to the one the take began in. */
  async function themes(each = 1900) {
    say('themes')
    const { width, height } = await size()
    await page.mouse.move(width / 2, height - 2)
    await page.getByTestId('status-bar').and(page.locator('[data-shown=true]')).waitFor()
    await wait(600)
    const select = page.getByTestId('theme-select')
    for (const next of [...THEMES.filter((t) => t !== theme), theme]) {
      await select.selectOption(next)
      await wait(each)
    }
    await away()
  }

  return {
    paneOf,
    press,
    away,
    letGo,
    toLayout,
    throughTheDialog,
    shellTypes,
    forward,
    issCard,
    stopContainer,
    commitCard,
    copies,
    nextTrack,
    qrCode,
    keystream,
    councilSits,
    themes,
  }
}
