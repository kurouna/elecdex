import { defaultLayoutNode, fallbackNode } from '@shared/default-layout'
import {
  addTab,
  closeNode,
  collectPanes,
  findNode,
  focusTab,
  moveNode,
  neighbourTab,
  type Placement,
  pane,
  resizeSplit,
  setPaneState,
  splitPane,
  visiblePanes,
} from '@shared/layout-ops'
import { LAYOUT_VERSION, type LayoutTree, type SplitDirection } from '@shared/schemas/layout'
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

class LayoutStore {
  tree = $state<LayoutTree>({ version: LAYOUT_VERSION, root: defaultLayoutNode() })
  /** Pane that has focus. Drives which terminal receives keystrokes. */
  focusedPaneId = $state<string | null>(null)
  loaded = $state(false)

  readonly panes = $derived(collectPanes(this.tree.root))
  readonly visible = $derived(visiblePanes(this.tree.root))

  /** The terminal pane focused most recently, as remembered by focus(). */
  private lastTerminalId = $state<string | null>(null)

  /**
   * The terminal that follow-the-shell widgets track: the last one focused if it
   * still exists, else the first in the layout - so the file browser follows the
   * shell the user is working in, and keeps doing so while they click around it.
   */
  readonly followedTerminalId = $derived.by(() => {
    const terminals = this.panes.filter((p) => p.widget === 'terminal')
    return terminals.find((p) => p.id === this.lastTerminalId)?.id ?? terminals[0]?.id ?? null
  })

  private saveTimer: ReturnType<typeof setTimeout> | null = null

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

    // Keep focus on something that still exists.
    if (this.focusedPaneId !== null && findNode(next.root, this.focusedPaneId) === null) {
      this.focusedPaneId = visiblePanes(next.root)[0]?.id ?? null
    }

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
    if (this.saveTimer === null) return
    clearTimeout(this.saveTimer)
    this.saveTimer = null
    await window.elecdex.layout.save(this.snapshot())
  }

  focus(paneId: string): void {
    const node = findNode(this.tree.root, paneId)
    if (node === null) return
    this.focusedPaneId = paneId
    if (node.kind === 'pane' && node.widget === 'terminal') this.lastTerminalId = paneId
    this.commit(focusTab(this.tree, paneId))
  }

  split(paneId: string, direction: SplitDirection, widget: string): void {
    const incoming = pane(widget)
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
    const incoming = pane(widget)
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

  close(nodeId: string): void {
    this.commit(closeNode(this.tree, nodeId, fallbackNode()))
    sfx.play('collapse')
  }

  closeFocused(): void {
    if (this.focusedPaneId !== null) this.close(this.focusedPaneId)
  }

  resize(splitId: string, sizes: number[]): void {
    this.commit(resizeSplit(this.tree, splitId, sizes))
  }

  setPaneState(paneId: string, state: Record<string, unknown>): void {
    this.commit(setPaneState(this.tree, paneId, state))
  }

  async reset(): Promise<void> {
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
    if (this.focusedPaneId === null) return false
    const next = neighbourTab(this.tree.root, this.focusedPaneId, delta)
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
    const shown = this.visible.filter((p) => p.widget === 'terminal')
    return (
      shown.find((p) => p.id === this.lastTerminalId)?.id ?? shown[0]?.id ?? this.followedTerminalId
    )
  }

  /** Moves focus to the next or previous visible pane, in tree order. */
  cycleFocus(delta: number): void {
    const order = this.visible
    if (order.length === 0) return
    const current = order.findIndex((p) => p.id === this.focusedPaneId)
    const from = current === -1 ? 0 : current
    const next = order[(from + delta + order.length) % order.length]
    if (next) this.focus(next.id)
  }
}

export const layout = new LayoutStore()

/**
 * The pane focused when a layout is loaded: the first visible shell, so the app
 * starts ready to type into, or the first visible pane when there is no shell.
 */
function initialFocus(tree: LayoutTree): string | null {
  const panes = visiblePanes(tree.root)
  return (panes.find((p) => p.widget === 'terminal') ?? panes[0])?.id ?? null
}
