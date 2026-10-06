/**
 * Whether a plugin pane's saved state (`ctx.state`) as the layout now holds it is the one its
 * view has. The plugin's own `ctx.state.set` comes back from the layout as its JSON copy, so the
 * two are compared as JSON: anything else was changed from outside - another saved layout's
 * pane of the same id keeps the pane mounted and changes only its state - and the view is
 * mounted again on it, as after a restart.
 */
export function sameSavedState(held: unknown, saved: unknown): boolean {
  return asJson(held) === asJson(saved)
}

function asJson(value: unknown): string | undefined {
  try {
    return JSON.stringify(value)
  } catch {
    return undefined
  }
}
