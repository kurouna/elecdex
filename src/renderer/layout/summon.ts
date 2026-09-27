import type { KeybindingAction } from '@shared/keybindings'
import { popupPaneId } from './popup.js'

/**
 * Calling up a pane by its shortcut (docs/architecture.md section 5.13), as
 * Ctrl+Shift+L does for the launcher: a pane of that widget in the layout is
 * focused - its tab brought forward - and with none, the widget pops up over
 * the workspace rather than being added to the layout.
 *
 * Every such shortcut is a line in `SUMMONS`, with its chord in
 * shared/keybindings.ts; the widget must be one that pops up (`popup: true`,
 * a unit test holds them to it). What happens next is the widget's own: it
 * hears the request through `onSummoned` (lib/summoned.svelte.ts) - the
 * launcher takes the keyboard in its search box, the utility pane closes when
 * called up again while it is already up. Nothing here knows either.
 */
export const SUMMONS = {
  'launcher.focus': 'launcher',
  'utility.focus': 'utility',
} as const satisfies Partial<Record<KeybindingAction, string>>

export type SummonAction = keyof typeof SUMMONS

export const isSummonAction = (action: KeybindingAction): action is SummonAction =>
  action in SUMMONS

/** The workspace's action for each of them, so a new one needs nothing but its line above. */
export function summonActions(summon: (widget: string) => void): Record<SummonAction, () => void> {
  const actions = {} as Record<SummonAction, () => void>
  for (const [action, widget] of Object.entries(SUMMONS) as [SummonAction, string][]) {
    actions[action] = () => summon(widget)
  }
  return actions
}

/** Where a call goes, and the pane that is told of it. */
export type SummonChoice =
  | { kind: 'focus'; paneId: string }
  | { kind: 'popup'; paneId: string }
  /** Called up again while it is up already: the widget decides what that means. */
  | { kind: 'again'; paneId: string }

/**
 * Chooses where a call for `widget` goes. With several of its panes in the
 * layout, a call from one of them goes on to the next (round to the first),
 * so pressing again walks through them.
 */
export function summonChoice(
  widget: string,
  panes: readonly { id: string; widget: string }[],
  focusedPaneId: string | null,
  popup: string | null,
): SummonChoice {
  if (popup === widget) return { kind: 'again', paneId: popupPaneId(widget) }
  const mine = panes.filter((pane) => pane.widget === widget)
  const first = mine[0]
  if (first === undefined) return { kind: 'popup', paneId: popupPaneId(widget) }
  const at = mine.findIndex((pane) => pane.id === focusedPaneId)
  return {
    kind: 'focus',
    paneId: at === -1 ? first.id : (mine[(at + 1) % mine.length] ?? first).id,
  }
}
