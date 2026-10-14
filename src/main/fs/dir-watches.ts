/**
 * The file pane's directory watches: one OS watcher per directory however many panes watch it,
 * changes reported once a `debounceMs` (a `git checkout` touches hundreds). Free of Electron and
 * of node:fs, which arrive in `deps`, so a unit test drives it.
 *
 * A watcher that fails closes itself. Before, that was the end of it: the pane went on showing
 * the folder and followed nothing until it was left and come back to (a rename on Windows, a
 * network path's blip - found in the sweep after git's watch was fixed the same way). Now the
 * pane is told once, so it lists the folder again, and the watch is opened again a moment later
 * while the folder is still watched; a folder that has gone cannot be opened and stays quiet.
 */

export interface DirWatcher {
  close(): void
}

export interface DirWatchDeps {
  /** Starts watching; `onError` when the watcher failed. Throws where it cannot be watched. */
  watch(dir: string, onChange: () => void, onError: () => void): DirWatcher
  notify(dir: string): void
  /** The directories some page watches now. */
  active(): readonly string[]
  setTimer(fn: () => void, ms: number): unknown
  clearTimer(timer: unknown): void
}

export const CHANGE_DEBOUNCE_MS = 200
/** How long after a failure the watch is opened again. */
export const REOPEN_MS = 2000

interface Entry {
  watcher: DirWatcher
  timer: unknown
}

export class DirWatches {
  private readonly deps: DirWatchDeps
  private readonly entries = new Map<string, Entry>()
  private readonly reopening = new Map<string, unknown>()

  constructor(deps: DirWatchDeps) {
    this.deps = deps
  }

  /** Opens what is watched and not open, closes what is open and no longer watched. */
  sync(): void {
    const active = new Set(this.deps.active())
    for (const dir of [...this.entries.keys()]) if (!active.has(dir)) this.close(dir)
    for (const [dir, timer] of this.reopening) {
      if (!active.has(dir)) {
        this.deps.clearTimer(timer)
        this.reopening.delete(dir)
      }
    }
    for (const dir of active) if (!this.entries.has(dir)) this.open(dir)
  }

  open(dir: string): void {
    try {
      const watcher = this.deps.watch(
        dir,
        () => this.changed(dir),
        () => this.failed(dir),
      )
      this.entries.set(dir, { watcher, timer: null })
    } catch {
      // Not watchable (permissions, a network path, gone). Listings still work.
    }
  }

  close(dir: string): void {
    const entry = this.entries.get(dir)
    if (entry === undefined) return
    if (entry.timer !== null) this.deps.clearTimer(entry.timer)
    entry.watcher.close()
    this.entries.delete(dir)
  }

  dispose(): void {
    for (const dir of [...this.entries.keys()]) this.close(dir)
    for (const timer of this.reopening.values()) this.deps.clearTimer(timer)
    this.reopening.clear()
  }

  watching(): string[] {
    return [...this.entries.keys()].sort()
  }

  private changed(dir: string): void {
    const entry = this.entries.get(dir)
    if (entry === undefined || entry.timer !== null) return
    entry.timer = this.deps.setTimer(() => {
      entry.timer = null
      this.deps.notify(dir)
    }, CHANGE_DEBOUNCE_MS)
  }

  private failed(dir: string): void {
    this.close(dir)
    this.deps.notify(dir)
    if (this.reopening.has(dir)) return
    this.reopening.set(
      dir,
      this.deps.setTimer(() => {
        this.reopening.delete(dir)
        if (this.deps.active().includes(dir) && !this.entries.has(dir)) this.open(dir)
      }, REOPEN_MS),
    )
  }
}
