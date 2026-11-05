import { applyPatch, type RunEvent, type RunView } from '@shared/translate/run'

/**
 * A pane's translation as the page sees it (docs/translate.md §8.5): main holds the run, and this
 * follows it - a snapshot first, then the patches main gathers every 100 ms. A patch that does not
 * follow the last one (a missed event, an older version) makes it ask for the run again.
 *
 * The page keeps what it last saw: a run main has dropped (nobody followed it for a while, as when
 * the pane sat finished behind a tab) stays on screen until the next translation.
 */

/**
 * What the pane was typing, and its context, by pane, for as long as the page lives: a moved pane
 * remounts. Never the pane's state, which layouts save (§8.1): the text is the user's.
 */
export interface Draft {
  text: string
  draftId: string
  context: string
}

const drafts = new Map<string, Draft>()

export function draftOf(paneId: string): Draft {
  let draft = drafts.get(paneId)
  if (!draft) {
    draft = { text: '', draftId: newDraftId(), context: '' }
    drafts.set(paneId, draft)
  }
  return draft
}

export function keepDraft(paneId: string, draft: Draft): void {
  drafts.set(paneId, draft)
}

export function newDraftId(): string {
  return crypto.randomUUID().replaceAll('-', '').slice(0, 24)
}

/** Whether a run still has something to write: followed even while unseen. */
export function isActive(run: RunView | null): boolean {
  return run !== null && (run.state === 'running' || run.state === 'waiting')
}

export class RunFollower {
  readonly paneId: string
  run = $state.raw<RunView | null>(null)
  #seq = -1
  #release: (() => void) | null = null

  constructor(paneId: string) {
    this.paneId = paneId
  }

  /** Follows the run until the release is called. */
  follow(): () => void {
    this.#start()
    return () => {
      this.#release?.()
      this.#release = null
    }
  }

  #start(): void {
    this.#release?.()
    this.#seq = -1
    this.#release = window.elecdex.translate.follow(this.paneId, (event) => this.#handle(event))
  }

  #handle(event: RunEvent): void {
    if (event.kind === 'snapshot') {
      this.#seq = event.seq
      this.run = event.run ?? this.#dropped()
      return
    }
    const run = this.run
    // Out of order, or for a run this page has not seen: ask for it whole.
    if (this.#seq < 0 || event.seq !== this.#seq + 1 || run === null) {
      this.#start()
      return
    }
    this.#seq = event.seq
    const next: RunView = { ...run, blocks: [...run.blocks] }
    if (!applyPatch(next, event)) {
      this.#start()
      return
    }
    this.run = next
  }

  /** Main no longer has the run: what was seen stays, and one cut short says so. */
  #dropped(): RunView | null {
    const run = this.run
    if (!isActive(run) || run === null) return run
    return {
      ...run,
      state: 'stopped',
      reason: 'The translation was dropped.',
      blocks: run.blocks.map((block) =>
        block.state === 'running'
          ? { ...block, state: 'stopped' }
          : block.state === 'queued'
            ? { ...block, state: 'none' }
            : block,
      ),
    }
  }
}
