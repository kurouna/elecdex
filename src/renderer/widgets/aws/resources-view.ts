import { FORGOTTEN_ID, usdText } from '@shared/aws/attention'
import { type DrillFrom, type DrillPlace, isAwsService } from '@shared/aws/board'
import { DRILL, type DrillDef } from '@shared/aws/drill'
import { LIST_DRILL } from '@shared/aws/drill-resources'
import { dayText } from '@shared/aws/facts'
import { GROUPS, TILE } from '@shared/aws/inventory'
import type {
  AttentionItem,
  AwsList,
  AwsService,
  BedrockTile,
  ForgottenRow,
  ResourcesView,
  ResourceTile,
  TileGroup,
} from '@shared/aws/types'
import type { CardRow } from '../../lib/hover-card.ts'
import { MASKED } from '../cloud/cloud-view.js'

/**
 * RESOURCES' page side (docs/aws.md §14.2): how the figures, LOOKS FORGOTTEN, the tiles and the
 * lines under them are worded and laid out from what main sends. Main judges and counts; this
 * only words, masks and arranges, so the component and the unit tests reach the same answers.
 */

/* ---- MASK (aws.md §14.6) ---- */

/**
 * A resource's name as RESOURCES shows it: under MASK every name goes, the kind stays. A log
 * group keeps the AWS prefix that says what wrote it (`/aws/lambda/••`), the rest is MASKED.
 */
export function shownName(name: string, masked: boolean): string {
  if (!masked) return name
  const prefix = /^(\/aws\/[a-z0-9-]+\/)/.exec(name)?.[1]
  return prefix === undefined ? MASKED : `${prefix}••`
}

/**
 * A sentence about a resource, with its name taken out under MASK: the reason's numbers stay,
 * the name goes ("no Lambda function named ••"). The last part of a path is a name too: an
 * orphan log group's source names the function by it.
 */
export function maskIn(text: string, names: readonly string[], masked: boolean): string {
  if (!masked) return text
  const parts = names.flatMap((name) => {
    const last = name.split('/').at(-1) ?? ''
    return [name, ...(last.length >= 3 && last !== name ? [last] : [])]
  })
  let out = text
  // The longest first, so a whole path is taken before its last part.
  for (const part of [...new Set(parts)].sort((a, b) => b.length - a.length))
    if (part.length > 0) out = out.split(part).join(MASKED)
  return out
}

/* ---- The pane's size (aws.md §6.1, §14.2) ---- */

const REM = 16

export interface ResourcesLayout {
  /** Tile columns: wide 4, medium 3, narrow 2. */
  cols: 2 | 3 | 4
  /** LOOKS FORGOTTEN's rows: narrow 3, else 5. */
  rows: 3 | 5
  /** The figures' small lines: dropped from medium down. */
  sublines: boolean
  /** ELSEWHERE and BILLED, NOT LISTED say only how many. */
  countsOnly: boolean
  /** Under 30 rem high: the figures and LOOKS FORGOTTEN only. */
  short: boolean
  /** A medium height: a tile is one dense line. */
  dense: boolean
  /** Dense tiles a row: one fewer than full tiles, one where narrow. */
  denseCols: 1 | 2 | 3
}

/**
 * The same edges as the pane's other tabs (aws.md §6.1): wide from 56 rem, narrow under 32,
 * short under 30. Dense tiles from under 64 rem high: the cloud preset's AWS STATUS is about
 * 60 rem high at 1920x1080 and must show the figures, LOOKS FORGOTTEN and tiles after them on
 * its first screen (§14.2 C); taller panes have room for the full tiles.
 */
export function resourcesLayout(width: number, height: number): ResourcesLayout {
  const wide = width >= 56 * REM
  const narrow = width < 32 * REM
  return {
    cols: wide ? 4 : narrow ? 2 : 3,
    rows: narrow ? 3 : 5,
    sublines: wide,
    countsOnly: narrow,
    short: height < 30 * REM,
    dense: height < 64 * REM,
    denseCols: wide ? 3 : narrow ? 1 : 2,
  }
}

/* ---- A. The figures ---- */

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

export interface FiguresText {
  services: { big: string; sub: string }
  hourly: { big: string; sub: string }
  forgotten: { big: string; sub: string; warn: boolean }
  added: { big: string; small: string; sub: string }
}

export function figuresText(res: ResourcesView, masked: boolean): FiguresText {
  const f = res.figures
  const lost = f.forgotten
  const lostSub =
    lost.billed + lost.free === 0
      ? 'nothing looks forgotten'
      : `≈ ${usdText(lost.usd)} a month · +${lost.free} not billing${lost.notPriced > 0 ? ` · +${lost.notPriced} not priced` : ''}`
  const newest = f.newest
  return {
    services: {
      big: String(f.services),
      sub: `${f.resources.toLocaleString('en-US')} resources · ${plural(f.regions, 'region')}`,
    },
    hourly: {
      big: `≈ $${f.billedByHour.perHour.toFixed(2)}`,
      sub: `${f.billedByHour.count} resources · ≈ ${usdText(f.billedByHour.perMonth)} a month`,
    },
    forgotten: { big: String(lost.billed), sub: lostSub, warn: lost.billed > 0 },
    added: {
      big: `+${f.added}`,
      small: `· −${f.removed}`,
      sub:
        newest === null
          ? 'nothing new in 7 days'
          : `${TILE[newest.service].label} ${shownName(newest.name, masked)} · ${dayText(newest.at)}`,
    },
  }
}

/** What BILLED BY THE HOUR counts, for its card (§14.2 A). */
export const HOURLY_NOTE =
  'EC2 running, RDS available, NAT gateways, load balancers, EKS control planes, Fargate tasks, public IPv4, interface endpoints, OpenSearch Serverless OCU, SageMaker in service and the like, at On-Demand list prices. Savings Plans, RIs, the free tier and data transfer are left out.'

/* ---- B. LOOKS FORGOTTEN ---- */

/** The heading's counts: "19 billing · 16 not billing · 3 kept". */
export function forgottenHeading(res: ResourcesView): string {
  const f = res.figures.forgotten
  return [
    `${f.billed} billing`,
    `${f.free} not billing`,
    ...(f.kept > 0 ? [`${f.kept} kept`] : []),
  ].join(' · ')
}

/** The rows shown on the first step: the region chosen above, then the first few. */
export function forgottenShown(
  res: ResourcesView,
  region: string | null,
  rows: number,
): ForgottenRow[] {
  return res.forgotten.filter((row) => region === null || row.region === region).slice(0, rows)
}

/** A row's ≈ $ cell. */
export const forgottenMoney = (row: ForgottenRow): string =>
  row.notPriced ? 'not priced' : row.monthly === null ? '—' : `≈ ${usdText(row.monthly)}`

export interface Card {
  head: string
  side: string
  rows: CardRow[]
  note: string | null
}

/** A LOOKS FORGOTTEN row's card: what it was judged by, which the row has no room for. */
export function forgottenCard(row: ForgottenRow, masked: boolean): Card {
  const names = [row.name, row.id]
  return {
    head: `${TILE[row.service].label} · ${row.region}`,
    side: row.billed ? 'billing' : 'not billing',
    rows: [
      { label: 'seen', value: maskIn(row.source, names, masked) },
      { label: 'quiet for', value: row.quietFor },
      ...(row.monthly !== null
        ? [{ label: 'a month', value: `≈ ${usdText(row.monthly)} at list price` }]
        : row.notPriced
          ? [{ label: 'a month', value: 'not priced: no unit price in the table' }]
          : []),
    ],
    note: 'What was seen, not a verdict: elecdex never stops or deletes anything. KEEP takes it off this list if you meant to leave it.',
  }
}

/** The toast KEEP raises (§14.3), naming no resource under MASK. */
export function keptToast(row: ForgottenRow, masked: boolean): { title: string; body: string } {
  return {
    title: `Kept · ${shownName(row.name, masked)}`,
    body: 'Off LOOKS FORGOTTEN for this account; still in its tile. ⚙ lists what you keep.',
  }
}

/* ---- C. The tiles ---- */

/** A tile, or a skeleton for a kind not read yet. */
export type TileSlot =
  | { kind: 'tile'; tile: ResourceTile }
  | { kind: 'pending'; service: AwsService }

/**
 * The groups as main ordered them, each with a skeleton tile for its kinds still being read the
 * first time (§14.4: the counts come first, but not all at once), in their fixed place.
 */
export function tileGroups(res: ResourcesView): { group: TileGroup; slots: TileSlot[] }[] {
  const pending = new Set(res.pending)
  const groupOf = (service: AwsService) => GROUPS.find((g) => g.services.includes(service))
  const out: { group: TileGroup; slots: TileSlot[] }[] = res.groups.map((g) => ({
    group: g.group,
    slots: g.tiles.map((tile) => ({ kind: 'tile' as const, tile })),
  }))
  for (const service of pending) {
    const group = groupOf(service)?.group
    if (group === undefined) continue
    let entry = out.find((g) => g.group === group)
    if (entry === undefined) {
      entry = { group, slots: [] }
      out.push(entry)
    }
    entry.slots.push({ kind: 'pending', service })
  }
  return out
}

/** How many columns a slot takes: Bedrock's two halves take two where there are two. */
export const slotSpan = (slot: TileSlot, bedrock: BedrockTile | null): 1 | 2 =>
  slot.kind === 'tile' && slot.tile.service === 'bedrock' && bedrock !== null ? 2 : 1

/** A group spans as many columns as its tiles take, up to the grid's (the mock's subgrid). */
export function groupSpan(
  slots: readonly TileSlot[],
  bedrock: BedrockTile | null,
  cols: number,
): number {
  return Math.min(
    cols,
    slots.reduce((n, slot) => n + slotSpan(slot, bedrock), 0),
  )
}

/** The state line's parts as shares of the whole. */
export function segmentShares(
  tile: ResourceTile,
): { tone: string; label: string; share: number; n: number }[] {
  const total = tile.segments.reduce((n, s) => n + s.n, 0) || 1
  return tile.segments.map((s) => ({ tone: s.tone, label: s.label, n: s.n, share: s.n / total }))
}

/** The tile's foot, right side: its ≈ $ a month, its size, or that it bills by use. */
export function tileMoney(tile: ResourceTile): string {
  if (tile.monthly !== null && tile.monthly > 0) return `≈ ${usdText(tile.monthly)}/mo`
  if (tile.size !== null) return tile.size
  return tile.usageBased ? 'usage-based' : ''
}

/** The 7 days' change, by the tile's name: "+2", "−1", "+2 −1". */
export function tileDelta(tile: ResourceTile): string {
  return [tile.added > 0 ? `+${tile.added}` : '', tile.removed > 0 ? `−${tile.removed}` : '']
    .filter(Boolean)
    .join(' ')
}

/** A tile's card: what the tile has no room for. */
export function tileCard(tile: ResourceTile, regions: readonly string[]): Card {
  const lost =
    tile.forgottenBilled + tile.forgottenQuiet === 0
      ? 'none'
      : `${tile.forgottenBilled} billing · ${tile.forgottenQuiet} not billing${tile.forgottenUsd > 0 ? ` · ≈ ${usdText(tile.forgottenUsd)}/mo` : ''}`
  return {
    head: `${tile.label} · ${tile.count} ${tile.noun}`,
    side: tileMoney(tile) || 'free',
    rows: [
      ...tile.segments.map((s) => ({ label: s.label, value: String(s.n) })),
      ...(tile.legend.length > 0
        ? [{ label: 'facts', value: tile.legend.map((l) => l.text).join(' · ') }]
        : []),
      { label: 'looks forgotten', value: lost },
      {
        label: 'regions',
        value: regions.map((r) => `${r}${tile.regions.includes(r) ? '' : ' (none)'}`).join(' · '),
      },
      ...(tile.added + tile.removed > 0
        ? [{ label: '7 days', value: `${tile.added} new · ${tile.removed} gone` }]
        : []),
    ],
    note: `${DRILL[tile.service].label}: the list with its facets opens on a press or Enter.`,
  }
}

/** Bedrock's placed things, as the tile's right half words them. */
export const PLACED_WORD: Record<BedrockTile['placed'][number]['kind'], string> = {
  pt: 'provisioned throughput',
  custom: 'custom models',
  imported: 'imported models',
  kb: 'knowledge bases',
  agent: 'agents',
  guardrail: 'guardrails',
  profile: 'inference profiles',
  runtime: 'AgentCore runtimes',
}

/** Tokens as the tile says them: 31.2M, 840k, 12. */
export function tokensText(n: number | null): string {
  if (n === null) return '—'
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${Math.round(n / 1e3)}k`
  return String(n)
}

/** The models' bars and the tile's foot: tokens in and out across the 30 days. */
export function bedrockUse(bedrock: BedrockTile): {
  models: { id: string; name: string; tokens: string; share: number }[]
  totals: string
} {
  const tokens = (m: BedrockTile['models'][number]) => (m.tokensIn ?? 0) + (m.tokensOut ?? 0)
  const top = Math.max(1, ...bedrock.models.map(tokens))
  const read = bedrock.models.some((m) => m.tokensIn !== null || m.tokensOut !== null)
  const sum = (key: 'tokensIn' | 'tokensOut') =>
    bedrock.models.reduce((n, m) => n + (m[key] ?? 0), 0)
  return {
    models: bedrock.models.slice(0, 4).map((m) => ({
      id: m.id,
      name: m.name,
      tokens: read ? tokensText(tokens(m)) : 'listed',
      share: tokens(m) / top,
    })),
    totals: read
      ? `${tokensText(sum('tokensIn'))} tokens in · ${tokensText(sum('tokensOut'))} out`
      : 'tokens not read',
  }
}

/* ---- Arrow keys across the tiles (§14.2 C) ---- */

export interface Box {
  left: number
  top: number
  width: number
  height: number
}

const DIRECTIONS: Record<string, [number, number]> = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowUp: [0, -1],
}

/**
 * The nearest box that way, as the eye reads the board across the groups: forward along the key
 * counts once, sideways three times, and what is not ahead at all is never taken.
 */
export function nearestBox(from: Box, others: readonly Box[], key: string): number | null {
  const dir = DIRECTIONS[key]
  if (dir === undefined) return null
  const cx = from.left + from.width / 2
  const cy = from.top + from.height / 2
  let best: number | null = null
  let bestDistance = Number.POSITIVE_INFINITY
  others.forEach((box, i) => {
    const dx = box.left + box.width / 2 - cx
    const dy = box.top + box.height / 2 - cy
    const along = dx * dir[0] + dy * dir[1]
    if (along <= 4) return
    const distance = along + 3 * Math.abs(dir[0] !== 0 ? dy : dx)
    if (distance < bestDistance) {
      bestDistance = distance
      best = i
    }
  })
  return best
}

/* ---- C, D and E: the lines under the tiles ---- */

/** "Checked, none here: ECS · Redshift". */
export const noneLine = (res: ResourcesView): string =>
  res.none.map((s) => TILE[s].label).join(' · ')

/** "Denied: dynamodb:ListTables · sqs:ListQueues". */
export const deniedLine = (res: ResourcesView): string =>
  res.denied.flatMap((d) => d.actions).join(' · ')

/** "Not offered: Bedrock in eu-north-1 · …": regions left out of a tile's count. */
export const notOfferedLine = (res: ResourcesView): string =>
  res.notOffered.map((n) => `${TILE[n.service].label} in ${n.regions.join(', ')}`).join(' · ')

/** An Also here part: "27 stacks" and its note, "1 failed". */
export const alsoText = (also: ResourcesView['alsoHere'][number]): string =>
  `${also.count} ${also.noun}`

/** ELSEWHERE's line (§14.2 D), or only how many where the pane is narrow. */
export function elsewhereLine(res: ResourcesView, countsOnly: boolean): string | null {
  const regions = res.elsewhere.regions
  if (regions.length === 0) return null
  if (countsOnly) {
    const n = regions.reduce((sum, r) => sum + r.parts.reduce((s, p) => s + p.count, 0), 0)
    return `${plural(regions.length, 'region')} · ${n} found`
  }
  return regions.map((r) => `${r.region}: ${r.parts.map((p) => p.text).join(', ')}`).join(' · ')
}

/** BILLED, NOT LISTED's line (§14.2 E), or only how many and how much where narrow. */
export function billedLine(res: ResourcesView, countsOnly: boolean): string | null {
  const rows = res.billedNotListed
  if (rows.length === 0) return null
  if (countsOnly) {
    const usd = rows.reduce((s, r) => s + r.usd, 0)
    return `${plural(rows.length, 'service')} · $${usd.toFixed(2)}`
  }
  return rows.map((r) => `${r.name} $${r.usd.toFixed(2)}`).join(' · ')
}

/** GetMetricData this month, as ⚙ and the ledger's card say it (aws.md §14.4a). */
export const gmdText = (gmd: ResourcesView['gmd']): string =>
  `${gmd.used.toLocaleString('en-US')} of ${gmd.cap.toLocaleString('en-US')} metrics this month · $${gmd.usd.toFixed(2)}`

/* ---- The drill-down's names and ATTENTION's line ---- */

/** The lists' crumbs, as RESOURCES › FORGOTTEN says them. */
const LIST_CRUMB: Record<AwsList, string> = {
  forgotten: 'FORGOTTEN',
  new: 'NEW 7 D',
  elsewhere: 'ELSEWHERE',
}

/** A place's definition: a service's own, or a list's across services. */
export const drillDef = (place: DrillPlace): DrillDef =>
  isAwsService(place.service) ? DRILL[place.service] : LIST_DRILL[place.service]

export const drillCrumb = (place: DrillPlace): string =>
  isAwsService(place.service) ? DRILL[place.service].label : LIST_CRUMB[place.service]

export const FROM_CRUMB: Record<DrillFrom, string> = {
  resources: 'RESOURCES',
  active: 'ACTIVE',
  cost: 'COST',
  attention: 'ATTENTION',
}

/** ATTENTION's one line of what looks forgotten (user decision 2026-11-08): it opens the list. */
export const opensForgotten = (item: AttentionItem): boolean => item.id === FORGOTTEN_ID

/** A list's place, as the figures, `all N ›` and ATTENTION's line open it. */
export const listPlace = (list: AwsList, region: string | null): DrillPlace => ({
  service: list,
  filters: region === null || list === 'elsewhere' ? {} : { region },
  sort: null,
  item: null,
})
