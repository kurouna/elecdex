import type { Elec16Api } from '@shared/api'
import type { Elec16DevFiles, Elec16DevOpen } from '@shared/elec16-units'
import { createPark } from '../emu/park.ts'
import { buildKit, holdCompiler } from './code/compiler.ts'

/**
 * A game's development folder in the pane (docs/elec16-play.md section 11): opened through
 * main (which keeps where it is, for this pane), its files read by main, built here in CODE's
 * worker with the game kit, the build's two files written back by main, the cartridge put on
 * the shelf and in the unit's slot. While the pane is seen, main watches the folder and a
 * change builds again; coming back into sight, the folder is read again and built if it
 * changed meanwhile. The machine is reset to its start screen after each build; START begins
 * the game.
 *
 * Every build carries main's opening (`gen`) and its own run: closing or opening another
 * folder while one builds leaves that build to come to nothing. A pane moved in the layout is
 * mounted again with the same folder: main keeps it for the pane, and what the pane showed
 * waits here for the new mount (as the machine waits in park.ts).
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
  | 'devState'
  | 'devRead'
  | 'devWrite'
  | 'devInstall'
  | 'devClose'
  | 'devWatch'
  | 'onDevChange'
>

type DevFiles = Extract<Elec16DevFiles, { ok: true }>['files']

/** What a pane showed of its folder, kept for its next mount. */
interface Kept {
  gen: number
  status: DevStatus
  problems: DevProblem[]
  report: DevGame['report']
  builds: number
  files: DevFiles | null
}

/** A pane's folder as it was, while the pane is mounted again; a closed pane's folder closes. */
const kept = createPark<Kept>()

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
  readonly #pane: string
  readonly #insert: (id: string) => Promise<boolean>
  readonly #romTrap: () => Promise<number>
  #release: (() => void) | null = null
  #stopListening: (() => void) | null = null
  /** main's opening of the folder: every read, write and install carries it. */
  #gen: number | null = null
  /** This pane's run of the folder: an open, a close or a dispose ends a build of another. */
  #run = 0
  /** The files the last build read, to build again only for a change. */
  #files: DevFiles | null = null
  #seen = false
  /** Whether main was last asked to watch. */
  #watched = false
  #again = false
  #disposed = false

  constructor(
    api: DevApi,
    pane: string,
    insert: (id: string) => Promise<boolean>,
    romTrap: () => Promise<number>,
  ) {
    this.#api = api
    this.#pane = pane
    this.#insert = insert
    this.#romTrap = romTrap
    void this.#takeUp()
  }

  /** A game's folder through main's picker, then built. */
  async open(): Promise<void> {
    this.#opened(await this.#api.devOpen(this.#pane))
  }

  /** A new game: the template written into a folder main's picker chose, then built. */
  async create(): Promise<void> {
    this.#opened(await this.#api.devNew(this.#pane))
  }

  #opened(done: Elec16DevOpen | null): void {
    if (done === null || this.#disposed) return
    if (!done.ok) {
      this.problems = [{ file: '', line: 0, message: done.problem }]
      this.status = 'failed'
      return
    }
    this.#begin(done.name, done.gen, null)
    void this.build()
  }

  /**
   * The folder main keeps for this pane, taken up by a pane mounted again (moved in the
   * layout), with what it showed; built only if its files changed since.
   */
  async #takeUp(): Promise<void> {
    let state: Awaited<ReturnType<DevApi['devState']>>
    try {
      state = await this.#api.devState(this.#pane)
    } catch {
      return
    }
    const was = kept.claim(this.#pane)
    // Opened here meanwhile, or nothing to take up.
    if (this.#disposed || this.folder !== null || state === null) return
    this.#begin(state.name, state.gen, was?.gen === state.gen ? was : null)
    if (this.#seen) void this.build(true)
  }

  #begin(name: string, gen: number, was: Kept | null): void {
    this.#run++
    this.#again = false
    this.folder = name
    this.#gen = gen
    this.status = was?.status === 'building' ? 'idle' : (was?.status ?? 'idle')
    this.problems = was?.problems ?? []
    this.report = was?.report ?? null
    this.builds = was?.builds ?? 0
    this.#files = was?.files ?? null
    this.#release ??= holdCompiler()
    this.#stopListening ??= this.#api.onDevChange((pane) => {
      if (pane === this.#pane) void this.build(true)
    })
    this.#watch()
  }

  /**
   * Builds again; one asked for while building runs after it. `ifChanged`: only when the
   * folder's files are not those of the last build that went in (a change told by the watch,
   * or the pane back in sight).
   */
  async build(ifChanged = false): Promise<void> {
    if (this.folder === null || this.#gen === null) return
    if (this.status === 'building') {
      this.#again = true
      return
    }
    const run = this.#run
    const before = this.status
    this.status = 'building'
    try {
      const same = await this.#buildOnce(run, this.#gen, ifChanged)
      // Nothing new: the game in the slot is that build's, and the machine goes on.
      if (same && run === this.#run) this.status = before
    } catch (e) {
      if (run === this.#run) {
        this.#failed([{ file: '', line: 0, message: e instanceof Error ? e.message : String(e) }])
      }
    }
    if (run !== this.#run) return
    if (this.#again) {
      this.#again = false
      await this.build(true)
    }
  }

  /** One build of opening `gen` in run `run`; true when skipped for files already built. */
  async #buildOnce(run: number, gen: number, ifChanged: boolean): Promise<boolean> {
    const read = await this.#api.devRead(this.#pane, gen)
    if (run !== this.#run) return false
    if (!read.ok) {
      this.#files = null
      this.#failed([{ file: 'game.json', line: 0, message: read.problem }])
      return false
    }
    const last = this.#files
    if (ifChanged && last !== null && sameFiles(last, read.files)) return true
    this.#files = read.files
    const trap = await this.#romTrap()
    if (run !== this.#run) return false
    const built = await buildKit(read.files, trap)
    if (run !== this.#run) return false
    if (!built.ok) {
      this.#failed(built.errors)
      return false
    }
    const written = await this.#api.devWrite(this.#pane, gen, built.assets, built.compiled)
    if (run !== this.#run) return false
    if (!written) {
      this.#failed([
        { file: '', line: 0, message: 'assets.e16.ts and compiled.s could not be written back' },
      ])
      return false
    }
    const shelved = await this.#api.devInstall(this.#pane, gen, built.image)
    if (run !== this.#run) return false
    if (!shelved.ok) {
      this.#failed([{ file: '', line: 0, message: shelved.problem }])
      return false
    }
    const inserted = await this.#insert(shelved.id)
    if (run !== this.#run) return false
    if (!inserted) {
      this.#failed([{ file: '', line: 0, message: 'the game could not go in the slot' }])
      return false
    }
    this.report = { banks: built.banks, ramCode: built.ramCode, tiles: built.tiles }
    this.problems = []
    this.status = 'built'
    this.builds++
    return false
  }

  #failed(problems: DevProblem[]): void {
    this.problems = problems.slice(0, 8)
    this.status = 'failed'
  }

  /**
   * Whether the pane is seen: the folder is watched only then, and what changed while it was
   * not is built as it comes back.
   */
  setSeen(seen: boolean): void {
    const back = seen && !this.#seen
    this.#seen = seen
    this.#watch()
    if (back && this.folder !== null) void this.build(true)
  }

  /** main asked to watch while the pane is seen with a folder open, and only told a change. */
  #watch(): void {
    const want = this.#seen && this.folder !== null && !this.#disposed
    if (want === this.#watched) return
    this.#watched = want
    this.#api.devWatch(this.#pane, want)
  }

  /** The folder closed: no watch, the compiler let go, a build under way comes to nothing. */
  close(): void {
    this.#run++
    this.#again = false
    if (this.folder === null) return
    this.folder = null
    this.#gen = null
    this.#files = null
    this.status = 'idle'
    this.problems = []
    this.report = null
    this.builds = 0
    this.#watch()
    void this.#api.devClose(this.#pane)
    this.#letGo()
  }

  #letGo(): void {
    this.#stopListening?.()
    this.#stopListening = null
    this.#release?.()
    this.#release = null
  }

  /**
   * The pane unmounted: the watch and the compiler let go, but the folder stays open in main
   * for the pane's next mount (a moved pane); a pane nobody mounts again closes it.
   */
  dispose(): void {
    if (this.#disposed) return
    const gen = this.#gen
    this.#disposed = true
    this.#run++
    this.#watch()
    this.#letGo()
    if (this.folder === null || gen === null) return
    const api = this.#api
    const pane = this.#pane
    kept.park(
      pane,
      {
        gen,
        status: this.status,
        problems: this.problems,
        report: this.report,
        builds: this.builds,
        files: this.#files,
      },
      () => void api.devClose(pane),
    )
  }
}

/** Whether two reads of a folder hold the same files, byte for byte. */
export function sameFiles(a: DevFiles, b: DevFiles): boolean {
  if (a.meta !== b.meta) return false
  const ta = Object.keys(a.texts)
  const pa = Object.keys(a.pictures)
  if (ta.length !== Object.keys(b.texts).length) return false
  if (pa.length !== Object.keys(b.pictures).length) return false
  if (ta.some((name) => a.texts[name] !== b.texts[name])) return false
  return pa.every((name) => {
    const x = a.pictures[name]
    const y = b.pictures[name]
    return (
      x !== undefined && y !== undefined && x.length === y.length && x.every((v, k) => v === y[k])
    )
  })
}
