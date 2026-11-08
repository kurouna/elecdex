import { describe, expect, it } from 'vitest'
import { concurrencyLimit } from '../../src/main/cloud-cli/scheduler'
import { stubGithub } from '../../src/main/cloud-cli/stub-github'
import { type GhContext, GITHUB_PROBES, waitAsked } from '../../src/main/github/probes'
import { GithubService } from '../../src/main/github/service'
import type { CliCall, CliResult } from '../../src/shared/cloud-cli/probe'
import { boardKey } from '../../src/shared/github/board'
import type { GithubBoard } from '../../src/shared/github/types'

/**
 * GITHUB STATUS and the user's rate limit (docs/github.md §3): the inbox no sooner than
 * X-Poll-Interval, every period four times as long while the limit runs low, a refusal for the
 * rate limit throttles and waits as GitHub says, and twelve repositories stay inside the budget.
 * On the stand-in gh and a clock that moves only when the test says.
 */

const T0 = Date.UTC(2026, 10, 8, 3)
const MIN = 60_000
const HOUR = 60 * MIN
const AUTO = boardKey({ repos: 'auto', inbox: 'all' })

/**
 * The service on a fake clock, with timers the test runs; `change` may turn any answer, and
 * `takes` says how long a call runs (the clock moves on by it as the call answers).
 */
function harness(
  mode = 'demo',
  change: (call: CliCall, answer: CliResult, now: number) => CliResult = (_c, a) => a,
  takes: (call: CliCall) => number = () => 0,
) {
  let clock = T0
  const calls: { at: number; call: CliCall }[] = []
  const boards: GithubBoard[] = []
  const timers: { at: number; fn: () => void; id: number }[] = []
  let next = 1
  const stub = stubGithub(mode)
  const github = new GithubService({
    cli: async (call) => {
      calls.push({ at: clock, call })
      const answer = change(call, await stub(call), clock)
      clock += takes(call)
      return answer
    },
    limit: concurrencyLimit(4),
    stars: { note: () => {}, history: () => ({}) },
    now: () => clock,
    setTimer: (fn, ms) => {
      const id = next++
      timers.push({ at: clock + ms, fn, id })
      return id
    },
    clearTimer: (handle) => {
      const i = timers.findIndex((t) => t.id === handle)
      if (i >= 0) timers.splice(i, 1)
    },
    publish: (board) => boards.push(board),
    incidents: () => [],
    ghVersion: () => '2.103.3',
    executable: () => 'stub',
  })
  const flush = async () => {
    for (let i = 0; i < 400; i++) await Promise.resolve()
  }
  /** Runs every timer due in the next `ms`, in order, letting each reading finish. */
  const advance = async (ms: number) => {
    const end = clock + ms
    for (;;) {
      timers.sort((a, b) => a.at - b.at)
      const due = timers[0]
      if (due === undefined || due.at > end) break
      timers.shift()
      clock = Math.max(clock, due.at)
      due.fn()
      await flush()
    }
    clock = end
  }
  const rest = (part: string, from = 0) =>
    calls.filter(
      ({ at, call }) =>
        at >= from && call.argv[1] !== 'graphql' && call.argv.some((a) => a.includes(part)),
    )
  /** Moves on 5 s at a time until a REST call to `part` is made (at most an hour). */
  const untilCalled = async (part: string) => {
    const before = rest(part).length
    for (let i = 0; i < 720 && rest(part).length === before; i++) await advance(5_000)
    return rest(part).at(-1)?.at ?? 0
  }
  return {
    github,
    calls,
    flush,
    advance,
    rest,
    untilCalled,
    boards,
    last: () => boards.at(-1),
    of: (key: string) => boards.filter((board) => board.key === key).at(-1),
    now: () => clock,
  }
}

/**
 * The user's own repositories (auto), `count()` of them named octo-aki/r0… as GitHub answers now;
 * `change` may turn any other answer.
 */
function own(
  count: () => number,
  change: (call: CliCall, answer: CliResult, now: number) => CliResult = (_c, a) => a,
) {
  return ownNamed(() => Array.from({ length: count() }, (_, i) => `octo-aki/r${i}`), null, change)
}

/**
 * The user's own repositories (auto) as GitHub answers now: `names()`, each private as
 * `isPrivate` says (null: as the stand-in's first one); `change` may turn any other answer.
 */
function ownNamed(
  names: () => string[],
  isPrivate: ((name: string) => boolean) | null,
  change: (call: CliCall, answer: CliResult, now: number) => CliResult = (_c, a) => a,
) {
  return harness('demo', (call, answer, now) => {
    if (!(call.stdin ?? '').includes('query OwnRepos')) return change(call, answer, now)
    const body = JSON.parse(answer.stdout) as {
      data: { viewer: { repositories: { nodes: Record<string, unknown>[] } } }
    }
    const node = body.data.viewer.repositories.nodes[0] ?? {}
    body.data.viewer.repositories.nodes = names().map((name) => ({
      ...node,
      nameWithOwner: name,
      isArchived: false,
      ...(isPrivate === null ? {} : { isPrivate: isPrivate(name) }),
    }))
    return { ...answer, stdout: JSON.stringify(body) }
  })
}

/** GitHub's 502, as gh prints it with `-i`. */
const badGateway = (answer: CliResult): CliResult => ({
  ...answer,
  ok: false,
  code: 1,
  stdout: 'HTTP/2.0 502 Bad Gateway\r\n\r\n{"message":"Server Error"}',
  stderr: 'gh: Server Error (HTTP 502)',
})

/** The REST calls that spend the rate limit (rate_limit and the sign-in do not), from `from`. */
const restSpent = (h: ReturnType<typeof harness>, from: number) =>
  h.calls.filter(
    ({ at, call }) =>
      at >= from &&
      call.argv[0] === 'api' &&
      call.argv[1] !== 'graphql' &&
      !call.argv.includes('rate_limit'),
  )

describe('the inbox', () => {
  it('is read no sooner than X-Poll-Interval asks, though its timer runs every minute', async () => {
    // The interval only fed "inbox next": the inbox was read every 60 s whatever GitHub asked.
    const h = harness('demo', (call, answer) =>
      call.argv.some((a) => a.startsWith('notifications'))
        ? {
            ...answer,
            stdout: answer.stdout.replace('X-Poll-Interval: 60', 'X-Poll-Interval: 180'),
          }
        : answer,
    )
    h.github.watch(AUTO)
    await h.flush()
    await h.advance(30 * MIN)
    const times = h.rest('notifications').map(({ at }) => at)
    expect(times.length).toBeGreaterThan(5)
    expect(times.length).toBeLessThanOrEqual(11)
    for (let i = 1; i < times.length; i++)
      expect((times[i] ?? 0) - (times[i - 1] ?? 0)).toBeGreaterThanOrEqual(175_000)
    const board = h.last()
    expect(board?.nextInboxAt).toBeGreaterThanOrEqual((times.at(-1) ?? 0) + 175_000)
  })

  it('is read every minute though each reading takes seconds', async () => {
    // The wait counted from the reading's end with 5 s to spare: a reading of over 5 s made the
    // next minute skip, and the inbox was read every 2 minutes while "inbox next" said one.
    const inbox = (call: CliCall) => call.argv.some((a) => a.startsWith('notifications'))
    const h = harness('demo', undefined, (call) => (inbox(call) ? 8_000 : 0))
    h.github.watch(AUTO)
    await h.flush()
    const from = h.now() + 1
    await h.advance(30 * MIN)
    const times = h.rest('notifications', from).map(({ at }) => at)
    expect(times.length).toBeGreaterThanOrEqual(29)
    for (let i = 1; i < times.length; i++) expect((times[i] ?? 0) - (times[i - 1] ?? 0)).toBe(MIN)
  })

  it('reads an interval of 90 s every other minute, and says so', async () => {
    const h = harness('demo', (call, answer) =>
      call.argv.some((a) => a.startsWith('notifications'))
        ? {
            ...answer,
            stdout: answer.stdout.replace('X-Poll-Interval: 60', 'X-Poll-Interval: 90'),
          }
        : answer,
    )
    h.github.watch(AUTO)
    await h.flush()
    await h.advance(20 * MIN)
    const times = h.rest('notifications').map(({ at }) => at)
    for (let i = 1; i < times.length; i++)
      expect((times[i] ?? 0) - (times[i - 1] ?? 0)).toBeGreaterThanOrEqual(90_000)
    expect(h.last()?.nextInboxAt).toBe((times.at(-1) ?? 0) + 2 * MIN)
  })

  it.each(['0', '', 'soon'])(
    'takes GitHub\'s 60 s for an X-Poll-Interval of "%s"',
    async (asked) => {
      // Number('') and Number('0') are 0: the pane said "every 0 s" and nothing held the inbox back.
      const h = harness('demo', (call, answer) =>
        call.argv.some((a) => a.startsWith('notifications'))
          ? {
              ...answer,
              stdout: answer.stdout.replace('X-Poll-Interval: 60', `X-Poll-Interval: ${asked}`),
            }
          : answer,
      )
      h.github.watch(AUTO)
      await h.flush()
      const inbox = h.last()?.inbox
      expect(inbox?.readable === true ? inbox.pollSeconds : null).toBe(60)
    },
  )
})

describe('a rate limit running low', () => {
  it('makes every period four times as long, but the free rate reading', async () => {
    const runs = async (mode: string) => {
      const h = harness(mode)
      h.github.watch(AUTO)
      await h.flush()
      const from = h.now() + 1
      await h.advance(HOUR)
      return {
        runs: h.rest('octo-aki/tern/actions/runs', from).length,
        rate: h.rest('rate_limit', from).length,
      }
    }
    const normal = await runs('demo')
    const low = await runs('ratelow')
    expect(normal.runs).toBeGreaterThanOrEqual(11)
    expect(low.runs).toBeLessThanOrEqual(Math.ceil(normal.runs / 4))
    expect(low.runs).toBeGreaterThan(0)
    // rate_limit costs nothing and is how the pane sees the limit come back.
    expect(low.rate).toBe(normal.rate)
  })
})

describe('a refusal for the rate limit', () => {
  const limited = (reset: number, retryAfter: string | null) => ({
    ok: false,
    code: 1,
    stdout: `HTTP/2.0 403 Forbidden\r\nX-Ratelimit-Remaining: 0\r\nX-Ratelimit-Reset: ${Math.floor(reset / 1000)}\r\n${retryAfter === null ? '' : `Retry-After: ${retryAfter}\r\n`}\r\n{"message":"API rate limit exceeded"}`,
    stderr: 'gh: API rate limit exceeded for user ID 1. (HTTP 403)',
    missing: false,
    timedOut: false,
    tooLarge: false,
  })

  it("throttles though a repository's calls are tolerated, and waits until the reset", async () => {
    // Per-repository calls are tolerated (push access, admin): a 403 for the rate limit there
    // set no problem, no THROTTLED and no back-off, and the next minute asked again.
    let refusing = true
    const reset = T0 + 20 * MIN
    const h = harness('demo', (call, answer) =>
      refusing && call.argv.some((a) => a.includes('/actions/runs'))
        ? limited(reset, null)
        : answer,
    )
    h.github.watch(AUTO)
    await h.flush()
    expect(h.last()?.link).toBe('throttled')
    const from = h.now() + 1
    await h.advance(15 * MIN)
    // Nothing that spends the limit until the reset: only rate_limit and the sign-in.
    const spent = h.calls.filter(
      ({ at, call }) => at >= from && call.argv[0] === 'api' && !call.argv.includes('rate_limit'),
    )
    expect(spent).toEqual([])
    expect(h.last()?.link).toBe('throttled')
    refusing = false
    await h.advance(10 * MIN)
    expect(h.rest('/actions/runs', reset).length).toBeGreaterThan(0)
    expect(h.last()?.link).toBe('linked')
  })

  it('on the inbox keeps the last reading, never "no notifications scope"', async () => {
    // A 403 for the rate limit was read as a token without the notifications scope, and the
    // hold kept "gh auth refresh … -s notifications" up until the reset.
    let refusing = false
    const h = harness('demo', (call, answer, now) =>
      refusing && call.argv.some((a) => a.startsWith('notifications'))
        ? limited(now + 30 * MIN, null)
        : answer,
    )
    h.github.watch(AUTO)
    await h.flush()
    const before = h.last()?.inbox
    expect(before?.readable === true ? before.items.length : 0).toBeGreaterThan(0)
    refusing = true
    await h.advance(3 * MIN)
    expect(h.last()?.link).toBe('throttled')
    expect(h.last()?.inbox).toEqual(before)
  })

  it('on a first reading of traffic says "not read yet", never "needs push access"', async () => {
    const h = harness('demo', (call, answer, now) =>
      call.argv.some((a) => a.includes('/traffic/views')) ? limited(now + 30 * MIN, null) : answer,
    )
    h.github.watch(AUTO)
    await h.flush()
    const tiles = h.last()?.repos ?? []
    expect(tiles.length).toBeGreaterThan(0)
    for (const tile of tiles) expect(tile.views14).toBe('unread')
  })

  it('a refusal of another kind is still the repository\'s: "needs push access"', async () => {
    const h = harness('demo', (call, answer) =>
      call.argv.some((a) => a.includes('/traffic/views'))
        ? {
            ...answer,
            ok: false,
            code: 1,
            stdout:
              'HTTP/2.0 403 Forbidden\r\nX-Ratelimit-Remaining: 4000\r\n\r\n{"message":"Must have push access to repository"}',
            stderr: 'gh: Must have push access to repository (HTTP 403)',
          }
        : answer,
    )
    h.github.watch(AUTO)
    await h.flush()
    const tiles = h.last()?.repos ?? []
    expect(tiles.length).toBeGreaterThan(0)
    for (const tile of tiles) expect(tile.views14).toBeNull()
  })

  describe('a repository read that fails for another reason', () => {
    const failed = (status: number | null): CliResult => ({
      ok: false,
      code: 1,
      stdout:
        status === null
          ? ''
          : `HTTP/2.0 ${status} Error\r\nX-Ratelimit-Remaining: 4000\r\n\r\n{"message":"Server Error"}`,
      stderr:
        status === null
          ? 'error connecting to api.github.com'
          : `gh: Server Error (HTTP ${status})`,
      missing: false,
      timedOut: status === null,
      tooLarge: false,
    })

    it.each([
      ['offline or timed out', null],
      ['a 502', 502],
      ['a 500', 500],
    ])(
      'on a first reading of traffic, %s, is "not read yet", never "needs push access"',
      async (_, status) => {
        // Any failure but a 200 or 304 was [name, null]: "needs push access" for six hours.
        const h = harness('demo', (call, answer) =>
          call.argv.some((a) => a.includes('/traffic/views')) ? failed(status) : answer,
        )
        h.github.watch(AUTO)
        await h.flush()
        const tiles = h.last()?.repos ?? []
        expect(tiles.length).toBeGreaterThan(0)
        for (const tile of tiles) expect(tile.views14).toBe('unread')
      },
    )

    it('a 404 is still the repository\'s own "no"', async () => {
      const h = harness('demo', (call, answer) =>
        call.argv.some((a) => a.includes('/traffic/views'))
          ? { ...failed(404), stdout: 'HTTP/2.0 404 Not Found\r\n\r\n{"message":"Not Found"}' }
          : answer,
      )
      h.github.watch(AUTO)
      await h.flush()
      for (const tile of h.last()?.repos ?? []) expect(tile.views14).toBeNull()
    })

    it('on the inbox keeps the last reading, never an empty inbox', async () => {
      // A 5xx read as an inbox of nothing: INBOX ZERO until the next good minute.
      let failing = false
      const h = harness('demo', (call, answer) =>
        failing && call.argv.some((a) => a.startsWith('notifications')) ? failed(502) : answer,
      )
      h.github.watch(AUTO)
      await h.flush()
      const before = h.last()?.inbox
      expect(before?.readable === true ? before.items.length : 0).toBeGreaterThan(0)
      failing = true
      await h.advance(2 * MIN)
      expect(h.last()?.inbox).toEqual(before)
    })
  })

  /** A secondary limit as GitHub may send it: a plain 403, no retry-after, the hour's limit left. */
  const secondary: CliResult = {
    ok: false,
    code: 1,
    stdout:
      'HTTP/2.0 403 Forbidden\r\nX-Ratelimit-Remaining: 4000\r\n\r\n{"message":"You have exceeded a secondary rate limit. Please wait a few minutes before you try again."}',
    stderr:
      'gh: You have exceeded a secondary rate limit. Please wait a few minutes before you try again. (HTTP 403)',
    missing: false,
    timedOut: false,
    tooLarge: false,
  }

  it('without retry-after keeps the inbox and holds a minute, never "no notifications scope"', async () => {
    // It fell through waitAsked: the inbox said "gh auth refresh … -s notifications" and lost its
    // notifications while the link was THROTTLED, and nothing waited.
    let refusing = false
    const h = harness('demo', (call, answer) =>
      refusing && call.argv.some((a) => a.startsWith('notifications')) ? secondary : answer,
    )
    h.github.watch(AUTO)
    await h.flush()
    const before = h.last()?.inbox
    expect(before?.readable === true ? before.items.length : 0).toBeGreaterThan(0)
    refusing = true
    const refusedAt = await h.untilCalled('notifications')
    expect(h.last()?.link).toBe('throttled')
    expect(h.last()?.inbox).toEqual(before)
    expect(h.last()?.heldUntil).toBe(refusedAt + MIN)
    // While held, "inbox next" is when the hold ends, not a minute after the last reading.
    expect(h.last()?.nextInboxAt).toBeGreaterThanOrEqual(refusedAt + MIN)
    await h.advance(MIN - 1)
    const spent = h.calls.filter(
      ({ at, call }) =>
        at > refusedAt &&
        at < refusedAt + MIN &&
        call.argv[0] === 'api' &&
        !call.argv.includes('rate_limit'),
    )
    expect(spent).toEqual([])
  })

  it('without retry-after on a first reading of traffic says "not read yet"', async () => {
    const h = harness('demo', (call, answer) =>
      call.argv.some((a) => a.includes('/traffic/views')) ? secondary : answer,
    )
    h.github.watch(AUTO)
    await h.flush()
    const tiles = h.last()?.repos ?? []
    expect(tiles.length).toBeGreaterThan(0)
    for (const tile of tiles) expect(tile.views14).toBe('unread')
    expect(h.last()?.link).toBe('throttled')
  })

  it("reads GitHub's wait: retry-after first, else the spent limit's reset", () => {
    const http = (status: number, headers: Record<string, string>) => ({
      status,
      headers: new Map(Object.entries(headers)),
      body: '',
    })
    expect(waitAsked(http(403, { 'retry-after': '60' }), T0)).toBe(T0 + 60_000)
    expect(waitAsked(http(429, { 'retry-after': '5' }), T0)).toBe(T0 + 5_000)
    expect(
      waitAsked(
        http(403, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(T0 / 1000 + 600) }),
        T0,
      ),
    ).toBe(T0 + 600_000)
    // A 403 of another kind (no scope, Dependabot off) asks no wait.
    expect(waitAsked(http(403, { 'x-ratelimit-remaining': '4000' }), T0)).toBeNull()
    expect(waitAsked(http(200, { 'retry-after': '60' }), T0)).toBeNull()
    // A secondary limit that names no time, in its body or only in gh's standard error, or a
    // 429: a minute.
    const said = {
      ...http(403, {}),
      body: '{"message":"You have exceeded a secondary rate limit."}',
    }
    expect(waitAsked(said, T0)).toBe(T0 + 60_000)
    expect(waitAsked(http(403, {}), T0, 'gh: API rate limit exceeded (HTTP 403)')).toBe(T0 + 60_000)
    expect(waitAsked(http(429, {}), T0)).toBe(T0 + 60_000)
    expect(
      waitAsked({ ...http(403, {}), body: '{"message":"Must have push access"}' }, T0),
    ).toBeNull()
    // A reset already past (this clock ahead of GitHub's, a stale header) held nothing at all.
    const spent = { 'x-ratelimit-remaining': '0' }
    for (const reset of [T0 / 1000 - 30, T0 / 1000])
      expect(waitAsked(http(403, { ...spent, 'x-ratelimit-reset': String(reset) }), T0)).toBe(
        T0 + 60_000,
      )
  })

  it("is the user's: a second board waits too, and a repository's inside is not read", async () => {
    // The hold was a board's: a second GITHUB STATUS pane went on calling until its own 403, and
    // the drill-down read a repository's inside whatever GitHub had said.
    let refusing = false
    const reset = T0 + 30 * MIN
    const h = harness('demo', (call, answer) =>
      refusing && call.argv.some((a) => a.includes('/actions/runs'))
        ? limited(reset, null)
        : answer,
    )
    h.github.watch(AUTO)
    await h.flush()
    const repos = (h.last()?.repos ?? []).map((tile) => tile.name)
    const [open, other] = repos as [string, string]
    expect(other).toBeDefined()
    expect(await h.github.detail(AUTO, open)).toMatchObject({ repo: open })
    refusing = true
    await h.untilCalled('/actions/runs')
    expect(h.last()?.link).toBe('throttled')
    const from = h.now()
    const second = boardKey({ repos: 'auto', inbox: 'participating' })
    h.github.watch(second)
    await h.flush()
    expect(h.last()?.key).toBe(second)
    expect(h.last()?.link).toBe('throttled')
    const spent = () =>
      h.calls.filter(
        ({ at, call }) => at >= from && call.argv[0] === 'api' && !call.argv.includes('rate_limit'),
      )
    expect(spent()).toEqual([])
    // Six minutes on, past the five a drill-down's reading is kept; a REFRESH clears nothing.
    await h.advance(6 * MIN)
    h.github.refresh(AUTO)
    await h.flush()
    expect(await h.github.detail(AUTO, open)).toMatchObject({ repo: open })
    expect(await h.github.detail(AUTO, other)).toBe('waiting')
    expect(spent()).toEqual([])
  })
})

describe('the budget', () => {
  /**
   * `count` pinned repositories, every REST call counted as if none answered 304: the worst
   * hour. The stand-in's first repository is given the names.
   */
  function pinned(count: number) {
    const names = Array.from({ length: count }, (_, i) => `octo-aki/r${i}`)
    const h = harness('demo', (call, answer) => {
      if (!(call.stdin ?? '').includes('query PinnedRepos')) return answer
      const body = JSON.parse(answer.stdout) as { data: Record<string, Record<string, unknown>> }
      const node = body.data.r0 ?? {}
      for (const [i, name] of names.entries()) body.data[`r${i}`] = { ...node, nameWithOwner: name }
      return { ...answer, stdout: JSON.stringify(body) }
    })
    return { h, key: boardKey({ repos: names, inbox: 'all' }), names }
  }
  /** Six hours after the first reading, so the hourly and six-hourly readings come in too. */
  async function sixHours(count: number) {
    const { h, key, names } = pinned(count)
    h.github.watch(key)
    await h.flush()
    const hours = 6
    const from = h.now() + 1
    await h.advance(hours * HOUR)
    const spent = h.calls.filter(({ at }) => at >= from).map(({ call }) => call)
    // rate_limit and the sign-in cost no rate limit.
    const rest = spent.filter(
      (c) => c.argv[0] === 'api' && c.argv[1] !== 'graphql' && !c.argv.includes('rate_limit'),
    )
    const graphql = spent.filter((c) => c.argv[1] === 'graphql')
    const runsOfOne = rest.filter((c) =>
      c.argv.some((a) => a.startsWith(`repos/${names[0]}/actions/runs`)),
    )
    const ledger = h.last()?.ledger.probes ?? []
    const every = (id: string) => ledger.find((probe) => probe.id === id)?.every
    return {
      hours,
      rest,
      graphql,
      perHour: rest.length / hours,
      runsOfOne: runsOfOne.length / hours,
      every,
    }
  }

  it('keeps an hour of twelve repositories under 5% of REST at worst, and asks conditionally', async () => {
    // User decision 2026-11-08. Every 5 minutes, twelve were about 362 an hour (7.2%): 60 inbox
    // readings, 12 events and 12 runs a repository, 12 advisories and the traffic's 2. From
    // eight repositories events and runs are read every 10 minutes: about 218 (4.4%).
    const { hours, rest, graphql, perHour, runsOfOne, every } = await sixHours(12)
    expect(perHour).toBeLessThan(0.05 * 5000)
    expect(perHour).toBeGreaterThan(200)
    expect(Math.round(runsOfOne)).toBe(6)
    // The ledger's card says the pace kept, not the timer's 5 minutes.
    expect([every('runs'), every('events')]).toEqual([10 * MIN, 10 * MIN])
    // GraphQL, a point a query or so: the queue 12 times an hour, the repositories 4, the
    // commits since and the calendar once.
    expect(graphql.length / hours).toBeLessThanOrEqual(20)
    // With the validators kept, all but the first of each are conditional, and a 304 is free.
    const unconditional = (call: CliCall) =>
      !call.argv.some((a) => /^If-(None-Match|Modified-Since):/.test(a))
    expect(rest.filter(unconditional).length).toBeLessThan(rest.length / 10)
  })

  it('reads seven repositories as often as before, still under 5%: the worst count', async () => {
    // Seven at 5 minutes are the most of any count: about 237 an hour (4.7%).
    const seven = await sixHours(7)
    expect(Math.round(seven.runsOfOne)).toBe(12)
    expect(seven.every('runs')).toBe(5 * MIN)
    expect(seven.perHour).toBeLessThan(0.05 * 5000)
    const eight = await sixHours(8)
    expect(Math.round(eight.runsOfOne)).toBe(6)
  })

  /** A repository's events or runs, the calls that may fail now and then below. */
  const perRepoCall = (call: CliCall) =>
    call.argv.some((a) => /^repos\/[^/]+\/[^/]+\/(events|actions)/.test(a))
  /** The same numbers in every run: a linear congruential generator from a fixed seed. */
  function seeded() {
    let seed = 12345
    return () => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed / 2147483648
    }
  }

  it.each([
    [
      'a 502 on 2% of the calls',
      () => {
        const random = seeded()
        return (call: CliCall) => perRepoCall(call) && random() < 0.02
      },
    ],
    [
      "every other call of one repository's",
      () => {
        let n = 0
        return (call: CliCall) =>
          call.argv.some((a) => /^repos\/octo-aki\/r8\/(events|actions)/.test(a)) && n++ % 2 === 0
      },
    ],
  ] as const)(
    'keeps twelve repositories under five per cent of REST with %s',
    async (_, failing) => {
      // A retry read all twelve again and set the pace from itself: 2% of 502s made 252 an hour
      // (5.04%), one repository failing every other call 356 (7.1%).
      const fails = failing()
      const h = own(
        () => 12,
        (call, answer) => (fails(call) ? badGateway(answer) : answer),
      )
      h.github.watch(AUTO)
      await h.flush()
      const from = h.now() + 1
      await h.advance(6 * HOUR)
      expect(restSpent(h, from).length / 6).toBeLessThan(0.05 * 5000)
      // The others keep their pace: six readings an hour.
      expect(h.rest('repos/octo-aki/r0/actions/runs', from).length).toBeLessThanOrEqual(6 * 6 + 2)
    },
  )
})

describe('the pace of many repositories', () => {
  const runsOf = (h: ReturnType<typeof harness>, repo: string, from: number) =>
    h.rest(`repos/${repo}/actions/runs`, from).length

  it('reads them all at REFRESH, not at the next pace', async () => {
    const h = own(() => 9)
    h.github.watch(AUTO)
    await h.flush()
    await h.advance(2 * MIN)
    const from = h.now()
    h.github.refresh(AUTO)
    await h.flush()
    expect(runsOf(h, 'octo-aki/r0', from)).toBe(1)
  })

  it('reads a repository added to the list at once, not a whole pace on', async () => {
    let count = 8
    const h = own(() => count)
    h.github.watch(AUTO)
    await h.flush()
    await h.advance(11 * MIN)
    // The list is read again every 15 minutes (a little after the boundary); the runs last read
    // at the 10-minute one, their next at 20.
    count = 9
    const from = h.now()
    await h.advance(8 * MIN)
    const first = h.rest('repos/octo-aki/r8/actions/runs', from)[0]?.at ?? Number.POSITIVE_INFINITY
    const listed = h.calls.find(
      ({ at, call }) => at >= from && (call.stdin ?? '').includes('query OwnRepos'),
    )?.at
    expect(listed).toBeDefined()
    expect(first - (listed ?? 0)).toBeLessThan(MIN)
  })

  it('keeps the others on their 5-minute pace though a retry of one lands just before a boundary', async () => {
    // A retry of the one repository that did not answer counted as the probe's reading: landing
    // a minute or two before the boundary, it made the boundary skip as "just read", and the
    // others' runs were read 600 s apart instead of 300.
    let fails = 0
    let armed = false
    const h = own(
      () => 3,
      (call, answer) =>
        armed &&
        call.argv.some((a) => a.startsWith('repos/octo-aki/r2/actions/runs')) &&
        fails++ < 2
          ? badGateway(answer)
          : answer,
    )
    h.github.watch(AUTO)
    await h.flush()
    await h.advance(9 * MIN)
    armed = true
    const from = h.now()
    await h.advance(21 * MIN)
    const seconds = (repo: string) =>
      h.rest(`repos/${repo}/actions/runs`, from).map(({ at }) => (at - from) / 1000)
    // The retries of r2 (after 1 and 2 minutes) came in between.
    expect(seconds('octo-aki/r2').length).toBeGreaterThan(seconds('octo-aki/r0').length)
    const r0 = seconds('octo-aki/r0')
    expect(r0.length).toBeGreaterThanOrEqual(4)
    for (let i = 1; i < r0.length; i++) expect((r0[i] ?? 0) - (r0[i - 1] ?? 0)).toBe(300)
  })
})

describe('a repository that leaves the list', () => {
  const tern = 'octo-aki/tern'
  /** What a board says of `repo`: its tile, its events, and its runs and reports to act on. */
  const said = (board: GithubBoard, repo: string) => ({
    tile: board.repos.some((tile) => tile.name === repo),
    events: board.events.filter((event) => event.repo === repo).map((event) => event.private),
    items: board.queue
      .filter((item) => item.repo === repo && (item.kind === 'run' || item.kind === 'security'))
      .map((item) => [item.kind, item.private]),
  })

  it('is gone from the events, run approvals and reports as soon as a board no longer lists it, never shown as public', async () => {
    // It stayed in the last reading until the probe next read them all, and its privacy was
    // looked up among the repositories still watched: not there, it went out public, its name
    // shown under MASK for up to 10 minutes (events, runs) or an hour (reports).
    let names = [tern, 'octo-aki/r0', 'octo-aki/r1']
    const h = ownNamed(
      () => names,
      (name) => name === tern,
    )
    h.github.watch(AUTO)
    await h.flush()
    const before = said(h.last() as GithubBoard, tern)
    expect(before.tile).toBe(true)
    expect(before.events).toEqual([true])
    expect(before.items).toEqual(
      expect.arrayContaining([
        ['security', true],
        ['run', true],
      ]),
    )
    const from = h.boards.length
    names = names.slice(1)
    await h.advance(46 * MIN)
    // Every board from the reading of the list that dropped it, the one published at once too.
    const after = h.boards.slice(from).filter((board) => !said(board, tern).tile)
    expect(after.length).toBeGreaterThan(0)
    for (const board of after)
      expect(said(board, tern)).toEqual({ tile: false, events: [], items: [] })
  })
})

describe('a reading kept back or failed is read again soon, never a whole period on', () => {
  /** The hour's limit spent until `reset`, as GitHub answers a REST call. */
  const spent = (reset: number): CliResult => ({
    ok: false,
    code: 1,
    stdout: `HTTP/2.0 403 Forbidden\r\nX-Ratelimit-Remaining: 0\r\nX-Ratelimit-Reset: ${Math.floor(reset / 1000)}\r\n\r\n{"message":"API rate limit exceeded"}`,
    stderr: 'gh: API rate limit exceeded for user ID 1. (HTTP 403)',
    missing: false,
    timedOut: false,
    tooLarge: false,
  })
  const timedOut: CliResult = {
    ok: false,
    code: -1,
    stdout: '',
    stderr: '',
    missing: false,
    timedOut: true,
    tooLarge: false,
  }
  const graphqlOf = (h: ReturnType<typeof harness>, query: string, from: number) =>
    h.calls.filter(({ at, call }) => at >= from && (call.stdin ?? '').includes(query))
  const isTraffic = (call: CliCall) => call.argv.some((a) => a.includes('/traffic/views'))

  it('reads a board opened during a hold once the hold is over, not at its next 15 minutes', async () => {
    // A probe the hold skipped settled as "nothing new": the second board's repositories were
    // read only at the next 15-minute boundary, and it showed none for about 14 minutes.
    let until = 0
    let armed = false
    const h = harness('demo', (call, answer, now) => {
      if (!armed || until !== 0 || !call.argv.some((a) => a.startsWith('notifications')))
        return answer
      until = now + MIN
      return {
        ...answer,
        ok: false,
        code: 1,
        stdout:
          'HTTP/2.0 429 Too Many Requests\r\n\r\n{"message":"You have exceeded a secondary rate limit"}',
        stderr: 'gh: You have exceeded a secondary rate limit (HTTP 429)',
      }
    })
    h.github.watch(AUTO)
    await h.flush()
    armed = true
    await h.untilCalled('notifications')
    expect(until).toBeGreaterThan(h.now())
    const second = boardKey({ repos: 'auto', inbox: 'participating' })
    const opened = h.now()
    h.github.watch(second)
    await h.flush()
    expect(h.of(second)?.repos ?? []).toEqual([])
    await h.advance(until - h.now() + 2 * MIN)
    const listed = graphqlOf(h, 'query OwnRepos', opened)
    expect(listed.length).toBeGreaterThan(0)
    expect((listed[0]?.at ?? 0) - until).toBeLessThan(2 * MIN)
    expect(h.of(second)?.repos.length).toBeGreaterThan(0)
  })

  it('reads an hourly probe the hold kept back once it ends, not an hour on', async () => {
    const from = T0 + 50 * MIN
    const reset = T0 + 70 * MIN
    const h = harness('demo', (call, answer, now) =>
      now >= from && now < reset && call.argv.some((a) => a.includes('/actions/runs'))
        ? spent(reset)
        : answer,
    )
    h.github.watch(AUTO)
    await h.flush()
    await h.advance(reset - h.now() + 3 * MIN)
    // The calendar's boundary (an hour) fell inside the hold: read when it ended.
    const read = graphqlOf(h, 'query Contributions', T0 + 1)
    expect(read.length).toBe(1)
    expect((read[0]?.at ?? 0) - reset).toBeGreaterThanOrEqual(0)
    expect((read[0]?.at ?? 0) - reset).toBeLessThan(2 * MIN)
  })

  it('reads traffic whose first reading met the limit once the hold is over', async () => {
    // No repository answered, yet the reading was `{}`: counted as read for six hours, every
    // tile "not read yet" long after the limit came back.
    let reset = 0
    const h = harness('demo', (call, answer, now) => {
      if (!isTraffic(call) || (reset !== 0 && now >= reset)) return answer
      if (reset === 0) reset = now + 40 * MIN
      return spent(reset)
    })
    h.github.watch(AUTO)
    await h.flush()
    expect(h.last()?.repos.every((tile) => tile.views14 === 'unread')).toBe(true)
    await h.advance(reset - h.now() + 2 * MIN)
    const tern = h.last()?.repos.find((tile) => tile.name === 'octo-aki/tern')
    expect(Array.isArray(tern?.views14)).toBe(true)
    expect(h.rest('/traffic/views', reset).length).toBeGreaterThan(0)
  })

  it.each([
    ['timed out', timedOut],
    [
      'offline',
      { ...timedOut, code: 1, timedOut: false, stderr: 'error connecting to api.github.com' },
    ],
    [
      'a 502',
      {
        ...timedOut,
        code: 1,
        timedOut: false,
        stdout: 'HTTP/2.0 502 Bad Gateway\r\n\r\n{"message":"Server Error"}',
        stderr: 'gh: Server Error (HTTP 502)',
      },
    ],
  ] as const)(
    'retries traffic whose every repository %s on its back-off, and says the board is not linked',
    async (_, failure) => {
      // Tolerated, the failure set no problem and no back-off: LINKED, and traffic read again
      // only six hours on.
      let failing = true
      const h = harness('demo', (call, answer) => (failing && isTraffic(call) ? failure : answer))
      h.github.watch(AUTO)
      await h.flush()
      expect(h.last()?.link).not.toBe('linked')
      failing = false
      const back = h.now()
      await h.advance(3 * MIN)
      expect(h.rest('/traffic/views', back).length).toBeGreaterThan(0)
      const tern = h.last()?.repos.find((tile) => tile.name === 'octo-aki/tern')
      expect(Array.isArray(tern?.views14)).toBe(true)
      expect(h.last()?.link).toBe('linked')
    },
  )

  it('counts a reading in which no repository answered as no reading: shown again, it reads', async () => {
    // `{}` counted as read: hidden before the retry and shown again, traffic was not due for six
    // hours, every tile "not read yet".
    let failing = true
    const h = harness('demo', (call, answer) => (failing && isTraffic(call) ? timedOut : answer))
    h.github.watch(AUTO)
    await h.flush()
    h.github.unwatch(AUTO)
    failing = false
    await h.advance(10 * MIN)
    const shown = h.now()
    h.github.watch(AUTO)
    await h.flush()
    expect(h.rest('/traffic/views', shown).length).toBeGreaterThan(0)
    const tern = h.last()?.repos.find((tile) => tile.name === 'octo-aki/tern')
    expect(Array.isArray(tern?.views14)).toBe(true)
  })

  it('keeps the others on their 10-minute pace though one repository never answers, and says the board is not linked', async () => {
    // The repository's failure backed the whole probe off: the other eight were read at 1, 3, 7,
    // 15, 35, 65, 95 minutes - every half hour - while the board said ERROR.
    const h = own(
      () => 9,
      (call, answer) =>
        call.argv.some((a) => a.startsWith('repos/octo-aki/r8/events'))
          ? badGateway(answer)
          : answer,
    )
    h.github.watch(AUTO)
    await h.flush()
    const from = h.now() + 1
    // Two hours from the first reading, on the hour: twelve paced readings after it.
    await h.advance(2 * HOUR + 5 * MIN)
    const times = h.rest('repos/octo-aki/r0/events', from).map(({ at }) => at)
    expect(times.length).toBe(12)
    for (let i = 1; i < times.length; i++)
      expect((times[i] ?? 0) - (times[i - 1] ?? 0)).toBe(10 * MIN)
    // The broken one is asked with them, and in between only on the back-off: never the others.
    const broken = h.rest('repos/octo-aki/r8/events', from).length
    expect(broken).toBeLessThanOrEqual(12 + 4)
    expect(h.last()?.link).toBe('error')
  })

  it('backs it all off when no repository answers (offline), never reading every pace', async () => {
    const h = own(
      () => 9,
      (call, answer) => (call.argv.some((a) => /^repos\/.*\/events/.test(a)) ? timedOut : answer),
    )
    h.github.watch(AUTO)
    await h.flush()
    const from = h.now() + 1
    await h.advance(2 * HOUR)
    // 1, 2, 4, 8, 16, 30, 30 … minutes apart: about seven readings in two hours, not twelve.
    expect(h.rest('repos/octo-aki/r0/events', from).length).toBeLessThanOrEqual(8)
  })

  it('reads events at once when shown again after a hide dropped their reading', async () => {
    // The reading noted "every repository asked, now" before its calls: hidden while they
    // waited, it was dropped, and shown again the paced probe answered null - nine repositories'
    // events unread for 10 minutes, nothing stored.
    const holder: { h?: ReturnType<typeof own> } = {}
    let hidden = false
    const h = own(
      () => 9,
      (call, answer) => {
        if (!hidden && call.argv.some((a) => /^repos\/.*\/events/.test(a))) {
          hidden = true
          holder.h?.github.unwatch(AUTO)
        }
        return answer
      },
    )
    holder.h = h
    h.github.watch(AUTO)
    await h.flush()
    expect(hidden).toBe(true)
    expect(h.rest('/events').length).toBeLessThan(9)
    await h.advance(5_000)
    const shown = h.now()
    h.github.watch(AUTO)
    await h.flush()
    await h.advance(MIN)
    for (let i = 0; i < 9; i++)
      expect(h.rest(`repos/octo-aki/r${i}/events`, shown).length).toBeGreaterThan(0)
  })

  it.each([
    ['events', '/events'],
    ['traffic', '/traffic/views'],
  ] as const)(
    'reads the one repository whose %s met a short hold once it ends, and only that one',
    async (_, part) => {
      // The retry fell inside the hold and settled with no problem; when the hold ended, events
      // waited for their next pace (10 minutes) and traffic read all nine again.
      let until = 0
      const h = own(
        () => 9,
        (call, answer, now) => {
          if (until !== 0 || !call.argv.some((a) => a.startsWith(`repos/octo-aki/r8${part}`)))
            return answer
          until = now + 150_000
          return {
            ...answer,
            ok: false,
            code: 1,
            stdout:
              'HTTP/2.0 429 Too Many Requests\r\nRetry-After: 150\r\n\r\n{"message":"You have exceeded a secondary rate limit"}',
            stderr: 'gh: You have exceeded a secondary rate limit (HTTP 429)',
          }
        },
      )
      h.github.watch(AUTO)
      await h.flush()
      expect(until).toBeGreaterThan(0)
      expect(h.last()?.link).toBe('throttled')
      const met = h.now() + 1
      await h.advance(until - h.now() + 2 * MIN)
      const again = h.rest(`repos/octo-aki/r8${part}`, met).map(({ at }) => at)
      expect(again.length).toBe(1)
      expect((again[0] ?? 0) - until).toBeGreaterThanOrEqual(0)
      expect((again[0] ?? 0) - until).toBeLessThan(2 * MIN)
      expect(h.rest(`repos/octo-aki/r0${part}`, met)).toEqual([])
      expect(h.last()?.link).toBe('linked')
    },
  )

  it('holds a paced probe to its pace, and retries only the repositories it did not hear from', async () => {
    // At the probe's own level: the last reading asked for all nine at T0, one did not answer.
    const events = GITHUB_PROBES.find((probe) => probe.id === 'events')
    const names = Array.from({ length: 9 }, (_, i) => `octo-aki/r${i}`)
    const previous = Object.fromEntries(names.slice(0, 8).map((name) => [name, []]))
    const calls: CliCall[] = []
    let now = T0 + 5 * MIN
    const ctx: GhContext = {
      spec: { repos: 'auto', inbox: 'all' },
      repos: () =>
        names.map((name) => ({ name, private: false, defaultBranch: 'main', release: null })),
      conditional: new Map(),
      now: () => now,
      rateLow: () => false,
      readAt: () => T0,
      refreshedAt: () => 0,
      heldUntil: () => 0,
      hold: () => {},
      heldBack: new Set(),
      tried: new Map([['events', names]]),
      fullAt: new Map([['events', T0]]),
      unheard: new Map([['events', []]]),
    }
    const cli = async (call: CliCall): Promise<CliResult> => {
      calls.push(call)
      return { ...timedOut, timedOut: false, code: 0, ok: true, stdout: 'HTTP/2.0 304\r\n\r\n' }
    }
    const paths = () => calls.map((call) => call.argv.at(-1))
    // Every repository heard from, between its readings: nothing - events, and traffic too (a
    // retry left from before a reading of them all once read all of them again).
    expect(await events?.run(ctx, cli, previous)).toBeNull()
    const traffic = GITHUB_PROBES.find((probe) => probe.id === 'traffic')
    ctx.tried.set('traffic', names)
    ctx.fullAt.set('traffic', T0)
    ctx.unheard.set('traffic', [])
    expect(await traffic?.run(ctx, cli, null)).toBeNull()
    expect(calls).toEqual([])
    // A retry, after its back-off or a hold, asks only the one not heard from, keeps the
    // others' answers, and leaves the pace where it was.
    ctx.unheard.set('events', [names[8] ?? ''])
    const retried = (await events?.run(ctx, cli, previous)) as Record<string, unknown> | null
    expect(paths()).toEqual(['repos/octo-aki/r8/events?per_page=30'])
    expect(Object.keys(retried ?? {}).sort()).toEqual([...names].sort())
    expect(ctx.fullAt.get('events')).toBe(T0)
    expect(ctx.unheard.get('events')).toEqual([])
    // Its back-off holds no reading of them all once the pace is due, unless none answered.
    expect(events?.dueThroughBackoff?.(ctx)).toBe(false)
    now = T0 + 10 * MIN + 30_000
    expect(events?.dueThroughBackoff?.(ctx)).toBe(true)
    ctx.unheard.set('events', names)
    expect(events?.dueThroughBackoff?.(ctx)).toBe(false)
    // A repository the last reading of all did not ask for (just added) reads them all at once.
    now = T0 + 5 * MIN
    calls.length = 0
    ctx.tried.set('events', names.slice(0, 8))
    await events?.run(ctx, cli, previous)
    expect(calls.length).toBe(9)
    expect(ctx.fullAt.get('events')).toBe(now)
  })

  it('drops a repository that left the list from its last reading, though nothing is read now', async () => {
    // Between its readings of them all with every repository heard from, nothing is read (null)
    // and the scheduler kept the last value, the dropped repository in it, for up to an hour.
    const names = ['octo-aki/r0', 'octo-aki/r1', 'octo-aki/tern']
    let watched = names
    const ctx: GhContext = {
      spec: { repos: 'auto', inbox: 'all' },
      repos: () =>
        watched.map((name) => ({ name, private: false, defaultBranch: 'main', release: null })),
      conditional: new Map(),
      now: () => T0 + 2 * MIN,
      rateLow: () => false,
      readAt: () => T0,
      refreshedAt: () => 0,
      heldUntil: () => 0,
      hold: () => {},
      heldBack: new Set(),
      tried: new Map(),
      fullAt: new Map(),
      unheard: new Map(),
    }
    const calls: CliCall[] = []
    const cli = async (call: CliCall): Promise<CliResult> => {
      calls.push(call)
      throw new Error('nothing is read')
    }
    for (const id of ['events', 'runs', 'advisories', 'traffic']) {
      const probe = GITHUB_PROBES.find((entry) => entry.id === id)
      ctx.tried.set(id, names)
      ctx.fullAt.set(id, T0)
      ctx.unheard.set(id, [])
      const previous = Object.fromEntries(names.map((name) => [name, null]))
      watched = names
      expect(await probe?.run(ctx, cli, previous)).toBeNull()
      watched = names.slice(0, 2)
      expect(await probe?.run(ctx, cli, previous)).toEqual({
        'octo-aki/r0': null,
        'octo-aki/r1': null,
      })
      // The pace stands: that was no reading of them all.
      expect(ctx.fullAt.get(id)).toBe(T0)
    }
    expect(calls).toEqual([])
  })

  it('holds every board for a GraphQL refusal for the rate limit, and the drill-down too', async () => {
    // GraphQL's refusal set no hold: other probes and boards went on calling, and a repository's
    // inside was read again on every open.
    let refusing = false
    const h = harness('demo', (call, answer) =>
      refusing && call.argv[1] === 'graphql'
        ? {
            ...answer,
            ok: false,
            code: 1,
            stdout:
              '{"errors":[{"type":"RATE_LIMITED","message":"API rate limit exceeded for user ID 1."}]}',
            stderr: 'gh: API rate limit exceeded for user ID 1.',
          }
        : answer,
    )
    h.github.watch(AUTO)
    await h.flush()
    const repo = h.last()?.repos[0]?.name ?? ''
    refusing = true
    const asked = h.now()
    expect(await h.github.detail(AUTO, repo)).toMatchObject({ repo, pulls: [] })
    expect(h.last()?.heldUntil).toBe(asked + MIN)
    expect(h.last()?.link).toBe('throttled')
    expect(await h.github.detail(AUTO, repo)).toBe('waiting')
    expect(graphqlOf(h, 'query RepoPulls', asked).length).toBe(1)
    // A probe's GraphQL refusal holds too: nothing spends the limit for GitHub's minute.
    refusing = false
    await h.advance(2 * MIN)
    refusing = true
    const before = graphqlOf(h, 'query Queue', 0).length
    for (let i = 0; i < 720 && graphqlOf(h, 'query Queue', 0).length === before; i++)
      await h.advance(5_000)
    const at = graphqlOf(h, 'query Queue', 0).at(-1)?.at ?? 0
    expect(h.last()?.heldUntil).toBe(at + MIN)
    const spentCalls = h.calls.filter(
      ({ at: when, call }) =>
        when > at && when < at + MIN && call.argv[0] === 'api' && !call.argv.includes('rate_limit'),
    )
    expect(spentCalls).toEqual([])
  })
})

describe('a sign-out met inside a reading of more repositories than lanes', () => {
  it('says SIGNED OUT with the command, and reads nothing more until REFRESH', async () => {
    // Five repositories, four lanes: the fifth call came back not started once the first 401
    // halted the board, the reading was dropped, and the board said LINKED while it read nothing
    // (a repository's inside answered "waiting" for ever).
    let signedIn = true
    const h = own(
      () => 5,
      (call, answer) =>
        !signedIn && call.argv.some((a) => a.includes('/actions/runs'))
          ? {
              ...answer,
              ok: false,
              code: 1,
              stdout: 'HTTP/2.0 401 Unauthorized\r\n\r\n{"message":"Bad credentials"}',
              stderr: 'gh: Bad credentials (HTTP 401)',
            }
          : answer,
    )
    h.github.watch(AUTO)
    await h.flush()
    expect(h.last()?.link).toBe('linked')
    signedIn = false
    await h.untilCalled('/actions/runs')
    await h.flush()
    expect(h.last()).toMatchObject({ link: 'signed-out', signIn: 'gh auth login' })
    const halted = h.now()
    await h.advance(30 * MIN)
    expect(restSpent(h, halted + 1)).toEqual([])
    expect(h.last()?.link).toBe('signed-out')
  })
})

describe('a board shown again counts from its last reading of all repositories', () => {
  // A retry of one repository, or a prune of one that left the list, moved the probe's time:
  // a board shown again counted from it and put off a reading that was due by hours.
  it('reads traffic at once when shown past its period, though a retry came after the last full reading', async () => {
    let fails = 0
    const h = own(
      () => 3,
      (call, answer) =>
        call.argv.some((a) => a.startsWith('repos/octo-aki/r2/traffic')) && fails++ < 1
          ? badGateway(answer)
          : answer,
    )
    h.github.watch(AUTO)
    await h.flush()
    await h.advance(5 * MIN)
    h.github.unwatch(AUTO)
    await h.flush()
    await h.advance(6 * HOUR - 5 * MIN + 30_000)
    const shown = h.now()
    h.github.watch(AUTO)
    await h.flush()
    await h.advance(3 * MIN)
    expect(h.rest('octo-aki/r0/traffic/views', shown).length).toBeGreaterThan(0)
  })

  it('holds advisories at RATE LOW four periods from the last full reading, not from a retry', async () => {
    // One repository failed in the hourly reading, so its retries landed half an hour after it;
    // with the rate low from the second hour, counting from the retry put off the next whole
    // reading an hour more.
    const h = own(
      () => 3,
      (call, answer, now) => {
        if (call.argv.includes('rate_limit') && now >= T0 + 2 * HOUR)
          return { ...answer, stdout: answer.stdout.replace(/"remaining":4812/, '"remaining":412') }
        const r2 = call.argv.some((a) => a.startsWith('repos/octo-aki/r2/security-advisories'))
        return r2 && now >= T0 + 50 * MIN && now < T0 + 80 * MIN ? badGateway(answer) : answer
      },
    )
    h.github.watch(AUTO)
    await h.flush()
    await h.advance(4 * HOUR + 50 * MIN)
    // The retries ended after the hourly reading, and RATE LOW held the readings since.
    expect(h.rest('octo-aki/r2/security-advisories', T0 + 80 * MIN).length).toBeGreaterThan(0)
    const from = h.now()
    expect(h.rest('octo-aki/r0/security-advisories', T0 + 2 * HOUR)).toHaveLength(0)
    await h.advance(20 * MIN)
    expect(h.rest('octo-aki/r0/security-advisories', from).length).toBeGreaterThan(0)
  })

  it('reads advisories at once when shown past their period, though a prune came after the last full reading', async () => {
    let names = ['octo-aki/r0', 'octo-aki/r1', 'octo-aki/tern']
    const h = ownNamed(() => names, null)
    h.github.watch(AUTO)
    await h.flush()
    names = names.slice(0, 2)
    await h.advance(46 * MIN)
    h.github.unwatch(AUTO)
    await h.flush()
    await h.advance(30 * MIN)
    const shown = h.now()
    h.github.watch(AUTO)
    await h.flush()
    await h.advance(3 * MIN)
    expect(h.rest('octo-aki/r0/security-advisories', shown).length).toBeGreaterThan(0)
  })
})
