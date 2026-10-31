/**
 * README screenshots (docs/screenshots/*.jpg): the layout presets
 * (shared/layout-presets.ts), each in a theme of its own, in a clean demo profile, so
 * no personal paths, Start Menu entries or files appear. Live data (markets, weather,
 * quakes, the stations' orbits) comes from the real services; what would show someone
 * else's pages or this machine - the web panes, feeds, sockets, sound, agents, notes -
 * is made up.
 *
 * Windows only, as written: the demo home is under C:/Users/Public. Run
 * `npm run build` first, then `npm run gen:screenshots`; name shots to take only those
 * (`npm run gen:screenshots -- elecdex-media`).
 *
 * The calculator (elecdex-sci) is an SCI-128 unit answering a line typed on the PC's keys.
 * The PLAY-320's games (elecdex-play, -play-air, -play-drill, -play-fighter) are played by
 * a scripted pad (demo-play-kit.mjs's, and elecfighter below), with no gamepad of this machine
 * reaching the page.
 *
 * Shots for posting (`social-elec-sitting`, `social-elec-approved`, `social-ethernet-popup`) are taken only when named,
 * as PNG into release/social, which is not committed: the ELEC system pane alone,
 * so nothing of the machine is in them.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { _electron as electron } from '@playwright/test'
import { startCouncil } from './demo-beats.mjs'
import {
  claudeFolder,
  demoRepository,
  gitRepos,
  HOME,
  keepOrbits,
  PROJECT,
  prepareHome,
  REMOTE,
  REPO_ID,
  remoteBehind,
  SESSION,
  seedOrbits,
} from './demo-fixtures.mjs'
import {
  DEADLOCK as DEADLOCK_LINE,
  history,
  LOG_ID,
  live,
  logFiles,
  PAYMENT_FAILED as PAYMENT_LINE,
} from './demo-logfeed.mjs'
import {
  airTakeOff,
  drillDig,
  drillStart,
  lanceStart,
  lanceWeave,
  noGamepads,
  padOf,
} from './demo-play-kit.mjs'
import { deskFiles, mediaStandIn, presetTrees, withState } from './preset-shots.mjs'

const OUT = path.resolve('docs/screenshots')
const SOCIAL = path.resolve('release/social')
const MAIN = path.resolve('out/main/index.js')
/** The shots named on the command line, or every shot. */
const only = process.argv.slice(2)
const W = 1600
const H = 900

mkdirSync(OUT, { recursive: true })

prepareHome()

const launcherItems = [
  { name: 'Terminal', target: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe' },
  { name: 'Command Prompt', target: 'C:\\Windows\\System32\\cmd.exe' },
  { name: 'Explorer', target: 'C:\\Windows\\explorer.exe' },
  { name: 'Notepad', target: 'C:\\Windows\\System32\\notepad.exe' },
  { name: 'Calculator', target: 'C:\\Windows\\System32\\calc.exe' },
  { name: 'Task Manager', target: 'C:\\Windows\\System32\\taskmgr.exe' },
  { name: 'elecdex on GitHub', target: 'https://github.com/kurouna/elecdex' },
]

/*
 * Trees for the shots that are not presets (the AI chat and ELEC panes). The presets'
 * own come from the built app (preset-shots.mjs), since a script cannot import the
 * TypeScript source.
 */
let nextId = 0
const pane = (widget) => ({ kind: 'pane', id: `p${nextId++}`, widget })
const split = (direction, children, sizes) => ({
  kind: 'split',
  id: `s${nextId++}`,
  direction,
  children,
  sizes,
})

/*
 * The ai preset: two AI chat panes and the council, all talking to one stand-in served from this
 * machine: no model, no key and no service is involved, and what is "said" is written here. It
 * speaks the OpenAI dialect the way Ollama does. A unit of the council is told by the name in its
 * system prompt; a chat answers by the question asked, the top pane's second answer slowly, so
 * the shot catches it arriving.
 */
const CHAT = [
  {
    ask: 'How do I watch a folder for changes in Node.js?',
    answer: [
      'Use `fs.watch` on the folder, and keep a poll on the modification time as a fallback - some editors save by renaming a temporary file over the original, which a watcher on the file itself never sees.',
      '',
      '```js',
      "import { watch } from 'node:fs'",
      '',
      'const watcher = watch(dir, { persistent: false }, (event, name) => {',
      "  if (name === 'settings.json') reload()",
      '})',
      '```',
      '',
      '- **Watch the folder**, not the file.',
      '- **Debounce**: one save is often several events.',
    ].join('\n'),
  },
  {
    ask: 'And how do I debounce those events?',
    answer: [
      'Keep one timer per key and start it again on every event, so only the last of a burst runs:',
      '',
      '```js',
      'const timers = new Map()',
      '',
      'function debounced(key, fn, ms = 150) {',
      '  clearTimeout(timers.get(key))',
      '  timers.set(key, setTimeout(fn, ms))',
      '}',
      '```',
      '',
      'A hundred and fifty milliseconds is enough for an editor that writes a file in two steps, and short enough that the reload still feels immediate.',
    ].join('\n'),
  },
]

/** The bottom pane's conversation: one question, answered whole. */
const ASIDE = {
  ask: 'What does git pull --ff-only refuse to do?',
  answer: [
    'It refuses to make a merge commit. If your branch and its upstream have both moved on, the pull stops and leaves everything as it was:',
    '',
    '```sh',
    'git pull --ff-only',
    '# fatal: Not possible to fast-forward, aborting.',
    '```',
    '',
    'Then choose yourself: `git rebase` onto the upstream, or `git merge` it.',
  ].join('\n'),
}

/** The text of a request's last user message. */
function lastAsk(body) {
  const messages = body.messages ?? []
  const last = messages.filter((m) => m.role === 'user').at(-1)?.content
  return typeof last === 'string' ? last : ''
}

function aiStandIn(pace = 25) {
  const server = createServer((req, res) => {
    let raw = ''
    req.on('data', (piece) => {
      raw += piece
    })
    req.on('end', () => {
      const body = JSON.parse(raw)
      const system = String(body.messages?.[0]?.content ?? '')
      const unit = /UNIT-\d/.exec(system)?.[0]
      const ask = lastAsk(body)
      const chat = [...CHAT, ASIDE].find((turn) => turn.ask === ask) ?? CHAT[0]
      const answer = unit !== undefined ? VOTES[unit] : chat.answer
      const wait = unit === undefined && chat === CHAT[1] ? 110 : pace
      res.writeHead(200, { 'content-type': 'text/event-stream' })
      const pieces = answer.match(/.{1,12}/gs) ?? []
      const step = () => {
        const piece = pieces.shift()
        if (piece === undefined) {
          const usage =
            unit !== undefined
              ? { prompt_tokens: 214, completion_tokens: 71 }
              : { prompt_tokens: 38, completion_tokens: 212 }
          res.write(`data: ${JSON.stringify({ choices: [], usage })}\n\n`)
          res.end('data: [DONE]\n\n')
          return
        }
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: piece } }] })}\n\n`)
        setTimeout(step, wait)
      }
      step()
    })
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

/** The ai preset's two chats, each on a provider of its own, top first. */
function chatsOn(tree, providers) {
  let at = 0
  const visit = (node) => {
    if (node.kind !== 'pane') return { ...node, children: node.children.map(visit) }
    if (node.widget !== 'aichat') return node
    const provider = providers[Math.min(at++, providers.length - 1)]
    return { ...node, state: { ...node.state, provider } }
  }
  return { ...tree, root: visit(tree.root) }
}

/*
 * The ELEC system pane, alone in the middle column so the council has the room it is drawn for,
 * its three units voting through the same kind of stand-in: each answers
 * by the unit its system prompt names, as Ollama would stream it, and the council approves 2-1.
 */
const elecLayout = {
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

/*
 * The CHIP-8 pane in the middle column, running T8NKS from chip8Archive (CC0): an XO-CHIP
 * title screen in four shades of the theme's accent, with the keypad and CORE beside it.
 */
const chip8Layout = {
  version: 1,
  root: split(
    'row',
    [
      split(
        'column',
        ['clock', 'sysinfo', 'cpu', 'memory', 'disk', 'toplist', 'netstat', 'throughput'].map(pane),
        [0.04, 0.125, 0.19, 0.12, 0.116, 0.189, 0.055, 0.165],
      ),
      { ...pane('chip8'), state: { view: 'run', program: 'archive/t8nks' } },
      split(
        'column',
        ['globe', 'markets', 'weather', 'calendar'].map(pane),
        [0.3, 0.25, 0.22, 0.23],
      ),
    ],
    [0.18, 0.64, 0.18],
  ),
}

const LOGWATCH_ANSWER = [
  '**Two separate problems, one likely cause.**',
  '',
  '1. `ECONNRESET` from **payments**: the payment service closed the connection mid-request. Bursts like this usually mean it restarted, or its load balancer dropped idle sockets.',
  '2. The **deadlock on `stock`**: two transactions lock rows in a different order - likely charge retries overlapping with stock updates.',
  '',
  '**Check** the payment service’s restarts at that time; retry with backoff, and lock `stock` rows in one order (by id) in both paths.',
].join('\n')

/**
 * Errors coming fast, then a deadlock and a failed charge chosen (a click, Ctrl+click) and
 * EXPLAINed; the shot is taken once the answer is in, the burst still lit.
 */
async function explaining(page) {
  // Off the stream: a pointer resting on it holds the stream where it is (NEW below).
  await page.mouse.move(W / 2, 4)
  live.burst(14_000)
  await page.waitForTimeout(4500)
  live.queue.push(DEADLOCK_LINE(), PAYMENT_LINE())
  await page.waitForTimeout(800)
  const rows = page.getByTestId('logwatch-row')
  await rows.filter({ hasText: 'deadlock' }).last().click()
  await rows
    .filter({ hasText: 'ECONNRESET' })
    .last()
    .click({ modifiers: ['Control'] })
  await page.getByTestId('logwatch-explain-open').click()
  await page.getByTestId('logwatch-explain-send').click()
  await page.mouse.move(W / 2, 4)
  await page
    .getByTestId('logwatch-explain-answer')
    .filter({ hasText: 'one order' })
    .waitFor({ timeout: 20_000 })
  await page.getByTestId('logwatch-lamp').filter({ hasText: 'ERROR BURST' }).waitFor()
  await page.waitForTimeout(600)
}

/*
 * The ELEC-16 pane in the middle column in the CLASSIC skin, with CORE beside it: SINEWAVE
 * from its SOFT CARD (the machine's own program), typed in as a person would.
 */
const elec16Layout = {
  version: 1,
  root: split(
    'row',
    [
      split(
        'column',
        ['clock', 'sysinfo', 'cpu', 'memory', 'disk', 'toplist', 'netstat', 'throughput'].map(pane),
        [0.04, 0.125, 0.19, 0.12, 0.116, 0.189, 0.055, 0.165],
      ),
      { ...pane('elec16'), state: { skin: 'classic', tab: 'core' } },
      split(
        'column',
        ['globe', 'markets', 'weather', 'calendar'].map(pane),
        [0.3, 0.25, 0.22, 0.23],
      ),
    ],
    [0.18, 0.64, 0.18],
  ),
}

/** Switched on and asleep at BASIC's prompt, SINEWAVE loaded and run, a still frame of it. */
async function sinewave(page) {
  // The first: a layout may have a calculator beside it, the same widget.
  const device = page.getByTestId('elec16').first()
  await device.waitFor()
  await page.waitForFunction(
    () => document.querySelector('[data-testid=elec16]')?.getAttribute('data-asleep') === 'true',
    null,
    { timeout: 20_000 },
  )
  await device.focus()
  await page.keyboard.type('load "sinewave"', { delay: 30 })
  await page.keyboard.press('Enter')
  await page.waitForTimeout(800)
  await page.keyboard.type('run', { delay: 30 })
  await page.keyboard.press('Enter')
  await page.waitForTimeout(4000)
  await page.mouse.move(W / 2, H / 6)
}

/*
 * ELEC-16 PLAY: a PLAY-320 unit with a game in its slot in the middle column, the panel beside it
 * on the tab named; the game started and played for a while. Each game's shot has a body, a
 * colour and a theme of its own, so the README shows the range.
 */
const playLayout = (state) => ({
  version: 1,
  root: split(
    'row',
    [
      split(
        'column',
        ['clock', 'sysinfo', 'cpu', 'memory', 'disk', 'toplist', 'netstat', 'throughput'].map(pane),
        [0.04, 0.125, 0.19, 0.12, 0.116, 0.189, 0.055, 0.165],
      ),
      { ...pane('elec16'), state: { unit: 'u1', ...state } },
      split(
        'column',
        ['globe', 'markets', 'weather', 'calendar'].map(pane),
        [0.3, 0.25, 0.22, 0.23],
      ),
    ],
    [0.18, 0.64, 0.18],
  ),
})

/** The profile's unit: a PLAY-320 with the bundled `cart` in its slot. */
const playUnit = (cart) => (dir) => {
  mkdirSync(path.join(dir, 'elec16'), { recursive: true })
  const unit = { id: 'u1', name: 'UNIT 1', clock: 4, model: 'play-320', autoOff: 10, xram: 512 }
  writeFileSync(
    path.join(dir, 'elec16', 'units.json'),
    JSON.stringify({ version: 1, units: [{ ...unit, cart, created: 0 }] }),
  )
}

/** The profile's unit: an SCI-128 calculator, its RAM new. */
const sciUnit = (dir) => {
  mkdirSync(path.join(dir, 'elec16'), { recursive: true })
  const unit = { id: 'u1', name: 'SCI 1', clock: 4, model: 'sci-128', autoOff: 10, xram: 0 }
  writeFileSync(
    path.join(dir, 'elec16', 'units.json'),
    JSON.stringify({ version: 1, units: [{ ...unit, created: 0 }] }),
  )
}

/**
 * The calculator answering sin(45)+1/2 in 2D with its exact form, (1+√2)/2: typed on the PC's
 * keys (s for SIN, f for a/b) as a person would, a key a moment.
 */
async function sciAnswer(page) {
  await atStartScreen(page)
  await typeSciAnswer(page)
}

/** sin(45)+1/2 typed into the focused calculator, a key a moment, the pointer out of the way. */
async function typeSciAnswer(page) {
  for (const key of ['s', '4', '5', ')', '+', '1', 'f', '2', 'Enter']) {
    await page.keyboard.press(key)
    await page.waitForTimeout(150)
  }
  await page.waitForTimeout(600)
  await page.mouse.move(W / 2, H / 6)
}

/** The preset's SCI-128 pane, the pocket ELEC-16 beside it being the same widget. */
const sciTab = (pane) => pane.widget === 'elec16' && pane.state?.fresh === 'sci-128'

/** A preset's calculator, its new unit asleep at its line, answering sin(45)+1/2. */
async function sciInPreset(page) {
  const sci = page.locator('[data-testid=elec16]', { has: page.getByTestId('elec16-sci-device') })
  await sci.waitFor()
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid=elec16-sci-device]')
        ?.closest('[data-testid=elec16]')
        ?.getAttribute('data-asleep') === 'true',
    null,
    { timeout: 20_000 },
  )
  await sci.focus()
  await typeSciAnswer(page)
}

/** The machine focused, a moment after it has come up at its start screen. */
async function atStartScreen(page) {
  const device = page.getByTestId('elec16')
  await device.waitFor()
  await page.waitForTimeout(2000)
  await device.focus()
  return (ms) => page.waitForTimeout(ms)
}

/** The LANCE on screen: a column of the play area lit pale blue for most of its height. */
function lanceBurning(canvas) {
  const data = canvas.getContext('2d').getImageData(48, 16, 224, 272).data
  const lit = new Array(224).fill(0)
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 150 && data[i + 1] > 190 && data[i + 2] > 230) lit[(i / 4) % 224]++
  }
  return Math.max(...lit) > 90
}

/**
 * ELECLANCE on EASY: the ship weaving and shooting through the first enemies, then the LANCE
 * held - still held as the shot is taken, the moment it burns up the screen.
 */
async function eleclance(page) {
  const wait = await atStartScreen(page)
  await lanceStart(page, wait)
  await wait(3500)
  await lanceWeave(page, wait, 8_000, { lanceEvery: 1000 })
  const pad = padOf(page, wait)
  await pad.down('KeyZ')
  await pad.hold('ArrowRight', 250)
  // The LANCE takes a moment to charge after the last shots, then burns up to the first enemy.
  const screen = page.getByTestId('elec16-play-screen')
  for (let k = 0; k < 60 && !(await screen.evaluate(lanceBurning)); k++) await wait(50)
  await wait(150)
  await page.mouse.move(W / 2, H / 6)
}

/**
 * ELECAIRCOMBAT: from the title to the first sortie, the ace ahead and closing head-on; the gun
 * held, and a missile away once it is locked - the shot taken as it flies, the box red.
 */
async function airCombat(page) {
  const wait = await atStartScreen(page)
  await airTakeOff(page, wait)
  const pad = padOf(page, wait)
  await wait(100)
  await pad.down('KeyZ')
  await wait(700)
  await pad.hold('KeyX', 100)
  await wait(220)
  await page.mouse.move(W / 2, H / 6)
}

/** The well's flash: a group lit gold before it goes (a chain), in the colours it cycles. */
function flashing(canvas) {
  const data = canvas.getContext('2d').getImageData(88, 0, 144, 288).data
  let lit = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] >= 231 && data[i + 1] === 222 && data[i + 2] >= 140) lit++
  }
  return lit > 250
}

/**
 * ELECDRILL on EASY: digging down through the first strata, side digs now and then; the shot
 * taken as a group lights up to go, after fifteen seconds of it.
 */
async function elecdrill(page) {
  const wait = await atStartScreen(page)
  await drillStart(page, wait)
  await drillDig(page, wait, 15_000)
  const screen = page.getByTestId('elec16-play-screen')
  const pad = padOf(page, wait)
  for (let k = 0; k < 60 && !(await screen.evaluate(flashing)); k++) {
    await pad.hold(k % 6 === 5 ? 'KeyZ' : 'KeyX', 160)
    for (let t = 0; t < 4 && !(await screen.evaluate(flashing)); t++) await wait(60)
  }
  await page.mouse.move(W / 2, H / 6)
}

/** A blow landing: the one struck flashes white (wire and fill), as the spark bursts. */
function striking(canvas) {
  const data = canvas.getContext('2d').getImageData(0, 40, 320, 210).data
  let lit = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) lit++
  }
  return lit > 40
}

/**
 * ELECFIGHTER: from the boot log through the title, the controls and the select (S4 OUTBOX) to
 * the first fight; walking in and blows against the first program - the shot taken as a blow
 * lands, after about eight seconds of it.
 */
async function elecfighter(page) {
  const wait = await atStartScreen(page)
  const pad = padOf(page, wait)
  // START: the boot log, START past it to the title, START for the menu, A for VERSUS CPU, the
  // controls the first time (START past them), the select.
  for (const [key, ms] of [
    ['Enter', 1500],
    ['Enter', 1500],
    ['Enter', 600],
    ['KeyZ', 900],
    ['Enter', 1200],
    ['ArrowLeft', 900],
    ['KeyZ', 2200],
    ['KeyZ', 2600],
  ])
    await pad.hold(key, 120).then(() => wait(ms))
  const screen = page.getByTestId('elec16-play-screen')
  // Walk in, a light punch, a heavy kick; walk in, a heavy punch, back, a light kick, a heavy
  // kick (one key at a time: the pad holds one).
  const moves = [
    ['ArrowRight', 420],
    ['KeyA', 90],
    ['KeyZ', 90],
    ['ArrowRight', 260],
    ['KeyS', 90],
    ['ArrowLeft', 300],
    ['KeyX', 90],
    ['KeyZ', 90],
  ]
  const start = Date.now()
  for (let k = 0; Date.now() - start < 30_000; k++) {
    if (Date.now() - start > 8_000 && (await screen.evaluate(striking))) break
    const [key, ms] = moves[k % moves.length]
    await pad.hold(key, ms)
    for (let t = 0; t < 3 && !(await screen.evaluate(striking)); t++) await wait(50)
    if (Date.now() - start > 8_000 && (await screen.evaluate(striking))) break
  }
  await page.mouse.move(W / 2, H / 6)
}

/** A program brought back after a start waits paused: P runs it, for its title screen to draw. */
async function playing(page) {
  await page.getByTestId('chip8-run').waitFor()
  await page.getByTestId('chip8').focus()
  await page.keyboard.press('KeyP')
  await page.waitForTimeout(7000)
  await page.mouse.move(W / 2, H / 3)
}

const MOTION = 'Should we move the team to a four-day working week next quarter?'
const VOTES = {
  'UNIT-1':
    'The trials we have point one way: output per hour rose and costs fell with the office days. The risk is in customer hours, which a rota can cover.\nVERDICT: APPROVE\nCONFIDENCE: 78',
  'UNIT-2':
    'Those on hourly contracts would lose pay unless the change protects them, and **nothing in the motion does**. Fairness first, then the long weekend.\nVERDICT: REJECT\nCONFIDENCE: 64',
  'UNIT-3':
    'People are tired. A long weekend is the kind of promise that makes a team want to stay - it feels right, and it would be felt.\nVERDICT: APPROVE\nCONFIDENCE: 85',
}

function elecStandIn(pace = 25) {
  const server = createServer((req, res) => {
    let raw = ''
    req.on('data', (piece) => {
      raw += piece
    })
    req.on('end', () => {
      const system = JSON.parse(raw).messages?.[0]?.content ?? ''
      const answer = VOTES[/UNIT-\d/.exec(system)?.[0] ?? 'UNIT-1']
      res.writeHead(200, { 'content-type': 'text/event-stream' })
      const pieces = answer.match(/.{1,12}/gs) ?? []
      const step = () => {
        const piece = pieces.shift()
        if (piece === undefined) {
          const usage = { prompt_tokens: 214, completion_tokens: 71 }
          res.write(`data: ${JSON.stringify({ choices: [], usage })}\n\n`)
          res.end('data: [DONE]\n\n')
          return
        }
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: piece } }] })}\n\n`)
        setTimeout(step, pace)
      }
      step()
    })
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

async function deliberating(page) {
  const elec = page.locator('[data-testid=pane][data-widget=elec]')
  const input = elec.getByTestId('elec-input')
  await input.fill(MOTION)
  await input.press('Enter')
  await elec.getByTestId('elec-outcome').waitFor()
  // The resolution has powered on, and the stamps have landed.
  await page.waitForTimeout(1500)
}

/** The council sitting: one vote each way is in, ETHOS's still landing, and PATHOS, which decides it, is answering. */
async function sitting(page) {
  const elec = page.locator('[data-testid=pane][data-widget=elec]')
  const input = elec.getByTestId('elec-input')
  await input.fill(MOTION)
  await input.press('Enter')
  await elec.locator('[data-testid=elec-unit][data-unit="2"][data-state=rx]').waitFor()
  await page.waitForTimeout(600)
}

/** Asks a question in one chat pane and waits for the answer to be whole. */
async function ask(chat, question) {
  const input = chat.getByTestId('aichat-input')
  await input.fill(question)
  await input.press('Enter')
  await chat.getByTestId('aichat-usage').last().waitFor()
}

/** The council decided, the bottom chat answered, and the top one's second answer arriving. */
async function conversing(page) {
  const chats = page.locator('[data-testid=pane][data-widget=aichat]')
  await deliberating(page)
  await ask(chats.nth(1), ASIDE.ask)
  await ask(chats.nth(0), CHAT[0].ask)
  const input = chats.nth(0).getByTestId('aichat-input')
  await input.fill(CHAT[1].ask)
  await input.press('Enter')
  // Far enough into the second answer for its code to be on screen, not so far that it is over.
  await page.waitForTimeout(3000)
  // Over the title strip: a pointer resting on a pane would show its buttons.
  await page.mouse.move(W / 2, 4)
}

/**
 * The window as JPEG, web panes included. A web pane is a view of its own laid over the
 * page (architecture.md §5.4), so the page's screenshot has a hole where it is: main
 * takes each view's picture, and the page lays them over its own on a canvas.
 */
async function withWebViews(app, page, clip = undefined) {
  const views = await app.evaluate(async ({ BrowserWindow }) => {
    const out = []
    for (const win of BrowserWindow.getAllWindows()) {
      for (const view of win.contentView.children) {
        if (!('webContents' in view) || !view.getVisible()) continue
        const image = await view.webContents.capturePage()
        out.push({ bounds: view.getBounds(), png: image.toPNG().toString('base64') })
      }
    }
    return out
  })
  if (views.length === 0) return page.screenshot({ type: 'jpeg', quality: 88, clip })
  const shot = (await page.screenshot({ type: 'png', clip })).toString('base64')
  const jpeg = await page.evaluate(
    async ({ shot, views, at }) => {
      const load = (png) =>
        new Promise((resolve, reject) => {
          const image = new Image()
          image.onload = () => resolve(image)
          image.onerror = reject
          image.src = `data:image/png;base64,${png}`
        })
      const base = await load(shot)
      const canvas = document.createElement('canvas')
      canvas.width = base.naturalWidth
      canvas.height = base.naturalHeight
      const scale = base.naturalWidth / (at?.width ?? window.innerWidth)
      const context = canvas.getContext('2d')
      context.drawImage(base, 0, 0)
      for (const { bounds, png } of views) {
        const image = await load(png)
        const { x, y, width, height } = bounds
        const dx = x - (at?.x ?? 0)
        const dy = y - (at?.y ?? 0)
        context.drawImage(image, dx * scale, dy * scale, width * scale, height * scale)
      }
      return canvas.toDataURL('image/jpeg', 0.88).split(',')[1]
    },
    { shot, views, at: clip ?? null },
  )
  return Buffer.from(jpeg, 'base64')
}

async function shoot(
  theme,
  name,
  {
    extra,
    layout,
    env,
    settings,
    social,
    prepare,
    save = true,
    paneOnly = null,
    fullscreen = false,
  } = {},
) {
  const named = only.includes(name) || (name.startsWith('pane-') && only.includes('panes'))
  if (only.length > 0 && !named) return
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-readme-'))
  if (layout) writeFileSync(path.join(dir, 'layout.json'), JSON.stringify(layout))
  prepare?.(dir)
  seedOrbits(dir)
  writeFileSync(
    path.join(dir, 'settings.json'),
    JSON.stringify({
      theme,
      sound: { enabled: false },
      updates: { check: false },
      launcher: { showSystem: false, items: launcherItems },
      ...settings,
    }),
  )
  // Full screen (a preset whose calculator shows only its LCD in a smaller window): the app as
  // it starts, on this display; else a window of W x H.
  const windowed = fullscreen ? [] : ['--windowed']
  const app = await electron.launch({
    args: [MAIN, ...windowed, '--no-intro', `--user-data-dir=${dir}`, '--lang=en-US'],
    // Run from the demo home: PowerShell writes a module cache relative to it.
    cwd: HOME,
    env: {
      ...process.env,
      USERPROFILE: HOME,
      HOMEPATH: '\\Users\\Public\\Documents\\elecdex-demo',
      HOME,
      // A made-up Wi-Fi link in every shot: never this machine's network or addresses.
      ELECDEX_WIFI_STUB: 'demo',
      // And a made-up wired link: never this machine's adapters or addresses.
      ELECDEX_ETHER_STUB: 'demo',
      // A made-up clipboard history (the desk shot): never what this machine has copied.
      ELECDEX_CLIPBOARD_STUB: 'demo',
      ELECDEX_NOWPLAYING_STUB: 'demo',
      // A made-up Docker engine (the dev layout): never this machine's containers.
      ELECDEX_DOCKER_STUB: 'demo',
      // A made-up GPU: never this machine's adapter or its load.
      ELECDEX_GPU_STUB: 'demo',
      // A stand-in power-save blocker: a shot never keeps this machine awake.
      ELECDEX_AWAKE_STUB: '1',
      ...env,
    },
  })
  const page = await app.firstWindow()
  await noGamepads(page)
  if (!fullscreen) {
    await app.evaluate(
      ({ BrowserWindow }, [w, h]) => {
        const win = BrowserWindow.getAllWindows()[0]
        win.setContentSize(w, h)
        win.center()
      },
      [W, H],
    )
  }
  await page.waitForTimeout(4000)
  const terminal = page
    .locator('[data-testid=pane][data-widget=terminal]:not(.hidden) .xterm-helper-textarea')
    .first()
  // A layout may have no shell at all (the ELEC shot gives the middle column to its pane).
  if ((await terminal.count()) > 0) {
    await terminal.focus()
    await page.keyboard.type(`cd "${PROJECT}"; Get-ChildItem -Name`)
    await page.keyboard.press('Enter')
  }
  // Long enough for markets, weather and the globe to fill in.
  await page.waitForTimeout(25000)
  await page.mouse.move(W / 2, H / 3)
  // The status bar hides half a second after the pointer leaves the bottom edge,
  // where a real pointer over the window may have left it.
  await page.waitForTimeout(1000)
  if (extra) await extra(page)
  if (!save) {
    // The shot's own pictures were written by `extra` (the skins' crops).
  } else if (paneOnly !== null) {
    const box = await page
      .locator(`[data-testid=pane][data-pane-id=${paneOnly}]`)
      .first()
      .boundingBox()
    const clip = { x: box.x, y: box.y, width: box.width, height: box.height }
    writeFileSync(path.join(OUT, `${name}.jpg`), await withWebViews(app, page, clip))
  } else if (social) {
    mkdirSync(SOCIAL, { recursive: true })
    await page.screenshot({ path: path.join(SOCIAL, `${name}.png`), type: 'png' })
  } else {
    writeFileSync(path.join(OUT, `${name}.jpg`), await withWebViews(app, page))
  }
  await app.close()
  keepOrbits(dir)
}

const PRESETS = await presetTrees(MAIN)
const preset = (id) => {
  const tree = PRESETS.get(id)
  if (tree === undefined) throw new Error(`no preset ${id} in the built app`)
  return tree
}

// Each preset in a theme of its own, so the README shows every theme at work: standard is
// the default layout, which a profile without layout.json opens with.
await shoot('tron', 'elecdex-tron')
// The Wi-Fi and Ethernet timelines on their one-minute span: a shot is taken half a minute after
// the start, and five minutes of timeline would be mostly the time before it (NOT WATCHED).
await shoot('white', 'elecdex-network', {
  layout: withState(preset('network'), { wifi: { window: '1m' }, ethernet: { window: '1m' } }),
  env: { ELECDEX_SOCKETS_STUB: 'demo' },
})
await shoot('tron', 'elecdex-earth', {
  layout: withState(preset('earth'), { orbit: { starlink: true } }),
})
// Development: a coding agent at work and what it has changed, all of it made up for the shot.
if (only.length === 0 || only.includes('elecdex-dev')) {
  demoRepository()
  await shoot('phosphor', 'elecdex-dev', {
    layout: withState(preset('dev'), {
      agents: { open: SESSION },
      git: { repo: REPO_ID, graph: 'all', listWidth: 0.46 },
    }),
    env: { ELECDEX_CLAUDE_DIR: claudeFolder() },
    prepare: gitRepos,
    // A rest on the merged branch's commit: the card with the whole of it.
    extra: async (page) => {
      await page
        .locator('[data-testid=git-commit]', { hasText: 'bright in sunlight' })
        .hover({ position: { x: 120, y: 10 } })
      await page.getByTestId('git-card').waitFor()
      await page.waitForTimeout(900)
    },
  })
}
// Media: stand-ins for YouTube and X, a made-up feed behind, the demo sound on the spectrum.
if (only.length === 0 || only.includes('elecdex-media')) {
  const standIn = await mediaStandIn()
  await shoot('white', 'elecdex-media', {
    // X in front, as the preset has it; sixteen bands on the spectrum.
    layout: withState(preset('media'), {
      rss: { feeds: [standIn.feedUrl] },
      spectrum: { bands: 16 },
    }),
    env: { ELECDEX_AUDIO_STUB: 'demo', ELECDEX_WEB_HOMES: standIn.homes },
  })
  standIn.server.close()
}
// desk: its calculator in front of the utility pane, answering in its exact form.
await shoot('black', 'elecdex-desk', {
  layout: withState(preset('desk'), {}, sciTab),
  prepare: deskFiles,
  extra: sciInPreset,
  fullscreen: true,
})
// cockpit: the CLUSTER pane where the system column would be, given a full minute so its
// lanes run edge to edge, the pointer over the shell so no figure's card is open.
await shoot('black', 'elecdex-cockpit', {
  layout: withState(preset('cockpit'), { wifi: { window: '1m' }, ethernet: { window: '1m' } }),
  extra: async (page) => {
    await page.mouse.move(W * 0.35, H * 0.9)
    await page.waitForTimeout(35_000)
    // Off the second, so the clock's digits are not caught rolling in.
    await page.waitForTimeout(1000 - (Date.now() % 1000) + 450)
  },
})
// The layouts dialog on a first start: every preset on the shelf and on the number keys.
await shoot('tron', 'elecdex-layouts', {
  env: { ELECDEX_SEED_LAYOUTS: '1' },
  extra: async (page) => {
    await page.keyboard.press('Control+Shift+KeyG')
    await page.getByTestId('layouts-preset').first().waitFor()
    await page.waitForTimeout(900)
  },
})
await shoot('tron', 'elecdex-settings', {
  extra: async (page) => {
    await page.keyboard.press('Control+Shift+Period')
    await page.locator('[data-testid=settings-section][data-section=keyboard]').click()
    await page.waitForTimeout(600)
  },
})
// The action palette over the standard layout, found by a word that reaches several kinds of
// row: the saved layouts from a first start, the presets and the actions about layouts.
await shoot('tron', 'elecdex-palette', {
  env: { ELECDEX_SEED_LAYOUTS: '1' },
  extra: async (page) => {
    await page.keyboard.press('Control+Shift+KeyP')
    await page.getByTestId('action-palette-filter').fill('layout')
    await page.locator('[data-testid=action-palette-row]').first().waitFor()
    await page.waitForTimeout(900)
  },
})
// The ai preset: two chats on two local servers, and the council, all answered by a stand-in.
if (only.length === 0 || only.includes('elecdex-ai')) {
  const standIn = await aiStandIn()
  const baseUrl = `http://127.0.0.1:${standIn.address().port}/v1`
  const providers = [
    { id: 'ollama', name: 'Ollama', kind: 'openai', baseUrl, model: 'qwen3:14b' },
    { id: 'lmstudio', name: 'LM Studio', kind: 'openai', baseUrl, model: 'gemma-3-12b' },
  ]
  await shoot('business-dark', 'elecdex-ai', {
    layout: chatsOn(preset('ai'), ['ollama', 'lmstudio']),
    settings: { ai: { providers } },
    extra: conversing,
  })
  standIn.close()
}
if (only.length === 0 || only.includes('elecdex-elec')) {
  const standIn = await elecStandIn()
  const provider = {
    id: 'ollama',
    name: 'Ollama',
    kind: 'openai',
    baseUrl: `http://127.0.0.1:${standIn.address().port}/v1`,
    model: 'qwen3:14b',
  }
  await shoot('tron', 'elecdex-elec', {
    layout: elecLayout,
    settings: { ai: { providers: [provider] } },
    extra: deliberating,
  })
  standIn.close()
}
// retro: its calculator in front of the pocket ELEC-16 and the CHIP-8, answering in its exact
// form with its panel open (CORE: the ROM running), the demo sound on the spectrum's sixteen
// bands under them.
await shoot('tron', 'elecdex-retro', {
  layout: withState(preset('retro'), { elec16: { panel: true } }, sciTab),
  env: { ELECDEX_AUDIO_STUB: 'demo' },
  extra: sciInPreset,
  fullscreen: true,
})
// blank: no pane at all, the add-pane picker open over it for the first one.
await shoot('amber', 'elecdex-blank', {
  layout: preset('blank'),
  extra: async (page) => {
    await page.getByTestId('workspace-empty-add').click()
    await page.getByTestId('pane-picker-item').first().waitFor()
    await page.mouse.move(W / 2, 4)
    await page.waitForTimeout(900)
  },
})
await shoot('amber', 'elecdex-chip8', { layout: chip8Layout, extra: playing })
await shoot('tron', 'elecdex-elec16', { layout: elec16Layout, extra: sinewave })
/*
 * The ELEC-16's five skins modelled in light, each a crop of the body alone with a margin of
 * the pane round it (nothing of the system column or this machine), SINEWAVE running: the five
 * on a dark theme, then GLASS again on a light one, as it follows the theme's mode.
 */
const skinLayout = {
  version: 1,
  root: { ...pane('elec16'), state: { skin: 'classic', panel: false, tab: 'tune' } },
}
async function skinCrops(page, skins, suffix = '') {
  const toggle = page.getByTestId('elec16-panel-toggle')
  for (const skin of skins) {
    await toggle.click()
    await page.locator(`[data-testid=elec16-skin][data-skin="${skin}"]`).click()
    await toggle.click()
    await page.mouse.move(W / 2, 4)
    await page.waitForTimeout(1500)
    const box = await page.getByTestId('elec16-device').boundingBox()
    const m = 28
    const clip = {
      x: box.x - m,
      y: box.y - m,
      width: box.width + 2 * m,
      height: box.height + 2 * m,
    }
    const picture = await page.screenshot({ type: 'jpeg', quality: 90, clip })
    writeFileSync(path.join(OUT, `elecdex-skin-${skin}${suffix}.jpg`), picture)
  }
}
if (only.length === 0 || only.includes('elecdex-skins')) {
  await shoot('tron', 'elecdex-skins', {
    layout: skinLayout,
    save: false,
    extra: async (page) => {
      await sinewave(page)
      await skinCrops(page, ['alloy', 'graphite', 'neo', 'mochi', 'glass'])
    },
  })
  await shoot('business-light', 'elecdex-skins', {
    layout: skinLayout,
    save: false,
    extra: async (page) => {
      await sinewave(page)
      await skinCrops(page, ['glass'], '-light')
    },
  })
}
// ELEC-16 PLAY: one shot a game, each in a body, a colour and a theme of its own.
await shoot('business-dark', 'elecdex-play', {
  layout: playLayout({ tab: 'games', playBody: 'tall', playSkin: 'coral' }),
  prepare: playUnit('ELECLANCE'),
  extra: eleclance,
})
await shoot('phosphor', 'elecdex-play-air', {
  layout: playLayout({ tab: 'core', playBody: 'wide', playSkin: 'graphite' }),
  prepare: playUnit('ELECAIRCOMBAT'),
  extra: airCombat,
})
await shoot('business-light', 'elecdex-play-drill', {
  layout: playLayout({ tab: 'mem', playBody: 'screen', playSkin: 'ivory' }),
  prepare: playUnit('ELECDRILL'),
  extra: elecdrill,
})
await shoot('business-light', 'elecdex-sci', {
  layout: playLayout({ tab: 'core', sciSkin: 'chalk' }),
  prepare: sciUnit,
  extra: sciAnswer,
})
await shoot('tron', 'elecdex-play-fighter', {
  layout: playLayout({ tab: 'games', playBody: 'screen', playSkin: 'graphite' }),
  prepare: playUnit('ELECFIGHTER'),
  extra: elecfighter,
})
/*
 * Each pane alone, for the README's Panes section (`npm run gen:screenshots -- panes`, or one
 * by its name, `pane-git`): the pane given a fixed share of the 1600x900 window - wide, medium
 * or small, as it is used - in the Tron theme, and only its own box saved. The rest of the
 * window is the calendar, never in the picture. The pane's data is the other shots' stand-ins:
 * the demo home, the made-up repository, sockets, links, Docker, clipboard, media and GPU, the
 * stand-in models; markets, weather, quakes and the stations' orbits are live.
 */
const PANE_SIZES = {
  wide: [0.62, 0.72],
  short: [0.62, 0.42],
  medium: [0.46, 0.58],
  low: [0.46, 0.36],
  band: [0.46, 0.24],
  small: [0.3, 0.5],
  little: [0.3, 0.28],
}
function aloneLayout(widget, size, state = {}) {
  const [w, h] = PANE_SIZES[size]
  const target = { ...pane(widget), state }
  return {
    target: target.id,
    layout: {
      version: 1,
      root: split(
        'column',
        [split('row', [target, pane('calendar')], [w, 1 - w]), pane('calendar')],
        [h, 1 - h],
      ),
    },
  }
}
/** A pane's state as a preset gives it (the desk's notes and tasks, the dev's agents). */
function stateIn(presetId, widget) {
  let found = {}
  const visit = (node) => {
    if (node.kind === 'pane') {
      if (node.widget === widget && Object.keys(found).length === 0) found = node.state ?? {}
      return
    }
    for (const child of node.children) visit(child)
  }
  visit(preset(presetId).root)
  return found
}
async function shootPane(widget, size, { state, name, theme = 'tron', ...options } = {}) {
  const file = `pane-${name ?? widget}`
  if (only.length > 0 && !only.includes(file) && !only.includes('panes')) return
  const { target, layout } = aloneLayout(widget, size, state)
  await shoot(theme, file, { ...options, layout, paneOnly: target })
}
async function calculating(page) {
  const input = page.getByTestId('calc-input')
  for (const line of ['1280 * 1.1', '365 * 24 * 60', 'sqrt(2) * 100', '0xff + 0b1010', '2 ^ 16']) {
    await input.fill(line)
    await input.press('Enter')
    await page.waitForTimeout(250)
  }
  await page.mouse.move(W / 2, 4)
}
/** A link's timeline watched for its whole minute (the shot comes 30 s after the start). */
const aMinute = async (page) => {
  await page.mouse.move(W / 2, 4)
  await page.waitForTimeout(34_000)
}
const offCards = async (page) => {
  await page.mouse.move(W / 2, 4)
  await page.waitForTimeout(800)
}
if (only.length === 0 || only.includes('panes') || only.some((n) => n.startsWith('pane-'))) {
  await shootPane('terminal', 'wide')
  await shootPane('sysinfo', 'band')
  await shootPane('cpu', 'medium')
  await shootPane('memory', 'small')
  await shootPane('gpu', 'small')
  await shootPane('disk', 'little')
  await shootPane('cluster', 'wide', {
    extra: async (page) => {
      await page.mouse.move(W / 2, 4)
      await page.waitForTimeout(35_000)
    },
  })
  await shootPane('launcher', 'band', { extra: offCards })
  await shootPane('filesystem', 'band', { extra: offCards })
  await shootPane('globe', 'medium', { env: { ELECDEX_SOCKETS_STUB: 'demo' }, extra: offCards })
  await shootPane('connections', 'wide', { env: { ELECDEX_SOCKETS_STUB: 'demo' }, extra: offCards })
  await shootPane('wifi', 'wide', { state: { window: '1m' }, extra: aMinute })
  await shootPane('ethernet', 'wide', { state: { window: '1m' }, extra: aMinute })
  if (only.length === 0 || only.includes('panes') || only.includes('pane-agents')) {
    await shootPane('agents', 'short', {
      state: { open: SESSION },
      env: { ELECDEX_CLAUDE_DIR: claudeFolder() },
      extra: offCards,
    })
  }
  await shootPane('orbit', 'wide', { state: { starlink: true }, extra: offCards })
  if (only.length === 0 || only.includes('panes') || only.includes('pane-git')) {
    demoRepository()
    await shootPane('git', 'wide', {
      state: { repo: REPO_ID, graph: 'all', listWidth: 0.46 },
      prepare: gitRepos,
      extra: offCards,
    })
  }
  await shootPane('docker', 'medium', { extra: offCards })
  if (only.length === 0 || only.includes('panes') || only.includes('pane-logwatch')) {
    const council = await startCouncil({ chat: LOGWATCH_ANSWER })
    history()
    live.start()
    await shootPane('logwatch', 'wide', {
      state: { file: LOG_ID },
      settings: council.settings,
      prepare: logFiles,
      extra: explaining,
    })
    live.stop()
    council.close()
  }
  await shootPane('markets', 'medium', { extra: offCards })
  await shootPane('weather', 'small', { extra: offCards })
  if (only.length === 0 || only.includes('panes') || only.includes('pane-aichat')) {
    const standIn = await aiStandIn()
    const provider = {
      id: 'ollama',
      name: 'Ollama',
      kind: 'openai',
      baseUrl: `http://127.0.0.1:${standIn.address().port}/v1`,
      model: 'qwen3:14b',
    }
    await shootPane('aichat', 'wide', {
      state: { provider: 'ollama' },
      settings: { ai: { providers: [provider] } },
      extra: async (page) => {
        await ask(page.locator('[data-testid=pane][data-widget=aichat]').first(), CHAT[0].ask)
        await page.mouse.move(W / 2, 4)
      },
    })
    standIn.close()
  }
  if (only.length === 0 || only.includes('panes') || only.includes('pane-elec')) {
    const standIn = await elecStandIn()
    const provider = {
      id: 'ollama',
      name: 'Ollama',
      kind: 'openai',
      baseUrl: `http://127.0.0.1:${standIn.address().port}/v1`,
      model: 'qwen3:14b',
    }
    await shootPane('elec', 'wide', {
      settings: { ai: { providers: [provider] } },
      extra: deliberating,
    })
    standIn.close()
  }
  if (
    only.length === 0 ||
    only.includes('panes') ||
    only.includes('pane-rss') ||
    only.includes('pane-web')
  ) {
    const standIn = await mediaStandIn()
    await shootPane('rss', 'low', { state: { feeds: [standIn.feedUrl] }, extra: offCards })
    await shootPane('web.x', 'wide', {
      name: 'web',
      env: { ELECDEX_WEB_HOMES: standIn.homes },
      extra: offCards,
    })
    standIn.server.close()
  }
  await shootPane('quakes', 'medium', { extra: offCards })
  await shootPane('calc', 'small', { extra: calculating })
  await shootPane('notes', 'medium', {
    state: stateIn('desk', 'notes'),
    prepare: deskFiles,
    extra: offCards,
  })
  await shootPane('todo', 'medium', {
    state: stateIn('desk', 'todo'),
    prepare: deskFiles,
    extra: offCards,
  })
  await shootPane('timer', 'small', { extra: offCards })
  await shootPane('clipboard', 'medium', { extra: offCards })
  await shootPane('calendar', 'small', { extra: offCards })
  await shootPane('spectrum', 'medium', {
    state: { bands: 16 },
    env: { ELECDEX_AUDIO_STUB: 'demo' },
    extra: offCards,
  })
  await shootPane('mixer', 'small', { env: { ELECDEX_AUDIO_STUB: 'demo' }, extra: offCards })
  await shootPane('nowplaying', 'low', { extra: offCards })
  await shootPane('utility', 'medium', {
    state: { module: 'qr', qrKind: 'url', qrUrl: 'https://github.com/kurouna/elecdex' },
    extra: offCards,
  })
  await shootPane('chip8', 'wide', {
    state: { view: 'run', program: 'archive/t8nks' },
    extra: playing,
  })
  await shootPane('elec16', 'wide', { state: { skin: 'alloy', panel: false }, extra: sinewave })
}
// For posting: the pane alone, the council sitting and the council decided. Only when named.
for (const [name, extra, pace] of [
  ['social-elec-sitting', sitting, 110],
  ['social-elec-approved', deliberating, 25],
]) {
  if (!only.includes(name)) continue
  const standIn = await elecStandIn(pace)
  const provider = {
    id: 'ollama',
    name: 'Ollama',
    kind: 'openai',
    baseUrl: `http://127.0.0.1:${standIn.address().port}/v1`,
    model: 'qwen3:14b',
  }
  await shoot('tron', name, {
    layout: { version: 1, root: pane('elec') },
    settings: { ai: { providers: [provider] } },
    extra,
    social: true,
  })
  standIn.close()
}
/*
 * docs/elec16.md's picture (elecdex-elec16-pair), in Tron: what v0.0.48 fixed. The pocket ELEC-16 and an SCI-128 side by side in
 * the middle column, both in the Tron skin, the pocket over a shell, the system and the world on either
 * side: the pocket prints the BASIC expressions that came out wrong before, the calculator
 * works the cube root that now comes out exact.
 */
const whatsNew48Layout = {
  version: 1,
  root: split(
    'row',
    [
      split(
        'column',
        ['clock', 'sysinfo', 'cpu', 'memory', 'toplist', 'throughput'].map(pane),
        [0.05, 0.14, 0.24, 0.14, 0.23, 0.2],
      ),
      split(
        'row',
        [
          split(
            'column',
            [{ ...pane('elec16'), state: { skin: 'tron', panel: false } }, pane('terminal')],
            [0.56, 0.44],
          ),
          { ...pane('elec16'), state: { fresh: 'sci-128', skin: 'tron', panel: false } },
        ],
        [0.64, 0.36],
      ),
      split('column', ['globe', 'markets', 'weather'].map(pane), [0.4, 0.32, 0.28]),
    ],
    [0.17, 0.66, 0.17],
  ),
}

/** The pocket printing the fixed BASIC expressions, then the calculator's ∛(1000)-10. */
async function whatsNew48(page) {
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('[data-testid=elec16]')].length === 2 &&
      [...document.querySelectorAll('[data-testid=elec16]')].every(
        (d) => d.getAttribute('data-asleep') === 'true',
      ),
    null,
    { timeout: 30_000 },
  )
  const sciDevice = page.getByTestId('elec16-sci-device')
  const pocket = page.locator('[data-testid=elec16]', { hasNot: sciDevice })
  const sci = page.locator('[data-testid=elec16]', { has: sciDevice })
  await pocket.focus()
  for (const line of ['PRINT INT(2.5)^2;LEN("ABC")^2', 'PRINT +-2;(-1)^1000']) {
    await page.keyboard.type(line, { delay: 30 })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
  }
  await sci.focus()
  // Shift+R is ∛, R's SHIFT face.
  for (const key of ['Shift+R', '1', '0', '0', '0', ')', '-', '1', '0', 'Enter']) {
    await page.keyboard.press(key)
    await page.waitForTimeout(150)
  }
  await page.waitForTimeout(800)
  await page.mouse.move(W / 2, H / 6)
}

await shoot('tron', 'elecdex-elec16-pair', { layout: whatsNew48Layout, extra: whatsNew48 })

/*
 * The README's first picture (elecdex-hero), in Tron: the dev preset at work - a coding agent's
 * session, the repository it changes, the system column beside - with two toasts in the corner:
 * a task's reminder come due, and the git pane's PUSH to a bare remote in the demo home, never a
 * real one.
 */
const DUE_TASK = 'Review the pull request for the orbit map'

/** The desk's tasks, the first due 40 s after the profile is written: its reminder lands in the shot. */
function dueSoon(dir) {
  deskFiles(dir)
  const file = path.join(dir, 'tasks.json')
  const tasks = JSON.parse(readFileSync(file, 'utf8'))
  for (const task of tasks.tasks) if (task.title === DUE_TASK) task.due = Date.now() + 40_000
  writeFileSync(file, JSON.stringify(tasks))
}

/** The reminder up, then the commit ahead of origin pushed (two presses): both toasts on screen. */
async function dueAndPushed(page) {
  const toast = page.getByTestId('toast')
  await toast.filter({ hasText: DUE_TASK }).waitFor({ timeout: 40_000 })
  const repo = page.locator('[data-testid=pane][data-widget=git]')
  await repo.getByTestId('git-head').filter({ hasText: '↑1' }).waitFor({ timeout: 20_000 })
  const push = repo.getByTestId('git-push')
  await push.click()
  await page.waitForTimeout(1200)
  await push.click()
  await toast.filter({ hasText: 'PUSHED' }).waitFor({ timeout: 30_000 })
  // Off the stack and the panes: a pointer resting on a pane would show its buttons.
  await page.mouse.move(W / 2, 4)
  await page.waitForTimeout(900)
}

if (only.length === 0 || only.includes('elecdex-hero')) {
  demoRepository()
  const remote = await remoteBehind()
  await shoot('tron', 'elecdex-hero', {
    layout: withState(preset('dev'), {
      agents: { open: SESSION },
      git: { repo: REPO_ID, graph: 'all', listWidth: 0.46 },
    }),
    env: { ELECDEX_CLAUDE_DIR: claudeFolder() },
    prepare: (dir) => {
      gitRepos(dir)
      dueSoon(dir)
    },
    extra: dueAndPushed,
  })
  remote.close()
  rmSync(path.dirname(REMOTE), { recursive: true, force: true })
}
// For posting: the Ethernet pane popped up over the standard layout, on a made-up cable taking
// CRC errors, its timeline on one minute. Only when named.
if (only.includes('social-ethernet-popup')) {
  await shoot('tron', 'social-ethernet-popup', {
    env: { ELECDEX_ETHER_STUB: 'crc' },
    social: true,
    extra: async (page) => {
      await page.keyboard.press('Control+Shift+KeyA')
      const picker = page.getByTestId('pane-picker')
      await picker.locator('[data-testid=pane-picker-placement][data-placement=popup]').click()
      await picker.locator('[data-testid=pane-picker-item][data-widget=ethernet]').click()
      const popup = page.getByTestId('popup-pane')
      await popup.getByTestId('ether-name').waitFor()
      await popup.locator('[data-testid=ether-window][data-window="1m"]').click()
      // A minute of readings, so the timeline runs edge to edge.
      await page.waitForTimeout(62_000)
      await page.mouse.move(W / 2, 5)
      await page.waitForTimeout(800)
    },
  })
}
console.log(`wrote ${OUT}`)
