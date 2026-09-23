/**
 * The made-up world the README screenshots and the demos show (scripts/gen-screenshots.mjs,
 * scripts/demo-dev.mjs): a demo home under C:/Users/Public, a git repository of a made-up orbit
 * tracker by a made-up author, and a made-up Claude Code folder for the AI AGENT pane - so no
 * shot or recording carries this machine's paths, files, repositories or sessions.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
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
const GIT_ENV = {
  ...process.env,
  GIT_CONFIG_GLOBAL: path.join(mkdtempSync(path.join(tmpdir(), 'elecdex-git-')), 'config'),
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'elecdex demo',
  GIT_AUTHOR_EMAIL: 'demo@example.com',
  GIT_COMMITTER_NAME: 'elecdex demo',
  GIT_COMMITTER_EMAIL: 'demo@example.com',
}
writeFileSync(GIT_ENV.GIT_CONFIG_GLOBAL, '')
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

export const REPO_ID = '0e1ec0de0e1ec0de'
export const SESSION = '5e551011-0000-4000-8000-00000000a9e1'
export const OTHER = '5e551011-0000-4000-8000-00000000b7c2'

export function claudeFolder() {
  const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-demo-claude-'))
  const now = Date.now()
  const at = (minutesAgo) => new Date(now - minutesAgo * 60_000).toISOString()
  const folder = (cwd) => cwd.replace(/[^A-Za-z0-9]/g, '-')
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
  write(path.join(dir, 'projects', folder(PROJECT), `${SESSION}.jsonl`), [
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
  const subagents = path.join(dir, 'projects', folder(PROJECT), SESSION, 'subagents')
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
    answer(2, [
      tool('v3', 'Bash', { description: 'Compare the shadow entry with the reference times' }),
    ]),
  ])

  write(path.join(dir, 'projects', folder(WEATHER), `${OTHER}.jsonl`), [
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
