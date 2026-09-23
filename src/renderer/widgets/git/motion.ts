import type { TransitionConfig } from 'svelte/transition'
import { appearance } from '../../stores/appearance.svelte.ts'

/**
 * How a row arrives in and leaves the git pane. Transform and opacity only, and
 * nothing with motion reduced. Svelte plays them for every row added to a list
 * on screen - the lists are there, empty, before the first reading - so the
 * pane says when a reading is the first (`still`), which lands without motion.
 */

/** A new file or commit drops into its place from just above. */
export function landIn(_node: Element, params: { still?: boolean } = {}): TransitionConfig {
  if (appearance.reducedMotion || params.still === true) return { duration: 0 }
  return {
    duration: 420,
    easing: (t) => 1 - (1 - t) ** 3,
    css: (t, u) => `opacity: ${Math.min(1, t * 1.6)}; transform: translateY(${-0.5 * u}rem)`,
  }
}

/**
 * A file that leaves the list - committed, reverted, staged across - folds to a
 * line and goes, as a tube's picture does.
 */
export function foldOut(_node: Element): TransitionConfig {
  if (appearance.reducedMotion) return { duration: 0 }
  return {
    duration: 320,
    css: (t) =>
      `opacity: ${t < 0.3 ? t / 0.3 : 1}; transform: scaleY(${Math.max(0.04, t)}); transform-origin: center`,
  }
}
