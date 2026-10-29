/**
 * How long each CRT effect plays, in one place (styles/crt.css plays them, with
 * these as its `--crt-duration`). Side by side, a change to one is seen against
 * the others it has to sit with - a close against the extension after it, a
 * dialog's power-off against the handover into the next.
 *
 * Imports nothing, so every store and module can read it without a cycle (the
 * boot store imports the layout store).
 */

/** One pane's power-on at boot; a shell's is longer, as the main screen. */
export const CRT_MODULE_MS = 650
export const CRT_SHELL_MS = 900
/** A pane added later powers on quicker, so it does not hold up the work. */
export const CRT_ADDED_MS = 520

/** A closing pane powering off. */
export const CRT_CLOSE_MS = 300
/** The panes left behind extending into the room it left. */
export const CRT_EXTEND_MS = 220
/**
 * The tree changes this much after the power-off starts: the animation begins on
 * the frame after the class is added, so a timer of exactly its length would
 * remove the pane a frame before its last, still faintly lit, frame.
 */
export const CLOSE_SETTLE_MS = CRT_CLOSE_MS + 40

/** A pane flying out to the front of the workspace. */
export const CRT_ZOOM_MS = 260
/** And back to its place, a little quicker, as a picture collapsing. */
export const CRT_UNZOOM_MS = 220

/** A pane of the layout arriving in a switch coming on (layout/layout-switch.ts). */
export const SWITCH_ON_MS = 460
/** The screen powering off before the next layout arrives. */
export const SWITCH_OFF_MS = 300
/** A breath between the two halves, and after the last pane has come on. */
export const SWITCH_GAP_MS = 40

/** A dialog or a notice powering off, as a pane does (lib/crt-motion.ts). */
export const POWER_OFF_MS = CRT_CLOSE_MS
/** A dialog's power-on (the dialogs' `--crt-duration`). */
export const DIALOG_ON_MS = 380
