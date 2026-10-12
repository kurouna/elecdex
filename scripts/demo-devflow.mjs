/**
 * The dev preset at work, for a 16:9 video: why the layout suits coding with AI agents, and how
 * it is used - everything but the editor on one screen, with English captions.
 *
 *   arrive      how to get there: from the standard layout, Ctrl+Shift+G for the layouts
 *               dialog, dev chosen from the presets, Enter
 *   agent       the AI AGENT pane following a Claude Code session: a subagent ends, files are
 *               written, the tests run in the background - the processor's chart and the top
 *               processes on the left rising with them - and the work is committed
 *   git         the GIT pane beside it: the files the agent changes as it changes them, one
 *               opened for its diff, then the new commit's card in the graph
 *   docker      the service restarted to try the change (asked twice)
 *   clipboard   the container's complaint and a command landing in the clipboard history
 *   chat        the AI CHAT behind the repository asked about it, answering (a stand-in)
 *   shell       the shell behind the containers, typed into: the commits just made
 *
 * Everything shown is made up or a stand-in (demo-take.mjs): the home, the repository and its
 * author, the Claude Code folder (claudeFolder, written a line at a time here as the agent
 * "works"), the Docker engine, the clipboard and the chat's answer, served from here with no
 * model and no key. The load the tests put on the processor is real: a few busy Node processes
 * for a few seconds, so the system column moves as it would. Nothing of this machine is read,
 * pressed or kept awake.
 *
 * Windows only, like the screenshots. Run `npm run build` first, then `npm run demo:devflow`.
 * The window opens after the lead (`--lead`, 10 s); close it to end, or pass `--exit`. The other
 * options are demo-take.mjs's (`takeOptions`): 1600x900 unless told otherwise, `--pace` on every
 * pause, `--shots=<dir>` to look the take over, `--no-captions`.
 */
import { spawn } from 'node:child_process'
import { appendFileSync, rmSync, writeFileSync } from 'node:fs'
import { availableParallelism } from 'node:os'
import path from 'node:path'
import { beats, startCouncil } from './demo-beats.mjs'
import { claudeFolder, git, PROJECT, projectFolder, SESSION, taskNotice } from './demo-fixtures.mjs'
import { MAIN, openTake, prepareData, say, takeOptions, withDemoState } from './demo-take.mjs'
import { presetTrees } from './preset-shots.mjs'

const options = takeOptions({ width: 1600, height: 900, lead: 10 })
const exit = process.argv.includes('--exit')

/** The captions, in the order the take puts them up. */
const CAPTIONS = {
  standard: 'Start from the standard layout',
  dialog: 'Ctrl+Shift+G opens the layouts',
  pick: 'Choose dev from the presets, then Enter',
  arrive: 'dev — a layout for coding with AI agents',
  agent: 'AI AGENT: what your Claude Code session is doing, step by step',
  git: 'GIT: the files it changes, as it changes them',
  diff: 'Open one for its diff, without leaving the agent',
  tests: 'Tests running: the load shows in the system column',
  commit: 'Its commit lands in the graph — rest on it for the whole of it',
  docker: 'DOCKER: restart the service to try the change',
  clipboard: 'CLIPBOARD: everything you copied, ready to paste again',
  chat: 'Stuck? Ask AI CHAT, right behind the repository',
  shell: 'And a shell of your own, whenever you need one',
  outro: 'dev — everything but the editor, on one screen',
}

const QUESTION =
  'The pass tests pass on my machine but fail in the container: expected 18:18, got 09:18. Why?'
const ANSWER = [
  'Nine hours apart is **Tokyo against UTC**: the container has no time zone, so `Date` falls back to UTC.',
  '',
  'Either give the service the zone the tests expect:',
  '',
  '```yaml',
  'environment:',
  '  TZ: Asia/Tokyo',
  '```',
  '',
  "or, better, have the tests name the observer's zone instead of relying on the machine's.",
].join('\n')

/* ---- The agent's session, carried on a line at a time from where claudeFolder leaves it ---- */

const claude = claudeFolder()
const record = path.join(projectFolder(claude, PROJECT), `${SESSION}.jsonl`)
const subagent = path.join(projectFolder(claude, PROJECT), SESSION, 'subagents', 'agent-b3e4.jsonl')
const file = (name) => path.join(PROJECT, name)
const put = (name, text) => writeFileSync(file(name), text)
const add = (target, ...lines) => appendFileSync(target, `${lines.join('\n')}\n`)

let messages = 100
const tokens = { context: 91_500, output: 610 }
const tool = (id, name, input) => ({ type: 'tool_use', id, name, input })
/** One answer's line, now, its context growing as a session's does. */
function answer(content, stop = 'tool_use') {
  tokens.context += 1_600
  tokens.output += 230
  return JSON.stringify({
    type: 'assistant',
    timestamp: new Date().toISOString(),
    message: {
      id: `msg_demo_${messages++}`,
      model: 'claude-opus-5-5',
      role: 'assistant',
      stop_reason: stop,
      usage: {
        input_tokens: 4,
        cache_read_input_tokens: tokens.context,
        cache_creation_input_tokens: 900,
        output_tokens: tokens.output,
      },
      content,
    },
  })
}
const reply = (text) => answer([{ type: 'text', text }], 'end_turn')
const result = (id, text) =>
  JSON.stringify({
    type: 'user',
    timestamp: new Date().toISOString(),
    message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, content: text }] },
  })
/** The session's line in Claude Code's list of running sessions, with its status now. */
function sessionStatus(status) {
  writeFileSync(
    path.join(claude, 'sessions', `${process.pid}.json`),
    JSON.stringify({
      pid: process.pid,
      sessionId: SESSION,
      cwd: PROJECT,
      name: 'Say whether a pass can be seen',
      status,
      startedAt: Date.now() - 38 * 60_000,
      updatedAt: Date.now(),
    }),
  )
}

const SUN = [
  '/** Where the sun is, in the same frame as the stations: near enough for a shadow. */',
  'export function sunPosition(at: Date): Vector {',
  '  const days = (at.getTime() - J2000) / 86_400_000',
  '  const longitude = mod(280.46 + 0.9856474 * days, 360)',
  '  return fromEcliptic(longitude, AU_KM)',
  '}',
  '',
].join('\n')
const TESTS = [
  "import { nextPass } from '../src/orbit/passes'",
  '',
  "test('lit and dark: visible', () => {})",
  "test('lit in daylight: not visible', () => {})",
  "test('in the shadow: not visible', () => {})",
  '',
].join('\n')

/**
 * The processor busy for `ms`, as a test run makes it: half the logical processors spinning in
 * Node, ended on time and with the take whatever happens.
 */
const busy = []
function load(ms) {
  const count = Math.max(2, Math.floor(availableParallelism() / 2))
  for (let i = 0; i < count; i++) {
    const child = spawn(
      process.execPath,
      ['-e', `const end = Date.now() + ${ms}; while (Date.now() < end);`],
      {
        stdio: 'ignore',
      },
    )
    busy.push(child)
  }
}
process.on('exit', () => {
  for (const child of busy) child.kill()
})

/* ---- The saved layouts: standard, then dev ---- */

const { standIn } = await prepareData()
const trees = await presetTrees(MAIN)
const preset = (id, i) => {
  const tree = trees.get(id)
  if (tree === undefined) throw new Error(`no preset ${id} in the built app`)
  return { id: `devflow${i}${id}`, name: id, preset: id, tree: withDemoState(tree, standIn) }
}
const items = [preset('standard', 0), preset('dev', 1)]

/** The id of the shell behind the containers in the dev layout's tab group. */
function shellBehindDocker(node) {
  if (node.kind === 'split') return node.children.map(shellBehindDocker).find(Boolean)
  if (node.kind !== 'tabs' || !node.children.some((c) => c.widget === 'docker')) return undefined
  return node.children.find((c) => c.widget === 'terminal')?.id
}
const SHELL_PANE = shellBehindDocker(items[1].tree.root)
if (SHELL_PANE === undefined) throw new Error('no shell behind the containers in the dev preset')

const council = await startCouncil({ chat: ANSWER })
if (!options.probe) {
  say(`the window opens in ${options.lead} s - start the recorder`)
  await new Promise((resolve) => setTimeout(resolve, options.lead * 1000))
}
const { app, page, wait, settled, run, caption } = await openTake({
  items,
  options: { ...options, lead: 0 },
  standIn,
  env: { ELECDEX_CLAUDE_DIR: claude },
  settings: council.settings,
})
const beat = beats({ app, page, wait, settled, theme: options.theme })
const { paneOf, press, away } = beat

/* ---- The take ---- */

const STEP = 1200

/** One step of the agent's: its line written, the repository changed with it, a pause. */
async function step(label, run, ms = STEP) {
  say(`agent: ${label}`)
  run()
  await wait(ms)
}

/** The subagent ends, and the agent writes the sun's position and the tests. */
async function agentWrites() {
  await caption(CAPTIONS.agent)
  await step('the subagent answers', () => {
    add(subagent, reply('The shadow entry matches the reference times.'))
    // The fixture's earlier test run ends too: only this take's run is shown running.
    add(
      record,
      taskNotice({ task: 't7', summary: 'Background command "Run the orbit tests" completed' }),
    )
    add(
      record,
      taskNotice({
        task: 'b3e4',
        call: 't6',
        summary: 'Agent "Check the shadow maths" finished',
      }),
    )
  })
  await step('reads track.ts', () =>
    add(record, answer([tool('d1', 'Read', { file_path: file('src\\orbit\\track.ts') })])),
  )
  await step('writes sun.ts', () => {
    add(record, answer([tool('d2', 'Write', { file_path: file('src\\orbit\\sun.ts') })]))
    put('src/orbit/sun.ts', SUN)
  })
  await caption(CAPTIONS.git)
  await step('writes the tests', () => {
    add(record, answer([tool('d3', 'Write', { file_path: file('tests\\passes.test.ts') })]))
    put('tests/passes.test.ts', TESTS)
  })
  await step(
    'the README',
    () => {
      add(record, answer([tool('d4', 'Edit', { file_path: file('README.md') })]))
      put(
        'README.md',
        '# Orbit tracker\n\nWhere the stations are, from their orbital elements.\n\nPasses say whether they can be seen with the eye: lit by the sun, under a dark sky.\n',
      )
    },
    800,
  )
}

/** One of the changed files opened in the GIT pane, for its diff. */
async function openDiff() {
  await caption(CAPTIONS.diff)
  say('git: passes.ts opened')
  const row = paneOf('git').getByTestId('git-file').filter({ hasText: 'passes.ts' }).first()
  await row.waitFor({ timeout: 10_000 })
  await press(row)
  await away()
  await wait(3400)
}

/** The tests in the background: the processor busy while they run, then their end. */
async function testsRun() {
  await caption(CAPTIONS.tests)
  await step('runs the tests in the background', () => {
    add(
      record,
      answer([
        tool('d5', 'Bash', {
          command: 'npm test -- orbit',
          description: 'Run the orbit tests',
          run_in_background: true,
        }),
      ]),
      result(
        'd5',
        'Command running in background with ID: bdemotests. Output is being written to: x',
      ),
    )
    load(9000)
  })
  await wait(7200)
  await step('the tests pass', () =>
    add(
      record,
      taskNotice({
        task: 'bdemotests',
        call: 'd5',
        summary: 'Background command "Run the orbit tests" completed',
      }),
    ),
  )
}

/** The commit, and its card in the graph. */
async function commits() {
  await caption(CAPTIONS.commit)
  await step('commits', () => {
    add(
      record,
      answer([
        tool('d6', 'Bash', {
          command: 'git commit -am "feat(orbit): say whether a pass can be seen"',
          description: 'Commit the pass change',
        }),
      ]),
    )
    git(['add', '-A'])
    git([
      'commit',
      '-q',
      '-m',
      'feat(orbit): say whether a pass can be seen',
      '-m',
      "A pass is visible when the station is lit by the sun and the sky at the observer is dark: the Earth's shadow is worked out as a cylinder, near enough for low orbits.",
    ])
  })
  say('agent: answers')
  add(record, reply('Passes now say whether they can be seen with the eye. Tests pass; committed.'))
  sessionStatus('idle')
  await wait(1200)
  say('git: the new commit')
  const row = paneOf('git')
    .getByTestId('git-commit')
    .filter({ hasText: 'say whether a pass' })
    .first()
  await row.waitFor({ timeout: 10_000 })
  await row.hover({ position: { x: 140, y: 10 } })
  await wait(3200)
  await away()
}

/** The service restarted, to try what was committed. */
async function restartService() {
  await caption(CAPTIONS.docker)
  say('docker: restart shop-api-1')
  const row = paneOf('docker').locator('[data-testid=docker-row][data-name="shop-api-1"]')
  await row.hover()
  await wait(400)
  await press(row.getByTestId('docker-restart'))
  await wait(700)
  await press(row.getByTestId('docker-restart'))
  await wait(1800)
  await away()
}

/** What the container said, and the command for it, copied and landing in the history. */
async function copies() {
  await caption(CAPTIONS.clipboard)
  say('clipboard: copies land')
  for (const text of [
    'docker compose logs api',
    'FAIL tests/passes.test.ts > lit and dark: visible - expected 18:18, received 09:18',
  ]) {
    await app.evaluate((_electron, what) => globalThis.__elecdexClipboard.copy(what), text)
    await wait(900)
  }
  await wait(1600)
}

/** The chat behind the repository, asked about it. */
async function ask() {
  await caption(CAPTIONS.chat)
  await beat.toTab('ai chat')
  const chat = paneOf('aichat').first()
  await chat.getByTestId('aichat-input').waitFor({ timeout: 20_000 })
  say('aichat: the question')
  await chat.getByTestId('aichat-input').click()
  await page.keyboard.type(QUESTION, { delay: 24 })
  await wait(400)
  await page.keyboard.press('Enter')
  await away()
  await chat
    .locator('[data-testid=aichat-message][data-role=assistant]')
    .filter({ hasText: "observer's zone" })
    .waitFor({ timeout: 60_000 })
  await wait(3200)
}

/** The shell behind the containers, typed into: the commits just made. */
async function ownShell() {
  await caption(CAPTIONS.shell)
  say('shell: the log')
  await press(page.locator(`[data-testid=tab][data-pane-id="${SHELL_PANE}"]`))
  await settled()
  await wait(1200)
  await page.locator(`[data-testid=pane][data-pane-id="${SHELL_PANE}"] .xterm-screen`).click()
  await page.keyboard.type(`cd "${PROJECT}"; git log --oneline -4`, { delay: 28 })
  await page.keyboard.press('Enter')
  await away()
  await wait(3600)
}

/**
 * How to get there, said first: from the standard layout, Ctrl+Shift+G for the layouts
 * dialog, along the presets to dev's card, Enter. A preset already made into a saved layout
 * (as every new profile's are) is gone to rather than added again, so the take's dev, with its
 * repository and session, is the one that arrives.
 */
async function toDev() {
  await caption(CAPTIONS.standard)
  await wait(2400)
  await caption(CAPTIONS.dialog)
  say('dialog: the layouts')
  await beat.letGo()
  await page.keyboard.press('Control+Shift+KeyG')
  await page.getByTestId('layouts-dialog').waitFor()
  await wait(2000)
  await caption(CAPTIONS.pick)
  await page.locator('[data-testid=layouts-preset][data-preset="standard"]').focus()
  await wait(600)
  // standard, network, earth, dev: the dialog's order (shared/layout-presets.ts).
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('ArrowRight')
    await wait(450)
  }
  await wait(900)
  await page.keyboard.press('Enter')
  await wait(300)
  await settled()
  await away()
  await caption(CAPTIONS.arrive)
  await wait(3000)
}

await run(async () => {
  const started = Date.now()
  sessionStatus('busy')
  await toDev()
  await agentWrites()
  await openDiff()
  await testsRun()
  await commits()
  await restartService()
  await copies()
  await ask()
  await ownShell()
  await caption(CAPTIONS.outro)
  await wait(3200)
  say(`take: ${((Date.now() - started) / 1000).toFixed(0)} s`)
  if (exit) await app.close().catch(() => {})
})
// Closed here, not in the take: a take the window ended early would leave the stand-in
// listening, and Node running with nothing to do.
council.close()
rmSync(claude, { recursive: true, force: true })
