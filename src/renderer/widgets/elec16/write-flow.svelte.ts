import type { Elec16Api } from '@shared/api'
import { sourceToMachine } from '@shared/elec16/charset'
import { SAMPLE } from '@shared/elec16/code-area'
import { extractCode, machineText, streamingCode } from '@shared/elec16/write-code'
import {
  changedLineCount,
  charsetError,
  judge,
  MAX_FIXES,
  needsConfirm,
  sameSource,
  type WriteError,
  type WritePhase,
} from '@shared/elec16/write-flow'
import { WRITE_LIMITS } from '@shared/elec16/write-prompt'
import type { Elec16WritePiece, Elec16WriteResult } from '@shared/elec16-write'
import type { LevelResult } from './code/protocol.ts'

/**
 * CODE's WRITE in the page (docs/elec16-write.md sections 2-4): one SEND carried from the
 * person's words to READY or FAILED - the question before code of one's own is replaced, the
 * answer streamed into the editor, built in memory, its errors given back at most twice, and
 * the program written to the card only once it builds. main keeps the conversation and counts
 * the fixes; this keeps what the pane shows, and UNDO.
 *
 * The flow is the ELEC-16 pane's, not CODE's view: the view is unmounted whenever the pane shows
 * the machine (RUN does), so what WRITE wrote, its builds and UNDO live here, and a view
 * attaches to take them. A request belongs to the unit and file it was sent for: either
 * changing stops it, and an answer for a request no longer the pane's is not taken.
 */

export type WriteState = WritePhase

/** What the flow needs of CODE's view while it is mounted. */
export interface WriteView {
  /** The editor's text now. */
  source(): string
  /** The editor's text replaced; `kept` when it is what the card now holds. */
  replaced(text: string, kept: boolean): void
  /** The card now holds `text`; the editor, changed by a person meanwhile, keeps theirs. */
  onCard(text: string): void
  /** A build to show (levels, assembly). */
  built(levels: LevelResult[]): void
  /** A SEND began: the last build shown is not of what comes now. */
  began(): void
}

export interface WriteFlowDeps {
  api: Pick<Elec16Api, 'write' | 'writeFix' | 'writeStop' | 'onWriteText' | 'writeFile'>
  pane: string
  /** Every level's build of a source, in memory (CODE's compiler). */
  compile(file: string, source: string): Promise<LevelResult[]>
  /** Holds the compiler while a SEND is under way; the release is returned. */
  hold(): () => void
  level(): 0 | 1 | 2
  setLevel(level: 0 | 1 | 2): void
  /** The provider and model chosen, or none to ask. */
  choice(): { provider: string; model: string; name: string } | null
  now(): number
  /** A SEND heard ending while the pane is seen. */
  sound?(done: boolean): void
}

const BUSY: ReadonlySet<WriteState> = new Set(['thinking', 'writing', 'compiling', 'fixing'])

/** The card's error for an answer with no program in it. */
const NO_CODE = 'the answer had no ```ts block with the program'

export class WriteFlow {
  state = $state<WriteState>('idle')
  /** The words in the composer: kept through a CANCEL or a failure, cleared once ready. */
  words = $state('')
  /** What the editor shows while a SEND is under way (the code as it comes, or the last whole answer). */
  live = $state<string | null>(null)
  /** Lines of `live` e16c refused, while a fix is asked for. */
  marks = $state<number[]>([])
  errors = $state.raw<WriteError[]>([])
  /** The provider's words when it failed, or why a SEND ended as it did. */
  note = $state('')
  /** Fixes asked for in this SEND. */
  fixes = $state(0)
  /** Lines the last answer changed against what the editor had. */
  changed = $state(0)
  /** Whether the SEND changed a program (the editor held one), not wrote one afresh over the sample. */
  changedOwn = $state(false)
  /** The level READY moved to, when the chosen one was only too big. */
  switched = $state<0 | 1 | 2 | null>(null)
  /** Bytes of answer come so far, and tokens once the provider says. */
  bytes = $state(0)
  tokens = $state<number | null>(null)
  startedAt = $state<number | null>(null)
  /** Whole seconds the last SEND took, for the steps' line once it has ended. */
  took = $state(0)
  /** The SEND's words, for READY's line. */
  sentWords = $state('')
  /** The size of the program READY built, and the level it built at. */
  size = $state(0)
  level = $state<0 | 1 | 2>(2)
  /** UNDO: the editor's text before WRITE, and whether it is back. */
  undone = $state(false)
  canUndo = $state(false)
  /**
   * Whether the editor holds what a STOP or FAILED left, on no card: CODE going parks it here
   * rather than writing it over the person's own program (a pane moved or closed then keeps that).
   */
  holdsUnkept = $state(false)
  /** Whether the composer's text is the provider's model's to change (a WRITE wrote the editor). */
  lastWritten = $state<string | null>(null)

  readonly #deps: WriteFlowDeps
  #serial = 0
  /** Counts what changes the editor (a SEND, UNDO, another file): a card write answering late checks it. */
  #edits = 0
  #round = 0
  #stream = ''
  #unit: string | null = null
  #file = ''
  #view: WriteView | null = null
  #release: (() => void) | null = null
  #unlisten: (() => void) | null
  #before = ''
  #after = ''
  /** Text the flow left in the editor unkept while no view was there, for the view to take. */
  #pending: { unit: string; file: string; text: string } | null = null
  #results: { unit: string; file: string; levels: LevelResult[] } | null = null

  constructor(deps: WriteFlowDeps) {
    this.#deps = deps
    this.#unlisten = deps.api.onWriteText((piece) => this.#heard(piece))
  }

  get busy(): boolean {
    return BUSY.has(this.state)
  }

  /** The unit and file CODE edits; a change stops a SEND under way and forgets UNDO. */
  target(unit: string | null, file: string): void {
    if (unit === this.#unit && file === this.#file) return
    if (this.busy) {
      this.#serial++
      this.#deps.api.writeStop(this.#deps.pane)
      this.#settle()
    }
    this.#unit = unit
    this.#file = file
    this.#edits++
    this.#pending = null
    this.holdsUnkept = false
    this.canUndo = false
    this.undone = false
    this.lastWritten = null
    this.errors = []
    this.note = ''
    this.state = 'idle'
  }

  /** A view mounted: it takes what is left for it (`takePending`) as it reads its file. */
  attach(view: WriteView): void {
    this.#view = view
  }

  detach(view: WriteView): void {
    if (this.#view === view) this.#view = null
  }

  /** The builds READY or FAILED left, for a view mounted again on the same unit and file. */
  resultsFor(unit: string | null, file: string): LevelResult[] | null {
    const r = this.#results
    return r !== null && r.unit === unit && r.file === file ? r.levels : null
  }

  /** Text left unkept for this unit and file while no view was there, given to the view once. */
  takePending(unit: string | null, file: string): string | null {
    const p = this.#pending
    if (p === null || p.unit !== unit || p.file !== file) return null
    this.#pending = null
    return p.text
  }

  /**
   * CODE going (to the machine, a move, a close): unfinished text is kept here for the next view
   * rather than written to the card. False: nothing of WRITE's is unkept, CODE keeps as usual.
   */
  park(unit: string | null, file: string, text: string): boolean {
    if (!this.holdsUnkept || unit === null || unit !== this.#unit || file !== this.#file)
      return false
    this.#pending = { unit, file, text }
    return true
  }

  /** The person kept the editor on the card (COMPILE): what WRITE left is theirs now. */
  kept(): void {
    this.holdsUnkept = false
  }

  /** SEND: at once over the sample, a blank editor or WRITE's own text; else the question first. */
  send(): void {
    if (this.busy || this.state === 'confirm') return
    if (this.words.trim() === '' || this.#unit === null || this.#view === null) return
    if (this.#deps.choice() === null) return
    if (this.#view.source().length > WRITE_LIMITS.code) {
      this.#clearShown()
      this.note = `The program in ${this.#file} is too long to send (over ${WRITE_LIMITS.code.toLocaleString('en-US')} characters).`
      this.state = 'failed'
      return
    }
    if (needsConfirm(this.#view.source(), this.lastWritten)) {
      this.state = 'confirm'
      return
    }
    void this.#run()
  }

  replace(): void {
    if (this.state === 'confirm') void this.#run()
  }

  cancel(): void {
    if (this.state === 'confirm') this.state = 'idle'
  }

  /** STOP: main stops, and what has come stays in the editor, not compiled and not on the card. */
  stop(): void {
    if (!this.busy) return
    this.#serial++
    this.#deps.api.writeStop(this.#deps.pane)
    const kept = this.#keepShown()
    this.note = kept
      ? 'What had come is in the editor, not compiled.'
      : 'Stopped before any code came.'
    this.state = 'stopped'
    this.#deps.sound?.(false)
  }

  /**
   * A SEND ended short (STOP, a failure): what the editor showed - the code coming in, or the last
   * whole answer - stays there unkept, with UNDO to put the code from before back. False: none.
   */
  #keepShown(): boolean {
    // As an answer's code is: typographic marks made the machine's.
    const shown = this.live === null ? null : machineText(this.live)
    this.#settle()
    if (shown === null || shown === '') return false
    this.#after = shown
    this.canUndo = shown !== this.#before
    this.lastWritten = null
    this.#leave(shown)
    this.holdsUnkept = true
    return true
  }

  /** UNDO and back: the editor's text before WRITE and WRITE's, swapped, onto the card. */
  undo(): void {
    if (!this.canUndo || this.busy || this.#unit === null) return
    // A real swap: what the editor holds now - a hand edit after READY too - is what comes back.
    const now = this.#view?.source()
    if (now !== undefined) {
      if (this.undone) this.#before = now
      else this.#after = now
    }
    const to = this.undone ? this.#after : this.#before
    this.undone = !this.undone
    this.#edits++
    this.note = ''
    // The build shown was of the other text.
    this.#results = null
    this.#view?.began()
    // Back to what a READY wrote, a change asks no question; a STOP's or FAILED's code is unfinished.
    const finished = this.undone || this.state === 'ready'
    this.lastWritten = !this.undone && finished ? this.#after : null
    this.#leave(to)
    if (finished) {
      void this.#keep(this.#unit, this.#file, to)
      return
    }
    // REDO of what a STOP or FAILED left: back in the editor only, never over the card's program.
    this.holdsUnkept = true
  }

  dispose(): void {
    if (this.busy) this.#deps.api.writeStop(this.#deps.pane)
    this.#serial++
    this.#settle()
    this.#unlisten?.()
    this.#unlisten = null
  }

  async #run(): Promise<void> {
    const choice = this.#deps.choice()
    const view = this.#view
    const unit = this.#unit
    if (choice === null || view === null || unit === null) return
    const file = this.#file
    const serial = this.#begin(view.source())
    view.began()
    const mine = () => serial === this.#serial
    try {
      let result = await this.#deps.api.write(this.#deps.pane, {
        serial,
        provider: choice.provider,
        model: choice.model,
        words: this.sentWords,
        code: this.#before,
        file,
      })
      for (;;) {
        if (!mine()) return
        if (!result.ok) return this.#failedBy(result)
        if (result.usage !== undefined) {
          this.tokens = (this.tokens ?? 0) + result.usage.input + result.usage.output
        }
        const outcome = await this.#judge(file, result.text)
        if (!mine()) return
        if (outcome.ok) return this.#ready(unit, file, outcome.code, outcome.levels, outcome.level)
        if (outcome.broken !== undefined)
          return this.#failed(outcome.code, [], null, outcome.broken)
        if (this.fixes >= MAX_FIXES) {
          return this.#failed(outcome.code, outcome.errors, outcome.levels)
        }
        this.#askFix(file, outcome.code, outcome.errors)
        result = await this.#deps.api.writeFix(this.#deps.pane, {
          serial,
          errors: forMain(outcome.errors),
        })
      }
    } catch (error) {
      // main could not be asked at all: the SEND ends, never left under way for ever.
      if (mine()) {
        this.#failedBy({ ok: false, serial, stop: 'failed', note: (error as Error).message })
      }
    }
  }

  /** What the last SEND showed - its steps, size, errors - cleared. */
  #clearShown(): void {
    this.marks = []
    this.errors = []
    this.note = ''
    this.fixes = 0
    this.changed = 0
    this.switched = null
    this.bytes = 0
    this.tokens = null
    this.took = 0
  }

  /** A SEND begun: what the pane shows reset, the compiler held; its serial. */
  #begin(before: string): number {
    this.#before = before
    this.#edits++
    this.sentWords = this.words.trim()
    this.#round = 0
    this.#stream = ''
    this.live = ''
    this.#clearShown()
    this.startedAt = this.#deps.now()
    this.undone = false
    // UNDO was the last SEND's: this one offers its own, once it has something.
    this.canUndo = false
    // The last SEND's build is not of what comes now, here or in a view mounted again.
    this.#results = null
    this.holdsUnkept = false
    this.state = 'thinking'
    this.#release ??= this.#deps.hold()
    return ++this.#serial
  }

  /** A fix asked for: the last whole answer shown with the lines e16c refused marked. */
  #askFix(file: string, code: string, errors: WriteError[]): void {
    this.fixes++
    this.#round = this.fixes
    this.#stream = ''
    this.live = code
    this.errors = errors
    this.marks = errors.filter((e) => e.file === file && e.line > 0).map((e) => e.line)
    this.state = 'fixing'
  }

  /** An answer's program built and judged: ready at a level, or the errors to give back. */
  async #judge(
    file: string,
    text: string,
  ): Promise<
    | { ok: true; code: string; levels: LevelResult[]; level: 0 | 1 | 2 }
    | {
        ok: false
        code: string
        errors: WriteError[]
        levels: LevelResult[] | null
        /** Why the SEND ends without asking the model (the compiler failed). */
        broken?: string
      }
  > {
    const found = extractCode(text)
    const shown = this.live ?? ''
    if (found === null) {
      return {
        ok: false,
        code: shown,
        errors: [{ file, line: 0, column: 0, message: NO_CODE }],
        levels: null,
      }
    }
    const code = machineText(found)
    const made = sourceToMachine(code)
    if ('problem' in made)
      return { ok: false, code, errors: [charsetError(file, made.problem)], levels: null }
    this.live = code
    // The lines marked were the last answer's: this one is judged afresh.
    this.marks = []
    this.state = 'compiling'
    let levels: LevelResult[]
    try {
      levels = await this.#deps.compile(file, code)
    } catch (error) {
      // Not the model's to fix: the SEND ends here.
      return {
        ok: false,
        code,
        errors: [],
        levels: null,
        broken: `the compiler could not run: ${(error as Error).message}`,
      }
    }
    const verdict = judge(levels, this.#deps.level(), file)
    if (verdict.ok) return { ok: true, code, levels, level: verdict.level }
    const errors =
      verdict.errors.length > 0
        ? verdict.errors
        : [{ file, line: 0, column: 0, message: 'the program did not build' }]
    return { ok: false, code, errors, levels }
  }

  #ready(unit: string, file: string, code: string, levels: LevelResult[], level: 0 | 1 | 2): void {
    this.#deps.api.writeStop(this.#deps.pane)
    if (level !== this.#deps.level()) {
      this.switched = level
      this.#deps.setLevel(level)
    }
    this.changedOwn = !(this.#before.trim() === '' || sameSource(this.#before, SAMPLE))
    this.changed = this.changedOwn ? changedLineCount(this.#before, code) : code.split('\n').length
    this.size = levels.find((l) => l.level === level)?.image.length ?? 0
    this.level = level
    this.#after = code
    this.lastWritten = code
    this.canUndo = true
    this.words = ''
    this.#results = { unit, file, levels }
    // What an earlier STOP left for this file is behind what is written now.
    this.#pending = null
    this.#settle()
    // In the editor at once, onto the card after: the program is never only on its way.
    this.#leave(code)
    this.#view?.built(levels)
    this.state = 'ready'
    this.#deps.sound?.(true)
    const edits = this.#edits
    void this.#keep(unit, file, code).then((kept) => {
      if (kept || edits !== this.#edits) return
      // The card would not take it: it stays in the editor, unkept - parked if CODE goes - and
      // that is said.
      this.lastWritten = null
      this.holdsUnkept = true
      this.state = 'failed'
    })
  }

  #failed(code: string, errors: WriteError[], levels: LevelResult[] | null, why?: string): void {
    this.#deps.api.writeStop(this.#deps.pane)
    this.errors = errors
    this.#after = code
    this.canUndo = code !== '' && code !== this.#before
    this.lastWritten = null
    this.#settle()
    if (code !== '') {
      this.#leave(code)
      this.holdsUnkept = true
    }
    if (levels !== null && this.#unit !== null) {
      this.#results = { unit: this.#unit, file: this.#file, levels }
      this.#view?.built(levels)
    }
    this.note =
      why ??
      `Still ${errors.length} error${errors.length === 1 ? '' : 's'} after ${MAX_FIXES} fixes. Fix ${errors.length === 1 ? 'it' : 'them'} by hand, or send again.`
    this.state = 'failed'
    this.#deps.sound?.(false)
  }

  #failedBy(result: Extract<Elec16WriteResult, { ok: false }>): void {
    this.#keepShown()
    this.note = result.note
    this.state = result.stop === 'stopped' ? 'stopped' : 'failed'
    this.#deps.sound?.(false)
  }

  /**
   * The editor's text onto the card, and marked as what the card holds; false when it would not
   * go. Its answer acts only while nothing has come since (`#edits`): a write answering after an
   * UNDO, another SEND or another file neither puts its text back nor speaks over what is shown.
   */
  async #keep(unit: string, file: string, text: string): Promise<boolean> {
    const asked = this.#edits
    const made = sourceToMachine(text)
    const status = 'problem' in made ? -1 : await this.#deps.api.writeFile(unit, file, made.bytes)
    if (asked !== this.#edits) return status === 0
    if (status !== 0) {
      this.note = `${file} could not be written to the card.`
      return false
    }
    // Typed into since the write began: the person's text stays, only the card's is noted.
    if (this.#view?.source() === text) this.#view.replaced(text, true)
    else this.#view?.onCard(text)
    this.holdsUnkept = false
    return true
  }

  /** Text left in the editor unkept: the view's now, or the next view's on this file. */
  #leave(text: string): void {
    if (this.#view !== null) this.#view.replaced(text, false)
    else if (this.#unit !== null) this.#pending = { unit: this.#unit, file: this.#file, text }
  }

  /** A SEND over: the compiler let go, nothing more shown as coming. */
  #settle(): void {
    this.#release?.()
    this.#release = null
    this.live = null
    this.marks = []
    if (this.startedAt !== null) {
      this.took = Math.max(0, Math.floor((this.#deps.now() - this.startedAt) / 1000))
    }
    this.startedAt = null
  }

  #heard(piece: Elec16WritePiece): void {
    if (
      piece.pane !== this.#deps.pane ||
      piece.serial !== this.#serial ||
      piece.round !== this.#round
    )
      return
    if (!this.busy) return
    this.#stream += piece.text
    this.bytes = this.#stream.length
    // A fix shows the last whole answer until its own has all come.
    if (this.#round > 0) return
    const code = streamingCode(this.#stream)
    if (code !== this.live) this.live = code
    if (this.state === 'thinking' && this.#stream !== '') this.state = 'writing'
  }
}

/** Errors as main takes them for a fix: twenty at most, each cut to what a fix carries. */
function forMain(errors: readonly WriteError[]): WriteError[] {
  return errors.slice(0, WRITE_LIMITS.errors).map((e) => ({
    ...e,
    file: e.file.slice(0, 12),
    message: e.message.slice(0, WRITE_LIMITS.error),
  }))
}
