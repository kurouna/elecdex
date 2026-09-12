import type { Component } from 'svelte'

/**
 * The widget registry.
 *
 * Two layers on purpose: `builtins` are registered statically at build time,
 * and `dynamic` is where plugin-provided widgets will land (see
 * docs/plugins.md). A plugin widget is addressed as `plugin:<id>`, so the
 * layout tree never needs to know the difference - `PaneHost` resolves an id
 * and gets a component either way.
 */

export interface WidgetDefinition {
  id: string
  /** Shown in the pane header and on a tab. */
  title: string
  component: Component<WidgetProps>
  /** Metric source ids this widget reads. Phase 3 subscribes to these. */
  metrics?: readonly string[]
  /** Minimum useful size in CSS pixels; the splitter will not go below it. */
  minSize?: { w: number; h: number }
  /** True when several instances in one layout make sense. */
  multiple?: boolean
}

/** Every widget receives its pane's identity and configuration. */
export interface WidgetProps {
  paneId: string
  /** The resolved registry title, so a widget can label itself. */
  title: string
  props: Record<string, unknown> | undefined
  state: Record<string, unknown> | undefined
  /** Whether this pane is the visible one (a hidden tab is still mounted). */
  active: boolean
}

const builtins = new Map<string, WidgetDefinition>()
const dynamic = new Map<string, WidgetDefinition>()

export function registerBuiltin(definition: WidgetDefinition): void {
  builtins.set(definition.id, definition)
}

/** Registers a plugin-provided widget. Ids are namespaced to avoid collisions. */
export function registerDynamic(definition: WidgetDefinition): void {
  dynamic.set(`plugin:${definition.id}`, definition)
}

export function unregisterDynamic(id: string): void {
  dynamic.delete(`plugin:${id}`)
}

/** Resolves a widget id, dynamic first so a plugin can shadow a builtin. */
export function resolveWidget(id: string): WidgetDefinition | null {
  return dynamic.get(id) ?? builtins.get(id) ?? null
}

export function listWidgets(): WidgetDefinition[] {
  return [...builtins.values(), ...dynamic.values()]
}
