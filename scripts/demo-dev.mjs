/**
 * The AI AGENT, GIT and ORBIT panes, driven for a screen recording (a post on X): coding agents at
 * work on this machine beside the GIT pane following the repository one of them changes, then a
 * switch to a second saved layout where the ORBIT pane shows the stations and the Starlink
 * satellites - the pointer resting on the ISS and on a satellite, the station followed changed,
 * and last the observer's city.
 *
 * Nothing in it is anyone's: the agents are a made-up Claude Code folder this script writes a
 * line at a time (the pane reads it as it would real sessions'), and the repository is the demo one
 * by a made-up author (scripts/demo-fixtures.mjs), grown here with more history and changed and
 * committed as the agent "works". Only the orbital elements are real: downloaded from CelesTrak
 * once, as the pane would.
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
 *   --pace=1         a factor on every pause: 1.5 for a slower take, 0.8 for a quicker one
 *   --theme=tron     any built-in theme
 *   --shots=<dir>    also save a screenshot every two seconds there, to look the take over
 */
import { spawn } from 'node:child_process'
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
  keepOrbits,
  OTHER,
  PASSES_NOW,
  PROJECT,
  prepareHome,
  REPO_ID,
  SESSION,
  SHADOW,
  seedOrbits,
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
const PACE = number('pace', 1)
const THEME = option('theme') ?? 'tron'
const SHOTS = option('shots')

const say = (text) => console.log(`${new Date().toTimeString().slice(0, 8)} ${text}`)

// ---------------------------------------------------------------------------
// The two saved layouts: the agents and the repository side by side, and the map
// ---------------------------------------------------------------------------

const devTree = {
  version: 1,
  root: {
    kind: 'split',
    id: 'dev',
    direction: 'row',
    sizes: [0.4, 0.6],
    children: [
      { kind: 'pane', id: 'agent', widget: 'agents', state: { open: SESSION } },
      {
        kind: 'pane',
        id: 'repo',
        widget: 'git',
        state: { repo: REPO_ID, graph: 'all', listWidth: 0.4, logShare: 0.58 },
      },
    ],
  },
}
const orbitTree = {
  version: 1,
  root: { kind: 'pane', id: 'map', widget: 'orbit', state: { starlink: true } },
}

// ---------------------------------------------------------------------------
// The repository, grown: branches merged and left, tags, a remote a little behind
// ---------------------------------------------------------------------------

const put = (name, text) => {
  mkdirSync(path.dirname(path.join(PROJECT, name)), { recursive: true })
  writeFileSync(path.join(PROJECT, name), text)
}
const hoursAgo = (h) => new Date(Date.now() - h * 3_600_000).toISOString()
const commit = (message, hours, ...body) => {
  git(['add', '-A'])
  git(['commit', '-q', '-m', message, ...body.flatMap((b) => ['-m', b])], hoursAgo(hours))
}

function moreHistory() {
  git(['checkout', '-q', '-b', 'observer-picker'])
  put('src/orbit/observer.ts', 'export interface Observer {\n  lat: number\n  lon: number\n}\n')
  commit('feat(orbit): choose the observer from a list of cities', 20)
  put('src/orbit/cities.ts', "export const CITIES = ['Tokyo', 'London', 'Reykjavik']\n")
  commit('feat(orbit): the cities, with their time zones', 19)
  git(['checkout', '-q', 'main'])
  git(
    ['merge', '-q', '--no-ff', 'observer-picker', '-m', "Merge branch 'observer-picker'"],
    hoursAgo(18),
  )
  git(['tag', 'v0.4.0'])
  put(
    'src/orbit/track.ts',
    `${DEMO_FILES['src/orbit/track.ts'].join('\n')}// Across the date line: split, never a line over the map.\n`,
  )
  commit('fix(orbit): keep the track whole across the date line', 14)
  put(
    'tests/passes.test.ts',
    "import { nextPass } from '../src/orbit/passes'\n\ntest('a pass over Tokyo', () => {})\n",
  )
  commit('test(orbit): passes over Tokyo and Reykjavik', 11)
  git(['checkout', '-q', 'starlink-shells'])
  put('src/orbit/shells.ts', 'export const SHELLS = [540, 550, 560, 570]\n')
  commit('feat(starlink): the shells by altitude', 9)
  put('src/orbit/shells.ts', 'export const SHELLS = [340, 540, 550, 560, 570]\n')
  commit('fix(starlink): the lower shell too', 7)
  git(['checkout', '-q', 'main'])
  put(
    'src/orbit/position.ts',
    `${DEMO_FILES['src/orbit/position.ts'].join('\n')}// Propagated a minute at a time: a pass is found to the minute.\n`,
  )
  commit('perf(orbit): propagate a minute at a time', 6)
  git(['checkout', '-q', '-b', 'fix/eclipse-edge'])
  put('src/orbit/eclipse.ts', 'export const PENUMBRA = true\n')
  commit('fix(orbit): the edge of the shadow is soft', 4)
  git(['checkout', '-q', 'main'])
  put(
    'README.md',
    '# Orbit tracker\n\nWhere the stations are, from their orbital elements.\n\nPasses over a city of your choice.\n',
  )
  commit('docs: the observer is yours to choose', 3)
  git(['tag', 'v0.4.1'])
  // What the remote has: one commit behind.
  git(['update-ref', 'refs/remotes/origin/main', 'HEAD~1'])
}

// ---------------------------------------------------------------------------
// The made-up agents, written a line at a time as the take goes
// ---------------------------------------------------------------------------

const claude = mkdtempSync(path.join(tmpdir(), 'elecdex-demo-claude-'))
const projectDir = (cwd) => path.join(claude, 'projects', cwd.replace(/[^A-Za-z0-9]/g, '-'))
const record = path.join(projectDir(PROJECT), `${SESSION}.jsonl`)
const subDir = (cwd, id) => path.join(projectDir(cwd), id, 'subagents')
const file = (name) => path.join(PROJECT, name.replaceAll('/', '\\'))
const add = (target, ...lines) => {
  mkdirSync(path.dirname(target), { recursive: true })
  appendFileSync(target, `${lines.join('\n')}\n`)
}

/** Keeps a made-up session running: the pane lists only sessions whose process is alive. */
const keepers = []
const alivePid = () => {
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1 << 30)'], {
    stdio: 'ignore',
  })
  keepers.push(child)
  return child.pid
}

let messages = 0
const tool = (id, name, input) => ({ type: 'tool_use', id, name, input })
/** One answer's line, `minutesAgo` before now, with a context that grows as a session's does. */
const usage = { context: 58_000, output: 2_100 }
function answer(content, { stop = 'tool_use', minutesAgo = 0, tokens = usage } = {}) {
  tokens.context += 1_700
  tokens.output += 240
  return JSON.stringify({
    type: 'assistant',
    timestamp: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
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
const reply = (text, options = {}) =>
  answer([{ type: 'text', text }], { ...options, stop: 'end_turn' })
const result = (id, text) =>
  JSON.stringify({
    type: 'user',
    timestamp: new Date().toISOString(),
    message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, content: text }] },
  })
/** Claude Code's notice that a background task ended, queued for its session. */
const notice = (call, task, summary, minutesAgo = 0) =>
  JSON.stringify({
    type: 'queue-operation',
    operation: 'enqueue',
    timestamp: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    content: `<task-notification>\n<task-id>${task}</task-id>\n<tool-use-id>${call}</tool-use-id>\n<status>completed</status>\n<summary>${summary}</summary>\n</task-notification>`,
  })
function sessionFile(pid, id, cwd, name, status, startedMinutesAgo) {
  writeFileSync(
    path.join(claude, 'sessions', `${pid}.json`),
    JSON.stringify({
      pid,
      sessionId: id,
      cwd,
      name,
      status,
      startedAt: Date.now() - startedMinutesAgo * 60_000,
      updatedAt: Date.now(),
    }),
  )
}
/** A background subagent: its meta file, the launch, and its record. */
function startSubagent(target, cwd, session, call, agent, description, type = 'general-purpose') {
  const dir = subDir(cwd, session)
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    path.join(dir, `agent-${agent}.meta.json`),
    JSON.stringify({ agentType: type, toolUseId: call, requestShape: 'background' }),
  )
  add(
    target,
    answer([tool(call, 'Agent', { description, subagent_type: type, prompt: 'Go.' })]),
    result(call, `Async agent launched successfully.\nagentId: ${agent}`),
  )
  return path.join(dir, `agent-${agent}.jsonl`)
}

/** The main session's history before the take: a quarter of an hour of reading and one finished task. */
function mainHistory() {
  sessionFile(process.pid, SESSION, PROJECT, 'Say whether a pass can be seen', 'busy', 16)
  const history = path.join(claude, 'file-history', SESSION)
  mkdirSync(history, { recursive: true })
  writeFileSync(
    path.join(history, 'd3m0c0de0f1le000@v1'),
    DEMO_FILES['src/orbit/passes.ts'].join('\n'),
  )
  writeFileSync(path.join(history, 'd3m0c0de0f1le001@v1'), readmeBefore)
  writeFileSync(path.join(history, 'd3m0c0de0f1le002@v1'), testBefore)
  add(
    record,
    JSON.stringify({ type: 'custom-title', customTitle: 'Say whether a pass can be seen' }),
    answer([tool('h1', 'Grep', { pattern: 'nextPass' })], { minutesAgo: 14 }),
    answer([tool('h2', 'Read', { file_path: file('src/orbit/track.ts') })], { minutesAgo: 13 }),
    answer([tool('h3', 'Read', { file_path: file('src/orbit/position.ts') })], { minutesAgo: 12 }),
    answer(
      [
        tool('h4', 'Agent', {
          description: 'Find where passes are drawn',
          subagent_type: 'Explore',
          prompt: 'Look.',
        }),
      ],
      { minutesAgo: 9 },
    ),
    result('h4', 'Passes are drawn in PassList, from nextPass.'),
    answer([tool('h5', 'Grep', { pattern: 'inShadow|eclipse' })], { minutesAgo: 6 }),
    answer([tool('h6', 'WebFetch', { url: 'https://celestrak.org/columns/v03n01/' })], {
      minutesAgo: 4,
    }),
  )
}
const readmeBefore =
  '# Orbit tracker\n\nWhere the stations are, from their orbital elements.\n\nPasses over a city of your choice.\n'
const testBefore =
  "import { nextPass } from '../src/orbit/passes'\n\ntest('a pass over Tokyo', () => {})\n"

/** The other sessions on the machine: one at work with a subagent, one waiting, one done. */
const MARKET = '5e551011-0000-4000-8000-00000000c3d4'
const NOTES = '5e551011-0000-4000-8000-00000000d5e6'
const marketCwd = `${HOME}\\projects\\market-board`
const marketRecord = path.join(projectDir(marketCwd), `${MARKET}.jsonl`)
const marketTokens = { context: 71_000, output: 5_600 }
let marketSub = ''
function otherSessions() {
  sessionFile(alivePid(), MARKET, marketCwd, 'Refactor the market board', 'busy', 42)
  add(
    marketRecord,
    answer([tool('m1', 'Read', { file_path: `${marketCwd}\\src\\board.ts` })], {
      minutesAgo: 30,
      tokens: marketTokens,
    }),
    answer([tool('m2', 'Edit', { file_path: `${marketCwd}\\src\\board.ts` })], {
      minutesAgo: 24,
      tokens: marketTokens,
    }),
    answer([tool('m3', 'Edit', { file_path: `${marketCwd}\\src\\rows.ts` })], {
      minutesAgo: 18,
      tokens: marketTokens,
    }),
  )
  marketSub = startSubagent(
    marketRecord,
    marketCwd,
    MARKET,
    'm4',
    'a0m4rketb0ard0001',
    'Move the sparkline into its own file',
  )
  add(
    marketSub,
    answer([tool('x1', 'Read', { file_path: `${marketCwd}\\src\\sparkline.ts` })], {
      minutesAgo: 2,
    }),
  )

  const weather = `${HOME}\\projects\\weather-kit`
  sessionFile(process.ppid, OTHER, weather, 'Tidy the forecast settings', 'waiting', 25)
  const tokens = { context: 44_000, output: 1_200 }
  add(
    path.join(projectDir(weather), `${OTHER}.jsonl`),
    answer([tool('w1', 'Read', { file_path: `${weather}\\src\\settings.ts` })], {
      minutesAgo: 9,
      tokens,
    }),
    answer([tool('w2', 'Edit', { file_path: `${weather}\\src\\settings.ts` })], {
      minutesAgo: 7,
      tokens,
    }),
    reply('Shall I also move the units into their own section?', { minutesAgo: 6, tokens }),
  )

  const notes = `${HOME}\\projects\\release-notes`
  sessionFile(alivePid(), NOTES, notes, 'Write the release notes', 'idle', 55)
  const noteTokens = { context: 38_000, output: 3_900 }
  add(
    path.join(projectDir(notes), `${NOTES}.jsonl`),
    answer([tool('n1', 'Bash', { description: 'List the commits since v0.4.0' })], {
      minutesAgo: 12,
      tokens: noteTokens,
    }),
    answer([tool('n2', 'Write', { file_path: `${notes}\\CHANGELOG.md` })], {
      minutesAgo: 10,
      tokens: noteTokens,
    }),
    reply('The notes for v0.4.1 are in CHANGELOG.md.', { minutesAgo: 8, tokens: noteTokens }),
  )
}
/** The market session goes on working while the take runs, a step every few seconds. */
const marketSteps = [
  () =>
    add(marketSub, answer([tool('x2', 'Write', { file_path: `${marketCwd}\\src\\sparkline.ts` })])),
  () =>
    add(
      marketRecord,
      answer([tool('m5', 'Grep', { pattern: 'drawSpark' })], { tokens: marketTokens }),
    ),
  () => add(marketSub, answer([tool('x3', 'Edit', { file_path: `${marketCwd}\\src\\board.ts` })])),
  () =>
    add(
      marketRecord,
      answer([tool('m6', 'Bash', { description: 'Type-check the board' })], {
        tokens: marketTokens,
      }),
    ),
  () => add(marketSub, reply('The sparkline is in src/sparkline.ts; the board imports it.')),
  () => add(marketRecord, notice('m4', 'a0m4rketb0ard0001', 'Agent finished')),
]

// ---------------------------------------------------------------------------
// The window
// ---------------------------------------------------------------------------

prepareHome()
demoRepository({ pending: false })
moreHistory()
mkdirSync(path.join(claude, 'sessions'), { recursive: true })
mainHistory()
otherSessions()

const profile = mkdtempSync(path.join(tmpdir(), 'elecdex-demo-'))
writeFileSync(path.join(profile, 'layout.json'), JSON.stringify(devTree))
writeFileSync(
  path.join(profile, 'layouts.json'),
  JSON.stringify({
    version: 1,
    items: [
      { id: 'demodev', name: 'agents + git', tree: devTree },
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
seedOrbits(profile)

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
const wait = (ms) => Promise.race([page.waitForTimeout(ms * PACE).catch(() => {}), closed])
const end = () => {
  for (const child of keepers) child.kill()
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

const STEP = 1100
const SUB_A = 'a5ad0c0de5ad0c0de'
const SUB_B = 'a7e57c0de7e57c0de'
const SHELL = 'bdemo7t3st'

/** The main agent at work: each step a line in its record, and the repository changed with it. */
async function agentAtWork() {
  let market = 0
  const alsoMarket = () => marketSteps[market++]?.()
  const step = async (label, run) => {
    say(label)
    run()
    await wait(STEP)
  }
  await step('agent: reads passes.ts', () =>
    add(record, answer([tool('t1', 'Read', { file_path: file('src/orbit/passes.ts') })])),
  )
  await step('agent: edits passes.ts', () => {
    add(
      record,
      JSON.stringify({
        type: 'file-history-snapshot',
        snapshot: {
          trackedFileBackups: {
            'src\\orbit\\passes.ts': { backupFileName: 'd3m0c0de0f1le000@v1', version: 1 },
            'README.md': { backupFileName: 'd3m0c0de0f1le001@v1', version: 1 },
            'tests\\passes.test.ts': { backupFileName: 'd3m0c0de0f1le002@v1', version: 1 },
            'src\\orbit\\shadow.ts': { backupFileName: null, version: 1 },
            'src\\orbit\\sun.ts': { backupFileName: null, version: 1 },
          },
        },
      }),
      answer([tool('t2', 'Edit', { file_path: file('src/orbit/passes.ts') })]),
    )
    put('src/orbit/passes.ts', PASSES_HALF)
  })
  let subA = ''
  await step('agent: two subagents in the background', () => {
    subA = startSubagent(record, PROJECT, SESSION, 't3', SUB_A, 'Check the shadow maths')
    add(subA, answer([tool('s1', 'Read', { file_path: file('src/orbit/track.ts') })]))
    alsoMarket()
  })
  let subB = ''
  await step('agent: …and one to write the tests', () => {
    subB = startSubagent(record, PROJECT, SESSION, 't4', SUB_B, 'Write tests for visible passes')
    add(subB, answer([tool('r1', 'Read', { file_path: file('tests/passes.test.ts') })]))
  })
  await step('agent: writes shadow.ts', () => {
    add(record, answer([tool('t5', 'Write', { file_path: file('src/orbit/shadow.ts') })]))
    put('src/orbit/shadow.ts', SHADOW)
    add(subA, answer([tool('s2', 'WebFetch', { url: 'https://celestrak.org/columns/v03n01/' })]))
  })
  await step('agent: writes sun.ts', () => {
    add(record, answer([tool('t6', 'Write', { file_path: file('src/orbit/sun.ts') })]))
    put('src/orbit/sun.ts', SUN)
    add(subB, answer([tool('r2', 'Edit', { file_path: file('tests/passes.test.ts') })]))
    put('tests/passes.test.ts', TESTS_NOW)
    alsoMarket()
  })
  await step('agent: runs the tests in the background', () => {
    add(
      record,
      answer([
        tool('t7', 'Bash', {
          command: 'npm test -- orbit',
          description: 'Run the orbit tests',
          run_in_background: true,
        }),
      ]),
      result(
        't7',
        `Command running in background with ID: ${SHELL}. Output is being written to: x`,
      ),
    )
    add(
      subA,
      answer([
        tool('s3', 'Bash', { description: 'Compare the shadow entry with the reference times' }),
      ]),
    )
  })
  await step('agent: edits passes.ts again', () => {
    add(record, answer([tool('t8', 'Edit', { file_path: file('src/orbit/passes.ts') })]))
    put('src/orbit/passes.ts', PASSES_NOW)
    add(subB, answer([tool('r3', 'Bash', { description: 'Run the new tests' })]))
    alsoMarket()
  })
  await step('agent: the README', () => {
    add(record, answer([tool('t9', 'Edit', { file_path: file('README.md') })]))
    put('README.md', `${readmeBefore}\nA pass says whether it can be seen with the eye.\n`)
  })
  await step('subagents: done', () => {
    add(subA, reply('The shadow entry matches the reference times.'))
    add(record, notice('t3', SUB_A, 'Agent "Check the shadow maths" finished'))
    add(subB, reply('Three tests: lit and dark, lit and day, in shadow.'))
    add(record, notice('t4', SUB_B, 'Agent "Write tests for visible passes" finished'))
    alsoMarket()
  })
  await step('tests: done', () =>
    add(record, notice('t7', SHELL, 'Background command "Run the orbit tests" completed')),
  )
  await step('agent: commits', () => {
    add(
      record,
      answer([
        tool('t10', 'Bash', {
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
    alsoMarket()
  })
  await wait(700)
  say('agent: answers')
  add(record, reply('Passes now say whether they can be seen with the eye.'))
  sessionFile(process.pid, SESSION, PROJECT, 'Say whether a pass can be seen', 'idle', 16)
  await wait(900)
}

/** passes.ts halfway: the pass says it can be seen, not yet how that is worked out. */
const PASSES_HALF = DEMO_FILES['src/orbit/passes.ts']
  .join('\n')
  .replace(
    '  maxElevation: number\n}',
    '  maxElevation: number\n  /** Lit by the sun while the sky is dark: seen with the eye. */\n  visible: boolean\n}',
  )
const SUN = [
  '/** Where the sun is, in the same frame as the stations: near enough for a shadow. */',
  'export function sunPosition(at: Date): Vector {',
  '  const days = (at.getTime() - J2000) / 86_400_000',
  '  const longitude = mod(280.46 + 0.9856474 * days, 360)',
  '  return fromEcliptic(longitude, AU_KM)',
  '}',
  '',
].join('\n')
const TESTS_NOW = `${testBefore}test('lit and dark: visible', () => {})\ntest('lit in daylight: not visible', () => {})\ntest('in the shadow: not visible', () => {})\n`

/** The new commit opened, then the pointer resting on it: the card with the whole of it. */
async function openCommit() {
  const row = page.locator('[data-testid=git-commit]').first()
  const box = await row.boundingBox()
  if (box === null) return
  const on = { x: box.x + 150, y: box.y + box.height / 2 }
  say('pointer: opens the new commit')
  await page.mouse.move(on.x, on.y, { steps: 8 })
  await page.mouse.click(on.x, on.y)
  await page.mouse.move(W * 0.82, H * 0.45, { steps: 6 })
  await wait(1800)
  say('pointer: rests on it')
  await page.mouse.move(on.x, on.y, { steps: 6 })
  await wait(2600)
}

/** Moves the pointer over the map until a Starlink satellite's card shows. */
async function findSatellite(map) {
  const box = await map.boundingBox()
  if (box === null) return
  for (let i = 0; i < 80; i++) {
    const x = box.x + box.width * (0.22 + 0.006 * i)
    const y = box.y + box.height * (0.42 + 0.12 * Math.sin(i / 6))
    await page.mouse.move(x, y, { steps: 2 })
    const tip = page.getByTestId('orbit-tip')
    if ((await tip.count()) > 0 && /starlink/i.test((await tip.textContent()) ?? '')) return
  }
}

/** The second saved layout: the map, the stations, the satellites, and another city. */
async function toTheMap() {
  say('switch: to the map')
  await page.keyboard.press('Control+Shift+Digit2')
  await wait(3200)
  const map = page.getByTestId('orbit-map')
  const box = await map.boundingBox()
  const marks = JSON.parse((await map.getAttribute('data-stations').catch(() => null)) ?? '{}')
  if (box !== null && marks.ISS) {
    say('map: the pointer on the ISS')
    await page.mouse.move(box.x + marks.ISS[0], box.y + marks.ISS[1], { steps: 14 })
    await page
      .getByTestId('orbit-tip')
      .waitFor({ timeout: 3000 })
      .catch(() => say('  (no card on the ISS)'))
    await wait(2200)
  }
  say('map: and on a Starlink satellite')
  await findSatellite(map)
  await wait(2200)
  await page.mouse.move(W / 2, 12, { steps: 6 })
  say('map: follow Tiangong')
  await page.locator('[data-testid=orbit-focus][data-code=CSS]').click()
  await wait(2400)
  say('map: another city')
  await page.getByTestId('orbit-observer').click()
  await wait(500)
  await page.getByTestId('orbit-picker-input').pressSequentially('Sydn', { delay: 90 })
  await wait(500)
  await page.getByTestId('orbit-picker-city').first().click()
  await wait(3200)
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
await wait((LEAD * 1000) / PACE)
try {
  await wait(500)
  await agentAtWork()
  await openCommit()
  await toTheMap()
  say('done - close the window to end')
  await closed
} catch (error) {
  say(`ended: ${error.message.split('\n')[0]}`)
}
end()
await app.close().catch(() => {})
