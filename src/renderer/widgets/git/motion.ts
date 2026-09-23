import type { TransitionConfig } from 'svelte/transition'
import { appearance } from '../../stores/appearance.svelte.ts'

/**
 * How a row arrives in and leaves the git pane. Transform and opacity only, and
 * nothing with motion reduced. Svelte plays them only for a row added to or
 * taken from a list already on screen, so the first reading lands still.
 */

/** A new file or commit drops into its place from just above. */
export function landIn(_node: Element): TransitionConfig {
  if (appearance.reducedMotion) return { duration: 0 }
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
