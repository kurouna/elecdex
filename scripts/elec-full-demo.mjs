/**
 * A tour of elecdex driven for a screen recording: the boot sequence, then - at a pace a person
 * can follow - a shell typed into, a new tab, a split and its close, a pane brought forward, a
 * countdown whose toast lands while the AI chat pane answers, a switch to a second saved layout
 * where the ELEC system pane votes, the switch back, and each built-in theme in turn. Everything
 * runs in the demo profile of scripts/gen-screenshots.mjs, and both the chat and the council talk
 * to stand-ins served from here (no model, no key). The window is a normal window, not
 * fullscreen, so it can be captured.
 *
 * Windows only, like the screenshots. Run `npm run build` first, then
 * `node scripts/elec-full-demo.mjs`. Close the window to end it.
 *
 *   --probe            open the window at its size and wait: to check the size and place for
 *                      the recorder before the takes
 *   --width=1600       content size of the window, in pixels (--height=900)
 *   --x=.. --y=..      where the window goes (centred when left out)
 *   --lead=10          seconds between the window appearing and the tour starting
 *   --no-intro         skip the boot sequence
 *   --theme=tron       any built-in theme
 *   --user=taro        the name the boot sequence welcomes (--host=ELECDEX-DEMO for the machine)
 */
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { _electron as electron } from '@playwright/test'

const MAIN = path.resolve('out/main/index.js')
const HOME = 'C:\\Users\\Public\\Documents\\elecdex-demo'
const PROJECT = `${HOME}\\projects\\elecdex`
const option = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]
const number = (name, fallback) => {
  const value = option(name)
  return value === undefined ? fallback : Number(value)
}
const PROBE = process.argv.includes('--probe')
const INTRO = !process.argv.includes('--no-intro')
const W = number('width', 1600)
const H = number('height', 900)
const X = option('x') === undefined ? null : number('x', 0)
const Y = option('y') === undefined ? null : number('y', 0)
const LEAD = number('lead', 10)
const THEME = option('theme') ?? 'tron'
/** How long a typed key takes: slow enough to read along. */
const TYPE_DELAY = 70
/** The shell types quicker, as a hand used to its commands does. */
const SHELL_DELAY = 35

// A demo home that looks like a checkout of this project, as in the screenshots.
for (const dir of ['Documents', 'Downloads', 'docs', 'public', 'scripts', 'src', 'tests']) {
  const parent = ['Documents', 'Downloads'].includes(dir) ? HOME : PROJECT
  mkdirSync(path.join(parent, dir), { recursive: true })
}
for (const file of ['README.md', 'package.json', 'LICENSE', 'biome.json', 'tsconfig.json']) {
  writeFileSync(path.join(PROJECT, file), '')
}

let nextId = 0
const pane = (widget, state) => ({
  kind: 'pane',
  id: `p${nextId++}`,
  widget,
  ...(state ? { state } : {}),
})
const split = (direction, children, sizes) => ({
  kind: 'split',
  id: `s${nextId++}`,
  direction,
  children,
  sizes,
})
const monitors = () =>
  split(
    'column',
    ['clock', 'sysinfo', 'cpu', 'memory', 'disk', 'toplist', 'netstat', 'throughput'].map((w) =>
      pane(w),
    ),
    [0.04, 0.125, 0.19, 0.12, 0.116, 0.189, 0.055, 0.165],
  )
const world = () =>
  split(
    'column',
    ['globe', 'markets', 'weather', 'calendar'].map((w) => pane(w)),
    [0.3, 0.25, 0.22, 0.23],
  )

/** The countdown the toast comes from: short, so it lands during the chat. */
const COUNTDOWN_MS = 20_000
const workspace = {
  version: 1,
  root: split(
    'row',
    [
      monitors(),
      split(
        'column',
        [
          { kind: 'tabs', id: 'shells', children: [pane('terminal')], activeIndex: 0 },
          split(
            'row',
            [pane('aichat'), pane('timer', { mode: 'timer', durationMs: COUNTDOWN_MS })],
            [0.64, 0.36],
          ),
        ],
        [0.5, 0.5],
      ),
      world(),
    ],
    [0.18, 0.64, 0.18],
  ),
}
const council = {
  version: 1,
  root: split('row', [monitors(), pane('elec'), world()], [0.18, 0.64, 0.18]),
}

const ASK = 'How do I debounce file watcher events in Node.js?'
const ANSWER = [
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
  '- **Watch the folder**, not the file: editors often save by renaming.',
  '- **150 ms** covers a two-step write and still feels immediate.',
].join('\n')

const MOTION = 'Should we move the team to a four-day working week next quarter?'
const VOTES = {
  'UNIT-1':
    'The trials we have point one way: output per hour rose and costs fell with the office days. The risk is in customer hours, which a rota can cover.\nVERDICT: APPROVE\nCONFIDENCE: 78',
  'UNIT-2':
    'Those on hourly contracts would lose pay unless the change protects them, and **nothing in the motion does**. Fairness first, then the long weekend.\nVERDICT: REJECT\nCONFIDENCE: 64',
  'UNIT-3':
    'People are tired. A long weekend is the kind of promise that makes a team want to stay - it feels right, and it would be felt.\nVERDICT: APPROVE\nCONFIDENCE: 85',
}

/**
 * One stand-in for both panes, speaking the OpenAI dialect as Ollama streams it: the council's
 * units are told apart by the unit their system prompt names; anything else is the chat.
 */
const server = createServer((req, res) => {
  let raw = ''
  req.on('data', (piece) => {
    raw += piece
  })
  req.on('end', () => {
    const system = JSON.parse(raw).messages?.[0]?.content ?? ''
    const unit = /UNIT-\d/.exec(system)?.[0]
    const answer = unit ? VOTES[unit] : ANSWER
    res.writeHead(200, { 'content-type': 'text/event-stream' })
    const pieces = answer.match(unit ? /.{1,8}/gs : /.{1,10}/gs) ?? []
    const step = () => {
      const piece = pieces.shift()
      if (piece === undefined) {
        const usage = { prompt_tokens: 214, completion_tokens: 96 }
        res.write(`data: ${JSON.stringify({ choices: [], usage })}\n\n`)
        res.end('data: [DONE]\n\n')
        return
      }
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: piece } }] })}\n\n`)
      setTimeout(step, unit ? 110 : 70)
    }
    setTimeout(step, 900)
  })
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))

const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-tour-'))
writeFileSync(path.join(dir, 'layout.json'), JSON.stringify(workspace))
writeFileSync(
  path.join(dir, 'layouts.json'),
  JSON.stringify({
    version: 1,
    items: [
      { id: 'work', name: 'WORKSPACE', tree: workspace },
      { id: 'council', name: 'COUNCIL', tree: council },
    ],
    active: 'work',
  }),
)
writeFileSync(
  path.join(dir, 'settings.json'),
  JSON.stringify({
    theme: THEME,
    sound: { enabled: true },
    updates: { check: false },
    launcher: { showSystem: false, items: [] },
    // Shells are open, and the question would stop the tour.
    layout: { confirmSwitch: false },
    ai: {
      providers: [
        {
          id: 'ollama',
          name: 'Ollama',
          kind: 'openai',
          baseUrl: `http://127.0.0.1:${server.address().port}/v1`,
          model: 'qwen3:14b',
        },
      ],
    },
  }),
)

const app = await electron.launch({
  args: [
    MAIN,
    '--windowed',
    ...(INTRO ? [] : ['--no-intro']),
    `--user-data-dir=${dir}`,
    '--lang=en-US',
  ],
  // Run from the demo home: PowerShell writes a module cache relative to it.
  cwd: HOME,
  env: {
    ...process.env,
    USERPROFILE: HOME,
    HOMEPATH: '\\Users\\Public\\Documents\\elecdex-demo',
    HOME,
    // The boot sequence welcomes the user by name: a made-up one, and a made-up machine.
    ELECDEX_DEMO_USER: option('user') ?? 'taro',
    ELECDEX_DEMO_HOST: option('host') ?? 'ELECDEX-DEMO',
  },
})
const page = await app.firstWindow()
const bounds = await app.evaluate(
  ({ BrowserWindow }, [w, h, x, y]) => {
    const win = BrowserWindow.getAllWindows()[0]
    win.setContentSize(w, h)
    if (x === null || y === null) win.center()
    else win.setPosition(x, y)
    return { outer: win.getBounds(), content: win.getContentBounds() }
  },
  [W, H, X, Y],
)
const closed = new Promise((resolve) => app.on('close', resolve))
const wait = (ms) => Promise.race([page.waitForTimeout(ms).catch(() => {}), closed])
const say = (text) => console.log(`${new Date().toTimeString().slice(0, 8)} ${text}`)
const fmt = (b) => `${b.width}x${b.height} at (${b.x}, ${b.y})`
say(`window ${fmt(bounds.outer)}, content ${fmt(bounds.content)}`)

const paneOf = (widget) => page.locator(`[data-testid=pane][data-widget=${widget}]`)
const visibleShell = () =>
  page.locator('[data-testid=pane][data-widget=terminal]:not(.hidden) .xterm-helper-textarea')

/** Types a command into the shell that has focus, and gives its output a moment. */
async function run(command, after = 1800) {
  await page.keyboard.type(command, { delay: SHELL_DELAY })
  await wait(400)
  await page.keyboard.press('Enter')
  await wait(after)
}
async function chord(keys, after = 1500) {
  await page.keyboard.press(keys)
  await wait(after)
}

async function shell() {
  say('shell')
  await visibleShell().first().focus()
  await wait(600)
  await run(`cd "${PROJECT}"`, 800)
  await run('Get-ChildItem -Name')
  await run('Get-Date -Format "yyyy-MM-dd HH:mm:ss"', 2200)
}

async function tabs() {
  say('tabs: a new shell tab, then back and forth')
  await chord('Control+Shift+KeyT', 2500)
  await visibleShell().first().focus()
  await run('$PSVersionTable.PSVersion', 2200)
  await chord('Control+Shift+ArrowLeft')
  await chord('Control+Shift+ArrowRight')
  await chord('Control+Shift+ArrowLeft', 1800)
}

async function panes() {
  say('panes: split, close, bring forward')
  await visibleShell().first().focus()
  await chord('Control+Shift+KeyE', 2500)
  await visibleShell().last().focus()
  await run('"split right"', 1800)
  await chord('Control+Shift+KeyW', 2500)
  await paneOf('globe').click()
  await wait(800)
  await chord('Control+Shift+KeyZ', 4500)
  await chord('Control+Shift+KeyZ', 2000)
}

async function chatWithCountdown() {
  say(`countdown: ${COUNTDOWN_MS / 1000} s`)
  await paneOf('timer').getByTestId('timer-start').first().click()
  await wait(1500)
  say('ai chat')
  const input = paneOf('aichat').getByTestId('aichat-input')
  await input.click()
  await page.keyboard.type(ASK, { delay: TYPE_DELAY })
  await wait(700)
  await page.keyboard.press('Enter')
  await paneOf('aichat').getByTestId('aichat-usage').waitFor({ timeout: 90_000 })
  await page
    .getByTestId('toast')
    .first()
    .waitFor({ timeout: COUNTDOWN_MS + 30_000 })
  say('toast is up')
  await wait(6000)
}

async function elec() {
  say('layout: COUNCIL')
  await chord('Control+Shift+Digit2', 4000)
  const pane = paneOf('elec')
  await pane.getByTestId('elec-input').click()
  await page.keyboard.type(MOTION, { delay: 55 })
  await wait(700)
  await page.keyboard.press('Enter')
  say('elec: deliberating')
  await pane.getByTestId('elec-outcome').waitFor({ timeout: 90_000 })
  say('elec: resolved')
  await wait(9000)
  say('layout: WORKSPACE')
  await chord('Control+Shift+Digit1', 5000)
}

/** The built-in themes the tour ends on, one after another, back to the one it started in. */
const THEMES = ['amber', 'phosphor', 'white', 'business-dark', 'business-light']

async function themes() {
  say('themes')
  // The status bar shows while the pointer is at the bottom edge; its select is the theme.
  await page.mouse.move(W / 2, H - 2)
  await page.getByTestId('status-bar').and(page.locator('[data-shown=true]')).waitFor()
  await wait(1000)
  const select = page.getByTestId('theme-select')
  for (const theme of [...THEMES.filter((t) => t !== THEME), THEME]) {
    await select.selectOption(theme)
    say(`theme: ${theme}`)
    await wait(3500)
  }
  await page.mouse.move(W / 2, H / 3)
  await wait(3000)
}

try {
  if (PROBE) {
    say('probe: set the recorder to this window, then close it')
  } else {
    say(`the tour starts in ${LEAD} s`)
    await wait(LEAD * 1000)
    // The pointer out of the way, and off the bottom edge where the status bar shows.
    await page.mouse.move(W / 2, H / 3)
    await shell()
    await tabs()
    await panes()
    await chatWithCountdown()
    await elec()
    await themes()
    say('done - close the window to end')
  }
  await closed
} catch (error) {
  say(`ended: ${error.message.split('\n')[0]}`)
}
await app.close().catch(() => {})
server.close()
