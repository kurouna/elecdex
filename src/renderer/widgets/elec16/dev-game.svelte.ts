import type { Elec16Api } from '@shared/api'
import type { Elec16DevOpen } from '@shared/elec16-units'
import { buildKit, holdCompiler } from './code/compiler.ts'

/**
 * A game's development folder in the pane (docs/elec16-play.md section 11): opened through
 * main (which keeps where it is), its files read by main, built here in CODE's worker with the
 * game kit, the build's two files written back by main, the cartridge put on the shelf and in
 * the unit's slot. While the pane is seen, main watches the folder and a change builds again.
 * The machine is reset to its start screen after each build; START begins the game.
 */

export type DevStatus = 'idle' | 'building' | 'built' | 'failed'

export interface DevProblem {
  file: string
  line: number
  message: string
}

type DevApi = Pick<
  Elec16Api,
  | 'devOpen'
  | 'devNew'
  | 'devRead'
  | 'devWrite'
  | 'devInstall'
  | 'devClose'
  | 'devWatch'
  | 'onDevChange'
>

export class DevGame {
  /** The open folder's name; null while none is open. */
  folder = $state<string | null>(null)
  status = $state<DevStatus>('idle')
  problems = $state<DevProblem[]>([])
  /** The last good build's size: banks, bytes of code in RAM, tiles. */
  report = $state<{ banks: number; ramCode: number; tiles: number } | null>(null)
  /** How many builds were made, for the page to show something moved. */
  builds = $state(0)

  readonly #api: DevApi
  readonly #insert: (id: string) => Promise<void>
  readonly #romTrap: () => Promise<number>
  #release: (() => void) | null = null
  #stopListening: (() => void) | null = null
  #seen = false
  #again = false

  constructor(api: DevApi, insert: (id: string) => Promise<void>, romTrap: () => Promise<number>) {
    this.#api = api
    this.#insert = insert
    this.#romTrap = romTrap
  }

  /** A game's folder through main's picker, then built. */
  async open(): Promise<void> {
    this.#opened(await this.#api.devOpen())
  }

  /** A new game: the template written into a folder main's picker chose, then built. */
  async create(): Promise<void> {
    this.#opened(await this.#api.devNew())
  }

  #opened(done: Elec16DevOpen | null): void {
    if (done === null) return
    if (!done.ok) {
      this.problems = [{ file: '', line: 0, message: done.problem }]
      this.status = 'failed'
      return
    }
    this.folder = done.name
    this.report = null
    this.#release ??= holdCompiler()
    this.#stopListening ??= this.#api.onDevChange(() => void this.build())
    this.#watch()
    void this.build()
  }

  /** Builds again; one asked for while building runs after it. */
  async build(): Promise<void> {
    if (this.folder === null) return
    if (this.status === 'building') {
      this.#again = true
      return
    }
    this.status = 'building'
    try {
      await this.#buildOnce()
    } catch (e) {
      this.#failed([{ file: '', line: 0, message: e instanceof Error ? e.message : String(e) }])
    }
    if (this.#again) {
      this.#again = false
      this.status = 'idle'
      await this.build()
    }
  }

  async #buildOnce(): Promise<void> {
    const read = await this.#api.devRead()
    if (!read.ok) {
      this.#failed([{ file: 'game.json', line: 0, message: read.problem }])
      return
    }
    const built = await buildKit(read.files, await this.#romTrap())
    if (!built.ok) {
      this.#failed(built.errors)
      return
    }
    await this.#api.devWrite(built.assets, built.compiled)
    const shelved = await this.#api.devInstall(built.image)
    if (!shelved.ok) {
      this.#failed([{ file: '', line: 0, message: shelved.problem }])
      return
    }
    await this.#insert(shelved.id)
    this.report = { banks: built.banks, ramCode: built.ramCode, tiles: built.tiles }
    this.problems = []
    this.status = 'built'
    this.builds++
  }

  #failed(problems: DevProblem[]): void {
    this.problems = problems.slice(0, 8)
    this.status = 'failed'
  }

  /** Whether the pane is seen: the folder is watched only then. */
  setSeen(seen: boolean): void {
    this.#seen = seen
    this.#watch()
  }

  #watch(): void {
    this.#api.devWatch(this.#seen && this.folder !== null)
  }

  /** The folder closed: no watch, the compiler let go. */
  close(): void {
    if (this.folder === null) return
    this.folder = null
    this.status = 'idle'
    this.problems = []
    this.report = null
    this.#api.devWatch(false)
    void this.#api.devClose()
    this.#stopListening?.()
    this.#stopListening = null
    this.#release?.()
    this.#release = null
  }

  dispose(): void {
    this.close()
  }
}
