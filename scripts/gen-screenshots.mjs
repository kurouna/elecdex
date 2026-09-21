/**
 * README screenshots (docs/screenshots/*.jpg): the default layout in a clean demo
 * profile, so no personal paths, Start Menu entries or files appear. Live data
 * (markets, weather, globe) comes from the real services.
 *
 * Windows only, as written: the demo home is under C:/Users/Public. Run
 * `npm run build` first, then `npm run gen:screenshots`; name shots to take only those
 * (`npm run gen:screenshots -- elecdex-audio`).
 */
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { _electron as electron } from '@playwright/test'

const OUT = path.resolve('docs/screenshots')
const MAIN = path.resolve('out/main/index.js')
const HOME = 'C:\\Users\\Public\\Documents\\elecdex-demo'
const PROJECT = `${HOME}\\projects\\elecdex`
/** The shots named on the command line, or every shot. */
const only = process.argv.slice(2)
const W = 1600
const H = 900

mkdirSync(OUT, { recursive: true })

// A demo home that looks like a checkout of this project.
for (const dir of ['Documents', 'Downloads', 'docs', 'public', 'scripts', 'src', 'tests']) {
  const parent = ['Documents', 'Downloads'].includes(dir) ? HOME : PROJECT
  mkdirSync(path.join(parent, dir), { recursive: true })
}
for (const file of ['README.md', 'package.json', 'LICENSE', 'biome.json', 'tsconfig.json']) {
  writeFileSync(path.join(PROJECT, file), '')
}

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
 * The default layout (src/shared/default-layout.ts) with a spectrum and a mixer, 2:1,
 * under the launcher and file browser. Written out here because a script cannot
 * import the TypeScript source.
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
const audioLayout = {
  version: 1,
  root: split(
    'row',
    [
      split(
        'column',
        ['clock', 'sysinfo', 'cpu', 'memory', 'disk', 'toplist', 'netstat', 'throughput'].map(pane),
        [0.04, 0.125, 0.19, 0.12, 0.116, 0.189, 0.055, 0.165],
      ),
      split(
        'column',
        [
          {
            kind: 'tabs',
            id: 'shells',
            children: [pane('terminal'), pane('terminal'), pane('terminal')],
            activeIndex: 0,
          },
          split('row', [pane('launcher'), pane('filesystem')], [0.5, 0.5]),
          split('row', [pane('spectrum'), pane('mixer')], [0.66, 0.34]),
        ],
        [0.52, 0.22, 0.26],
      ),
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
 * The AI chat pane, talking to a stand-in served from this machine: no model, no key and no
 * service is involved, and what is "said" is written here. It speaks the OpenAI dialect the way
 * Ollama does - the first answer whole, with its token counts; the second slowly, so the shot
 * catches it arriving.
 */
const chatLayout = {
  version: 1,
  root: split(
    'row',
    [
      split(
        'column',
        ['clock', 'sysinfo', 'cpu', 'memory', 'disk', 'toplist', 'netstat', 'throughput'].map(pane),
        [0.04, 0.125, 0.19, 0.12, 0.116, 0.189, 0.055, 0.165],
      ),
      split('column', [pane('terminal'), pane('aichat')], [0.34, 0.66]),
      split(
        'column',
        ['globe', 'markets', 'weather', 'calendar'].map(pane),
        [0.3, 0.25, 0.22, 0.23],
      ),
    ],
    [0.18, 0.64, 0.18],
  ),
}

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

function chatStandIn() {
  let asked = 0
  const server = createServer((req, res) => {
    req.resume()
    req.on('end', () => {
      const { answer } = CHAT[Math.min(asked, CHAT.length - 1)]
      const slow = asked > 0
      asked += 1
      res.writeHead(200, { 'content-type': 'text/event-stream' })
      const pieces = answer.match(/.{1,12}/gs) ?? []
      const step = () => {
        const piece = pieces.shift()
        if (piece === undefined) {
          const usage = { prompt_tokens: 38, completion_tokens: 212 }
          res.write(`data: ${JSON.stringify({ choices: [], usage })}\n\n`)
          res.end('data: [DONE]\n\n')
          return
        }
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: piece } }] })}\n\n`)
        setTimeout(step, slow ? 110 : 45)
      }
      step()
    })
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

async function chatting(page) {
  const chat = page.locator('[data-testid=pane][data-widget=aichat]')
  const input = chat.getByTestId('aichat-input')
  await input.fill(CHAT[0].ask)
  await input.press('Enter')
  await chat.getByTestId('aichat-usage').waitFor()
  await input.fill(CHAT[1].ask)
  await input.press('Enter')
  // Far enough into the second answer for its code to be on screen, not so far that it is over.
  await page.waitForTimeout(3000)
}

async function shoot(theme, name, { extra, layout, env, settings } = {}) {
  if (only.length > 0 && !only.includes(name)) return
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-readme-'))
  if (layout) writeFileSync(path.join(dir, 'layout.json'), JSON.stringify(layout))
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
  await terminal.focus()
  await page.keyboard.type(`cd "${PROJECT}"; Get-ChildItem -Name`)
  await page.keyboard.press('Enter')
  // Long enough for markets, weather and the globe to fill in.
  await page.waitForTimeout(25000)
  await page.mouse.move(W / 2, H / 3)
  // The status bar hides half a second after the pointer leaves the bottom edge,
  // where a real pointer over the window may have left it.
  await page.waitForTimeout(1000)
  if (extra) await extra(page)
  await page.screenshot({ path: path.join(OUT, `${name}.jpg`), type: 'jpeg', quality: 88 })
  await app.close()
}

// One of every built-in theme: the README shows Tron large and the rest in a table.
for (const theme of ['tron', 'amber', 'phosphor', 'white', 'business-dark', 'business-light']) {
  await shoot(theme, `elecdex-${theme}`)
}
await shoot('tron', 'elecdex-settings', {
  extra: async (page) => {
    await page.keyboard.press('Control+Shift+Period')
    await page.locator('[data-testid=settings-section][data-section=keyboard]').click()
    await page.waitForTimeout(600)
  },
})
// The audio panes, playing the demo stand-in: never the machine's sound, apps or volume.
await shoot('tron', 'elecdex-audio', { layout: audioLayout, env: { ELECDEX_AUDIO_STUB: 'demo' } })
if (only.length === 0 || only.includes('elecdex-aichat')) {
  const standIn = await chatStandIn()
  const provider = {
    id: 'ollama',
    name: 'Ollama',
    kind: 'openai',
    baseUrl: `http://127.0.0.1:${standIn.address().port}/v1`,
    model: 'qwen3:8b',
  }
  await shoot('tron', 'elecdex-aichat', {
    layout: chatLayout,
    settings: { ai: { providers: [provider] } },
    extra: chatting,
  })
  standIn.close()
}
console.log(`wrote ${OUT}`)
