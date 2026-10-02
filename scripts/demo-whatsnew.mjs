/**
 * What v0.0.19 and v0.0.20 added since v0.0.18, for a landscape video (X, the release notes):
 * the new things in the order they will be noticed, the most striking first.
 *
 *   chip8     the CHIP-8 pane: the library walked with the keys, each program playing itself
 *             beside its details, a detail card; Super NeatBoy loaded and played, brought
 *             forward; paused into CORE (an instruction stepped), MEM, TUNE with the author's
 *             colours, played on a little, a save; back to the library, where LOAD has become
 *             CONTINUE
 *   ai        the new ai preset (Ctrl+Shift+F7): a picture and a note dropped on a chat, the
 *             picture's card, a question with them, the answer streaming
 *   dev       the dev preset, regrouped into tabs: the agent's tasks as a tree, two of them
 *             ending and folding into one row, opened and closed; then the git pane's FETCH
 *             and its fast-forward PULL, two presses each
 *
 * Everything shown is made up or a stand-in (demo-take.mjs): the home, the repository and the
 * remote it pulls from (a bare repository in the demo home, two commits ahead, by a made-up
 * author), the Claude Code folder, the chat's answer (served from here, no model and no key).
 * The CHIP-8 programs are chip8Archive's (CC0), as the app ships them.
 *
 * Windows only, like the other takes. Run `npm run build` first, then `npm run demo:whatsnew`.
 * The window is 1600x900, a 16:9 frame; record the window. The take starts after the lead
 * (`--lead`, 8 s) and ends by itself; close the window to end, or pass `--exit` to close it when
 * the take is over. The options are demo-take.mjs's (`takeOptions`): `--pace` on every pause,
 * `--theme`, `--shots=<dir>` to look the take over.
 */
import { execFileSync } from 'node:child_process'
import { appendFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { beats, startCouncil } from './demo-beats.mjs'
import { claudeFolder, GIT_ENV, git, HOME, PROJECT, SESSION } from './demo-fixtures.mjs'
import { MAIN, openTake, prepareData, say, takeOptions, withDemoState } from './demo-take.mjs'
import { presetTrees } from './preset-shots.mjs'

const options = takeOptions({ width: 1600, height: 900, lead: 8 })
const exit = process.argv.includes('--exit')

/* ---- The chat's stand-in answer, about the picture dropped on it ---- */

const PICTURE = path.join('docs', 'screenshots', 'elecdex-earth.jpg')
const NOTE = 'Pin the ISS card on the map.\nShow the next pass in local time.\n'
const QUESTION = 'What is on this screen, and does it match my note?'
const ANSWER = [
  "It's **elecdex** on its *earth* layout:",
  '',
  '- **ORBIT**: the ISS and Starlink over a dotted map, with the time zones',
  '- **Earthquakes** listed beside it, newest first',
  '- the **weather** and a **calendar** down the side',
  '',
  'Your note matches: the ISS card is open on the map. The next pass is shown in UTC, though -',
  'set the observer to show it in local time.',
].join('\n')

/* ---- The remote the git pane pulls from: two commits ahead of the demo checkout ---- */

const REMOTE = `${HOME}\\remotes\\orbit-tracker.git`

const gitIn = (cwd, args, env = {}) =>
  execFileSync('git', args, { cwd, env: { ...GIT_ENV, ...env }, stdio: 'ignore' })

/** A bare remote of the demo checkout, moved on by someone else; the checkout not yet told. */
function remoteAhead() {
  rmSync(REMOTE, { recursive: true, force: true })
  gitIn(HOME, ['clone', '-q', '--bare', PROJECT, REMOTE])
  const other = mkdtempSync(path.join(tmpdir(), 'elecdex-demo-other-'))
  gitIn(HOME, ['clone', '-q', '-c', 'core.autocrlf=false', REMOTE, other])
  const by = { GIT_AUTHOR_NAME: 'Mika Hoshino', GIT_AUTHOR_EMAIL: 'mika@example.com' }
  const push = (file, text, message) => {
    writeFileSync(path.join(other, file), text)
    gitIn(other, ['add', '-A'])
    gitIn(other, ['commit', '-q', '-m', message], by)
  }
  push(
    'src/orbit/horizon.ts',
    'export const MIN_ELEVATION = 10\n',
    'feat(orbit): ignore a pass that never clears the trees (10 degrees)',
  )
  push(
    'src/orbit/horizon.test.ts',
    "import { MIN_ELEVATION } from './horizon'\n\ntest('ten degrees', () => expect(MIN_ELEVATION).toBe(10))\n",
    'test(orbit): the horizon limit',
  )
  gitIn(other, ['push', '-q', 'origin', 'main'])
  rmSync(other, { recursive: true, force: true })
  // The checkout knows the remote only as it was before: nothing to pull until a FETCH.
  git(['remote', 'add', 'origin', REMOTE])
  git(['update-ref', 'refs/remotes/origin/main', 'HEAD'])
}

/* ---- The agent's record, which the take ends two tasks in ---- */

const claude = claudeFolder()
const record = path.join(
  claude,
  'projects',
  PROJECT.replace(/[^A-Za-z0-9]/g, '-'),
  `${SESSION}.jsonl`,
)
/** A task's end, as Claude Code queues it for the session. */
const notice = (id, status) =>
  JSON.stringify({
    type: 'queue-operation',
    operation: 'enqueue',
    timestamp: new Date().toISOString(),
    content: `<task-notification>\n<task-id>${id}</task-id>\n<tool-use-id>${id}</tool-use-id>\n<status>${status}</status>\n</task-notification>`,
  })

/* ---- The saved layouts: CHIP-8 with the system column, then the ai and dev presets ---- */

const { standIn } = await prepareData()
remoteAhead()
const trees = await presetTrees(MAIN)
const preset = (id) => {
  const tree = trees.get(id)
  if (tree === undefined) throw new Error(`no preset ${id} in the built app`)
  return { id: `new${id}`, name: id, preset: id, tree: withDemoState(tree, standIn) }
}
const standard = trees.get('standard')
if (standard === undefined) throw new Error('no standard preset in the built app')
/** The default layout's system column, as every preset has it, and the game beside it. */
const chip8Tree = {
  version: 1,
  root: {
    kind: 'split',
    id: 'c8root',
    direction: 'row',
    sizes: [0.18, 0.82],
    children: [
      standard.root.children[0],
      {
        kind: 'pane',
        id: 'c8',
        widget: 'chip8',
        state: { view: 'library', filter: 'action', program: 'archive/garlicscape', panel: true },
      },
    ],
  },
}
const items = [{ id: 'newchip8', name: 'chip8', tree: chip8Tree }, preset('ai'), preset('dev')]

const council = await startCouncil({ chat: ANSWER })
const { app, page, wait, settled, run } = await openTake({
  items,
  options,
  standIn,
  env: { ELECDEX_CLAUDE_DIR: claude, ELECDEX_AWAKE_STUB: '1' },
  settings: council.settings,
})
const beat = beats({ app, page, wait, settled, theme: options.theme })
const { paneOf, press, away, letGo } = beat

/** A switch by a preset's own key, then the arrangement's power-on. */
async function toPreset(id, key) {
  say(`preset: ${id}`)
  await letGo()
  await page.keyboard.press(`Control+Shift+${key}`)
  await wait(300)
  await settled()
  await away()
}

/** A key held for a while, as a hand holds it in a game. */
async function hold(key, ms) {
  await page.keyboard.down(key)
  await wait(ms)
  await page.keyboard.up(key)
}

/* ---- 1. CHIP-8 ---- */

async function chip8Library() {
  const pane = paneOf('chip8')
  say('chip8: the library')
  await pane.getByTestId('chip8-detail').waitFor({ timeout: 20_000 })
  await wait(2600)
  // A press on the chosen row hands the pane the keyboard; the arrows walk the list.
  await press(pane.locator('[data-testid=chip8-program][data-program="archive/garlicscape"]'))
  // Off the row, so its card does not open over the list being walked.
  await away()
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('ArrowDown')
    await wait(1700)
  }
  say('chip8: the kinds')
  await page.keyboard.press('ArrowRight')
  await wait(1500)
  await page.keyboard.press('ArrowLeft')
  await wait(900)
  say('chip8: a detail card')
  await pane
    .locator('[data-testid=chip8-program][data-program="archive/t8nks"]')
    .hover({ position: { x: 60, y: 8 } })
  await wait(2600)
  await away()
}

async function chip8Play() {
  const pane = paneOf('chip8')
  say('chip8: Super NeatBoy')
  await press(pane.locator('[data-testid=chip8-program][data-program="archive/superneatboy"]'))
  await wait(1200)
  await press(pane.getByTestId('chip8-load'))
  await pane.getByTestId('chip8-run').waitFor()
  await away()
  await wait(1500)
  // Its keys: left and right (pads 7 and 9) and Space to jump (pad 6), Octo's layout.
  await hold('ArrowRight', 1400)
  await page.keyboard.press('Space')
  await hold('ArrowRight', 900)
  await page.keyboard.press('Space')
  await hold('ArrowLeft', 700)
  say('chip8: brought forward')
  await page.keyboard.press('Control+Shift+KeyZ')
  await wait(600)
  await hold('ArrowRight', 1200)
  await page.keyboard.press('Space')
  await hold('ArrowRight', 1100)
  await page.keyboard.press('Space')
  await wait(900)
  await page.keyboard.press('Control+Shift+KeyZ')
  await wait(1000)
}

async function chip8Panel() {
  const pane = paneOf('chip8')
  const tab = (name) => press(pane.locator(`[data-testid=chip8-tab][data-tab=${name}]`))
  say('chip8: paused, CORE')
  await page.keyboard.press('KeyP')
  await tab('core')
  await wait(1000)
  for (let i = 0; i < 4; i++) {
    await press(pane.getByTestId('chip8-step'))
    await wait(500)
  }
  say('chip8: MEM, TUNE')
  await tab('mem')
  await wait(2200)
  await tab('tune')
  await wait(1400)
  say("chip8: the author's colours, and on a little")
  await press(pane.getByTestId('chip8-original'))
  await wait(1300)
  await page.keyboard.press('KeyP')
  await hold('ArrowRight', 1200)
  await page.keyboard.press('Space')
  await hold('ArrowRight', 1000)
  await page.keyboard.press('KeyP')
  await wait(600)
  say('chip8: a save')
  await tab('save')
  await wait(600)
  await press(pane.getByTestId('chip8-slot-save').first())
  await wait(1600)
  say('chip8: back to the library, to CONTINUE')
  await press(pane.getByTestId('chip8-back'))
  await away()
  await wait(2600)
}

/* ---- 2. The ai preset, and files with a question ---- */

async function attach() {
  const chat = paneOf('aichat').first()
  await chat.getByTestId('aichat-input').waitFor({ timeout: 20_000 })
  await wait(1500)
  say('aichat: a picture and a note dropped on the pane')
  const box = await chat.boundingBox()
  if (box !== null)
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 15 })
  const picture = readFileSync(PICTURE).toString('base64')
  await chat.getByTestId('aichat').evaluate((node, bytes) => {
    const data = Uint8Array.from(atob(bytes), (c) => c.charCodeAt(0))
    const files = new DataTransfer()
    files.items.add(new File([data], 'elecdex-earth.jpg', { type: 'image/jpeg' }))
    window.__demoDrop = files
    node.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer: files }))
  }, picture)
  await wait(1300)
  await chat.getByTestId('aichat').evaluate((node, note) => {
    const files = window.__demoDrop
    files.items.add(new File([note], 'todo.md', { type: 'text/markdown' }))
    node.dispatchEvent(
      new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: files }),
    )
  }, NOTE)
  const chips = chat.getByTestId('aichat-chip')
  await chips.nth(1).waitFor()
  await wait(800)
  say('aichat: the picture card')
  await chips.first().hover()
  await wait(2600)
  await away()
  say('aichat: the question')
  await chat.getByTestId('aichat-input').click()
  await page.keyboard.type(QUESTION, { delay: 30 })
  await wait(400)
  await page.keyboard.press('Enter')
  await away()
  await chat
    .locator('[data-testid=aichat-message][data-role=assistant]')
    .filter({ hasText: 'local time' })
    .waitFor({ timeout: 60_000 })
  await wait(3000)
}

/* ---- 3. The dev preset: the agent's tree, FETCH and PULL ---- */

async function agentsTree() {
  const agents = paneOf('agents')
  await agents.getByTestId('agent-tasks').first().waitFor({ timeout: 20_000 })
  say('agents: the tasks hang from the session')
  await wait(3000)
  say('agents: two tasks end and fold')
  appendFileSync(record, `${notice('t7', 'completed')}\n`)
  await wait(1600)
  appendFileSync(record, `${notice('t6', 'completed')}\n`)
  const finished = agents.getByTestId('agent-finished')
  await finished.waitFor({ timeout: 10_000 })
  await wait(2000)
  await press(finished)
  await wait(2200)
  await press(finished)
  await away()
  await wait(1200)
}

async function fetchAndPull() {
  const gitPane = paneOf('git')
  const toast = page.getByTestId('toast').last()
  say('git: FETCH, two presses')
  const fetch = gitPane.getByTestId('git-fetch')
  await press(fetch)
  await wait(1100)
  await press(fetch)
  await toast.filter({ hasText: 'FETCHED' }).waitFor({ timeout: 30_000 })
  await away()
  await wait(3000)
  say('git: PULL, fast-forward only')
  const pull = gitPane.getByTestId('git-pull')
  await press(pull)
  await wait(1100)
  await press(pull)
  await toast.filter({ hasText: 'PULLED' }).waitFor({ timeout: 30_000 })
  await away()
  await wait(3500)
}

await run(async () => {
  await settled()
  const started = Date.now()
  await chip8Library()
  await chip8Play()
  await chip8Panel()
  await toPreset('ai', 'F7')
  await attach()
  await toPreset('dev', 'F4')
  await wait(1200)
  await agentsTree()
  await fetchAndPull()
  say(`take: ${((Date.now() - started) / 1000).toFixed(1)} s`)
  if (exit) await app.close().catch(() => {})
})
// Closed here, not in the take: a take the window ended early would leave the stand-in
// listening, and Node running with nothing to do.
council.close()
rmSync(claude, { recursive: true, force: true })
