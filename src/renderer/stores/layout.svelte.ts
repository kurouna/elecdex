import { defaultLayoutNode } from '@shared/default-layout'
import { type Direction, neighboursToward } from '@shared/layout-direction'
import {
  addTab,
  closeNode,
  collectPanes,
  findNode,
  findTabsContaining,
  focusTab,
  isShellWidget,
  moveNode,
  moveTabTo,
  type NodePlace,
  neighbourShell,
  neighbourTab,
  type Placement,
  pane,
  patchPaneState,
  placeFirst,
  placeOf,
  putBack,
  resizeSplit,
  SHELL_WIDGET,
  setPaneState,
  splitPane,
  visiblePanes,
  wrapAround,
} from '@shared/layout-ops'
import {
  LAYOUT_VERSION,
  type LayoutNode,
  type LayoutTree,
  type PaneNode,
  type SplitDirection,
  type TabsNode,
} from '@shared/schemas/layout'
import { flushSync } from 'svelte'
import type { Frame } from '../layout/geometry.ts'
import { switchDelaysFor, switchRevealEnd } from '../layout/layout-switch.ts'
import { reflowOf } from '../layout/pane-reflow.ts'
import { revealSoundTimes } from '../lib/boot-sequence.ts'
import { CLOSE_SETTLE_MS, SWITCH_GAP_MS, SWITCH_OFF_MS, SWITCH_ON_MS } from '../lib/crt-timing.ts'
import { resolveWidget } from '../widgets/registry.ts'
import { appearance } from './appearance.svelte.ts'
import { PaneEffects } from './pane-effects.svelte.ts'
import { PaneZoom } from './pane-zoom.svelte.ts'
import { SavedLayouts } from './saved-layouts.svelte.ts'
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
/** One empty list, so a derived that has nothing to hold stays the same value. */
const EMPTY_PANES: readonly PaneNode[] = []

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/** How long a closed pane can be put back from its toast. */
const UNDO_CLOSE_MS = 6000

/** The last close, while it can be put back: what it took, and where that sat. */
interface ClosedPanes {
  node: PaneNode | TabsNode
  place: NodePlace
  focused: string | null
  panes: readonly PaneNode[]
  toast: number
}

/** Where a pane added from the picker goes, relative to the focused pane. */
export type PanePlacement = 'right' | 'down' | 'tab'

/**
 * What the effects of a change of layout need from the page - a close, a move, a
 * split, a tab shown - given by the workspace: this store cannot ask the boot or
 * appearance stores itself (boot imports it) and has no DOM of its own.
 */
export interface CloseMotion {
  /** Whether a change may animate now: motion is not reduced and the boot is over. */
  animates(): boolean
  /** The box of every shown pane's frame, by pane id. */
  frames(): Map<string, Frame>
}

class LayoutStore {
  tree = $state<LayoutTree>({ version: LAYOUT_VERSION, root: defaultLayoutNode() })
  /** Pane that has focus. Drives which terminal receives keystrokes. */
  focusedPaneId = $state<string | null>(null)
  loaded = $state(false)

  readonly panes = $derived(collectPanes(this.tree.root))
  /**
   * Every pane's id in tree order, as one string: unlike `panes`, a new array on
   * every change to the tree, it changes only when a pane comes or goes. The
   * workspace's shell reaper waits on it, so a divider dragged, a tab clicked or
   * a pane's state written does not keep putting the reaper off.
   */
  readonly paneIds = $derived(this.panes.map((p) => p.id).join(' '))
  readonly visible = $derived(visiblePanes(this.tree.root))
  /**
   * The panes powering off: the one closing, or every tab of a group closed as a
   * whole - whose id is the group's, never one of its panes'.
   */
  private readonly closingPanes = $derived.by(() => {
    const node = this.closingId === null ? null : findNode(this.tree.root, this.closingId)
    return new Set(node === null ? [] : collectPanes(node).map((p) => p.id))
  })
  /** The visible panes that stay: what the keyboard can move to. */
  private readonly shown = $derived(this.visible.filter((p) => !this.closingPanes.has(p.id)))

  /** The terminal pane focused most recently, as remembered by focus(). */
  private lastTerminalId = $state<string | null>(null)

  /**
   * The terminal that follow-the-shell widgets track: the last one focused if it
   * still exists, else the first in the layout - so the file browser follows the
   * shell the user is working in, and keeps doing so while they click around it.
   * A shell powering off is already gone for them, as it is for the keyboard.
   */
  readonly followedTerminalId = $derived.by(() => {
    const terminals = this.panes.filter(
      (p) => isShellWidget(p.widget) && !this.closingPanes.has(p.id),
    )
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
  private closeTimer: ReturnType<typeof setTimeout> | null = null

  /** What the panes play once a change has happened to them (stores/pane-effects.svelte.ts). */
  readonly effects = new PaneEffects()

  /** The last close, while its toast can still put it back (see undoClose). */
  #closed = $state.raw<ClosedPanes | null>(null)
  /**
   * The panes the last close took, while it can be undone: the workspace's reaper
   * counts their shells as still claimed, so putting a shell back finds its
   * session. Empty once the toast has gone, which lets the reaper look again.
   */
  readonly undoablePanes = $derived.by((): readonly PaneNode[] => {
    const closed = this.#closed
    if (closed === null || !toasts.items.some((toast) => toast.id === closed.toast)) {
      return EMPTY_PANES
    }
    return closed.panes
  })

  /** The pane brought to the front, if any (stores/pane-zoom.svelte.ts). */
  readonly zoom: PaneZoom = new PaneZoom({
    tree: () => this.tree,
    settle: () => this.settle(),
    focus: (paneId) => this.focus(paneId),
  })

  /** The arrangements kept by name (stores/saved-layouts.svelte.ts). */
  readonly saved: SavedLayouts = new SavedLayouts({
    flush: () => this.flush(),
    snapshot: () => this.snapshot(),
    replaceTree: (tree) => this.replaceTree(tree),
    mayReplace: (name) => this.mayReplace(name),
  })

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
    this.dropUndo()
    this.tree = tree
    this.zoom.clear()
    this.effects.stop()
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
      .then(
        () => {
          this.saveFailing = false
        },
        (error: unknown) => {
          // Surface it: a save that fails quietly loses the user's layout on next launch.
          console.error('[elecdex] failed to save layout', error)
          this.warnSaveFailed()
        },
      )
      .then(() => {
        if (this.saving === done) this.saving = null
      })
    this.saving = done
    return done
  }

  /** The save in flight, if any. */
  private saving: Promise<void> | null = null
  /** True from a failed save until one goes through, so the user is told once, not per save. */
  private saveFailing = false

  private warnSaveFailed(): void {
    if (this.saveFailing) return
    this.saveFailing = true
    toasts.show({
      title: 'could not save the layout',
      body: 'Changes to the arrangement may be lost when elecdex closes. Every change tries again.',
      tone: 'danger',
    })
  }

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

  /**
   * Gives a pane the keyboard, bringing its tab to the front of its group - which
   * then flickers on. `fromKeys` when a shortcut moved it there: the pane's frame
   * flares once, so the eye finds where the keyboard went.
   */
  focus(paneId: string, fromKeys = false): void {
    if (this.closingPanes.has(paneId)) return
    const node = findNode(this.tree.root, paneId)
    if (node === null) return
    this.zoom.follow(paneId)
    this.focusedPaneId = paneId
    if (node.kind === 'pane' && isShellWidget(node.widget)) this.lastTerminalId = paneId
    const next = focusTab(this.tree, paneId)
    const animates = this.closeMotion?.animates() === true
    if (next !== this.tree && animates) this.effects.flash(paneId)
    this.commit(next)
    if (fromKeys && animates) this.effects.flare(paneId)
  }

  split(
    paneId: string,
    direction: SplitDirection,
    widget: string,
    state?: Record<string, unknown>,
  ): void {
    this.insert(widget, state, 'expand', (incoming) =>
      splitPane(this.tree, paneId, direction, incoming),
    )
  }

  /** Splits the focused pane; in an empty layout, adds the first pane. */
  splitFocused(direction: SplitDirection, widget?: string): void {
    this.besideFocused(widget, (target, chosen) => this.split(target, direction, chosen))
  }

  addTab(siblingPaneId: string, widget: string, state?: Record<string, unknown>): void {
    this.insert(widget, state, 'folder', (incoming) => addTab(this.tree, siblingPaneId, incoming))
  }

  addTabToFocused(widget?: string): void {
    this.besideFocused(widget, (target, chosen) => this.addTab(target, chosen))
  }

  /**
   * Adds a new pane of `widget` with the op `place` gives: it powers on, takes
   * focus and is heard. A target that has gone - it may have gone with the close
   * just settled - adds nothing, so nothing is focused, powered on or heard
   * either: focus on a pane that was never made would leave every key for the
   * focused pane dead.
   */
  private insert(
    widget: string,
    state: Record<string, unknown> | undefined,
    sound: 'expand' | 'folder',
    place: (incoming: PaneNode) => LayoutTree,
  ): void {
    this.settle()
    const incoming = pane(widget, state === undefined ? {} : { state })
    const next = place(incoming)
    if (next === this.tree) return
    const before = this.framesBefore()
    this.arriving = incoming.id
    this.commit(next)
    this.focusedPaneId = incoming.id
    sfx.play(sound)
    // The new pane powers on by itself; the ones it took room from light the edges that came in.
    this.reflow(before, undefined, new Set([incoming.id]))
  }

  /**
   * Adds a pane beside the focused one through `add`: of `widget`, or of the
   * focused pane's own widget when none is named. An empty layout has nothing to
   * go beside, so the new pane is its first.
   */
  private besideFocused(
    widget: string | undefined,
    add: (target: string, widget: string) => void,
  ): void {
    const target = this.focusedPaneId
    if (target === null) {
      this.addFirst(widget ?? SHELL_WIDGET)
      return
    }
    const current = findNode(this.tree.root, target)
    add(target, widget ?? (current?.kind === 'pane' ? current.widget : SHELL_WIDGET))
  }

  /**
   * Adds a pane of `widget` beside the focused pane (or the first visible one),
   * to its right, below it, or as a tab in its group - with `state` to start
   * from, for a picker row that opens a widget a way of its own (registry.ts
   * `variants`).
   */
  addPane(widget: string, placement: PanePlacement, state?: Record<string, unknown>): void {
    const target = this.focusedPaneId ?? this.visible[0]?.id ?? null
    if (target === null) {
      this.addFirst(widget, state)
      return
    }
    if (placement === 'tab') this.addTab(target, widget, state)
    else this.split(target, placement === 'right' ? 'right' : 'down', widget, state)
  }

  /**
   * The first pane of an empty layout, filling the workspace; nothing when the
   * layout has panes (or one is still powering off), since a pane then goes
   * beside one of them.
   */
  addFirst(widget: string, state?: Record<string, unknown>): void {
    this.insert(widget, state, 'expand', (incoming) => placeFirst(this.tree, incoming))
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
    const ends = this.settleKeeping(nodeId, targetId)
    if (ends === null) return
    this.applyMove(moveNode(this.tree, ends.node, ends.target, placement), ends.node)
  }

  /**
   * Moves a pane, or a whole group's tabs, into a strip at the gap `index`:
   * dragging a tab along the strip it is in, or into another group's.
   */
  moveTab(nodeId: string, targetId: string, index: number): void {
    // The gap was found in the strip as drawn, with any tab powering off still in it.
    const strip = findNode(this.tree.root, targetId)
    const before = strip?.kind === 'tabs' ? strip.children.slice(0, index) : []
    const gap = index - before.filter((child) => this.closingPanes.has(child.id)).length
    const ends = this.settleKeeping(nodeId, targetId)
    if (ends === null) return
    this.applyMove(moveTabTo(this.tree, ends.node, ends.target, gap), ends.node)
  }

  /**
   * Finishes a close in progress for a move, and finds both its ends again in the tree
   * that leaves (`remainsOf`): a pair of tabs one of which powered off is now its other
   * tab, which the drag meant as much as the group. Null when either end has gone.
   */
  private settleKeeping(nodeId: string, targetId: string): { node: string; target: string } | null {
    const node = findNode(this.tree.root, nodeId)
    const target = findNode(this.tree.root, targetId)
    this.settle()
    const nodeNow = node === null ? null : this.remainsOf(node)
    const targetNow = target === null ? null : this.remainsOf(target)
    return nodeNow === null || targetNow === null
      ? null
      : { node: nodeNow.id, target: targetNow.id }
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
    const before = this.framesBefore()
    const fromGroup = this.groupOf(nodeId)
    // A whole group dropped among another's tabs leaves its id behind: what moved is then
    // the tab it brought first, which that group now shows.
    const asked = findNode(this.tree.root, nodeId)
    const lead = asked?.kind === 'tabs' ? asked.children[0]?.id : undefined
    this.commit(next)
    const moved =
      findNode(next.root, nodeId) ?? (lead === undefined ? null : findNode(next.root, lead))
    const shown = moved === null ? undefined : visiblePanes(moved)[0]
    if (shown) this.focus(shown.id)
    sfx.play('expand')
    if (shown === undefined) {
      this.reflow(before)
      return
    }
    // A pane that joined a group of others is drawn in that group's frame, which
    // stayed where it was: the pane flickers on there, as a tab shown does,
    // rather than flying the whole group in from where the pane used to be.
    const group = findTabsContaining(next.root, shown.id)
    if (group === null || moved?.kind === 'tabs') {
      this.reflow(before, new Set([shown.id]))
      return
    }
    this.reflow(before, undefined, new Set([shown.id]))
    if (before !== null && fromGroup !== group.id) this.effects.flash(shown.id)
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
    const asked = findNode(this.tree.root, nodeId)
    // Closed from the front: it keeps the room it was pinned in to power off in.
    // A group closed with its shown tab in front does the same, pinned by that tab.
    const zoomed = this.zoom.paneId
    const inFront =
      zoomed !== null &&
      (zoomed === nodeId || (asked?.kind === 'tabs' && findNode(asked, zoomed) !== null))
    this.settleFor(inFront ? zoomed : null)
    // Found again in the tree the settle left, which may no longer hold it.
    const node = asked === null ? null : this.remainsOf(asked)
    if (node === null) return
    const id = node.id
    sfx.play('collapse')
    this.offerUndo(node)
    // A group is always on screen; a pane is not when it is a tab behind another.
    const shown = node.kind === 'tabs' || this.visible.some((p) => p.id === id)
    if (!shown || this.closeMotion?.animates() !== true) {
      this.remove(id)
      return
    }
    this.closingId = id
    this.focusedPaneId = focusIn(closeNode(this.tree, id), this.focusedPaneId)
    this.closeTimer = setTimeout(() => this.finishClosing(), CLOSE_SETTLE_MS)
  }

  /**
   * What is left now of a node asked to close before a close in progress was
   * finished: the node itself, or - for a pair of tabs that finishing it has
   * collapsed into its other tab - that tab, since closing the group meant every
   * tab. Null when it has gone altogether.
   */
  private remainsOf(asked: LayoutNode): LayoutNode | null {
    const now = findNode(this.tree.root, asked.id)
    if (now !== null || asked.kind !== 'tabs') return now
    const left = asked.children.filter((child) => findNode(this.tree.root, child.id) !== null)
    return left.length === 1 ? (left[0] ?? null) : null
  }

  /** The power-off has played: remove the pane and uncover what took its room. */
  private finishClosing(): void {
    const id = this.closingId
    const motion = this.closeMotion
    this.closeTimer = null
    this.closingId = null
    if (id === null) return
    const before = motion?.frames() ?? null
    this.remove(id)
    this.reflow(before)
  }

  /** Every shown pane's frame now, when the change about to be made may play; else null. */
  private framesBefore(): Map<string, Frame> | null {
    const motion = this.closeMotion
    return motion?.animates() === true ? motion.frames() : null
  }

  /**
   * After a change to the tree: lets Svelte lay the new tree out, measures every
   * pane again and plays what the change did to each (layout/pane-reflow.ts) -
   * `moved` fly in, `fresh` play nothing here, the rest extend or light their edges.
   */
  private reflow(
    before: Map<string, Frame> | null,
    moved?: ReadonlySet<string>,
    fresh?: ReadonlySet<string>,
  ): void {
    const motion = this.closeMotion
    if (before === null || motion === null) return
    // Svelte applies the new tree on its next flush; measure after it, not before.
    flushSync()
    this.effects.play(reflowOf(before, motion.frames(), moved, fresh))
  }

  /** Takes a node out of the tree; the last pane closed leaves the empty layout. */
  private remove(nodeId: string): void {
    const next = closeNode(this.tree, nodeId)
    this.commit(next)
    this.zoom.dropGone(next)
  }

  /**
   * Says a close in a toast that can put it back, for a few seconds: what it took
   * is kept, with where it sat (`placeOf`), and the reaper leaves its shells be
   * meanwhile. Only the last close is kept. Kept by its place rather than as the
   * tree it was in, so what changes in the meantime - a divider moved, a tab
   * shown, a pane added - is not undone with it.
   */
  private offerUndo(node: LayoutNode): void {
    this.dropUndo()
    if (node.kind === 'split') return
    const panes = collectPanes(node)
    const place = placeOf(this.tree, node.id) ?? { kind: 'root' }
    const name =
      node.kind === 'pane'
        ? (resolveWidget(node.widget)?.title ?? node.widget)
        : `${panes.length} tabs`
    const toast = toasts.show({
      title: `${name} closed`,
      timeoutMs: UNDO_CLOSE_MS,
      actions: [{ label: 'undo', primary: true, run: () => this.undoClose() }],
    })
    this.#closed = { node, place, focused: this.focusedPaneId, panes, toast }
  }

  /** Lets go of the last close, and of its toast. */
  private dropUndo(): void {
    const closed = this.#closed
    if (closed === null) return
    this.#closed = null
    toasts.dismiss(closed.toast)
  }

  /**
   * Puts the last close back where it sat (`putBack`): beside its old neighbour
   * with its old share of their room, or among its old tabs. The panes put back
   * power on as new ones do, and the ones that give them room light their edges.
   */
  undoClose(): void {
    const closed = this.#closed
    this.#closed = null
    // Only while its toast is up: a close no longer offered is no longer kept.
    if (closed === null || !toasts.items.some((toast) => toast.id === closed.toast)) return
    const powering = this.closingId !== null
    this.settle()
    // Undone while it powered off, the pane's host is still mounted: let it go first, so
    // the pane put back mounts afresh and powers on - else the same host stayed, nothing
    // asked `arrived`, and the pane powered on as new the next time a move remounted it.
    if (powering) flushSync()
    const before = this.framesBefore()
    const restored = putBack(this.tree, closed.node, closed.place)
    const back = new Set(closed.panes.map((node) => node.id))
    // The keyboard goes back only to a pane the close took it from, its tab brought to the
    // front: one that was elsewhere stays where it is now, which may be another tab since shown.
    const focused = closed.focused !== null && back.has(closed.focused) ? closed.focused : null
    const tree = focused === null ? restored : focusTab(restored, focused)
    this.arriving = visiblePanes(tree.root).find((node) => back.has(node.id))?.id ?? null
    this.commit(tree)
    if (focused !== null) this.focusedPaneId = focused
    sfx.play('expand')
    // Its toast goes with it, however it was asked for.
    toasts.dismiss(closed.toast)
    this.reflow(before, undefined, back)
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
    this.zoom.clear(closing)
    this.effects.stop()
    if (this.closeTimer !== null) clearTimeout(this.closeTimer)
    this.closeTimer = null
    const id = this.closingId
    if (id === null) return
    this.closingId = null
    this.remove(id)
  }

  /**
   * Ctrl+Shift+W. A pane that is forward is the one meant - the rest are behind the backdrop -
   * and since its corner has no × then (PaneCorner.svelte), this is how it is closed.
   */
  closeFocused(): void {
    const target = this.zoom.paneId ?? this.focusedPaneId
    if (target !== null) this.close(target)
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
    let tree: LayoutTree
    try {
      tree = await window.elecdex.layout.reset()
    } catch (error) {
      // The workspace stays as it is: main did not reset it, so nothing on screen changes.
      console.error('[elecdex] could not reset the layout', error)
      toasts.show({
        title: 'could not reset the layout',
        body: 'The workspace is as it was.',
        tone: 'danger',
      })
      return
    }
    // The default arrangement belongs to no saved layout; main has cleared it.
    this.saved.markActive(null)
    await this.replaceTree(tree)
    await this.saved.load()
  }

  /**
   * The reset the keyboard asks for: like a switch, it ends every shell, so it
   * asks the same question first (`mayReplace`); the buttons ask by needing a
   * second click. True when it went ahead.
   */
  async confirmReset(): Promise<boolean> {
    if (!(await this.mayReplace('the default layout', true))) return false
    await this.reset()
    return true
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
    const { shells, modules } = revealSoundTimes(next.root, isShellWidget, delays)
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
   * Whether the workspace may be replaced by the layout of that name: asked
   * while shells are open, which the replacement would end, and settings have
   * not turned the question off. Also the question a preset asks before it is
   * added (layout/presets.ts), so both ways in say the same thing.
   */
  async mayReplace(name: string, reset = false): Promise<boolean> {
    const shells = this.panes.filter((node) => isShellWidget(node.widget)).length
    if (shells === 0 || !appearance.settings.layout.confirmSwitch) return true
    return ui.askLayoutSwitch(reset ? { name, shells, reset } : { name, shells })
  }

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
    return this.cycleTo((from) => neighbourShell(this.tree.root, from, delta, isShellWidget), true)
  }

  /**
   * Focuses the pane lying `direction` from the focused one (shared/layout-direction.ts);
   * false when none does, so the key goes to the pane.
   */
  focusToward(direction: Direction): boolean {
    return this.cycleTo((from) => this.neighboursOf(from)[direction], true)
  }

  /** The pane lying each way from `paneId`, one powering off not counted (it is going). */
  neighboursOf(paneId: string): Record<Direction, string | null> {
    return neighboursToward(this.tree.root, paneId, this.closingId)
  }

  /**
   * Focuses the neighbour `find` gives for the focused pane, or returns false when
   * there is none, leaving the key - and a close in progress - alone. A move does
   * finish a close first, and the neighbour is found again in the tree it leaves,
   * since the one found before may have been the pane that closed. Moving focus
   * is not a change to the tree, so a pane forward is left for `focus` to deal
   * with: flown back as every other way back does, or taken along to another tab
   * of its group. (While a close is in progress nothing is forward: bringing a
   * pane forward settles first.)
   */
  private cycleTo(find: (from: string) => string | null, flare = false): boolean {
    const neighbour = () => (this.focusedPaneId === null ? null : find(this.focusedPaneId))
    if (neighbour() === null) return false
    if (this.closingId !== null) this.settle()
    else this.effects.stop()
    const next = neighbour()
    if (next === null) return false
    this.focus(next, flare)
    return true
  }

  /**
   * The shell to focus from the keyboard: the one last used if it is showing,
   * else the first showing, else the last used even though it is in a hidden tab
   * (focusing brings that tab forward). Null when the layout has no shell.
   */
  shellToFocus(): string | null {
    const shown = this.shown.filter((p) => isShellWidget(p.widget))
    return (
      shown.find((p) => p.id === this.lastTerminalId)?.id ?? shown[0]?.id ?? this.followedTerminalId
    )
  }

  /** Moves focus to the next or previous visible pane, in tree order. */
  cycleFocus(delta: number): void {
    const order = this.shown
    if (order.length === 0) return
    const current = order.findIndex((p) => p.id === this.focusedPaneId)
    // From no pane, forward starts at the first and back at the last.
    const next =
      current === -1 ? order[delta > 0 ? 0 : order.length - 1] : wrapAround(order, current, delta)
    if (next) this.focus(next.id, true)
  }
}

export const layout = new LayoutStore()

/**
 * The pane to keep focused in `tree`: `current` while it is still there, else the first shown.
 * A tab that a change put behind another - a closed tab put back in front of it - hands the
 * keyboard to the tab now in front, so the keys never go to a pane that is not on screen.
 */
function focusIn(tree: LayoutTree, current: string | null): string | null {
  if (current === null) return null
  if (findNode(tree.root, current) === null) return visiblePanes(tree.root)[0]?.id ?? null
  const group = findTabsContaining(tree.root, current)
  return group === null ? current : (group.children[group.activeIndex]?.id ?? current)
}

/**
 * The pane focused when a layout is loaded: the first visible shell, so the app
 * starts ready to type into, or the first visible pane when there is no shell.
 */
function initialFocus(tree: LayoutTree): string | null {
  const panes = visiblePanes(tree.root)
  return (panes.find((p) => isShellWidget(p.widget)) ?? panes[0])?.id ?? null
}
