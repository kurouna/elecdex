import { type CliProblem, signInCommand } from '@shared/cloud-cli/errors'
import {
  emptyLedger,
  type LedgerState,
  linkOf,
  localDay,
  recordReading,
  summarize,
} from '@shared/cloud-cli/ledger'
import type { RunCli } from '@shared/cloud-cli/probe'
import type { StatusIncident } from '@shared/cloud-cli/status'
import { parseBoardKey } from '@shared/github/board'
import {
  buildQueue,
  foldEvents,
  GH_LIMITS,
  htmlUrlOf,
  inboxItems,
  prVerdict,
  starDelta,
  streaks,
} from '@shared/github/derive'
import {
  type AuthState,
  type parseQueueAnswer,
  parseRepoPullsAnswer,
  type Release,
  type RepoEvent,
  type RepoNode,
  type Run,
  runState,
  time,
} from '@shared/github/parse'
import { graphqlBody, REPO_PULLS_QUERY } from '@shared/github/queries'
import type {
  Contributions,
  GithubBoard,
  InboxItem,
  InboxState,
  RateState,
  RepoDetail,
  RepoTile,
} from '@shared/github/types'
import type { TimerDeps } from '../boundary-timer.js'
import { evictStopped, gapLeft, REFRESH_GAP_MS } from '../cloud-cli/boards.js'
import { isPartialAnswer, ProbeScheduler } from '../cloud-cli/scheduler.js'
import { type GhContext, GITHUB_PROBES, type InboxReading, type ReposReading } from './probes.js'

/**
 * GITHUB STATUS in main (docs/github.md): one board per key, read while a page subscribes to it
 * and only then. Each board has its probe scheduler, the conditional answers behind its 304s,
 * and the URLs of what it last showed, which is all `open` will open.
 */

export interface StarNotes {
  /** Notes today's count of a public repository; private ones are never written (§6). */
  note(repo: string, day: string, stars: number): void
  history(repo: string): Readonly<Record<string, number>>
}

export interface GithubServiceDeps extends TimerDeps {
  cli: RunCli
  limit: <T>(work: () => Promise<T>) => Promise<T>
  stars: StarNotes
  publish: (board: GithubBoard) => void
  incidents: () => StatusIncident[]
  ghVersion: () => string | null
  executable: () => string | null
}

interface Board {
  key: string
  ctx: GhContext
  scheduler: ProbeScheduler<GhContext>
  urls: Map<string, string>
  ledger: LedgerState
  refreshedAt: number
  detail: Map<string, RepoDetail>
}

export class GithubService {
  readonly #deps: GithubServiceDeps
  readonly #boards = new Map<string, Board>()

  constructor(deps: GithubServiceDeps) {
    this.#deps = deps
  }

  /** The keys main reads now, for the diagnostics (sorted, empty when idle). */
  watching(): string[] {
    return [...this.#boards.values()]
      .filter((b) => b.scheduler.active)
      .map((b) => `board:${b.key}`)
      .sort()
  }

  /** Starts reading a board (a page shows it); a key that is not canonical is refused. */
  watch(key: string): GithubBoard | null {
    const spec = parseBoardKey(key)
    if (spec === null) return null
    let board = this.#boards.get(key)
    if (board === undefined) {
      const created: Board = {
        key,
        urls: new Map(),
        ledger: emptyLedger(this.#deps.now()),
        refreshedAt: 0,
        detail: new Map(),
        ctx: { spec, conditional: new Map(), repos: () => this.#watchedRepos(created) },
        scheduler: undefined as unknown as ProbeScheduler<GhContext>,
      }
      created.scheduler = new ProbeScheduler<GhContext>(
        {
          ...this.#deps,
          cli: this.#deps.cli,
          limit: this.#deps.limit,
          context: () => created.ctx,
          record: (entry) => {
            created.ledger = recordReading(created.ledger, entry, this.#deps.now())
          },
          changed: () => this.#publish(created),
        },
        GITHUB_PROBES,
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

  /** REFRESH: every probe now, at most once in 30 s per board. Answers the wait left (ms). */
  refresh(key: string): number {
    const board = this.#boards.get(key)
    if (board === undefined || !board.scheduler.active) return 0
    const left = gapLeft(board.refreshedAt, this.#deps.now())
    if (left > 0) return left
    board.refreshedAt = this.#deps.now()
    // A press reads a repository's inside again too, not five minutes on.
    board.detail.clear()
    board.scheduler.refresh()
    return REFRESH_GAP_MS
  }

  /** The URL of an item the board last showed, or null: the page cannot name a URL of its own. */
  urlOf(key: string, id: string): string | null {
    const board = this.#boards.get(key)
    if (board === undefined) return null
    const incident = /^incident:(.+)$/.exec(id)?.[1]
    if (incident !== undefined) {
      const url = this.#deps.incidents().find((i) => i.id === incident)?.url ?? null
      return url === null ? null : htmlUrlOf(url)
    }
    // Every URL an answer gave (a run's, a pull's, a release's) is held to github.com's shapes.
    const url = board.urls.get(id)
    return url === undefined ? null : htmlUrlOf(url)
  }

  /** One repository's inside, read when its drill-down opens and kept five minutes (§5.3). */
  async detail(key: string, repo: string): Promise<RepoDetail | null> {
    const board = this.#boards.get(key)
    // A board stopped at a sign-in starts no CLI, on demand either.
    if (board === undefined || !board.scheduler.active || board.scheduler.halted) return null
    if (!this.#watchedRepos(board).some((entry) => entry.name === repo)) return null
    const kept = board.detail.get(repo)
    const now = this.#deps.now()
    if (kept !== undefined && now - kept.readAt < 5 * 60_000) return kept
    const [owner, name] = repo.split('/') as [string, string]
    const call = {
      tool: 'gh' as const,
      argv: ['api', 'graphql', '--input', '-'],
      stdin: graphqlBody(REPO_PULLS_QUERY, { owner, name }),
    }
    const result = await this.#deps.limit(() => this.#deps.cli(call))
    const answered = result.ok || isPartialAnswer(call, result)
    board.ledger = recordReading(
      board.ledger,
      { probe: 'detail', cost: 'free', requests: 1, failed: !answered },
      now,
    )
    const answer = answered ? parseRepoPullsAnswer(result.stdout) : null
    const runs = board.scheduler.outcome<Record<string, Run[] | null>>('runs').value?.[repo] ?? []
    for (const run of runs) board.urls.set(`run:${repo}:${run.id}`, run.html_url)
    const pulls = (answer?.pullRequests ?? []).map((pull) => {
      const verdict = prVerdict(pull)
      const id = `pull:${repo}#${pull.number}`
      board.urls.set(id, pull.url)
      return {
        id,
        number: pull.number,
        title: pull.title,
        by: pull.author?.login ?? '',
        verdict: verdict.tag,
        verdictWeight: verdict.weight,
        ci: verdict.ci,
        since: time(pull.createdAt),
      }
    })
    const ahead =
      board.scheduler.outcome<Record<string, number | null>>('ahead').value?.[repo] ?? null
    const releases = (answer?.releases.nodes ?? []).map((release, i) => {
      const id = `release:${repo}:${release.tagName}`
      board.urls.set(id, release.url)
      return { id, ...releaseOf(release, i === 0 ? ahead : null) }
    })
    const detail: RepoDetail = {
      key,
      repo,
      runs: runs.map((run) => runRow(repo, run)),
      pulls,
      releases,
      readAt: now,
    }
    // A failed reading is shown (the runs are the probes'), never kept: the next look reads again.
    if (answer !== null) board.detail.set(repo, detail)
    this.#publish(board)
    return detail
  }

  /** A public status change: every active board shows it at once. */
  incidentsChanged(): void {
    for (const board of this.#boards.values()) if (board.scheduler.active) this.#publish(board)
  }

  dispose(): void {
    for (const board of this.#boards.values()) board.scheduler.stop()
    this.#boards.clear()
  }

  #watchedRepos(board: Board) {
    const reading = board.scheduler?.outcome<ReposReading | null>('repos').value ?? null
    if (reading === null) {
      return board.ctx.spec.repos === 'auto'
        ? []
        : board.ctx.spec.repos.map((name) => ({
            name,
            private: false,
            defaultBranch: 'main',
            release: null,
          }))
    }
    return reading.nodes.flatMap((node, i) =>
      node === null
        ? []
        : [
            {
              name: reading.names[i] ?? node.nameWithOwner,
              private: node.isPrivate,
              defaultBranch: node.defaultBranchRef?.name ?? 'main',
              release: node.releases.nodes[0]?.tagName ?? null,
            },
          ],
    )
  }

  #publish(board: Board): void {
    if (board.scheduler.active) this.#deps.publish(this.#build(board))
  }

  #build(board: Board): GithubBoard {
    const s = board.scheduler
    const now = this.#deps.now()
    const auth = s.outcome<AuthState>('auth').value
    const me = auth?.login ?? null
    const inbox = s.outcome<InboxReading | null>('inbox')
    const runs = s.outcome<Record<string, Run[] | null>>('runs').value ?? {}
    const advisories = s.outcome<Record<string, number | null>>('advisories').value ?? {}
    const privacy = new Map(this.#watchedRepos(board).map((repo) => [repo.name, repo.private]))
    const tiles = this.#tiles(s, runs, advisories, now)
    const notifications = inbox.value?.notifications ?? []
    const queueAnswer = s.outcome<ReturnType<typeof parseQueueAnswer>>('queue').value
    const queue = buildQueue({
      review: queueAnswer?.review ?? [],
      mine: queueAnswer?.mine ?? [],
      assigned: queueAnswer?.assigned ?? [],
      triage: queueAnswer?.triage ?? [],
      notifications,
      red: redBranches(tiles, runs),
      approvals: approvalsOf(runs, privacy),
      advisories: Object.entries(advisories).map(([repo, count]) => ({
        repo,
        count: count ?? 0,
        private: privacy.get(repo) ?? false,
      })),
      me,
      now,
    })
    const inboxed = inboxItems(notifications)
    // The drill-down's URLs stay; the lists' are those of this reading only.
    board.urls = new Map([...board.urls].filter(([id]) => /^(run|pull|release):/.test(id)))
    for (const [id, url] of [...queue.urls, ...inboxed.urls]) board.urls.set(id, url)
    for (const tile of tiles) board.urls.set(`repo:${tile.name}`, `https://github.com/${tile.name}`)
    const events = s.outcome<Record<string, RepoEvent[] | null>>('events').value ?? {}
    return {
      key: board.key,
      ...linkFields(s.problems(), s.anyReading(), auth),
      login: me,
      scopes: auth?.scopes ?? [],
      queue: queue.items,
      inbox: inboxState(inbox.value, inboxed.items, auth),
      // The last 24 hours: work on an open project goes on overnight in other time zones.
      events: foldedEvents(events, me, now - GH_LIMITS.eventsHours * 3_600_000, privacy),
      repos: tiles,
      contrib: contribOf(s.outcome<{ total: number; days: number[] } | null>('contrib').value),
      rate: s.outcome<RateState | null>('rate').value,
      incidents: this.#deps.incidents(),
      ledger: summarize(board.ledger, GITHUB_PROBES),
      ghVersion: this.#deps.ghVersion(),
      executable: this.#deps.executable(),
      readAt: s.outcome('queue').at,
      nextInboxAt:
        inbox.triedAt === null ? null : inbox.triedAt + (inbox.value?.pollSeconds ?? 60) * 1000,
    }
  }

  /** The repository tiles, noting each public one's stars for the day (§6). */
  #tiles(
    s: ProbeScheduler<GhContext>,
    runs: Record<string, Run[] | null>,
    advisories: Record<string, number | null>,
    now: number,
  ): RepoTile[] {
    const repos = s.outcome<ReposReading | null>('repos').value
    const traffic = s.outcome<Record<string, number[] | null>>('traffic').value ?? {}
    const ahead = s.outcome<Record<string, number | null>>('ahead').value ?? {}
    const day = localDay(now)
    return (repos?.nodes ?? []).flatMap((node, i): RepoTile[] => {
      if (node === null) return []
      const name = repos?.names[i] ?? node.nameWithOwner
      if (!node.isPrivate) this.#deps.stars.note(name, day, node.stargazerCount)
      const history = node.isPrivate ? {} : this.#deps.stars.history(name)
      const onDefault = (runs[name] ?? []).filter(
        (run) => run.head_branch === (node.defaultBranchRef?.name ?? 'main'),
      )
      const latest = onDefault.find((run) => run.status === 'completed')
      return [
        tileOf(node, name, {
          stars: starDelta(history, day, node.stargazerCount),
          runs: onDefault.slice(0, 10).map(runState).reverse(),
          red: latest !== undefined && runState(latest) === 'failure',
          views: traffic[name] ?? null,
          advisories: advisories[name] ?? null,
          ahead: ahead[name] ?? null,
        }),
      ]
    })
  }
}

/** Watched repositories whose default branch's latest finished run failed, with the run of failures. */
function redBranches(tiles: readonly RepoTile[], runs: Record<string, Run[] | null>) {
  return tiles
    .filter((tile) => tile.red)
    .map((tile) => {
      const finished = (runs[tile.name] ?? []).filter(
        (run) => run.head_branch === tile.defaultBranch && run.status === 'completed',
      )
      const failures = finished.findIndex((run) => runState(run) !== 'failure')
      const first = finished[0]
      return {
        repo: tile.name,
        workflow: first?.name ?? 'CI',
        failures: failures < 0 ? finished.length : failures,
        at: time(first?.updated_at),
        url: first?.html_url ?? `https://github.com/${tile.name}/actions`,
        private: tile.private,
      }
    })
}

/** Runs that wait for a maintainer's approval, in every watched repository. */
function approvalsOf(runs: Record<string, Run[] | null>, privacy: ReadonlyMap<string, boolean>) {
  return Object.entries(runs).flatMap(([repo, list]) =>
    (list ?? [])
      .filter((run) => runState(run) === 'action')
      .map((run) => ({
        repo,
        title: run.display_title ?? run.name ?? 'a workflow',
        at: time(run.created_at),
        url: run.html_url,
        private: privacy.get(repo) ?? false,
        id: run.id,
      })),
  )
}

function foldedEvents(
  events: Record<string, RepoEvent[] | null>,
  me: string | null,
  since: number,
  privacy: ReadonlyMap<string, boolean>,
) {
  return Object.entries(events)
    .flatMap(([repo, list]) => {
      const one = foldEvents(repo, list ?? [], me, since, privacy.get(repo) ?? false)
      return one === null ? [] : [one]
    })
    .sort((a, b) => b.at - a.at)
}

/** The link word, the sign-in command and the redacted problem, from what the probes met. */
function linkFields(
  problems: readonly (CliProblem | null)[],
  anyReading: boolean,
  auth: AuthState | null,
): Pick<GithubBoard, 'link' | 'signIn' | 'problem'> {
  // No gh at all says so first: there is nothing to sign in with.
  const signedOut =
    !problems.some((p) => p?.kind === 'no-cli') &&
    ((auth !== null && !auth.signedIn) || problems.some((p) => p?.kind === 'signed-out'))
  const error = problems.find(
    (p): p is Extract<CliProblem, { kind: 'error' }> => p?.kind === 'error',
  )
  return {
    link: signedOut ? 'signed-out' : linkOf(problems, anyReading),
    signIn: signedOut ? signInCommand({ kind: 'signed-out', via: 'gh' }, 'github.com') : null,
    problem: error?.text ?? null,
  }
}

function inboxState(
  reading: InboxReading | null,
  items: InboxItem[],
  auth: AuthState | null,
): InboxState {
  if (
    reading !== null &&
    (reading.status === 401 || reading.status === 403 || reading.status === 404)
  ) {
    const env = auth?.tokenSource === 'GH_TOKEN' || auth?.tokenSource === 'GITHUB_TOKEN'
    if (env) return { readable: false, why: 'env-token', command: null }
    const classic = (auth?.scopes.length ?? 0) > 0
    return classic
      ? { readable: false, why: 'scope', command: 'gh auth refresh -h github.com -s notifications' }
      : { readable: false, why: 'fine-grained', command: 'gh auth login' }
  }
  return { readable: true, items, pollSeconds: reading?.pollSeconds ?? 60 }
}

/** The calendar's figures: this week is the last seven days, last week the seven before them. */
export function contribOf(reading: { total: number; days: number[] } | null): Contributions | null {
  if (reading === null) return null
  const days = reading.days
  // Both ends held at the start: a calendar shorter than two weeks must not count from its end.
  const sum = (from: number, to: number) =>
    days
      .slice(Math.max(0, days.length - to), Math.max(0, days.length - from))
      .reduce((a, b) => a + b, 0)
  return { total: reading.total, days, week: sum(0, 7), lastWeek: sum(7, 14), ...streaks(days) }
}

function tileOf(
  node: RepoNode,
  name: string,
  r: {
    stars: { delta: number | null; since: string | null; spark: number[] }
    runs: RepoTile['runs']
    red: boolean
    views: number[] | null
    advisories: number | null
    ahead: number | null
  },
): RepoTile {
  const { stars, runs, red, views, advisories, ahead } = r
  const release = node.releases.nodes[0]
  return {
    name,
    private: node.isPrivate,
    stars: node.stargazerCount,
    starsDelta7: stars.delta,
    starsSince: stars.since,
    starSpark: stars.spark,
    forks: node.forkCount,
    issues: node.issues.totalCount,
    pulls: node.pullRequests.totalCount,
    alerts:
      node.hasVulnerabilityAlertsEnabled === false
        ? 'off'
        : (node.vulnerabilityAlerts?.totalCount ?? null),
    release: release === undefined ? null : releaseOf(release, ahead),
    defaultBranch: node.defaultBranchRef?.name ?? 'main',
    runs,
    red,
    views14: views,
    advisories,
  }
}

/** A release as a tile and the drill-down show it: its assets' downloads summed. */
function releaseOf(release: Release, ahead: number | null) {
  return {
    tag: release.tagName,
    prerelease: release.isPrerelease,
    at: time(release.publishedAt ?? release.createdAt),
    downloads: release.releaseAssets.nodes.reduce((sum, asset) => sum + asset.downloadCount, 0),
    ahead,
  }
}

/** A workflow run in a repository's drill-down. */
function runRow(repo: string, run: Run): RepoDetail['runs'][number] {
  return {
    id: `run:${repo}:${run.id}`,
    state: runState(run),
    workflow: run.name ?? 'workflow',
    branch: run.head_branch ?? '',
    title: run.display_title ?? '',
    event: run.event,
    seconds: run.run_started_at
      ? Math.max(0, Math.round((time(run.updated_at) - time(run.run_started_at)) / 1000))
      : null,
    at: time(run.created_at),
  }
}
