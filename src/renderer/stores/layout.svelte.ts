import type { SavedLayoutsApi } from '@shared/api'
import { defaultLayoutNode, fallbackNode } from '@shared/default-layout'
import {
  addTab,
  closeNode,
  collectPanes,
  findNode,
  findTabsContaining,
  focusTab,
  moveNode,
  moveTabTo,
  neighbourShell,
  neighbourTab,
  type Placement,
  pane,
  patchPaneState,
  resizeSplit,
  setPaneState,
  splitPane,
  visiblePanes,
} from '@shared/layout-ops'
import type { SavedLayoutSummary } from '@shared/layouts'
import { LAYOUT_VERSION, type LayoutTree, type SplitDirection } from '@shared/schemas/layout'
import { flushSync } from 'svelte'
import {
  SWITCH_GAP_MS,
  SWITCH_OFF_MS,
  SWITCH_ON_MS,
  switchDelaysFor,
  switchRevealEnd,
  switchSoundTimes,
} from '../layout/layout-switch.ts'
import {
  CLOSE_SETTLE_MS,
  CRT_EXTEND_MS,
  extendFrom,
  type Frame,
  type Inset,
} from '../layout/pane-close.ts'
import {
  CRT_UNZOOM_MS,
  CRT_ZOOM_MS,
  type Flip,
  flipFrom,
  pinStyle,
  type ZoomMode,
  zoomBox,
} from '../layout/pane-zoom.ts'
import { resolveWidget, zoomModeOf } from '../widgets/registry.ts'
import { appearance } from './appearance.svelte.ts'
import { sfx } from './sound.svelte.ts'
import { toasts } from './toasts.svelte.ts'
import { ui } from './ui.svelte.ts'

/**
 * The live layout.
 *
 * Every mutation goes through a shared pure operation, so the invariants are
 * enforced in one place and are unit-tested without a DOM. Saves are debounced
 * because a drag produces a resize event per frame.
 */

/**
 * Longer than a layout switch's power-off (SWITCH_OFF_MS + SWITCH_GAP_MS): main makes the
 * next layout active before the page adopts its tree, so a save sent in that gap would
 * carry the old arrangement into the new layout (tests/component/layout-saved.test.ts).
 */
const SAVE_DEBOUNCE_MS = 400

/** Shared empty set, so `leaving` does not allocate one per switch. */
const EMPTY_IDS: ReadonlySet<string> = new Set<string>()

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/** A shell is framed differently and powers on ahead of the modules. */
const isShellWidget = (widget: string): boolean => resolveWidget(widget)?.chrome === 'shell'

/** Where a pane added from the picker goes, relative to the focused pane. */
export type PanePlacement = 'right' | 'down' | 'tab'

/**
 * What closing needs from the page, given by the workspace: this store cannot ask
 * the boot or appearance stores itself (boot imports it) and has no DOM of its own.
 */
export interface CloseMotion {
  /** Whether a close may animate now: motion is not reduced and the boot is over. */
  animates(): boolean
  /** The box of every shown pane's frame, by pane id. */
  frames(): Map<string, Frame>
}

/**
 * What zooming needs from the page, given by the workspace, as closing does: the
 * box a pinned pane is placed in and where a pane's element is laid out, neither
 * of which this store can measure itself.
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

class LayoutStore {
  tree = $state<LayoutTree>({ version: LAYOUT_VERSION, root: defaultLayoutNode() })
  /** Pane that has focus. Drives which terminal receives keystrokes. */
  focusedPaneId = $state<string | null>(null)
  loaded = $state(false)

  readonly panes = $derived(collectPanes(this.tree.root))
  readonly visible = $derived(visiblePanes(this.tree.root))
  /** The visible panes that stay: what the keyboard can move to. */
  private readonly shown = $derived(this.visible.filter((p) => p.id !== this.closingId))

  /** The terminal pane focused most recently, as remembered by focus(). */
  private lastTerminalId = $state<string | null>(null)

  /**
   * The terminal that follow-the-shell widgets track: the last one focused if it
   * still exists, else the first in the layout - so the file browser follows the
   * shell the user is working in, and keeps doing so while they click around it.
   * A shell powering off is already gone for them, as it is for the keyboard.
   */
  readonly followedTerminalId = $derived.by(() => {
    const terminals = this.panes.filter((p) => p.widget === 'terminal' && p.id !== this.closingId)
    return terminals.find((p) => p.id === this.lastTerminalId)?.id ?? terminals[0]?.id ?? null
  })

  private saveTimer: ReturnType<typeof setTimeout> | null = null
  /**
   * True while the layout on disk could not be read. What is on screen is then
   * not the user's arrangement, so nothing is written back over it.
   */
  private unread = false

  /** Unset, every close is immediate (and so it is in tests that do not set it). */
  closeMotion: CloseMotion | null = null
  /**
   * The pane powering off, still in the tree until it has. One at a time: any
   * other change to the tree first settles it (see settle), so a close never has
   * to reason about a tree another close is about to change.
   */
  closingId = $state<string | null>(null)
  /** Panes uncovering the room a close gave them, with where their clip starts. */
  extending = $state.raw<ReadonlyMap<string, Inset>>(new Map())
  private closeTimer: ReturnType<typeof setTimeout> | null = null
  private extendTimer: ReturnType<typeof setTimeout> | null = null

  /** Unset, a pane cannot be zoomed (and is not in tests that do not set it). */
  zoomMotion: ZoomMotion | null = null
  /**
   * The pane the user has brought to the front, if any. Never saved: a zoom is a
   * look at one pane, not an arrangement, and a layout that reopened zoomed
   * would hide the rest of the workspace behind a state the user had forgotten.
   */
  zoomedPaneId = $state<string | null>(null)
  /**
   * The pane whose element is pinned over the workspace now. The same pane while
   * it is zoomed, and still it while it flies back to its place or powers off
   * where it stands - so a pane closed from the front does not snap back first.
   */
  pinnedPaneId = $state<string | null>(null)
  /** Where it is pinned, in viewport pixels. */
  zoomPin = $state.raw<Frame | null>(null)
  /** The transform it is flying from, while a flight is playing. */
  zoomFlip = $state.raw<Flip | null>(null)
  zoomPhase = $state<'in' | 'out' | null>(null)
  /** How the pinned pane is placed, which its widget decides (registry). */
  zoomMode = $state<ZoomMode | null>(null)
  private zoomTimer: ReturnType<typeof setTimeout> | null = null

  /** The CSS variables that place the pinned pane and play its flight. */
  readonly zoomStyle = $derived(
    this.zoomPin === null
      ? null
      : pinStyle(
          this.zoomPin,
          this.zoomFlip,
          this.zoomPhase === 'out' ? CRT_UNZOOM_MS : CRT_ZOOM_MS,
        ),
  )

  /** The pane added last, until its host has taken it to power on (see arrived). */
  private arriving: string | null = null

  /**
   * Whether `paneId` has just been added, answered once: a pane's host asks as it
   * mounts, so the power-on plays when the pane appears and not again when a move
   * remounts it. Not reactive, as nothing re-renders for it.
   */
  arrived(paneId: string): boolean {
    if (this.arriving !== paneId) return false
    this.arriving = null
    return true
  }

  /**
   * A plain copy of the tree for crossing the IPC boundary.
   *
   * `$state` wraps the tree in a Proxy, and neither structuredClone nor
   * Electron's IPC serialiser can clone a Proxy - so passing `this.tree`
   * directly throws and the save is silently lost. `$state.snapshot` unwraps it.
   */
  private snapshot(): LayoutTree {
    return $state.snapshot(this.tree) as LayoutTree
  }

  async load(): Promise<void> {
    try {
      this.adopt(await window.elecdex.layout.load())
      this.unread = false
    } catch (error) {
      console.error('[elecdex] could not read the layout', error)
      // The page has to come up regardless: the boot sequence waits for `loaded`
      // and the workspace draws nothing without it, so the window would be left
      // on the intro for good. It comes up on the tree it already has - the
      // default at startup, or what the user has arranged since an earlier
      // attempt failed - and holds every save back until a read succeeds, since
      // writing that tree would put it over the arrangement on disk.
      if (!this.loaded) this.focusedPaneId = initialFocus(this.tree)
      this.unread = true
      this.warnUnread()
    }
    this.loaded = true
  }

  /** Says the layout could not be read, and offers another go at it. */
  private warnUnread(): void {
    toasts.show({
      title: 'could not read the layout',
      body: 'Showing the default arrangement. Changes are not being saved until the layout can be read.',
      tone: 'danger',
      timeoutMs: 0,
      actions: [{ label: 'try again', primary: true, run: () => void this.load() }],
    })
  }

  /**
   * Takes a tree that came from main, whole. A zoom is let go of here as well as
   * before the ask: `reset` settles first, but the tree arrives later, and a pane
   * zoomed in between would be left zoomed over a tree it is not in - with every
   * pane behind it inert, the workspace would take no click and no key.
   */
  private adopt(tree: LayoutTree): void {
    this.tree = tree
    this.clearZoom()
    this.focusedPaneId = initialFocus(tree)
  }

  /** Replaces the tree and schedules a save. */
  private commit(next: LayoutTree): void {
    if (next === this.tree) return
    this.tree = next

    this.focusedPaneId = focusIn(next, this.focusedPaneId)

    this.scheduleSave()
  }

  private scheduleSave(): void {
    // Never over a layout that could not be read (see load).
    if (this.unread) return
    if (this.saveTimer !== null) clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null
      void this.write()
    }, SAVE_DEBOUNCE_MS)
  }

  /** Sends the tree to main, and keeps the promise so `flush` can wait for it. */
  private write(): Promise<void> {
    const done = window.elecdex.layout
      .save(this.snapshot())
      .catch((error: unknown) => {
        // Surface it: a save that fails quietly loses the user's layout on next launch.
        console.error('[elecdex] failed to save layout', error)
      })
      .then(() => {
        if (this.saving === done) this.saving = null
      })
    this.saving = done
    return done
  }

  /** The save in flight, if any. */
  private saving: Promise<void> | null = null

  /**
   * Writes a pending save immediately and waits for main to have it, for
   * teardown where the debounce would be lost and before the workspace becomes
   * another layout. Nothing is written when no change is pending: writing the
   * in-memory tree unconditionally on every reload or close would overwrite a
   * layout.json the user had edited by hand while the app was running.
   *
   * A save already in flight is waited for too. It carries the arrangement of
   * the layout being left, and main writes each save back into the layout being
   * worked in (shared/layouts.ts) - so one still travelling when the next layout
   * is applied would land in that one instead.
   */
  async flush(): Promise<void> {
    // A pane powering off is closed as far as the saved layout is concerned.
    this.settle()
    if (this.saveTimer !== null) {
      clearTimeout(this.saveTimer)
      this.saveTimer = null
      await this.write()
    }
    await this.saving
  }

  focus(paneId: string): void {
    if (paneId === this.closingId) return
    const node = findNode(this.tree.root, paneId)
    if (node === null) return
    if (this.zoomedPaneId !== null && this.zoomedPaneId !== paneId) this.followZoom(paneId)
    this.focusedPaneId = paneId
    if (node.kind === 'pane' && node.widget === 'terminal') this.lastTerminalId = paneId
    this.commit(focusTab(this.tree, paneId))
  }

  /**
   * Brings a pane to the front of the workspace: it is pinned over the others at
   * most of the window, and flies there from where it sat. Nothing in the tree
   * changes, so the pane is not remounted - a shell keeps its session, a web
   * pane its page - and the panes it covers keep their size, so no terminal is
   * resized but this one, once.
   */
  zoom(paneId: string): void {
    if (paneId === this.zoomedPaneId) return
    this.settle()
    const motion = this.zoomMotion
    if (motion === null) return
    // The widget decides whether it is worth the room, and how much (registry):
    // the shortcut ends here as well as the button, so there is one answer.
    const mode = this.zoomModeFor(paneId)
    if (mode === null) return
    const area = motion.area()
    const box = area === null ? null : zoomBox(area, mode)
    // A workspace with no area (a page that has not been laid out yet): nothing
    // to pin the pane to, and pinning it to nothing would hide it.
    if (box === null) return
    const from = motion.frameOf(paneId)
    this.focus(paneId)
    this.zoomedPaneId = paneId
    this.pinnedPaneId = paneId
    this.zoomPin = box
    this.zoomMode = mode
    sfx.play('expand')
    this.fly('in', motion.animates() && from !== null ? flipFrom(from, box) : null)
  }

  /** Puts it back where it belongs, flying it down into its place first. */
  unzoom(): void {
    const id = this.zoomedPaneId
    if (id === null) return
    this.zoomedPaneId = null
    sfx.play('collapse')
    const motion = this.zoomMotion
    const box = this.zoomPin
    const home = motion?.frameOf(id) ?? null
    const flip =
      motion?.animates() === true && box !== null && home !== null ? flipFrom(home, box) : null
    if (flip === null) {
      this.unpin()
      return
    }
    this.fly('out', flip)
  }

  toggleZoom(paneId: string): void {
    if (paneId === this.zoomedPaneId) this.unzoom()
    else this.zoom(paneId)
  }

  /**
   * How the pane's widget is brought forward, or null when it is not. For a
   * caller holding only an id (the shortcut); a component with the node itself
   * asks the registry directly.
   */
  zoomModeFor(paneId: string): ZoomMode | null {
    const node = findNode(this.tree.root, paneId)
    return node === null || node.kind !== 'pane' ? null : zoomModeOf(node.widget)
  }

  /** Places the pinned pane again after the window changed size. Not a flight. */
  repin(): void {
    if (this.pinnedPaneId === null) return
    const area = this.zoomMotion?.area() ?? null
    const box = area === null ? null : zoomBox(area, this.zoomMode ?? 'full')
    if (box !== null) this.zoomPin = box
  }

  /** Plays a flight, or, without one, leaves the pane where the phase puts it. */
  private fly(phase: 'in' | 'out', flip: Flip | null): void {
    if (this.zoomTimer !== null) clearTimeout(this.zoomTimer)
    this.zoomTimer = null
    if (flip === null) {
      this.zoomPhase = null
      this.zoomFlip = null
      if (phase === 'out') this.unpin()
      return
    }
    this.zoomPhase = phase
    this.zoomFlip = flip
    this.zoomTimer = setTimeout(
      () => {
        this.zoomTimer = null
        this.zoomPhase = null
        this.zoomFlip = null
        if (phase === 'out') this.unpin()
      },
      phase === 'out' ? CRT_UNZOOM_MS : CRT_ZOOM_MS,
    )
  }

  /** Lets go of the pinned pane, which is laid out with the others again. */
  private unpin(): void {
    this.pinnedPaneId = null
    this.zoomPin = null
    this.zoomMode = null
  }

  /**
   * A tab of the zoomed pane's own group takes the zoom with it - the group is
   * what is pinned, and the tab shown in it has only changed. Anything else
   * focused puts the zoomed pane back.
   */
  private followZoom(paneId: string): void {
    const zoomed = this.zoomedPaneId
    if (zoomed === null) return
    const group = findTabsContaining(this.tree.root, zoomed)
    const mode = this.zoomModeFor(paneId)
    // A tab that is not brought forward at all takes the group back rather than
    // holding a pane the user was never offered the button for over everything.
    if (group !== null && group === findTabsContaining(this.tree.root, paneId) && mode !== null) {
      this.zoomedPaneId = paneId
      this.pinnedPaneId = paneId
      this.zoomMode = mode
      this.repin()
      return
    }
    this.unzoom()
  }

  /**
   * Lets go of a zoom at once, without the flight: every change to the tree does
   * this, since the pane's place is about to be a different one. The pane being
   * closed stays pinned, so that it powers off where the user is looking.
   */
  private clearZoom(closing: string | null = null): void {
    if (this.zoomTimer !== null) clearTimeout(this.zoomTimer)
    this.zoomTimer = null
    this.zoomedPaneId = null
    this.zoomPhase = null
    this.zoomFlip = null
    if (this.pinnedPaneId !== null && this.pinnedPaneId === closing) return
    this.unpin()
  }

  split(paneId: string, direction: SplitDirection, widget: string): void {
    this.settle()
    const incoming = pane(widget)
    this.arriving = incoming.id
    this.commit(splitPane(this.tree, paneId, direction, incoming))
    this.focusedPaneId = incoming.id
    sfx.play('expand')
  }

  /** Splits the focused pane, or does nothing when nothing is focused. */
  splitFocused(direction: SplitDirection, widget?: string): void {
    const target = this.focusedPaneId
    if (target === null) return
    const current = findNode(this.tree.root, target)
    const sameWidget = current?.kind === 'pane' ? current.widget : 'terminal'
    this.split(target, direction, widget ?? sameWidget)
  }

  addTab(siblingPaneId: string, widget: string): void {
    this.settle()
    const incoming = pane(widget)
    this.arriving = incoming.id
    this.commit(addTab(this.tree, siblingPaneId, incoming))
    this.focusedPaneId = incoming.id
    sfx.play('folder')
  }

  addTabToFocused(widget?: string): void {
    const target = this.focusedPaneId
    if (target === null) return
    const current = findNode(this.tree.root, target)
    const sameWidget = current?.kind === 'pane' ? current.widget : 'terminal'
    this.addTab(target, widget ?? sameWidget)
  }

  /**
   * Adds a pane of `widget` beside the focused pane (or the first visible one),
   * to its right, below it, or as a tab in its group.
   */
  addPane(widget: string, placement: PanePlacement): void {
    const target = this.focusedPaneId ?? this.visible[0]?.id ?? null
    if (target === null) return
    if (placement === 'tab') this.addTab(target, widget)
    else this.split(target, placement === 'right' ? 'right' : 'down', widget)
  }

  /** The first pane showing `widget`, if any. */
  paneWith(widget: string): string | null {
    return this.panes.find((p) => p.widget === widget)?.id ?? null
  }

  /**
   * Moves a pane or a tab group beside another node, or into it as tabs, and
   * focuses what moved. Does nothing when the move would not change the layout.
   */
  move(nodeId: string, targetId: string, placement: Placement): void {
    this.settle()
    this.applyMove(moveNode(this.tree, nodeId, targetId, placement), nodeId)
  }

  /**
   * Moves a pane, or a whole group's tabs, into a strip at the gap `index`:
   * dragging a tab along the strip it is in, or into another group's.
   */
  moveTab(nodeId: string, targetId: string, index: number): void {
    this.settle()
    this.applyMove(moveTabTo(this.tree, nodeId, targetId, index), nodeId)
  }

  /** Whether moving `nodeId` to `targetId` with `placement` would change the layout. */
  canMove(nodeId: string, targetId: string, placement: Placement): boolean {
    return moveNode(this.tree, nodeId, targetId, placement) !== this.tree
  }

  /** Whether moving `nodeId` into `targetId`'s strip at `index` would change the layout. */
  canMoveTab(nodeId: string, targetId: string, index: number): boolean {
    return moveTabTo(this.tree, nodeId, targetId, index) !== this.tree
  }

  /** The id of the tab group a pane is drawn in, or null when it is not tabbed. */
  groupOf(paneId: string): string | null {
    return findTabsContaining(this.tree.root, paneId)?.id ?? null
  }

  /** Takes the result of a move, focusing what moved. A move that changed nothing does nothing. */
  private applyMove(next: LayoutTree, nodeId: string): void {
    if (next === this.tree) return
    this.commit(next)
    const moved = findNode(next.root, nodeId)
    const shown = moved === null ? null : visiblePanes(moved)[0]
    if (shown) this.focus(shown.id)
    sfx.play('expand')
  }

  /**
   * Closes a pane, or a whole tab group by its id: a shown one powers off first
   * and is removed after, when the panes left behind extend into its room;
   * anything else goes at once. Focus moves on straight away, so the keyboard is
   * never left with a closing pane.
   */
  close(nodeId: string): void {
    // Its tab's × still takes a click while it powers off; that is the same close.
    if (nodeId === this.closingId) return
    const node = findNode(this.tree.root, nodeId)
    // Closed from the front: it keeps the room it was pinned in to power off in.
    // A group closed with its shown tab in front does the same, pinned by that tab.
    const zoomed = this.zoomedPaneId
    const inFront =
      zoomed !== null &&
      (zoomed === nodeId || (node?.kind === 'tabs' && findNode(node, zoomed) !== null))
    this.settleFor(inFront ? zoomed : null)
    if (node === null) return
    sfx.play('collapse')
    // A group is always on screen; a pane is not when it is a tab behind another.
    const shown = node.kind === 'tabs' || this.visible.some((p) => p.id === nodeId)
    if (!shown || this.closeMotion?.animates() !== true) {
      this.remove(nodeId)
      return
    }
    this.closingId = nodeId
    this.focusedPaneId = focusIn(closeNode(this.tree, nodeId, fallbackNode()), this.focusedPaneId)
    this.closeTimer = setTimeout(() => this.finishClosing(), CLOSE_SETTLE_MS)
  }

  /** The power-off has played: remove the pane and uncover what took its room. */
  private finishClosing(): void {
    const id = this.closingId
    const motion = this.closeMotion
    this.closeTimer = null
    this.closingId = null
    if (id === null) return
    const before = motion?.frames()
    const arrived = this.remove(id)
    if (motion === null || before === undefined) return
    // Svelte applies the new tree on its next flush; measure after it, not before.
    flushSync()
    const extending = new Map<string, Inset>()
    for (const [paneId, after] of motion.frames()) {
      if (paneId === arrived) continue
      const inset = extendFrom(before.get(paneId), after)
      if (inset !== null) extending.set(paneId, inset)
    }
    if (extending.size === 0) return
    this.extending = extending
    this.extendTimer = setTimeout(() => this.stopExtending(), CRT_EXTEND_MS)
  }

  /**
   * Takes a node out of the tree. A pane put in for a layout closed to nothing
   * powers on like any pane added; its id is returned so nothing else animates it.
   */
  private remove(nodeId: string): string | null {
    const fallback = fallbackNode()
    const next = closeNode(this.tree, nodeId, fallback)
    const arrived = next.root === fallback ? fallback.id : null
    if (arrived !== null) this.arriving = arrived
    this.commit(next)
    // A pane pinned while it powered off is gone: nothing is over the workspace now.
    if (this.pinnedPaneId !== null && findNode(next.root, this.pinnedPaneId) === null) this.unpin()
    return arrived
  }

  private stopExtending(): void {
    if (this.extendTimer !== null) clearTimeout(this.extendTimer)
    this.extendTimer = null
    if (this.extending.size > 0) this.extending = new Map()
  }

  /**
   * Finishes a close in progress at once: the pane powering off is removed and
   * an extension stops where it is. Every change to the tree but focus and pane
   * state calls this first; those two leave the closing pane in the tree.
   */
  settle(): void {
    this.settleFor(null)
  }

  /** Settling, with the pane in `closing` left pinned where it is (see close). */
  private settleFor(closing: string | null): void {
    this.clearZoom(closing)
    this.stopExtending()
    if (this.closeTimer !== null) clearTimeout(this.closeTimer)
    this.closeTimer = null
    const id = this.closingId
    if (id === null) return
    this.closingId = null
    this.remove(id)
  }

  closeFocused(): void {
    if (this.focusedPaneId !== null) this.close(this.focusedPaneId)
  }

  resize(splitId: string, sizes: number[]): void {
    this.settle()
    this.commit(resizeSplit(this.tree, splitId, sizes))
  }

  setPaneState(paneId: string, state: Record<string, unknown>): void {
    this.commit(setPaneState(this.tree, paneId, state))
  }

  /** Merges a change into a pane's state as it is now (see patchPaneState); undefined removes a key. */
  patchPaneState(paneId: string, patch: Record<string, unknown>): void {
    this.commit(patchPaneState(this.tree, paneId, patch))
  }

  async reset(): Promise<void> {
    // Written out first, not dropped: a save still pending belongs to the layout
    // being left, which main writes back into it before the reset clears it.
    await this.flush()
    const tree = await window.elecdex.layout.reset()
    // The default arrangement belongs to no saved layout; main has cleared it.
    this.markActive(null)
    await this.replaceTree(tree)
    await this.loadSaved()
  }

  /**
   * Panes powering off together while the whole layout is replaced, and when
   * each pane of the layout arriving powers on.
   *
   * A pane at a time has its own close (`closingId`), whose neighbours extend
   * into its room; that is wrong for a switch, where the room is not shared out
   * but handed to another arrangement. So the whole screen powers off at once
   * and the new one comes up as it does at boot, one pane after another in no
   * fixed order.
   */
  leaving = $state.raw<ReadonlySet<string>>(EMPTY_IDS)
  switchDelays = $state.raw<ReadonlyMap<string, number> | null>(null)
  /** Tells a switch still playing that a newer one has taken over. */
  private switchToken = 0

  /**
   * True while one layout is being carried away and the next brought up.
   *
   * The panes are drawn scaled and clipped through all of it, and the ones on
   * the way out are inert, so what is under a given point is not where it will
   * be when the effect ends. The workspace carries this as `data-switching` so
   * a test can wait for the screen to stand still, as it would wait for a
   * dialog to finish opening.
   */
  get switching(): boolean {
    return this.switchDelays !== null || this.leaving.size > 0
  }

  /**
   * Puts the current arrangement away and brings the given one up in its place.
   *
   * Without motion - reduced motion, the boot sequence still playing - the tree
   * is simply taken, as everything else here does.
   */
  private async replaceTree(next: LayoutTree): Promise<void> {
    const token = ++this.switchToken
    if (this.closeMotion?.animates() !== true) {
      this.leaving = EMPTY_IDS
      this.switchDelays = null
      this.adopt(next)
      return
    }

    // A pane already powering off on its own is finished first, so the two
    // effects do not run over each other.
    this.settle()
    // Every pane, not only the ones on screen: a tab group powers off as one
    // picture, and it can only tell that its turn has come if all of its tabs -
    // including the ones stacked behind - are in here.
    this.leaving = new Set(this.panes.map((node) => node.id))
    if (this.leaving.size > 0) {
      sfx.play('collapse')
      await wait(SWITCH_OFF_MS + SWITCH_GAP_MS)
      if (token !== this.switchToken) return
    }

    // The delays are set before the tree, so each pane's host finds its own as
    // it mounts - the same way the boot reveal reaches them.
    const delays = switchDelaysFor(next.root, isShellWidget)
    this.switchDelays = delays
    this.leaving = EMPTY_IDS
    this.adopt(next)
    this.playSwitchSounds(next, delays, token)

    await wait(switchRevealEnd(delays) + SWITCH_GAP_MS)
    // A newer switch owns the screen now; clearing here would cut its power-on.
    if (token === this.switchToken) this.switchDelays = null
  }

  /** One sound per moment something comes on, dropped if a newer switch starts. */
  private playSwitchSounds(
    next: LayoutTree,
    delays: ReadonlyMap<string, number>,
    token: number,
  ): void {
    const { shells, modules } = switchSoundTimes(next.root, isShellWidget, delays)
    for (const delay of shells) {
      setTimeout(() => token === this.switchToken && sfx.play('expand'), delay)
    }
    for (const delay of modules) {
      setTimeout(() => token === this.switchToken && sfx.play('panel'), delay)
    }
  }

  /** How long a pane arriving takes; the hosts style their power-on with it. */
  readonly switchOnMs = SWITCH_ON_MS

  /**
   * Arrangements the user keeps by name (shared/layouts.ts). Only the names are
   * held here: the trees stay in main until one is applied, so the page never
   * carries a dozen layouts it is not showing.
   */
  savedLayouts = $state.raw<SavedLayoutSummary[]>([])

  async loadSaved(): Promise<void> {
    try {
      this.savedLayouts = await window.elecdex.layout.saved.list()
    } catch (error) {
      // Not being able to list them costs nothing that is on screen.
      console.error('[elecdex] could not read the saved layouts', error)
    }
  }

  /**
   * Keeps the current arrangement under a name, replacing one already saved
   * under it. False when the list is full, so the caller can say so.
   */
  async saveAs(name: string): Promise<boolean> {
    // A pane still powering off is closed as far as a saved arrangement goes,
    // and a save still pending belongs to the layout being left: keeping the
    // arrangement under a new name enters that new layout, so main must have
    // the old one first. Left to the debounce, the last few hundred
    // milliseconds of work would land in one layout or the other depending on
    // how long the user took to type the name.
    await this.flush()
    const next = await this.ask((saved) => saved.save(name, this.snapshot()))
    if (next === undefined) return false
    this.savedLayouts = next
    return next.some((entry) => entry.name === name)
  }

  /**
   * Makes a saved arrangement the live one.
   *
   * The pending save is written out first rather than dropped: it holds the
   * arrangement of the layout being left, and a layout follows the work, so it
   * has to reach that layout before the workspace becomes another one.
   */
  async applySaved(id: string): Promise<boolean> {
    await this.flush()
    const tree = await this.ask((saved) => saved.apply(id))
    if (tree === null || tree === undefined) return false
    // Which layout is now being worked in, before the effect rather than after
    // it: main has already decided, and a second switch pressed while the panes
    // are still coming on asks this list which one it is in.
    this.markActive(id)
    await this.replaceTree(tree)
    await this.loadSaved()
    return true
  }

  /** Records which saved layout the workspace belongs to, as main has just said. */
  private markActive(id: string | null): void {
    if (this.savedLayouts.every((entry) => entry.active === (entry.id === id))) return
    this.savedLayouts = this.savedLayouts.map((entry) => ({
      ...entry,
      active: entry.id === id,
    }))
  }

  /**
   * Goes to a saved layout, asking first when shells would end by it.
   *
   * This is the way in for everything that switches - the number shortcuts, the
   * buttons in the status bar, the dialog - so the question is asked once, in
   * one place, whichever of them was used. The layout already being worked in is
   * not re-applied: there would be nothing to see but the effect.
   */
  async switchTo(id: string): Promise<boolean> {
    const entry = this.savedLayouts.find((layout) => layout.id === id)
    // A switch still playing is not a reason to refuse: pressing 1 then 2 must
    // end at 2, and `replaceTree` hands the screen to whichever came last.
    if (entry === undefined || entry.active) return false
    const shells = this.panes.filter((node) => node.widget === 'terminal').length
    if (shells > 0 && appearance.settings.layout.confirmSwitch) {
      const go = await ui.askLayoutSwitch({ name: entry.name, shells })
      if (!go) return false
    }
    return this.applySaved(id)
  }

  async removeSaved(id: string): Promise<void> {
    await this.change((saved) => saved.remove(id))
  }

  /** Renames one; the name it keeps is whatever comes back. */
  async renameSaved(id: string, name: string): Promise<void> {
    await this.change((saved) => saved.rename(id, name))
  }

  /** Moves one up or down the list, which is what the number shortcuts follow. */
  async moveSaved(id: string, delta: number): Promise<void> {
    await this.change((saved) => saved.move(id, delta))
  }

  /**
   * Runs a change to the list and takes the list it answers with. A failure
   * leaves the list as it is: main is the one that decides what is saved, and
   * a dialog showing the old list is better than one showing a guess.
   */
  private async change(
    run: (saved: SavedLayoutsApi) => Promise<SavedLayoutSummary[]>,
  ): Promise<void> {
    const next = await this.ask(run)
    if (next !== undefined) this.savedLayouts = next
  }

  /** Asks main about the saved layouts; undefined when it could not be reached. */
  private async ask<T>(run: (saved: SavedLayoutsApi) => Promise<T>): Promise<T | undefined> {
    try {
      return await run(window.elecdex.layout.saved)
    } catch (error) {
      console.error('[elecdex] a saved layout could not be changed', error)
      toasts.show({
        title: 'the saved layouts could not be changed',
        body: 'Nothing was saved. The list on screen is the one on disk.',
        tone: 'danger',
      })
      return undefined
    }
  }

  /** The layout being worked in: what the workspace is written back into. */
  readonly activeLayout = $derived(this.savedLayouts.find((entry) => entry.active) ?? null)

  /**
   * Switches the focused pane's tab group to its next or previous tab. Returns
   * false when the focused pane is not tabbed, so the key can go to the pane.
   */
  cycleTab(delta: number): boolean {
    return this.cycleTo((from) => neighbourTab(this.tree.root, from, delta))
  }

  /**
   * Focuses the next or previous shell pane or group of shell tabs, when a shell
   * has focus and there is another; false otherwise, so the key goes to the shell.
   */
  cycleShell(delta: number): boolean {
    return this.cycleTo((from) =>
      neighbourShell(this.tree.root, from, delta, (w) => w === 'terminal'),
    )
  }

  /**
   * Focuses the neighbour `find` gives for the focused pane, or returns false when
   * there is none, leaving the key - and a close in progress - alone. A move does
   * finish a close first, and the neighbour is found again in the tree it leaves,
   * since the one found before may have been the pane that closed.
   */
  private cycleTo(find: (from: string) => string | null): boolean {
    const neighbour = () => (this.focusedPaneId === null ? null : find(this.focusedPaneId))
    if (neighbour() === null) return false
    this.settle()
    const next = neighbour()
    if (next === null) return false
    this.focus(next)
    return true
  }

  /**
   * The shell to focus from the keyboard: the one last used if it is showing,
   * else the first showing, else the last used even though it is in a hidden tab
   * (focusing brings that tab forward). Null when the layout has no shell.
   */
  shellToFocus(): string | null {
    const shown = this.shown.filter((p) => p.widget === 'terminal')
    return (
      shown.find((p) => p.id === this.lastTerminalId)?.id ?? shown[0]?.id ?? this.followedTerminalId
    )
  }

  /** Moves focus to the next or previous visible pane, in tree order. */
  cycleFocus(delta: number): void {
    const order = this.shown
    if (order.length === 0) return
    const current = order.findIndex((p) => p.id === this.focusedPaneId)
    const from = current === -1 ? 0 : current
    const next = order[(from + delta + order.length) % order.length]
    if (next) this.focus(next.id)
  }
}

export const layout = new LayoutStore()

/** The pane to keep focused in `tree`: `current` while it is still there, else the first shown. */
function focusIn(tree: LayoutTree, current: string | null): string | null {
  if (current === null || findNode(tree.root, current) !== null) return current
  return visiblePanes(tree.root)[0]?.id ?? null
}

/**
 * The pane focused when a layout is loaded: the first visible shell, so the app
 * starts ready to type into, or the first visible pane when there is no shell.
 */
function initialFocus(tree: LayoutTree): string | null {
  const panes = visiblePanes(tree.root)
  return (panes.find((p) => p.widget === 'terminal') ?? panes[0])?.id ?? null
}
