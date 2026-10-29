import type { LayoutNode } from '@shared/schemas/layout'
import { type RevealTiming, revealDelays } from '../lib/boot-sequence.ts'
import { SWITCH_ON_MS } from '../lib/crt-timing.ts'

/**
 * The effect that carries one layout away and brings the next one up.
 *
 * A pane closed on its own powers off and its neighbours extend into its room
 * (pane-close.ts). That is the wrong picture for a switch: the room is not
 * shared out, it is handed to another arrangement. So the whole screen powers
 * off together and the layout arriving comes up the way it does at boot - the
 * shells first, then the modules one after another in no fixed order.
 *
 * The timing lives here rather than with the boot sequence because it is a
 * different moment: at boot the reveal is the show, and a switch has to be over
 * quickly enough that it does not stand between the user and the work. It is
 * also here rather than in the store so its shape can be read by a test and the
 * store carries no cycle back to the boot store. How long each part takes is
 * with the other effects' lengths, in lib/crt-timing.ts.
 */

/**
 * Quicker than the boot reveal (450 / 200 / 1400): the same shape, about a third
 * of the time.
 */
const SWITCH_REVEAL: RevealTiming = { shellAt: 0, modulesAt: 120, step: 70, span: 460 }

/** When each pane of the layout arriving powers on, by pane id. */
export function switchDelaysFor(
  root: LayoutNode,
  isShell: (widget: string) => boolean,
  random: () => number = Math.random,
): Map<string, number> {
  return revealDelays(root, isShell, SWITCH_REVEAL, random)
}

/** How long the whole arrival takes, so the caller knows when it is over. */
export function switchRevealEnd(delays: ReadonlyMap<string, number>): number {
  let end = 0
  for (const delay of delays.values()) end = Math.max(end, delay + SWITCH_ON_MS)
  return end
}
