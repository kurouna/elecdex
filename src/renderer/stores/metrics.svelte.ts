import type { MetricSample, MetricSamples, MetricSourceId } from '@shared/metrics'
import { SvelteMap } from 'svelte/reactivity'
import { nextFrame } from '../lib/frame-loop.ts'

/**
 * The latest sample of every source someone in this window is watching.
 *
 * `retain` is reference-counted, so a source is subscribed once however many
 * panes read it, and released when the last pane using it unmounts - which is
 * what lets the collector stop polling it. PaneHost calls it for the sources a
 * widget declares; widgets themselves only read.
 *
 * Samples are kept in a SvelteMap, which tracks each key on its own - even one
 * not set yet - and does not proxy values: a CPU sample re-runs only what reads
 * the CPU, and a process list replaced every few seconds is noticed as a swap
 * without Svelte walking its entries.
 *
 * Samples are applied in the next shared frame (nextFrame) rather than as they
 * arrive. Sources tick on their own schedules, and a change applied between the
 * frame loop's frames makes the renderer draw a frame just for it. Sources report
 * at most once a second, so keeping only the latest per source until that frame
 * loses nothing.
 */
class MetricStore {
  private readonly samples = new SvelteMap<MetricSourceId, MetricSample>()
  /** Samples received since the last frame, waiting to be applied. */
  private readonly arrived = new Map<MetricSourceId, MetricSample>()
  private readonly refs = new Map<MetricSourceId, { count: number; release: () => void }>()

  private receive(id: MetricSourceId, sample: MetricSample): void {
    const first = this.arrived.size === 0
    this.arrived.set(id, sample)
    if (first) nextFrame(() => this.apply())
  }

  private apply(): void {
    for (const [id, sample] of this.arrived) {
      // A source released while its sample waited stays cleared.
      if (this.refs.has(id)) this.samples.set(id, sample)
    }
    this.arrived.clear()
  }

  retain(id: MetricSourceId): () => void {
    const existing = this.refs.get(id)
    if (existing) {
      existing.count += 1
    } else {
      const release = window.elecdex.metrics.subscribe(id, (sample) => this.receive(id, sample))
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
      this.arrived.delete(id)
      this.samples.delete(id)
    }
  }

  /** The latest data for a source, or null before its first sample. */
  get<K extends MetricSourceId>(id: K): MetricSamples[K] | null {
    return (this.samples.get(id)?.data as MetricSamples[K] | undefined) ?? null
  }

  /** The full latest sample, including its timestamp. */
  sample<K extends MetricSourceId>(id: K): MetricSample<K> | null {
    return (this.samples.get(id) as MetricSample<K> | undefined) ?? null
  }
}

export const metrics = new MetricStore()
