/**
 * A press on an emulator pane's PANEL button, from whether the panel shows now. The panel
 * shows when it is wanted and the pane has room for it beside the screen, or when it was
 * opened by hand without that room (`forced`, for this mount). A press opens what is shut and
 * shuts what is open in one go, whatever the room: opening marks it wanted and forced alike,
 * so a narrow pane shows it at once rather than only wanting it.
 */
export function panelPress(shown: boolean): { panel: boolean; forced: boolean } {
  return shown ? { panel: false, forced: false } : { panel: true, forced: true }
}
