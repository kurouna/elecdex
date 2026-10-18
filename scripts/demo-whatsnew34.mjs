/**
 * What v0.0.34 added since v0.0.33, for a landscape video (X, the release notes): the new things
 * in the order they will be noticed, the most striking first.
 *
 *   gpu       the ai preset, where the take opens: the new GPU pane under ELEC SYSTEM - load and
 *             VRAM over the last minute, each engine, the memory bar - brought forward and put
 *             back. It opens first because a pane charts only what came since it opened.
 *   cockpit   the cockpit preset (Ctrl+Shift+F8): CLUSTER's new GPU lane under memory, its card,
 *             and the MEMORY and VRAM slots and the spec row, each card read in turn
 *   agents    the dev preset (Ctrl+Shift+F4): a subagent's own subagent hanging under it in the
 *             agent's task tree, still at work, and its card
 *   push      the git pane's new PUSH: a commit ahead of origin, the first press saying what goes
 *             where and that no hooks run, the second pushing it, never forced
 *
 * Everything shown is made up or a stand-in (demo-take.mjs): the home, the repository and the
 * remote it pushes to (a bare repository in the demo home), the Claude Code folder, the GPU (the
 * stub's demo adapter). Nothing of this machine is read, pressed or kept awake, but the system
 * column's own readings.
 *
 * Windows only, like the other takes. Run `npm run build` first, then `npm run demo:whatsnew34`.
 * The window is 1600x900, a 16:9 frame; record the window. The take starts after the lead
 * (`--lead`, 8 s) and ends by itself; close the window to end, or pass `--exit` to close it when
 * the take is over. The options are demo-take.mjs's (`takeOptions`): `--pace` on every pause,
 * `--theme`, `--shots=<dir>` to look the take over.
 */
import { execFileSync } from 'node:child_process'
import { rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { beats } from './demo-beats.mjs'
import { claudeFolder, GIT_ENV, git, HOME, PROJECT } from './demo-fixtures.mjs'
import { MAIN, openTake, prepareData, say, takeOptions, withDemoState } from './demo-take.mjs'
import { presetTrees } from './preset-shots.mjs'

const options = takeOptions({ width: 1600, height: 900, lead: 8 })
const exit = process.argv.includes('--exit')

/* ---- The remote the git pane pushes to: the demo checkout one commit ahead of it ---- */

const REMOTE = `${HOME}\\remotes\\orbit-tracker.git`

/** A bare remote of the demo checkout as it was, tracked, and a commit made since. */
function remoteBehind() {
  rmSync(REMOTE, { recursive: true, force: true })
  execFileSync('git', ['clone', '-q', '--bare', PROJECT, REMOTE], {
    cwd: HOME,
    env: GIT_ENV,
    stdio: 'ignore',
  })
  git(['remote', 'add', 'origin', REMOTE])
  git(['fetch', '-q', 'origin'])
  git(['branch', '-q', '--set-upstream-to=origin/main', 'main'])
  // Only this file is committed: the rest of the working tree stays as the pane shows it.
  const file = 'src/orbit/eclipse.ts'
  writeFileSync(
    path.join(PROJECT, file),
    '/** Seconds the ISS spends in the earth shadow on a pass, from the reference times. */\nexport const ECLIPSE_MARGIN_S = 4\n',
  )
  git(['add', '--', file])
  git([
    'commit',
    '-q',
    '-m',
    'feat(orbit): a margin on the shadow entry, from the reference times',
    '--',
    file,
  ])
}

/* ---- The saved layouts: the cockpit, ai and dev presets ---- */

const { standIn } = await prepareData()
remoteBehind()
const claude = claudeFolder()
const trees = await presetTrees(MAIN)
const preset = (id) => {
  const tree = trees.get(id)
  if (tree === undefined) throw new Error(`no preset ${id} in the built app`)
  return { id: `new${id}`, name: id, preset: id, tree: withDemoState(tree, standIn) }
}
const items = [preset('ai'), preset('cockpit'), preset('dev')]

const { app, page, wait, settled, run } = await openTake({
  items,
  options,
  standIn,
  env: { ELECDEX_CLAUDE_DIR: claude },
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

/** Rests the pointer on what a card opens for, long enough to read it. */
async function card(target, label, hold = 2600) {
  if ((await target.count()) === 0) return
  say(label)
  await target.first().hover()
  await wait(hold)
}

/* ---- 1. CLUSTER's GPU ---- */

async function clusterGpu() {
  await page.getByTestId('cluster').waitFor({ timeout: 20_000 })
  await page.getByTestId('cluster-figure-gpu').waitFor({ timeout: 20_000 })
  say('cluster: the GPU lane under memory')
  await wait(3200)
  await card(page.getByTestId('cluster-figure-gpu'), 'cluster: the GPU lane card')
  await card(page.getByTestId('cluster-slot-ram'), 'cluster: the MEMORY slot', 2200)
  await card(page.getByTestId('cluster-slot-vram'), 'cluster: the VRAM slot', 2200)
  await card(page.getByTestId('cluster-spec'), 'cluster: the GPU in the spec row', 2200)
  await away()
  await wait(1000)
}

/* ---- 2. The GPU pane ---- */

async function gpuPane() {
  const gpu = paneOf('gpu')
  await gpu.getByTestId('gpu-chart').waitFor({ timeout: 20_000 })
  say('gpu: load and VRAM over the last minute')
  await wait(7000)
  await beat.forward('gpu', 6000)
  await away()
  await wait(1200)
}

/* ---- 3. The agent's tree, and PUSH ---- */

async function nestedAgents() {
  const agents = paneOf('agents')
  const nested = agents.getByTestId('agent-task-children').first()
  await nested.waitFor({ timeout: 20_000 })
  say("agents: a subagent's own subagent hangs under it")
  await wait(3200)
  await card(
    nested.getByTestId('agent-task-row').first(),
    'agents: the nested subagent at work',
    2800,
  )
  await away()
  await wait(1000)
}

async function push() {
  const gitPane = paneOf('git')
  const button = gitPane.getByTestId('git-push')
  await gitPane.getByTestId('git-head').filter({ hasText: '↑1' }).waitFor({ timeout: 20_000 })
  say('git: one commit ahead of origin')
  await wait(2200)
  say('git: PUSH, the first press says where, and that no hooks run')
  await press(button)
  await wait(2600)
  say('git: the second press pushes it, never forced')
  await press(button)
  await page.getByTestId('toast').filter({ hasText: 'PUSHED' }).last().waitFor({ timeout: 30_000 })
  await away()
  await wait(2000)
  await gitPane.getByTestId('git-head').filter({ hasText: '↑0' }).waitFor({ timeout: 10_000 })
  await wait(2200)
}

await run(async () => {
  await settled()
  const started = Date.now()
  await gpuPane()
  await toPreset('cockpit', 'F8')
  await clusterGpu()
  await toPreset('dev', 'F4')
  await wait(1200)
  await nestedAgents()
  await push()
  say(`take: ${((Date.now() - started) / 1000).toFixed(1)} s`)
  if (exit) await app.close().catch(() => {})
})
rmSync(claude, { recursive: true, force: true })
// The remote lives in the demo home (a temp folder's path would show the user's name), so it is
// taken away again, folder and all: a later take or screenshot run starts from the home as it was.
rmSync(path.dirname(REMOTE), { recursive: true, force: true })
