/**
 * What each pane wants shown about itself in its header and on its tab.
 *
 * Widgets publish here rather than the layout tree reading into them, so the
 * layout engine stays ignorant of what any particular widget means. A terminal
 * reports its cwd and last exit code; a monitoring widget might report a
 * current value.
 *
 * This is deliberately not persisted: it is derived from live state, and a
 * stale cwd restored from disk would be a lie.
 */

export interface PaneMeta {
  /** Overrides the widget's registry title, e.g. the running shell. */
  title?: string
  /** Secondary line, e.g. the working directory. */
  subtitle?: string
  /** Short status marker, e.g. a non-zero exit code. */
  badge?: string
  badgeKind?: 'danger' | 'warn' | 'ok'
}

class PaneMetaStore {
  private readonly entries = $state<Record<string, PaneMeta>>({})

  get(paneId: string): PaneMeta {
    return this.entries[paneId] ?? {}
  }

  set(paneId: string, meta: PaneMeta): void {
    this.entries[paneId] = meta
  }

  patch(paneId: string, meta: PaneMeta): void {
    this.entries[paneId] = { ...this.entries[paneId], ...meta }
  }

  clear(paneId: string): void {
    delete this.entries[paneId]
  }
}

export const paneMeta = new PaneMetaStore()
