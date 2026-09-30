import { ATTACH_LIMITS, type ChatAttachment } from '@shared/ai'
import type { AttachCode, AttachmentView } from '@shared/ai-attach'
import { pastedName, prepare } from './attach.ts'

/** A file still being read or made small, shown as a chip until main has it. */
export interface Reading {
  key: number
  name: string
}

export interface AttachProblem {
  code: AttachCode
  detail: string
}

/**
 * The files gathered for a pane's next question (shared/ai-attach.ts).
 *
 * They wait in main, under a draft id the pane keeps in its state: a moved pane, which remounts,
 * finds them there again, and a restart - which main does not remember drafts across - leaves
 * an id that names nothing. This holds only what the pane shows of them: the files, the ones an
 * edited question keeps of its own, and those still being read.
 */
export class ChatDraft {
  files = $state.raw<AttachmentView[]>([])
  /** An earlier question being rewritten: the files of its own that it keeps. */
  kept = $state.raw<ChatAttachment[]>([])
  reading = $state.raw<Reading[]>([])
  problem = $state.raw<AttachProblem | null>(null)

  #id: string | null = null
  readonly #mint: () => string
  #keys = 0
  /** Counts the clears, so a file that arrives after one is let go instead of shown. */
  #generation = 0

  /** `mint` makes a new draft id and keeps it in the pane's state. */
  constructor(mint: () => string) {
    this.#mint = mint
  }

  get id(): string | null {
    return this.#id
  }

  /** How many files the question carries, counting those still being read. */
  get count(): number {
    return this.files.length + this.kept.length + this.reading.length
  }

  /** Everything the question carries that main already has. */
  get all(): ChatAttachment[] {
    return [...this.kept, ...this.files]
  }

  /** Follows the pane's draft id: on mount, and whenever it changes. */
  async use(id: string | null): Promise<void> {
    if (id === this.#id) return
    this.#id = id
    this.#generation += 1
    const generation = this.#generation
    const files = id === null ? [] : await window.elecdex.ai.pending(id)
    if (generation === this.#generation) this.files = files
  }

  /** Reads the files in turn and hands each to main; what cannot go is said, and the rest go on. */
  async add(list: readonly File[], pasted = false): Promise<void> {
    this.problem = null
    const room = Math.max(0, ATTACH_LIMITS.perMessage - this.count)
    const taken = list.slice(0, room)
    if (taken.length < list.length) {
      this.problem = {
        code: 'payload full',
        detail: `a question takes up to ${ATTACH_LIMITS.perMessage} files - ${list.length - taken.length} left out`,
      }
    }
    const now = new Date()
    const queued = taken.map((file) => ({
      file,
      reading: { key: ++this.#keys, name: pasted ? pastedName(file, now) : file.name },
    }))
    this.reading = [...this.reading, ...queued.map((entry) => entry.reading)]
    const generation = this.#generation
    for (const { file, reading } of queued) {
      try {
        if (generation !== this.#generation) break
        await this.#one(file, reading.name, generation)
      } finally {
        this.reading = this.reading.filter((entry) => entry.key !== reading.key)
      }
    }
  }

  async #one(file: File, name: string, generation: number): Promise<void> {
    const upload = await prepare(file, name)
    if ('ok' in upload) {
      this.problem = { code: upload.code, detail: `${name}: ${upload.detail}` }
      return
    }
    if (generation !== this.#generation) return
    this.#id ??= this.#mint()
    const draftId = this.#id
    const result = await window.elecdex.ai.attach(draftId, upload)
    if (!result.ok) {
      this.problem = { code: result.code, detail: `${name}: ${result.detail}` }
      return
    }
    // Emptied while this one was on its way: it is not wanted any more.
    if (generation !== this.#generation) {
      void window.elecdex.ai.detach(draftId, result.file.id)
      return
    }
    this.files = [...this.files, result.file]
  }

  async remove(id: string): Promise<void> {
    this.problem = null
    if (this.kept.some((file) => file.id === id)) {
      this.kept = this.kept.filter((file) => file.id !== id)
      return
    }
    if (this.#id === null) return
    this.files = await window.elecdex.ai.detach(this.#id, id)
  }

  /**
   * An earlier question is being rewritten: its files join the composer, beside any that were
   * waiting for the next question - those are the user's too, and stay.
   */
  edit(files: readonly ChatAttachment[]): void {
    this.kept = [...files]
    this.problem = null
  }

  /** The rewrite was left as it was: its files go back to it, and what was waiting stays. */
  unedit(): void {
    this.kept = []
  }

  /** Reads again what main holds: after a send it refused, which may be for a file it let go. */
  async refresh(): Promise<void> {
    if (this.#id === null) return
    const generation = this.#generation
    const files = await window.elecdex.ai.pending(this.#id)
    if (generation === this.#generation) this.files = files
  }

  /** The question went: main has let go of the draft, and the pane does the same. */
  sent(): void {
    this.#generation += 1
    this.files = []
    this.kept = []
    this.problem = null
  }
}
