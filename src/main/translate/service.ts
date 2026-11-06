import { execFile, spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { rm, statfs } from 'node:fs/promises'
import { createServer } from 'node:net'
import os from 'node:os'
import path from 'node:path'
import type { Settings } from '@shared/settings'
import {
  type EngineFile,
  EngineFileSchema,
  type EngineView,
  type FetchView,
  type MachineView,
  type TranslateBoard,
} from '@shared/translate/board'
import {
  ENGINE_BUILD,
  ENGINES,
  type EngineAsset,
  EngineAssetSchema,
  enginesFor,
  engineUrl,
  MIN_OWN_BUILD,
  parseBuild,
  RELEASES_BASE_URL,
} from '@shared/translate/engines'
import { parseExternalUrl, servesPlamo } from '@shared/translate/external'
import type { HistoryEntry } from '@shared/translate/history'
import {
  HF_BASE_URL,
  MODELS,
  type ModelEntry,
  ModelEntrySchema,
  modelUrl,
} from '@shared/translate/models'
import { buildPrompt, PFML_STOP, restore } from '@shared/translate/pfml3'
import type { RunEvent, RunRequest, RunView } from '@shared/translate/run'
import { z } from 'zod'
import LLAMA_LICENSES from '../../../resources/translate/llama.cpp-licenses.txt?raw'
import { JsonStore } from '../store/json-store.js'
import { replaceFile } from '../store/replace-file.js'
import { appendConsent } from './consent-log.js'
import {
  type EngineConfig,
  type EngineLaunch,
  restarts,
  type ServerProcess,
  TranslateEngine,
} from './engine.js'
import { fetchFile, fileSize, partOf } from './fetcher.js'
import { sha256File, stopHashing } from './hash.js'
import { installEngine, SERVER_NAME, sweepTemps } from './installer.js'
import { TranslateLibrary } from './library.js'
import { authHeaders, streamCompletion, tokenize } from './llama.js'
import { endOrphan, processName, readLeftPid, writePid } from './orphan.js'
import { TranslateRuns } from './runs.js'

/**
 * The TRANSLATE pane's main side (docs/translate.md §8): the board the panes see, the engine and
 * where it comes from (translate/engine.json, never settings), and fetching the engine and the
 * models. Translation runs come in phase 2. Everything the page sends was checked by the IPC
 * module before it reaches here.
 */

/** What the page agreed to in SETUP's LICENCE step, as main knows it. */
export interface Agreement {
  /** The licence's address. */
  licence: string
  /** When its page was last opened from elecdex, or null. */
  openedAt: string | null
  appVersion: string
}

export interface ServiceEnv {
  userData: string
  platform: string
  arch: string
  /** Test overrides (docs/translate.md §11); all unset in use. */
  hfBase?: string | undefined
  releasesBase?: string | undefined
  manifest?: string | undefined
  /** A script run with node in place of llama-server. */
  stubServer?: string | undefined
  stallMs?: number | undefined
  /** node, to run the stub with (`process.execPath` under ELECTRON_RUN_AS_NODE). */
  execPath: string
  /** Chromium's fetch for downloads (it knows the system's proxy); node's for llama-server. */
  netFetch: (url: string, init: RequestInit) => Promise<Response>
  gpuName: () => Promise<string | null>
  /** What the OS calls a process (the orphan check, §4.2); tests stand one in. */
  processName?: ((pid: number) => Promise<string | null>) | undefined
}

const ManifestSchema = z.object({
  models: z.array(ModelEntrySchema).max(64).optional(),
  engines: z.array(EngineAssetSchema).max(32).optional(),
})

export class TranslateService {
  readonly #env: ServiceEnv
  readonly #root: string
  readonly #file: JsonStore<EngineFile>
  readonly #models: readonly ModelEntry[]
  readonly #engines: readonly EngineAsset[]
  readonly engine: TranslateEngine
  /** The panes' translations and their queue (§8.5). */
  readonly runs: TranslateRuns
  /** The glossaries and the history (§6.3, §7). */
  readonly library: TranslateLibrary
  readonly #runListeners = new Set<(event: RunEvent) => void>()
  #settings: Settings['translate']
  #fetch: FetchView | null = null
  #fetchAbort: AbortController | null = null
  /** The fetch under way, so CANCEL and removing a model can wait for its writer to let go. */
  #fetchRun: Promise<void> | null = null
  #paused: { kind: 'engine' | 'model'; id: string } | null = null
  #machine: MachineView = {
    // GiB, as the OS says it: 16 GB of memory is 17.2e9 bytes.
    ramGB: Math.round(os.totalmem() / 1024 ** 3),
    vramGB: null,
    gpu: null,
    freeBytes: null,
  }
  readonly #listeners = new Set<() => void>()

  constructor(env: ServiceEnv, settings: Settings['translate']) {
    this.#env = env
    this.#root = path.join(env.userData, 'translate')
    this.#settings = settings
    this.#file = new JsonStore({
      file: path.join(this.#root, 'engine.json'),
      schema: EngineFileSchema,
      makeDefault: () => EngineFileSchema.parse({}),
    })
    const manifest = readManifest(env.manifest)
    this.#models = manifest.models ?? MODELS
    this.#engines = manifest.engines ?? ENGINES
    // Read before the engine can start a server of its own, which would write its pid there.
    const left = readLeftPid(this.#root)
    this.engine = new TranslateEngine(this.#config(), {
      spawn: (launch, args, envVars) => spawnServer(launch, args, envVars),
      health: (origin, key) => health(origin, key),
      listDevices: (launch) => this.#listDevices(launch),
      freePort,
      randomKey: () => randomBytes(24).toString('hex'),
      setTimer: (fn, ms) => setTimeout(fn, ms),
      clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
      sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
      now: () => Date.now(),
      onChange: () => this.#changed(),
      onPid: (pid) => writePid(this.#root, pid),
      stallMs: env.stallMs ?? 60_000,
      pollMs: 250,
    })
    this.library = new TranslateLibrary(this.#root, {
      setTimer: (fn, ms) => setTimeout(fn, ms),
      clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
      changed: () => this.#changed(),
    })
    this.runs = new TranslateRuns({
      glossary: (id) => this.library.glossary(id),
      record: (view, request) => this.#record(view, request),
      ensure: () => this.engine.ensure(),
      begin: () => this.engine.begin(),
      end: () => this.engine.end(),
      settle: () => this.engine.settle(),
      external: () => this.#file.read().source === 'external',
      unreachable: () => this.engine.unreachable(),
      ctx: () => this.#settings.ctx,
      tokenize: (endpoint, text, signal) => tokenize(fetch, endpoint, text, signal),
      complete: (endpoint, body, signal, onText) =>
        streamCompletion(fetch, endpoint, body, signal, onText, env.stallMs),
      setTimer: (fn, ms) => setTimeout(fn, ms),
      clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
      publish: (event) => {
        for (const listener of this.#runListeners) listener(event)
      },
    })
    void sweepTemps(this.#root)
    void endOrphan(left, {
      processName: (pid) => (env.processName ?? processName)(pid),
      kill: (pid) => process.kill(pid),
    })
    void env.gpuName().then((gpu) => {
      this.#machine = { ...this.#machine, gpu }
      this.#changed()
    })
  }

  get models(): readonly ModelEntry[] {
    return this.#models
  }

  onChange(listener: () => void): () => void {
    this.#listeners.add(listener)
    return () => this.#listeners.delete(listener)
  }

  /** Every run's events, for the IPC module to hand to the pages following each pane. */
  onRunEvent(listener: (event: RunEvent) => void): () => void {
    this.#runListeners.add(listener)
    return () => this.#runListeners.delete(listener)
  }

  /** New settings: the engine takes what changed (§8.4). */
  setSettings(settings: Settings['translate']): void {
    const model = this.#settings.modelId !== settings.modelId
    this.#settings = settings
    void this.#reconfigure(model ? 'The model was changed.' : 'The engine settings were changed.')
    this.#changed()
  }

  /**
   * The engine takes a new configuration. When that restarts it, the runs stop first and say why
   * (§8.5): a translation is never carried on by another model or context.
   */
  #reconfigure(reason: string): Promise<void> {
    const next = this.#config()
    if (restarts(this.engine.config, next)) this.runs.stopAll(reason)
    return this.engine.configure(next)
  }

  /**
   * A run that came to its end, into the history (§7): unless the history is turned off. A run
   * stopped before the end is marked with how far it got.
   */
  #record(view: RunView, request: RunRequest): void {
    if (!this.#settings.saveHistory) return
    const done = view.blocks.filter((block) => block.state === 'done').length
    const now = Date.now()
    const entry: HistoryEntry = {
      id: randomBytes(8).toString('hex'),
      draftId: request.draftId,
      at: now,
      updatedAt: now,
      srcLang: view.srcLang,
      detected: view.detected,
      tgtLang: view.tgtLang,
      form: view.form,
      blocks: view.blocks.map((block) => ({
        lead: block.lead,
        source: block.source,
        text: block.text,
        done: block.state === 'done',
      })),
      tail: view.tail,
      partial: view.state === 'done' ? null : { done, total: view.blocks.length },
      model: this.#settings.modelId,
    }
    this.library.record(entry)
  }

  /** HISTORY opens an entry: it is put on the pane as a finished run. */
  showEntry(paneId: string, id: string): { version: number } | { problem: string } {
    const entry = this.library.entry(id)
    if (!entry) return { problem: 'That entry is gone.' }
    return {
      version: this.runs.show(paneId, {
        draftId: entry.draftId,
        srcLang: entry.srcLang,
        tgtLang: entry.tgtLang,
        form: entry.form,
        blocks: entry.blocks.map((block, index) => ({
          index,
          lead: block.lead,
          source: block.source,
          text: block.text,
          state: block.done ? 'done' : 'none',
          note: null,
          tokens: null,
          ms: null,
          history: 0,
          terms: 0,
          edited: false,
          trip: null,
        })),
        tail: entry.tail,
        detected: entry.detected,
        context: '',
        glossary: null,
      }),
    }
  }

  /** STOP or RESTART of the engine (ENGINE, FAULT): the runs stop with it. */
  stopEngine(): Promise<void> {
    this.runs.stopAll('The engine was stopped.')
    return this.engine.stop()
  }

  restartEngine(): Promise<void> {
    this.runs.stopAll('The engine was restarted.')
    return this.engine.restart()
  }

  async board(): Promise<TranslateBoard> {
    const models = await Promise.all(
      this.#models.map(async (model) => ({
        id: model.id,
        installed: (await fileSize(this.#modelPath(model))) === model.bytes,
        partialBytes: await fileSize(partOf(this.#modelPath(model))),
        consentAt: this.#file.read().consents[model.id]?.at ?? null,
      })),
    )
    return {
      engine: this.#engineView(),
      models,
      fetch: this.#fetch,
      selectedModel: this.#settings.modelId,
      library: this.library.revision,
      machine: { ...this.#machine, freeBytes: await freeBytes(this.#root) },
    }
  }

  logs(): string[] {
    return this.engine.logs()
  }

  watching(): string[] {
    const fetching = this.#fetch && this.#fetch.phase !== 'paused' && this.#fetch.phase !== 'failed'
    return [...(fetching ? ['fetch'] : []), ...this.runs.watching()]
  }

  /**
   * The licence agreed to, and the fetch: kept in engine.json for the app, and added to the
   * consent log with what was shown and what will be fetched (consent-log.ts).
   */
  async consent(modelId: string, agreement: Agreement): Promise<void> {
    const model = this.#models.find((m) => m.id === modelId)
    if (!model) throw new Error('No such model.')
    const at = new Date().toISOString()
    const engines = this.#enginesToFetch()
    // The log first: an agreement it could not keep is no agreement, and nothing is fetched on it.
    await appendConsent(this.#root, {
      at,
      appVersion: agreement.appVersion,
      model: {
        id: model.id,
        repo: model.repo,
        revision: model.revision,
        file: model.file,
        bytes: model.bytes,
        sha256: model.sha256,
      },
      licence: {
        name: 'PLaMo Community License',
        url: agreement.licence,
        openedAt: agreement.openedAt,
      },
      downloads: [
        `the model from ${modelUrl(this.#hfBase(), model)}`,
        ...engines.map(
          (engine) =>
            `llama.cpp ${ENGINE_BUILD} (MIT) from ${engineUrl(this.#releasesBase(), engine)}`,
        ),
      ],
    })
    const file = this.#file.read()
    this.#file.write({
      ...file,
      consents: {
        ...file.consents,
        [modelId]: { at, revision: model.revision, licence: agreement.licence },
      },
    })
    this.#changed()
  }

  setSource(kind: EngineFile['source']): void {
    const file = this.#file.read()
    if (kind === 'own' && !file.own) throw new Error('Choose your llama-server first.')
    if (kind === 'external' && !file.external) throw new Error('Test a server address first.')
    this.#file.write({ ...file, source: kind })
    void this.#reconfigure('The engine was changed.')
    this.#changed()
  }

  /** A llama-server of the user's own, chosen through main's picker: its build must read PLaMo 3. */
  async chooseOwn(file: string): Promise<{ build: number } | { problem: string }> {
    const output = await runForOutput(file, ['--version'])
    const build = parseBuild(output)
    if (build === null) return { problem: 'That is not llama-server: it did not tell its version.' }
    if (build < MIN_OWN_BUILD) {
      return { problem: `Build ${build} cannot read PLaMo 3; it needs b${MIN_OWN_BUILD} or later.` }
    }
    const current = this.#file.read()
    this.#file.write({ ...current, own: { path: file, build }, source: 'own' })
    void this.#reconfigure('The engine was changed.')
    this.#changed()
    return { build }
  }

  /** TEST of an external server (§4.1): its /props must name PLaMo 3 Translate. */
  async testExternal(
    raw: unknown,
  ): Promise<{ ok: true; host: string } | { ok: false; problem: string }> {
    const parsed = parseExternalUrl(raw)
    if (!parsed.ok) return parsed
    let response: Response
    try {
      response = await fetch(`${parsed.origin}/props`, {
        redirect: 'error',
        signal: AbortSignal.timeout(5000),
      })
    } catch {
      return { ok: false, problem: `Nothing answered at ${parsed.host}.` }
    }
    if (response.status === 401) {
      return { ok: false, problem: 'That server needs a key, which elecdex does not support yet.' }
    }
    if (!response.ok) return { ok: false, problem: `The server answered HTTP ${response.status}.` }
    const props: unknown = await response.json().catch(() => null)
    if (!servesPlamo(props))
      return { ok: false, problem: 'That server does not run a PLaMo 3 Translate model.' }
    const current = this.#file.read()
    this.#file.write({ ...current, external: { origin: parsed.origin }, source: 'external' })
    // After the change has taken: the restart it causes would otherwise mark the server untested again.
    await this.#reconfigure('The engine was changed.')
    this.engine.tested(true)
    this.#changed()
    return { ok: true, host: parsed.host }
  }

  /** Why a fetch cannot start now, or null: asked before starting one, so the page hears it. */
  fetchProblem(): string | null {
    const model = this.#selectedModel()
    if (!model) return 'No such model.'
    if (!this.#file.read().consents[model.id]) return 'Agree to the licence first.'
    return null
  }

  /** Fetches what the selected model needs: the engine first when elecdex provides it, then the model. */
  fetchSelected(): Promise<void> {
    if (this.#fetchRun) return this.#fetchRun
    this.#fetchRun = this.#fetchSelected().finally(() => {
      this.#fetchRun = null
    })
    return this.#fetchRun
  }

  async #fetchSelected(): Promise<void> {
    const model = this.#selectedModel()
    if (!model || this.fetchProblem()) return
    const controller = new AbortController()
    this.#fetchAbort = controller
    this.#paused = null
    try {
      const engine = this.#needsEngine()
      if (engine) await this.#fetchEngine(engine, controller.signal)
      await this.#fetchModel(model, controller.signal)
      this.#fetch = null
      void this.#reconfigure('A model was put in place.')
    } catch (error) {
      this.#failed(error, controller.signal)
    } finally {
      this.#fetchAbort = null
      this.#changed()
    }
  }

  /** PAUSE keeps the `.part`; elecdex quitting pauses too (§5). */
  pause(): void {
    const fetching = this.#fetch
    if (!fetching || !this.#fetchAbort) return
    this.#paused = { kind: fetching.kind, id: fetching.id }
    this.#fetchAbort.abort()
  }

  /** CANCEL drops the `.part` (§5), once the writer has let go of it: Windows cannot remove an open file. */
  async cancelFetch(): Promise<void> {
    const fetching = this.#fetch
    this.#paused = null
    this.#fetchAbort?.abort()
    await this.#fetchRun?.catch(() => {})
    this.#fetch = null
    const model =
      fetching?.kind === 'model' ? this.#models.find((m) => m.id === fetching.id) : undefined
    const engine =
      fetching?.kind === 'engine' ? this.#engines.find((e) => e.target === fetching.id) : undefined
    if (model) await rm(partOf(this.#modelPath(model)), { force: true })
    if (engine) await rm(partOf(this.#archivePath(engine)), { force: true })
    this.#changed()
  }

  async removeModel(modelId: string): Promise<void> {
    const model = this.#models.find((m) => m.id === modelId)
    if (!model) return
    // A model being fetched is cancelled first, never removed from under its writer.
    if (this.#fetch?.kind === 'model' && this.#fetch.id === modelId) await this.cancelFetch()
    // Windows keeps a loaded model's file open: stop the server first (§4.3).
    if (modelId === this.#settings.modelId) {
      this.runs.stopAll('The model was removed.')
      await this.engine.stop()
    }
    await rm(path.dirname(this.#modelPath(model)), { recursive: true, force: true })
    void this.#reconfigure('The model was removed.')
    this.#changed()
  }

  /** READY's one sentence (§3, SETUP): the engine up, a translation through it, not in the history. */
  async selfTest(): Promise<{ text: string; tokensPerSecond: number }> {
    const endpoint = await this.engine.ensure()
    this.engine.begin()
    try {
      const response = await fetch(`${endpoint.origin}/completion`, {
        method: 'POST',
        headers: authHeaders(endpoint.key),
        body: JSON.stringify({
          prompt: buildPrompt({ text: 'Good morning.', target: 'ja', form: 'polite' }),
          n_predict: 64,
          temperature: 0,
          stop: PFML_STOP,
          cache_prompt: false,
        }),
        signal: AbortSignal.timeout(60_000),
      })
      if (!response.ok) throw new Error(`The engine answered HTTP ${response.status}.`)
      const body = (await response.json()) as {
        content?: string
        timings?: { predicted_per_second?: number }
      }
      return {
        text: restore(body.content ?? '').trim(),
        tokensPerSecond: body.timings?.predicted_per_second ?? 0,
      }
    } finally {
      this.engine.end()
    }
  }

  /** elecdex is quitting (§4.3): no waiting on anything. */
  quit(): void {
    this.runs.quit()
    this.library.flush()
    this.pause()
    stopHashing()
    this.engine.killNow()
  }

  #failed(error: unknown, signal: AbortSignal): void {
    const fetching = this.#fetch
    if (signal.aborted) {
      this.#fetch = this.#paused && fetching ? { ...fetching, phase: 'paused', speed: 0 } : null
      return
    }
    const message = error instanceof Error ? error.message : String(error)
    this.#fetch = fetching ? { ...fetching, phase: 'failed', speed: 0, error: message } : null
  }

  async #fetchEngine(engine: EngineAsset, signal: AbortSignal): Promise<void> {
    const archive = this.#archivePath(engine)
    const target = {
      url: engineUrl(this.#releasesBase(), engine),
      dest: archive,
      bytes: engine.bytes,
      sha256: engine.sha256,
    }
    await this.#download('engine', engine.target, target, signal)
    this.#setFetch({
      kind: 'engine',
      id: engine.target,
      phase: 'placing',
      received: engine.bytes,
      total: engine.bytes,
      speed: 0,
      error: null,
    })
    // The licences come with elecdex (npm run gen:llama-licenses): no request, never a stand-in.
    await installEngine(archive, this.#root, this.#engineDir(engine), LLAMA_LICENSES)
    await rm(archive, { force: true })
    // The other builds of this platform (the CPU fallback) come with it.
    for (const other of enginesFor(this.#engines, this.#env.platform, this.#env.arch)) {
      if (
        other.target === engine.target ||
        existsSync(path.join(this.#engineDir(other), SERVER_NAME))
      )
        continue
      await this.#fetchEngine(other, signal)
    }
  }

  async #fetchModel(model: ModelEntry, signal: AbortSignal): Promise<void> {
    const target = {
      url: modelUrl(this.#hfBase(), model),
      dest: this.#modelPath(model),
      bytes: model.bytes,
      sha256: model.sha256,
    }
    await this.#download('model', model.id, target, signal)
  }

  async #download(
    kind: 'engine' | 'model',
    id: string,
    target: { url: string; dest: string; bytes: number; sha256: string },
    signal: AbortSignal,
  ): Promise<void> {
    this.#setFetch({
      kind,
      id,
      phase: 'downloading',
      received: await fileSize(partOf(target.dest)),
      total: target.bytes,
      speed: 0,
      error: null,
    })
    await fetchFile(
      target,
      {
        fetch: (url, init) => this.#env.netFetch(url, init),
        hash: (file, s) => sha256File(file, s),
        freeBytes,
        place: (part, dest) => replaceFile(part, dest),
        sleep: (ms, s) => sleepFor(ms, s),
        now: () => Date.now(),
      },
      (progress) =>
        this.#setFetch({
          kind,
          id,
          phase: progress.phase,
          received: progress.received,
          total: progress.total,
          speed: progress.speed,
          error: null,
        }),
      signal,
    )
  }

  #setFetch(view: FetchView): void {
    this.#fetch = view
    this.#changed()
  }

  #selectedModel(): ModelEntry | undefined {
    return this.#models.find((m) => m.id === this.#settings.modelId)
  }

  #modelPath(model: ModelEntry): string {
    return path.join(this.#root, 'models', model.id, model.file)
  }

  #archivePath(engine: EngineAsset): string {
    const ext = path.extname(engine.asset) === '.zip' ? '.zip' : '.tar.gz'
    return path.join(this.#root, `engine-${ENGINE_BUILD}-${engine.target}${ext}`)
  }

  #engineDir(engine: EngineAsset): string {
    return path.join(this.#root, 'engine', ENGINE_BUILD, engine.target)
  }

  /** The build elecdex fetches is needed when it is the source, missing, and no stub stands in. */
  #needsEngine(): EngineAsset | undefined {
    return this.#enginesToFetch()[0]
  }

  /** The builds of this platform a fetch would bring, none when the engine is not elecdex's. */
  #enginesToFetch(): EngineAsset[] {
    if (this.#file.read().source !== 'fetched' || this.#env.stubServer) return []
    return enginesFor(this.#engines, this.#env.platform, this.#env.arch).filter(
      (engine) => !existsSync(path.join(this.#engineDir(engine), SERVER_NAME)),
    )
  }

  #launches(file: EngineFile): EngineLaunch[] {
    if (this.#env.stubServer) {
      const script = this.#env.stubServer
      return [
        {
          exe: this.#env.execPath,
          prefix: [script],
          cwd: path.dirname(script),
          env: { ELECTRON_RUN_AS_NODE: '1' },
          backend: 'cpu',
          build: 'stub',
        },
      ]
    }
    const cpuOnly = this.#settings.device === 'cpu'
    if (file.source === 'own' && file.own) {
      const own = file.own
      const launch = (backend: EngineLaunch['backend']): EngineLaunch => ({
        exe: own.path,
        prefix: [],
        cwd: path.dirname(own.path),
        env: {},
        backend,
        build: `b${own.build}`,
      })
      const gpu = this.#env.platform === 'darwin' ? 'metal' : 'vulkan'
      return cpuOnly ? [launch('cpu')] : [launch(gpu), launch('cpu')]
    }
    if (file.source !== 'fetched') return []
    return enginesFor(this.#engines, this.#env.platform, this.#env.arch)
      .filter((engine) => !cpuOnly || engine.backend === 'cpu')
      .map((engine) => ({ engine, exe: path.join(this.#engineDir(engine), SERVER_NAME) }))
      .filter(({ exe }) => existsSync(exe))
      .map(({ engine, exe }) => ({
        exe,
        prefix: [],
        cwd: path.dirname(exe),
        env: {},
        backend: engine.backend,
        build: ENGINE_BUILD,
      }))
  }

  #config(): EngineConfig {
    const file = this.#file.read()
    const model = this.#selectedModel()
    const installed = model && existsSync(this.#modelPath(model)) ? model : undefined
    return {
      source: file.source,
      launches: this.#launches(file),
      modelPath: installed ? this.#modelPath(installed) : null,
      modelBytes: installed?.bytes ?? 0,
      ctx: this.#settings.ctx,
      idleMinutes: this.#settings.idleMinutes,
      origin: file.external?.origin ?? null,
    }
  }

  #engineView(): EngineView {
    const file = this.#file.read()
    const external = file.external ? parseExternalUrl(file.external.origin) : null
    return {
      phase: this.engine.phase,
      source: file.source,
      build: this.engine.build,
      backend: this.engine.backend,
      device: this.engine.device,
      port: this.engine.port,
      ctx: this.engine.ctx,
      error: this.engine.error,
      fallback: this.engine.fallback,
      bootLines: this.engine.bootLines(),
      externalHost: external?.ok ? external.host : null,
      externalLoopback: external?.ok ? external.loopback : false,
      externalOrigin: external?.ok ? external.origin : null,
      own: file.own ? { name: path.basename(file.own.path), build: file.own.build } : null,
      fetched:
        Boolean(this.#env.stubServer) ||
        enginesFor(this.#engines, this.#env.platform, this.#env.arch).some((engine) =>
          existsSync(path.join(this.#engineDir(engine), SERVER_NAME)),
        ),
      toFetchBytes: this.#enginesToFetch().reduce((sum, engine) => sum + engine.bytes, 0),
    }
  }

  async #listDevices(launch: EngineLaunch): Promise<string[]> {
    const file = this.#file.read()
    const key = `${launch.build}:${launch.exe}`
    const known = file.devices[key]
    if (known) return known
    const output = await runForOutput(launch.exe, ['--list-devices'])
    const devices = [...output.matchAll(/^\s*\w+\d+:\s*(.+?)\s*\(\d+ MiB/gm)]
      .map((m) => m[1] ?? '')
      .filter(Boolean)
    // Read again after the wait: another write may have come in the meantime.
    const latest = this.#file.read()
    this.#file.write({ ...latest, devices: { ...latest.devices, [key]: devices } })
    return devices
  }

  #hfBase(): string {
    return this.#env.hfBase || HF_BASE_URL
  }

  #releasesBase(): string {
    return this.#env.releasesBase || RELEASES_BASE_URL
  }

  #changed(): void {
    for (const listener of this.#listeners) listener()
  }
}

function readManifest(file: string | undefined): z.infer<typeof ManifestSchema> {
  if (!file) return {}
  try {
    return ManifestSchema.parse(JSON.parse(readFileSync(file, 'utf8')))
  } catch (error) {
    console.error('[elecdex] ignoring ELECDEX_TRANSLATE_MANIFEST', error)
    return {}
  }
}

function spawnServer(
  launch: EngineLaunch,
  args: string[],
  envVars: Record<string, string>,
): ServerProcess {
  const child = spawn(launch.exe, args, {
    cwd: launch.cwd,
    env: { ...process.env, ...envVars },
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.stdout.setEncoding('utf8')
  child.stderr.setEncoding('utf8')
  return {
    pid: child.pid ?? null,
    onOutput: (listener) => {
      child.stdout.on('data', listener)
      child.stderr.on('data', listener)
    },
    onExit: (listener) => {
      child.once('exit', (code) => listener(code))
      child.once('error', () => listener(null))
    },
    kill: (hard) => {
      child.kill(hard ? 'SIGKILL' : 'SIGTERM')
    },
  }
}

async function health(origin: string, key: string | null): Promise<number | null> {
  try {
    const response = await fetch(`${origin}/health`, {
      headers: authHeaders(key),
      signal: AbortSignal.timeout(2000),
    })
    return response.status
  } catch {
    return null
  }
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.unref()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      server.close(() => resolve(port))
    })
  })
}

async function freeBytes(dir: string): Promise<number | null> {
  try {
    const stats = await statfs(existsSync(dir) ? dir : path.dirname(dir))
    return stats.bavail * stats.bsize
  } catch {
    return null
  }
}

/** A program's stdout and stderr together, run with execFile (never Sync): `--version`, `--list-devices`. */
function runForOutput(file: string, args: string[]): Promise<string> {
  return new Promise((resolve) => {
    execFile(
      file,
      args,
      { windowsHide: true, timeout: 15_000, cwd: path.dirname(file) },
      (_error, stdout, stderr) => {
        resolve(`${stdout}\n${stderr}`)
      },
    )
  })
}

function sleepFor(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new Error('aborted'))
      },
      { once: true },
    )
  })
}
