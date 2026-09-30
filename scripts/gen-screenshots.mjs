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
 * Shots for posting (`social-elec-sitting`, `social-elec-approved`) are taken only when named,
 * as PNG into release/social, which is not committed: the ELEC system pane alone,
 * so nothing of the machine is in them.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { _electron as electron } from '@playwright/test'
import {
  claudeFolder,
  demoRepository,
  gitRepos,
  HOME,
  keepOrbits,
  PROJECT,
  prepareHome,
  REPO_ID,
  SESSION,
  seedOrbits,
} from './demo-fixtures.mjs'
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
async function withWebViews(app, page) {
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
  if (views.length === 0) return page.screenshot({ type: 'jpeg', quality: 88 })
  const shot = (await page.screenshot({ type: 'png' })).toString('base64')
  const jpeg = await page.evaluate(
    async ({ shot, views }) => {
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
      const scale = base.naturalWidth / window.innerWidth
      const context = canvas.getContext('2d')
      context.drawImage(base, 0, 0)
      for (const { bounds, png } of views) {
        const image = await load(png)
        const { x, y, width, height } = bounds
        context.drawImage(image, x * scale, y * scale, width * scale, height * scale)
      }
      return canvas.toDataURL('image/jpeg', 0.88).split(',')[1]
    },
    { shot, views },
  )
  return Buffer.from(jpeg, 'base64')
}

async function shoot(theme, name, { extra, layout, env, settings, social, prepare } = {}) {
  if (only.length > 0 && !only.includes(name)) return
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
  const app = await electron.launch({
    args: [MAIN, '--windowed', '--no-intro', `--user-data-dir=${dir}`, '--lang=en-US'],
    // Run from the demo home: PowerShell writes a module cache relative to it.
    cwd: HOME,
    env: {
      ...process.env,
      USERPROFILE: HOME,
      HOMEPATH: '\\Users\\Public\\Documents\\elecdex-demo',
      HOME,
      // A made-up Wi-Fi link in every shot: never this machine's network or addresses.
      ELECDEX_WIFI_STUB: 'demo',
      // A made-up clipboard history (the desk shot): never what this machine has copied.
      ELECDEX_CLIPBOARD_STUB: 'demo',
      ELECDEX_NOWPLAYING_STUB: 'demo',
      // A made-up Docker engine (the dev layout): never this machine's containers.
      ELECDEX_DOCKER_STUB: 'demo',
      // A stand-in power-save blocker: a shot never keeps this machine awake.
      ELECDEX_AWAKE_STUB: '1',
      ...env,
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
  if (social) {
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
// The Wi-Fi timeline on its one-minute span: a shot is taken half a minute after the start, and
// five minutes of timeline would be mostly the time before it (NOT WATCHED).
await shoot('amber', 'elecdex-network', {
  layout: withState(preset('network'), { wifi: { window: '1m' } }),
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
// The utility pane with a QR code for the project's page: the most to see of its three tools.
await shoot('business-light', 'elecdex-desk', {
  layout: withState(preset('desk'), {
    utility: { module: 'qr', qrKind: 'url', qrUrl: 'https://github.com/kurouna/elecdex' },
  }),
  prepare: deskFiles,
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
await shoot('amber', 'elecdex-chip8', { layout: chip8Layout, extra: playing })
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
console.log(`wrote ${OUT}`)
