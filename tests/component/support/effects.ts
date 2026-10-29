import type { PaneEffect } from '../../../src/renderer/layout/pane-reflow.ts'

/**
 * What a change of layout is playing (`layout.effects.reflow`), of one kind only, by pane id:
 * the flight, the inset or the edges - what a test reads of each.
 */
export function playing(
  reflow: ReadonlyMap<string, PaneEffect>,
  kind: PaneEffect['kind'],
): Map<string, unknown> {
  const found = new Map<string, unknown>()
  for (const [id, effect] of reflow) {
    if (effect.kind === 'land' && kind === 'land') found.set(id, effect.flip)
    if (effect.kind === 'extend' && kind === 'extend') found.set(id, effect.inset)
    if (effect.kind === 'edge' && kind === 'edge') found.set(id, effect.edges)
  }
  return found
}
