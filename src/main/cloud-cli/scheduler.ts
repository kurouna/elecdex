import { type CliProblem, classifyCliError, redactCliText } from '@shared/cloud-cli/errors'
import type { LedgerEntry } from '@shared/cloud-cli/ledger'
import {
  backoffMs,
  type CliCall,
  type CliPriority,
  type CliResult,
  isDue,
  MINUTE,
  type Probe,
  type RunCli,
  staggerMs,
} from '@shared/cloud-cli/probe'
import { BoundaryTimer, type TimerDeps } from '../boundary-timer.js'

/**
 * Runs one board's probes on the wall clock's grid while somebody looks (docs/cloud-cli.md §3).
 *
 * Each probe has a timer on its period's boundary and starts a little after it (`staggerMs`), so
 * a board's probes do not all start the CLI at once. A probe that fails waits longer each time
 * (1, 2, 4 … 30 minutes); one signed out stops the board until REFRESH, since a credential
 * helper may open a window on every start. Results stay when the board stops: shown again at
 * once, and read again only when older than their period.
 */

export interface ProbeOutcome<T = unknown> {
  value: T | null
  problem: CliProblem | null
  /** When the last good value was read. */
  at: number | null
  /** When it was last tried. */
  triedAt: number | null
  /**
   * The operations its last reading was refused, by name (AWS's "perform: ce:GetCostAndUsage"):
   * a tolerated call's too, which sets no problem but still makes the board PARTIAL.
   */
  denied: string[]
}

export interface SchedulerDeps<C> extends TimerDeps {
  cli: RunCli
  /** Two starts at most, across every board (§2.3); `first` calls go ahead of `later` ones. */
  limit: <T>(work: () => Promise<T>, priority?: CliPriority) => Promise<T>
  /** The queue a probe without `first` waits in: AWS's are `later`, GitHub's all `first`. */
  priority?: CliPriority
  /**
   * Bulk readings in their own lane, shared by every board (aws.md §14.4): a `count` reading goes
   * ahead of a `judge` one. Without it, bulk readings run as any other.
   */
  bulk?: <T>(work: () => Promise<T>, priority?: CliPriority) => Promise<T>
  record: (entry: LedgerEntry) => void
  changed: () => void
  context: () => C
}

/** What a call that was not started answers (the board stopped, halted or was refreshed). */
const SKIPPED: CliResult = {
  ok: false,
  code: -1,
  stdout: '',
  stderr: '',
  missing: false,
  timedOut: false,
  tooLarge: false,
}

/**
 * Whether a call's answer is the one of a call never started: what a probe that reserved a paid
 * or metered request before the call gives back.
 */
export const notStarted = (result: CliResult): boolean => result === SKIPPED

/** A probe whose CLI could not even be started, signed out or not there: nothing else will work. */
const stopsTheBoard = (problem: CliProblem | null): boolean =>
  problem !== null && (problem.kind === 'no-cli' || problem.kind === 'signed-out')

/** A gh answer read with `-i` whose status line says 304: unchanged, and free of rate limit. */
export const isNotModified = (call: CliCall, result: CliResult): boolean =>
  call.tool === 'gh' && /^HTTP\/[\d.]+ 304/.test(result.stdout)

/**
 * A GraphQL answer that carries data beside its errors: a pinned repository deleted, a field the
 * token may not read (vulnerabilityAlerts). GitHub answers 200 and gh exits 1, but the data is
 * an answer, and the probe reads what is there; only an answer without data is a failure.
 */
export function isPartialAnswer(call: CliCall, result: CliResult): boolean {
  if (call.tool !== 'gh' || call.argv[1] !== 'graphql' || result.stdout.trim() === '') return false
  try {
    const data = (JSON.parse(result.stdout) as { data?: unknown } | null)?.data
    return typeof data === 'object' && data !== null
  } catch {
    return false
  }
}

/** What one reading's calls met, counted as they answer. */
interface Calls {
  problem: CliProblem | null
  requests: number
  /** The answers that said 304, each counted. */
  notModified: number
  denied: string[]
  /** A call was not started: the board stopped, halted or was refreshed while it waited. */
  skipped: boolean
}

export class ProbeScheduler<C> {
  readonly #deps: SchedulerDeps<C>
  readonly #probes: readonly Probe<C, unknown>[]
  readonly #timers = new Map<string, BoundaryTimer>()
  readonly #outcomes = new Map<string, ProbeOutcome>()
  readonly #failures = new Map<string, number>()
  readonly #running = new Set<string>()
  readonly #pending = new Set<unknown>()
  /** The last `keyOf` of each probe others run after. */
  readonly #keys = new Map<string, string>()
  /** Probes asked to run while they were running: they go once more when they end. */
  readonly #again = new Set<string>()
  /**
   * Probes still running from before a stop when the board started again: their run belongs to
   * the old generation, so when it ends they go again if still due, and let their dependents go.
   */
  readonly #resume = new Set<string>()
  #started = false
  #halted = false
  /** Starts, stops and refreshes: a run from an older one may no longer start the CLI. */
  #generation = 0

  constructor(deps: SchedulerDeps<C>, probes: readonly Probe<C, unknown>[]) {
    this.#deps = deps
    this.#probes = probes
  }

  get active(): boolean {
    return this.#started
  }

  /** Stopped for a missing CLI or a sign-in, until `refresh`. */
  get halted(): boolean {
    return this.#halted
  }

  outcome<T>(id: string): ProbeOutcome<T> {
    return (
      (this.#outcomes.get(id) as ProbeOutcome<T> | undefined) ?? {
        value: null,
        problem: null,
        at: null,
        triedAt: null,
        denied: [],
      }
    )
  }

  problems(): (CliProblem | null)[] {
    return this.#probes.map((probe) => this.#outcomes.get(probe.id)?.problem ?? null)
  }

  /** Every operation refused in the probes' last readings, sorted. */
  denied(): string[] {
    return [...new Set([...this.#outcomes.values()].flatMap((outcome) => outcome.denied))].sort()
  }

  anyReading(): boolean {
    return [...this.#outcomes.values()].some((outcome) => outcome.at !== null)
  }

  start(): void {
    if (this.#started) return
    this.#started = true
    this.#generation += 1
    for (const probe of this.#probes) {
      const timer = new BoundaryTimer(this.#deps, probe.every, () => this.#onBoundary(probe))
      this.#timers.set(probe.id, timer)
      timer.start()
      // A run left from before the stop is of the old generation: its calls still waiting are
      // dropped, so the probe is looked at again when that run ends.
      if (this.#running.has(probe.id)) this.#resume.add(probe.id)
      else if (isDue(this.outcome(probe.id).at, probe.every, this.#deps.now()))
        void this.#run(probe)
    }
  }

  /** Stops the timers; calls still waiting for a CLI slot are dropped, not started. */
  stop(): void {
    this.#started = false
    this.#generation += 1
    this.#again.clear()
    this.#resume.clear()
    for (const timer of this.#timers.values()) timer.stop()
    this.#timers.clear()
    for (const handle of this.#pending) this.#deps.clearTimer(handle)
    this.#pending.clear()
  }

  /**
   * Every probe now, even a halted board's (the user pressed REFRESH, or signed in). A probe
   * still running from before goes again when it ends; what it met before the press cannot halt
   * the board again.
   */
  refresh(): void {
    this.#halted = false
    this.#generation += 1
    this.#failures.clear()
    for (const probe of this.#probes) {
      if (this.#running.has(probe.id)) this.#again.add(probe.id)
      else void this.#run(probe)
    }
  }

  /** One probe now, when the page opened what it reads (a drill-down's on-demand reading). */
  runNow(id: string): void {
    const probe = this.#probes.find((entry) => entry.id === id)
    if (probe === undefined) return
    if (this.#running.has(probe.id)) this.#again.add(probe.id)
    else void this.#run(probe)
  }

  /**
   * A period's boundary. A reading taken just before it (the board was shown a few seconds before
   * the boundary) stands until the next one: it would be read twice in a row. "Just" is the
   * stagger's own span (a quarter of the period, five minutes at most): half a period once let a
   * daily reading taken at 13:00 skip midnight and stand 35 hours.
   */
  #onBoundary(probe: Probe<C, unknown>): void {
    const { at } = this.outcome(probe.id)
    const failing = (this.#failures.get(probe.id) ?? 0) > 0
    const just = Math.min(probe.every / 4, 5 * MINUTE)
    if (!failing && at !== null && this.#deps.now() - at < just) return
    this.#later(probe)
  }

  #later(probe: Probe<C, unknown>, ms = staggerMs(probe.id, probe.every)): void {
    const handle = this.#deps.setTimer(() => {
      this.#pending.delete(handle)
      void this.#run(probe)
    }, ms)
    this.#pending.add(handle)
  }

  /**
   * Whether a probe may start now: the board runs, it is not already running, what it reads for
   * has been read, and its wait is over.
   */
  #mayRun(probe: Probe<C, unknown>): boolean {
    if (!this.#started || this.#halted || this.#running.has(probe.id)) return false
    if (probe.after !== undefined && this.outcome(probe.after).at === null) return false
    if (probe.bulk === 'judge' && !this.#countsTried()) return false
    const failures = this.#failures.get(probe.id) ?? 0
    const tried = this.outcome(probe.id).triedAt
    return failures === 0 || tried === null || this.#deps.now() - tried >= backoffMs(failures)
  }

  /**
   * Whether every bulk count reading has been tried once (or cannot run, what it reads for having
   * failed): the first cycle reads what is there before it judges how it is used (aws.md §14.4).
   */
  #countsTried(): boolean {
    return this.#probes.every((probe) => {
      if (probe.bulk !== 'count' || this.outcome(probe.id).triedAt !== null) return true
      if (probe.after === undefined) return false
      const before = this.outcome(probe.after)
      return before.at === null && before.triedAt !== null
    })
  }

  /** A bulk probe waits its turn in the shared lane; any other runs at once. */
  #lane<T>(probe: Probe<C, unknown>, work: () => Promise<T>): Promise<T> {
    const bulk = this.#deps.bulk
    if (probe.bulk === undefined || bulk === undefined) return work()
    return bulk(work, probe.bulk === 'count' ? 'first' : 'later')
  }

  /** Whether a run started in `generation` may still start the CLI. */
  #live(generation: number): boolean {
    return this.#started && !this.#halted && generation === this.#generation
  }

  async #run(probe: Probe<C, unknown>): Promise<void> {
    if (!this.#mayRun(probe)) return
    this.#running.add(probe.id)
    const generation = this.#generation
    const priority: CliPriority = probe.first === true ? 'first' : (this.#deps.priority ?? 'first')
    const calls: Calls = {
      problem: null,
      requests: 0,
      notModified: 0,
      denied: [],
      skipped: false,
    }
    // A call that waited for a slot while the board stopped, halted or was refreshed is not
    // started: a signed-out profile must not open a credential window per queued call.
    const cli: RunCli = async (call) => {
      const result = await this.#deps.limit(
        () => (this.#live(generation) ? this.#deps.cli(call) : Promise.resolve(SKIPPED)),
        priority,
      )
      if (result === SKIPPED) {
        calls.skipped = true
        return result
      }
      calls.requests += 1
      if (isNotModified(call, result)) calls.notModified += 1
      else if (!result.ok && !isPartialAnswer(call, result)) {
        noteFailure(calls, call, result)
        // At once, not when the probe ends: the calls queued behind this one must not start.
        if (stopsTheBoard(calls.problem) && generation === this.#generation) this.#halted = true
      }
      return result
    }
    const before = this.outcome(probe.id)
    try {
      const value = await this.#lane(probe, () =>
        probe.run(this.#deps.context(), cli, before.value),
      )
      if (!calls.skipped)
        this.#outcomes.set(probe.id, settled(before, value, calls, this.#deps.now()))
    } catch (error) {
      calls.problem ??= {
        kind: 'error',
        text: redactCliText(error instanceof Error ? error.message : 'failed').slice(0, 120),
      }
      this.#outcomes.set(probe.id, {
        ...before,
        problem: calls.problem,
        triedAt: this.#deps.now(),
        denied: calls.denied,
      })
    } finally {
      this.#running.delete(probe.id)
    }
    this.#settle(probe, calls, generation)
  }

  /** After a run: failures and the halt, the dependents, the ledger, and a retry or a rerun. */
  #settle(probe: Probe<C, unknown>, calls: Calls, generation: number): void {
    const current = generation === this.#generation
    // A run of before a stop, the board shown again since: what it read stands, but what it met
    // cannot halt the new generation or back it off (as after a REFRESH).
    const resumed = !current && this.#started && this.#resume.delete(probe.id)
    if (!calls.skipped && current) this.#failed(probe, calls.problem)
    if (!calls.skipped && (current || (resumed && calls.problem === null))) {
      this.#runDependents(probe)
      if (probe.bulk === 'count') this.#startJudges()
    }
    this.#counted(probe, calls)
    if (this.#again.delete(probe.id)) void this.#run(probe)
    else if (resumed && isDue(this.outcome(probe.id).at, probe.every, this.#deps.now()))
      void this.#run(probe)
  }

  /**
   * The ledger and the board told. A reading that started no CLI (every answer from the
   * account's store, or every call dropped) is no call of the day's; dropped, it changed nothing.
   */
  #counted(probe: Probe<C, unknown>, calls: Calls): void {
    if (calls.requests > 0 || calls.problem !== null)
      this.#deps.record({
        probe: probe.id,
        cost: probe.cost,
        requests: calls.requests,
        notModified: calls.notModified,
        failed: calls.problem !== null,
      })
    if (!calls.skipped || calls.requests > 0) this.#deps.changed()
  }

  /** A failure counted (or the count cleared), the board halted, or a retry after the wait. */
  #failed(probe: Probe<C, unknown>, problem: CliProblem | null): void {
    const failures = problem === null ? 0 : (this.#failures.get(probe.id) ?? 0) + 1
    this.#failures.set(probe.id, failures)
    if (stopsTheBoard(problem)) this.#halted = true
    // After a failure, try again when the wait is over, not only on the period's boundary.
    else if (failures > 0 && this.#started && backoffMs(failures) < probe.every)
      this.#later(probe, backoffMs(failures))
  }

  /** The judge readings never tried, once the last count reading has been. */
  #startJudges(): void {
    if (!this.#countsTried()) return
    for (const judge of this.#probes)
      if (judge.bulk === 'judge' && this.outcome(judge.id).triedAt === null) void this.#run(judge)
  }

  /**
   * The probes after this one, when what they read for changed or was read for the first time
   * (a probe without `keyOf` has one key: its first reading lets its dependents go, once).
   */
  #runDependents(probe: Probe<C, unknown>): void {
    const value = this.outcome(probe.id).value
    if (value === null) return
    const key = probe.keyOf === undefined ? '' : probe.keyOf(value)
    if (this.#keys.get(probe.id) === key) return
    this.#keys.set(probe.id, key)
    for (const dependent of this.#probes) {
      if (dependent.after !== probe.id) continue
      if (this.#running.has(dependent.id)) this.#again.add(dependent.id)
      else void this.#run(dependent)
    }
  }
}

/**
 * The outcome of a finished reading. A probe answers null for "nothing new": a 304 keeps the
 * value and counts as a fresh look.
 */
/** A failed call: its refused operation noted, and the probe's problem unless it is tolerated. */
function noteFailure(
  calls: { problem: CliProblem | null; denied: string[] },
  call: CliCall,
  result: CliResult,
): void {
  if (call.silent === true) return
  const problem = classifyCliError(call.tool, result)
  // A region without the service is an answer, not a failure: no backoff, no OFFLINE (§14.4).
  if (problem.kind === 'not-offered') return
  if (problem.kind === 'denied' && problem.action !== null) calls.denied.push(problem.action)
  if (calls.problem === null && call.tolerated !== true) calls.problem = problem
}

function settled(before: ProbeOutcome, value: unknown, calls: Calls, now: number): ProbeOutcome {
  const read = value !== null && value !== undefined
  return {
    denied: calls.denied,
    value: read ? value : before.value,
    problem: calls.problem,
    at: read || (calls.notModified > 0 && calls.problem === null) ? now : before.at,
    triedAt: now,
  }
}

/**
 * How many CLI starts run at once across both panes, and how many of them RESOURCES' bulk
 * readings may hold. An AWS CLI call costs about 1.2 s on Windows (0.5 s of it starting Python),
 * and a new account's first cycle is some 250 calls: 2 and 1 took about six and a half minutes,
 * 4 and 3 under three, with the figures in 8 s instead of 33 (decisions.md, 2026-11-08).
 */
export const CLI_LANES = 4
export const BULK_LANES = 3

/**
 * A limit on how many CLI starts run at once, shared by every board. A `first` call waiting
 * starts before any `later` one (aws.md §14.4); within a queue, in the order they came.
 */
export function concurrencyLimit(
  max: number,
): <T>(work: () => Promise<T>, priority?: CliPriority) => Promise<T> {
  let running = 0
  const queues: Record<CliPriority, (() => void)[]> = { first: [], later: [] }
  const next = (): void => {
    if (running >= max) return
    const start = queues.first.shift() ?? queues.later.shift()
    if (start !== undefined) start()
  }
  return (work, priority = 'first') =>
    new Promise((resolve, reject) => {
      queues[priority].push(() => {
        running += 1
        work()
          .then(resolve, reject)
          .finally(() => {
            running -= 1
            next()
          })
      })
      next()
    })
}
