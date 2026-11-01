/**
 * win32-input-mode, the private mode ConPTY sets as it starts to have keys sent as Windows key
 * events (architecture.md §6.4). Main's mirror of the screen keeps it for a pane that attaches
 * later; the pane encodes keys while it is set (widgets/terminal/win32-input.ts).
 */
export const WIN32_INPUT_MODE = 9001

/** The sequence that sets the mode, put after a snapshot of a session that has it set. */
export const WIN32_INPUT_MODE_ON = `\u001b[?${WIN32_INPUT_MODE}h`

/**
 * Whether a DECSET (`h`) or DECRST (`l`) with these parameters changes the mode, and to what:
 * undefined when it does not name it.
 */
export function win32ModeChange(
  params: readonly (number | number[])[],
  set: boolean,
): boolean | undefined {
  return params.some((p) => p === WIN32_INPUT_MODE) ? set : undefined
}
