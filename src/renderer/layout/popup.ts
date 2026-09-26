/**
 * A pane popped up (docs/architecture.md section 5.5): one widget over the
 * workspace, in a frame with only a ×, and never in the layout tree - so it is
 * neither saved, nor moved, nor split, nor tabbed, and closing it leaves the
 * arrangement exactly as it was. The launcher's shortcut opens one when the
 * layout has no launcher, since starting an application should not rearrange
 * the screen.
 *
 * The decisions are here, pure; `ui.popup` holds which widget is up and
 * PopupPane.svelte draws it. The layout store knows nothing of it.
 */

/**
 * Where the add-pane picker puts a widget: in the layout (the store's
 * `PanePlacement`, which `layout.addPane` takes - written out here so this
 * stays free of the store, and held to it where the picker passes one on), or
 * up over it.
 */
export type PickerPlacement = 'right' | 'down' | 'tab' | 'popup'
type LayoutPlacement = Exclude<PickerPlacement, 'popup'>

/**
 * The id a popped-up widget is given as its pane id. Outside the layout's own
 * ids, and one per widget, so a widget replaced by another is mounted afresh.
 */
export const popupPaneId = (widget: string): string => `${POPUP_PREFIX}${widget}`

/** Whether a pane id is a popped-up widget's rather than a layout pane's. */
export const isPopupPaneId = (paneId: string): boolean => paneId.startsWith(POPUP_PREFIX)

const POPUP_PREFIX = 'popup:'

/** What choosing a widget in the picker does. */
export type PickerChoice =
  | { kind: 'focus'; paneId: string }
  | { kind: 'add'; placement: LayoutPlacement }
  | { kind: 'popup' }
  /** Asked to pop up a widget that cannot be: nothing happens. */
  | { kind: 'none' }

/** The registry's word on a widget, as far as the picker's choice goes. */
export interface PickedWidget {
  /** Declared able to pop up (registry.ts `popup`). */
  popup?: boolean
}

/**
 * Chooses what the picker does for a widget. A single-instance widget already
 * in the layout (`onScreen`, its pane) is focused, wherever it was asked to
 * go: popping up a second one would be the duplicate the picker never makes.
 */
export function pickerChoice(
  widget: PickedWidget,
  placement: PickerPlacement,
  onScreen: string | null,
): PickerChoice {
  if (onScreen !== null) return { kind: 'focus', paneId: onScreen }
  if (placement !== 'popup') return { kind: 'add', placement }
  return widget.popup === true ? { kind: 'popup' } : { kind: 'none' }
}

/** The word at the end of a picker row: what Enter would do there. */
export function pickerRowState(choice: PickerChoice, multiple: boolean | undefined): string {
  switch (choice.kind) {
    case 'focus':
      return 'on screen · focus'
    case 'popup':
      return 'pop up'
    case 'none':
      return 'pane only'
    case 'add':
      return multiple === true ? 'add another' : 'add'
  }
}
