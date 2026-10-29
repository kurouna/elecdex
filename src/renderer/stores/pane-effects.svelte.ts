import { EFFECT_MS, type PaneEffect, type Reflow } from '../layout/pane-reflow.ts'
import { CRT_FLARE_MS, CRT_TAB_MS } from '../lib/crt-timing.ts'

const NONE: ReadonlyMap<never, never> = new Map<never, never>()

/**
 * The short effects panes play once something has happened to them, part of the
 * layout store (`layout.effects`), which starts them; the hosts read them
 * (layout/pane-motion.ts). Each ends on a timer of its own length, and every
 * change to the tree ends them all at once (`stop`), as it settles a close.
 */
export class PaneEffects {
  /**
   * What a change of layout plays on each pane it moved, by pane id (layout/pane-reflow.ts):
   * flying in from where it was, uncovering the room it gained, or lighting the edges that
   * came in - one each.
   */
  reflow = $state.raw<ReadonlyMap<string, PaneEffect>>(NONE)
  /** The tab just brought to the front of its group, flickering on. */
  flashing = $state<string | null>(null)
  /** The pane the keyboard has just come to, whose frame flares. */
  flaring = $state<string | null>(null)

  /**
   * True while a change of layout is still playing on some pane: they are drawn
   * flown, clipped or lit rather than where they stand. The workspace carries it
   * as `data-reflowing`, so a test can wait for the screen to stand still.
   */
  get reflowing(): boolean {
    return this.reflow.size > 0
  }

  #reflowTimer: ReturnType<typeof setTimeout> | null = null
  #flashTimer: ReturnType<typeof setTimeout> | null = null
  #flareTimer: ReturnType<typeof setTimeout> | null = null

  /** Plays what a change of layout gave each pane, until the longest of them is over. */
  play(reflow: Reflow): void {
    this.stopReflow()
    if (reflow.size === 0) return
    let ms = 0
    for (const effect of reflow.values()) ms = Math.max(ms, EFFECT_MS[effect.kind])
    this.reflow = reflow
    this.#reflowTimer = setTimeout(() => this.stopReflow(), ms)
  }

  /** Ends what a change of layout is playing, where it is. */
  stopReflow(): void {
    if (this.#reflowTimer !== null) clearTimeout(this.#reflowTimer)
    this.#reflowTimer = null
    // Only when something plays: a new empty map would be a change to every host.
    if (this.reflow.size > 0) this.reflow = NONE
  }

  /** A tab brought to the front of its group flickers on, as a set changing channel. */
  flash(paneId: string): void {
    if (this.#flashTimer !== null) clearTimeout(this.#flashTimer)
    this.flashing = paneId
    this.#flashTimer = setTimeout(() => {
      this.#flashTimer = null
      this.flashing = null
    }, CRT_TAB_MS)
  }

  /**
   * The frame of the pane the keyboard has come to flares once, so the eye finds
   * where it went. Asked again for the same pane while it plays, it just plays on.
   */
  flare(paneId: string): void {
    if (this.#flareTimer !== null) clearTimeout(this.#flareTimer)
    this.flaring = paneId
    this.#flareTimer = setTimeout(() => {
      this.#flareTimer = null
      this.flaring = null
    }, CRT_FLARE_MS)
  }

  /** Ends every effect at once: the tree is about to change under them. */
  stop(): void {
    this.stopReflow()
    if (this.#flashTimer !== null) clearTimeout(this.#flashTimer)
    this.#flashTimer = null
    if (this.flashing !== null) this.flashing = null
    if (this.#flareTimer !== null) clearTimeout(this.#flareTimer)
    this.#flareTimer = null
    if (this.flaring !== null) this.flaring = null
  }
}
