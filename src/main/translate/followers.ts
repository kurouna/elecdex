import type { RunEvent } from '@shared/translate/run'
import type { TranslateRuns } from './runs.js'

/**
 * Which pages follow which pane's run (docs/translate.md §8.5): each follow is one follower in
 * main, counted by page, and dropped with its page. Apart from Electron, so a test reaches it.
 */

export interface RunPage {
  send(channel: string, payload: unknown): void
  isDestroyed(): boolean
}

export class RunFollowers<P extends RunPage> {
  readonly #runs: Pick<TranslateRuns, 'follow' | 'unfollow'>
  readonly #channel: string
  readonly #pages = new Map<P, Map<string, number>>()

  constructor(runs: Pick<TranslateRuns, 'follow' | 'unfollow'>, channel: string) {
    this.#runs = runs
    this.#channel = channel
  }

  /**
   * A page follows a pane: its snapshot first. The page is counted only after it, so a patch the
   * snapshot flushes to the others never reaches it ahead of its snapshot.
   */
  follow(page: P, paneId: string): void {
    const snapshot = this.#runs.follow(paneId)
    const panes = this.#pages.get(page) ?? new Map<string, number>()
    this.#pages.set(page, panes)
    panes.set(paneId, (panes.get(paneId) ?? 0) + 1)
    page.send(this.#channel, snapshot)
  }

  unfollow(page: P, paneId: string): void {
    const panes = this.#pages.get(page)
    const count = panes?.get(paneId) ?? 0
    if (!panes || count === 0) return
    if (count > 1) panes.set(paneId, count - 1)
    else panes.delete(paneId)
    this.#runs.unfollow(paneId)
  }

  /** The page went: closed (counting starts now) or navigated, a reload (held until it loads). */
  gone(page: P): void {
    const panes = this.#pages.get(page)
    this.#pages.delete(page)
    const how = page.isDestroyed() ? 'now' : 'reload'
    for (const [paneId, count] of panes ?? []) {
      for (let i = 0; i < count; i++) this.#runs.unfollow(paneId, how)
    }
  }

  /** A run's event, to every page that follows its pane. */
  publish(event: RunEvent): void {
    for (const [page, panes] of this.#pages) {
      if (panes.has(event.paneId) && !page.isDestroyed()) page.send(this.#channel, event)
    }
  }
}
