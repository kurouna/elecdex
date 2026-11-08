/**
 * The shared core of the CLI panes, AWS STATUS and GITHUB STATUS (docs/cloud-cli.md): what one
 * reading is (a probe), what a call to a CLI is, and when a probe runs. Pure: main runs the
 * probes, the tests run them against a fake CLI.
 *
 * The page never names a probe or an argument. It subscribes to a board (a profile and its
 * regions, a host and its repositories) and main's table decides what is called (§2.4).
 */

export type CliTool = 'aws' | 'gh'

/** One start of a CLI: the program, its arguments and, for GraphQL, the body on standard input. */
export interface CliCall {
  tool: CliTool
  argv: readonly string[]
  stdin?: string
  /** A call that often fails for a reason of its own (traffic needs push access): its failure marks nothing. */
  tolerated?: boolean
  /**
   * A call into a region the pane does not show (the weekly sweep, Bedrock's use everywhere): an
   * organization's SCP refusing it there is expected, so its failure marks nothing - not even
   * PARTIAL (aws.md §14.4).
   */
  silent?: boolean
}

/** What a CLI answered. `missing`: the program could not be started (not installed). */
export interface CliResult {
  ok: boolean
  code: number | null
  stdout: string
  stderr: string
  missing: boolean
  timedOut: boolean
  tooLarge: boolean
}

export type RunCli = (call: CliCall) => Promise<CliResult>

/**
 * A call to a paid API, only through a probe of `PAID_PROBES` and only once the account's answer
 * is ON. Cost Explorer bills by the request; GetMetricData by the metric asked for (aws.md
 * §14.4a), which only the probe itself can count.
 */
export type PaidCost =
  | {
      /** The setting that turns it on; off unless the user said yes (aws.md §3.3). */
      setting: string
      perRequestUsd: number
    }
  | { setting: string; perMetricUsd: number }

/**
 * A call that may bill a tiny amount by the request and has no setting: a fixed monthly cap
 * the probe holds to per account (S3's ListBuckets, user decision 2026-11-08, aws.md §14.4).
 */
export interface MeteredTiny {
  metered: 'tiny'
  monthlyCap: number
  /** The day the user decided it. */
  decided: string
}

export type ProbeCost = 'free' | 'free-tier' | MeteredTiny | PaidCost

/**
 * Which of the shared CLI limit's two queues a probe's calls wait in (aws.md §14.4): `first`
 * goes ahead of `later`, so alarms, the sign-in, health, the trail and GitHub are never stuck
 * behind RESOURCES' long first reading.
 */
export type CliPriority = 'first' | 'later'

/** One reading on a board: one or more allowlisted calls, put together by `run`. */
export interface Probe<C, T> {
  id: string
  /** Its period on the wall clock's grid, in milliseconds. */
  every: number
  cost: ProbeCost
  /** `previous` is its last good value: a part that fails this time keeps what it had. */
  run(ctx: C, cli: RunCli, previous: T | null): Promise<T>
  /**
   * The probe whose answer this one reads for (the repositories, the regions): it waits for that
   * one's first reading, and runs again whenever that one's `keyOf` changes.
   */
  after?: string
  /** What the probes `after` this one depend on in its answer; a change runs them at once. */
  keyOf?(value: T): string
  /** Its calls go ahead of the others' (alarms, identity, health, trail). */
  first?: boolean
  /**
   * A bulk reading of RESOURCES (aws.md §14.4): one at a time across every board. `count`
   * readings (the lists and describes) go before `judge` ones (the metrics), and a board's judge
   * readings wait until each of its count readings has been tried once.
   */
  bulk?: 'count' | 'judge'
}

export const MINUTE = 60_000
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

/**
 * How long after its boundary a probe starts: a quarter of its period at most, five minutes at
 * most, in whole seconds, the same for the same id. AWS CLI takes about 1.2 s and 0.6 s of CPU a
 * call (aws.md §3.5): forty of them on one boundary would be half a minute of starts in a row.
 */
export function staggerMs(id: string, period: number): number {
  let hash = 2166136261
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i)
    hash = Math.imul(hash, 16777619) >>> 0
  }
  const span = Math.min(period / 4, 5 * MINUTE)
  const seconds = Math.floor(span / 1000)
  return seconds <= 0 ? 0 : (hash % seconds) * 1000
}

/** The wait after a failure: 1, 2, 4 … minutes, at most thirty (cloud-cli.md §3.1). */
export function backoffMs(failures: number): number {
  if (failures <= 0) return 0
  return Math.min(30 * MINUTE, 2 ** (failures - 1) * MINUTE)
}

/** Whether a reading taken at `at` is older than its probe's period, so it is due now. */
export function isDue(at: number | null, every: number, now: number): boolean {
  return at === null || now - at >= every
}
