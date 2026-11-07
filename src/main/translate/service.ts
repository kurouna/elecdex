import { execFile, spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { rm, statfs } from 'node:fs/promises'
import { createServer } from 'node:net'
import os from 'node:os'
import path from 'node:path'
import type { Settings } from '@shared/settings'
import {
  CHOSEN_MEANWHILE,
  type EngineFile,
  EngineFileSchema,
  type EngineView,
  type FetchView,
  type MachineView,
  type ModelView,
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
import {
  parseExternalUrl,
  type ServerModel,
  serverCtx,
  serverModels,
  servesPlamo,
} from '@shared/translate/external'
import type { HistoryEntry } from '@shared/translate/history'
import {
  HF_BASE_URL,
  MODELS,
  type ModelEntry,
  ModelEntrySchema,
  modelUrl,
} from '@shared/translate/models'
import { buildPrompt, PFML_STOP, restore } from '@shared/translate/pfml3'
import {
  behind,
  dueForCheck,
  inPlace,
  parseRevision,
  type RemoteFile,
  type RepoRevision,
  revisionUrl,
} from '@shared/translate/revisions'
import type { RunEvent, RunRequest, RunView } from '@shared/translate/run'
import { z } from 'zod'
import LLAMA_LICENSES from '../../../resources/translate/llama.cpp-licenses.txt?raw'
import { JsonStore } from '../store/json-store.js'
import { replaceFileNow } from '../store/replace-file.js'
import { appendConsent, appendMove } from './consent-log.js'
import {
  type EngineConfig,
  type EngineLaunch,
  restarts,
  type ServerProcess,
  TranslateEngine,
} from './engine.js'
import { FetchError, type FetchTarget, fetchFile, fileSize, partOf } from './fetcher.js'
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
  /** A llama-server's `--version` output, cut off by the signal; tests stand one in. */
  versionOf?: ((file: string, signal: AbortSignal) => Promise<string>) | undefined
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
  /** ENGINE's check for newer commits while it is under way (§5). */
  #checking: Promise<void> | null = null
  /** What the external server runs and its context, as last read; nothing until TEST passes. */
  #server: ServerRead = { models: [], ctx: null }
  /** Why the external server cannot be used, as last heard (not PLaMo, a key, no answer). */
  #serverProblem: string | null = null
  /** A CANCEL letting go of its `.part`: no fetch starts until it has (review 2026-11-07). */
  #cancelling = false
  /** Models being agreed to now: no fetch of theirs starts until the agreement is written. */
  readonly #agreeing = new Set<string>()
  /**
   * The model a fetch under way, paused or failed is for (the engine is fetched for it first),
   * while `#fetch` says how it goes. Not the model in use (user's choice 2026-11-07): that one
   * goes on translating until the new one is in place and chosen.
   */
  #fetchTarget: string | null = null
  /**
   * The choice of engine under way (TEST, an own llama-server, a source): the next one cuts it off,
   * so the last choice is the one that holds (review 2026-11-07: an older TEST answering late wrote
   * its server over the newer one's).
   */
  #choosing: AbortController | null = null

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
      probeExternal: (origin) => this.#probeExternal(origin),
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
      stalled: () => this.engine.stalled(),
      external: () => this.#file.read().source === 'external',
      unreachable: () => this.engine.unreachable(),
      ctx: () => this.#ctx(),
      tokenize: (endpoint, text, signal) => tokenize(fetch, endpoint, text, signal),
      complete: (endpoint, body, signal, onText) =>
        streamCompletion(fetch, endpoint, body, signal, onText, this.engine.answerStallMs()),
      setTimer: (fn, ms) => setTimeout(fn, ms),
      clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
      publish: (event) => {
        for (const listener of this.#runListeners) listener(event)
      },
    })
    this.#pausedOnDisk()
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

  /**
   * A model's `.part`, left by a fetch paused or by elecdex quitting, is shown paused for RESUME
   * (§5: never taken up by itself), with no new agreement (review 2026-11-07: it used to be
   * forgotten, and the whole setup walked again). The fetch may be for a model other than the one
   * in use (2026-11-07): the one in use is looked for first, then the others.
   */
  #pausedOnDisk(): void {
    const consents = this.#file.read().consents
    const selected = this.#selectedModel()
    const order = selected
      ? [selected, ...this.#models.filter((m) => m !== selected)]
      : this.#models
    for (const model of order) {
      const total = consents[model.id]?.bytes
      if (total === undefined) continue
      const received = partSize(partOf(this.#modelPath(model)))
      if (received === null) continue
      this.#showPaused(model, received, total)
      return
    }
  }

  #showPaused(model: ModelEntry, received: number, total: number): void {
    this.#fetch = {
      kind: 'model',
      id: model.id,
      phase: 'paused',
      received,
      total,
      speed: 0,
      error: null,
    }
    this.#paused = { kind: 'model', id: model.id }
    this.#fetchTarget = model.id
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
      // The model that wrote it: an external server's own, never the one chosen here.
      model:
        this.#file.read().source === 'external'
          ? (this.#server.models[0]?.name ?? 'external server').slice(0, 64)
          : this.#settings.modelId,
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
    // RESTART asks the builds for their GPUs again: a driver installed since is found (review
    // 2026-11-07; the answer was kept for good).
    const file = this.#file.read()
    if (Object.keys(file.devices).length > 0) this.#file.write({ ...file, devices: {} })
    return this.engine.restart()
  }

  async board(): Promise<TranslateBoard> {
    const file = this.#file.read()
    const models = await Promise.all(this.#models.map((model) => this.#modelView(model, file)))
    return {
      engine: this.#engineView(),
      models,
      fetch: this.#fetch,
      fetchingModel: this.#fetch !== null || this.#fetchRun !== null ? this.#fetchTarget : null,
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
    return [
      ...(fetching ? ['fetch'] : []),
      ...this.runs.watching(),
      ...(this.#checking ? ['update-check'] : []),
    ].sort()
  }

  /**
   * ENGINE was opened: ask Hugging Face for the newest commits of the models in place, at most once
   * a day (user's request 2026-11-06), whatever the answer. A model behind its repository is then
   * offered UPDATE; nothing is fetched by itself.
   */
  checkUpdates(now = Date.now()): Promise<void> {
    // ENGINE was opened: an external server may run another model since it was last read.
    void this.refreshServer()
    if (this.#checking) return this.#checking
    if (!dueForCheck(this.#file.read().checkedAt, now)) return Promise.resolve()
    this.#checking = this.#check(now).finally(() => {
      this.#checking = null
      this.#changed()
    })
    return this.#checking
  }

  async #check(now: number): Promise<void> {
    const repos = new Set<string>()
    for (const model of this.#models) {
      if (await this.#inPlace(model, this.#file.read())) repos.add(model.repo)
    }
    // Nothing in place, nothing asked: the first agreement asks for itself.
    if (repos.size === 0) return
    this.#file.write({ ...this.#file.read(), checkedAt: new Date(now).toISOString() })
    for (const repo of repos) {
      const heard = await this.#askRevision(repo)
      if (heard) this.#hear(repo, heard)
    }
  }

  /** The newest commit of a repository, asked of Hugging Face; null when it did not answer. */
  async #askRevision(repo: string): Promise<RepoRevision | null> {
    try {
      const response = await this.#env.netFetch(revisionUrl(this.#hfBase(), repo), {
        signal: AbortSignal.timeout(15_000),
      })
      return response.ok ? parseRevision(await response.json()) : null
    } catch {
      return null
    }
  }

  /** A repository's newest commit and its files, kept for the board. */
  #hear(repo: string, heard: RepoRevision): void {
    const file = this.#file.read()
    this.#file.write({
      ...file,
      latest: {
        ...file.latest,
        [repo]: { revision: heard.revision, date: heard.date, files: heard.files },
      },
    })
  }

  /**
   * A fetch run under way, the engine's or a model's: no agreement is made meanwhile, since the
   * run goes on from the engine to the model and would read the agreement before it.
   */
  #fetchUnderWay(): boolean {
    return this.#fetchRun !== null
  }

  /** The file a model has in place: its record, or a first release's by its size (revisions.ts). */
  async #inPlace(model: ModelEntry, file: EngineFile): Promise<RemoteFile | null> {
    return inPlace(file.installed[model.id], model, await fileSize(this.#modelPath(model)))
  }

  async #modelView(model: ModelEntry, file: EngineFile): Promise<ModelView> {
    const installed = await this.#inPlace(model, file)
    const latest = file.latest[model.repo]
    const newest = latest?.files[model.file]
    const agreed = file.consents[model.id]
    // An agreement counts for the newest file known only: an update is agreed to again.
    const current =
      agreed?.sha256 !== undefined && (newest === undefined || agreed.sha256 === newest.sha256)
    return {
      id: model.id,
      installed: installed !== null,
      revision: installed?.revision ?? null,
      update:
        latest && behind(installed, newest)
          ? { revision: latest.revision, date: latest.date }
          : null,
      partialBytes: await fileSize(partOf(this.#modelPath(model))),
      consentAt: current && agreed ? agreed.at : null,
    }
  }

  /**
   * The licence agreed to, and the fetch, for the newest commit of the model's repository, asked
   * of Hugging Face now (§5): kept in engine.json for the app, and added to the consent log with
   * what was shown and what will be fetched (consent-log.ts). The answer is the commit agreed to.
   */
  async consent(
    modelId: string,
    agreement: Agreement,
  ): Promise<{ revision: string } | { problem: string }> {
    const model = this.#models.find((m) => m.id === modelId)
    if (!model) return { problem: 'No such model.' }
    if (this.#fetchUnderWay() || this.#agreeing.has(model.id)) {
      return { problem: 'A fetch is under way: let it finish, or cancel it, first.' }
    }
    // From here until the agreement is written, no fetch of this model starts (fetchProblem):
    // one would read the agreement before it and mix two versions in its part.
    this.#agreeing.add(model.id)
    try {
      return await this.#agree(model, agreement)
    } finally {
      this.#agreeing.delete(model.id)
    }
  }

  async #agree(
    model: ModelEntry,
    agreement: Agreement,
  ): Promise<{ revision: string } | { problem: string }> {
    const heard = await this.#askRevision(model.repo)
    if (!heard) return { problem: 'Hugging Face did not answer: try again in a while.' }
    const offered = heard.files[model.file]
    if (!offered) return { problem: `${model.file} is no longer offered by Preferred Networks.` }
    const target: RemoteFile = { revision: heard.revision, ...offered }
    try {
      await this.#writeAgreement(model, target, agreement)
    } catch (error) {
      const why = error instanceof Error ? error.message : String(error)
      return { problem: `The agreement could not be written down (${why}).` }
    }
    this.#hear(model.repo, heard)
    this.#changed()
    return { revision: target.revision }
  }

  async #writeAgreement(
    model: ModelEntry,
    target: RemoteFile,
    agreement: Agreement,
  ): Promise<void> {
    const at = new Date().toISOString()
    const engines = this.#enginesToFetch()
    // The log first: an agreement it could not keep is no agreement, and nothing is fetched on it.
    await appendConsent(this.#root, {
      at,
      appVersion: agreement.appVersion,
      model: {
        id: model.id,
        repo: model.repo,
        revision: target.revision,
        file: model.file,
        bytes: target.bytes,
        sha256: target.sha256,
      },
      licence: {
        name: 'PLaMo Community License',
        url: agreement.licence,
        openedAt: agreement.openedAt,
      },
      downloads: [
        `the model from ${modelUrl(this.#hfBase(), { ...model, revision: target.revision })}`,
        ...engines.map(
          (engine) =>
            `llama.cpp ${ENGINE_BUILD} (MIT) from ${engineUrl(this.#releasesBase(), engine)}`,
        ),
      ],
    })
    // A part of another file is of no use for this one, paused or failed: it goes, with its fetch.
    // None is writing: one could not start while this model is being agreed to.
    if (this.#file.read().consents[model.id]?.sha256 !== target.sha256) {
      if (this.#fetch?.kind === 'model' && this.#fetch.id === model.id) {
        this.#fetch = null
        this.#fetchTarget = null
        this.#paused = null
      }
      await rm(partOf(this.#modelPath(model)), { force: true })
    }
    this.#file.write({
      ...this.#file.read(),
      consents: {
        ...this.#file.read().consents,
        [model.id]: { at, licence: agreement.licence, ...target },
      },
    })
  }

  setSource(kind: EngineFile['source']): void {
    const file = this.#file.read()
    if (kind === 'own' && !file.own) throw new Error('Choose your llama-server first.')
    if (kind === 'external' && !file.external) throw new Error('Test a server address first.')
    // Only a switch that takes cuts off the choice under way (review 2026-11-07).
    this.#choose()
    // Chosen again untested, the server's models are read again when it answers.
    this.#server = { models: [], ctx: null }
    this.#serverProblem = null
    this.#file.write({ ...file, source: kind })
    void this.#reconfigure('The engine was changed.')
    this.#changed()
  }

  /** A llama-server of the user's own, chosen through main's picker: its build must read PLaMo 3. */
  async chooseOwn(file: string): Promise<{ build: number } | { problem: string }> {
    const signal = this.#choose()
    const output = await (this.#env.versionOf ?? versionOf)(file, signal)
    if (signal.aborted) return { problem: CHOSEN_MEANWHILE }
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

  /** A new choice of engine: the one under way is cut off. */
  #choose(): AbortSignal {
    this.#choosing?.abort()
    this.#choosing = new AbortController()
    return this.#choosing.signal
  }

  /** TEST of an external server (§4.1): its /props must name PLaMo 3 Translate. */
  async testExternal(
    raw: unknown,
  ): Promise<{ ok: true; host: string } | { ok: false; problem: string }> {
    const parsed = parseExternalUrl(raw)
    if (!parsed.ok) return parsed
    const signal = this.#choose()
    const read = await readServer(parsed.origin, signal)
    if (signal.aborted) return { ok: false, problem: CHOSEN_MEANWHILE }
    if ('problem' in read) {
      const problem =
        read.problem === 'nothing' ? `Nothing answered at ${parsed.host}.` : read.problem
      return { ok: false, problem }
    }
    this.#server = read
    this.#serverProblem = null
    const current = this.#file.read()
    this.#file.write({ ...current, external: { origin: parsed.origin }, source: 'external' })
    // After the change has taken: the restart it causes would otherwise mark the server untested again.
    await this.#reconfigure('The engine was changed.')
    // Another choice came while the engine took this one: it holds, and this one is not said done.
    if (signal.aborted) return { ok: false, problem: CHOSEN_MEANWHILE }
    this.engine.tested(true)
    this.#changed()
    return { ok: true, host: parsed.host }
  }

  /**
   * Reads again what the external server runs (ENGINE opened): it may have been started with
   * another model since. One that no longer runs PLaMo 3 Translate is not used until it does
   * (review 2026-11-07); one that does not answer keeps what was read, and its next request says.
   */
  async refreshServer(): Promise<void> {
    const file = this.#file.read()
    if (file.source !== 'external' || !file.external) return
    if (this.engine.phase !== 'external-ready') return
    const read = await readServer(file.external.origin)
    if (this.#file.read().external?.origin !== file.external.origin) return
    if ('problem' in read) {
      if (read.problem === 'nothing') return
      this.#unusable(read.problem)
      return
    }
    if (JSON.stringify(read) === JSON.stringify(this.#server)) return
    this.#server = read
    // The answer's wait follows the model's size (answerStallMs); nothing restarts for it.
    void this.engine.configure(this.#config())
    this.#changed()
  }

  /**
   * The engine's probe of an external server before it is used again: it must answer and run
   * PLaMo 3 Translate, and what it runs is read anew. Null when it can be used, else why not.
   */
  async #probeExternal(origin: string): Promise<string | null> {
    const read = await readServer(origin)
    // A server replaced while it was asked (TEST of another address): its answer is not the new
    // one's, which keeps what its own TEST read (review 2026-11-07).
    const current = this.#file.read().external?.origin === origin
    if ('problem' in read) {
      const problem =
        read.problem === 'nothing' ? `The server at ${origin} does not answer.` : read.problem
      if (current) this.#serverProblem = problem
      return problem
    }
    if (!current) return null
    this.#server = read
    this.#serverProblem = null
    void this.engine.configure(this.#config())
    return null
  }

  #unusable(problem: string): void {
    this.#serverProblem = problem
    this.#server = { models: [], ctx: null }
    this.runs.stopAll(problem)
    this.engine.tested(false)
    this.#changed()
  }

  /**
   * Why a fetch of this model (the one in use when none is named) cannot start now, or null: asked
   * before starting one, so the page hears it.
   */
  fetchProblem(modelId = this.#settings.modelId): string | null {
    if (this.#cancelling) return 'The download is being cancelled: a moment, please.'
    const model = this.#models.find((m) => m.id === modelId)
    if (!model) return 'No such model.'
    // One fetch at a time: another model's, under way, paused or failed, is finished or cancelled
    // first, so its `.part` is never left behind unseen. Under way counts from the start, before
    // its progress is on the board (review 2026-11-07: a second one joined the first's run).
    const other = this.#fetchTarget !== null && this.#fetchTarget !== modelId
    if (other && this.#fetchRun !== null)
      return 'Another model is being fetched: let it finish, or cancel it, first.'
    if (other && this.#fetch !== null)
      return "Another model's download is paused or failed: resume or cancel it first."
    // An agreement made before commits were followed names no file: it is asked again.
    const file = this.#file.read()
    const agreed = file.consents[model.id]
    if (agreed?.bytes === undefined) return 'Agree to the licence first.'
    // An agreement counts for the newest file known only, as the board says (#modelView): RESUME
    // of an older one would ask for the commit refused again (review 2026-11-07).
    const newest = file.latest[model.repo]?.files[model.file]
    if (newest !== undefined && agreed.sha256 !== newest.sha256)
      return 'Hugging Face now offers a newer version of this model: cancel, and set it up again to agree to it.'
    if (this.#agreeing.has(model.id)) return 'The licence is being agreed to: a moment, please.'
    return null
  }

  /**
   * Fetches what a model needs (the one in use when none is named): the engine first when elecdex
   * provides it, then the model. The settings are not touched (user's choice 2026-11-07): the
   * engine runs the fetched one only when it is the model in use (a first setup, an update).
   */
  fetchFor(modelId = this.#settings.modelId): Promise<void> {
    if (this.#fetchRun) return this.#fetchRun
    this.#fetchRun = this.#fetchFor(modelId).finally(() => {
      this.#fetchRun = null
    })
    return this.#fetchRun
  }

  async #fetchFor(modelId: string): Promise<void> {
    const model = this.#models.find((m) => m.id === modelId)
    if (!model || this.fetchProblem(modelId)) return
    this.#fetchTarget = model.id
    // Said at once: SETUP waits for the board to name the model being fetched.
    this.#changed()
    // A fetch paused before elecdex last quit is taken up from its `.part` (§5).
    if (this.#fetch?.phase === 'paused') this.#fetch = { ...this.#fetch, phase: 'downloading' }
    const controller = new AbortController()
    this.#fetchAbort = controller
    this.#paused = null
    try {
      const engine = this.#needsEngine()
      if (engine) await this.#fetchEngine(engine, controller.signal)
      await this.#fetchModel(model, controller.signal)
      this.#fetch = null
      this.#fetchTarget = null
      void this.#reconfigure('A model was put in place.')
    } catch (error) {
      this.#failed(error, controller.signal)
      if (this.#fetch === null) this.#fetchTarget = null
      // Said at once as the server answered; why, in plain words, once Hugging Face is asked.
      void this.#explain(model, error)
    } finally {
      this.#fetchAbort = null
      this.#changed()
    }
  }

  /** A failed fetch's error replaced by why it failed, if it is still that failure by then. */
  async #explain(model: ModelEntry, error: unknown): Promise<void> {
    const failed = this.#fetch
    if (failed?.kind !== 'model' || failed.phase !== 'failed') return
    const why = await this.#goneWhy(model, error)
    if (why === null || this.#fetch !== failed) return
    this.#fetch = { ...failed, error: why }
    this.#changed()
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
    // The model it is for, from its start: its `.part` goes too while the engine is fetched for it,
    // or before its progress is on the board (review 2026-11-07: one left came back paused).
    const target = this.#fetchTarget
    this.#paused = null
    // Until the `.part` is gone no fetch starts: a RESUME pressed meanwhile would write into the
    // file this removes (review 2026-11-07).
    this.#cancelling = true
    try {
      this.#fetchAbort?.abort()
      await this.#fetchRun?.catch(() => {})
      this.#fetch = null
      this.#fetchTarget = null
      const modelId = fetching?.kind === 'model' ? fetching.id : target
      const model = this.#models.find((m) => m.id === modelId)
      const engine =
        fetching?.kind === 'engine'
          ? this.#engines.find((e) => e.target === fetching.id)
          : undefined
      if (model) await rm(partOf(this.#modelPath(model)), { force: true })
      if (engine) await rm(partOf(this.#archivePath(engine)), { force: true })
    } finally {
      this.#cancelling = false
      this.#changed()
    }
  }

  async removeModel(modelId: string): Promise<void> {
    const model = this.#models.find((m) => m.id === modelId)
    if (!model) return
    // A model being fetched is cancelled first, never removed from under its writer.
    // A fetch for it counts from its start, the engine fetched first included (review 2026-11-07).
    if (this.#fetchTarget === modelId && (this.#fetch !== null || this.#fetchRun !== null))
      await this.cancelFetch()
    // Windows keeps a loaded model's file open: stop the server first (§4.3).
    if (modelId === this.#settings.modelId) {
      this.runs.stopAll('The model was removed.')
      await this.engine.stop()
    }
    await rm(path.dirname(this.#modelPath(model)), { recursive: true, force: true })
    this.#remember(model, null)
    void this.#reconfigure('The model was removed.')
    this.#changed()
  }

  /** READY's one sentence (§3, SETUP): the engine up, a translation through it, not in the history. */
  async selfTest(): Promise<{ text: string; tokensPerSecond: number }> {
    const endpoint = await this.engine.ensure()
    this.engine.begin()
    try {
      const response = await fetch(`${endpoint.origin}/completion`, {
        // Never followed elsewhere (§4.1), and as long as any answer may take for this model.
        redirect: 'error',
        method: 'POST',
        headers: authHeaders(endpoint.key),
        body: JSON.stringify({
          prompt: buildPrompt({ text: 'Good morning.', target: 'ja', form: 'polite' }),
          n_predict: 64,
          temperature: 0,
          stop: PFML_STOP,
          cache_prompt: false,
        }),
        signal: AbortSignal.timeout(this.engine.answerStallMs()),
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

  #failed(error: unknown, signal: AbortSignal, why: string | null = null): void {
    const fetching = this.#fetch
    if (signal.aborted) {
      this.#fetch = this.#paused && fetching ? { ...fetching, phase: 'paused', speed: 0 } : null
      return
    }
    const message = why ?? (error instanceof Error ? error.message : String(error))
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

  /** The commit agreed to, unless it is the one in place: an update replaces the file. */
  async #fetchModel(model: ModelEntry, signal: AbortSignal): Promise<void> {
    // Belt and braces: an agreement never runs beside a fetch (consent above), but this one
    // reads the agreement only now, after the engine.
    if (this.#agreeing.has(model.id))
      throw new Error('The licence is being agreed to: a moment, please.')
    const agreed = this.#file.read().consents[model.id]
    if (agreed?.bytes === undefined || agreed.sha256 === undefined) {
      throw new Error('Agree to the licence first.')
    }
    const wanted: RemoteFile = {
      revision: agreed.revision,
      bytes: agreed.bytes,
      sha256: agreed.sha256,
    }
    const current = await this.#inPlace(model, this.#file.read())
    // The same file at another commit (only something else changed): no download, a new record.
    if (current?.sha256 === wanted.sha256) {
      this.#remember(model, wanted)
      return
    }
    const target = {
      url: modelUrl(this.#hfBase(), { ...model, revision: wanted.revision }),
      dest: this.#modelPath(model),
      bytes: wanted.bytes,
      sha256: wanted.sha256,
      replace: current !== null,
    }
    await this.#download('model', model.id, target, signal, (part, dest) =>
      this.#placeModel(model, part, dest),
    )
    this.#remember(model, wanted)
  }

  /** The file a model has in place, written down: what the board and an update are told by. */
  #remember(model: ModelEntry, placed: RemoteFile | null): void {
    const file = this.#file.read()
    const installed = { ...file.installed }
    if (placed) installed[model.id] = { ...placed, at: new Date().toISOString() }
    else delete installed[model.id]
    this.#file.write({ ...file, installed })
  }

  /**
   * Why a model's download was refused, in plain words, when the commit agreed to is no longer
   * served (HTTP 403 or 404): asked of Hugging Face again, a newer file is kept for the board,
   * so LICENCE asks for it. Null for anything else.
   */
  async #goneWhy(model: ModelEntry, error: unknown): Promise<string | null> {
    if (!(error instanceof FetchError) || (error.status !== 403 && error.status !== 404))
      return null
    const heard = await this.#askRevision(model.repo)
    const newest = heard?.files[model.file]
    if (!heard || !newest) {
      return `Hugging Face no longer serves this file (HTTP ${error.status}). Try Resume later.`
    }
    this.#hear(model.repo, heard)
    const file = this.#file.read()
    const agreed = file.consents[model.id]
    // Already at the newest commit (agreed again meanwhile): nothing moved, and nothing is logged.
    if (agreed?.revision === heard.revision) {
      return `Hugging Face no longer serves this file (HTTP ${error.status}). Try Resume later.`
    }
    if (agreed && newest.sha256 === agreed.sha256) {
      // The very file, at a newer commit that changed something else: the agreement is for this
      // file, so it follows the commit, and what was fetched goes on from where it stopped.
      this.#file.write({
        ...file,
        consents: { ...file.consents, [model.id]: { ...agreed, revision: heard.revision } },
      })
      // Kept with the agreement it follows: the same file, fetched from another address.
      await appendMove(this.#root, {
        at: new Date().toISOString(),
        modelId: model.id,
        from: agreed.revision,
        to: heard.revision,
        sha256: agreed.sha256 ?? newest.sha256,
        url: modelUrl(this.#hfBase(), { ...model, revision: heard.revision }),
      }).catch(() => {})
      return 'Hugging Face moved this file to a newer version of the repository: press Resume.'
    }
    return 'Hugging Face now offers a newer version of this model: cancel, and set it up again to agree to it.'
  }

  /** An update of the model the engine runs: Windows keeps it open, so the engine stops first. */
  async #placeModel(model: ModelEntry, part: string, dest: string): Promise<void> {
    if (model.id === this.#settings.modelId && existsSync(dest)) {
      this.runs.stopAll('The model is being updated.')
      await this.engine.stop()
    }
    // Awaited: the record of the file in place is written next, and the engine starts on it.
    await replaceFileNow(part, dest)
  }

  async #download(
    kind: 'engine' | 'model',
    id: string,
    target: FetchTarget,
    signal: AbortSignal,
    // Awaited: what was fetched is used next (an archive unpacked, a model run).
    place: (part: string, dest: string) => void | Promise<void> = replaceFileNow,
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
        place,
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
    // An external server runs its own model, whatever is chosen here: its size is the one it says.
    const bytes =
      file.source === 'external' ? (this.#server.models[0]?.bytes ?? 0) : (installed?.bytes ?? 0)
    return {
      source: file.source,
      launches: this.#launches(file),
      modelPath: installed ? this.#modelPath(installed) : null,
      modelBytes: bytes,
      ctx: this.#settings.ctx,
      idleMinutes: this.#settings.idleMinutes,
      origin: file.external?.origin ?? null,
    }
  }

  /**
   * The context a request is measured against: an external server's own (its `-c`, not elecdex's
   * setting, which it never hears), or the setting for the engines elecdex starts.
   */
  #ctx(): number {
    const external = this.#file.read().source === 'external'
    return (external ? this.#server.ctx : null) ?? this.#settings.ctx
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
      ctx: file.source === 'external' ? this.#ctx() : this.engine.ctx,
      error: this.engine.error,
      fallback: this.engine.fallback,
      bootLines: this.engine.bootLines(),
      externalHost: external?.ok ? external.host : null,
      externalLoopback: external?.ok ? external.loopback : false,
      externalOrigin: external?.ok ? external.origin : null,
      serverModels: file.source === 'external' ? this.#server.models : [],
      serverProblem: file.source === 'external' ? this.#serverProblem : null,
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
      redirect: 'error',
      headers: authHeaders(key),
      signal: AbortSignal.timeout(2000),
    })
    return response.status
  } catch {
    return null
  }
}

/** What an external server said of itself: its models, and the context it was started with. */
interface ServerRead {
  models: ServerModel[]
  ctx: number | null
}

/**
 * What an external server runs (§4.1): its `/props` must name PLaMo 3 Translate, and says its
 * context; `/v1/models` adds the sizes, and a server without it is taken all the same. Redirects
 * are refused.
 */
async function readServer(
  origin: string,
  cut?: AbortSignal,
): Promise<ServerRead | { problem: 'nothing' | (string & {}) }> {
  const signal = () =>
    cut ? AbortSignal.any([AbortSignal.timeout(5000), cut]) : AbortSignal.timeout(5000)
  const get = (route: string) => fetch(`${origin}${route}`, { redirect: 'error', signal: signal() })
  let response: Response
  try {
    response = await get('/props')
  } catch {
    return { problem: 'nothing' }
  }
  if (response.status === 401) {
    return { problem: 'That server needs a key, which elecdex does not support yet.' }
  }
  if (!response.ok) return { problem: `The server answered HTTP ${response.status}.` }
  const props: unknown = await response.json().catch(() => null)
  if (!servesPlamo(props)) return { problem: 'That server does not run a PLaMo 3 Translate model.' }
  const list: unknown = await get('/v1/models')
    .then((answer) => (answer.ok ? answer.json() : null))
    .catch(() => null)
  return { models: serverModels(props, list), ctx: serverCtx(props) }
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

/** A `.part`'s size, or null when there is none. */
function partSize(file: string): number | null {
  try {
    return statSync(file).size
  } catch {
    return null
  }
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
/** `--version` of a llama-server, cut off with the choice it was asked for. */
function versionOf(file: string, signal: AbortSignal): Promise<string> {
  return runForOutput(file, ['--version'], signal)
}

function runForOutput(file: string, args: string[], signal?: AbortSignal): Promise<string> {
  return new Promise((resolve) => {
    execFile(
      file,
      args,
      {
        windowsHide: true,
        timeout: 15_000,
        cwd: path.dirname(file),
        ...(signal ? { signal } : {}),
      },
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
