import { splitBlocks, splitParts } from '@shared/translate/blocks'
import { chrF } from '@shared/translate/chrf'
import { detectLanguage } from '@shared/translate/detect'
import { formOf } from '@shared/translate/form'
import { type Glossary, glossaryApplies, selectTerms, type Term } from '@shared/translate/glossary'
import { EASY_JAPANESE, takesForm } from '@shared/translate/languages'
import { buildPrompt, formFor, PFML_STOP, restore } from '@shared/translate/pfml3'
import {
  applyBlockPatch,
  type BlockPatch,
  type BlockView,
  mergeTripPatch,
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
/** A LIVE translation is recorded once its draft has not changed for this long (§7). */
export const LIVE_RECORD_MS = 5000
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
  /** A glossary by id, or null. */
  glossary(id: string): Glossary | null
  /** A run came to its end (done, or stopped with something written): for the history (§7). */
  record(view: RunView, request: RunRequest): void
  /** A patch or a new run, for every page that follows the pane. */
  publish(event: RunEvent): void
}

/** The block cannot be put in the context even alone: said on the block, the run goes on. */
class TooLongError extends Error {}

interface Run {
  view: RunView
  request: RunRequest
  /** The glossary's terms when it is used for this target, else none. */
  terms: readonly Term[]
  abort: AbortController | null
  orphan: unknown
  /** Told to the history already: once a run, however its round trips go on. */
  recorded: boolean
  /** A finished LIVE run waits this long to be recorded. */
  liveRecord: unknown
  /** The language its round trips go back into (§6.4). */
  tripLang: string | null
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
    const busy = this.#queue.some((id) => id !== request.paneId)
    const glossary = request.glossaryId ? this.#deps.glossary(request.glossaryId) : null
    const run = newRun(request, ++this.#version, busy, glossary)
    const version = run.view.version
    if (request.mode === 'live' && old) inherit(run, old)
    const work = run.view.blocks.some((block) => block.state === 'queued')
    if (!work) run.view.state = 'done'
    this.#runs.set(request.paneId, run)
    if (work && !this.#queue.includes(request.paneId)) this.#queue.push(request.paneId)
    if (!work) this.#queue = this.#queue.filter((id) => id !== request.paneId)
    this.#deps.publish(this.#snapshotEvent(request.paneId, true))
    // Asked, and nobody follows it (closed in between): it must not run on unread.
    if (!this.#followers.get(request.paneId)) {
      this.#armOrphan(run, this.#held.has(request.paneId) ? RELOAD_HOLD_MS + ORPHAN_MS : ORPHAN_MS)
    }
    if (!work) this.#ended(run)
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
      // Round trips not yet back go: a translation stopped is not compared.
      if (block.trip && block.trip.state !== 'done')
        this.#patch(run, { index: block.index, trip: null })
    }
    this.#setState(run, 'stopped', reason)
    this.#queue = this.#queue.filter((id) => id !== paneId)
    this.#flushNow(run)
    // A LIVE run stopped part way is not recorded (§7): what was typed is still changing.
    if (run.view.mode === 'translate') this.#recorded(run)
  }

  /**
   * CLEAR (§3): the pane's run is put away - stopped if it writes, never recorded - and every page
   * following it is told to show none.
   */
  discard(paneId: string): void {
    const run = this.#runs.get(paneId)
    if (!run) return
    this.#retire(run)
    this.#runs.delete(paneId)
    this.#queue = this.#queue.filter((id) => id !== paneId)
    const seq = (this.#seq.get(paneId) ?? 0) + 1
    this.#seq.set(paneId, seq)
    this.#deps.publish({ paneId, seq, kind: 'snapshot', run: null, cleared: true })
  }

  /** The pane went out of sight while LIVE was writing: it stops, as STOP does (§8.5). */
  cancelLive(paneId: string): void {
    if (this.#runs.get(paneId)?.view.mode === 'live')
      this.stop(paneId, 'Stopped: the pane was hidden.')
  }

  /**
   * EDIT (§6.1): a block's translation changed by hand. Blocks written after it take it as their
   * history; the ones already written stay. Its round trip, now of another text, goes.
   */
  editBlock(paneId: string, index: number, text: string): void {
    const run = this.#runs.get(paneId)
    const block = run?.view.blocks[index]
    if (!run || !block || block.state === 'running' || block.state === 'queued') return
    this.#dropTrip(run, block)
    this.#patch(run, { index, text, edited: true, state: 'done', note: null, trip: null })
    // A run already in the history is written there again, mended (§7): TRANSLATE at once, LIVE
    // once its draft has rested again.
    if (run.view.state === 'done' && run.recorded) {
      run.recorded = false
      this.#ended(run)
    }
  }

  /** A round trip being written of a block about to change is called off: its text is the old one's. */
  #dropTrip(run: Run, block: BlockView): void {
    if (block.trip?.state === 'running') run.abort?.abort()
  }

  /** RETRY (§6.1): one block written again, in its place, with the blocks before it as history. */
  retry(paneId: string, index: number): void {
    const run = this.#runs.get(paneId)
    const block = run?.view.blocks[index]
    if (!run || !block || block.state === 'running' || block.state === 'queued') return
    this.#dropTrip(run, block)
    this.#patch(run, { index, text: '', state: 'queued', note: null, edited: false, trip: null })
    // Written again, it is recorded again when it is done (§7: the entry is rewritten).
    run.recorded = false
    this.#resume(run)
    if (!this.#queue.includes(paneId)) this.#queue.push(paneId)
    this.#pump()
  }

  /**
   * ROUND TRIP (§6.4): every block written is put back into `lang` and compared with its source,
   * one at a time in the same queue, with no history and no glossary.
   */
  roundTrip(paneId: string, lang: string): void {
    const run = this.#runs.get(paneId)
    // A translation stopped is not compared (§6.4): its trips would run on with no STOP to reach.
    if (!run || run.view.state === 'stopped') return
    if (run.tripLang !== null && run.tripLang !== lang) {
      // Into another language: the trips there were go, every block is asked again.
      for (const block of run.view.blocks) {
        this.#dropTrip(run, block)
        if (block.trip) this.#patch(run, { index: block.index, trip: null })
      }
    }
    run.tripLang = lang
    let asked = false
    for (const block of run.view.blocks) {
      if (block.state !== 'done' || block.trip?.state === 'done' || block.trip?.state === 'running')
        continue
      this.#patch(run, {
        index: block.index,
        trip: { text: '', state: 'queued', score: null, lang },
      })
      asked = true
    }
    if (!asked) return
    this.#resume(run)
    if (!this.#queue.includes(paneId)) this.#queue.push(paneId)
    this.#pump()
  }

  /**
   * A finished translation put on a pane, from the history (HISTORY opens it): a run that is done,
   * followed and dropped as any other, and not recorded again.
   */
  show(
    paneId: string,
    view: Omit<RunView, 'paneId' | 'version' | 'state' | 'reason' | 'mode'>,
  ): number {
    const old = this.#runs.get(paneId)
    if (old) this.#retire(old)
    this.#queue = this.#queue.filter((id) => id !== paneId)
    const version = ++this.#version
    const run: Run = {
      terms: [],
      view: {
        ...structuredClone(view),
        paneId,
        version,
        mode: 'translate',
        state: 'done',
        reason: null,
      },
      request: {
        paneId,
        draftId: view.draftId,
        text: view.blocks.map((b) => b.lead + b.source).join('') + view.tail,
        srcLang: view.srcLang,
        tgtLang: view.tgtLang,
        mode: 'translate',
      },
      abort: null,
      orphan: null,
      // From the history: never written there again.
      recorded: true,
      liveRecord: null,
      tripLang: null,
      pending: new Map(),
      pendingRun: {},
      flush: null,
    }
    this.#runs.set(paneId, run)
    this.#deps.publish(this.#snapshotEvent(paneId, true))
    if (!this.#followers.get(paneId)) this.#armOrphan(run, ORPHAN_MS)
    return version
  }

  /** A run given more to do: waiting while another pane's block is written, else running. */
  #resume(run: Run): void {
    const behind = this.#queue.some((id) => id !== run.view.paneId)
    const state = behind ? 'waiting' : 'running'
    if (run.view.state !== state) this.#setState(run, state, null)
  }

  /** The history is told of a run that wrote something (§7): at its end, once. */
  #recorded(run: Run): void {
    if (run.recorded || !run.view.blocks.some((block) => block.state === 'done')) return
    run.recorded = true
    this.#deps.record(structuredClone(run.view), run.request)
  }

  /**
   * A run with nothing left to write: TRANSLATE is recorded now; LIVE once its draft has rested
   * (a newer LIVE run replaces it, and a closed pane drops it, before then: neither is recorded).
   */
  #ended(run: Run): void {
    if (run.view.mode === 'translate') {
      this.#recorded(run)
      return
    }
    if (run.recorded || run.liveRecord !== null) return
    run.liveRecord = this.#deps.setTimer(() => {
      run.liveRecord = null
      const paneId = run.view.paneId
      // Round trips or a RETRY at work: recorded when they end (#finish comes back here), never
      // half done. A pane closed meanwhile (nobody follows, no reload holds it) is not recorded,
      // though its run waits a little longer to be dropped (§7).
      const shown = (this.#followers.get(paneId) ?? 0) > 0 || this.#held.has(paneId)
      if (this.#runs.get(paneId) === run && run.view.state === 'done' && shown) this.#recorded(run)
    }, LIVE_RECORD_MS)
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
    if (run.liveRecord !== null) this.#deps.clearTimer(run.liveRecord)
    run.liveRecord = null
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

  #nextWork(): { run: Run; index: number; trip: boolean } | null {
    for (const paneId of [...this.#queue]) {
      const run = this.#runs.get(paneId)
      const block = run?.view.blocks.find((b) => b.state === 'queued')
      if (run && block) return { run, index: block.index, trip: false }
      // Its round trips, once every block is written.
      const back = run?.view.blocks.find((b) => b.trip?.state === 'queued')
      if (run && back) return { run, index: back.index, trip: true }
      // Nothing left in it: done.
      this.#queue = this.#queue.filter((id) => id !== paneId)
      if (run && run.view.state !== 'stopped') this.#finish(run)
    }
    return null
  }

  async #loop(): Promise<void> {
    for (let work = this.#nextWork(); work; work = this.#nextWork()) {
      if (work.trip) await this.#translateTrip(work.run, work.index)
      else await this.#translateBlock(work.run, work.index)
    }
  }

  #finish(run: Run): void {
    this.#setState(run, 'done', null)
    this.#flushNow(run)
    this.#ended(run)
  }

  /** One block's round trip: back into the source language, scored against the source (§6.4). */
  async #translateTrip(run: Run, index: number): Promise<void> {
    const controller = new AbortController()
    run.abort = controller
    const signal = controller.signal
    this.#patch(run, { index, trip: { state: 'running' } })
    this.#deps.begin()
    try {
      const block = run.view.blocks[index]
      const lang = run.tripLang
      if (!block || !lang) return
      const endpoint = await this.#deps.ensure()
      if (!this.#live(run, signal)) return
      const from = run.view.tgtLang === EASY_JAPANESE ? 'ja' : run.view.tgtLang
      const prompt = buildPrompt({
        text: block.text,
        target: lang,
        source: from,
        // Back into Japanese in the source's own form: put back into です・ます, a plain source
        // scores half what it would (form.ts).
        ...(takesForm(lang) ? { form: formOf(block.source) } : {}),
      })
      const room = this.#deps.ctx() - (await this.#deps.tokenize(endpoint, prompt, signal))
      // As a block's own translation: up to four times what goes in, never past the context.
      const want = Math.max(256, (await this.#deps.tokenize(endpoint, block.text, signal)) * 4)
      if (room < Math.min(want, MIN_ROOM)) throw new TooLongError('no room for the round trip')
      let back = ''
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
          back += shown
          this.#patch(run, { index, trip: { append: shown } })
        },
      )
      if (!this.#live(run, signal)) return
      // Cut at the limit, it would score low for no fault of the translation: said as failed.
      if (completion.stopType === 'limit') throw new TooLongError('round trip cut at the limit')
      this.#patch(run, {
        index,
        trip: { state: 'done', score: Math.round(chrF(block.source, back)) },
      })
    } catch {
      if (this.#live(run, signal)) this.#patch(run, { index, trip: { state: 'failed' } })
    } finally {
      this.#deps.end()
      if (run.abort === controller) run.abort = null
      if (this.#runs.get(run.view.paneId) === run) this.#queueFlush(run)
    }
  }

  #live(run: Run, signal: AbortSignal): boolean {
    return !signal.aborted && this.#runs.get(run.view.paneId) === run
  }

  async #translateBlock(run: Run, index: number): Promise<void> {
    const controller = new AbortController()
    run.abort = controller
    if (run.view.state !== 'running') this.#setState(run, 'running', null)
    const history = this.#history(run, index)
    const terms = selectTerms(run.terms, run.view.blocks[index]?.source ?? '').length
    this.#patch(run, { index, state: 'running', history: history.length, terms })
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
    const { srcLang, tgtLang, form, context } = run.request
    return buildPrompt({
      text,
      target: tgtLang,
      ...(srcLang === 'auto' ? {} : { source: srcLang }),
      ...(form ? { form } : {}),
      ...(context?.trim() ? { context } : {}),
      // The terms this part holds (§6.3): a long block's parts each take their own.
      glossary: selectTerms(run.terms, text),
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
  if (after.trip !== undefined) merged.trip = mergeTripPatch(before.trip, after.trip)
  else if (before.trip !== undefined) merged.trip = before.trip
  return merged
}

/** A run as asked: every block waiting, the glossary's terms when it is for this target. */
function newRun(
  request: RunRequest,
  version: number,
  busy: boolean,
  glossary: Glossary | null,
): Run {
  const { blocks, tail } = splitBlocks(request.text)
  const used = glossary !== null && glossaryApplies(glossary.targetLang, request.tgtLang)
  return {
    terms: used && glossary ? glossary.terms : [],
    view: {
      paneId: request.paneId,
      draftId: request.draftId,
      version,
      srcLang: request.srcLang,
      tgtLang: request.tgtLang,
      mode: request.mode,
      form: formFor(request.tgtLang, request.form) ?? null,
      state: busy ? 'waiting' : 'running',
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
        terms: 0,
        edited: false,
        trip: null,
      })),
      tail,
      detected: request.srcLang === 'auto' ? detectLanguage(request.text) : null,
      context: request.context ?? '',
      glossary: glossary ? { name: glossary.name, used } : null,
    },
    request,
    abort: null,
    orphan: null,
    recorded: false,
    liveRecord: null,
    tripLang: null,
    pending: new Map(),
    pendingRun: {},
    flush: null,
  }
}

/**
 * A LIVE run takes from the one it replaces every block written from the same source in the same
 * languages, form, context and glossary (§6.1): only what changed is written again. History is
 * not part of that: a block mended by hand would otherwise send every block after it again.
 */
function inherit(run: Run, old: Run): void {
  const a = run.request
  const b = old.request
  const same =
    a.srcLang === b.srcLang &&
    a.tgtLang === b.tgtLang &&
    a.form === b.form &&
    (a.context ?? '') === (b.context ?? '') &&
    (a.glossaryId ?? null) === (b.glossaryId ?? null)
  if (!same) return
  run.tripLang = old.tripLang
  const written = new Map<string, BlockView>()
  for (const block of old.view.blocks) if (block.state === 'done') written.set(block.source, block)
  // The terms the block would take, compared: a glossary edited since sends it again.
  const termsOf = (terms: readonly Term[], source: string) =>
    JSON.stringify(selectTerms(terms, source))
  run.view.blocks = run.view.blocks.map((block) => {
    const found = written.get(block.source)
    if (!found || termsOf(run.terms, block.source) !== termsOf(old.terms, block.source))
      return block
    // A round trip back already is the same block's: kept, not asked again at every pause.
    return {
      ...found,
      index: block.index,
      lead: block.lead,
      trip: found.trip?.state === 'done' ? found.trip : null,
    }
  })
}
