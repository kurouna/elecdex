import { z } from 'zod'
import { isGlobal, KEYBINDING_ACTIONS, type KeybindingAction } from './keybindings.js'
import type { Direction } from './layout-direction.js'

/**
 * Whether a shortcut applies right now (issue 20).
 *
 * Some shortcuts do something only in some states - the tab keys only in a tab group, a
 * saved layout's key only when that slot holds one, an arrow only when a pane lies that
 * way - and otherwise leave the key to the focused pane: a shell selects by word with
 * Ctrl+Shift+Arrow, a web page zooms with Ctrl+Shift+=. The workspace asks this before running an action, and the same answer
 * tells main which keys a focused web page may keep, so the two can never disagree.
 */

/** What the workspace is like, as far as the conditional shortcuts care. */
export interface ShortcutFacts {
  /** The focused pane is a shell. */
  focusedIsShell: boolean
  /** The pane brought forward, or else the focused one, is a widget that can be brought forward. */
  zoomable: boolean
  /** How many saved layouts there are: the number keys are the first ten. */
  savedCount: number
  /** The layout holds a shell pane. */
  anyShell: boolean
  /** There is a shell the keys could go to (the layout's `shellToFocus`). */
  shellToFind: boolean
  /** The focused pane is in a tab group of two or more. */
  inTabGroup: boolean
  /** The focused pane is a shell and there is another shell to go to. */
  otherShell: boolean
  /** Which ways from the focused pane another pane lies (shared/layout-direction.ts). */
  toward: Readonly<Record<Direction, boolean>>
  /**
   * The keyboard is in a text field (lib/text-field.ts), where Ctrl+Shift+Arrow selects
   * by word - a shell's hidden textarea is not one.
   */
  editingText: boolean
}

const SAVED_SLOT = /^layout\.saved(\d+)$/

/** The keys that move to the pane lying one way. */
const TOWARD: Partial<Record<KeybindingAction, Direction>> = {
  'focus.left': 'left',
  'focus.right': 'right',
  'focus.up': 'up',
  'focus.down': 'down',
}

/** Whether `action` does something now; false leaves its key to whatever has the keyboard. */
export function shortcutApplies(action: KeybindingAction, facts: ShortcutFacts): boolean {
  const direction = TOWARD[action]
  // A text field selects by word with the same keys.
  if (direction !== undefined) return facts.toward[direction] && !facts.editingText
  switch (action) {
    case 'pane.zoom':
      return facts.zoomable
    case 'shell.find':
      return facts.focusedIsShell || facts.shellToFind
    case 'shell.clear':
      return facts.focusedIsShell
    case 'shell.fontBigger':
    case 'shell.fontSmaller':
      return facts.anyShell
    case 'tab.next':
    case 'tab.previous':
      return facts.inTabGroup && !facts.editingText
    case 'shell.next':
    case 'shell.previous':
      return facts.otherShell
    // System-wide: main registers it with the OS, so a page never receives it.
    case 'window.toggle':
      return false
  }
  const slot = SAVED_SLOT.exec(action)
  return slot === null || Number(slot[1]) <= facts.savedCount
}

/**
 * The page's own shortcuts that do nothing now, which a focused web page keeps. System-wide
 * ones are left out: main takes their keys before any page sees them.
 */
export function shortcutsLeftToPage(facts: ShortcutFacts): KeybindingAction[] {
  return KEYBINDING_ACTIONS.map((a) => a.id).filter(
    (id) => !isGlobal(id) && !shortcutApplies(id, facts),
  )
}

const ACTION_IDS = KEYBINDING_ACTIONS.map((a) => a.id) as [KeybindingAction, ...KeybindingAction[]]

/**
 * What the page tells main a focused web page keeps (`web.leaveToPage`): known action ids
 * only, at most one of each, made a set. An unknown id is refused whole rather than dropped,
 * as any other malformed message is.
 */
export const LeftToPageSchema = z
  .array(z.enum(ACTION_IDS))
  .max(ACTION_IDS.length)
  .transform((ids): ReadonlySet<string> => new Set(ids))
