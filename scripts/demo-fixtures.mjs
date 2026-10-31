/**
 * The made-up world the README screenshots and the demos show (scripts/gen-screenshots.mjs,
 * scripts/demo-dev.mjs): a demo home under C:/Users/Public, a git repository of a made-up orbit
 * tracker by a made-up author, and a made-up Claude Code folder for the AI AGENT pane - so no
 * shot or recording carries this machine's paths, files, repositories or sessions.
 */
import { execFileSync, spawn } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'

export const HOME = 'C:\\Users\\Public\\Documents\\elecdex-demo'
export const PROJECT = `${HOME}\\projects\\elecdex`

/** The demo home, afresh: a checkout of this project's shape with nothing of anyone's in it. */
export function prepareHome() {
  // A demo home that looks like a checkout of this project.
  // Afresh on every run, so nothing an earlier run or a hand left there is in the shots.
  rmSync(PROJECT, { recursive: true, force: true })
  for (const dir of ['Documents', 'Downloads', 'docs', 'public', 'scripts', 'src', 'tests']) {
    const parent = ['Documents', 'Downloads'].includes(dir) ? HOME : PROJECT
    mkdirSync(path.join(parent, dir), { recursive: true })
  }
  for (const file of ['README.md', 'package.json', 'LICENSE', 'biome.json', 'tsconfig.json']) {
    writeFileSync(path.join(PROJECT, file), '')
  }
}

/*
 * The demo checkout as a git repository, for the GIT pane: a few commits of a made-up
 * orbit tracker by a made-up author, and changes not yet committed. Built afresh on
 * every run, with the machine's own git configuration shut out (no name, no signing).
 */
export const GIT_ENV = {
  ...process.env,
  GIT_CONFIG_GLOBAL: path.join(mkdtempSync(path.join(tmpdir(), 'elecdex-git-')), 'config'),
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'elecdex demo',
  GIT_AUTHOR_EMAIL: 'demo@example.com',
  GIT_COMMITTER_NAME: 'elecdex demo',
  GIT_COMMITTER_EMAIL: 'demo@example.com',
}
writeFileSync(GIT_ENV.GIT_CONFIG_GLOBAL, '')
// Every git call of the run reads it, so it goes only as the run ends.
process.on('exit', () => dropFolder(path.dirname(GIT_ENV.GIT_CONFIG_GLOBAL)))

/**
 * Takes away a folder the run made in the temp folder (a profile, a Claude folder) once what
 * used it is done. Electron can hold a profile's files for a moment after it quits on Windows,
 * so it is tried a few times, and a folder that will not go is left rather than failing the run.
 */
export function dropFolder(dir) {
  try {
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  } catch {
    // Left in the temp folder: the system's to clear.
  }
}
export const git = (args, date) =>
  execFileSync('git', args, {
    cwd: PROJECT,
    env: date ? { ...GIT_ENV, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } : GIT_ENV,
    stdio: 'ignore',
  })
export const DEMO_FILES = {
  'src/orbit/position.ts': [
    "import { propagate, twoline2satrec } from 'satellite.js'",
    '',
    '/** Where a satellite is at a moment, from its two-line elements. */',
    'export function positionAt(tle: [string, string], at: Date) {',
    '  const satrec = twoline2satrec(tle[0], tle[1])',
    '  return propagate(satrec, at)',
    '}',
    '',
  ],
  'src/orbit/track.ts': [
    "import { positionAt } from './position'",
    '',
    '/** One orbit back and two ahead, a point a minute. */',
    'export function groundTrack(tle: [string, string], now: Date, period: number) {',
    '  const points = []',
    '  for (let t = -period; t <= 2 * period; t += 60_000) {',
    '    points.push(positionAt(tle, new Date(now.getTime() + t)))',
    '  }',
    '  return points',
    '}',
    '',
  ],
  'src/orbit/passes.ts': [
    "import { lookAngles } from './look'",
    '',
    'export interface Pass {',
    '  rise: Date',
    '  set: Date',
    '  maxElevation: number',
    '}',
    '',
    '/** The next time the station rises above the horizon for the observer. */',
    'export function nextPass(track: Sample[], observer: Observer): Pass | null {',
    '  let pass: Pass | null = null',
    '  for (const sample of track) {',
    '    const { elevation } = lookAngles(observer, sample)',
    '    if (elevation > 0 && pass === null) {',
    '      pass = { rise: sample.at, set: sample.at, maxElevation: elevation }',
    '    } else if (elevation > 0 && pass !== null) {',
    '      pass.set = sample.at',
    '      pass.maxElevation = Math.max(pass.maxElevation, elevation)',
    '    } else if (pass !== null) {',
    '      return pass',
    '    }',
    '  }',
    '  return pass',
    '}',
    '',
  ],
}
export const PASSES_NOW = DEMO_FILES['src/orbit/passes.ts']
  .join('\n')
  .replace(
    "import { lookAngles } from './look'",
    "import { lookAngles } from './look'\nimport { inShadow } from './shadow'",
  )
  .replace(
    '  maxElevation: number\n}',
    '  maxElevation: number\n  /** Lit by the sun while the sky is dark: seen with the eye. */\n  visible: boolean\n}',
  )
  .replace(
    '      pass = { rise: sample.at, set: sample.at, maxElevation: elevation }',
    '      pass = { rise: sample.at, set: sample.at, maxElevation: elevation, visible: false }',
  )
  .replace(
    '      pass.maxElevation = Math.max(pass.maxElevation, elevation)',
    '      pass.maxElevation = Math.max(pass.maxElevation, elevation)\n      pass.visible ||= !inShadow(sample) && sunBelow(observer, sample.at, -6)',
  )
export const SHADOW = [
  "import { sunPosition } from './sun'",
  '',
  "/** In the Earth's shadow: a cylinder behind the planet, which is near enough for low orbits. */",
  'export function inShadow(sample: Sample): boolean {',
  '  const sun = sunPosition(sample.at)',
  '  const along = dot(sample.eci, sun) / norm(sun)',
  '  if (along > 0) return false',
  '  const across = Math.sqrt(dot(sample.eci, sample.eci) - along * along)',
  '  return across < EARTH_RADIUS_KM',
  '}',
  '',
].join('\n')

/**
 * Builds the demo repository. `pending`: leave the agent's work uncommitted in it, as the
 * screenshot shows; without it the tree is clean, for a demo that makes the changes live.
 */
export function demoRepository({ pending = true } = {}) {
  rmSync(path.join(PROJECT, '.git'), { recursive: true, force: true })
  rmSync(path.join(PROJECT, 'src', 'orbit'), { recursive: true, force: true })
  mkdirSync(path.join(PROJECT, 'src', 'orbit'), { recursive: true })
  const put = (file, text) => writeFileSync(path.join(PROJECT, file), text)
  git(['init', '-q', '-b', 'main'])
  put('README.md', '# Orbit tracker\n\nWhere the stations are, from their orbital elements.\n')
  git(['add', '-A'])
  git(['commit', '-q', '-m', 'chore: start the orbit tracker'], '2026-09-18T09:12:00+09:00')
  const steps = [
    [
      'src/orbit/position.ts',
      'feat(orbit): positions from two-line elements with SGP4',
      '2026-09-19T14:40:00+09:00',
    ],
    [
      'src/orbit/track.ts',
      'feat(orbit): the ground track, one orbit back and two ahead',
      '2026-09-20T11:05:00+09:00',
    ],
    [
      'src/orbit/passes.ts',
      'feat(orbit): the next pass over the observer',
      '2026-09-22T16:30:00+09:00',
    ],
  ]
  for (const [file, message, date] of steps.slice(0, 2)) {
    put(file, DEMO_FILES[file].join('\n'))
    git(['add', '-A'])
    git(['commit', '-q', '-m', message], date)
  }
  // A branch for the track's colours, merged back and tagged, so the graph has lanes to draw.
  git(['checkout', '-q', '-b', 'track-colours'])
  put(
    'src/orbit/colours.ts',
    "export const SUNLIT = 'var(--accent)'\nexport const SHADOW = 'var(--accent-dim)'\n",
  )
  git(['add', '-A'])
  git(
    [
      'commit',
      '-q',
      '-m',
      'feat(orbit): the track bright in sunlight, dim in shadow',
      '-m',
      "The part of an orbit in the Earth's shadow is drawn dim, so a glance says when the station can be seen.",
    ],
    '2026-09-21T15:10:00+09:00',
  )
  git(['checkout', '-q', 'main'])
  const [file, message, date] = steps[2]
  put(file, DEMO_FILES[file].join('\n'))
  git(['add', '-A'])
  git(['commit', '-q', '-m', message], date)
  git(
    ['merge', '-q', '--no-ff', 'track-colours', '-m', "Merge branch 'track-colours'"],
    '2026-09-22T18:05:00+09:00',
  )
  git(['tag', 'v0.3.0'])
  // What the remote has: one commit behind, as if the last one were not pushed yet.
  git(['update-ref', 'refs/remotes/origin/main', 'HEAD'])
  git(['config', 'branch.main.remote', 'origin'])
  git(['config', 'branch.main.merge', 'refs/heads/main'])
  // A branch begun and left, on a lane of its own beside main.
  git(['checkout', '-q', '-b', 'starlink-shells'])
  git(
    ['commit', '-q', '--allow-empty', '-m', 'wip: group Starlink by shell'],
    '2026-09-23T08:40:00+09:00',
  )
  git(['checkout', '-q', 'main'])
  put(
    'README.md',
    '# Orbit tracker\n\nWhere the stations are, from their orbital elements.\n\nPasses say whether they can be seen with the eye.\n',
  )
  git(['commit', '-q', '-am', 'docs: say what a pass tells'], '2026-09-23T10:20:00+09:00')
  if (!pending) return
  // Not yet committed: the work the agent in the AI AGENT shot is doing.
  put('src/orbit/passes.ts', PASSES_NOW)
  put('src/orbit/shadow.ts', SHADOW)
}

/*
 * The remote the git pane pushes to: a bare repository in the demo home (a temp folder's path would
 * show the user's name), so a PUSH never leaves this machine. Take it away again when done,
 * folder and all, so a later take or screenshot run starts from the home as it was.
 */
export const REMOTE = `${HOME}\\remotes\\orbit-tracker.git`

/** The CGI's own status and headers, split from the body that follows them. */
function cgiHead(raw) {
  const headers = {}
  let status = 200
  for (const line of raw.split('\r\n')) {
    const at = line.indexOf(':')
    const name = line.slice(0, at).trim()
    const value = line.slice(at + 1).trim()
    if (name.toLowerCase() === 'status') status = Number.parseInt(value, 10)
    else headers[name] = value
  }
  return { status, headers }
}

/*
 * The remote served over http on 127.0.0.1 by git's own http-backend: the git pane speaks only
 * hosted transports and refuses a folder (main/git/sync.ts), so the demo remote is reached the
 * way a hosted one is, and nothing leaves this machine. Pushes are taken as from user "demo".
 */
function serveRemote() {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    const header = (name, cgi) =>
      req.headers[name] === undefined ? {} : { [cgi]: req.headers[name] }
    const backend = spawn('git', ['http-backend'], {
      env: {
        ...GIT_ENV,
        GIT_PROJECT_ROOT: path.dirname(REMOTE),
        GIT_HTTP_EXPORT_ALL: '1',
        REMOTE_USER: 'demo',
        REMOTE_ADDR: '127.0.0.1',
        REQUEST_METHOD: req.method ?? 'GET',
        PATH_INFO: decodeURIComponent(url.pathname),
        QUERY_STRING: url.search.slice(1),
        ...header('content-type', 'CONTENT_TYPE'),
        ...header('content-length', 'CONTENT_LENGTH'),
        ...header('content-encoding', 'HTTP_CONTENT_ENCODING'),
        ...header('git-protocol', 'GIT_PROTOCOL'),
      },
    })
    req.pipe(backend.stdin)
    let head = Buffer.alloc(0)
    let started = false
    backend.stdout.on('data', (chunk) => {
      if (started) {
        res.write(chunk)
        return
      }
      head = Buffer.concat([head, chunk])
      const end = head.indexOf('\r\n\r\n')
      if (end < 0) return
      const { status, headers } = cgiHead(head.subarray(0, end).toString())
      res.writeHead(status, headers)
      started = true
      res.write(head.subarray(end + 4))
    })
    backend.stdout.on('end', () => res.end())
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

/**
 * A bare remote of the demo checkout as it was, served over http and tracked, and a commit made
 * since. Resolves to the server, to be closed when the take or the shot is done.
 */
export async function remoteBehind() {
  rmSync(REMOTE, { recursive: true, force: true })
  execFileSync('git', ['clone', '-q', '--bare', PROJECT, REMOTE], {
    cwd: HOME,
    env: GIT_ENV,
    stdio: 'ignore',
  })
  const server = await serveRemote()
  const url = `http://127.0.0.1:${server.address().port}/${path.basename(REMOTE)}`
  git(['remote', 'add', 'origin', url])
  // What a fetch would say, written by hand: the remote is where the clone was taken. A fetch run
  // synchronously here would wait on a server this very thread has to answer.
  git(['update-ref', 'refs/remotes/origin/main', 'HEAD'])
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
  return server
}

export const REPO_ID = '0e1ec0de0e1ec0de'
export const SESSION = '5e551011-0000-4000-8000-00000000a9e1'
export const OTHER = '5e551011-0000-4000-8000-00000000b7c2'

/** Where Claude Code keeps a folder's records: its path with everything but letters and digits a `-`. */
export const projectFolder = (claude, cwd) =>
  path.join(claude, 'projects', cwd.replace(/[^A-Za-z0-9]/g, '-'))

/** Claude Code's notice that a background task ended, as it queues it for the session. */
export const taskNotice = ({ task, call = task, status = 'completed', summary, at = new Date() }) =>
  JSON.stringify({
    type: 'queue-operation',
    operation: 'enqueue',
    timestamp: at.toISOString(),
    content: `<task-notification>\n<task-id>${task}</task-id>\n<tool-use-id>${call}</tool-use-id>\n<status>${status}</status>\n${summary === undefined ? '' : `<summary>${summary}</summary>\n`}</task-notification>`,
  })

export function claudeFolder() {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-demo-claude-'))
  const now = Date.now()
  const at = (minutesAgo) => new Date(now - minutesAgo * 60_000).toISOString()
  let n = 0
  const answer = (minutesAgo, content, extra = {}) =>
    JSON.stringify({
      type: 'assistant',
      timestamp: at(minutesAgo),
      message: {
        id: `msg_demo_${n++}`,
        model: 'claude-opus-5-5',
        role: 'assistant',
        stop_reason: extra.stop ?? 'tool_use',
        usage: {
          input_tokens: 4,
          cache_read_input_tokens: extra.context ?? 84_000,
          cache_creation_input_tokens: 1200,
          output_tokens: extra.output ?? 420,
        },
        content,
      },
    })
  const tool = (id, name, input) => ({ type: 'tool_use', id, name, input })
  const file = (name) => path.join(PROJECT, name)
  const write = (target, lines) => {
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, `${lines.join('\n')}\n`)
  }

  mkdirSync(path.join(dir, 'sessions'))
  const session = (pid, sessionId, cwd, name, status, startedMinutesAgo) =>
    writeFileSync(
      path.join(dir, 'sessions', `${pid}.json`),
      JSON.stringify({
        pid,
        sessionId,
        cwd,
        name,
        status,
        startedAt: now - startedMinutesAgo * 60_000,
        updatedAt: now - 60_000,
      }),
    )
  session(process.pid, SESSION, PROJECT, 'Say whether a pass can be seen', 'busy', 38)
  const WEATHER = `${HOME}\\projects\\weather-kit`
  session(process.ppid, OTHER, WEATHER, 'Tidy the forecast settings', 'waiting', 95)

  // The copy of passes.ts Claude Code keeps from before the session first changed it.
  write(
    path.join(dir, 'file-history', SESSION, '9a1f03c2b4d5e6f7@v1'),
    DEMO_FILES['src/orbit/passes.ts'],
  )
  write(path.join(projectFolder(dir, PROJECT), `${SESSION}.jsonl`), [
    JSON.stringify({ type: 'custom-title', customTitle: 'Say whether a pass can be seen' }),
    answer(36, [tool('t1', 'Read', { file_path: file('src\\orbit\\passes.ts') })]),
    answer(31, [tool('t3', 'Grep', { pattern: 'nextPass' })]),
    JSON.stringify({
      type: 'file-history-snapshot',
      snapshot: {
        trackedFileBackups: {
          'src\\orbit\\passes.ts': { backupFileName: '9a1f03c2b4d5e6f7@v1', version: 1 },
          'src\\orbit\\shadow.ts': { backupFileName: null, version: 1 },
        },
      },
    }),
    answer(28, [tool('t4', 'Edit', { file_path: file('src\\orbit\\passes.ts') })]),
    answer(22, [tool('t5', 'Write', { file_path: file('src\\orbit\\shadow.ts') })]),
    answer(12, [
      tool('t6', 'Agent', {
        description: 'Check the shadow maths',
        subagent_type: 'general-purpose',
        prompt: 'Check.',
      }),
    ]),
    answer(9, [
      tool('t7', 'Bash', {
        command: 'npm test',
        description: 'Run the orbit tests',
        run_in_background: true,
      }),
    ]),
    answer(6, [
      tool('t2', 'Agent', {
        description: 'Find where passes are drawn',
        subagent_type: 'Explore',
        prompt: 'Look.',
      }),
    ]),
    answer(1, [tool('t8', 'Edit', { file_path: file('src\\orbit\\passes.ts') })], {
      context: 91_500,
      output: 610,
    }),
  ])
  // The subagent still at work, with its own record, and the one the session waited for, done.
  const subagents = path.join(projectFolder(dir, PROJECT), SESSION, 'subagents')
  write(path.join(subagents, 'agent-a1d2.meta.json'), [
    JSON.stringify({ agentType: 'Explore', toolUseId: 't2', requestShape: 'foreground' }),
  ])
  write(path.join(subagents, 'agent-a1d2.jsonl'), [
    answer(5, [tool('u1', 'Grep', { pattern: 'drawPass' })]),
    answer(3, [{ type: 'text', text: 'Passes are drawn in PassList.' }], { stop: 'end_turn' }),
  ])
  write(path.join(subagents, 'agent-b3e4.meta.json'), [
    JSON.stringify({ agentType: 'general-purpose', toolUseId: 't6', requestShape: 'background' }),
  ])
  write(path.join(subagents, 'agent-b3e4.jsonl'), [
    answer(11, [tool('v1', 'Read', { file_path: file('src\\orbit\\shadow.ts') })]),
    answer(7, [tool('v2', 'WebFetch', { url: 'https://celestrak.org/columns/v03n01/' })]),
    // It starts a subagent of its own (Claude Code 2.1.299), which hangs under it.
    answer(5, [
      tool('v4', 'Agent', {
        description: 'Gather the reference eclipse times',
        subagent_type: 'Explore',
        run_in_background: true,
        prompt: 'Look.',
      }),
    ]),
    JSON.stringify({
      type: 'user',
      timestamp: new Date(now - 5 * 60_000 + 1000).toISOString(),
      message: {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'v4',
            content: 'Async agent launched successfully.\nagentId: c5f6 (internal ID)',
          },
        ],
      },
    }),
    answer(2, [
      tool('v3', 'Bash', { description: 'Compare the shadow entry with the reference times' }),
    ]),
  ])
  write(path.join(subagents, 'agent-c5f6.meta.json'), [
    JSON.stringify({
      agentType: 'Explore',
      toolUseId: 'v4',
      parentAgentId: 'b3e4',
      spawnDepth: 2,
      requestShape: 'background',
    }),
  ])
  write(path.join(subagents, 'agent-c5f6.jsonl'), [
    answer(4, [tool('x1', 'Glob', { pattern: 'fixtures/eclipse/*.json' })]),
    answer(1, [tool('x2', 'Read', { file_path: file('fixtures\\eclipse\\iss-2026-10.json') })]),
  ])

  write(path.join(projectFolder(dir, WEATHER), `${OTHER}.jsonl`), [
    answer(70, [tool('w1', 'Read', { file_path: `${WEATHER}\\src\\settings.ts` })], {
      context: 42_300,
    }),
    answer(66, [tool('w2', 'Edit', { file_path: `${WEATHER}\\src\\settings.ts` })], {
      context: 44_100,
    }),
    answer(64, [{ type: 'text', text: 'Shall I also move the units into their own section?' }], {
      stop: 'end_turn',
      context: 45_800,
    }),
  ])
  return dir
}

/** The demo checkout, known to the GIT pane by an id, as main's folder picker would have left it. */
export function gitRepos(dir) {
  writeFileSync(
    path.join(dir, 'git-repos.json'),
    JSON.stringify({
      version: 1,
      repos: [{ id: REPO_ID, path: PROJECT, name: 'elecdex', lastUsed: Date.now() }],
    }),
  )
}

/*
 * The orbital elements the ORBIT pane downloads from CelesTrak, kept between runs. Each run of
 * the screenshots or a demo starts a fresh profile, and a fresh profile asks CelesTrak again:
 * a morning of runs asked for the Starlink set many times over, against CelesTrak's policy
 * (once a day at most), and was refused. The pane's own files are copied into the profile before
 * the app starts and back out after it closes, so the app decides when to ask, as it would for
 * a person who never cleared their profile.
 */
export const ORBIT_CACHE = path.join(HOME, '.orbit-cache')
const ORBIT_FILES = ['orbits-stations.json', 'orbits-starlink.json']

export function seedOrbits(profile) {
  for (const name of ORBIT_FILES) {
    const kept = path.join(ORBIT_CACHE, name)
    if (existsSync(kept)) copyFileSync(kept, path.join(profile, name))
  }
}

export function keepOrbits(profile) {
  mkdirSync(ORBIT_CACHE, { recursive: true })
  for (const name of ORBIT_FILES) {
    const used = path.join(profile, name)
    if (existsSync(used)) copyFileSync(used, path.join(ORBIT_CACHE, name))
  }
}
