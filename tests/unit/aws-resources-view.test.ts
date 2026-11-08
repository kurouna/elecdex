import type { ForgottenRow, ResourcesView, ResourceTile } from '@shared/aws/types'
import type { LedgerSummary } from '@shared/cloud-cli/ledger'
import { describe, expect, it } from 'vitest'
import {
  billedLine,
  drillCrumb,
  elsewhereLine,
  figuresText,
  forgottenCard,
  forgottenHeading,
  forgottenShown,
  groupSpan,
  keptToast,
  listPlace,
  maskIn,
  nearestBox,
  opensForgotten,
  resourcesLayout,
  shownName,
  tileGroups,
  tileMoney,
} from '../../src/renderer/widgets/aws/resources-view.js'
import { ledgerLine, MASKED } from '../../src/renderer/widgets/cloud/cloud-view.js'

/**
 * RESOURCES' page side (docs/aws.md §14.2, §14.6): what it words, masks and lays out from
 * main's `resources`. Main's judging is tested in aws-forgotten and aws-inventory.
 */

const row = (over: Partial<ForgottenRow> = {}): ForgottenRow => ({
  key: 'logs:ap-northeast-1:/aws/lambda/old-resizer',
  service: 'logs',
  id: '/aws/lambda/old-resizer',
  region: 'ap-northeast-1',
  name: '/aws/lambda/old-resizer',
  reason: 'orphan-log-group',
  why: 'function gone · 38 GB kept forever',
  quietFor: 'unknown',
  window: 0,
  billed: true,
  monthly: 1.45,
  notPriced: false,
  weight: 'warn',
  source: 'no Lambda function named old-resizer in its region · no call needed',
  reshown: false,
  ...over,
})

const tile = (over: Partial<ResourceTile> = {}): ResourceTile => ({
  service: 'ec2',
  label: 'EC2',
  count: 5,
  noun: 'running',
  segments: [{ n: 5, tone: 'ok', label: 'busy' }],
  legend: [],
  regions: ['ap-northeast-1'],
  forgottenBilled: 0,
  forgottenQuiet: 0,
  forgottenUsd: 0,
  frame: null,
  monthly: null,
  size: null,
  usageBased: false,
  added: 0,
  removed: 0,
  ...over,
})

const view = (over: Partial<ResourcesView> = {}): ResourcesView => ({
  judging: false,
  figures: {
    services: 22,
    resources: 365,
    regions: 3,
    billedByHour: { perHour: 7.11, perMonth: 5190, count: 39 },
    forgotten: { billed: 19, usd: 2200, notPriced: 1, free: 16, kept: 3 },
    added: 6,
    removed: 2,
    newest: { service: 'logs', name: '/aws/lambda/new-fn', at: Date.UTC(2026, 10, 5) },
  },
  forgotten: [
    row(),
    row({ key: 'ebs:us-east-1:vol-1', service: 'ebs', id: 'vol-1', region: 'us-east-1' }),
  ],
  forgottenTotal: 35,
  groups: [{ group: 'COMPUTE', tiles: [tile()] }],
  bedrock: null,
  none: ['redshift', 'ecs'],
  pending: [],
  denied: [{ service: 'dynamodb', actions: ['dynamodb:ListTables'] }],
  notOffered: [],
  alsoHere: [],
  elsewhere: {
    on: true,
    readAt: null,
    regions: [
      {
        region: 'us-west-2',
        parts: [
          { service: 'ec2', count: 1, text: '1 EC2 running' },
          { service: 'ebs', count: 1, text: '1 volume' },
        ],
      },
      { region: 'ap-southeast-1', parts: [{ service: 'nat', count: 1, text: '1 NAT' }] },
    ],
  },
  billedNotListed: [
    { name: 'Amazon Kinesis', usd: 41.2 },
    { name: 'AWS Glue', usd: 3.1 },
  ],
  kept: [],
  gmd: { on: true, cap: 100_000, used: 0, usd: 0, capReached: false, readAt: null },
  quietDays: 30,
  prices: { asOf: '2026-11-07' },
  ...over,
})

describe('MASK on RESOURCES (aws.md §14.6)', () => {
  it('hides every name, keeping a log group the prefix that says what wrote it', () => {
    expect(shownName('acme-tmp-2023', false)).toBe('acme-tmp-2023')
    expect(shownName('acme-tmp-2023', true)).toBe(MASKED)
    expect(shownName('/aws/lambda/old-resizer', true)).toBe('/aws/lambda/••')
    expect(shownName('vpc-flow-logs', true)).toBe(MASKED)
  })

  it("takes the name, and a path's last part, out of a sentence, keeping its numbers", () => {
    const r = row()
    expect(maskIn(r.source, [r.name], true)).toBe(
      `no Lambda function named ${MASKED} in its region · no call needed`,
    )
    expect(maskIn('not attached since 11-01 · old-data 500 GiB', ['old-data'], true)).toBe(
      `not attached since 11-01 · ${MASKED} 500 GiB`,
    )
    expect(maskIn(r.source, [r.name], false)).toBe(r.source)
    // A short last part ("a") is not a name worth taking out of every word.
    expect(maskIn('a table', ['/x/a'], true)).toBe('a table')
  })

  it('masks the cards, the NEW 7 D line and the KEEP toast', () => {
    const card = forgottenCard(row(), true)
    expect(JSON.stringify(card)).not.toContain('old-resizer')
    expect(card.rows.find((r) => r.label === 'quiet for')?.value).toBe('unknown')
    expect(figuresText(view(), true).added.sub).toBe('CloudWatch Logs /aws/lambda/•• · 11-05')
    expect(figuresText(view(), false).added.sub).toContain('/aws/lambda/new-fn')
    expect(keptToast(row(), true).title).toBe('Kept · /aws/lambda/••')
  })
})

describe('the RESOURCES screen (aws.md §14.2)', () => {
  it('lays out by the pane edges: four, three or two columns, dense at a medium height', () => {
    expect(resourcesLayout(1000, 1100)).toMatchObject({
      cols: 4,
      rows: 5,
      sublines: true,
      countsOnly: false,
      short: false,
      dense: false,
    })
    // The cloud preset's AWS STATUS: about 60 rem high, one dense line a tile.
    expect(resourcesLayout(1000, 60 * 16).dense).toBe(true)
    expect(resourcesLayout(700, 800)).toMatchObject({ cols: 3, sublines: false })
    expect(resourcesLayout(500, 800)).toMatchObject({ cols: 2, rows: 3, countsOnly: true })
    expect(resourcesLayout(1000, 400).short).toBe(true)
  })

  it('words the figures and the heading', () => {
    const text = figuresText(view(), false)
    expect(text.services).toEqual({ big: '22', sub: '365 resources · 3 regions' })
    expect(text.hourly).toEqual({ big: '≈ $7.11', sub: '39 resources · ≈ $5.2k a month' })
    expect(text.forgotten).toEqual({
      big: '19',
      sub: '≈ $2.2k a month · +16 not billing · +1 not priced',
      warn: true,
    })
    expect(text.added).toMatchObject({ big: '+6', small: '· −2' })
    expect(forgottenHeading(view())).toBe('19 billing · 16 not billing · 3 kept')
  })

  it('shows the rows of the region chosen, at most as many as there is room for', () => {
    expect(forgottenShown(view(), null, 5)).toHaveLength(2)
    expect(forgottenShown(view(), 'us-east-1', 5).map((r) => r.id)).toEqual(['vol-1'])
    expect(forgottenShown(view(), null, 1)).toHaveLength(1)
  })

  it('puts a skeleton tile in its own group while its kind is read the first time', () => {
    const groups = tileGroups(view({ pending: ['dynamodb', 'lambda'] }))
    expect(groups.map((g) => [g.group, g.slots.map((s) => s.kind)])).toEqual([
      ['COMPUTE', ['tile', 'pending']],
      ['DATABASE', ['pending']],
    ])
    // A group takes the columns its tiles need, up to the grid's.
    expect(groupSpan(groups[0]?.slots ?? [], null, 4)).toBe(2)
    expect(groupSpan(groups[0]?.slots ?? [], null, 1)).toBe(1)
  })

  it("says a tile's money, its size, or that it bills by use", () => {
    expect(tileMoney(tile({ monthly: 999.2 }))).toBe('≈ $999/mo')
    expect(tileMoney(tile({ size: '16.2 TB' }))).toBe('16.2 TB')
    expect(tileMoney(tile({ usageBased: true }))).toBe('usage-based')
    expect(tileMoney(tile())).toBe('')
  })

  it('moves to the nearest tile that way, never one behind', () => {
    const at = (left: number, top: number) => ({ left, top, width: 100, height: 50 })
    const others = [at(110, 0), at(220, 0), at(0, 60), at(110, 60)]
    expect(nearestBox(at(0, 0), others, 'ArrowRight')).toBe(0)
    expect(nearestBox(at(0, 0), others, 'ArrowDown')).toBe(2)
    expect(nearestBox(at(0, 0), others, 'ArrowLeft')).toBeNull()
    expect(nearestBox(at(0, 0), others, 'Enter')).toBeNull()
  })

  it('says ELSEWHERE and BILLED, NOT LISTED in full, or only how many where narrow', () => {
    expect(elsewhereLine(view(), false)).toBe(
      'us-west-2: 1 EC2 running, 1 volume · ap-southeast-1: 1 NAT',
    )
    expect(elsewhereLine(view(), true)).toBe('2 regions · 3 found')
    expect(
      elsewhereLine(view({ elsewhere: { on: true, readAt: null, regions: [] } }), false),
    ).toBeNull()
    expect(billedLine(view(), false)).toBe('Amazon Kinesis $41.20 · AWS Glue $3.10')
    expect(billedLine(view(), true)).toBe('2 services · $44.30')
    expect(billedLine(view({ billedNotListed: [] }), false)).toBeNull()
  })

  it("opens ATTENTION's one line as the forgotten list, and names the lists in the crumbs", () => {
    const line = {
      id: 'cost:forgotten',
      weight: 'warn' as const,
      tag: 'COST' as const,
      title: '9 look forgotten',
      region: null,
      item: null,
      since: 0,
      why: '',
    }
    expect(opensForgotten(line)).toBe(true)
    expect(opensForgotten({ ...line, id: 'cost:eks-extended:x' })).toBe(false)
    expect(listPlace('forgotten', 'us-east-1')).toEqual({
      service: 'forgotten',
      filters: { region: 'us-east-1' },
      sort: null,
      item: null,
    })
    // ELSEWHERE is the regions not shown: the region chosen does not filter it.
    expect(listPlace('elsewhere', 'us-east-1').filters).toEqual({})
    expect(drillCrumb(listPlace('forgotten', null))).toBe('FORGOTTEN')
    expect(drillCrumb({ service: 'logs', filters: {}, sort: null, item: null })).toBe(
      'CloudWatch Logs',
    )
  })
})

describe("the ledger's line", () => {
  const ledger = (over: Partial<LedgerSummary> = {}): LedgerSummary => ({
    requests: 258,
    free: 197,
    freeTier: 58,
    notModified: 0,
    paidRequests: 0,
    paidUsd: 0,
    meteredTiny: 1,
    paidMetrics: 0,
    paidNotes: [],
    probes: [],
    ...over,
  })

  it('counts GetMetricData by the metric beside the paid requests, and says its cap', () => {
    expect(ledgerLine(ledger(), 'aws')).toBe(
      'requests today 258 · free 197 · free tier 58 · paid APIs 0',
    )
    expect(ledgerLine(ledger({ paidMetrics: 35_000, paidUsd: 0.35 }), 'aws')).toBe(
      'requests today 258 · free 197 · free tier 58 · paid APIs 0 · GMD 35,000 metrics · $0.35 this month',
    )
    expect(
      ledgerLine(
        ledger({
          paidRequests: 4,
          paidMetrics: 100_000,
          paidUsd: 1.04,
          paidNotes: ['GMD CAP REACHED'],
        }),
        'aws',
      ),
    ).toContain('paid APIs 4 · GMD 100,000 metrics · $1.04 this month · GMD CAP REACHED')
  })
})
