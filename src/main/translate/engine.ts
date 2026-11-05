import type { EnginePhase } from '@shared/translate/board'
import { bootLimitMs, type EngineBackend, showsProgress } from '@shared/translate/engines'
import { decideRestart } from '@shared/translate/restart'

/**
 * llama-server's life (docs/translate.md §4.2, §4.3, §8.4): started on the first translation,
 * stopped by its idle clock or by the user, restarted once in ten minutes after a crash, and for
 * a server the user runs elsewhere, only probed. Every effect outside (the process, HTTP, the
 * clock) comes in through `EngineDeps`, so the states can be driven in a unit test.
 */

/** One way to start the server: a build of llama-server, or the test stub through node. */
export interface EngineLaunch {
  exe: string
  /** Put before the server's own arguments (the stub's script path). */
  prefix: string[]
  cwd: string
  env: Record<string, string>
  backend: EngineBackend
  build: string | null
}

export interface ServerProcess {
  onOutput(listener: (chunk: string) => void): void
  onExit(listener: (code: number | null) => void): void
  /** Asks it to end; `hard` kills it. */
  kill(hard?: boolean): void
}

export interface EngineConfig {
  source: 'fetched' | 'own' | 'external'
  /** The builds to try in order (GPU first unless the device is the CPU only). */
  launches: EngineLaunch[]
  modelPath: string | null
  modelBytes: number
  ctx: number
  idleMinutes: number
  /** The external server's origin. */
  origin: string | null
}

export interface EngineDeps {
  spawn: (launch: EngineLaunch, args: string[], env: Record<string, string>) => ServerProcess
  /** The status of GET /health, or null when nothing answered. */
  health: (origin: string, key: string | null) => Promise<number | null>
  listDevices: (launch: EngineLaunch) => Promise<string[]>
  freePort: () => Promise<number>
  randomKey: () => string
  setTimer: (fn: () => void, ms: number) => unknown
  clearTimer: (handle: unknown) => void
  sleep: (ms: number) => Promise<void>
  now: () => number
  /** The board changed. */
  onChange: () => void
  /** Bytes-without-output after which a load counts as stalled (60 s; tests shorten it). */
  stallMs: number
  pollMs: number
}

export interface Endpoint {
  origin: string
  /** Null for an external server, which elecdex holds no key for. */
  key: string | null
}

const LOG_LINES = 400
const BOOT_LINES = 12
const STOP_GRACE_MS = 5000
const ALIAS = 'plamo-3-translate'

interface Running {
  process: ServerProcess
  launch: EngineLaunch
  port: number
  key: string
  stopping: boolean
  exited: boolean
}

export class TranslateEngine {
  #phase: EnginePhase = 'stopped'
  #config: EngineConfig
  #gen = 0
  #running: Running | null = null
  #starting: Promise<Endpoint> | null = null
  #log: string[] = []
  #boot: string[] = []
  #error: string | null = null
  #fallback: string | null = null
  #device: string | null = null
  #restarts: number[] = []
  #idle: unknown = null
  #busy = 0
  readonly #deps: EngineDeps

  constructor(config: EngineConfig, deps: EngineDeps) {
    this.#config = config
    this.#deps = deps
    this.#phase = this.#restingPhase()
  }

  get phase(): EnginePhase {
    return this.#phase
  }

  get error(): string | null {
    return this.#error
  }

  get fallback(): string | null {
    return this.#fallback
  }

  get device(): string | null {
    return this.#device
  }

  get backend(): EngineBackend | null {
    return this.#running?.launch.backend ?? null
  }

  get build(): string | null {
    return this.#running?.launch.build ?? this.#config.launches[0]?.build ?? null
  }

  get port(): number | null {
    return this.#phase === 'ready' ? (this.#running?.port ?? null) : null
  }

  get ctx(): number {
    return this.#config.ctx
  }

  logs(): string[] {
    return [...this.#log]
  }

  bootLines(): string[] {
    return [...this.#boot]
  }

  /** The phase with nothing running: absent without an engine and a model, external-untested for an external server. */
  #restingPhase(): EnginePhase {
    if (this.#config.source === 'external')
      return this.#config.origin ? 'external-untested' : 'absent'
    return this.#config.launches.length > 0 && this.#config.modelPath ? 'stopped' : 'absent'
  }

  /**
   * A new configuration (settings, a model fetched or chosen, the source). A running server is
   * restarted only for what it was started with: the model, the context, the builds, the source.
   */
  configure(config: EngineConfig): void {
    const before = this.#config
    this.#config = config
    const restart =
      before.source !== config.source ||
      before.modelPath !== config.modelPath ||
      before.ctx !== config.ctx ||
      before.launches.map((l) => l.exe + l.backend).join() !==
        config.launches.map((l) => l.exe + l.backend).join() ||
      before.origin !== config.origin
    if (before.idleMinutes !== config.idleMinutes && this.#busy === 0) this.#armIdle()
    if (!restart) return
    const wasUp = this.#phase === 'ready' || this.#phase === 'starting'
    void this.stop().then(() => {
      // A change of settings is also the way out of a fault (§8.4).
      this.#error = null
      this.#phase = this.#restingPhase()
      this.#emit()
      if (wasUp && this.#phase === 'stopped') void this.ensure().catch(() => {})
    })
  }

  /** The server to send to, started (or probed) when it is not up. */
  ensure(): Promise<Endpoint> {
    if (this.#config.source === 'external') return this.#probeExternal()
    const running = this.#running
    if (this.#phase === 'ready' && running) {
      return Promise.resolve({ origin: `http://127.0.0.1:${running.port}`, key: running.key })
    }
    if (this.#starting) return this.#starting
    if (this.#phase === 'absent')
      return Promise.reject(new Error('No engine or model is in place yet.'))
    // A fault waits for RESTART or a change of settings: translations do not start it again.
    if (this.#phase === 'fault')
      return Promise.reject(new Error(this.#error ?? 'The engine is at fault.'))
    this.#starting = this.#start().finally(() => {
      this.#starting = null
    })
    return this.#starting
  }

  /** A translation began: the idle clock waits until it ends. */
  begin(): void {
    this.#busy++
    this.#clearIdle()
  }

  /** A translation ended: the idle clock starts when none is left. */
  end(): void {
    this.#busy = Math.max(0, this.#busy - 1)
    if (this.#busy === 0) this.#armIdle()
  }

  /** The external server stopped answering mid-stream (§8.4's external table). */
  unreachable(): void {
    if (this.#config.source !== 'external') return
    this.#phase = 'external-unreachable'
    this.#emit()
  }

  /** TEST passed or failed for the external server. */
  tested(ok: boolean): void {
    if (this.#config.source !== 'external') return
    this.#phase = ok ? 'external-ready' : 'external-unreachable'
    this.#emit()
  }

  async stop(): Promise<void> {
    this.#gen++
    this.#clearIdle()
    const running = this.#running
    if (!running) {
      if (this.#phase === 'starting' || this.#phase === 'ready') this.#phase = this.#restingPhase()
      this.#emit()
      return
    }
    this.#phase = 'stopping'
    this.#emit()
    await this.#kill(running)
    this.#phase = this.#restingPhase()
    this.#error = null
    this.#emit()
  }

  /** RESTART: from a fault too; the crash budget is not counted again. */
  async restart(): Promise<void> {
    await this.stop()
    this.#error = null
    this.#phase = this.#restingPhase()
    await this.ensure().catch(() => {})
  }

  /** elecdex is quitting: no waiting. */
  killNow(): void {
    this.#gen++
    this.#clearIdle()
    const running = this.#running
    this.#running = null
    if (running && !running.exited) {
      running.stopping = true
      running.process.kill(true)
    }
  }

  async #probeExternal(): Promise<Endpoint> {
    const origin = this.#config.origin
    if (!origin) throw new Error('No server address is set.')
    if (this.#phase === 'external-ready') return { origin, key: null }
    const status = await this.#deps.health(origin, null)
    const ok = status === 200
    this.tested(ok)
    if (!ok) throw new Error(`The server at ${origin} does not answer.`)
    return { origin, key: null }
  }

  async #start(): Promise<Endpoint> {
    const gen = ++this.#gen
    const launches = this.#config.launches
    this.#phase = 'starting'
    this.#boot = []
    this.#error = null
    this.#fallback = null
    this.#device = null
    this.#emit()
    let last: unknown = new Error('No build of llama-server to start.')
    for (const [index, launch] of launches.entries()) {
      if (gen !== this.#gen) throw new Error('The start was called off.')
      try {
        const endpoint = await this.#tryLaunch(launch, gen)
        this.#phase = 'ready'
        this.#emit()
        if (this.#busy === 0) this.#armIdle()
        return endpoint
      } catch (error) {
        last = error
        await this.#gaveWay(launch, launches[index + 1], error, gen)
      }
    }
    this.#phase = 'fault'
    this.#error = last instanceof Error ? last.message : String(last)
    this.#emit()
    throw last
  }

  /** One build: a GPU build only when llama-server sees a GPU. */
  async #tryLaunch(launch: EngineLaunch, gen: number): Promise<Endpoint> {
    if (launch.backend !== 'cpu') {
      const devices = await this.#deps.listDevices(launch)
      if (devices.length === 0) throw new Error('no GPU was found')
      this.#device = devices[0] ?? null
    }
    return this.#launch(launch, gen)
  }

  /** A build that did not start: its process ended, and the next one is said to take over. */
  async #gaveWay(
    launch: EngineLaunch,
    next: EngineLaunch | undefined,
    error: unknown,
    gen: number,
  ): Promise<void> {
    const running = this.#running
    if (running) await this.#kill(running)
    if (gen !== this.#gen) throw error
    if (!next) return
    const reason = error instanceof Error ? error.message : String(error)
    this.#fallback = `The ${launch.backend} build did not start (${reason}); running on the ${next.backend} build.`
    this.#device = null
    this.#note(`[elecdex] ${this.#fallback}`)
  }

  async #launch(launch: EngineLaunch, gen: number): Promise<Endpoint> {
    const port = await this.#deps.freePort()
    const key = this.#deps.randomKey()
    const model = this.#config.modelPath
    if (!model) throw new Error('No model is in place.')
    const args = [
      ...launch.prefix,
      '-m',
      model,
      '-c',
      String(this.#config.ctx),
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--alias',
      ALIAS,
      '--no-webui',
      '-np',
      '1',
      '--log-colors',
      'off',
      ...(launch.backend === 'cpu' ? ['-ngl', '0'] : []),
    ]
    // The key goes in the environment, never on the command line, where other processes read it.
    const proc = this.#deps.spawn(launch, args, { ...launch.env, LLAMA_API_KEY: key })
    const running: Running = { process: proc, launch, port, key, stopping: false, exited: false }
    this.#running = running
    let lastProgress = this.#deps.now()
    let partial = ''
    proc.onOutput((chunk) => {
      if (showsProgress(chunk)) lastProgress = this.#deps.now()
      partial += chunk
      const lines = partial.split('\n')
      partial = lines.pop() ?? ''
      for (const line of lines) this.#note(line.replace(/\r$/, ''))
    })
    proc.onExit((code) => {
      running.exited = true
      this.#note(`[elecdex] llama-server ended (code ${code})`)
      if (this.#running !== running) return
      this.#running = null
      if (!running.stopping && this.#phase === 'ready') this.#crashed(code)
    })
    const started = this.#deps.now()
    const limit = bootLimitMs(this.#config.modelBytes)
    for (;;) {
      if (gen !== this.#gen) throw new Error('The start was called off.')
      if (running.exited) throw new Error(`llama-server ended while loading${this.#lastError()}`)
      const now = this.#deps.now()
      if (now - lastProgress > this.#deps.stallMs)
        throw new Error('llama-server stopped loading (no output for a minute)')
      if (now - started > limit) throw new Error('llama-server took too long to load the model')
      if ((await this.#deps.health(`http://127.0.0.1:${port}`, key)) === 200) {
        return { origin: `http://127.0.0.1:${port}`, key }
      }
      await this.#deps.sleep(this.#deps.pollMs)
    }
  }

  #crashed(code: number | null): void {
    const decision = decideRestart(this.#restarts, this.#deps.now())
    this.#restarts = decision.recent
    if (decision.allow) {
      this.#note('[elecdex] llama-server ended on its own; starting it again')
      this.#phase = 'stopped'
      void this.ensure().catch(() => {})
      return
    }
    this.#phase = 'fault'
    this.#error = `llama-server ended again (code ${code})${this.#lastError()}`
    this.#emit()
  }

  async #kill(running: Running): Promise<void> {
    running.stopping = true
    if (this.#running === running) this.#running = null
    if (running.exited) return
    const exited = new Promise<void>((resolve) => running.process.onExit(() => resolve()))
    running.process.kill()
    const timer = this.#deps.setTimer(() => {
      if (!running.exited) running.process.kill(true)
    }, STOP_GRACE_MS)
    await exited
    this.#deps.clearTimer(timer)
  }

  #armIdle(): void {
    this.#clearIdle()
    const minutes = this.#config.idleMinutes
    if (minutes <= 0 || this.#phase !== 'ready') return
    this.#idle = this.#deps.setTimer(() => {
      this.#idle = null
      if (this.#busy === 0) void this.stop()
    }, minutes * 60_000)
  }

  #clearIdle(): void {
    if (this.#idle !== null) this.#deps.clearTimer(this.#idle)
    this.#idle = null
  }

  #note(line: string): void {
    if (!line) return
    this.#log.push(line)
    if (this.#log.length > LOG_LINES) this.#log.splice(0, this.#log.length - LOG_LINES)
    if (this.#phase === 'starting') {
      this.#boot.push(line)
      if (this.#boot.length > BOOT_LINES) this.#boot.shift()
      this.#emit()
    }
  }

  #lastError(): string {
    const line = [...this.#log]
      .reverse()
      .find((l) => /error|failed|exception|unable|cannot/i.test(l) && !l.startsWith('[elecdex]'))
    return line ? `: ${line.slice(0, 300)}` : ''
  }

  #emit(): void {
    this.#deps.onChange()
  }
}
