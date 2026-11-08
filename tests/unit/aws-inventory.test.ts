import { describe, expect, it } from 'vitest'
import { DRILL } from '../../src/shared/aws/drill'
import { changes7d, GROUPS, memoryAfter, resourcesView } from '../../src/shared/aws/inventory'
import { TILE } from '../../src/shared/aws/labels'
import { type AwsReadings, emptyReadings } from '../../src/shared/aws/readings'
import {
  emptyMemory,
  emptyResourceReadings,
  type ResourceReadings,
} from '../../src/shared/aws/resource-readings'
import { allResources, SERVICES } from '../../src/shared/aws/resources'

/** RESOURCES' first step (aws.md §14.2): tiles, groups, Also here, ELSEWHERE, NEW 7 D, memory. */

const DAY = 86_400_000
const NOW = Date.UTC(2026, 10, 8, 3)
const R = 'ap-northeast-1'
const iso = (at: number) => new Date(at).toISOString()

const readings = (
  over: Partial<Omit<AwsReadings, 'res'>> = {},
  res: Partial<ResourceReadings> = {},
): AwsReadings => ({
  ...emptyReadings(NOW, [R]),
  ...over,
  res: { ...emptyResourceReadings(), ...res },
})

const view = (r: AwsReadings, denied: string[] = []) =>
  resourcesView(r, { denied, perMetricUsd: 0.00001 })

const volume = (id: string, state: string, size = 100) => ({
  id,
  size,
  type: 'gp3',
  state,
  iops: null,
  at: state === 'in-use' ? 'i-1' : null,
  created: null,
  name: null,
})

describe('the tiles', () => {
  it('has a label, a group, a drill-down and a reading for every service', () => {
    const grouped = new Set(GROUPS.flatMap((g) => g.services))
    for (const service of SERVICES) {
      expect(TILE[service].label, service).not.toBe('')
      expect(DRILL[service], service).toBeDefined()
      expect(
        grouped.has(service) || ['vpc', 'acm', 'stacks', 'alarms'].includes(service),
        service,
      ).toBe(true)
    }
  })

  it('counts, states and frames by forgotten money: warn from $50, danger from $500', () => {
    const r = readings({
      volumes: { [R]: [volume('vol-1', 'in-use'), volume('vol-2', 'available', 300)] },
    })
    const v = view(r)
    const ebs = v.groups.flatMap((g) => g.tiles).find((t) => t.service === 'ebs')
    expect(ebs).toMatchObject({
      count: 2,
      noun: 'volumes',
      forgottenBilled: 1,
      forgottenQuiet: 0,
      frame: null,
      regions: [R],
    })
    expect(ebs?.segments.map((s) => [s.tone, s.n])).toEqual([
      ['ok', 1],
      ['warn', 1],
    ])
    const dear = view(readings({ volumes: { [R]: [volume('vol-3', 'available', 600)] } }))
    expect(dear.groups[0]?.tiles[0]?.frame).toBe('warn')
    const dearer = view(readings({ volumes: { [R]: [volume('vol-4', 'available', 6000)] } }))
    expect(dearer.groups[0]?.tiles[0]?.frame).toBe('danger')
  })

  it('orders the groups by forgotten money, the fixed order breaking ties', () => {
    const r = readings({
      volumes: { [R]: [volume('vol-1', 'available', 300)] },
      functions: { [R]: [{ name: 'f', runtime: null, memory: null, modified: null }] },
      nats: {
        [R]: [{ id: 'nat-1', state: 'available', vpc: null, connectivity: null, name: null }],
      },
    })
    expect(view(r).groups.map((g) => g.group)).toEqual(['STORAGE', 'COMPUTE', 'NETWORK'])
  })

  it('says what was read and is empty, what is still to come, what was refused and where a service is not offered', () => {
    const r = readings(
      {},
      {
        ddb: { [R]: { names: [], tables: [] } },
        bedrock: {
          [R]: {
            offered: false,
            pts: [],
            custom: [],
            imported: [],
            guardrails: [],
            agents: [],
            kbs: [],
            runtimes: [],
            profiles: [],
          },
        },
      },
    )
    const v = view(r, ['sqs:ListQueues'])
    expect(v.none).toContain('dynamodb')
    expect(v.none).toContain('bedrock')
    expect(v.pending).toContain('logs')
    expect(v.pending).not.toContain('sqs')
    expect(v.denied).toEqual([{ service: 'sqs', actions: ['sqs:ListQueues'] }])
    expect(v.notOffered).toEqual([{ service: 'bedrock', regions: [R] }])
    expect(v.judging).toBe(true)
  })

  it('puts the free ledger kinds in one line under the tiles', () => {
    const r = readings(
      {
        stacks: {
          [R]: [
            { name: 'a', status: 'UPDATE_ROLLBACK_FAILED', at: null, drift: null },
            { name: 'b', status: 'CREATE_COMPLETE', at: null, drift: null },
          ],
        },
      },
      {
        vpcs: { [R]: [{ id: 'vpc-1', d: true }] },
        alarmsAll: { [R]: [{ n: 'x', s: 'ALARM', ns: null, d: null, v: null }] },
      },
    )
    expect(view(r).alsoHere).toEqual([
      { service: 'vpc', count: 1, noun: 'VPCs', note: null },
      { service: 'stacks', count: 2, noun: 'stacks', note: '1 failed' },
      { service: 'alarms', count: 1, noun: 'alarms', note: '1 in ALARM' },
    ])
    expect(
      view(r)
        .groups.flatMap((g) => g.tiles)
        .map((t) => t.service),
    ).toEqual([])
  })

  it('sums what the sweep found by region, and nothing when it is off', () => {
    const sweep = {
      'us-west-2': {
        instances: [
          { id: 'i-9', type: 't3.medium', s: 'running', l: null },
          { id: 'i-8', type: 't3.medium', s: 'stopped', l: null },
        ],
        volumes: [{ id: 'v', g: 10, t: 'gp3', s: 'available' }],
        nats: [],
        addresses: [],
      },
      'eu-west-1': { instances: [], volumes: [], nats: [], addresses: [] },
    }
    expect(view(readings({}, { sweep, sweepAt: NOW })).elsewhere).toEqual({
      on: true,
      readAt: NOW,
      regions: [
        {
          region: 'us-west-2',
          parts: [
            { service: 'ec2', count: 1, text: '1 EC2 running' },
            { service: 'ebs', count: 1, text: '1 volume' },
          ],
        },
      ],
    })
  })
})

describe('NEW 7 D and the memory', () => {
  it("does not count the day elecdex first read a kind, counts a creation date, and folds a function's own log group", () => {
    const memory = {
      ...emptyMemory(),
      firstAt: { logs: NOW - 20 * DAY, lambda: NOW - 20 * DAY },
      seen: {
        [`logs:${R}:/aws/lambda/new`]: NOW - 2 * DAY,
        [`lambda:${R}:new`]: NOW - 2 * DAY,
        [`logs:${R}:old`]: NOW - 20 * DAY,
      },
    }
    const r = readings(
      { functions: { [R]: [{ name: 'new', runtime: null, memory: null, modified: NOW }] } },
      {
        memory,
        logGroups: {
          [R]: [
            ['/aws/lambda/new', null, 7, 0, null],
            ['old', null, 7, 0, null],
            ['created', NOW - 3 * DAY, 7, 0, null],
          ],
        },
      },
    )
    expect(changes7d(r, allResources(r)).added.map((a) => `${a.service}:${a.id}`)).toEqual([
      'lambda:new',
      'logs:created',
    ])
  })

  it('remembers what it saw, marks gone only where the list answered, and forgets the gone after 30 days', () => {
    const before = {
      ...emptyMemory(),
      seen: { [`ebs:${R}:vol-old`]: NOW - 40 * DAY, [`ebs:us-east-1:vol-far`]: NOW - 40 * DAY },
      gone: { [`ebs:${R}:vol-ancient`]: { at: NOW - 31 * DAY, name: 'vol-ancient' } },
    }
    const r = readings({ volumes: { [R]: [volume('vol-new', 'available')] } }, { memory: before })
    const after = memoryAfter(r, before)
    expect(Object.keys(after.seen).sort()).toEqual([`ebs:${R}:vol-new`, 'ebs:us-east-1:vol-far'])
    expect(after.gone).toEqual({ [`ebs:${R}:vol-old`]: { at: NOW, name: 'vol-old' } })
    expect(after.unattached).toEqual({ [`ebs:${R}:vol-new`]: NOW })
    expect(after.firstAt.ebs).toBe(NOW)
  })

  it('keeps "unattached since" until its kind is read again in its region and it is attached', () => {
    const before = {
      ...emptyMemory(),
      unattached: {
        [`ebs:${R}:vol-1`]: NOW - 9 * DAY,
        [`ebs:${R}:vol-2`]: NOW - 9 * DAY,
        'ebs:us-east-1:vol-far': NOW - 9 * DAY,
        [`eip:${R}:eipalloc-1`]: NOW - 9 * DAY,
      },
    }
    // After a restart the volumes and addresses have not read yet: nothing is forgotten.
    expect(memoryAfter(readings({}, { memory: before }), before).unattached).toEqual(
      before.unattached,
    )
    // Read: vol-1 is attached now, vol-2 still loose since its first day; the region not
    // shown and the addresses not read keep theirs.
    const r = readings(
      { volumes: { [R]: [volume('vol-1', 'in-use'), volume('vol-2', 'available')] } },
      { memory: before },
    )
    expect(memoryAfter(r, before).unattached).toEqual({
      [`ebs:${R}:vol-2`]: NOW - 9 * DAY,
      'ebs:us-east-1:vol-far': NOW - 9 * DAY,
      [`eip:${R}:eipalloc-1`]: NOW - 9 * DAY,
    })
  })

  it("marks a bucket gone only when the account's list has it no more, whatever the pane's regions", () => {
    const before = {
      ...emptyMemory(),
      seen: { 's3:us-west-2:far': NOW - 40 * DAY, [`s3:${R}:old`]: NOW - 40 * DAY },
    }
    const r = readings(
      {},
      {
        buckets: [
          ['far', iso(NOW - 900 * DAY), 'us-west-2'],
          ['here', iso(NOW - 900 * DAY), R],
        ],
        memory: before,
      },
    )
    const after = memoryAfter(r, before)
    expect(Object.keys(after.gone)).toEqual([`s3:${R}:old`])
    expect(after.seen['s3:us-west-2:far']).toBe(NOW - 40 * DAY)
  })

  it("stamps a metric's last listing with list-metrics' own time, so a later build changes nothing", () => {
    const listedAt = NOW - 3 * 3_600_000
    const r = readings(
      { functions: { [R]: [{ name: 'f', runtime: null, memory: null, modified: NOW }] } },
      {
        presence: { [R]: { 'AWS/Lambda Invocations': [[{ Name: 'FunctionName', Value: 'f' }]] } },
        presenceAt: { [R]: listedAt },
      },
    )
    const once = memoryAfter(r, emptyMemory())
    expect(Object.values(once.lastMetric)).toEqual([listedAt])
    expect(memoryAfter({ ...r, now: NOW + 60_000 }, once)).toEqual(once)
  })

  it("keeps a bucket's size history: a change starts it again, a wobble does not", () => {
    const r = (bytes: number, s3: Record<string, { bytes: number; since: number }>) =>
      readings(
        { buckets: { [R]: [{ bucket: 'b', storage: 'StandardStorage', bytes }] } },
        { buckets: [['b', iso(NOW - 900 * DAY), R]], memory: { ...emptyMemory(), s3 } },
      )
    const old = { b: { bytes: 1e12, since: NOW - 100 * DAY } }
    expect(memoryAfter(r(1e12 + 1e6, old), r(1e12, old).res.memory).s3.b?.since).toBe(
      NOW - 100 * DAY,
    )
    expect(memoryAfter(r(2e12, old), r(1e12, old).res.memory).s3.b).toEqual({
      bytes: 2e12,
      since: NOW,
    })
    expect(view(r(1e12, old)).forgotten[0]).toMatchObject({
      reason: 'unchanged',
      why: 'unchanged since 07-31 · 931 GB mostly in STANDARD',
    })
  })
})
