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
  items = $state<Toast[]>([])

  private nextId = 1
  private timers = new Map<number, ReturnType<typeof setTimeout>>()
  /** Set while the pointer is over the stack: nothing times out under the cursor. */
  private held = false

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
    // The oldest goes first: the newest is the one the user is looking for.
    const items = [...this.items, item]
    for (const gone of items.splice(0, Math.max(0, items.length - MAX_TOASTS))) {
      this.clearTimer(gone.id)
    }
    this.items = items
    this.arm(item)
    return id
  }

  dismiss(id: number): void {
    this.clearTimer(id)
    this.items = this.items.filter((item) => item.id !== id)
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
    this.held = held
    if (held) {
      for (const id of this.timers.keys()) this.clearTimer(id)
      return
    }
    for (const item of this.items) this.arm(item)
  }

  /** For teardown in tests and on unmount. */
  clear(): void {
    for (const id of [...this.timers.keys()]) this.clearTimer(id)
    this.items = []
  }

  private arm(item: Toast): void {
    if (item.timeoutMs <= 0 || this.held || this.timers.has(item.id)) return
    const left = Math.max(0, item.raisedAt + item.timeoutMs - Date.now())
    this.timers.set(
      item.id,
      setTimeout(() => this.dismiss(item.id), left),
    )
  }

  private clearTimer(id: number): void {
    const timer = this.timers.get(id)
    if (timer !== undefined) clearTimeout(timer)
    this.timers.delete(id)
  }
}

export const toasts = new ToastStore()
