import { type AiProvider, type AiProviderKind, isLocalAddress } from '@shared/ai'
import {
  type Ballot,
  countsAsVote,
  ELEC_LIMITS,
  type ElecEvent,
  type ElecRounds,
  type ElecRun,
  type ElecSettings,
  type ElecSubmitResult,
  firstRoundPrompt,
  type Heard,
  personaOf,
  readVote,
  resolveSeat,
  SESSION_VERSION,
  type Session,
  type SessionSummary,
  secondRoundPrompt,
  sessionTitle,
  statementRoom,
  UNIT_INDICES,
  type UnitIndex,
  unitLabel,
  unitSystem,
} from '@shared/elec'
import {
  describeFailure,
  isUnreachable,
  type ProviderAdapter,
  type StreamResult,
} from './adapter.js'
import type { SessionStore } from './store.js'
import { type Target, targetFor } from './target.js'

/**
 * The ELEC system's deliberations: a motion put to three units, each a provider
 * and a model with a standpoint of its own, and the votes they cast.
 *
 * The chat service's rules hold here (service.ts): free of Electron, everything
 * passed in; the answers being written are main's, so a moved pane or a reload
 * costs nothing; pieces are gathered and sent every FLUSH_MS. What differs is the
 * shape: not one conversation that grows, but up to six short answers - three
 * in a round, one or two rounds - and a resolution that is only ever computed
 * from them (`resolve`), never stored.
 *
 * Units on the same server of this machine or the local network are asked one
 * after another: a single GPU given three prompts at once splits its memory and
 * its context between them and is slower for all three. Hosted services are
 * asked together.
 */

const FLUSH_MS = 100

export interface ElecDeps {
  store: SessionStore
  providers(): readonly AiProvider[]
  settings(): ElecSettings
  keyFor(providerId: string): string | null
  adapter(kind: AiProviderKind): Promise<ProviderAdapter>
  now(): number
  newId(): string
  setTimer(fn: () => void, ms: number): unknown
  clearTimer(handle: unknown): void
  publish(event: ElecEvent): void
  /** The list of deliberations changed. */
  listChanged(list: SessionSummary[]): void
}

/** A unit as it sits for this deliberation. */
interface Seat {
  unit: UnitIndex
  target: Target
  model: string
  system: string
  /** Tokens of another unit's statement it is given in the second round. */
  room: number
}

interface Running {
  run: ElecRun
  sentText: number
  sentThinking: number
  done: boolean
}

interface Deliberation {
  session: Session
  seats: Seat[]
  round: ElecRounds
  runs: Map<string, Running>
  abort: AbortController
  timer: unknown
  finished: boolean
}

export class ElecService {
  private readonly deps: ElecDeps
  private readonly running = new Map<string, Deliberation>()

  constructor(deps: ElecDeps) {
    this.deps = deps
  }

  list(): SessionSummary[] {
    return this.deps.store.list()
  }

  /** Deliberations being voted. */
  active(): string[] {
    return [...this.running.keys()]
  }

  get(sessionId: string): Session | null {
    return this.running.get(sessionId)?.session ?? this.deps.store.get(sessionId)
  }

  snapshot(sessionId: string): ElecEvent {
    const d = this.running.get(sessionId)
    if (d === undefined) {
      return { type: 'snapshot', sessionId, session: this.deps.store.get(sessionId), live: null }
    }
    // Everyone is brought up to the same place first, so the deltas that follow fit every page.
    this.flush(d)
    return {
      type: 'snapshot',
      sessionId,
      session: d.session,
      live: { round: d.round, runs: [...d.runs.values()].map((r) => ({ ...r.run })) },
    }
  }

  /** Puts a motion to the council as the settings seat it now. */
  submit(motion: string): ElecSubmitResult {
    const seats = this.seat()
    if (typeof seats === 'string') return { ok: false, error: seats }
    const settings = this.deps.settings()
    const now = this.deps.now()
    const session: Session = {
      version: SESSION_VERSION,
      id: this.deps.newId(),
      title: sessionTitle(motion),
      motion,
      createdAt: now,
      updatedAt: now,
      rule: settings.rule,
      rounds: settings.rounds,
      seats: seats.map((s) => ({
        providerId: s.target.provider.id,
        provider: s.target.provider.name,
        model: s.model,
      })),
      ballots: [],
    }
    // The motion is kept before anyone is asked: a crash loses the answers, not the question.
    if (!this.deps.store.save(session)) {
      return { ok: false, error: 'no more deliberations can be kept - delete some from the log' }
    }
    this.deps.listChanged(this.list())
    const d: Deliberation = {
      session,
      seats,
      round: 1,
      runs: new Map(),
      abort: new AbortController(),
      timer: null,
      finished: false,
    }
    this.running.set(session.id, d)
    this.deps.publish(this.snapshot(session.id))
    void this.deliberate(d)
    return { ok: true, sessionId: session.id }
  }

  /**
   * Ends the deliberation where it stands. What each unit wrote is kept; a unit not
   * yet asked has a void ballot, and the round being voted becomes the last, so the
   * resolution is of the votes there are.
   */
  stop(sessionId: string): void {
    const d = this.running.get(sessionId)
    if (d === undefined) return
    for (const running of d.runs.values()) this.land(d, running, { stop: 'stopped' })
    const voted = new Set(d.session.ballots.filter((b) => b.round === d.round).map((b) => b.unit))
    const now = this.deps.now()
    const unasked: Ballot[] = UNIT_INDICES.filter((u) => !voted.has(u)).map((unit) => ({
      id: this.deps.newId(),
      unit,
      round: d.round,
      text: '',
      verdict: null,
      at: now,
      model: d.seats[unit]?.model ?? '',
      stop: 'stopped',
    }))
    d.session = {
      ...d.session,
      rounds: d.round,
      updatedAt: now,
      ballots: [...d.session.ballots, ...unasked],
    }
    this.end(d)
    d.abort.abort()
  }

  remove(sessionId: string): boolean {
    // A deliberation being voted goes with it: nothing of it is kept, so nothing is written only to be deleted.
    const d = this.running.get(sessionId)
    if (d !== undefined) {
      this.close(d)
      d.abort.abort()
    }
    if (!this.deps.store.remove(sessionId)) return false
    this.deps.publish({ type: 'snapshot', sessionId, session: null, live: null })
    this.deps.listChanged(this.list())
    return true
  }

  /** On quit: what has been written so far is kept, synchronously, before anything is torn down. */
  dispose(): void {
    for (const sessionId of this.active()) this.stop(sessionId)
  }

  /** The three seats as the settings have them now, or why the council cannot sit. */
  private seat(): Seat[] | string {
    const providers = this.deps.providers()
    const settings = this.deps.settings()
    const seats: Seat[] = []
    for (const unit of UNIT_INDICES) {
      const resolved = resolveSeat(settings.seats[unit], providers)
      if (resolved.provider === null) return 'no provider is set up - add one in settings › ai'
      if (resolved.model === '') return `${unitLabel(unit)}: no model is chosen`
      const target = targetFor(providers, (id) => this.deps.keyFor(id), resolved.provider.id)
      if (typeof target === 'string') return `${unitLabel(unit)}: ${target}`
      seats.push({
        unit,
        target,
        model: resolved.model,
        system: unitSystem(unit, personaOf(settings, unit)),
        room: statementRoom(resolved.provider),
      })
    }
    return seats
  }

  private async deliberate(d: Deliberation): Promise<void> {
    for (const round of [1, 2] as const) {
      if (round > d.session.rounds || d.finished) break
      d.round = round
      if (round > 1) this.deps.publish(this.snapshot(d.session.id))
      await Promise.all(this.lanes(d.seats).map((lane) => this.walk(d, lane, round)))
    }
    if (d.finished) return
    d.session = { ...d.session, updatedAt: this.deps.now() }
    this.end(d)
  }

  /** Seats that share a server of this machine or the local network go in one lane, one after another. */
  private lanes(seats: readonly Seat[]): Seat[][] {
    const lanes = new Map<string, Seat[]>()
    for (const seat of seats) {
      const key = isLocalAddress(seat.target.baseUrl) ? seat.target.baseUrl : `unit:${seat.unit}`
      lanes.set(key, [...(lanes.get(key) ?? []), seat])
    }
    return [...lanes.values()]
  }

  private async walk(d: Deliberation, lane: readonly Seat[], round: ElecRounds): Promise<void> {
    for (const seat of lane) {
      if (d.finished) return
      await this.ask(d, seat, round)
    }
  }

  private prompt(d: Deliberation, seat: Seat, round: ElecRounds): string {
    const { motion } = d.session
    if (round === 1) return firstRoundPrompt(motion)
    const heard = (unit: UnitIndex): Heard | undefined => {
      const ballot = d.session.ballots.find((b) => b.round === 1 && b.unit === unit)
      if (ballot === undefined) return undefined
      const statement = readVote(ballot.text).statement
      const failed = ballot.stop !== undefined && ballot.stop !== 'length'
      return {
        unit,
        verdict: countsAsVote(ballot) ? ballot.verdict : null,
        text: failed || statement === '' ? null : statement,
      }
    }
    const others = UNIT_INDICES.filter((u) => u !== seat.unit)
      .map(heard)
      .filter((h): h is Heard => h !== undefined)
    return secondRoundPrompt(motion, heard(seat.unit), others, seat.room)
  }

  private async ask(d: Deliberation, seat: Seat, round: ElecRounds): Promise<void> {
    const running: Running = {
      run: {
        id: this.deps.newId(),
        unit: seat.unit,
        round,
        text: '',
        thinking: '',
        provider: seat.target.provider.name,
        model: seat.model,
        startedAt: this.deps.now(),
      },
      sentText: 0,
      sentThinking: 0,
      done: false,
    }
    d.runs.set(running.run.id, running)
    this.deps.publish(this.snapshot(d.session.id))
    const { target } = seat
    try {
      const adapter = await this.deps.adapter(target.provider.kind)
      if (running.done) return
      const result = await adapter.stream(
        {
          baseUrl: target.baseUrl,
          key: target.key,
          model: seat.model,
          system: seat.system,
          messages: [{ role: 'user', text: this.prompt(d, seat, round) }],
          signal: d.abort.signal,
        },
        {
          text: (piece) => this.append(d, running, 'text', piece),
          thinking: (piece) => this.append(d, running, 'thinking', piece),
        },
      )
      this.land(d, running, result)
    } catch (error) {
      this.land(d, running, {
        stop: isUnreachable(error) ? 'unreachable' : 'error',
        note: describeFailure(error, target.baseUrl),
      })
    }
    if (!d.finished) this.deps.publish(this.snapshot(d.session.id))
  }

  private append(
    d: Deliberation,
    running: Running,
    part: 'text' | 'thinking',
    piece: string,
  ): void {
    if (running.done) return
    const room = ELEC_LIMITS.text - running.run[part].length
    if (room <= 0) return
    running.run[part] += piece.slice(0, room)
    d.timer ??= this.deps.setTimer(() => {
      d.timer = null
      this.flush(d)
    }, FLUSH_MS)
  }

  private flush(d: Deliberation): void {
    if (d.finished) return
    for (const running of d.runs.values()) {
      const { run } = running
      if (run.text.length === running.sentText && run.thinking.length === running.sentThinking) {
        continue
      }
      this.deps.publish({
        type: 'delta',
        sessionId: d.session.id,
        runId: run.id,
        textAt: running.sentText,
        text: run.text.slice(running.sentText),
        thinkingAt: running.sentThinking,
        thinking: run.thinking.slice(running.sentThinking),
      })
      running.sentText = run.text.length
      running.sentThinking = run.thinking.length
    }
  }

  /** Turns a unit's answer into its ballot, once: a stop and the stream's own end both arrive here. */
  private land(d: Deliberation, running: Running, result: StreamResult): void {
    if (running.done) return
    running.done = true
    d.runs.delete(running.run.id)
    const { run } = running
    const now = this.deps.now()
    const vote = readVote(run.text)
    const ballot: Ballot = {
      id: run.id,
      unit: run.unit,
      round: run.round,
      text: run.text,
      verdict: vote.verdict,
      at: now,
      ms: Math.max(0, now - run.startedAt),
      model: (result.model ?? run.model).slice(0, 120),
      ...(run.thinking === '' ? {} : { thinking: run.thinking }),
      ...(vote.confidence === null ? {} : { confidence: vote.confidence }),
      ...(result.usage === undefined ? {} : { usage: result.usage }),
      ...(result.stop === undefined ? {} : { stop: result.stop }),
      ...(result.note === undefined ? {} : { error: result.note.slice(0, 600) }),
    }
    // A void ballot says nothing, whatever it managed to write before it failed.
    const cast = countsAsVote(ballot) ? ballot : { ...ballot, verdict: null }
    d.session = { ...d.session, updatedAt: now, ballots: [...d.session.ballots, cast] }
    if (this.deps.store.get(d.session.id) !== null) this.deps.store.save(d.session)
  }

  /** The deliberation is over, whatever became of it: no more pieces, no more flushes. */
  private close(d: Deliberation): void {
    d.finished = true
    if (d.timer !== null) this.deps.clearTimer(d.timer)
    d.timer = null
    this.running.delete(d.session.id)
  }

  /** Keeps what was voted and tells everyone: the last snapshot has no answers being written. */
  private end(d: Deliberation): void {
    this.close(d)
    // One deleted while it was being voted stays deleted.
    const kept = this.deps.store.get(d.session.id) !== null && this.deps.store.save(d.session)
    this.deps.publish({
      type: 'snapshot',
      sessionId: d.session.id,
      session: kept ? d.session : null,
      live: null,
    })
    if (kept) this.deps.listChanged(this.list())
  }
}
