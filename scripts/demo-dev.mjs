/**
 * The AI AGENT, GIT and ORBIT panes, driven for a screen recording (a post on X): a coding agent
 * at work on the demo repository beside the GIT pane that follows it, then a switch to a second
 * saved layout where the ORBIT pane shows the stations and the Starlink satellites.
 *
 * Nothing in it is anyone's: the agent is a made-up Claude Code folder this script writes a line
 * at a time (the pane reads it as it would a real session's), and the repository is the demo one
 * by a made-up author (scripts/demo-fixtures.mjs), changed and committed by this script as the
 * agent "works". Only the orbital elements are real: downloaded from CelesTrak once, as the pane
 * would.
 *
 * Windows only, like the screenshots. Run `npm run build` first, then `npm run demo:dev`. Close
 * the window to end it.
 *
 *   --probe          open the window at its size and wait: to check the size and place for the
 *                    recorder before the take
 *   --width=1600     content size of the window, in pixels (--height=900)
 *   --x=.. --y=..    where the window goes (centred when left out)
 *   --lead=10        seconds between the window appearing and the take starting
 *   --zoom=1.1       page zoom, for larger text in a small video
 *   --theme=tron     any built-in theme
 *   --shots=<dir>    also save a screenshot every two seconds there, to look the take over
 */
import { appendFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { _electron as electron } from '@playwright/test'
import {
  DEMO_FILES,
  demoRepository,
  git,
  gitRepos,
  HOME,
  OTHER,
  PASSES_NOW,
  PROJECT,
  prepareHome,
  REPO_ID,
  SESSION,
  SHADOW,
} from './demo-fixtures.mjs'

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
const THEME = option('theme') ?? 'tron'
const SHOTS = option('shots')

const say = (text) => console.log(`${new Date().toTimeString().slice(0, 8)} ${text}`)

// ---------------------------------------------------------------------------
// The two saved layouts: the agent and the repository side by side, and the map
// ---------------------------------------------------------------------------

const devTree = {
  version: 1,
  root: {
    kind: 'split',
    id: 'dev',
    direction: 'row',
    sizes: [0.38, 0.62],
    children: [
      { kind: 'pane', id: 'agent', widget: 'agents', state: { open: SESSION } },
      {
        kind: 'pane',
        id: 'repo',
        widget: 'git',
        state: { repo: REPO_ID, graph: 'all', listWidth: 0.42 },
      },
    ],
  },
}
const orbitTree = {
  version: 1,
  root: { kind: 'pane', id: 'map', widget: 'orbit', state: { starlink: true } },
}

// ---------------------------------------------------------------------------
// The made-up agent, written a line at a time as the take goes
// ---------------------------------------------------------------------------

const SUB = 'a5ad0c0de5ad0c0de'
const SHELL = 'bdemo7t3st'
const folder = PROJECT.replace(/[^A-Za-z0-9]/g, '-')
const claude = mkdtempSync(path.join(tmpdir(), 'elecdex-demo-claude-'))
const record = path.join(claude, 'projects', folder, `${SESSION}.jsonl`)
const subagents = path.join(claude, 'projects', folder, SESSION, 'subagents')
const subRecord = path.join(subagents, `agent-${SUB}.jsonl`)
const file = (name) => path.join(PROJECT, name)

let messages = 0
let context = 61_800
let output = 2_400
const tool = (id, name, input) => ({ type: 'tool_use', id, name, input })
/** One answer's line: now, with the tokens growing as a session's do. */
function answer(content, stop = 'tool_use') {
  context += 1_900
  output += 260
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
        cache_read_input_tokens: context,
        cache_creation_input_tokens: 900,
        output_tokens: output,
      },
      content,
    },
  })
}
const result = (id, text) =>
  JSON.stringify({
    type: 'user',
    timestamp: new Date().toISOString(),
    message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, content: text }] },
  })
/** Claude Code's notice that a background task ended, queued for the session. */
const notice = (call, task, summary) =>
  JSON.stringify({
    type: 'queue-operation',
    operation: 'enqueue',
    timestamp: new Date().toISOString(),
    content: `<task-notification>\n<task-id>${task}</task-id>\n<tool-use-id>${call}</tool-use-id>\n<status>completed</status>\n<summary>${summary}</summary>\n</task-notification>`,
  })
const add = (target, ...lines) => appendFileSync(target, `${lines.join('\n')}\n`)
const session = (status) =>
  writeFileSync(
    path.join(claude, 'sessions', `${process.pid}.json`),
    JSON.stringify({
      pid: process.pid,
      sessionId: SESSION,
      cwd: PROJECT,
      name: 'Say whether a pass can be seen',
      status,
      startedAt: Date.now() - 14 * 60_000,
      updatedAt: Date.now(),
    }),
  )

/**
 * A second session, on another made-up project, waiting on its user with a question: the pane
 * shows every session at work on the machine. Its process is this script's parent, so it counts
 * as running.
 */
function otherSession() {
  const cwd = `${HOME}\\projects\\weather-kit`
  const other = path.join(claude, 'projects', cwd.replace(/[^A-Za-z0-9]/g, '-'))
  mkdirSync(other, { recursive: true })
  const settings = `${cwd}\\src\\settings.ts`
  const line = (minutes, content, stop) =>
    JSON.stringify({
      type: 'assistant',
      timestamp: new Date(Date.now() - minutes * 60_000).toISOString(),
      message: {
        id: `msg_other_${minutes}`,
        model: 'claude-opus-5-5',
        role: 'assistant',
        stop_reason: stop,
        usage: { input_tokens: 4, cache_read_input_tokens: 45_800, output_tokens: 1_300 },
        content,
      },
    })
  writeFileSync(
    path.join(other, `${OTHER}.jsonl`),
    `${[
      line(9, [tool('w1', 'Read', { file_path: settings })], 'tool_use'),
      line(7, [tool('w2', 'Edit', { file_path: settings })], 'tool_use'),
      line(
        6,
        [{ type: 'text', text: 'Shall I also move the units into their own section?' }],
        'end_turn',
      ),
    ].join('\n')}\n`,
  )
  writeFileSync(
    path.join(claude, 'sessions', `${process.ppid}.json`),
    JSON.stringify({
      pid: process.ppid,
      sessionId: OTHER,
      cwd,
      name: 'Tidy the forecast settings',
      status: 'waiting',
      startedAt: Date.now() - 25 * 60_000,
      updatedAt: Date.now() - 6 * 60_000,
    }),
  )
}

function setUpAgent() {
  mkdirSync(path.join(claude, 'sessions'), { recursive: true })
  mkdirSync(subagents, { recursive: true })
  session('busy')
  otherSession()
  // The copy Claude Code keeps of passes.ts from before the session first changes it.
  const history = path.join(claude, 'file-history', SESSION)
  mkdirSync(history, { recursive: true })
  writeFileSync(
    path.join(history, 'd3m0c0de0f1le000@v1'),
    DEMO_FILES['src/orbit/passes.ts'].join('\n'),
  )
  const earlier = (minutes) => new Date(Date.now() - minutes * 60_000).toISOString()
  writeFileSync(
    record,
    `${[
      JSON.stringify({ type: 'custom-title', customTitle: 'Say whether a pass can be seen' }),
      JSON.stringify({
        type: 'assistant',
        timestamp: earlier(12),
        message: {
          id: 'msg_demo_early',
          model: 'claude-opus-5-5',
          role: 'assistant',
          stop_reason: 'tool_use',
          usage: { input_tokens: 4, cache_read_input_tokens: context, output_tokens: output },
          content: [tool('e1', 'Grep', { pattern: 'nextPass' })],
        },
      }),
    ].join('\n')}\n`,
  )
}

const put = (name, text) => writeFileSync(file(name), text)
/** passes.ts halfway: the pass says it can be seen, not yet how that is worked out. */
const PASSES_HALF = DEMO_FILES['src/orbit/passes.ts']
  .join('\n')
  .replace(
    '  maxElevation: number\n}',
    '  maxElevation: number\n  /** Lit by the sun while the sky is dark: seen with the eye. */\n  visible: boolean\n}',
  )

// ---------------------------------------------------------------------------
// The window
// ---------------------------------------------------------------------------

prepareHome()
demoRepository({ pending: false })
setUpAgent()

const profile = mkdtempSync(path.join(tmpdir(), 'elecdex-demo-'))
writeFileSync(path.join(profile, 'layout.json'), JSON.stringify(devTree))
writeFileSync(
  path.join(profile, 'layouts.json'),
  JSON.stringify({
    version: 1,
    items: [
      { id: 'demodev', name: 'agent + git', tree: devTree },
      { id: 'demorbit', name: 'orbit', tree: orbitTree },
    ],
    active: 'demodev',
  }),
)
writeFileSync(
  path.join(profile, 'settings.json'),
  JSON.stringify({
    theme: THEME,
    sound: { enabled: true },
    updates: { check: false },
    launcher: { showSystem: false, items: [] },
    layout: { confirmSwitch: false },
  }),
)
gitRepos(profile)

const app = await electron.launch({
  args: [MAIN, '--windowed', '--no-intro', `--user-data-dir=${profile}`, '--lang=en-US'],
  cwd: HOME,
  env: {
    ...process.env,
    USERPROFILE: HOME,
    HOMEPATH: '\\Users\\Public\\Documents\\elecdex-demo',
    HOME,
    ELECDEX_CLAUDE_DIR: claude,
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
const wait = (ms) => Promise.race([page.waitForTimeout(ms).catch(() => {}), closed])

if (PROBE) {
  say(`probe: the window is ${W}x${H} - close it to end`)
  await closed
  process.exit(0)
}

// ---------------------------------------------------------------------------
// The take
// ---------------------------------------------------------------------------

/** The agent at work: each step a line in its record, and the repository changed with it. */
async function agentAtWork() {
  say('agent: reads passes.ts')
  add(record, answer([tool('t1', 'Read', { file_path: file('src\\orbit\\passes.ts') })]))
  await wait(1800)

  say('agent: edits passes.ts')
  add(
    record,
    JSON.stringify({
      type: 'file-history-snapshot',
      snapshot: {
        trackedFileBackups: {
          'src\\orbit\\passes.ts': { backupFileName: 'd3m0c0de0f1le000@v1', version: 1 },
          'src\\orbit\\shadow.ts': { backupFileName: null, version: 1 },
        },
      },
    }),
    answer([tool('t2', 'Edit', { file_path: file('src\\orbit\\passes.ts') })]),
  )
  put('src/orbit/passes.ts', PASSES_HALF)
  await wait(2600)

  say('agent: starts a subagent in the background')
  writeFileSync(
    path.join(subagents, `agent-${SUB}.meta.json`),
    JSON.stringify({ agentType: 'general-purpose', toolUseId: 't3', requestShape: 'background' }),
  )
  add(
    record,
    answer([
      tool('t3', 'Agent', {
        description: 'Check the shadow maths',
        subagent_type: 'general-purpose',
        prompt: 'Check.',
      }),
    ]),
    result('t3', `Async agent launched successfully.\nagentId: ${SUB}`),
  )
  writeFileSync(subRecord, '')
  add(subRecord, answer([tool('s1', 'Read', { file_path: file('src\\orbit\\track.ts') })]))
  await wait(2000)

  say('agent: writes shadow.ts')
  add(record, answer([tool('t4', 'Write', { file_path: file('src\\orbit\\shadow.ts') })]))
  put('src/orbit/shadow.ts', SHADOW)
  add(subRecord, answer([tool('s2', 'WebFetch', { url: 'https://celestrak.org/columns/v03n01/' })]))
  await wait(2400)

  say('agent: runs the tests in the background')
  add(
    record,
    answer([
      tool('t5', 'Bash', {
        command: 'npm test -- orbit',
        description: 'Run the orbit tests',
        run_in_background: true,
      }),
    ]),
    result('t5', `Command running in background with ID: ${SHELL}. Output is being written to: x`),
  )
  add(
    subRecord,
    answer([
      tool('s3', 'Bash', { description: 'Compare the shadow entry with the reference times' }),
    ]),
  )
  await wait(2400)

  say('agent: edits passes.ts again')
  add(record, answer([tool('t6', 'Edit', { file_path: file('src\\orbit\\passes.ts') })]))
  put('src/orbit/passes.ts', PASSES_NOW)
  await wait(2600)

  say('subagent: done')
  add(
    subRecord,
    answer([{ type: 'text', text: 'The shadow entry matches the reference times.' }], 'end_turn'),
  )
  add(record, notice('t3', SUB, 'Agent "Check the shadow maths" finished'))
  await wait(2000)

  say('tests: done')
  add(record, notice('t5', SHELL, 'Background command "Run the orbit tests" completed'))
  await wait(1800)

  say('agent: commits')
  add(
    record,
    answer([
      tool('t7', 'Bash', {
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
  await wait(3000)

  say('agent: answers')
  add(
    record,
    answer(
      [{ type: 'text', text: 'Passes now say whether they can be seen with the eye.' }],
      'end_turn',
    ),
  )
  session('idle')
  await wait(2200)
}

/** A rest on the commit just made: the card with the whole of it. */
async function restOnCommit() {
  const row = page.locator('[data-testid=git-commit]').first()
  const box = await row.boundingBox()
  if (box === null) return
  const on = { x: box.x + 160, y: box.y + box.height / 2 }
  say('pointer: opens the new commit')
  await page.mouse.move(on.x, on.y, { steps: 12 })
  await page.mouse.click(on.x, on.y)
  // Off the row, so its diff is seen whole before the card comes over it.
  await page.mouse.move(W * 0.8, H * 0.5, { steps: 10 })
  await wait(3200)
  say('pointer: rests on it')
  await page.mouse.move(on.x, on.y, { steps: 10 })
  await wait(4200)
  await page.mouse.move(W / 2, 12, { steps: 8 })
  await wait(1000)
}

/** The second saved layout: the map, the stations, and the Starlink satellites. */
async function toTheMap() {
  say('switch: to the map')
  await page.keyboard.press('Control+Shift+Digit2')
  await wait(6000)
  const focus = (code) => page.locator(`[data-testid=orbit-focus][data-code=${code}]`)
  say('map: follow Tiangong')
  await focus('CSS').click()
  await wait(4500)
  say('map: back to the ISS')
  await focus('ISS').click()
  await wait(3500)
  say('switch: back')
  await page.keyboard.press('Control+Shift+Digit1')
  await wait(3000)
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

say(`window up - the take starts in ${LEAD} s`)
await wait(LEAD * 1000)
try {
  await wait(800)
  await agentAtWork()
  await restOnCommit()
  await toTheMap()
  say('done - close the window to end')
  await closed
} catch (error) {
  say(`ended: ${error.message.split('\n')[0]}`)
}
await app.close().catch(() => {})
