import { activeCost } from '@shared/aws/active'
import { attention, checksRun } from '@shared/aws/attention'
import {
  billingMonth,
  CE_CAPS,
  CE_PRICE_USD,
  GMD_PRICE_USD,
  quotaCrossed,
} from '@shared/aws/billing'
import { isAwsService, parseAwsBoardKey } from '@shared/aws/board'
import { changesSince, type IdSets, idSets } from '@shared/aws/changes'
import { ACCOUNT_PAGES, consoleUrl, isConsoleUrl, permissionsUrl } from '@shared/aws/console-url'
import { drillItem, drillRows } from '@shared/aws/drill'
import { isAwsList, listRows } from '@shared/aws/drill-resources'
import { forgotten } from '@shared/aws/forgotten'
import { resourcesView } from '@shared/aws/inventory'
import { ms, parseWith, TrailSchema } from '@shared/aws/parse'
import { type AwsReadings, emptyReadings, everywhere } from '@shared/aws/readings'
import { elsewhereRows, GLOBAL } from '@shared/aws/resources'
import { pulseBins, trailName } from '@shared/aws/trail'
import type {
  AccountView,
  AwsBoard,
  CostView,
  DrillItem,
  DrillRow,
  HistoryEvent,
  TrailEvent,
} from '@shared/aws/types'
import { type CliProblem, signInCommand } from '@shared/cloud-cli/errors'
import {
  emptyLedger,
  type LedgerState,
  type LedgerSummary,
  linkOf,
  localDay,
  recordReading,
  summarize,
} from '@shared/cloud-cli/ledger'
import { type CliPriority, MINUTE, type Probe, type RunCli } from '@shared/cloud-cli/probe'
import { incidentsFor, type StatusIncident } from '@shared/cloud-cli/status'
import type { TimerDeps } from '../boundary-timer.js'
import { evictStopped, gapLeft, REFRESH_GAP_MS } from '../cloud-cli/boards.js'
import { BULK_LANES, concurrencyLimit, ProbeScheduler } from '../cloud-cli/scheduler.js'
import {
  type AccountBilling,
  asksNow,
  type BillingStore,
  ceSettings,
  freshAccount,
} from './billing-store.js'
import { type InventoryStore, memoryInventory } from './inventory-store.js'
import {
  AWS_PROBES,
  type AwsContext,
  awsCall,
  type CostExplorerAnswer,
  costExplorerDue,
  slowed,
} from './probes.js'
import { RegionReach } from './region-reach.js'
import { ResourceAccounts } from './resource-accounts.js'
import { RESOURCE_PROBES } from './resource-probes.js'

/**
 * AWS STATUS in main (docs/aws.md): one board per key (a profile, its regions, two flags), read
 * while a page subscribes to it and only then. The pages get the judgements and the numbers;
 * main keeps the readings, so a drill-down's list, an item, its history and every URL opened come
 * from main's own last reading - the page names nothing but ids.
 */

export interface CloudAlert {
  id: string
  title: string
  body: string
  tone: 'warn' | 'danger'
  /** What the toast's one action does: open a status page, or the pane's COST tab. */
  action: { kind: 'status'; url: string } | { kind: 'cost'; key: string }
  /** For the OS notification while a pane masks: the body without the account. */
  maskedBody: string
}

export interface AwsServiceDeps extends TimerDeps {
  cli: RunCli
  limit: <T>(work: () => Promise<T>, priority?: CliPriority) => Promise<T>
  billing: BillingStore
  /** RESOURCES' per-account readings and memory (`aws-inventory.json`); in memory when absent. */
  inventory?: InventoryStore
  publish: (board: AwsBoard) => void
  incidents: () => StatusIncident[]
  alert: (alert: CloudAlert) => void
  cliVersion: () => string | null
  executable: () => string | null
  /** When this run of elecdex started (Cost Explorer's LATER). */
  startedAt: number
}

interface Board {
  key: string
  ctx: AwsContext
  scheduler: ProbeScheduler<AwsContext>
  ledger: LedgerState
  refreshedAt: number
  /** The last "check other regions now". */
  sweptAt: number
  refreshing: boolean
  first: { day: string; at: number; sets: IdSets } | null
  history: Map<string, { at: number; events: HistoryEvent[] }>
  /** Which regions this board's calls reach (aws.md §14.4: not offered, or offline). */
  reach: RegionReach
  /** Readings that settled: with the account's count, what `readings` was put together at. */
  settled: number
  readings: { at: string; value: AwsReadings } | null
}

/** Every probe of a board: the panes' readings, then RESOURCES' (aws.md §14.4). */
export const BOARD_PROBES: readonly Probe<AwsContext, unknown>[] = [
  ...AWS_PROBES,
  ...RESOURCE_PROBES,
]

const value = <T>(s: ProbeScheduler<AwsContext>, id: string): T | null => s.outcome<T>(id).value

export class AwsService {
  readonly #deps: AwsServiceDeps
  readonly #boards = new Map<string, Board>()
  /** The accounts whose Cost Explorer reading is under way. */
  readonly #ceReading = new Set<string>()
  readonly #resources: ResourceAccounts
  /**
   * RESOURCES' bulk readings, three at a time across every board (aws.md §14.4), inside the
   * shared CLI lanes: with one, a new account took about four minutes to count its services
   * (decisions.md, measured 2026-11-08).
   */
  readonly #bulk = concurrencyLimit(BULK_LANES)
  /**
   * The accounts a shared reading was kept for since a probe last settled: the boards of the
   * account are shown again once, when it settles, not at every region's answer.
   */
  readonly #putFor = new Set<string>()

  constructor(deps: AwsServiceDeps) {
    this.#deps = deps
    this.#resources = new ResourceAccounts({
      inventory: deps.inventory ?? memoryInventory(),
      billing: deps.billing,
      now: deps.now,
    })
  }

  watching(): string[] {
    return [...this.#boards.values()]
      .filter((b) => b.scheduler.active)
      .map((b) => `board:${b.key}`)
      .sort()
  }

  watch(key: string): AwsBoard | null {
    const spec = parseAwsBoardKey(key)
    if (spec === null) return null
    let board = this.#boards.get(key)
    if (board === undefined) {
      const created = {
        key,
        ledger: emptyLedger(this.#deps.now()),
        refreshedAt: 0,
        sweptAt: 0,
        refreshing: false,
        first: null,
        history: new Map(),
        reach: new RegionReach(),
        settled: 0,
        readings: null,
      } as unknown as Board
      created.ctx = {
        spec,
        regions: () => this.#regionsOf(created),
        account: () => value<{ account: string }>(created.scheduler, 'identity')?.account ?? null,
        claimCostExplorer: () => this.#claimCostExplorer(created),
        costExplorerAnswered: (answer) => this.#costExplorerAnswered(created, answer),
        refreshing: () => created.refreshing,
        billedServices: () =>
          value<{ services?: string[] }>(created.scheduler, 'billing')?.services ?? null,
        running: () =>
          everywhere(this.#readings(created).instances)
            .filter((i) => i.state === 'running')
            .map((i) => ({ id: i.id, region: i.region, launch: Date.parse(i.launch ?? '') || 0 })),
        now: () => this.#deps.now(),
        shared: () => {
          const account = created.ctx.account()
          return account === null
            ? null
            : this.#resources.shared(account, () => this.#putFor.add(account))
        },
        readings: () => this.#readings(created),
        every: (id) => probes.find((probe) => probe.id === id)?.every ?? 0,
        refreshedAt: () => created.refreshedAt,
        clusterNames: (region) =>
          (
            value<Record<string, { name: string }[] | null>>(created.scheduler, 'clusters')?.[
              region
            ] ?? []
          ).map((c) => c.name),
        // Within two of the alarms' periods: they read every region of the board each time.
        reached: (region) =>
          created.reach.reached(region, this.#deps.now(), 2 * created.ctx.every('alarms')),
      }
      const probes = spec.slow ? slowed(BOARD_PROBES) : BOARD_PROBES
      created.scheduler = new ProbeScheduler<AwsContext>(
        {
          ...this.#deps,
          cli: async (call) => {
            const result = await this.#deps.cli(call)
            created.reach.note(call, result, this.#deps.now())
            return result
          },
          // The panes' reads wait behind the sign-in, alarms, health, the trail and GitHub.
          priority: 'later',
          bulk: this.#bulk,
          context: () => created.ctx,
          record: (entry) => {
            created.ledger = recordReading(created.ledger, entry, this.#deps.now())
            if (entry.probe === 'cost-explorer' && entry.requests > 0)
              this.#costExplorerPaid(created, entry.requests)
          },
          changed: () => this.#settled(created),
        },
        probes,
      )
      this.#boards.set(key, created)
      evictStopped(this.#boards)
      board = created
    }
    board.scheduler.start()
    return this.#build(board)
  }

  unwatch(key: string): void {
    this.#boards.get(key)?.scheduler.stop()
  }

  refresh(key: string): number {
    const board = this.#boards.get(key)
    if (board === undefined || !board.scheduler.active) return 0
    const left = gapLeft(board.refreshedAt, this.#deps.now())
    if (left > 0) return left
    board.refreshedAt = this.#deps.now()
    board.refreshing = true
    board.scheduler.refresh()
    // The press covers the readings it started; MANUAL Cost Explorer reads only inside it.
    queueMicrotask(() => {
      board.refreshing = false
    })
    return REFRESH_GAP_MS
  }

  /** A drill-down's list, from main's last reading (aws.md §5.2), or one of RESOURCES' lists. */
  drill(key: string, service: unknown): DrillRow[] | null {
    const board = this.#active(key)
    if (board === null) return null
    if (isAwsList(service)) return listRows(service, this.#readings(board)).slice(0, 1000)
    if (!isAwsService(service)) return null
    const r = this.#readings(board)
    return drillRows(service, r, attention(r))
  }

  item(key: string, service: unknown, id: unknown, region?: unknown): DrillItem | null {
    const board = this.#active(key)
    if (board === null || !isAwsService(service) || typeof id !== 'string') return null
    const r = this.#readings(board)
    return drillItem(service, id, r, attention(r), typeof region === 'string' ? region : null)
  }

  /** The CloudTrail of one resource of the last reading, read when HISTORY is pressed; kept 5 min. */
  async history(
    key: string,
    service: unknown,
    id: unknown,
    region?: unknown,
  ): Promise<HistoryEvent[] | null> {
    const board = this.#active(key)
    if (board === null || !isAwsService(service) || typeof id !== 'string') return null
    const found = this.item(key, service, id, region)
    // A board stopped at a sign-in starts no CLI, on demand either.
    if (found === null || !board.ctx.spec.activity || board.scheduler.halted) return null
    const kept = board.history.get(`${service}:${found.region}:${id}`)
    const now = this.#deps.now()
    if (kept !== undefined && now - kept.at < 5 * 60_000) return kept.events
    const name = trailName(service, id)
    const result = await this.#deps.limit(() =>
      this.#deps.cli(
        awsCall(board.ctx, found.region, [
          'cloudtrail',
          'lookup-events',
          // JSON, not the shorthand: a name may hold a comma, which the shorthand reads as a key.
          '--lookup-attributes',
          JSON.stringify([{ AttributeKey: 'ResourceName', AttributeValue: name }]),
          '--max-items',
          '50',
          '--query',
          'Events[].{id:EventId,t:EventTime,n:EventName,s:EventSource,u:Username,e:`null`}',
        ]),
      ),
    )
    board.ledger = recordReading(
      board.ledger,
      { probe: 'history', cost: 'free', requests: 1, failed: !result.ok },
      now,
    )
    // A refusal or a timeout is not "no history": say so, and keep nothing.
    if (!result.ok) return null
    const rows = parseWith(TrailSchema, result.stdout) ?? []
    const events = rows.map((row) => ({
      at: ms(row.t) ?? 0,
      who: row.u ?? '—',
      name: row.n,
      error: null,
    }))
    board.history.set(`${service}:${found.region}:${id}`, { at: now, events })
    return events
  }

  /** The page of an id the board showed: a resource's console page, an account page, a status page. */
  urlOf(key: string, id: unknown): string | null {
    const board = this.#active(key)
    if (board === null || typeof id !== 'string') return null
    const page = /^account:(billing|costExplorer|billingPreferences|iam)$/.exec(id)?.[1] as
      | keyof typeof ACCOUNT_PAGES
      | undefined
    if (page !== undefined) return ACCOUNT_PAGES[page]
    // The signed-in identity's permissions, from main's own reading of who it is.
    if (id === 'account:permissions') {
      const arn = value<{ arn: string }>(board.scheduler, 'identity')?.arn
      return arn === undefined ? null : permissionsUrl(arn)
    }
    const incident = /^incident:(.+)$/.exec(id)?.[1]
    if (incident !== undefined) {
      const url = this.#deps.incidents().find((i) => i.id === incident)?.url ?? null
      return url !== null && isConsoleUrl(url) ? url : null
    }
    const match = /^item:([a-z0-9]+):([a-z0-9-]+):(.+)$/.exec(id)
    if (match === null) return null
    const [, service, region, itemId] = match as unknown as [string, string, string, string]
    if (!isAwsService(service)) return null
    const r = this.#readings(board)
    const known =
      drillRows(service, r, []).some((row) => row.id === itemId && row.region === region) ||
      elsewhereRows(r).some((x) => x.service === service && x.id === itemId && x.region === region)
    const url = known ? consoleUrl(service, region, itemId) : null
    return url !== null && isConsoleUrl(url) ? url : null
  }

  /** Cost Explorer's answer for the board's account (aws.md §3.3): every pane on it sees it. */
  answerCostExplorer(key: string, answer: unknown): boolean {
    const board = this.#active(key)
    const account = board?.ctx.account() ?? null
    if (board === null || account === null || typeof answer !== 'object' || answer === null)
      return false
    const { state, every, cap } = answer as Record<string, unknown>
    if (state !== 'on' && state !== 'off' && state !== 'later') return false
    if (every !== undefined && every !== 'manual' && every !== 'day' && every !== '12h')
      return false
    if (cap !== undefined && !(CE_CAPS as readonly unknown[]).includes(cap)) return false
    this.#deps.billing.update(account, (current) => ({
      ...current,
      ce: {
        ...current.ce,
        state,
        answeredAt: this.#deps.now(),
        refusedWhy: null,
        ...(every === undefined ? {} : { every }),
        ...(cap === undefined ? {} : { cap: cap as number }),
      },
    }))
    this.#everyBoardOf(account, (other) => {
      if (state === 'on') other.scheduler.runNow('cost-explorer')
      this.#publish(other)
    })
    return true
  }

  /** The cost QUOTA (aws.md §5.6): USD, 0 is off; changing it counts the steps again. */
  setQuota(key: string, quota: unknown): boolean {
    const board = this.#active(key)
    const account = board?.ctx.account() ?? null
    if (board === null || account === null || typeof quota !== 'object' || quota === null)
      return false
    const { usd, steps } = quota as Record<string, unknown>
    if (typeof usd !== 'number' || !Number.isFinite(usd) || usd < 0 || usd > 10_000_000)
      return false
    if (steps !== '80-100' && steps !== '100') return false
    this.#deps.billing.update(account, (current) => ({
      ...current,
      quota: { ...current.quota, usd: Math.round(usd * 100) / 100, steps, said: [] },
    }))
    this.#everyBoardOf(account, (other) => this.#publish(other))
    return true
  }

  /**
   * KEEP (aws.md §14.3): `on` marks a row of the board's last forgotten list as meant to stay;
   * off takes a mark of the account off. The page sends the row's key, nothing else.
   */
  keep(key: string, id: unknown, on: unknown): boolean {
    const board = this.#active(key)
    const account = board?.ctx.account() ?? null
    if (board === null || account === null || typeof id !== 'string' || id.length > 600)
      return false
    if (typeof on !== 'boolean') return false
    const r = this.#readings(board)
    const done = this.#resources.keep(account, id, on, forgotten(r).rows)
    if (done) this.#accountChanged(account)
    return done
  }

  /**
   * ELSEWHERE's sweep (aws.md §14.2 D): `now` reads the other regions again (at most once in
   * 30 s, like REFRESH, answering the wait left); `on` and `off` set the account's switch.
   */
  sweep(key: string, what: unknown = 'now'): number {
    const board = this.#active(key)
    const account = board?.ctx.account() ?? null
    if (board === null || account === null) return 0
    if (what === 'on' || what === 'off') {
      this.#resources.sweep(account, what)
      this.#everyBoardOf(account, (other) => {
        if (what === 'on') other.scheduler.runNow('res-sweep')
        this.#publish(other)
      })
      return 0
    }
    if (what !== 'now') return 0
    const left = gapLeft(board.sweptAt, this.#deps.now())
    if (left > 0) return left
    board.sweptAt = this.#deps.now()
    this.#resources.sweep(account, 'now')
    board.scheduler.runNow('res-sweep')
    return REFRESH_GAP_MS
  }

  /** GetMetricData's answer for the board's account (ON · OFF and the cap, aws.md §14.4a). */
  metricData(key: string, answer: unknown): boolean {
    const board = this.#active(key)
    const account = board?.ctx.account() ?? null
    if (board === null || account === null || !this.#resources.setMetricData(account, answer))
      return false
    // Turned on or off: the usage is read again by whichever of the two now applies (each keeps a
    // reading younger than its day, so nothing is paid twice). A raised cap goes on at the next
    // day's reading: the one taken at the cap stands for its day, as a paid reading always does,
    // and the statistics read when the cap was hit stay in use until then.
    this.#everyBoardOf(account, (other) => {
      other.scheduler.runNow('res-gmd')
      other.scheduler.runNow('res-lastuse')
      this.#publish(other)
    })
    return true
  }

  incidentsChanged(): void {
    for (const board of this.#boards.values()) if (board.scheduler.active) this.#publish(board)
  }

  /** The regions every shown board reads, for the public status's filter. */
  shownRegions(): string[] {
    return [
      ...new Set(
        [...this.#boards.values()]
          .filter((b) => b.scheduler.active)
          .flatMap((b) => this.#regionsOf(b)),
      ),
    ]
  }

  dispose(): void {
    for (const board of this.#boards.values()) board.scheduler.stop()
    this.#boards.clear()
    this.#resources.flush()
  }

  /** A RESOURCES reading of the account came in: every board of it shows it. */
  #accountChanged(account: string): void {
    this.#everyBoardOf(account, (other) => this.#publish(other))
  }

  #active(key: unknown): Board | null {
    const board = typeof key === 'string' ? this.#boards.get(key) : undefined
    return board?.scheduler.active ? board : null
  }

  #everyBoardOf(account: string, fn: (board: Board) => void): void {
    for (const board of this.#boards.values())
      if (board.scheduler.active && board.ctx.account() === account) fn(board)
  }

  #regionsOf(board: Board): string[] {
    if (board.ctx.spec.regions.length > 0) return board.ctx.spec.regions
    const own = value<{ region: string | null }>(board.scheduler, 'setup')?.region ?? null
    return [own ?? GLOBAL]
  }

  /** One reading per account at a time, when due (aws.md §3.3): the claim is the account's. */
  #claimCostExplorer(board: Board): boolean {
    const account = board.ctx.account()
    if (account === null || this.#ceReading.has(account)) return false
    const due = costExplorerDue(
      ceSettings(this.#deps.billing.get(account)),
      board.refreshing,
      this.#deps.now(),
    )
    if (due) this.#ceReading.add(account)
    return due
  }

  #costExplorerAnswered(board: Board, answer: CostExplorerAnswer): void {
    const account = board.ctx.account()
    if (account === null) return
    this.#ceReading.delete(account)
    const now = this.#deps.now()
    this.#deps.billing.update(account, (current) => ({
      ...current,
      ce: { ...current.ce, ...ceAfter(answer, now) },
    }))
    this.#everyBoardOf(account, (other) => this.#publish(other))
  }

  /** The requests made count toward the month's cap, whatever they answered. */
  #costExplorerPaid(board: Board, requests: number): void {
    const account = board.ctx.account()
    if (account === null) return
    this.#deps.billing.update(account, (current) => ({
      ...current,
      ce: { ...current.ce, used: current.ce.used + requests },
    }))
  }

  /**
   * The board's readings, put together again only when a probe settled, the account's readings
   * changed or a minute turned: the usage probes ask for them per region, and a fresh object
   * would build every resource row (and the forgotten list) again each time.
   */
  #readings(board: Board): AwsReadings {
    const now = this.#deps.now()
    const account = value<{ account: string }>(board.scheduler, 'identity')?.account ?? null
    const at = `${board.settled}|${this.#resources.version(account)}|${Math.floor(now / MINUTE)}`
    if (board.readings?.at === at) return board.readings.value
    const r = this.#readingsNow(board, now, account)
    board.readings = { at, value: r }
    return r
  }

  #readingsNow(board: Board, now: number, account: string | null): AwsReadings {
    const s = board.scheduler
    const r = emptyReadings(now, this.#regionsOf(board))
    const billing = value<{ points: [number, number][]; there: boolean; usd: boolean }>(
      s,
      'billing',
    )
    const regional = Object.fromEntries(
      REGIONAL.map(([field, probe]) => [field, value(s, probe) ?? {}]),
    ) as Pick<AwsReadings, (typeof REGIONAL)[number][0]>
    return {
      ...r,
      ...regional,
      identity: value(s, 'identity'),
      alias: value<{ alias: string | null }>(s, 'alias')?.alias ?? null,
      summary: value(s, 'summary'),
      credentials: value(s, 'credentials'),
      billing: billing?.points ?? null,
      billingThere: billing === null ? null : billing.there && billing.usd,
      billingServices: value(s, 'billing-services'),
      budgets: value(s, 'budgets'),
      plan: value(s, 'plan'),
      domains: value(s, 'domains'),
      savings: value(s, 'savings'),
      res: this.#resources.readings(account, r.regions, this.#judging(board, r.regions)),
    }
  }

  /** The judgement's first reading is still to come for one of the board's regions (§14.4). */
  #judging(board: Board, regions: readonly string[]): boolean {
    const quiet = value<Record<string, unknown>>(board.scheduler, 'res-quiet')
    return (
      quiet === null ||
      regions.some((region) => quiet[region] === null || quiet[region] === undefined)
    )
  }

  #publish(board: Board): void {
    if (board.scheduler.active) this.#deps.publish(this.#build(board))
  }

  /**
   * A probe of the board settled: main's memory of the account follows the reading, once, and
   * the board is shown again - every board of the account when a shared reading was kept.
   */
  #settled(board: Board): void {
    board.settled += 1
    const account = board.ctx.account()
    if (account === null) {
      this.#publish(board)
      return
    }
    const r = this.#readings(board)
    this.#resources.remember(account, r, forgotten(r).released)
    if (this.#putFor.delete(account)) this.#accountChanged(account)
    else this.#publish(board)
  }

  #build(board: Board): AwsBoard {
    const s = board.scheduler
    const now = this.#deps.now()
    const r = this.#readings(board)
    const items = attention(r)
    const trail = everywhere(r.trail).sort((a, b) => b.at - a.at)
    const identity = r.identity
    return {
      key: board.key,
      ...linkFields(s.problems(), s.anyReading(), board.ctx.spec.profile, s.denied()),
      profile: board.ctx.spec.profile,
      credentialProcess:
        value<{ credentialProcess?: boolean }>(s, 'setup')?.credentialProcess === true,
      account:
        identity === null ? null : { id: identity.account, alias: r.alias, arn: identity.arn },
      regions: r.regions,
      attention: items,
      resources: resourcesView(r, { denied: s.denied(), perMetricUsd: GMD_PRICE_USD }),
      checks: checksRun(r),
      alarms: items.filter((item) => item.tag === 'ALARM').length,
      active: activeCost(r),
      cost: this.#costView(board, r),
      activity: board.ctx.spec.activity ? trail : null,
      activityCapped: Object.values(r.trail).some((rows) => (rows ?? []).length >= 50),
      pulse: board.ctx.spec.activity ? pulseBins(trail as TrailEvent[], now) : null,
      accountView: accountView(r),
      changes: this.#changes(board, r),
      incidents: incidentsFor(this.#deps.incidents(), r.regions),
      ledger: paidOfAccount(
        summarize(board.ledger, BOARD_PROBES),
        identity === null ? null : this.#deps.billing.get(identity.account),
      ),
      cliVersion: this.#deps.cliVersion(),
      executable: this.#deps.executable(),
      readAt: s.outcome('identity').at,
      revision: `${board.settled}|${this.#resources.version(identity?.account ?? null)}`,
    }
  }

  /** Today's first ids against now's; a new local day starts the comparison again. */
  #changes(board: Board, r: AwsReadings) {
    const day = localDay(r.now)
    const sets = idSets(r)
    // Only once every service compared has been read in every region: one read later would
    // otherwise look like everything of it just came.
    const read = [r.instances, r.volumes, r.nats, r.balancers, r.databases, r.addresses].every(
      (per) => r.regions.every((region) => per[region] !== undefined && per[region] !== null),
    )
    if (!read) return null
    if (board.first === null || board.first.day !== day) {
      board.first = { day, at: r.now, sets }
      return null
    }
    return changesSince(board.first.sets, sets, board.first.at)
  }

  #costView(board: Board, r: AwsReadings): CostView {
    const month = billingMonth(r.billing, r.now)
    const account = r.identity?.account ?? null
    const stored = account === null ? null : this.#deps.billing.get(account)
    if (account !== null) this.#checkQuota(board, account, month.mtd, r)
    const services = r.billingServices ?? []
    const top = services.slice(0, 12)
    const other = services.slice(12).reduce((sum, x) => sum + x.usd, 0)
    return {
      billing: r.billingThere === true,
      mtd: month.mtd,
      lastSameDay: month.lastSameDay,
      projected: month.projected,
      daily: month.daily,
      lastDaily: month.lastDaily,
      services: other > 0 ? [...top, { name: 'Other', usd: other }] : top,
      budgets: r.budgets ?? [],
      plan: r.plan,
      ce: ceView(
        stored ?? freshAccount(r.now),
        stored !== null && asksNow(stored, this.#deps.startedAt, r.now),
      ),
      quota: quotaView(stored?.quota ?? null, month.mtd, r.billingThere),
      readAt: board.scheduler.outcome('billing').at,
    }
  }

  /** A step of the QUOTA newly passed this UTC month: a toast once, said on disk (aws.md §5.6). */
  #checkQuota(board: Board, account: string, mtd: number | null, r: AwsReadings): void {
    const stored = this.#deps.billing.get(account)
    const step = quotaCrossed(mtd, stored.quota.usd, stored.quota.steps, stored.quota.said)
    if (step === null || mtd === null) return
    this.#deps.billing.update(account, (current) => ({
      ...current,
      quota: {
        ...current.quota,
        said: [...current.quota.said, step],
      },
    }))
    const name = r.alias ?? account
    const share = `${Math.round(step * 100)}%`
    this.#deps.alert({
      id: `quota:${account}:${stored.quota.month}:${step}`,
      title: `Cost quota · ${share}`,
      body: `${name} passed ${share} of its $${stored.quota.usd.toLocaleString('en-US')} quota · $${mtd.toFixed(2)} this month`,
      maskedBody: `An AWS account passed ${share} of its quota`,
      tone: step >= 1 ? 'danger' : 'warn',
      action: { kind: 'cost', key: board.key },
    })
  }
}

/**
 * What a Cost Explorer reading changes in the account's store: an answer (and its time), a
 * refusal (off again, and why, §3.3), or a failure (the last answer kept, tried an hour on).
 */
function ceAfter(answer: CostExplorerAnswer, now: number): Partial<AccountBilling['ce']> {
  if (answer.kind === 'read')
    return { services: answer.services, forecast: answer.forecast, lastReadAt: now, failedAt: null }
  if (answer.kind === 'refused')
    return {
      state: 'refused',
      lastReadAt: now,
      refusedWhy:
        'Cost Explorer refused: this role may not call ce:GetCostAndUsage, or it is not enabled. Turned off.',
    }
  return { failedAt: now }
}

/** The readings kept per region, by the probe that reads each. */
const REGIONAL = [
  ['alarms', 'alarms'],
  ['impaired', 'impaired'],
  ['stacks', 'stacks'],
  ['trail', 'trail'],
  ['instances', 'instances'],
  ['volumes', 'volumes'],
  ['addresses', 'addresses'],
  ['nats', 'nats'],
  ['balancers', 'balancers'],
  ['openGroups', 'open-groups'],
  ['databases', 'databases'],
  ['functions', 'functions'],
  ['clusters', 'clusters'],
  ['certificates', 'certificates'],
  ['backups', 'backups'],
  ['buckets', 'buckets'],
  ['cpu', 'cpu'],
  ['guardduty', 'guardduty'],
  ['reserved', 'reserved'],
] as const satisfies readonly (readonly [keyof AwsReadings, string])[]

const ceView = (account: AccountBilling, ask: boolean): CostView['ce'] => ({
  state: account.ce.state,
  every: account.ce.every,
  cap: account.ce.cap,
  usedThisMonth: account.ce.used,
  answeredAt: account.ce.answeredAt,
  ask,
  services: account.ce.services,
  forecast: account.ce.forecast,
  readAt: account.ce.lastReadAt,
  refusedWhy: account.ce.refusedWhy,
})

function quotaView(
  quota: AccountBilling['quota'] | null,
  mtd: number | null,
  billingThere: boolean | null,
): CostView['quota'] {
  const usd = quota?.usd ?? 0
  return {
    usd,
    steps: quota?.steps ?? '80-100',
    share: usd > 0 && mtd !== null ? mtd / usd : null,
    unavailable:
      billingThere === false
        ? 'No billing metric: turn on "Receive CloudWatch billing alerts" in the Billing preferences (free), in USD.'
        : null,
  }
}

/**
 * The foot's paid count is the account's this UTC month, as aws-billing.json keeps it: a restart
 * must not say "paid APIs 0" after Cost Explorer ran (cloud-cli.md §3.2). The day's counts of
 * the free calls are this run's.
 */
function paidOfAccount(ledger: LedgerSummary, account: AccountBilling | null): LedgerSummary {
  if (account === null) return ledger
  // GetMetricData is counted by the metric (aws.md §14.4a), beside Cost Explorer's requests.
  return {
    ...ledger,
    paidRequests: account.ce.used,
    paidMetrics: account.gmd.used,
    paidUsd:
      Math.round((account.ce.used * CE_PRICE_USD + account.gmd.used * GMD_PRICE_USD) * 100) / 100,
    paidNotes: account.gmd.capReached ? ['GMD CAP REACHED'] : [],
  }
}

function accountView(r: AwsReadings): AccountView {
  const rows = r.credentials ?? []
  const root = rows.find((row) => row.user === '<root_account>')
  const gd = Object.values(r.guardduty).filter((x) => x !== null)
  return {
    rootMfa: r.summary?.mfa == null ? null : r.summary.mfa > 0,
    rootKeys: r.summary?.keys == null ? null : r.summary.keys > 0,
    rootUsedAt: root?.passwordUsed ?? null,
    users: r.summary?.users ?? null,
    roles: r.summary?.roles ?? null,
    mfaLessUsers: rows
      .filter((row) => row.user !== '<root_account>' && row.password && !row.mfa)
      .map((row) => row.user),
    oldKeys: rows.flatMap((row) =>
      row.keys
        .filter((k) => k.active && k.rotated !== null && r.now - k.rotated > 90 * 86_400_000)
        .map((k) => ({
          user: row.user,
          days: Math.floor((r.now - (k.rotated ?? r.now)) / 86_400_000),
        })),
    ),
    guardduty:
      gd.length === 0
        ? null
        : {
            high: gd.reduce((n, x) => n + (x?.high ?? 0), 0),
            medium: gd.reduce((n, x) => n + (x?.medium ?? 0), 0),
            low: gd.reduce((n, x) => n + (x?.low ?? 0), 0),
          },
  }
}

/**
 * Refusals that say nothing to fix: only an organization's management account answers the Free
 * Tier API, so a member account is refused and simply has no plan to show (aws.md §3.1).
 */
const QUIET_DENIALS = new Set(['freetier:GetAccountPlanState', 'freetier:GetFreeTierUsage'])

function linkFields(
  problems: readonly (CliProblem | null)[],
  anyReading: boolean,
  profile: string,
  refused: readonly string[],
): Pick<AwsBoard, 'link' | 'signIn' | 'problem' | 'denied'> {
  const signedOut = problems.find(
    (p): p is Extract<CliProblem, { kind: 'signed-out' }> => p?.kind === 'signed-out',
  )
  const error = problems.find(
    (p): p is Extract<CliProblem, { kind: 'error' }> => p?.kind === 'error',
  )
  const denied = refused.filter((action) => !QUIET_DENIALS.has(action))
  const link = linkOf(problems, anyReading)
  return {
    // A tolerated read refused sets no problem, yet the board is not all there: PARTIAL.
    link: link === 'linked' && denied.length > 0 ? 'partial' : link,
    signIn:
      signedOut !== undefined && link === 'signed-out' ? signInCommand(signedOut, profile) : null,
    problem: error?.text ?? null,
    denied,
  }
}
