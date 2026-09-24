/**
 * The layout presets, driven for a screen recording (a post on X): from standard, the layouts
 * dialog opens, the keyboard steps down to the next preset and Enter takes it - network, earth,
 * dev, media, desk - and last back round to standard, each one left on screen for a moment.
 *
 * The data is the README screenshots' (scripts/preset-shots.mjs, demo-fixtures.mjs): the demo
 * home and repository, a made-up Claude Code folder, the made-up socket table and sound, stand-in
 * pages for YouTube and X and a made-up feed, demo notes and tasks. Only the orbital elements,
 * the weather, the markets and the earthquakes are real, fetched as the panes would.
 *
 * Windows only, like the screenshots. Run `npm run build` first, then `npm run demo:presets`.
 * Close the window to end it.
 *
 *   --probe          open the window at its size and wait: to check the size and place for the
 *                    recorder before the take
 *   --width=1600     content size of the window, in pixels (--height=900)
 *   --x=.. --y=..    where the window goes (centred when left out)
 *   --lead=10        seconds between the window appearing and the take starting
 *   --zoom=1         page zoom, for larger text in a small video
 *   --pace=1         a factor on every pause: 1.5 for a slower take, 0.8 for a quicker one
 *   --stay=5         seconds each preset stays on screen
 *   --theme=tron     any built-in theme
 *   --shots=<dir>    also save a screenshot every two seconds there, to look the take over
 */
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
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

const MAIN = path.resolve('out/main/index.js')
const option = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]
const number = (name, fallback) => {
  const value = option(name)
  return value === undefined ? fallback : Number(value)
}
const PROBE = process.argv.includes('--probe')
const W = number('width', 1600)
const H = number('height', 900)
const X = option('x') === undefined ? null : number('x', 0)
const Y = option('y') === undefined ? null : number('y', 0)
const LEAD = number('lead', 10)
const ZOOM = number('zoom', 1)
const PACE = number('pace', 1)
const STAY = number('stay', 5)
const THEME = option('theme') ?? 'tron'
const SHOTS = option('shots')

const say = (text) => console.log(`${new Date().toTimeString().slice(0, 8)} ${text}`)

// ---------------------------------------------------------------------------
// The profile: every preset kept, in the order of its key, with the screenshots' data
// ---------------------------------------------------------------------------

/** The presets in the order the dialog lists them, and the state each pane needs. */
const ORDER = ['standard', 'network', 'earth', 'dev', 'media', 'desk']

prepareHome()
demoRepository()
const standIn = await mediaStandIn()
const trees = await presetTrees(MAIN)
const states = {
  earth: [{ orbit: { starlink: true } }],
  dev: [
    {
      agents: { open: SESSION },
      git: { repo: REPO_ID, graph: 'all', listWidth: 0.46 },
    },
  ],
  media: [{ rss: { feeds: [standIn.feedUrl] }, spectrum: { bands: 16 } }],
}
const items = ORDER.map((id, i) => {
  const tree = trees.get(id)
  if (tree === undefined) throw new Error(`no preset ${id} in the built app`)
  return {
    id: `demo${i}${id}`.slice(0, 32),
    name: id,
    preset: id,
    tree: states[id] === undefined ? tree : withState(tree, ...states[id]),
  }
})

const profile = mkdtempSync(path.join(tmpdir(), 'elecdex-demo-'))
writeFileSync(path.join(profile, 'layout.json'), JSON.stringify(items[0].tree))
writeFileSync(
  path.join(profile, 'layouts.json'),
  JSON.stringify({ version: 1, items, active: items[0].id }),
)
writeFileSync(
  path.join(profile, 'settings.json'),
  JSON.stringify({
    theme: THEME,
    sound: { enabled: true },
    updates: { check: false },
    launcher: {
      showSystem: false,
      items: [
        {
          name: 'Terminal',
          target: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
        },
        { name: 'Explorer', target: 'C:\\Windows\\explorer.exe' },
        { name: 'Notepad', target: 'C:\\Windows\\System32\\notepad.exe' },
        { name: 'Calculator', target: 'C:\\Windows\\System32\\calc.exe' },
        { name: 'elecdex on GitHub', target: 'https://github.com/kurouna/elecdex' },
      ],
    },
    // Every switch would end the shells: the take is about the presets, not the question.
    layout: { confirmSwitch: false },
  }),
)
gitRepos(profile)
seedOrbits(profile)
deskFiles(profile)

// ---------------------------------------------------------------------------
// The window
// ---------------------------------------------------------------------------

const app = await electron.launch({
  args: [MAIN, '--windowed', '--no-intro', `--user-data-dir=${profile}`, '--lang=en-US'],
  // Run from the demo home: PowerShell writes a module cache relative to it.
  cwd: HOME,
  env: {
    ...process.env,
    USERPROFILE: HOME,
    HOMEPATH: '\\Users\\Public\\Documents\\elecdex-demo',
    HOME,
    ELECDEX_CLAUDE_DIR: claudeFolder(),
    ELECDEX_SOCKETS_STUB: 'demo',
    ELECDEX_AUDIO_STUB: 'demo',
    ELECDEX_WEB_HOMES: standIn.homes,
    // No tray icon or system-wide shortcut from a recording run.
    ELECDEX_BACKGROUND_STUB: '1',
  },
})
const page = await app.firstWindow()
await app.evaluate(
  ({ BrowserWindow }, [w, h, x, y, zoom]) => {
    const win = BrowserWindow.getAllWindows()[0]
    win.setContentSize(w, h)
    if (x === null || y === null) win.center()
    else win.setPosition(x, y)
    win.webContents.setZoomFactor(zoom)
  },
  [W, H, X, Y, ZOOM],
)
const closed = new Promise((resolve) => app.on('close', resolve))
const wait = (ms) => Promise.race([page.waitForTimeout(ms * PACE).catch(() => {}), closed])
const end = () => {
  standIn.server.close()
  keepOrbits(profile)
}
process.on('exit', end)

if (PROBE) {
  say(`probe: the window is ${W}x${H} - close it to end`)
  await closed
  process.exit(0)
}

// ---------------------------------------------------------------------------
// The take
// ---------------------------------------------------------------------------

/** Something in the shell, so standard does not open on an empty prompt. */
async function shellAtWork() {
  const shell = page
    .locator('[data-testid=pane][data-widget=terminal]:not(.hidden) .xterm-helper-textarea')
    .first()
  if ((await shell.count()) === 0) return
  await shell.focus()
  await page.keyboard.type(`cd "${PROJECT}"; Get-ChildItem -Name`, { delay: 25 })
  await page.keyboard.press('Enter')
}

/** Waits until the arrangement has finished powering on. */
async function settled() {
  await page
    .locator('[data-testid=workspace][data-switching=false]')
    .waitFor({ timeout: 15_000 })
    .catch(() => {})
}

/**
 * The layouts dialog, one step down, Enter: the chosen row blinks, the dialog powers off and
 * the next preset comes up pane by pane. From desk, the step down comes round to standard.
 */
async function nextPreset(name) {
  say(`dialog: open`)
  await page.keyboard.press('Control+Shift+KeyG')
  await page.getByTestId('layouts-dialog').waitFor()
  await wait(1300)
  say(`dialog: down to ${name}`)
  await page.keyboard.press('ArrowDown')
  await wait(900)
  say(`dialog: ${name}`)
  await page.keyboard.press('Enter')
  await wait(600)
  await settled()
  // Out of the way of the panes, and of any card a pointer would bring up.
  await page.mouse.move(W / 2, 4)
  await wait(STAY * 1000)
}

if (SHOTS !== undefined) {
  mkdirSync(SHOTS, { recursive: true })
  let shot = 0
  const snap = async () => {
    const name = String(shot++).padStart(3, '0')
    await page.screenshot({ path: path.join(SHOTS, `${name}.png`) }).catch(() => {})
    setTimeout(() => void snap(), 2000)
  }
  void snap()
}

await shellAtWork()
say(`window up - the take starts in ${LEAD} s`)
await wait((LEAD * 1000) / PACE)
try {
  await wait(STAY * 600)
  for (const name of [...ORDER.slice(1), ORDER[0]]) await nextPreset(name)
  say('done - close the window to end')
  await closed
} catch (error) {
  say(`ended: ${error.message.split('\n')[0]}`)
}
end()
await app.close().catch(() => {})
