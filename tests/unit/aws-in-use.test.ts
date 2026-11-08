import { describe, expect, it } from 'vitest'
import { billingStore } from '../../src/main/aws/billing-store'
import { AwsService } from '../../src/main/aws/service'
import { concurrencyLimit } from '../../src/main/cloud-cli/scheduler'
import { stubAws } from '../../src/main/cloud-cli/stub-aws'
import { awsBoardKey, readAwsPane } from '../../src/shared/aws/board'
import { IN_USE_WORD, inUseWord } from '../../src/shared/aws/in-use'
import { GROUPS, resourcesView } from '../../src/shared/aws/inventory'
import { type AwsReadings, emptyReadings } from '../../src/shared/aws/readings'
import {
  emptyResourceReadings,
  type ResourceReadings,
} from '../../src/shared/aws/resource-readings'
import type { AwsBoard, ResourcesView, ResourceTile } from '../../src/shared/aws/types'

/**
 * CARDS (aws.md §14.12): main counts each service as in use of all, over the pane's regions only,
 * with LOOKS FORGOTTEN's own predicate, so the card's sum always closes:
 * total − in use = forgotten + stopped + quiet + kept.
 */

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

const view = (r: AwsReadings) => resourcesView(r, { denied: [], perMetricUsd: 0.00001 })
const tiles = (v: ResourcesView): ResourceTile[] => v.groups.flatMap((g) => g.tiles)
const tileOf = (v: ResourcesView, service: string) => tiles(v).find((t) => t.service === service)

/** The card's sum: what is not in use is exactly what its foot says. */
function closes(tile: ResourceTile): void {
  const u = tile.use
  expect(u.total - u.inUse, tile.service).toBe(u.forgotten + u.stopped + u.quiet + u.kept)
  expect(u.inUse, tile.service).toBeGreaterThanOrEqual(0)
  expect(
    u.regions.reduce((n, r) => n + r.count, 0),
    tile.service,
  ).toBe(u.total)
}

const instance = (over: Record<string, unknown> = {}) => ({
  id: 'i-1',
  type: 'm6i.large',
  state: 'running',
  launch: iso(NOW - 40 * DAY),
  az: `${R}a`,
  life: null,
  name: 'web-1',
  platform: 'Linux/UNIX',
  reason: '',
  vols: [],
  sgs: [],
  vpc: 'vpc-1',
  subnet: 'subnet-1',
  ip: '10.0.0.1',
  pub: null,
  imds: 'required',
  ...over,
})

const stoppedFor = (id: string, days: number) =>
  instance({
    id,
    state: 'stopped',
    reason: `User initiated (${iso(NOW - days * DAY)
      .slice(0, 19)
      .replace('T', ' ')} GMT)`,
  })

const volume = (id: string, state: string, at: string | null = null, size = 100) => ({
  id,
  size,
  type: 'gp3',
  state,
  iops: null,
  at,
  created: null,
  name: null,
})

/** The pane's region, and a sweep that found a running instance and a loose volume elsewhere. */
const board = (res: Partial<ResourceReadings> = {}) =>
  readings(
    {
      instances: {
        [R]: [instance(), stoppedFor('i-2', 5), stoppedFor('i-3', 40)],
      },
      volumes: {
        [R]: [volume('vol-1', 'in-use', 'i-3', 200), volume('vol-2', 'available')],
      },
    },
    {
      sweep: {
        'us-west-2': {
          instances: [{ id: 'i-9', type: 'g5.xlarge', s: 'running', l: null }],
          volumes: [{ id: 'vol-9', g: 500, t: 'gp3', s: 'available' }],
          nats: [],
          addresses: [],
        },
      },
      sweepAt: NOW,
      ...res,
    },
  )

describe('in use of all (aws.md §14.12)', () => {
  it('tells a stopped instance from a forgotten one, and leaves what is elsewhere to ELSEWHERE', () => {
    const v = view(board())
    // The sweep's ones are on LOOKS FORGOTTEN (as `elsewhere`), never on the pane's cards.
    expect(v.forgotten.filter((f) => f.reason === 'elsewhere')).toHaveLength(2)
    expect(tileOf(v, 'ec2')?.use).toMatchObject({
      total: 3,
      inUse: 1,
      stopped: 1,
      forgotten: 1,
      quiet: 0,
      kept: 0,
      inUseWord: 'instances running, not idle',
      regions: [{ region: R, count: 3 }],
    })
    expect(tileOf(v, 'ebs')?.use).toMatchObject({ total: 2, inUse: 1, forgotten: 1, stopped: 0 })
    for (const tile of tiles(v)) closes(tile)
  })

  it("sums the forgotten ones' money and frames by it as the tile does", () => {
    const v = view(board())
    const ec2 = tileOf(v, 'ec2')
    const row = v.forgotten.find((f) => f.service === 'ec2' && f.region === R)
    expect(ec2?.use.usd).toBeCloseTo(row?.monthly ?? -1)
    const cheap = view(board({ sweep: {} }))
    const ebs = tileOf(
      view(readings({ volumes: { [R]: [volume('vol-3', 'available', null, 6000)] } })),
      'ebs',
    )
    expect(ebs?.use.frame).toBe('danger')
    expect(ebs?.use.frame).toBe(ebs?.frame)
    expect(tileOf(cheap, 'ebs')?.use.frame).toBeNull()
  })

  it('counts a kept one as kept, off the forgotten and out of the money', () => {
    const memory = {
      ...emptyResourceReadings().memory,
      keep: { [`ebs:${R}:vol-2`]: { at: NOW, usd: 10.16, name: 'vol-2' } },
    }
    const ebs = tileOf(view(board({ memory })), 'ebs')
    expect(ebs?.use).toMatchObject({ total: 2, inUse: 1, forgotten: 0, kept: 1, usd: 0 })
    if (ebs !== undefined) closes(ebs)
  })

  it('counts what costs nothing as quiet: an empty bucket', () => {
    const r = readings(
      { buckets: { [R]: [] } },
      {
        buckets: [
          ['empty-one', iso(NOW - 400 * DAY), R],
          ['full-one', iso(NOW - 400 * DAY), R],
        ],
      },
    )
    // A bucket with sizes is stored; one with none in its region's reading is empty.
    r.buckets[R] = [{ bucket: 'full-one', storage: 'StandardStorage', bytes: 5e9 }] as never
    const s3 = tileOf(view(r), 's3')
    expect(s3?.use).toMatchObject({ total: 2, inUse: 1, quiet: 1, forgotten: 0, usd: 0 })
    if (s3 !== undefined) closes(s3)
  })

  it('has a word for every service that gets a tile, noun first', () => {
    for (const service of GROUPS.flatMap((g) => g.services)) {
      const word = (IN_USE_WORD as Record<string, string>)[service]
      expect(word, service).toBeTruthy()
      expect(inUseWord(service)).toBe(word)
      expect(word, service).toMatch(/^[a-zA-Z]/)
    }
  })
})

/** main's board on the stand-in AWS CLI, its clock still. */
async function standIn(mode: string): Promise<AwsBoard> {
  let last: AwsBoard | null = null
  let file = {}
  const key = awsBoardKey({
    profile: 'default',
    regions: [R, 'us-east-1'],
    activity: true,
    slow: false,
  })
  const aws = new AwsService({
    cli: stubAws(mode),
    limit: concurrencyLimit(2),
    billing: billingStore({ load: () => file, save: (next) => (file = next) }, () => Date.now()),
    now: () => Date.now(),
    setTimer: () => 0,
    clearTimer: () => {},
    publish: (b) => {
      last = b
    },
    incidents: () => [],
    alert: () => {},
    cliVersion: () => '2.39.6',
    executable: () => 'stub',
    startedAt: Date.now(),
  })
  aws.watch(key)
  for (let i = 0; i < 20_000; i++) await Promise.resolve()
  aws.dispose()
  if (last === null) throw new Error('no board')
  return last
}

describe("the stand-in's boards", () => {
  for (const mode of ['demo', 'partial', 'quiet', 'noregion'])
    it(`closes the sum on every card of ${mode}`, async () => {
      const b = await standIn(mode)
      const all = tiles(b.resources)
      expect(all.length).toBeGreaterThan(mode === 'demo' ? 15 : 0)
      for (const tile of all) {
        closes(tile)
        expect(tile.use.inUseWord, tile.service).toBe(inUseWord(tile.service))
      }
    })

  it('shows on the demo what the cards are for: something forgotten and something quiet', async () => {
    const b = await standIn('demo')
    const all = tiles(b.resources)
    expect(all.some((t) => t.use.forgotten > 0)).toBe(true)
    expect(all.some((t) => t.use.quiet > 0)).toBe(true)
    // The forgotten GPU is in us-west-2 (ELSEWHERE): the EC2 tile's foot counts it, its card not.
    const ec2 = all.find((t) => t.service === 'ec2')
    expect(ec2?.use.regions.map((r) => r.region)).not.toContain('us-west-2')
    expect(ec2?.use.forgotten).toBe((ec2?.forgottenBilled ?? 0) - 1)
    // Bedrock's card counts what is placed: its tile's halves, summed.
    const bedrock = all.find((t) => t.service === 'bedrock')
    const placed = b.resources.bedrock?.placed.reduce((n, p) => n + p.count, 0)
    expect(bedrock?.use.total).toBe(placed)
    expect(bedrock?.use.inUseWord).toBe('placed, used in 30 d')
  })
})

describe('the choice of view', () => {
  it('is CARDS unless the pane state says DETAIL', () => {
    expect(readAwsPane(undefined).resView).toBe('cards')
    expect(readAwsPane({ resView: 'detail' }).resView).toBe('detail')
    expect(readAwsPane({ resView: 'cards' }).resView).toBe('cards')
    expect(readAwsPane({ resView: 'grid' }).resView).toBe('cards')
    expect(readAwsPane({ resView: 1 }).resView).toBe('cards')
  })
})
