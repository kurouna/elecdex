import { defaultLayoutNode, fallbackNode } from '@shared/default-layout'
import {
  addTab,
  closeNode,
  collectPanes,
  findNode,
  focusTab,
  moveNode,
  neighbourShell,
  neighbourTab,
  type Placement,
  pane,
  resizeSplit,
  setPaneState,
  splitPane,
  visiblePanes,
} from '@shared/layout-ops'
import { LAYOUT_VERSION, type LayoutTree, type SplitDirection } from '@shared/schemas/layout'
import { flushSync } from 'svelte'
import {
  CLOSE_SETTLE_MS,
  CRT_EXTEND_MS,
  extendFrom,
  type Frame,
  type Inset,
} from '../layout/pane-close.ts'
import { sfx } from './sound.svelte.ts'

/**
 * The live layout.
 *
 * Every mutation goes through a shared pure operation, so the invariants are
 * enforced in one place and are unit-tested without a DOM. Saves are debounced
 * because a drag produces a resize event per frame.
 */

const SAVE_DEBOUNCE_MS = 400

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
    const tree = await window.elecdex.layout.load()
    this.tree = tree
    this.loaded = true
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
    if (this.saveTimer !== null) clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null
      window.elecdex.layout.save(this.snapshot()).catch((error: unknown) => {
        // Surface it: a save that fails quietly loses the user's layout on next launch.
        console.error('[elecdex] failed to save layout', error)
      })
    }, SAVE_DEBOUNCE_MS)
  }

  /**
   * Writes a pending save immediately, for teardown where the debounce would be
   * lost. Does nothing when no change is pending: writing the in-memory tree
   * unconditionally on every reload or close would overwrite a layout.json the
   * user had edited by hand while the app was running.
   */
  async flush(): Promise<void> {
    // A pane powering off is closed as far as the saved layout is concerned.
    this.settle()
    if (this.saveTimer === null) return
    clearTimeout(this.saveTimer)
    this.saveTimer = null
    await window.elecdex.layout.save(this.snapshot())
  }

  focus(paneId: string): void {
    if (paneId === this.closingId) return
    const node = findNode(this.tree.root, paneId)
    if (node === null) return
    this.focusedPaneId = paneId
    if (node.kind === 'pane' && node.widget === 'terminal') this.lastTerminalId = paneId
    this.commit(focusTab(this.tree, paneId))
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
    const next = moveNode(this.tree, nodeId, targetId, placement)
    if (next === this.tree) return
    this.commit(next)
    const moved = findNode(next.root, nodeId)
    const shown = moved === null ? null : visiblePanes(moved)[0]
    if (shown) this.focus(shown.id)
    sfx.play('expand')
  }

  /** Whether moving `nodeId` to `targetId` with `placement` would change the layout. */
  canMove(nodeId: string, targetId: string, placement: Placement): boolean {
    return moveNode(this.tree, nodeId, targetId, placement) !== this.tree
  }

  /**
   * Closes a pane: a shown one powers off first and is removed after, when the
   * panes left behind extend into its room; anything else goes at once. Focus
   * moves on straight away, so the keyboard is never left with a closing pane.
   */
  close(nodeId: string): void {
    // Its tab's × still takes a click while it powers off; that is the same close.
    if (nodeId === this.closingId) return
    this.settle()
    if (findNode(this.tree.root, nodeId) === null) return
    sfx.play('collapse')
    const shown = this.visible.some((p) => p.id === nodeId)
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

  async reset(): Promise<void> {
    this.settle()
    if (this.saveTimer !== null) {
      clearTimeout(this.saveTimer)
      this.saveTimer = null
    }
    this.tree = await window.elecdex.layout.reset()
    this.focusedPaneId = initialFocus(this.tree)
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
