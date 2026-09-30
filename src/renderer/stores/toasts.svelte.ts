/**
 * The stack of toasts in the corner of the workspace.
 *
 * One host for everything that has to say something without taking the screen:
 * a deadline reached, a timer finished, something deleted that can be brought
 * back. Kept here rather than in the widgets so several panes cannot each draw
 * their own corner, and so a toast outlives the pane that raised it - a timer's
 * pane may be closed by the same click that started the toast.
 */

export interface ToastAction {
  label: string
  /** Returning true keeps the toast up; anything else - including nothing - closes it. */
  run: () => unknown
  /** Drawn as the leading action. */
  primary?: boolean
}

export interface Toast {
  id: number
  title: string
  body?: string
  tone: 'accent' | 'warn' | 'danger' | 'ok'
  actions: readonly ToastAction[]
  /** How long it stays, in milliseconds; 0 keeps it until dismissed. */
  timeoutMs: number
  /** When it was raised, for the countdown ring on a timed action. */
  raisedAt: number
}

/** More than this on screen at once and the corner is a wall of text. */
const MAX_TOASTS = 4

const DEFAULT_TIMEOUT_MS = 10_000

class ToastStore {
  // Replaced whole on every change, never changed in place: no deep proxy.
  items = $state.raw<Toast[]>([])

  private nextId = 1
  private timers = new Map<number, ReturnType<typeof setTimeout>>()
  /**
   * When each timed toast goes, pushed back by every hold. Kept apart from the
   * toast itself so a hold does not replace the list the stack draws.
   */
  private deadlines = new Map<number, number>()
  /** Since when the pointer has been over the stack, or null: nothing times out under the cursor. */
  private heldAt: number | null = null

  show(toast: {
    title: string
    body?: string
    tone?: Toast['tone']
    actions?: readonly ToastAction[]
    timeoutMs?: number
  }): number {
    const id = this.nextId++
    const item: Toast = {
      id,
      title: toast.title,
      ...(toast.body === undefined ? {} : { body: toast.body }),
      tone: toast.tone ?? 'accent',
      actions: toast.actions ?? [],
      timeoutMs: toast.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      raisedAt: Date.now(),
    }
    if (item.timeoutMs > 0) this.deadlines.set(id, item.raisedAt + item.timeoutMs)
    this.items = this.evict([...this.items, item])
    this.arm(item)
    return id
  }

  dismiss(id: number): void {
    this.forget(id)
    this.items = this.items.filter((item) => item.id !== id)
    // The stack goes with its last card, and an element taken from under the
    // pointer hears no pointerleave: without this the next toast would be held
    // open for good by a pointer that is no longer there.
    if (this.items.length === 0) this.heldAt = null
  }

  run(id: number, action: ToastAction): void {
    if (action.run() !== true) this.dismiss(id)
  }

  /**
   * Holds every toast open while the pointer is over the stack.
   *
   * A toast that vanishes as the user reaches for its button is worse than one
   * that stays too long: the action it offered is gone and cannot be found again.
   */
  hold(held: boolean): void {
    if (held) {
      this.heldAt ??= Date.now()
      for (const id of [...this.timers.keys()]) this.clearTimer(id)
      return
    }
    const heldAt = this.heldAt
    if (heldAt === null) return
    this.heldAt = null
    // A pause, not a stay of execution: each fuse goes on from where the hold
    // stopped it, as the stack draws it. Taking the held time off the clock
    // instead - letting every toast whose moment passed under the pointer go the
    // instant the pointer left - swept the whole stack away with the one card
    // the user had just answered, since answering one is how the pointer leaves.
    const now = Date.now()
    for (const item of this.items) {
      const deadline = this.deadlines.get(item.id)
      if (deadline === undefined) continue
      this.deadlines.set(item.id, deadline + now - Math.max(heldAt, item.raisedAt))
      this.arm(item)
    }
  }

  /** For teardown in tests and on unmount. */
  clear(): void {
    for (const id of [...this.timers.keys()]) this.clearTimer(id)
    this.deadlines.clear()
    this.heldAt = null
    this.items = []
  }

  /**
   * Keeps the stack to `MAX_TOASTS`, the oldest going first - never the newest,
   * the one the user is looking for - but a timed toast before one that waits to
   * be answered: an alarm's card must not be pushed out by a notice that would
   * have gone of its own accord.
   */
  private evict(items: Toast[]): Toast[] {
    let kept = items
    while (kept.length > MAX_TOASTS) {
      const timed = kept.slice(0, -1).findIndex((item) => item.timeoutMs > 0)
      const gone = kept[timed === -1 ? 0 : timed]
      if (gone === undefined) break
      this.forget(gone.id)
      kept = kept.filter((item) => item !== gone)
    }
    return kept
  }

  private arm(item: Toast): void {
    const deadline = this.deadlines.get(item.id)
    if (deadline === undefined || this.heldAt !== null || this.timers.has(item.id)) return
    this.timers.set(
      item.id,
      setTimeout(() => this.dismiss(item.id), Math.max(0, deadline - Date.now())),
    )
  }

  private forget(id: number): void {
    this.clearTimer(id)
    this.deadlines.delete(id)
  }

  private clearTimer(id: number): void {
    const timer = this.timers.get(id)
    if (timer !== undefined) clearTimeout(timer)
    this.timers.delete(id)
  }
}

export const toasts = new ToastStore()
