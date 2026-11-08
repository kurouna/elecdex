import { describe, expect, it } from 'vitest'
import { cliEnv, findExecutable, fixedFlags } from '../../src/main/cloud-cli/run'
import { concurrencyLimit, isNotModified, ProbeScheduler } from '../../src/main/cloud-cli/scheduler'
import { classifyCliError, redactCliText, signInCommand } from '../../src/shared/cloud-cli/errors'
import {
  emptyLedger,
  type LedgerEntry,
  linkOf,
  recordReading,
  rollLedger,
  summarize,
} from '../../src/shared/cloud-cli/ledger'
import {
  backoffMs,
  type CliCall,
  type CliResult,
  isDue,
  MINUTE,
  type Probe,
  staggerMs,
} from '../../src/shared/cloud-cli/probe'

/** The shared core of the CLI panes (docs/cloud-cli.md): errors, the ledger, the runner, the scheduler. */

const result = (over: Partial<CliResult> = {}): CliResult => ({
  ok: false,
  code: 1,
  stdout: '',
  stderr: '',
  missing: false,
  timedOut: false,
  tooLarge: false,
  ...over,
})

describe('classifyCliError', () => {
  it('names a missing CLI and a timeout before reading any text', () => {
    expect(classifyCliError('aws', result({ missing: true, stderr: 'AccessDenied' }))).toEqual({
      kind: 'no-cli',
    })
    expect(classifyCliError('gh', result({ timedOut: true }))).toEqual({ kind: 'timeout' })
  })

  it.each([
    [
      "Unable to refresh login credentials because of a change in your password. Run 'aws login'",
      'login',
    ],
    ['Error loading SSO Token: Token for x does not exist', 'sso'],
    ['Enter MFA code for arn:aws:iam::123456789012:mfa/me:', 'mfa'],
    [
      'Unable to locate credentials. You can configure credentials by running "aws configure".',
      'keys',
    ],
    ['An error occurred (ExpiredToken) when calling the DescribeInstances operation', 'keys'],
  ])('reads an AWS sign-in gone: %s', (stderr, via) => {
    expect(classifyCliError('aws', result({ stderr }))).toEqual({ kind: 'signed-out', via })
  })

  it('spells a refused action as IAM does, though SQS names it in lower case', () => {
    const denial = (operation: string, action: string) =>
      `An error occurred (AccessDenied) when calling the ${operation} operation: User: arn:aws:iam::123456789012:user/x is not authorized to perform: ${action} on resource: arn:aws:sqs:ap-northeast-1:123456789012: because no identity-based policy allows the ${action} action`
    expect(
      classifyCliError('aws', result({ stderr: denial('ListQueues', 'sqs:listqueues') })),
    ).toEqual({
      kind: 'denied',
      action: 'sqs:ListQueues',
    })
    // An action that is not the operation's own word is kept as AWS wrote it.
    expect(
      classifyCliError('aws', result({ stderr: denial('ListQueues', 'kms:Decrypt') })),
    ).toEqual({ kind: 'denied', action: 'kms:Decrypt' })
  })

  it('reads gh signed out, throttled, denied with the action, and offline', () => {
    expect(classifyCliError('gh', result({ stderr: 'gh: Bad credentials (HTTP 401)' }))).toEqual({
      kind: 'signed-out',
      via: 'gh',
    })
    // What `gh auth status` says of a token gone bad.
    expect(classifyCliError('gh', result({ stderr: 'The token in keyring is invalid.' }))).toEqual({
      kind: 'signed-out',
      via: 'gh',
    })
    expect(classifyCliError('gh', result({ stderr: 'API rate limit exceeded for user' }))).toEqual({
      kind: 'throttled',
    })
    expect(
      classifyCliError(
        'aws',
        result({
          stderr:
            'An error occurred (AccessDenied): User: arn:aws:iam::123456789012:user/a is not authorized to perform: ce:GetCostAndUsage',
        }),
      ),
    ).toEqual({ kind: 'denied', action: 'ce:GetCostAndUsage' })
    expect(
      classifyCliError(
        'aws',
        result({ stderr: 'Could not connect to the endpoint URL: "https://x"' }),
      ),
    ).toEqual({ kind: 'offline' })
  })

  it('keeps only a redacted first line of what it does not know', () => {
    const problem = classifyCliError(
      'aws',
      result({
        stderr: '\n\naws: [ERROR]: odd thing for 123456789012 me@example.com\nsecond line',
      }),
    )
    expect(problem).toEqual({ kind: 'error', text: 'odd thing for •••••••••••• •••@•••' })
  })
})

describe('redactCliText', () => {
  it('hides ARNs, account ids, e-mail addresses, access key ids and GitHub tokens', () => {
    const text = redactCliText(
      'arn:aws:iam::123456789012:user/aki 123456789012 aki@example.co.jp AKIAABCDEFGHIJKLMNOP ghp_abcdefghijklmnop1234 github_pat_11ABCDEFG0123456789',
    )
    expect(text).toBe('arn:… •••••••••••• •••@••• AKIA•••• ghp_•••• github_pat_••••')
  })
})

describe('signInCommand', () => {
  it('tells each way out, and nothing for a problem that is not a sign-in', () => {
    expect(signInCommand({ kind: 'signed-out', via: 'login' }, 'dev')).toBe(
      'aws login --profile=dev',
    )
    expect(signInCommand({ kind: 'signed-out', via: 'sso' }, 'dev')).toBe(
      'aws sso login --profile=dev',
    )
    expect(signInCommand({ kind: 'signed-out', via: 'gh' }, 'github.com')).toBe('gh auth login')
    expect(signInCommand({ kind: 'offline' }, 'dev')).toBeNull()
  })
})

describe('staggerMs and backoffMs', () => {
  it('starts a probe the same little while after its boundary, within a quarter and five minutes', () => {
    expect(staggerMs('queue', 5 * MINUTE)).toBe(staggerMs('queue', 5 * MINUTE))
    for (const id of ['auth', 'rate', 'inbox', 'queue', 'repos', 'runs', 'traffic']) {
      const ms = staggerMs(id, 5 * MINUTE)
      expect(ms).toBeGreaterThanOrEqual(0)
      expect(ms).toBeLessThan(75_000)
      expect(ms % 1000).toBe(0)
      expect(staggerMs(id, 24 * 60 * MINUTE)).toBeLessThan(5 * MINUTE)
    }
    expect(staggerMs('x', 1000)).toBe(0)
  })

  it('waits 1, 2, 4 … minutes after failures, thirty at most', () => {
    expect([0, 1, 2, 3, 6, 20].map(backoffMs)).toEqual([
      0,
      MINUTE,
      2 * MINUTE,
      4 * MINUTE,
      30 * MINUTE,
      30 * MINUTE,
    ])
    expect(isDue(null, MINUTE, 0)).toBe(true)
    expect(isDue(1000, MINUTE, 1000 + MINUTE - 1)).toBe(false)
  })
})

describe('findExecutable', () => {
  const has =
    (...files: string[]) =>
    (file: string) =>
      files.includes(file)

  it('takes absolute PATH entries only: a relative one is a place to plant a program', () => {
    const env = { PATH: '.;bin;"C:\\Tools\\gh";C:\\Windows' }
    expect(findExecutable('gh', env, 'win32', has('bin\\gh.exe', '.\\gh.exe'))).toBeNull()
    expect(findExecutable('gh', env, 'win32', has('C:\\Tools\\gh\\gh.exe'))).toBe(
      'C:\\Tools\\gh\\gh.exe',
    )
  })

  it("finds AWS CLI's per-user install, which puts nothing on PATH", () => {
    const env = { PATH: 'C:\\Windows', LOCALAPPDATA: 'C:\\Users\\a\\AppData\\Local' }
    expect(
      findExecutable(
        'aws',
        env,
        'win32',
        has('C:\\Users\\a\\AppData\\Local\\Programs\\Amazon\\AWSCLIV2\\aws.exe'),
      ),
    ).toBe('C:\\Users\\a\\AppData\\Local\\Programs\\Amazon\\AWSCLIV2\\aws.exe')
  })

  it('reads a POSIX PATH', () => {
    expect(findExecutable('gh', { PATH: 'bin:/opt/x' }, 'linux', has('/opt/x/gh'))).toBe(
      '/opt/x/gh',
    )
  })
})

describe('cliEnv and fixedFlags', () => {
  it('turns prompts, pagers and colour off, drops the region variables and holds gh to github.com', () => {
    const aws = cliEnv('aws', { AWS_REGION: 'x', AWS_DEFAULT_REGION: 'y', HOME: '/h' })
    expect(aws.AWS_REGION).toBeUndefined()
    expect(aws.AWS_DEFAULT_REGION).toBeUndefined()
    expect(aws).toMatchObject({
      HOME: '/h',
      AWS_PAGER: '',
      AWS_CLI_AUTO_PROMPT: 'off',
      PYTHONUTF8: '1',
    })
    expect(cliEnv('gh', { GH_HOST: 'ghe.example.com' })).toMatchObject({
      GH_HOST: 'github.com',
      GH_PROMPT_DISABLED: '1',
      GH_PAGER: '',
    })
    expect(fixedFlags('aws')).toEqual(
      expect.arrayContaining(['--output', 'json', '--no-cli-pager']),
    )
    expect(fixedFlags('gh')).toEqual([])
  })
})

describe('the ledger', () => {
  const at = Date.UTC(2026, 10, 8, 12)
  const entry = (over: Partial<LedgerEntry> = {}): LedgerEntry => ({
    probe: 'queue',
    cost: 'free',
    requests: 1,
    ...over,
  })

  it('counts calls, requests, 304s and failures per probe, and paid requests with their price', () => {
    let state = emptyLedger(at)
    state = recordReading(state, entry({ requests: 3 }), at)
    state = recordReading(state, entry({ notModified: 1 }), at)
    state = recordReading(
      state,
      entry({
        probe: 'cost',
        cost: { setting: 'aws.costExplorer', perRequestUsd: 0.01 },
        failed: true,
      }),
      at,
    )
    expect(state.today.queue).toEqual({ calls: 2, requests: 4, notModified: 1, failed: 0 })
    expect(state.paidRequests).toBe(1)
    const summary = summarize(state, [
      { id: 'queue', every: MINUTE, cost: 'free' },
      { id: 'cost', every: MINUTE, cost: { setting: 'aws.costExplorer', perRequestUsd: 0.01 } },
    ])
    expect(summary).toMatchObject({
      requests: 5,
      free: 4,
      notModified: 1,
      paidRequests: 1,
      paidUsd: 0.01,
    })
  })

  it('counts the on-demand readings (HISTORY, a repository inside) in the day, with no period', () => {
    const state = recordReading(emptyLedger(at), entry({ probe: 'history', requests: 2 }), at)
    const summary = summarize(state, [{ id: 'queue', every: MINUTE, cost: 'free' }])
    expect(summary).toMatchObject({ requests: 2, free: 2 })
    expect(summary.probes).toContainEqual({ id: 'history', every: 0, cost: 'free', requests: 2 })
  })

  it('starts the day again on a new local day, and the paid counts on a new UTC month', () => {
    const state = recordReading(
      emptyLedger(at),
      entry({ cost: { setting: 'aws.costExplorer', perRequestUsd: 0.01 } }),
      at,
    )
    const nextDay = rollLedger(state, at + 24 * 60 * MINUTE)
    expect(nextDay.today).toEqual({})
    expect(nextDay.paidRequests).toBe(1)
    const nextMonth = rollLedger(state, Date.UTC(2026, 11, 1, 0, 30))
    expect(nextMonth.paidRequests).toBe(0)
    expect(rollLedger(state, at)).toBe(state)
  })

  it('says the worst link word', () => {
    expect(linkOf([], false)).toBe('linking')
    expect(linkOf([null], true)).toBe('linked')
    expect(linkOf([{ kind: 'denied', action: null }], true)).toBe('partial')
    expect(linkOf([{ kind: 'denied', action: null }, { kind: 'timeout' }], true)).toBe('offline')
    expect(linkOf([{ kind: 'throttled' }, { kind: 'signed-out', via: 'gh' }], true)).toBe(
      'signed-out',
    )
    expect(linkOf([{ kind: 'signed-out', via: 'gh' }, { kind: 'no-cli' }], true)).toBe('no-cli')
  })
})

describe('isNotModified', () => {
  it("reads gh's status line, and only gh's", () => {
    const call: CliCall = { tool: 'gh', argv: ['api', '-i'] }
    expect(isNotModified(call, result({ stdout: 'HTTP/2.0 304 Not Modified\r\n\r\n' }))).toBe(true)
    expect(isNotModified(call, result({ stdout: 'HTTP/2.0 200 OK\r\n\r\n{}' }))).toBe(false)
    expect(isNotModified({ tool: 'aws', argv: [] }, result({ stdout: 'HTTP/2.0 304' }))).toBe(false)
  })
})

describe('concurrencyLimit', () => {
  it('runs two at once at most, and the rest as those end', async () => {
    const limit = concurrencyLimit(2)
    let running = 0
    let most = 0
    const ends: (() => void)[] = []
    const work = () =>
      limit(
        () =>
          new Promise<void>((resolve) => {
            running += 1
            most = Math.max(most, running)
            ends.push(() => {
              running -= 1
              resolve()
            })
          }),
      )
    const all = Promise.all([work(), work(), work(), work()])
    await Promise.resolve()
    expect(ends).toHaveLength(2)
    while (ends.length > 0) {
      ends.shift()?.()
      for (let i = 0; i < 5; i++) await Promise.resolve()
    }
    await all
    expect(most).toBe(2)
  })
})

/** A scheduler on a clock that moves only when the test says. */
function harness(answer: (call: CliCall) => CliResult | Promise<CliResult>, slots = 2) {
  let now = Date.UTC(2026, 10, 8, 3, 0, 7)
  const timers = new Map<number, { at: number; fn: () => void }>()
  let next = 1
  const calls: string[] = []
  let changes = 0
  const deps = {
    now: () => now,
    setTimer: (fn: () => void, ms: number) => {
      const id = next++
      timers.set(id, { at: now + ms, fn })
      return id
    },
    clearTimer: (id: unknown) => {
      timers.delete(id as number)
    },
    cli: async (call: CliCall) => {
      calls.push(call.argv.join(' '))
      return answer(call)
    },
    limit: concurrencyLimit(slots),
    record: () => {},
    changed: () => {
      changes += 1
    },
    context: () => ({}),
  }
  const flush = async () => {
    for (let i = 0; i < 40; i++) await Promise.resolve()
  }
  const advance = async (ms: number) => {
    const until = now + ms
    for (;;) {
      const due = [...timers.entries()]
        .filter(([, t]) => t.at <= until)
        .sort((a, b) => a[1].at - b[1].at)[0]
      if (due === undefined) break
      timers.delete(due[0])
      now = due[1].at
      due[1].fn()
      await flush()
    }
    now = until
  }
  return { deps, calls, flush, advance, changes: () => changes, timers }
}

const probe = (
  id: string,
  over: Partial<Probe<object, unknown>> = {},
  run: Probe<object, unknown>['run'] = async (_ctx, cli) => {
    const answer = await cli({ tool: 'gh', argv: [id] })
    return answer.ok ? answer.stdout : null
  },
): Probe<object, unknown> => ({ id, every: 5 * MINUTE, cost: 'free', run, ...over })

describe('ProbeScheduler', () => {
  it('reads every probe when started, and on its boundary after that', async () => {
    const h = harness(() => result({ ok: true, code: 0, stdout: 'x' }))
    const s = new ProbeScheduler(h.deps, [probe('a'), probe('b')])
    s.start()
    await h.flush()
    expect(h.calls).toEqual(['a', 'b'])
    expect(s.outcome('a')).toMatchObject({ value: 'x', problem: null })
    await h.advance(5 * MINUTE + 80_000)
    // Each starts its own little while after the boundary (staggerMs), so in either order.
    expect(h.calls.slice(2).sort()).toEqual(['a', 'b'])
    s.stop()
    expect(h.timers.size).toBe(0)
  })

  it('stops the board for a missing CLI or a sign-in, until REFRESH', async () => {
    let signedIn = false
    const h = harness(() =>
      signedIn
        ? result({ ok: true, code: 0, stdout: 'x' })
        : result({ stderr: 'gh: Bad credentials (HTTP 401)' }),
    )
    const s = new ProbeScheduler(h.deps, [probe('a')])
    s.start()
    await h.flush()
    expect(s.halted).toBe(true)
    await h.advance(60 * MINUTE)
    expect(h.calls).toEqual(['a'])
    signedIn = true
    s.refresh()
    await h.flush()
    expect(s.halted).toBe(false)
    expect(s.outcome('a').value).toBe('x')
  })

  it('waits longer after each failure', async () => {
    const h = harness(() => result({ stderr: 'API rate limit exceeded' }))
    const s = new ProbeScheduler(h.deps, [probe('a', { every: MINUTE })])
    s.start()
    await h.flush()
    // Failed once: the next minute's boundary is too early for the one-minute wait to be over
    // only when it falls less than a minute after; two failures make it two minutes.
    await h.advance(3 * MINUTE)
    const after = h.calls.length
    await h.advance(3 * MINUTE)
    expect(h.calls.length - after).toBeLessThanOrEqual(2)
    expect(s.outcome('a').problem).toEqual({ kind: 'throttled' })
  })

  it('keeps the value on a 304, and counts the look as fresh', async () => {
    let first = true
    const h = harness(() => {
      if (first) {
        first = false
        return result({ ok: true, code: 0, stdout: 'HTTP/2.0 200 OK\r\n\r\nv' })
      }
      return result({ stdout: 'HTTP/2.0 304 Not Modified\r\n\r\n' })
    })
    const s = new ProbeScheduler(h.deps, [
      probe('a', {}, async (_ctx, cli) => {
        const answer = await cli({ tool: 'gh', argv: ['a'] })
        return answer.ok ? answer.stdout : null
      }),
    ])
    s.start()
    await h.flush()
    const firstAt = s.outcome('a').at
    await h.advance(6 * MINUTE + 80_000)
    expect(s.outcome('a').value).toBe('HTTP/2.0 200 OK\r\n\r\nv')
    expect(s.outcome('a').problem).toBeNull()
    expect(s.outcome('a').at).toBeGreaterThan(firstAt ?? 0)
  })

  it('a tolerated refusal sets no problem, yet names the operation refused', async () => {
    const h = harness(() =>
      result({
        stderr: 'User: arn:x is not authorized to perform: guardduty:ListDetectors on resource: *',
      }),
    )
    const s = new ProbeScheduler(h.deps, [
      probe('a', {}, async (_ctx, cli) => {
        await cli({ tool: 'aws', argv: ['a'], tolerated: true })
        return {}
      }),
    ])
    s.start()
    await h.flush()
    expect(s.outcome('a').problem).toBeNull()
    expect(s.denied()).toEqual(['guardduty:ListDetectors'])
  })

  it('a tolerated failure sets no problem', async () => {
    const h = harness(() => result({ stderr: 'gh: Must have push access (HTTP 403)' }))
    const s = new ProbeScheduler(h.deps, [
      probe('a', {}, async (_ctx, cli) => {
        await cli({ tool: 'gh', argv: ['a'], tolerated: true })
        return {}
      }),
    ])
    s.start()
    await h.flush()
    expect(s.outcome('a').problem).toBeNull()
  })

  it('runs a probe after one without a key once that one has read for the first time', async () => {
    const h = harness(() => result({ ok: true, code: 0, stdout: 'ok' }))
    const s = new ProbeScheduler(h.deps, [
      probe('each', { every: 6 * 60 * MINUTE, after: 'first' }),
      probe('first', { every: 15 * MINUTE }),
    ])
    s.start()
    await h.flush()
    expect(h.calls).toEqual(['first', 'each'])
    await h.advance(19 * MINUTE)
    expect(h.calls).toEqual(['first', 'each', 'first'])
  })

  it('runs a probe after the one it reads for: first once that one has read, then when its key changes', async () => {
    let list = 'r1'
    const h = harness((call) =>
      call.argv[0] === 'list'
        ? result({ ok: true, code: 0, stdout: list })
        : result({ ok: true, code: 0, stdout: 'ok' }),
    )
    const lister = probe('list', { every: 15 * MINUTE, keyOf: (value) => String(value) })
    const each = probe('each', { every: 6 * 60 * MINUTE, after: 'list' })
    // The dependent comes first in the table: it must still wait for the list.
    const s = new ProbeScheduler(h.deps, [each, lister])
    s.start()
    await h.flush()
    expect(h.calls).toEqual(['list', 'each'])
    // The same list again: nothing more for the six-hour probe.
    await h.advance(19 * MINUTE)
    expect(h.calls).toEqual(['list', 'each', 'list'])
    list = 'r1 r2'
    await h.advance(15 * MINUTE)
    expect(h.calls).toEqual(['list', 'each', 'list', 'list', 'each'])
  })

  it('starts no queued call once the board is halted at a sign-in', async () => {
    // One slot: the first answer, signed out, arrives while three more calls wait for it.
    const h = harness(() => result({ stderr: 'gh: Bad credentials (HTTP 401)' }), 1)
    const s = new ProbeScheduler(h.deps, [probe('a'), probe('b'), probe('c'), probe('d')])
    s.start()
    await h.flush()
    expect(s.halted).toBe(true)
    expect(h.calls).toEqual(['a'])
  })

  it('starts no queued call once the board has stopped', async () => {
    let release: (() => void) | null = null
    const h = harness(
      () =>
        new Promise<CliResult>((resolve) => {
          release = () => resolve(result({ ok: true, code: 0, stdout: 'x' }))
        }),
      1,
    )
    const s = new ProbeScheduler(h.deps, [probe('a'), probe('b')])
    s.start()
    await h.flush()
    expect(h.calls).toEqual(['a'])
    s.stop()
    ;(release as (() => void) | null)?.()
    await h.flush()
    expect(h.calls).toEqual(['a'])
  })

  it('a REFRESH during a run reads that probe again, and the old run cannot halt the board', async () => {
    let signedIn = false
    let release: (() => void) | null = null
    const h = harness((call) => {
      if (call.argv[0] === 'slow' && release === null)
        return new Promise<CliResult>((resolve) => {
          release = () => resolve(result({ stderr: 'gh: Bad credentials (HTTP 401)' }))
        })
      return signedIn
        ? result({ ok: true, code: 0, stdout: 'x' })
        : result({ stderr: 'gh: Bad credentials (HTTP 401)' })
    })
    const s = new ProbeScheduler(h.deps, [probe('slow')])
    s.start()
    await h.flush()
    signedIn = true
    s.refresh()
    ;(release as (() => void) | null)?.()
    await h.flush()
    expect(s.halted).toBe(false)
    expect(s.outcome('slow').value).toBe('x')
  })

  it('tries a failed long-period probe again when the backoff is over, not a day later', async () => {
    let fail = true
    const h = harness(() =>
      fail
        ? result({ stderr: 'API rate limit exceeded' })
        : result({ ok: true, code: 0, stdout: 'x' }),
    )
    const s = new ProbeScheduler(h.deps, [probe('daily', { every: 24 * 60 * MINUTE })])
    s.start()
    await h.flush()
    fail = false
    await h.advance(MINUTE + 1000)
    expect(h.calls).toEqual(['daily', 'daily'])
    expect(s.outcome('daily').value).toBe('x')
  })

  it('reads a probe again once its old run ends, when the pane was put away and shown again while it ran', async () => {
    // The pane went behind a tab and came back while a probe waited for its answer: the old
    // run's calls are dropped, and the probe was left unread until its next boundary (a day).
    let release: (() => void) | null = null
    const h = harness((call) => {
      if (call.argv[0] === 'slow' && release === null)
        return new Promise<CliResult>((resolve) => {
          release = () => resolve(result({ ok: true, code: 0, stdout: 'old' }))
        })
      return result({ ok: true, code: 0, stdout: 'x' })
    }, 1)
    const s = new ProbeScheduler(h.deps, [
      probe('slow', { every: 24 * 60 * MINUTE }),
      probe('queued', { every: 24 * 60 * MINUTE }),
      probe('after', { every: 24 * 60 * MINUTE, after: 'queued' }),
    ])
    s.start()
    await h.flush()
    expect(h.calls).toEqual(['slow'])
    s.stop()
    s.start()
    ;(release as (() => void) | null)?.()
    await h.flush()
    // The one waiting for a slot was dropped and is read now; so is the one after it.
    expect(s.outcome('queued').value).toBe('x')
    expect(s.outcome('after').value).toBe('x')
    // The one whose call had started answered: it stands, read once.
    expect(s.outcome('slow').value).toBe('old')
    expect(h.calls.filter((c) => c === 'slow')).toHaveLength(1)
  })

  it('does not read again on a boundary a few seconds after it read', async () => {
    const h = harness(() => result({ ok: true, code: 0, stdout: 'x' }))
    const s = new ProbeScheduler(h.deps, [probe('a', { every: 15 * MINUTE })])
    // The harness starts at 03:00:07; move to 03:14:58, just before the 03:15 boundary.
    await h.advance(14 * MINUTE + 51_000)
    s.start()
    await h.flush()
    expect(h.calls).toEqual(['a'])
    await h.advance(5 * MINUTE)
    expect(h.calls).toEqual(['a'])
    // The next boundary reads it, as ever.
    await h.advance(15 * MINUTE)
    expect(h.calls).toEqual(['a', 'a'])
    s.stop()
  })

  it('reads a daily probe again at the next midnight, though the pane was shown that afternoon', async () => {
    // Half a period was once the window: a reading at 13:00 skipped midnight and stood 35 hours.
    const h = harness(() => result({ ok: true, code: 0, stdout: 'x' }))
    const s = new ProbeScheduler(h.deps, [probe('a', { every: 24 * 60 * MINUTE })])
    // The harness starts at 03:00:07; move to the afternoon.
    await h.advance(10 * 60 * MINUTE)
    s.start()
    await h.flush()
    expect(h.calls).toEqual(['a'])
    // Past midnight and its stagger (at most five minutes), not the next midnight.
    await h.advance(11 * 60 * MINUTE + 10 * MINUTE)
    expect(h.calls).toEqual(['a', 'a'])
    s.stop()
  })

  it('counts every 304 of a reading, and nothing for a reading that started no CLI', async () => {
    const entries: LedgerEntry[] = []
    let calls = 0
    const h = harness(() => {
      calls += 1
      return result({ stdout: 'HTTP/2.0 304 Not Modified\r\n\r\n' })
    })
    const s = new ProbeScheduler({ ...h.deps, record: (entry) => entries.push(entry) }, [
      probe('three', {}, async (_ctx, cli) => {
        for (const part of ['a', 'b', 'c']) await cli({ tool: 'gh', argv: ['api', '-i', part] })
        return null
      }),
      probe('kept', {}, async () => 'from the store'),
    ])
    s.start()
    await h.flush()
    expect(calls).toBe(3)
    expect(entries).toEqual([
      { probe: 'three', cost: 'free', requests: 3, notModified: 3, failed: false },
    ])
  })

  it('hands a probe its last good value, so a failing part can keep what it had', async () => {
    const seen: unknown[] = []
    const h = harness(() => result({ ok: true, code: 0, stdout: 'x' }))
    const s = new ProbeScheduler(h.deps, [
      probe('a', {}, async (_ctx, cli, previous) => {
        seen.push(previous)
        await cli({ tool: 'gh', argv: ['a'] })
        return 'v'
      }),
    ])
    s.start()
    await h.flush()
    s.runNow('a')
    await h.flush()
    expect(seen).toEqual([null, 'v'])
  })
})

describe('RESOURCES in the shared core (aws.md §14.4)', () => {
  it("sends a region without the service to not-offered, not OFFLINE, and the network's failure to OFFLINE still", () => {
    const text = (host: string) => `Could not connect to the endpoint URL: "https://${host}/"`
    for (const service of ['bedrock', 'bedrock-agent', 'bedrock-agentcore-control', 'aoss'])
      expect(
        classifyCliError(
          'aws',
          result({ stderr: text(`${service}.ap-northeast-1.amazonaws.com`) }),
        ),
      ).toEqual({
        kind: 'not-offered',
        service,
      })
    expect(
      classifyCliError('aws', result({ stderr: text('ec2.ap-northeast-1.amazonaws.com') })),
    ).toEqual({ kind: 'offline' })
    expect(classifyCliError('aws', result({ stderr: text('sts.amazonaws.com') }))).toEqual({
      kind: 'offline',
    })
    // Not a problem for the link word: the board is linked, not PARTIAL nor OFFLINE.
    expect(linkOf([{ kind: 'not-offered', service: 'bedrock' }], true)).toBe('linked')
  })

  it('counts a metered-tiny call on its own, and a price by the metric outside the requests', () => {
    const at = Date.UTC(2026, 10, 8, 12)
    const tiny = { metered: 'tiny' as const, monthlyCap: 31, decided: '2026-11-08' }
    const gmd = { setting: 'aws.getMetricData', perMetricUsd: 0.00001 }
    let state = recordReading(emptyLedger(at), { probe: 'buckets', cost: tiny, requests: 1 }, at)
    state = recordReading(state, { probe: 'gmd', cost: gmd, requests: 3 }, at)
    expect(state.paidRequests).toBe(0)
    expect(
      summarize(state, [
        { id: 'buckets', every: MINUTE, cost: tiny },
        { id: 'gmd', every: MINUTE, cost: gmd },
      ]),
    ).toMatchObject({ requests: 4, meteredTiny: 1, paidRequests: 0, paidMetrics: 0, paidNotes: [] })
  })

  it('starts a waiting first call before any later one', async () => {
    const limit = concurrencyLimit(1)
    const order: string[] = []
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const all = [
      limit(() => gate),
      limit(async () => void order.push('later-1'), 'later'),
      limit(async () => void order.push('later-2'), 'later'),
      limit(async () => void order.push('first'), 'first'),
    ]
    release()
    await Promise.all(all)
    expect(order).toEqual(['first', 'later-1', 'later-2'])
  })

  it("gives a probe without `first` the scheduler's queue, and a `first` one the first", async () => {
    const h = harness(() => result({ ok: true, code: 0, stdout: 'x' }))
    const seen: string[] = []
    const limit = h.deps.limit
    const s = new ProbeScheduler(
      {
        ...h.deps,
        priority: 'later',
        limit: (work, priority) => {
          seen.push(priority ?? 'none')
          return limit(work, priority)
        },
      },
      [probe('alarms', { first: true }), probe('stacks')],
    )
    s.start()
    await h.flush()
    expect(seen).toEqual(['first', 'later'])
  })

  it('runs bulk readings one at a time, the counts before the judgements, which wait for every count', async () => {
    const h = harness(() => result({ ok: true, code: 0, stdout: 'x' }))
    let running = 0
    let most = 0
    const order: string[] = []
    const ends: (() => void)[] = []
    const slow =
      (id: string): Probe<object, unknown>['run'] =>
      async (_ctx, cli) => {
        running += 1
        most = Math.max(most, running)
        order.push(id)
        await new Promise<void>((resolve) => ends.push(resolve))
        running -= 1
        return (await cli({ tool: 'aws', argv: [id] })).stdout
      }
    const s = new ProbeScheduler({ ...h.deps, bulk: concurrencyLimit(1) }, [
      probe('judge', { bulk: 'judge' }, slow('judge')),
      probe('count-1', { bulk: 'count' }, slow('count-1')),
      probe('count-2', { bulk: 'count' }, slow('count-2')),
      probe('other'),
    ])
    s.start()
    await h.flush()
    // The judgement does not even queue before the counts were tried; the others go at once.
    expect(order).toEqual(['count-1'])
    expect(h.calls).toEqual(['other'])
    while (ends.length > 0) {
      ends.shift()?.()
      await h.flush()
    }
    expect(order).toEqual(['count-1', 'count-2', 'judge'])
    expect(most).toBe(1)
  })

  it('a silent call marks nothing, not even PARTIAL, and a region without the service backs nothing off', async () => {
    const denied = result({
      stderr: 'AccessDenied … not authorized to perform: ec2:DescribeInstances',
    })
    const absent = result({
      stderr:
        'Could not connect to the endpoint URL: "https://bedrock.me-central-1.amazonaws.com/"',
    })
    const h = harness((call) => (call.argv[0] === 'sweep' ? denied : absent))
    const s = new ProbeScheduler(h.deps, [
      probe('sweep', {}, async (_ctx, cli) => {
        await cli({ tool: 'aws', argv: ['sweep'], silent: true })
        return 'read'
      }),
      probe('bedrock', {}, async (_ctx, cli) => {
        await cli({ tool: 'aws', argv: ['bedrock'] })
        return 'read'
      }),
    ])
    s.start()
    await h.flush()
    expect(s.denied()).toEqual([])
    expect(s.problems()).toEqual([null, null])
  })
})
