import type { CliCall, CliResult, RunCli } from '@shared/cloud-cli/probe'
import { DAY, HOUR, iso, result } from './stub-common.js'

/**
 * A stand-in gh for tests and screenshots (`ELECDEX_CLOUD_STUB`): never the real CLI, never the
 * network. Every answer is made up, in the shapes the real API gave (saved 2026-11-08). The mode
 * comes from the variable, or from `globalThis.__elecdexCloud.github` so an e2e spec can change it
 * while the app runs: demo (the default), signedout, nocli, offline, ratelow, finegrained.
 */

type Mode = 'demo' | 'signedout' | 'nocli' | 'offline' | 'ratelow' | 'finegrained'

const ME = 'octo-aki'

/** gh answers its text as it is; a failure ends with 1. */
const ok = (stdout: string): CliResult => result(true, stdout)
const fail = (stderr: string, stdout = ''): CliResult => result(false, stdout, stderr, 1)
const http = (status: number, body: unknown, headers: Record<string, string> = {}): string =>
  `HTTP/2.0 ${status} ${status === 200 ? 'OK' : status === 304 ? 'Not Modified' : 'Forbidden'}\r\n${Object.entries(
    headers,
  )
    .map(([k, v]) => `${k}: ${v}\r\n`)
    .join('')}\r\n${status === 304 ? '' : JSON.stringify(body)}`

const REPOS = [
  {
    name: 'octo-aki/tern',
    stars: 4823,
    forks: 311,
    issues: 42,
    pulls: 7,
    release: 'v0.9.2',
    pre: false,
    relAge: 6,
    dl: [9000, 9200],
    alerts: 1,
    enabled: true,
    priv: false,
  },
  {
    name: 'octo-aki/lumen-cli',
    stars: 1290,
    forks: 64,
    issues: 18,
    pulls: 3,
    release: 'v2.5.0-rc.1',
    pre: true,
    relAge: 1,
    dl: [3100],
    alerts: 0,
    enabled: true,
    priv: false,
    red: true,
  },
  {
    name: 'octo-aki/wasm-sketch',
    stars: 96,
    forks: 5,
    issues: 2,
    pulls: 0,
    release: 'v0.1.0',
    pre: false,
    relAge: 40,
    dl: [210],
    alerts: 0,
    enabled: false,
    priv: false,
  },
  {
    name: 'octo-aki/dotfiles',
    stars: 214,
    forks: 9,
    issues: 0,
    pulls: 0,
    release: null,
    pre: false,
    relAge: 0,
    dl: [],
    alerts: 0,
    enabled: false,
    priv: false,
  },
  {
    name: 'octo-aki/infra-notes',
    stars: 0,
    forks: 0,
    issues: 3,
    pulls: 1,
    release: null,
    pre: false,
    relAge: 0,
    dl: [],
    alerts: 0,
    enabled: true,
    priv: true,
  },
]

function repoNode(repo: (typeof REPOS)[number], now: number) {
  return {
    nameWithOwner: repo.name,
    isPrivate: repo.priv,
    isArchived: false,
    stargazerCount: repo.stars,
    forkCount: repo.forks,
    issues: { totalCount: repo.issues },
    pullRequests: { totalCount: repo.pulls },
    releases: {
      nodes:
        repo.release === null
          ? []
          : [
              {
                tagName: repo.release,
                isPrerelease: repo.pre,
                publishedAt: iso(now - repo.relAge * DAY),
                createdAt: iso(now - repo.relAge * DAY),
                url: `https://github.com/${repo.name}/releases/tag/${repo.release}`,
                releaseAssets: { nodes: repo.dl.map((downloadCount) => ({ downloadCount })) },
              },
            ],
    },
    hasVulnerabilityAlertsEnabled: repo.enabled,
    vulnerabilityAlerts: repo.enabled ? { totalCount: repo.alerts } : { totalCount: 0 },
    defaultBranchRef: { name: 'main' },
  }
}

const pr = (
  repo: string,
  number: number,
  title: string,
  by: string,
  ageMs: number,
  now: number,
  extra: Record<string, unknown> = {},
) => ({
  number,
  title,
  url: `https://github.com/${repo}/pull/${number}`,
  createdAt: iso(now - ageMs),
  updatedAt: iso(now - ageMs / 2),
  isDraft: false,
  additions: 120,
  deletions: 30,
  repository: { nameWithOwner: repo, isPrivate: false },
  author: { login: by },
  ...extra,
})

const rollup = (state: string | null) => ({
  commits: { nodes: [{ commit: { statusCheckRollup: state === null ? null : { state } } }] },
})

/** A made-up day of the contribution calendar: quieter weekends, a busier last quarter. */
function contribDay(w: number, d: number, now: number) {
  const seed = Math.sin((w * 7 + d) * 12.9898) * 43758.5453
  const r = seed - Math.floor(seed)
  const weekend = d === 0 || d === 6
  const count =
    r < 0.2 ? 0 : Math.round(r * (weekend ? 3 : 9) * (w > 40 ? 1.6 : 1)) + (w === 52 ? 1 : 0)
  return { date: iso(now - ((52 - w) * 7 + (6 - d)) * DAY).slice(0, 10), contributionCount: count }
}

function graphql(body: string, now: number): string {
  if (body.includes('query Queue')) {
    return JSON.stringify({
      data: {
        review: {
          nodes: [
            pr(
              'octo-aki/tern',
              412,
              'Add streaming parser for chunked frames',
              'rin-ws',
              35 * 60_000,
              now,
            ),
            pr(
              'starfield-org/starfield',
              1901,
              'docs: translate the guide into Korean',
              'jiho-k',
              4 * DAY,
              now,
              // A first contribution, so QUEUE's 1ST mark shows in the stand-in's queue.
              { authorAssociation: 'FIRST_TIME_CONTRIBUTOR' },
            ),
            pr(
              'starfield-org/starfield',
              1874,
              'Fix flaky snapshot test on macOS runners',
              'mvd',
              8 * DAY,
              now,
            ),
          ],
        },
        mine: {
          nodes: [
            pr(
              'starfield-org/starfield',
              1897,
              'Windows: long path support in the asset loader',
              ME,
              DAY,
              now,
              { reviewDecision: 'REVIEW_REQUIRED', mergeable: 'MERGEABLE', ...rollup('FAILURE') },
            ),
            pr('starfield-org/starfield', 1866, 'Renderer: batch glyph uploads', ME, 6 * DAY, now, {
              reviewDecision: 'CHANGES_REQUESTED',
              mergeable: 'CONFLICTING',
              ...rollup('SUCCESS'),
            }),
            pr(
              'octo-aki/lumen-cli',
              91,
              'Config: accept an empty file as defaults',
              ME,
              3 * HOUR,
              now,
              { reviewDecision: 'APPROVED', mergeable: 'MERGEABLE', ...rollup('SUCCESS') },
            ),
          ],
        },
        assigned: {
          nodes: [
            {
              number: 88,
              title: 'Crash on start with an empty config file',
              url: 'https://github.com/octo-aki/lumen-cli/issues/88',
              createdAt: iso(now - DAY),
              repository: { nameWithOwner: 'octo-aki/lumen-cli', isPrivate: false },
              author: { login: 'sora-t' },
            },
          ],
        },
        triage: {
          nodes: [
            {
              number: 413,
              title: 'Panic when the frame header is truncated',
              url: 'https://github.com/octo-aki/tern/issues/413',
              createdAt: iso(now - 3 * HOUR),
              repository: { nameWithOwner: 'octo-aki/tern', isPrivate: false },
              author: { login: 'q-lin' },
            },
            {
              number: 92,
              title: 'Feature: --json output for `lumen status`',
              url: 'https://github.com/octo-aki/lumen-cli/pull/92',
              createdAt: iso(now - 2 * DAY),
              repository: { nameWithOwner: 'octo-aki/lumen-cli', isPrivate: false },
              author: { login: 'emre' },
            },
          ],
        },
      },
    })
  }
  if (body.includes('query OwnRepos')) {
    return JSON.stringify({
      data: {
        viewer: { login: ME, repositories: { nodes: REPOS.map((repo) => repoNode(repo, now)) } },
      },
    })
  }
  if (body.includes('query PinnedRepos')) {
    const data: Record<string, unknown> = { viewer: { login: ME } }
    REPOS.forEach((repo, i) => {
      data[`r${i}`] = repoNode(repo, now)
    })
    return JSON.stringify({ data })
  }
  if (body.includes('query Contributions')) {
    const weeks = Array.from({ length: 53 }, (_, w) => ({
      contributionDays: Array.from({ length: 7 }, (_, d) => contribDay(w, d, now)),
    }))
    return JSON.stringify({
      data: {
        viewer: {
          contributionsCollection: { contributionCalendar: { totalContributions: 1495, weeks } },
        },
      },
    })
  }
  if (body.includes('query RepoPulls')) {
    return JSON.stringify({
      data: {
        repository: {
          pullRequests: {
            nodes: [
              pr(
                'octo-aki/tern',
                412,
                'Add streaming parser for chunked frames',
                'rin-ws',
                35 * 60_000,
                now,
                { mergeable: 'MERGEABLE', ...rollup('SUCCESS') },
              ),
              pr('octo-aki/tern', 410, 'Benchmarks for the frame decoder', ME, 20 * 60_000, now, {
                mergeable: 'UNKNOWN',
                ...rollup('PENDING'),
              }),
            ],
          },
          releases: {
            nodes: [repoNode(REPOS[0] as (typeof REPOS)[number], now).releases.nodes[0]],
          },
        },
      },
    })
  }
  if (body.includes('query Ahead')) return aheadAnswer(body)
  return JSON.stringify({ data: null })
}

/** Each alias of the Ahead query, by the repository it names: 38 commits for tern, 4 for the rest. */
function aheadAnswer(body: string): string {
  const query = (JSON.parse(body) as { query: string }).query
  const data: Record<string, unknown> = {}
  for (const [, alias, name] of query.matchAll(
    /(r\d+): repository\(owner: "[^"]+", name: "([^"]+)"\)/g,
  ))
    data[alias ?? ''] = { ref: { compare: { aheadBy: name === 'tern' ? 38 : 4 } } }
  return JSON.stringify({ data })
}

function run(
  id: number,
  name: string,
  branch: string,
  title: string,
  event: string,
  status: string,
  conclusion: string | null,
  ageMs: number,
  now: number,
  repo: string,
) {
  return {
    id,
    name,
    head_branch: branch,
    event,
    status,
    conclusion,
    display_title: title,
    run_started_at: iso(now - ageMs - 240_000),
    created_at: iso(now - ageMs - 240_000),
    updated_at: iso(now - ageMs),
    html_url: `https://github.com/${repo}/actions/runs/${id}`,
  }
}

function runsOf(repo: string, now: number) {
  if (repo === 'octo-aki/lumen-cli') {
    return [
      run(
        91003,
        'release',
        'main',
        'Bump version to 2.5.0-rc.1',
        'push',
        'completed',
        'failure',
        2 * HOUR,
        now,
        repo,
      ),
      run(
        91002,
        'release',
        'main',
        'Sign the Windows build',
        'push',
        'completed',
        'failure',
        5 * HOUR,
        now,
        repo,
      ),
      run(
        91001,
        'ci',
        'main',
        'Config: accept an empty file',
        'push',
        'completed',
        'success',
        DAY,
        now,
        repo,
      ),
    ]
  }
  if (repo === 'octo-aki/tern') {
    return [
      run(
        81004,
        'ci',
        'bench-decoder',
        'Benchmarks for the frame decoder',
        'pull_request',
        'in_progress',
        null,
        60_000,
        now,
        repo,
      ),
      run(
        81003,
        'ci',
        'fix-typo',
        'Fix typo in README',
        'pull_request',
        'action_required',
        null,
        4 * DAY,
        now,
        repo,
      ),
      run(
        81002,
        'ci',
        'main',
        'Parse trailers after the last chunk',
        'push',
        'completed',
        'success',
        3 * HOUR,
        now,
        repo,
      ),
      run(
        81001,
        'nightly',
        'main',
        'scheduled',
        'schedule',
        'completed',
        'cancelled',
        DAY,
        now,
        repo,
      ),
    ]
  }
  return [run(71001, 'ci', 'main', 'docs', 'push', 'completed', 'success', 2 * DAY, now, repo)]
}

function eventsOf(repo: string, now: number) {
  const e = (type: string, login: string, ageMs: number, action?: string) => ({
    type,
    actor: { login },
    created_at: iso(now - ageMs),
    payload: action === undefined ? {} : { action },
  })
  if (repo === 'octo-aki/tern')
    return [
      e('WatchEvent', 'a', 10 * 60_000),
      e('WatchEvent', 'b', 20 * 60_000),
      e('IssuesEvent', 'q-lin', 30 * 60_000, 'opened'),
      e('PullRequestEvent', 'rin-ws', 40 * 60_000, 'opened'),
      e('ForkEvent', 'c', 50 * 60_000),
    ]
  if (repo === 'octo-aki/lumen-cli')
    return [
      e('ReleaseEvent', ME, 2 * HOUR, 'published'),
      e('PushEvent', ME, 2 * HOUR),
      e('WatchEvent', 'd', HOUR),
    ]
  return []
}

export function stubGithub(initial: string): RunCli {
  const modeNow = (): Mode => {
    const live = (globalThis as { __elecdexCloud?: { github?: string } }).__elecdexCloud?.github
    const value = live ?? initial
    return (
      (['demo', 'signedout', 'nocli', 'offline', 'ratelow', 'finegrained'] as const).find(
        (m) => m === value,
      ) ?? 'demo'
    )
  }
  return async (call: CliCall) => {
    const mode = modeNow()
    const now = Date.now()
    const gated = modeAnswer(mode, call)
    if (gated !== null) return gated
    if (call.argv[1] === 'graphql') return ok(graphql(call.stdin ?? '', now))
    const path = call.argv.find((part) => /^(rate_limit|notifications|repos\/)/.test(part)) ?? ''
    const conditional = call.argv.some((part) => /^If-(None-Match|Modified-Since):/.test(part))
    if (path === 'rate_limit') return rateAnswer(mode === 'ratelow', now)
    if (path.startsWith('notifications')) return notificationsAnswer(mode, conditional, now)
    return repoAnswer(path, conditional, now)
  }
}

/** What a mode answers before any route: no CLI, no network, or signed out (auth still answers). */
function modeAnswer(mode: Mode, call: CliCall): CliResult | null {
  if (mode === 'nocli') return { ...fail(''), missing: true }
  if (mode === 'offline')
    return fail(
      'error connecting to api.github.com\ncheck your internet connection or https://githubstatus.com',
    )
  if (call.argv[0] === 'auth') return authAnswer(mode)
  if (mode === 'signedout') return fail('gh: Bad credentials (HTTP 401)')
  return null
}

function authAnswer(mode: Mode): CliResult {
  const json = JSON.stringify({
    hosts: {
      'github.com': [
        {
          state: mode === 'signedout' ? 'failure' : 'success',
          active: true,
          login: ME,
          scopes: mode === 'finegrained' ? '' : 'gist, read:org, repo, workflow',
          tokenSource: 'keyring',
        },
      ],
    },
  })
  return mode === 'signedout' ? fail('The token in keyring is invalid.', json) : ok(json)
}

function rateAnswer(low: boolean, now: number): CliResult {
  const reset = Math.floor((now + HOUR) / 1000)
  return ok(
    JSON.stringify({
      resources: {
        core: { limit: 5000, remaining: low ? 412 : 4812, reset },
        graphql: { limit: 5000, remaining: low ? 380 : 4950, reset },
      },
    }),
  )
}

type NotificationRow = [string, string, string, number | null, string, string, number, boolean?]

const NOTIFICATIONS: NotificationRow[] = [
  [
    '1',
    'PullRequest',
    'octo-aki/tern',
    412,
    'Add streaming parser for chunked frames',
    'review_requested',
    35 * 60_000,
  ],
  [
    '2',
    'Issue',
    'starfield-org/starfield',
    1893,
    '@octo-aki could you check the Windows path handling here?',
    'mention',
    HOUR,
  ],
  [
    '3',
    'CheckSuite',
    'octo-aki/lumen-cli',
    null,
    'Run failed: release · main',
    'ci_activity',
    2 * HOUR,
  ],
  [
    '4',
    'RepositoryDependabotAlertsThread',
    'octo-aki/tern',
    null,
    'Dependabot alert: high severity in serde-json < 1.0.140',
    'security_alert',
    5 * HOUR,
  ],
  [
    '5',
    'Issue',
    'octo-aki/lumen-cli',
    88,
    'Crash on start with an empty config file',
    'assign',
    DAY,
  ],
  ['6', 'Release', 'starfield-org/starfield', null, 'Release v3.2.0', 'subscribed', DAY, false],
]

function notificationsAnswer(mode: Mode, conditional: boolean, now: number): CliResult {
  if (mode === 'finegrained')
    return fail(
      'gh: Resource not accessible by personal access token (HTTP 403)',
      http(403, { message: 'Resource not accessible by personal access token' }),
    )
  if (conditional) return fail('', http(304, null, { 'X-Poll-Interval': '60' }))
  const list = NOTIFICATIONS.map(
    ([id, type, repo, number, title, reason, ageMs, unread = true]) => ({
      id,
      unread,
      reason,
      updated_at: iso(now - ageMs),
      subject: {
        title,
        url:
          number === null
            ? null
            : `https://api.github.com/repos/${repo}/${type === 'PullRequest' ? 'pulls' : 'issues'}/${number}`,
        type,
      },
      repository: { full_name: repo, private: false },
    }),
  )
  return ok(
    http(200, list, {
      'X-Poll-Interval': '60',
      'Last-Modified': new Date(now - 60_000).toUTCString(),
    }),
  )
}

const TERN_VIEWS = [212, 240, 198, 260, 305, 288, 190, 170, 260, 330, 410, 380, 295, 312]

/** The per-repository REST answers, by what the path ends in. */
const REPO_ROUTES: [string, (repo: string, conditional: boolean, now: number) => CliResult][] = [
  [
    '/events',
    (repo, conditional, now) =>
      conditional
        ? fail('', http(304, null))
        : ok(http(200, eventsOf(repo, now), { ETag: `W/"e-${repo}"` })),
  ],
  [
    '/actions/runs',
    (repo, conditional, now) =>
      conditional
        ? fail('', http(304, null))
        : ok(
            http(
              200,
              { total_count: 3, workflow_runs: runsOf(repo, now) },
              { ETag: `W/"r-${repo}"` },
            ),
          ),
  ],
  [
    '/traffic/views',
    (repo, conditional, now) => {
      if (repo !== 'octo-aki/tern')
        return fail(
          'gh: Must have push access to repository (HTTP 403)',
          http(403, { message: 'Must have push access to repository' }),
        )
      if (conditional) return fail('', http(304, null))
      const views = TERN_VIEWS.map((count, i) => ({
        timestamp: iso(now - (13 - i) * DAY),
        count,
        uniques: Math.round(count / 4),
      }))
      return ok(http(200, { count: 3850, uniques: 940, views }, { ETag: `W/"t-${repo}"` }))
    },
  ],
  [
    '/security-advisories',
    (repo, conditional) =>
      conditional
        ? fail('', http(304, null))
        : ok(
            http(200, repo === 'octo-aki/tern' ? [{ ghsa_id: 'GHSA-xxxx' }] : [], {
              ETag: `W/"a-${repo}"`,
            }),
          ),
  ],
]

function repoAnswer(path: string, conditional: boolean, now: number): CliResult {
  const repo = /^repos\/([^/]+\/[^/]+)\//.exec(path)?.[1] ?? ''
  const route = REPO_ROUTES.find(([part]) => path.includes(part))
  return route === undefined ? fail('gh: Not Found (HTTP 404)') : route[1](repo, conditional, now)
}
