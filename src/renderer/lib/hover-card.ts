/**
 * Detail cards: the whole of something shown while the pointer rests on it -
 * a commit in the git pane, an entry of the clipboard history, a figure of the
 * Wi-Fi pane, a satellite on the ORBIT map (architecture.md §7.4). The card is
 * drawn by widgets/common/HoverCard.svelte; where it goes and when it opens are
 * decided here, so every card goes to the same place and opens the same way.
 *
 * A plain tooltip (a `title` attribute naming a button) is not a card.
 */

/** How long the pointer rests before a card opens: passing over rows opens none. */
export const HOVER_REST_MS = 350
/** The room kept between a card and what it is about, and the pane's edges. */
export const CARD_GAP = 6
/** How far right of the pointer a card starts, so the pointer does not cover its first letters. */
export const POINTER_OFFSET = 14

/** A fact on a card (widgets/common/CardRows.svelte): a small label, and what it says. */
export interface CardRow {
  label: string
  value: string
  /** Said quietly: an id, a note. */
  muted?: boolean
}

/** A moment as a card writes it: the day and the minute, in the user's own way. */
export function cardTime(at: number): string {
  return new Date(at).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** What a card is about, in the pane's own pixels: where it starts, and its top and bottom. */
export interface CardAnchor {
  x: number
  top: number
  bottom: number
}

export interface CardSize {
  width: number
  height: number
}

/**
 * Where a card goes in its pane: below what it is about, or above it where there
 * is no room below, and never past the pane's edges - a card reaching over
 * another pane would be hidden by a web pane's native view, and would cover a
 * pane that has nothing to do with it.
 */
export function cardPlacement(
  anchor: CardAnchor,
  bounds: CardSize,
  card: CardSize,
  gap: number = CARD_GAP,
): { left: number; top: number } {
  const left = Math.max(gap, Math.min(anchor.x, bounds.width - card.width - gap))
  const top =
    anchor.bottom + gap + card.height <= bounds.height
      ? anchor.bottom + gap
      : Math.max(gap, anchor.top - gap - card.height)
  return { left, top }
}

/**
 * The anchor of an element, in the pane's pixels: from the pointer's x when the
 * pointer brought the card (a little right of it), or from the element's left
 * edge when the keyboard did.
 */
export function anchorOf(pane: DOMRect, target: DOMRect, pointerX: number | null): CardAnchor {
  const x = pointerX === null ? target.left : pointerX + POINTER_OFFSET
  return { x: x - pane.left, top: target.top - pane.top, bottom: target.bottom - pane.top }
}

/**
 * When a card opens and closes. The pointer coming to rest on something opens
 * its card after HOVER_REST_MS; moving on to the next thing while a card is
 * open opens the next at once (the user is reading cards, not passing by); the
 * keyboard opens one at once. Leaving closes it - only the thing whose card is
 * open or waiting, so a late leave from the row before closes nothing - and
 * not until the moment is over: moving from one row to the next leaves the one
 * before entering the other, and the card must stay open across that.
 */
export class HoverRest<K> {
  readonly #hide: () => void
  readonly #set: (fn: () => void, ms: number) => unknown
  readonly #clear: (handle: unknown) => void
  #timer: unknown = null
  /** A close waiting for the moment to pass, in case the next thing is entered in it. */
  #closing: unknown = null
  /** The thing whose card is open, or waiting to open. */
  #key: K | null = null
  #open = false

  constructor(
    hide: () => void,
    timers: {
      set: (fn: () => void, ms: number) => unknown
      clear: (handle: unknown) => void
    } = {
      set: (fn, ms) => setTimeout(fn, ms),
      clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
    },
  ) {
    this.#hide = hide
    this.#set = timers.set
    this.#clear = timers.clear
  }

  /** `key` came under the pointer, or the keyboard (`now`); `show` opens its card. */
  enter(key: K, show: () => void, now = false): void {
    this.#cancel()
    this.#stopClosing()
    this.#key = key
    if (now || this.#open) {
      this.#open = true
      show()
      return
    }
    this.#timer = this.#set(() => {
      this.#timer = null
      this.#open = true
      show()
    }, HOVER_REST_MS)
  }

  /** `key` was left; with no key, whatever is open or waiting closes. */
  leave(key?: K): void {
    if (key !== undefined && key !== this.#key) return
    this.#cancel()
    this.#key = null
    if (!this.#open || this.#closing !== null) return
    this.#closing = this.#set(() => {
      this.#closing = null
      this.#open = false
      this.#hide()
    }, 0)
  }

  dispose(): void {
    this.#cancel()
    this.#stopClosing()
  }

  #stopClosing(): void {
    if (this.#closing === null) return
    this.#clear(this.#closing)
    this.#closing = null
  }

  #cancel(): void {
    if (this.#timer === null) return
    this.#clear(this.#timer)
    this.#timer = null
  }
}
