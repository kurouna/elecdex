import { findNode, findTabsContaining } from '@shared/layout-ops'
import type { LayoutTree } from '@shared/schemas/layout'
import type { Frame } from '../layout/geometry.ts'
import { type Flip, flipFrom, pinStyle, type ZoomMode, zoomBox } from '../layout/pane-zoom.ts'
import { CRT_UNZOOM_MS, CRT_ZOOM_MS } from '../lib/crt-timing.ts'
import { zoomModeOf } from '../widgets/registry.ts'
import { sfx } from './sound.svelte.ts'

/**
 * What zooming needs from the page, given by the workspace, as closing does: the
 * box a pinned pane is placed in and where a pane's element is laid out, neither
 * of which the store can measure itself.
 */
export interface ZoomMotion {
  /** Whether the flight may play now: motion is not reduced and the boot is over. */
  animates(): boolean
  /** The workspace's box, which a zoomed pane covers most of. */
  area(): Frame | null
  /**
   * Where the pane's element sits when it is not pinned - its group's box for a
   * tabbed pane, since the group is what is brought forward.
   */
  frameOf(paneId: string): Frame | null
}

/** What the zoom asks of the layout it belongs to (layout.svelte.ts). */
export interface ZoomHost {
  tree(): LayoutTree
  /** Finishes a close in progress, which lets go of the zoom too. */
  settle(): void
  focus(paneId: string): void
}

/**
 * Bringing one pane to the front of the workspace (architecture.md §5.5): it is
 * pinned over the others at most of the window, and flies there from where it
 * sat. Nothing in the tree changes, so the pane is not remounted - a shell keeps
 * its session, a web pane its page - and the panes it covers keep their size, so
 * no terminal is resized but this one, once.
 *
 * Part of the layout store (`layout.zoom`), which lets go of it on every change
 * to the tree; the geometry is layout/pane-zoom.ts.
 */
export class PaneZoom {
  readonly #host: ZoomHost

  constructor(host: ZoomHost) {
    this.#host = host
  }

  /** Unset, a pane cannot be zoomed (and is not in tests that do not set it). */
  motion: ZoomMotion | null = null
  /**
   * The pane the user has brought to the front, if any. Never saved: a zoom is a
   * look at one pane, not an arrangement, and a layout that reopened zoomed
   * would hide the rest of the workspace behind a state the user had forgotten.
   */
  paneId = $state<string | null>(null)
  /**
   * The pane whose element is pinned over the workspace now. The same pane while
   * it is zoomed, and still it while it flies back to its place or powers off
   * where it stands - so a pane closed from the front does not snap back first.
   */
  pinnedId = $state<string | null>(null)
  /** Where it is pinned, in viewport pixels. */
  pin = $state.raw<Frame | null>(null)
  /** The transform it is flying from, while a flight is playing. */
  flip = $state.raw<Flip | null>(null)
  phase = $state<'in' | 'out' | null>(null)
  /** How the pinned pane is placed, which its widget decides (registry). */
  mode = $state<ZoomMode | null>(null)
  #timer: ReturnType<typeof setTimeout> | null = null

  /** The inline style that places the pinned pane and plays its flight (pinStyle). */
  readonly style = $derived(
    this.pin === null
      ? null
      : pinStyle(this.pin, this.flip, this.phase === 'out' ? CRT_UNZOOM_MS : CRT_ZOOM_MS),
  )

  /** Brings a pane forward, flying it out of its place. */
  bring(paneId: string): void {
    if (paneId === this.paneId) return
    this.#host.settle()
    const motion = this.motion
    if (motion === null) return
    // The widget decides whether it is worth the room, and how much (registry):
    // the shortcut ends here as well as the button, so there is one answer.
    const mode = this.modeFor(paneId)
    if (mode === null) return
    const area = motion.area()
    const box = area === null ? null : zoomBox(area, mode)
    // A workspace with no area (a page that has not been laid out yet): nothing
    // to pin the pane to, and pinning it to nothing would hide it.
    if (box === null) return
    const from = motion.frameOf(paneId)
    this.#host.focus(paneId)
    this.paneId = paneId
    this.pinnedId = paneId
    this.pin = box
    this.mode = mode
    sfx.play('expand')
    this.#fly('in', motion.animates() && from !== null ? flipFrom(from, box) : null)
  }

  /** Puts it back where it belongs, flying it down into its place first. */
  putBack(): void {
    const id = this.paneId
    if (id === null) return
    this.paneId = null
    sfx.play('collapse')
    const motion = this.motion
    const box = this.pin
    const home = motion?.frameOf(id) ?? null
    const flip =
      motion?.animates() === true && box !== null && home !== null ? flipFrom(home, box) : null
    if (flip === null) {
      this.#unpin()
      return
    }
    this.#fly('out', flip)
  }

  toggle(paneId: string): void {
    if (paneId === this.paneId) this.putBack()
    else this.bring(paneId)
  }

  /**
   * How the pane's widget is brought forward, or null when it is not. For a
   * caller holding only an id (the shortcut); a component with the node itself
   * asks the registry directly.
   */
  modeFor(paneId: string): ZoomMode | null {
    const node = findNode(this.#host.tree().root, paneId)
    return node === null || node.kind !== 'pane' ? null : zoomModeOf(node.widget)
  }

  /** Places the pinned pane again after the window changed size. Not a flight. */
  repin(): void {
    if (this.pinnedId === null) return
    const area = this.motion?.area() ?? null
    const box = area === null ? null : zoomBox(area, this.mode ?? 'full')
    if (box !== null) this.pin = box
  }

  /**
   * Focus moving while a pane is forward. A tab of the zoomed pane's own group
   * takes the zoom with it - the group is what is pinned, and the tab shown in it
   * has only changed. Anything else focused puts the zoomed pane back.
   */
  follow(paneId: string): void {
    const zoomed = this.paneId
    if (zoomed === null || zoomed === paneId) return
    const root = this.#host.tree().root
    const group = findTabsContaining(root, zoomed)
    const mode = this.modeFor(paneId)
    // A tab that is not brought forward at all takes the group back rather than
    // holding a pane the user was never offered the button for over everything.
    if (group !== null && group === findTabsContaining(root, paneId) && mode !== null) {
      this.paneId = paneId
      this.pinnedId = paneId
      this.mode = mode
      this.repin()
      return
    }
    this.putBack()
  }

  /**
   * Lets go of a zoom at once, without the flight: every change to the tree does
   * this, since the pane's place is about to be a different one. The pane being
   * closed stays pinned, so that it powers off where the user is looking.
   */
  clear(closing: string | null = null): void {
    if (this.#timer !== null) clearTimeout(this.#timer)
    this.#timer = null
    this.paneId = null
    this.phase = null
    this.flip = null
    if (this.pinnedId !== null && this.pinnedId === closing) return
    this.#unpin()
  }

  /** A pane pinned while it powered off has gone: nothing is over the workspace now. */
  dropGone(tree: LayoutTree): void {
    if (this.pinnedId !== null && findNode(tree.root, this.pinnedId) === null) this.#unpin()
  }

  /** Plays a flight, or, without one, leaves the pane where the phase puts it. */
  #fly(phase: 'in' | 'out', flip: Flip | null): void {
    if (this.#timer !== null) clearTimeout(this.#timer)
    this.#timer = null
    if (flip === null) {
      this.phase = null
      this.flip = null
      if (phase === 'out') this.#unpin()
      return
    }
    this.phase = phase
    this.flip = flip
    this.#timer = setTimeout(
      () => {
        this.#timer = null
        this.phase = null
        this.flip = null
        if (phase === 'out') this.#unpin()
      },
      phase === 'out' ? CRT_UNZOOM_MS : CRT_ZOOM_MS,
    )
  }

  /** Lets go of the pinned pane, which is laid out with the others again. */
  #unpin(): void {
    this.pinnedId = null
    this.pin = null
    this.mode = null
  }
}
