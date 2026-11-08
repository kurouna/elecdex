import { describe, expect, it } from 'vitest'
import { type BillingFile, billingStore } from '../../src/main/aws/billing-store'
import { AwsService } from '../../src/main/aws/service'
import { concurrencyLimit } from '../../src/main/cloud-cli/scheduler'
import { stubAws } from '../../src/main/cloud-cli/stub-aws'
import { awsBoardKey } from '../../src/shared/aws/board'
import { changesSince, idSets } from '../../src/shared/aws/changes'
import { itemUnread } from '../../src/shared/aws/drill'
import { type AwsReadings, emptyReadings } from '../../src/shared/aws/readings'
import { parseTrailRead, TRAIL_MAX } from '../../src/shared/aws/trail'
import type { AwsBoard } from '../../src/shared/aws/types'
import { classifyCliError, PROBLEM_WORDS, problemText } from '../../src/shared/cloud-cli/errors'
import type { CliCall, CliResult } from '../../src/shared/cloud-cli/probe'

/**
 * AWS STATUS's board where part of it is not read: before the first reading, a read refused, a
 * call too slow or too large, a capped trail (docs/aws.md). Each was found in a review of the
 * pane (2026-11-08) and failed before its fix.
 */

const NOW = Date.UTC(2026, 10, 8, 3)
const R = 'ap-northeast-1'
const KEY = awsBoardKey({
  profile: 'default',
  regions: [R, 'us-east-1'],
  activity: true,
  slow: false,
})

const OK: CliResult = {
  ok: true,
  code: 0,
  stdout: '',
  stderr: '',
  missing: false,
  timedOut: false,
  tooLarge: false,
}
const denied = (action: string, operation: string): CliResult => ({
  ...OK,
  ok: false,
  code: 254,
  stderr: `An error occurred (AccessDenied) when calling the ${operation} operation: User: arn:aws:iam::123456789012:user/x is not authorized to perform: ${action}`,
})
const verb = (call: CliCall) => `${call.argv[0]} ${call.argv[1]}`

/**
 * The service on the stand-in AWS CLI, its clock still. `answer` turns the calls it picks; `hold`
 * keeps them waiting until `release`, as a CLI still reading would.
 */
function service(
  options: {
    mode?: string
    answer?: (call: CliCall) => CliResult | null
    hold?: (call: CliCall) => boolean
  } = {},
) {
  const calls: CliCall[] = []
  const boards: AwsBoard[] = []
  let file: BillingFile = {}
  let clock = NOW
  const held: (() => void)[] = []
  /** Until `release`: then the calls it picked answer, and the ones after it at once. */
  let holding = true
  const stub = stubAws(options.mode ?? 'demo')
  const answer = (call: CliCall) => {
    const own = options.answer?.(call)
    return own === undefined || own === null ? stub(call) : Promise.resolve(own)
  }
  const aws = new AwsService({
    cli: (call) => {
      calls.push(call)
      if (!holding || options.hold?.(call) !== true) return answer(call)
      return new Promise((resolve) => held.push(() => resolve(answer(call))))
    },
    limit: concurrencyLimit(4),
    billing: billingStore({ load: () => file, save: (next) => (file = next) }, () => clock),
    now: () => clock,
    setTimer: () => 0,
    clearTimer: () => {},
    publish: (board) => boards.push(board),
    incidents: () => [],
    alert: () => {},
    cliVersion: () => '2.39.6',
    executable: () => 'stub',
    startedAt: NOW,
  })
  const flush = async () => {
    for (let i = 0; i < 20_000; i++) await Promise.resolve()
  }
  return {
    aws,
    calls,
    flush,
    last: () => boards.at(-1),
    release: () => {
      holding = false
      for (const go of held.splice(0)) go()
    },
    later: (ms: number) => {
      clock += ms
    },
  }
}

describe('an item asked for before it is read', () => {
  it('is "unread", never gone, until the instances answer; then it is there, and one not there is gone', async () => {
    // A drill kept over a restart asked for its item before the first reading: main answered
    // null, the page said "gone since" and went up a step.
    const s = service({ hold: (call) => verb(call) === 'ec2 describe-instances' })
    s.aws.watch(KEY)
    await s.flush()
    expect(s.last()?.readAt).not.toBeNull()
    expect(s.aws.item(KEY, 'ec2', 'i-0a1b2c3d4e5f60003', R)).toBe('unread')
    expect(s.aws.item(KEY, 'ec2', 'i-0a1b2c3d4e5f60003')).toBe('unread')
    // What is read already is answered at once, and one gone from it is gone.
    expect(s.aws.item(KEY, 'stacks', 'no-such-stack', R)).toBeNull()
    s.release()
    await s.flush()
    expect(s.aws.item(KEY, 'ec2', 'i-0a1b2c3d4e5f60003', R)).toMatchObject({
      id: 'i-0a1b2c3d4e5f60003',
    })
    expect(s.aws.item(KEY, 'ec2', 'i-gone', R)).toBeNull()
    // HISTORY reads nothing for an item not read.
    expect(await s.aws.history(KEY, 'ec2', 'i-gone', R)).toBeNull()
  })

  it('is gone, not "not read yet" for good, once its reading was tried and refused', async () => {
    // A service refused (or failing) in a region never answers there: the item waited "not read
    // yet" forever, where it used to be "gone since".
    const s = service({
      answer: (call) =>
        verb(call) === 'ec2 describe-instances'
          ? denied('ec2:DescribeInstances', 'DescribeInstances')
          : null,
    })
    s.aws.watch(KEY)
    await s.flush()
    expect(s.aws.item(KEY, 'ec2', 'i-0a1b2c3d4e5f60003', R)).toBeNull()
    expect(s.aws.item(KEY, 'ec2', 'i-0a1b2c3d4e5f60003')).toBeNull()
  })

  it('is gone in a region taken out of the pane, once the board has read', async () => {
    // ELSEWHERE off, or the region removed in ⚙: nothing reads it again.
    const s = service()
    s.aws.watch(KEY)
    await s.flush()
    expect(s.aws.item(KEY, 'ec2', 'i-0a1b2c3d4e5f60003', 'eu-central-2')).toBeNull()
  })

  it.each([
    ['s3', 'eu-west-1'],
    ['s3', 'ap-northeast-1'],
    ['cloudfront', 'us-east-1'],
    ['route53', 'us-east-1'],
  ] as const)(
    'of a service read for the whole account (%s in %s) waits for that one reading, whatever its region',
    (service, region) => {
      // A bucket's row carries its own region, CloudFront's and Route 53's us-east-1: outside
      // the pane's regions they took the sweep's branch, and with the sweep off were "gone"
      // though the account's list was never tried.
      const r: AwsReadings = { ...emptyReadings(NOW, ['ap-northeast-2']) }
      r.res = { ...r.res, sweepOn: false }
      expect(itemUnread(service, r, region, (reading) => reading === 'sweep')).toBe(true)
      // Tried and still not read (refused, failing): gone, never "not read yet" for good.
      expect(itemUnread(service, r, region, () => true)).toBe(false)
      r.res = { ...r.res, sweepOn: true }
      expect(itemUnread(service, r, region, () => true)).toBe(false)
    },
  )

  it("of an ACM certificate in us-east-1 outside the pane's regions waits for the certificates", () => {
    // The certificates probe reads us-east-1 for CloudFront's whatever the pane shows; the item
    // took the sweep's branch and, with the sweep on but not yet answered for the region, or off,
    // was "unread" or "gone" by the sweep, before the certificates were tried.
    const r: AwsReadings = { ...emptyReadings(NOW, ['eu-west-1']) }
    for (const sweepOn of [false, true]) {
      r.res = { ...r.res, sweepOn }
      expect(itemUnread('acm', r, 'us-east-1', (reading) => reading === 'sweep')).toBe(true)
      expect(itemUnread('acm', r, 'us-east-1', (reading) => reading === 'list')).toBe(false)
    }
    // Read there: found or gone by that reading, never the sweep's.
    r.certificates = { 'us-east-1': [] }
    expect(itemUnread('acm', r, 'us-east-1', () => false)).toBe(false)
  })

  it("names a probe of the board's own table for every service", async () => {
    const { BOARD_PROBES, LIST_PROBE } = await import('../../src/main/aws/service')
    const ids = new Set(BOARD_PROBES.map((probe) => probe.id))
    for (const [service, probe] of Object.entries(LIST_PROBE))
      expect([service, ids.has(probe)]).toEqual([service, true])
  })
})

describe('ACCOUNT without the credential report', () => {
  it('keeps "not read" apart from "none": a refused report is no all-clear', async () => {
    const s = service({
      answer: (call) =>
        verb(call) === 'iam get-credential-report' ||
        verb(call) === 'iam generate-credential-report'
          ? denied('iam:GenerateCredentialReport', 'GenerateCredentialReport')
          : null,
    })
    s.aws.watch(KEY)
    await s.flush()
    expect(s.last()?.accountView).toMatchObject({
      credentialReport: false,
      mfaLessUsers: null,
      oldKeys: null,
    })
    const read = service()
    read.aws.watch(KEY)
    await read.flush()
    expect(read.last()?.accountView.credentialReport).toBe(true)
    expect(Array.isArray(read.last()?.accountView.mfaLessUsers)).toBe(true)
  })
})

describe('the billing metric', () => {
  const billing = (call: CliCall) => call.argv.includes('AWS/Billing')

  it('is neither there nor off before it is read, or when it is refused; off only when it said so', async () => {
    // "billing alerts off" showed in the top row and on COST before any reading, and when the
    // reading was refused or offline.
    const waiting = service({ hold: billing })
    waiting.aws.watch(KEY)
    await waiting.flush()
    expect(waiting.last()?.cost.billing).toBeNull()
    const refused = service({
      answer: (call) =>
        billing(call) ? denied('cloudwatch:GetMetricStatistics', 'GetMetricStatistics') : null,
    })
    refused.aws.watch(KEY)
    await refused.flush()
    expect(refused.last()?.cost.billing).toBeNull()
    const off = service({ mode: 'nobilling' })
    off.aws.watch(KEY)
    await off.flush()
    expect(off.last()?.cost.billing).toBe(false)
    const on = service()
    on.aws.watch(KEY)
    await on.flush()
    expect(on.last()?.cost.billing).toBe(true)
  })
})

describe("Cost Explorer's monthly cap", () => {
  it('changes the cap alone, leaving an unasked account asked and not answered', async () => {
    // ⚙'s Monthly cap sent "off" with the cap, which answered KEEP OFF without the question.
    const s = service()
    s.aws.watch(KEY)
    await s.flush()
    expect(s.last()?.cost.ce).toMatchObject({ state: 'unasked', ask: true })
    expect(s.aws.answerCostExplorer(KEY, { cap: 500 })).toBe(true)
    expect(s.last()?.cost.ce).toMatchObject({
      state: 'unasked',
      ask: true,
      cap: 500,
      answeredAt: null,
    })
    // A cap of those offered only, and no frequency without an answer.
    expect(s.aws.answerCostExplorer(KEY, { cap: 7 })).toBe(false)
    expect(s.aws.answerCostExplorer(KEY, { cap: 500, every: 'day' })).toBe(false)
    expect(s.aws.answerCostExplorer(KEY, {})).toBe(false)
    expect(s.aws.answerCostExplorer(KEY, { state: 'off' })).toBe(true)
    expect(s.last()?.cost.ce).toMatchObject({ state: 'off', cap: 500 })
  })
})

describe('one reading too slow or too large', () => {
  const stacks = (call: CliCall) => verb(call) === 'cloudformation list-stacks'

  it('makes the board PARTIAL with words of our own, never OFFLINE or a blank LINK ERROR', async () => {
    // A single timeout turned the whole board OFFLINE; an answer past 4 MB was a LINK ERROR
    // with no words at all.
    const slow = service({
      answer: (call) => (stacks(call) ? { ...OK, ok: false, code: null, timedOut: true } : null),
    })
    slow.aws.watch(KEY)
    await slow.flush()
    expect(slow.last()).toMatchObject({ link: 'partial', problem: PROBLEM_WORDS.timeout })
    const large = service({
      answer: (call) => (stacks(call) ? { ...OK, ok: false, code: null, tooLarge: true } : null),
    })
    large.aws.watch(KEY)
    await large.flush()
    expect(large.last()).toMatchObject({ link: 'partial', problem: PROBLEM_WORDS['too-large'] })
  })

  it('is its own kind, and an error says its own line before them', () => {
    expect(classifyCliError('aws', { ...OK, ok: false, tooLarge: true })).toEqual({
      kind: 'too-large',
    })
    expect(problemText([{ kind: 'too-large' }, null])).toBe(PROBLEM_WORDS['too-large'])
    expect(problemText([{ kind: 'timeout' }, { kind: 'error', text: 'boom' }])).toBe('boom')
    expect(problemText([null, { kind: 'denied', action: null }])).toBeNull()
  })
})

describe("CloudTrail's cap", () => {
  const awsOwn = (i: number) => ({
    id: `e${i}`,
    t: new Date(NOW - i * 60_000).toISOString(),
    n: 'AssumeRole',
    s: 'sts.amazonaws.com',
    u: null,
    e: JSON.stringify({ userIdentity: { type: 'AWSService' } }),
  })

  it("counts the events CloudTrail gave before AWS's own are dropped", () => {
    // Fifty events of AWS's own automation left none, and the band said 24 H as if all were there.
    const read = parseTrailRead(
      JSON.stringify(Array.from({ length: TRAIL_MAX }, (_, i) => awsOwn(i))),
      R,
    )
    expect(read).toEqual({ events: [], capped: true })
    expect(parseTrailRead(JSON.stringify([awsOwn(1)]), R).capped).toBe(false)
  })

  it('marks the board capped when a region gave as many as were asked for', async () => {
    const s = service({
      answer: (call) =>
        verb(call) === 'cloudtrail lookup-events' &&
        call.argv.includes('AttributeKey=ReadOnly,AttributeValue=false')
          ? {
              ...OK,
              stdout: JSON.stringify(Array.from({ length: TRAIL_MAX }, (_, i) => awsOwn(i))),
            }
          : null,
    })
    s.aws.watch(KEY)
    await s.flush()
    expect(s.last()?.activityCapped).toBe(true)
    expect(s.last()?.activity).toEqual([])
  })
})

describe('ACTIVE’s line of what came and went', () => {
  const db = (id: string) =>
    ({ id }) as unknown as NonNullable<AwsReadings['databases'][string]>[number]
  const readings = (databases: AwsReadings['databases']): AwsReadings => ({
    ...emptyReadings(NOW, [R, 'us-east-1']),
    databases,
  })

  it('tells one name in two regions apart, so one of them going is a change', () => {
    // Keyed by id alone, the copy left in the other region hid the one that went.
    const first = idSets(readings({ [R]: [db('orders')], 'us-east-1': [db('orders')] }))
    const now = idSets(readings({ [R]: [db('orders')], 'us-east-1': [] }))
    expect(changesSince(first, now, NOW)?.parts).toEqual([
      { service: 'rds', added: [], removed: ['orders'] },
    ])
  })
})

describe("ELSEWHERE's check now", () => {
  const swept = (calls: CliCall[]) => calls.filter((call) => call.silent === true).length

  it('reads the other regions once while ELSEWHERE is off, and leaves it off', async () => {
    // The press turned the weekly sweep on for good.
    const s = service()
    s.aws.watch(KEY)
    await s.flush()
    s.aws.sweep(KEY, 'off')
    await s.flush()
    const before = swept(s.calls)
    s.later(1000)
    expect(s.aws.sweep(KEY, 'now')).toBe(30_000)
    await s.flush()
    expect(swept(s.calls)).toBeGreaterThan(before)
    expect(s.last()?.resources.elsewhere.on).toBe(false)
    expect(s.last()?.resources.elsewhere.regions.length).toBeGreaterThan(0)
    // Read once: the sweep's own turn reads nothing more while it is off.
    const once = swept(s.calls)
    s.later(31_000)
    s.aws.refresh(KEY)
    await s.flush()
    expect(swept(s.calls)).toBe(once)
    // OFF forgets the press: nothing of the other regions is shown.
    s.aws.sweep(KEY, 'off')
    await s.flush()
    expect(s.last()?.resources.elsewhere.regions).toEqual([])
  })
})
