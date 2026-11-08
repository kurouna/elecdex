import { describe, expect, it } from 'vitest'
import { concurrencyLimit, isPartialAnswer } from '../../src/main/cloud-cli/scheduler'
import { stubGithub } from '../../src/main/cloud-cli/stub-github'
import { contribOf, GithubService } from '../../src/main/github/service'
import type { CliCall, CliResult } from '../../src/shared/cloud-cli/probe'
import { boardKey, parseBoardKey, readGithubPane } from '../../src/shared/github/board'
import {
  buildQueue,
  htmlUrlOf,
  prVerdict,
  type QueueInput,
  repoName,
  starDelta,
  streaks,
  waitingTag,
} from '../../src/shared/github/derive'
import { type Pull, subjectNumber } from '../../src/shared/github/parse'
import { ALL_QUERIES } from '../../src/shared/github/queries'
import type { GithubBoard } from '../../src/shared/github/types'

/** GITHUB STATUS (docs/github.md): what main derives, and the board it builds on the stand-in gh. */

const DAY = 86_400_000
const NOW = Date.UTC(2026, 10, 8, 3)
const ANSWER = {
  ok: false,
  code: 1,
  stdout: '',
  stderr: '',
  missing: false,
  timedOut: false,
  tooLarge: false,
}

const pull = (over: Partial<Pull> = {}): Pull => ({
  number: 7,
  title: 'A change',
  url: 'https://github.com/octo/tern/pull/7',
  createdAt: new Date(NOW - DAY).toISOString(),
  repository: { nameWithOwner: 'octo/tern', isPrivate: false },
  author: { login: 'someone' },
  ...over,
})

const rollup = (state: string): Pull['commits'] => ({
  nodes: [{ commit: { statusCheckRollup: { state } } }],
})

describe('prVerdict', () => {
  it('is the worst of the checks, a conflict and the review, then the milder states', () => {
    expect(prVerdict(pull({ commits: rollup('FAILURE'), mergeable: 'CONFLICTING' })).tag).toBe(
      'Failing',
    )
    expect(
      prVerdict(pull({ mergeable: 'CONFLICTING', reviewDecision: 'CHANGES_REQUESTED' })).tag,
    ).toBe('Conflict')
    expect(prVerdict(pull({ reviewDecision: 'CHANGES_REQUESTED', isDraft: true })).tag).toBe(
      'Changes',
    )
    expect(prVerdict(pull({ isDraft: true, commits: rollup('PENDING') })).tag).toBe('Draft')
    expect(prVerdict(pull({ commits: rollup('PENDING') })).tag).toBe('Pending')
    // Mergeability is worked out on the first question: UNKNOWN is pending, not waiting.
    expect(prVerdict(pull({ mergeable: 'UNKNOWN', reviewDecision: 'APPROVED' })).tag).toBe(
      'Pending',
    )
    expect(prVerdict(pull({ commits: rollup('SUCCESS'), reviewDecision: 'APPROVED' }))).toEqual({
      tag: 'Approved',
      weight: 'quiet',
      ci: 'success',
    })
    expect(prVerdict(pull()).tag).toBe('Waiting')
  })
})

describe('waitingTag', () => {
  it('warns after three days and is danger after seven', () => {
    expect(waitingTag(NOW - 2 * DAY, NOW)).toEqual({ tag: 'Review', weight: 'info' })
    expect(waitingTag(NOW - 3 * DAY, NOW)).toEqual({ tag: 'Waiting 3d', weight: 'warn' })
    expect(waitingTag(NOW - 8 * DAY, NOW)).toEqual({ tag: 'Waiting 8d', weight: 'danger' })
  })
})

describe('repoName and htmlUrlOf', () => {
  it('takes owner/name only, never . or ..', () => {
    expect(repoName('octo/tern')).toBe('octo/tern')
    for (const bad of ['../etc', 'octo/..', './x', 'a/b/c', 'a', '', 'a b/c', 123, null])
      expect(repoName(bad)).toBeNull()
  })

  it('opens github.com pages of the shapes the pane links to, and nothing else', () => {
    expect(htmlUrlOf('https://api.github.com/repos/octo/tern/pulls/412')).toBe(
      'https://github.com/octo/tern/pull/412',
    )
    expect(htmlUrlOf('https://api.github.com/repos/octo/tern/issues/9')).toBe(
      'https://github.com/octo/tern/issues/9',
    )
    // A Discussion's notification opens the discussion, with its number.
    expect(htmlUrlOf('https://api.github.com/repos/octo/tern/discussions/5')).toBe(
      'https://github.com/octo/tern/discussions/5',
    )
    expect(subjectNumber('https://api.github.com/repos/octo/tern/discussions/5')).toBe(5)
    for (const ok of [
      'https://github.com/octo/tern',
      'https://github.com/octo/tern/pull/1',
      'https://github.com/octo/tern/actions/runs/123',
      'https://github.com/octo/tern/releases/tag/v1.0.0',
      // A tag with a slash (changesets' scoped tags) once failed the check and opened nothing.
      'https://github.com/octo/tern/releases/tag/%40octo/cli%402.27.1',
      'https://github.com/octo/tern/security/advisories',
      'https://www.githubstatus.com/incidents/abc123def',
    ])
      expect(htmlUrlOf(ok)).toBe(ok)
    for (const bad of [
      'http://github.com/octo/tern',
      'https://github.com.evil.example/octo/tern',
      'https://user:pw@github.com/octo/tern',
      'https://github.com:8443/octo/tern',
      'https://github.com/octo/tern/archive/main.zip',
      'https://api.github.com/repos/octo/tern/actions/runs/1',
      'https://gist.github.com/octo/abc',
      'file:///C:/Windows/system32/calc.exe',
      'javascript:alert(1)',
      'not a url',
    ])
      expect(htmlUrlOf(bad)).toBeNull()
  })
})

describe('board keys', () => {
  it('has one canonical spelling per spec, and refuses every other', () => {
    const key = boardKey({ repos: ['octo/tern', 'octo/tern', '../x', 'octo/lumen'], inbox: 'all' })
    expect(key).toBe('{"repos":["octo/tern","octo/lumen"],"inbox":"all"}')
    expect(parseBoardKey(key)).toEqual({ repos: ['octo/tern', 'octo/lumen'], inbox: 'all' })
    expect(boardKey({ repos: [], inbox: 'participating' })).toBe(
      '{"repos":"auto","inbox":"participating"}',
    )
    for (const bad of [
      '{"inbox":"all","repos":"auto"}',
      '{"repos":"auto"}',
      '{"repos":["../x"],"inbox":"all"}',
      '{"repos":[],"inbox":"all"}',
      '{"repos":"auto","inbox":"all","host":"ghe.example.com"}',
      'x',
      123,
      'x'.repeat(3000),
    ])
      expect(parseBoardKey(bad)).toBeNull()
  })

  it('reads the pane state with its defaults', () => {
    expect(readGithubPane(undefined)).toEqual({
      spec: { repos: 'auto', inbox: 'all' },
      // REPOS is the tab a pane opens on (the user's decision 2026-11-08).
      tab: 'repos',
      mask: false,
      band: true,
      drill: null,
    })
    expect(
      readGithubPane({
        repos: ['octo/tern', '..'],
        tab: 'queue',
        mask: true,
        band: false,
        drill: '../x',
      }),
    ).toMatchObject({
      spec: { repos: ['octo/tern'] },
      tab: 'queue',
      mask: true,
      band: false,
      drill: null,
    })
  })
})

describe('buildQueue', () => {
  const input = (over: Partial<QueueInput> = {}): QueueInput => ({
    review: [],
    mine: [],
    assigned: [],
    triage: [],
    notifications: [],
    red: [],
    approvals: [],
    advisories: [],
    me: 'octo',
    now: NOW,
    ...over,
  })

  it('shows the same thing once, in its heavier place, heaviest and oldest first', () => {
    const review = pull({
      number: 1,
      url: 'https://github.com/octo/tern/pull/1',
      createdAt: new Date(NOW - 8 * DAY).toISOString(),
    })
    const { items, urls } = buildQueue(
      input({
        review: [review, pull({ number: 2, url: 'https://github.com/octo/tern/pull/2' })],
        notifications: [
          {
            id: 'n1',
            unread: true,
            reason: 'mention',
            updated_at: new Date(NOW).toISOString(),
            subject: {
              title: 'A change',
              url: 'https://api.github.com/repos/octo/tern/pulls/1',
              type: 'PullRequest',
            },
            repository: { full_name: 'octo/tern', private: false },
          },
        ],
        red: [
          {
            repo: 'octo/tern',
            workflow: 'CI',
            failures: 3,
            at: NOW - DAY,
            url: 'https://github.com/octo/tern/actions/runs/5',
            private: false,
          },
        ],
        triage: [
          {
            number: 9,
            title: 'An issue',
            url: 'https://github.com/octo/tern/issues/9',
            createdAt: new Date(NOW - DAY).toISOString(),
            repository: { nameWithOwner: 'octo/tern', isPrivate: false },
            author: { login: 'x' },
          },
        ],
      }),
    )
    // Both danger: the review waiting eight days is older than the red branch.
    expect(items.map((item) => item.id)).toEqual([
      'pr:octo/tern#1',
      'red:octo/tern',
      'pr:octo/tern#2',
      'triage:octo/tern#9',
    ])
    expect(items[1]?.title).toBe('CI failed on the default branch 3 times in a row')
    expect(items[0]).toMatchObject({ weight: 'danger', tag: 'Waiting 8d' })
    expect(urls.get('pr:octo/tern#1')).toBe('https://github.com/octo/tern/pull/1')
  })

  it('opens no URL it does not accept', () => {
    const { items, urls } = buildQueue(
      input({ review: [pull({ url: 'https://evil.example/octo/tern/pull/7' })] }),
    )
    expect(items).toHaveLength(1)
    expect(urls.size).toBe(0)
  })

  it("puts the user's own failing PR up, and leaves a waiting one out", () => {
    const { items } = buildQueue(
      input({
        mine: [
          pull({ number: 3, commits: rollup('FAILURE') }),
          pull({ number: 4, commits: rollup('SUCCESS') }),
        ],
      }),
    )
    expect(items.map((item) => [item.id, item.tag])).toEqual([['pr:octo/tern#3', 'Failing']])
  })
})

describe('streaks', () => {
  it('counts the run up to today, a quiet today not breaking it, and the best run', () => {
    expect(streaks([1, 1, 0, 2, 3, 1, 0])).toEqual({ streak: 3, best: 3 })
    expect(streaks([1, 1, 1, 1, 0, 1, 1])).toEqual({ streak: 2, best: 4 })
    expect(streaks([])).toEqual({ streak: 0, best: 0 })
  })
})

/** The service on the stand-in gh, on a clock that moves only when the test says. */
function service(mode = 'demo') {
  const now = NOW
  const calls: CliCall[] = []
  const boards: GithubBoard[] = []
  const stub = stubGithub(mode)
  const github = new GithubService({
    cli: (call) => {
      calls.push(call)
      return stub(call)
    },
    limit: concurrencyLimit(2),
    stars: { note: () => {}, history: () => ({}) },
    now: () => now,
    setTimer: () => 0,
    clearTimer: () => {},
    publish: (board) => boards.push(board),
    incidents: () => [],
    ghVersion: () => '2.83.0',
    executable: () => 'stub',
  })
  const flush = async () => {
    for (let i = 0; i < 400; i++) await Promise.resolve()
  }
  return { github, calls, boards, flush, last: () => boards.at(-1) }
}

const AUTO = boardKey({ repos: 'auto', inbox: 'all' })

describe('GithubService on the stand-in gh', () => {
  it('reads a whole board at once when shown, the per-repository readings included', async () => {
    const s = service()
    expect(s.github.watch(AUTO)?.link).toBe('linking')
    await s.flush()
    const board = s.last()
    expect(board?.link).toBe('linked')
    expect(board?.login).toBe('octo-aki')
    expect(board?.repos.length).toBeGreaterThan(0)
    // The runs and the red default branch are read on the first showing, not five minutes on.
    expect(board?.repos.find((tile) => tile.name === 'octo-aki/lumen-cli')?.red).toBe(true)
    expect(board?.queue.some((item) => item.id === 'red:octo-aki/lumen-cli')).toBe(true)
    expect(board?.events.length).toBeGreaterThan(0)
    expect(s.github.watching()).toEqual([`board:${AUTO}`])
    s.github.unwatch(AUTO)
    expect(s.github.watching()).toEqual([])
  })

  it('runs gh only to read: REST with -X GET, GraphQL queries, and auth status', async () => {
    const s = service()
    s.github.watch(AUTO)
    await s.flush()
    await s.github.detail(AUTO, 'octo-aki/tern')
    expect(s.calls.length).toBeGreaterThan(10)
    for (const call of s.calls) {
      expect(call.tool).toBe('gh')
      const [verb, ...rest] = call.argv
      if (verb === 'auth') {
        expect(rest).toEqual(['status', '--json', 'hosts'])
        continue
      }
      expect(verb).toBe('api')
      if (rest[0] === 'graphql') {
        expect(rest).toEqual(['graphql', '--input', '-'])
        const body = JSON.parse(call.stdin ?? '') as { query: string }
        expect(body.query.trimStart()).toMatch(/^query\b/)
        expect(body.query).not.toMatch(/\bmutation\b|\bsubscription\b/)
        continue
      }
      // -f would turn a call into POST: every REST call says GET itself.
      expect(rest).toContain('-X')
      expect(rest[rest.indexOf('-X') + 1]).toBe('GET')
      expect(rest.some((part) => /^-(f|F|-field|-raw-field|-input)$/.test(part))).toBe(false)
    }
    for (const query of ALL_QUERIES) expect(query.trimStart()).toMatch(/^query\b/)
  })

  it('opens only what the board showed', async () => {
    const s = service()
    s.github.watch(AUTO)
    await s.flush()
    const id = s.last()?.queue[0]?.id ?? ''
    expect(s.github.urlOf(AUTO, id)).toMatch(/^https:\/\/github\.com\//)
    expect(s.github.urlOf(AUTO, 'repo:someone/else')).toBeNull()
    expect(s.github.urlOf('{"repos":"auto","inbox":"participating"}', id)).toBeNull()
    expect(await s.github.detail(AUTO, 'someone/else')).toBeNull()
  })

  it('refreshes at most once in 30 s', async () => {
    const s = service()
    s.github.watch(AUTO)
    await s.flush()
    expect(s.github.refresh(AUTO)).toBe(30_000)
    expect(s.github.refresh(AUTO)).toBe(30_000)
    expect(s.github.refresh('nope')).toBe(0)
  })

  it('stops at the sign-in, says the command, and shows no reading', async () => {
    const s = service('signedout')
    s.github.watch(AUTO)
    await s.flush()
    expect(s.last()).toMatchObject({ link: 'signed-out', signIn: 'gh auth login', problem: null })
    const before = s.calls.length
    await s.flush()
    expect(s.calls.length).toBe(before)
  })

  it('counts the commits since every release in one GraphQL query, and asks the rest conditionally', async () => {
    const s = service()
    s.github.watch(AUTO)
    await s.flush()
    // No REST compare: it answered the range's commits and diffs for one number, a call each.
    expect(s.calls.some((c) => c.argv.some((a) => a.includes('/compare/')))).toBe(false)
    expect(s.calls.filter((c) => (c.stdin ?? '').includes('query Ahead'))).toHaveLength(1)
    expect(s.last()?.repos.find((tile) => tile.name === 'octo-aki/tern')?.release?.ahead).toBe(38)
    // The advisories and the traffic carry their ETag the second time: a 304 is free.
    expect(s.github.refresh(AUTO)).toBe(30_000)
    await s.flush()
    for (const part of ['/security-advisories', '/traffic/views']) {
      const asked = s.calls.filter((c) => c.argv.some((a) => a.includes(`octo-aki/tern${part}`)))
      expect(asked.length, part).toBeGreaterThan(1)
      expect(
        asked.at(-1)?.argv.some((a) => a.startsWith('If-None-Match:')),
        part,
      ).toBe(true)
    }
    expect(s.last()?.repos.find((tile) => tile.name === 'octo-aki/tern')?.views14?.length).toBe(14)
    expect(s.last()?.queue.some((item) => item.id === 'advisory:octo-aki/tern')).toBe(true)
  })

  it('says NO CLI when gh is not there', async () => {
    const s = service('nocli')
    s.github.watch(AUTO)
    await s.flush()
    expect(s.last()?.link).toBe('no-cli')
  })

  it('reads the data of a GraphQL answer that carries errors too, and goes on with the rest', async () => {
    // A pinned repository deleted: GitHub answers 200 with data and errors, and gh exits 1.
    const stub = stubGithub('demo')
    const calls: CliCall[] = []
    let last: GithubBoard | undefined
    const github = new GithubService({
      cli: async (call) => {
        calls.push(call)
        const answer = await stub(call)
        if (!(call.stdin ?? '').includes('query PinnedRepos')) return answer
        const body = JSON.parse(answer.stdout) as { data: Record<string, unknown> }
        body.data.r1 = null
        return {
          ...answer,
          ok: false,
          code: 1,
          stdout: JSON.stringify({
            ...body,
            errors: [{ type: 'NOT_FOUND', path: ['r1'], message: 'Could not resolve' }],
          }),
          stderr: 'gh: Could not resolve to a Repository with the name octo-aki/gone.',
        }
      },
      limit: concurrencyLimit(2),
      stars: { note: () => {}, history: () => ({}) },
      now: () => NOW,
      setTimer: () => 0,
      clearTimer: () => {},
      publish: (board) => {
        last = board
      },
      incidents: () => [],
      ghVersion: () => '2.83.0',
      executable: () => 'stub',
    })
    const key = boardKey({ repos: ['octo-aki/tern', 'octo-aki/gone'], inbox: 'all' })
    github.watch(key)
    for (let i = 0; i < 400; i++) await Promise.resolve()
    expect(last?.link).toBe('linked')
    expect(last?.problem).toBeNull()
    expect(last?.repos.map((tile) => tile.name)).toEqual(['octo-aki/tern'])
    // The probes after the repositories went on.
    expect(calls.some((c) => (c.stdin ?? '').includes('query Queue'))).toBe(true)
    expect(calls.some((c) => c.argv.some((a) => a.includes('octo-aki/tern/actions/runs')))).toBe(
      true,
    )
    expect(isPartialAnswer(calls[0] as CliCall, { ...ANSWER, stdout: '{"data":null}' })).toBe(false)
  })

  it('says why the inbox is closed to a fine-grained token, and reads the rest', async () => {
    const s = service('finegrained')
    s.github.watch(AUTO)
    await s.flush()
    const board = s.last()
    expect(board?.inbox).toMatchObject({ readable: false, why: 'fine-grained' })
    expect(board?.repos.length).toBeGreaterThan(0)
  })
})

describe('stars and contributions', () => {
  it('has no 7-day change before a day before today was noted', () => {
    // The first look notes today's count before it is compared: 0, said as a change, was wrong.
    expect(starDelta({ '2026-11-08': 5 }, '2026-11-08', 7).delta).toBeNull()
    expect(starDelta({}, '2026-11-08', 7).delta).toBeNull()
    expect(starDelta({ '2026-11-06': 5, '2026-11-08': 6 }, '2026-11-08', 7)).toMatchObject({
      delta: 2,
      since: '2026-11-06',
    })
    expect(starDelta({ '2026-10-30': 3, '2026-11-08': 6 }, '2026-11-08', 7)).toMatchObject({
      delta: 4,
      since: null,
    })
  })

  it('counts a short calendar of this week and last week without counting a day twice', () => {
    expect(contribOf({ total: 5, days: [1, 1, 1, 1, 1] })).toMatchObject({ week: 5, lastWeek: 0 })
    const days = [...Array(7).fill(2), ...Array(7).fill(1)]
    expect(contribOf({ total: 21, days })).toMatchObject({ week: 7, lastWeek: 14 })
  })
})

describe("GithubService's drill-down", () => {
  /** The service on the stand-in gh, whose answers `change` may turn. */
  function changed(change: (call: CliCall, answer: CliResult) => CliResult) {
    const stub = stubGithub('demo')
    const calls: CliCall[] = []
    const github = new GithubService({
      cli: async (call) => {
        calls.push(call)
        return change(call, await stub(call))
      },
      limit: concurrencyLimit(2),
      stars: { note: () => {}, history: () => ({}) },
      now: () => NOW,
      setTimer: () => 0,
      clearTimer: () => {},
      publish: () => {},
      incidents: () => [],
      ghVersion: () => '2.83.0',
      executable: () => 'stub',
    })
    return { github, calls }
  }
  const flush = async () => {
    for (let i = 0; i < 400; i++) await Promise.resolve()
  }

  it("keeps no failed reading of a repository's inside, and REFRESH reads it again", async () => {
    let fail = true
    const s = changed((call, answer) =>
      fail && (call.stdin ?? '').includes('query RepoPulls')
        ? {
            ...answer,
            ok: false,
            code: 1,
            stdout: '',
            stderr: 'error connecting to api.github.com',
          }
        : answer,
    )
    s.github.watch(AUTO)
    await flush()
    expect((await s.github.detail(AUTO, 'octo-aki/tern'))?.pulls).toEqual([])
    fail = false
    // Within five minutes: the failure was not kept, so it is read again.
    expect((await s.github.detail(AUTO, 'octo-aki/tern'))?.pulls.length).toBeGreaterThan(0)
    const asked = s.calls.filter((c) => (c.stdin ?? '').includes('query RepoPulls')).length
    expect(s.github.refresh(AUTO)).toBe(30_000)
    await flush()
    await s.github.detail(AUTO, 'octo-aki/tern')
    expect(s.calls.filter((c) => (c.stdin ?? '').includes('query RepoPulls'))).toHaveLength(
      asked + 1,
    )
  })

  it('opens only github.com pages, whatever an answer said a run, a pull or a release is at', async () => {
    const s = changed((_call, answer) =>
      answer.ok
        ? {
            ...answer,
            stdout: answer.stdout.replaceAll('https://github.com/', 'https://evil.example/'),
          }
        : answer,
    )
    s.github.watch(AUTO)
    await flush()
    const detail = await s.github.detail(AUTO, 'octo-aki/tern')
    const ids = [
      ...(detail?.runs ?? []).map((run) => run.id),
      ...(detail?.pulls ?? []).map((pull) => pull.id),
      ...(detail?.releases ?? []).map((release) => release.id),
    ]
    expect(ids.length).toBeGreaterThan(3)
    for (const id of ids) expect(s.github.urlOf(AUTO, id), id).toBeNull()
  })
})
