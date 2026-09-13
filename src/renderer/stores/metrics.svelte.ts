import type { MetricSample, MetricSamples, MetricSourceId } from '@shared/metrics'

/**
 * The latest sample of every source someone in this window is watching.
 *
 * `retain` is reference-counted, so a source is subscribed once however many
 * panes read it, and released when the last pane using it unmounts - which is
 * what lets the collector stop polling it. PaneHost calls it for the sources a
 * widget declares; widgets themselves only read.
 *
 * Samples are held in raw (non-deep) state: a process list replaced every few
 * seconds does not need Svelte to proxy every entry, only to notice the swap.
 */
class MetricStore {
  private samples = $state.raw<Partial<Record<MetricSourceId, MetricSample>>>({})
  private readonly refs = new Map<MetricSourceId, { count: number; release: () => void }>()

  retain(id: MetricSourceId): () => void {
    const existing = this.refs.get(id)
    if (existing) {
      existing.count += 1
    } else {
      const release = window.elecdex.metrics.subscribe(id, (sample) => {
        this.samples = { ...this.samples, [id]: sample }
      })
      this.refs.set(id, { count: 1, release })
    }

    let released = false
    return () => {
      if (released) return
      released = true
      const ref = this.refs.get(id)
      if (!ref) return
      ref.count -= 1
      if (ref.count > 0) return
      ref.release()
      this.refs.delete(id)
      const { [id]: _dropped, ...rest } = this.samples
      this.samples = rest
    }
  }

  /** The latest data for a source, or null before its first sample. */
  get<K extends MetricSourceId>(id: K): MetricSamples[K] | null {
    return (this.samples[id]?.data as MetricSamples[K] | undefined) ?? null
  }

  /** The full latest sample, including its timestamp. */
  sample<K extends MetricSourceId>(id: K): MetricSample<K> | null {
    return (this.samples[id] as MetricSample<K> | undefined) ?? null
  }
}

export const metrics = new MetricStore()
