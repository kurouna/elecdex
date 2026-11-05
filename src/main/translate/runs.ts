import { splitBlocks, splitParts } from '@shared/translate/blocks'
import { buildPrompt, formFor, PFML_STOP, restore } from '@shared/translate/pfml3'
import {
  applyBlockPatch,
  type BlockPatch,
  type RunEvent,
  type RunRequest,
  type RunState,
  type RunView,
} from '@shared/translate/run'
import { type Completion, type Endpoint, NoStopError, ServerAnswerError } from './llama.js'

/**
 * The translations main holds, one per pane, and the one queue they wait in (docs/translate.md
 * §6.1, §8.5). The engine has one slot: one block is written at a time, the blocks of a run in
 * order, each with the two before it as history. A run belongs to main, so a pane that is moved or
 * reloaded is given it back as it stands; one nobody follows is dropped after a few seconds.
 *
 * Free of Electron and of the network: the engine, llama-server and the clock are passed in.
 */

/** Patches are gathered and sent this often: a local model writes hundreds of tokens a second. */
export const FLUSH_MS = 100
/** A run nobody follows is stopped and dropped after this long (§8.5). */
export const ORPHAN_MS = 5000
/** A reload holds that clock until the page has loaded, but not longer than this. */
export const RELOAD_HOLD_MS = 60_000
/** Room the answer needs at least, in tokens, before history is given up for it. */
const MIN_ROOM = 64

export interface RunsDeps {
  /** The engine up (started when it is not); rejects when it cannot be. */
  ensure(): Promise<Endpoint>
  begin(): void
  end(): void
  /** After a request failed: the engine is given a moment to hear whether its server ended. */
  settle(): Promise<void>
  /** The engine is another machine's: a failure there is "unreachable", never a crash. */
  external(): boolean
  unreachable(): void
  ctx(): number
  tokenize(endpoint: Endpoint, text: string, signal: AbortSignal): Promise<number>
  complete(
    endpoint: Endpoint,
    body: Record<string, unknown>,
    signal: AbortSignal,
    onText: (text: string) => void,
  ): Promise<Completion>
  setTimer(fn: () => void, ms: number): unknown
  clearTimer(handle: unknown): void
  /** A patch or a new run, for every page that follows the pane. */
  publish(event: RunEvent): void
  /** What `watching()` answers changed. */
  changed(): void
}

/** The block cannot be put in the context even alone: said on the block, the run goes on. */
class TooLongError extends Error {}

interface Run {
  view: RunView
  request: RunRequest
  abort: AbortController | null
  orphan: unknown
  pending: Map<number, BlockPatch>
  pendingRun: { state?: RunState; reason?: string | null }
  flush: unknown
}

interface Pair {
  source: string
  target: string
}

export class TranslateRuns {
  readonly #deps: RunsDeps
  readonly #runs = new Map<string, Run>()
  readonly #seq = new Map<string, number>()
  /** Pages following each pane: kept apart from the runs, a pane is followed before it asks. */
  readonly #followers = new Map<string, number>()
  /** Panes whose page is being reloaded: their clock waits for it to load (§8.5). */
  readonly #held = new Set<string>()
  /** Panes with blocks still to write, in the order they asked. */
  #queue: string[] = []
  #version = 0
  #working = false

  constructor(deps: RunsDeps) {
    this.#deps = deps
  }

  /** A new translation for a pane: it takes the place of the pane's last one (§8.5's table). */
  start(request: RunRequest): number {
    const old = this.#runs.get(request.paneId)
    if (old) this.#retire(old)
    const { blocks, tail } = splitBlocks(request.text)
    const version = ++this.#version
    const busy = this.#queue.some((id) => id !== request.paneId)
    const run: Run = {
      view: {
        paneId: request.paneId,
        draftId: request.draftId,
        version,
        srcLang: request.srcLang,
        tgtLang: request.tgtLang,
        form: formFor(request.tgtLang, request.form) ?? null,
        state: blocks.length === 0 ? 'done' : busy ? 'waiting' : 'running',
        reason: null,
        blocks: blocks.map((block, index) => ({
          index,
          lead: block.lead,
          source: block.text,
          text: '',
          state: 'queued',
          note: null,
          tokens: null,
          ms: null,
          history: 0,
        })),
        tail,
      },
      request,
      abort: null,
      orphan: null,
      pending: new Map(),
      pendingRun: {},
      flush: null,
    }
    this.#runs.set(request.paneId, run)
    if (blocks.length > 0 && !this.#queue.includes(request.paneId)) this.#queue.push(request.paneId)
    if (blocks.length === 0) this.#queue = this.#queue.filter((id) => id !== request.paneId)
    this.#deps.publish(this.#snapshotEvent(request.paneId, true))
    // Asked, and nobody follows it (closed in between): it must not run on unread.
    if (!this.#followers.get(request.paneId)) {
      this.#armOrphan(run, this.#held.has(request.paneId) ? RELOAD_HOLD_MS + ORPHAN_MS : ORPHAN_MS)
    }
    this.#deps.changed()
    this.#pump()
    return version
  }

  /** STOP (§3): the block being written stays, said; those after it are not translated. */
  stop(paneId: string, reason = 'Stopped.'): void {
    const run = this.#runs.get(paneId)
    if (!run || run.view.state === 'done' || run.view.state === 'stopped') return
    run.abort?.abort()
    run.abort = null
    for (const block of run.view.blocks) {
      if (block.state === 'running') this.#patch(run, { index: block.index, state: 'stopped' })
      else if (block.state === 'queued') this.#patch(run, { index: block.index, state: 'none' })
    }
    this.#setState(run, 'stopped', reason)
    this.#queue = this.#queue.filter((id) => id !== paneId)
    this.#flushNow(run)
  }

  /** The engine was stopped, or its model or settings changed: every run stops (§8.5). */
  stopAll(reason: string): void {
    for (const paneId of [...this.#runs.keys()]) this.stop(paneId, reason)
  }

  /** A page follows the pane: it is given the run as it stands, then its patches. */
  follow(paneId: string): RunEvent {
    this.#followers.set(paneId, (this.#followers.get(paneId) ?? 0) + 1)
    this.#held.delete(paneId)
    const run = this.#runs.get(paneId)
    if (run) this.#clearOrphan(run)
    return this.#snapshotEvent(paneId, false)
  }

  /** A page stopped following: by a reload, the clock waits for the page to load again (§8.5). */
  unfollow(paneId: string, how: 'now' | 'reload' = 'now'): void {
    const left = Math.max(0, (this.#followers.get(paneId) ?? 0) - 1)
    if (left > 0) {
      this.#followers.set(paneId, left)
      return
    }
    this.#followers.delete(paneId)
    if (how === 'reload') this.#held.add(paneId)
    const run = this.#runs.get(paneId)
    if (run) this.#armOrphan(run, how === 'reload' ? RELOAD_HOLD_MS + ORPHAN_MS : ORPHAN_MS)
  }

  /** The page that was reloaded has loaded: the runs it held start their last few seconds. */
  pageLoaded(): void {
    for (const paneId of [...this.#held]) {
      this.#held.delete(paneId)
      const run = this.#runs.get(paneId)
      if (run && !this.#followers.get(paneId)) this.#armOrphan(run, ORPHAN_MS)
    }
  }

  watching(): string[] {
    return [...this.#runs.keys()].map((paneId) => `run:${paneId}`).sort()
  }

  /** elecdex is quitting: nothing is waited for. */
  quit(): void {
    for (const run of this.#runs.values()) this.#retire(run)
    this.#runs.clear()
    this.#queue = []
  }

  #snapshotEvent(paneId: string, next: boolean): RunEvent {
    const run = this.#runs.get(paneId)
    if (run) this.#flushNow(run)
    const seq = (this.#seq.get(paneId) ?? 0) + (next ? 1 : 0)
    this.#seq.set(paneId, seq)
    return { paneId, seq, kind: 'snapshot', run: run ? structuredClone(run.view) : null }
  }

  /** A run replaced or dropped: its writing stops, its timers go. */
  #retire(run: Run): void {
    run.abort?.abort()
    run.abort = null
    this.#clearOrphan(run)
    if (run.flush !== null) this.#deps.clearTimer(run.flush)
    run.flush = null
  }

  #armOrphan(run: Run, ms: number): void {
    this.#clearOrphan(run)
    run.orphan = this.#deps.setTimer(() => {
      run.orphan = null
      const paneId = run.view.paneId
      if (this.#followers.get(paneId) || this.#runs.get(paneId) !== run) return
      this.#held.delete(paneId)
      this.#retire(run)
      this.#runs.delete(run.view.paneId)
      this.#queue = this.#queue.filter((id) => id !== run.view.paneId)
      this.#deps.changed()
    }, ms)
  }

  #clearOrphan(run: Run): void {
    if (run.orphan !== null) this.#deps.clearTimer(run.orphan)
    run.orphan = null
  }

  #pump(): void {
    if (this.#working) return
    this.#working = true
    void this.#loop().finally(() => {
      this.#working = false
      // A run that arrived as the loop ended.
      if (this.#nextWork()) this.#pump()
    })
  }

  #nextWork(): { run: Run; index: number } | null {
    for (const paneId of [...this.#queue]) {
      const run = this.#runs.get(paneId)
      const block = run?.view.blocks.find((b) => b.state === 'queued')
      if (run && block) return { run, index: block.index }
      // Nothing left in it: done.
      this.#queue = this.#queue.filter((id) => id !== paneId)
      if (run && run.view.state !== 'stopped') this.#finish(run)
    }
    return null
  }

  async #loop(): Promise<void> {
    for (let work = this.#nextWork(); work; work = this.#nextWork()) {
      await this.#translateBlock(work.run, work.index)
    }
  }

  #finish(run: Run): void {
    this.#setState(run, 'done', null)
    this.#flushNow(run)
  }

  #live(run: Run, signal: AbortSignal): boolean {
    return !signal.aborted && this.#runs.get(run.view.paneId) === run
  }

  async #translateBlock(run: Run, index: number): Promise<void> {
    const controller = new AbortController()
    run.abort = controller
    if (run.view.state !== 'running') this.#setState(run, 'running', null)
    const history = this.#history(run, index)
    this.#patch(run, { index, state: 'running', history: history.length })
    this.#deps.begin()
    try {
      await this.#attempts(run, index, history, controller.signal)
    } catch (error) {
      if (this.#live(run, controller.signal)) this.#failed(run, index, error)
    } finally {
      this.#deps.end()
      if (run.abort === controller) run.abort = null
      // A run replaced or dropped meanwhile has nothing more to send.
      if (this.#runs.get(run.view.paneId) === run) this.#queueFlush(run)
    }
  }

  /** One block, asked again once when the engine ended under it (§8.5). */
  async #attempts(run: Run, index: number, history: Pair[], signal: AbortSignal): Promise<void> {
    for (let attempt = 1; ; attempt++) {
      try {
        await this.#writeBlock(run, index, history, signal)
        return
      } catch (error) {
        const retry =
          attempt === 1 &&
          this.#live(run, signal) &&
          !(error instanceof TooLongError) &&
          !(error instanceof NoStopError) &&
          // The server answered, with an error: asking the same again gets the same answer.
          !(error instanceof ServerAnswerError) &&
          !this.#deps.external()
        if (!retry) throw error
        this.#patch(run, { index, text: '' })
        await this.#deps.settle()
      }
    }
  }

  async #writeBlock(run: Run, index: number, history: Pair[], signal: AbortSignal): Promise<void> {
    // Stopped or replaced while the last attempt settled: never start the engine for it.
    if (!this.#live(run, signal)) return
    const endpoint = await this.#deps.ensure()
    if (!this.#live(run, signal)) return
    const block = run.view.blocks[index]
    if (!block) return
    const tokens = await this.#deps.tokenize(endpoint, block.source, signal)
    const parts = splitParts(block.source, tokens)
    let pairs = history
    let written = 0
    let ms = 0
    let limited = false
    for (const [at, part] of parts.entries()) {
      const partTokens = Math.ceil((tokens * part.length) / block.source.length)
      const out = await this.#writePart(run, index, endpoint, part, partTokens, pairs, signal)
      if (!this.#live(run, signal)) return
      // The source's own space between the parts, when the model left it out.
      const gap = /\s+$/.exec(part)?.[0] ?? ''
      if (at < parts.length - 1 && gap && !/\s$/.test(out.text))
        this.#patch(run, { index, append: gap })
      pairs = [...pairs, { source: part, target: out.text }].slice(-2)
      written += out.completion.tokens
      ms += out.completion.ms
      limited ||= out.completion.stopType === 'limit'
    }
    this.#patch(run, {
      index,
      state: 'done',
      tokens: written,
      ms: Math.round(ms),
      note: limited ? 'Cut at the length limit.' : null,
    })
  }

  /** A part of a block: history is given up, oldest first, until the answer has room. */
  async #writePart(
    run: Run,
    index: number,
    endpoint: Endpoint,
    text: string,
    inputTokens: number,
    history: Pair[],
    signal: AbortSignal,
  ): Promise<{ text: string; completion: Completion }> {
    const want = Math.max(256, inputTokens * 4)
    for (let kept = history.length; kept >= 0; kept--) {
      const prompt = this.#prompt(run, text, history.slice(history.length - kept))
      const room = this.#deps.ctx() - (await this.#deps.tokenize(endpoint, prompt, signal))
      if (room < Math.min(want, Math.max(MIN_ROOM, inputTokens))) continue
      let out = ''
      const completion = await this.#deps.complete(
        endpoint,
        {
          prompt,
          n_predict: Math.min(room, want),
          temperature: 0,
          stop: PFML_STOP,
          cache_prompt: true,
        },
        signal,
        (piece) => {
          if (!this.#live(run, signal)) return
          const shown = restore(piece)
          out += shown
          this.#patch(run, { index, append: shown })
        },
      )
      return { text: out, completion }
    }
    throw new TooLongError(
      'Too long for the context: raise the context length in the engine settings.',
    )
  }

  #prompt(run: Run, text: string, history: Pair[]): string {
    const { srcLang, tgtLang, form } = run.request
    return buildPrompt({
      text,
      target: tgtLang,
      ...(srcLang === 'auto' ? {} : { source: srcLang }),
      ...(form ? { form } : {}),
      history,
    })
  }

  /** The two blocks written before this one, oldest first. */
  #history(run: Run, index: number): Pair[] {
    return run.view.blocks
      .slice(0, index)
      .filter((block) => block.state === 'done' && block.text.trim() !== '')
      .slice(-2)
      .map((block) => ({ source: block.source, target: block.text }))
  }

  /** A block that could not be written: too long goes on to the next; anything else stops the run. */
  #failed(run: Run, index: number, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error)
    if (error instanceof TooLongError) {
      this.#patch(run, { index, state: 'failed', note: message })
      return
    }
    const external = this.#deps.external()
    if (external) this.#deps.unreachable()
    const reason = external
      ? `The server does not answer (${message}).`
      : error instanceof NoStopError
        ? message
        : error instanceof ServerAnswerError
          ? `The engine refused the request: ${message}`
          : `The engine stopped: ${message}`
    const block = run.view.blocks[index]
    this.#patch(run, {
      index,
      state: block && block.text !== '' ? 'failed' : 'none',
      note: message,
    })
    this.stop(run.view.paneId, reason)
  }

  #setState(run: Run, state: RunState, reason: string | null): void {
    run.view.state = state
    run.view.reason = reason
    run.pendingRun = { state, reason }
    this.#queueFlush(run)
  }

  /** Applied to main's copy at once; sent with the next flush. */
  #patch(run: Run, patch: BlockPatch): void {
    const block = run.view.blocks[patch.index]
    if (!block) return
    run.view.blocks[patch.index] = applyBlockPatch(block, patch)
    const before = run.pending.get(patch.index)
    run.pending.set(patch.index, before ? mergePatch(before, patch) : patch)
    this.#queueFlush(run)
  }

  #queueFlush(run: Run): void {
    if (run.flush !== null) return
    run.flush = this.#deps.setTimer(() => {
      run.flush = null
      this.#flushNow(run)
    }, FLUSH_MS)
  }

  #flushNow(run: Run): void {
    if (run.flush !== null) this.#deps.clearTimer(run.flush)
    run.flush = null
    if (run.pending.size === 0 && Object.keys(run.pendingRun).length === 0) return
    if (this.#runs.get(run.view.paneId) !== run) return
    const paneId = run.view.paneId
    const seq = (this.#seq.get(paneId) ?? 0) + 1
    this.#seq.set(paneId, seq)
    this.#deps.publish({
      paneId,
      seq,
      kind: 'patch',
      version: run.view.version,
      blocks: [...run.pending.values()],
      ...run.pendingRun,
    })
    run.pending.clear()
    run.pendingRun = {}
  }
}

/** Two patches of one block as one: a whole text drops what was appended before it. */
export function mergePatch(before: BlockPatch, after: BlockPatch): BlockPatch {
  const append =
    after.text !== undefined ? (after.append ?? '') : (before.append ?? '') + (after.append ?? '')
  const merged: BlockPatch = { ...before, ...after }
  if (after.text === undefined && before.text !== undefined) merged.text = before.text
  if (append) merged.append = append
  else delete merged.append
  return merged
}
