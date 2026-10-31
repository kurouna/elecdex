/**
 * What v0.0.34 added since v0.0.33, for a landscape video (X, the release notes), each pane
 * brought forward (Ctrl+Shift+Z) so its detail reads:
 *
 *   agents    the dev preset, where the take opens: a subagent's own subagent hanging under it in
 *             the agent's task tree, still at work, and its card
 *   push      the git pane's new PUSH: a commit ahead of origin, the first press saying what goes
 *             where and that no hooks run, the second pushing it, never forced
 *   gpu       the new GPU pane, a tab beside git for the take - load and VRAM over the last
 *             minute, each engine, the memory bars
 *   cockpit   the cockpit preset (Ctrl+Shift+F8): CLUSTER's new GPU lane under memory, its card,
 *             and the VRAM slot and the spec row
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
import { rmSync } from 'node:fs'
import path from 'node:path'
import { beats } from './demo-beats.mjs'
import { claudeFolder, REMOTE, remoteBehind } from './demo-fixtures.mjs'
import { MAIN, openTake, prepareData, say, takeOptions, withDemoState } from './demo-take.mjs'
import { presetTrees } from './preset-shots.mjs'

const options = takeOptions({ width: 1600, height: 900, lead: 8 })
const exit = process.argv.includes('--exit')

/* ---- The saved layouts: the dev preset with the GPU pane, and the cockpit preset ---- */

const { standIn } = await prepareData()
const remote = await remoteBehind()
const claude = claudeFolder()
const trees = await presetTrees(MAIN)
const preset = (id) => {
  const tree = trees.get(id)
  if (tree === undefined) throw new Error(`no preset ${id} in the built app`)
  return { id: `new${id}`, name: id, preset: id, tree: withDemoState(tree, standIn) }
}

/**
 * The GPU pane as one more tab beside git's, so it charts from the take's first second: a pane
 * charts only what came since it opened, and one opened on a layout switch would come forward
 * nearly empty. Behind its tab it keeps charting (its source is kept while hidden).
 */
function withGpuTab(node) {
  if (node.kind === 'tabs' && node.children.some((child) => child.widget === 'git')) {
    return {
      ...node,
      children: [...node.children, { kind: 'pane', id: 'demo-gpu', widget: 'gpu' }],
    }
  }
  return node.kind === 'split' ? { ...node, children: node.children.map(withGpuTab) } : node
}
const dev = preset('dev')
const items = [
  { ...dev, tree: { ...dev.tree, root: withGpuTab(dev.tree.root) } },
  preset('cockpit'),
]

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

/**
 * A pane brought forward (Ctrl+Shift+Z) so its detail reads, what is shown on it meanwhile, and
 * put back. The press that gives it the keyboard lands on its title, where nothing opens.
 */
async function forward(widget, during) {
  say(`${widget}: brought forward`)
  await paneOf(widget)
    .first()
    .click({ position: { x: 160, y: 10 } })
  await wait(300)
  await page.keyboard.press('Control+Shift+KeyZ')
  await wait(1500)
  await during()
  await away()
  await page.keyboard.press('Control+Shift+KeyZ')
  await wait(1300)
}

/* ---- 1. The agent's tree ---- */

async function nestedAgents() {
  const agents = paneOf('agents')
  await agents.getByTestId('agent-task-children').first().waitFor({ timeout: 20_000 })
  say('dev: the agent, the repository, and the GPU behind its tab')
  await wait(2500)
  await forward('agents', async () => {
    say("agents: a subagent's own subagent hangs under it")
    await wait(2800)
    const nested = agents.getByTestId('agent-task-children').first()
    await card(
      nested.getByTestId('agent-task-row').first(),
      'agents: the nested subagent at work',
      3200,
    )
  })
}

/* ---- 2. PUSH ---- */

async function push() {
  const gitPane = paneOf('git')
  const button = gitPane.getByTestId('git-push')
  await gitPane.getByTestId('git-head').filter({ hasText: '↑1' }).waitFor({ timeout: 20_000 })
  await forward('git', async () => {
    say('git: one commit ahead of origin')
    await wait(2200)
    say('git: PUSH, the first press says where, and that no hooks run')
    await press(button)
    await wait(2800)
    say('git: the second press pushes it, never forced')
    await press(button)
    await page
      .getByTestId('toast')
      .filter({ hasText: 'PUSHED' })
      .last()
      .waitFor({ timeout: 30_000 })
    await away()
    await gitPane.getByTestId('git-head').filter({ hasText: '↑0' }).waitFor({ timeout: 10_000 })
    await wait(2800)
  })
}

/* ---- 3. The GPU pane ---- */

async function gpuPane() {
  say('gpu: its tab beside git')
  await press(
    page
      .getByTestId('tab')
      .filter({ hasText: /^\s*gpu\s*$/i })
      .first(),
  )
  const gpu = paneOf('gpu')
  await gpu.getByTestId('gpu-chart').waitFor({ timeout: 20_000 })
  await away()
  await wait(1500)
  await forward('gpu', async () => {
    say('gpu: load and VRAM over the last minute, each engine, the memory')
    await wait(6500)
  })
}

/* ---- 4. CLUSTER's GPU ---- */

async function clusterGpu() {
  await page.getByTestId('cluster').waitFor({ timeout: 20_000 })
  await page.getByTestId('cluster-figure-gpu').waitFor({ timeout: 20_000 })
  say('cluster: the GPU lane under memory')
  await wait(2600)
  await card(page.getByTestId('cluster-figure-gpu'), 'cluster: the GPU lane card')
  await card(page.getByTestId('cluster-slot-vram'), 'cluster: the VRAM slot', 2200)
  await card(page.getByTestId('cluster-spec'), 'cluster: the GPU in the spec row', 2200)
  await away()
  await wait(1000)
}

await run(async () => {
  await settled()
  const started = Date.now()
  await nestedAgents()
  await push()
  await gpuPane()
  await toPreset('cockpit', 'F8')
  await clusterGpu()
  say(`take: ${((Date.now() - started) / 1000).toFixed(1)} s`)
  if (exit) await app.close().catch(() => {})
})
rmSync(claude, { recursive: true, force: true })
// The remote lives in the demo home (a temp folder's path would show the user's name), so it is
// taken away again, folder and all: a later take or screenshot run starts from the home as it was.
remote.close()
rmSync(path.dirname(REMOTE), { recursive: true, force: true })
