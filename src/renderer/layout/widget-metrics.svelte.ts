import { isMetricSourceId, type MetricSourceId } from '@shared/metrics'
import { metrics } from '../stores/metrics.svelte.ts'
import { seen } from '../stores/window-state.svelte.ts'
import type { WidgetDefinition } from '../widgets/registry.ts'

/**
 * Subscribes to the metric sources a widget declares, for the component that
 * shows it (a pane, or a pane popped up): those it keeps while hidden for as
 * long as the component lives, the rest only while it is seen - a tab behind
 * another is display:none, and a process list nobody sees is not worth polling.
 *
 * Two effects, so that showing or hiding a tab never releases and retains a kept
 * source in one go (which would restart its polling and blank its sample).
 * Unknown ids (a plugin naming a source this build lacks) are ignored rather
 * than sent to main, which would reject them anyway.
 *
 * Call it while the component initialises; the getters are read reactively.
 */
export function holdWidgetMetrics(
  definition: () => WidgetDefinition | null,
  visible: () => boolean,
): void {
  const declared = $derived((definition()?.metrics ?? []).filter(isMetricSourceId))
  const kept = $derived(new Set(definition()?.keepWhileHidden ?? []))

  $effect(() => retainAll(declared.filter((id) => kept.has(id))))
  // Nor while the window is minimised or put away: nobody sees the pane then either.
  $effect(() => (seen(visible()) ? retainAll(declared.filter((id) => !kept.has(id))) : undefined))
}

function retainAll(ids: readonly MetricSourceId[]): () => void {
  const releases = ids.map((id) => metrics.retain(id))
  return () => {
    for (const release of releases) release()
  }
}
