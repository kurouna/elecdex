import type { Elec16Api } from '@shared/api'
import { CARD_STATUS, type CardAnswer, type CardRequest } from '@shared/elec16/card'
import { Elec16 } from '@shared/elec16/machine'
import {
  type Elec16Board,
  type Elec16Claim,
  type Elec16Unit,
  type Elec16UnitChange,
  type Elec16UnitSeed,
  hzOfClock,
} from '@shared/elec16-units'
import type { Elec16Runner } from './runner.svelte.ts'

/**
 * A pane's hold on its unit (docs/elec16.md section 8). main keeps every unit's RAM and card
 * and lets one pane at a time run it; this is the pane's side: which unit it shows, its claim,
 * starting the machine from the battery backup, writing the backup back - when the pane goes
 * out of sight, the machine is switched off, the page is put away, or the unit is let go;
 * never on a timer, and never when nothing ran since - and the card commands the machine
 * gives, passed to main and answered.
 *
 * `held`: another pane runs the unit (MOVE HERE or NEW UNIT); `gone`: this pane ran it and
 * another took it (MOVE HERE there).
 */

export type UnitPhase = 'loading' | 'running' | 'held' | 'gone'

/** What the pane gives its session: where to keep its unit's id, and the clock it asks for. */
export interface UnitHost {
  /** The unit's id, into pane state: a layout carries no machine, only which unit. */
  keep(unit: string): void
}

export class UnitSession {
  phase = $state<UnitPhase>('loading')
  unit = $state.raw<Elec16Unit | null>(null)
  board = $state.raw<Elec16Board>({ units: [], held: [] })

  readonly #api: Elec16Api
  readonly #pane: string
  readonly #runner: Elec16Runner
  readonly #host: UnitHost
  #rom: Uint8Array | null = null
  /** The machine as it was when the backup was last written, to skip one that did not run. */
  #saved = ''
  #stops: (() => void)[] = []
  #disposed = false

  constructor(api: Elec16Api, pane: string, runner: Elec16Runner, host: UnitHost) {
    this.#api = api
    this.#pane = pane
    this.#runner = runner
    this.#host = host
    runner.onCard = (request) => this.#card(request)
    this.#stops.push(
      api.onChange((board) => this.#boardChanged(board)),
      api.onGiveBack((unit) => {
        if (unit === this.unit?.id && this.phase === 'running') void this.#giveBack()
      }),
    )
  }

  /**
   * Starts: the unit the pane last had, or the first no pane holds, or the first; `parked` is
   * the machine a moved pane left running, taken up as it is.
   */
  async start(
    rom: Uint8Array,
    wanted: string | undefined,
    seed: Elec16UnitSeed,
    parked: Elec16 | null,
    paused: boolean,
  ): Promise<void> {
    this.#rom = rom
    const board = await this.#api.board(seed)
    if (this.#disposed) return
    this.board = board
    const free = board.units.find((u) => !board.held.some((h) => h.unit === u.id))
    const unit = board.units.find((u) => u.id === wanted) ?? free ?? board.units[0]
    if (unit === undefined) return
    await this.#claim(unit, (id) => this.#api.claim(id, this.#pane), parked, paused)
  }

  /** MOVE HERE: the unit from the pane that runs it, with its machine as it is there. */
  async moveHere(): Promise<void> {
    const unit = this.unit
    if (unit === null) return
    this.phase = 'loading'
    await this.#claim(unit, (id) => this.#api.moveHere(id, this.#pane), null, false)
  }

  /** A new unit for this pane, its clock and LCD as the one it showed. */
  async newUnit(): Promise<void> {
    const was = this.unit
    await this.letGo()
    const unit = await this.#api.create(was === null ? {} : { clock: was.clock, model: was.model })
    if (this.#disposed) return
    await this.#claim(unit, (id) => this.#api.claim(id, this.#pane), null, false)
  }

  /** Another unit in this pane: this one is let go with its machine, the other claimed. */
  async switchTo(id: string): Promise<void> {
    const unit = this.board.units.find((u) => u.id === id)
    if (unit === undefined || unit.id === this.unit?.id) return
    await this.letGo()
    await this.#claim(unit, (u) => this.#api.claim(u, this.#pane), null, false)
  }

  /** TUNE: the unit's name, clock or LCD. Another LCD restarts the machine, its RAM kept. */
  async change(change: Elec16UnitChange): Promise<void> {
    const unit = this.unit
    if (unit === null || this.phase !== 'running') return
    const next = await this.#api.update(unit.id, change)
    if (next === null || this.#disposed) return
    this.unit = next
    this.#runner.setHz(hzOfClock(next.clock))
    if (next.model !== unit.model && this.#rom !== null) {
      this.#runner.boot(
        this.#rom,
        next.model,
        hzOfClock(next.clock),
        this.#runner.machine?.state.ram.slice(),
      )
    }
  }

  /** The battery backup, written when the machine ran since the last; not without a unit. */
  save(): void {
    const machine = this.#runner.machine
    const unit = this.unit
    if (machine === null || unit === null || this.phase !== 'running') return
    const mark = markOf(machine)
    if (mark === this.#saved) return
    this.#saved = mark
    void this.#api.save(unit.id, this.#pane, machine.snapshot())
  }

  /** Lets the unit go, with its machine as it is; the runner has none after. */
  async letGo(): Promise<void> {
    const unit = this.unit
    if (unit === null || this.phase !== 'running') return
    const machine = this.#runner.detach()
    this.phase = 'loading'
    await this.#api.release(unit.id, this.#pane, machine?.snapshot() ?? null)
  }

  /**
   * The pane went for good with this machine (a parked machine nobody took: the pane was
   * closed): the unit is let go with it.
   */
  static release(api: Elec16Api, unit: string, pane: string, machine: Elec16): void {
    void api.release(unit, pane, machine.snapshot())
  }

  dispose(): void {
    this.#disposed = true
    this.#runner.onCard = null
    for (const stop of this.#stops.splice(0)) stop()
  }

  async #claim(
    unit: Elec16Unit,
    ask: (id: string) => Promise<Elec16Claim>,
    parked: Elec16 | null,
    paused: boolean,
  ): Promise<void> {
    this.unit = unit
    this.#host.keep(unit.id)
    const claim = await ask(unit.id)
    if (this.#disposed) return
    if (!claim.ok) {
      this.phase = 'held'
      return
    }
    this.#begin(unit, parked ?? this.#restored(claim.snapshot), paused)
    this.phase = 'running'
  }

  /** The machine from the backup, on the unit's LCD; null to switch one on afresh. */
  #restored(snapshot: Uint8Array | null): Elec16 | null {
    const rom = this.#rom
    if (snapshot === null || rom === null) return null
    return Elec16.restore(rom, snapshot)
  }

  #begin(unit: Elec16Unit, machine: Elec16 | null, paused: boolean): void {
    const rom = this.#rom
    if (rom === null) return
    const hz = hzOfClock(unit.clock)
    if (machine !== null && machine.state.model === unit.model) {
      this.#runner.adopt(machine, hz, paused)
    } else {
      // Its LCD was changed while it was put away: the RAM goes on, on the unit's.
      this.#runner.boot(rom, unit.model, hz, machine?.state.ram.slice())
    }
    this.#saved = this.#runner.machine === null ? '' : markOf(this.#runner.machine)
  }

  async #giveBack(): Promise<void> {
    await this.letGo()
    this.phase = 'gone'
  }

  #boardChanged(board: Elec16Board): void {
    this.board = board
    const mine = this.unit
    if (mine === null) return
    const now = board.units.find((u) => u.id === mine.id)
    if (now !== undefined && now !== mine) this.unit = now
    // Taken while this pane did not answer in time: what runs here is not the unit any more.
    const holder = board.held.find((h) => h.unit === mine.id)
    if (this.phase === 'running' && holder !== undefined && holder.pane !== this.#pane) {
      this.#runner.detach()
      this.phase = 'gone'
    }
  }

  async #card(request: CardRequest): Promise<CardAnswer> {
    const unit = this.unit
    if (unit === null || this.phase !== 'running') return { status: CARD_STATUS.noCard }
    return this.#api.card(unit.id, this.#pane, request)
  }
}

/** What says a machine changed: it ran, or was switched off or on. */
const markOf = (m: Elec16): string => `${m.state.cycles}:${m.state.off}:${m.state.model}`
