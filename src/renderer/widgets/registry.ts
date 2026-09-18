import type { Component } from 'svelte'
import { SvelteMap } from 'svelte/reactivity'

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
  /** One line for the add-pane picker. */
  description?: string
  component: Component<WidgetProps>
  /** Metric source ids this widget reads; PaneHost subscribes to these. */
  metrics?: readonly string[]
  /**
   * The subset of `metrics` still subscribed while the pane is a tab behind
   * another. The rest are released there, since nobody can see them. Charted
   * sources belong here - their history would otherwise have a gap - and so do
   * sources collected once, which cost nothing to hold and would blank the row
   * for a moment on every tab switch.
   */
  keepWhileHidden?: readonly string[]
  /**
   * How the pane is dressed. 'module' is eDEX-UI's unboxed monitoring panel - a
   * top rule with end ticks and a title row. 'shell' is the notched frame the
   * original reserved for its main terminal, with a small label above it.
   * Defaults to 'module'.
   */
  chrome?: 'module' | 'shell'
  /**
   * Omit the module title row. eDEX-UI's clock and system strip had none - the
   * rule and the readout alone - while CPU, memory and the rest were titled.
   */
  headless?: boolean
  /** Minimum useful size in CSS pixels; the splitter will not go below it. */
  minSize?: { w: number; h: number }
  /** True when several instances in one layout make sense. */
  multiple?: boolean
  /** Provided by a plugin (docs/plugins.md): marked as such in the picker. */
  plugin?: boolean
  /**
   * Left out of the add-pane picker, though a layout naming it still resolves: a widget
   * another one supersedes, or one that is only opened by something else.
   */
  unlisted?: boolean
}

/** Every widget receives its pane's identity and configuration. */
export interface WidgetProps {
  paneId: string
  /** The resolved registry title, so a widget can label itself. */
  title: string
  props: Record<string, unknown> | undefined
  state: Record<string, unknown> | undefined
  /** Whether this pane is the visible one (a hidden tab is still mounted) and has focus. */
  active: boolean
  /** Whether the pane is on screen: false for a tab behind another. */
  visible?: boolean
  /**
   * True while the pane powers on or off, or uncovers room a closed pane left: it is
   * being drawn scaled or clipped, not at its place.
   */
  transitioning?: boolean
  /** The registry id the pane was resolved from, e.g. `plugin:pomodoro`. */
  widget?: string
}

const builtins = new Map<string, WidgetDefinition>()
/** Reactive, so a pane naming a plugin that loads after it resolves once the plugin is ready. */
const dynamic = new SvelteMap<string, WidgetDefinition>()

export function registerBuiltin(definition: WidgetDefinition): void {
  builtins.set(definition.id, definition)
}

/** Registers a plugin-provided widget. Ids are namespaced to avoid collisions. */
export function registerDynamic(definition: WidgetDefinition): void {
  const id = `plugin:${definition.id}`
  const next = { ...definition, id }
  // Plugins are registered again on every settings change: an unchanged one is left alone,
  // so panes and the picker that read it are not woken for nothing.
  const current = dynamic.get(id)
  if (current && sameDefinition(current, next)) return
  dynamic.set(id, next)
}

function sameDefinition(a: WidgetDefinition, b: WidgetDefinition): boolean {
  return (
    a.component === b.component &&
    a.title === b.title &&
    a.description === b.description &&
    a.multiple === b.multiple &&
    a.minSize?.w === b.minSize?.w &&
    a.minSize?.h === b.minSize?.h
  )
}

export function unregisterDynamic(id: string): void {
  dynamic.delete(`plugin:${id}`)
}

/** Resolves a widget id. Plugin ids carry the `plugin:` prefix, so a plugin never shadows a builtin. */
export function resolveWidget(id: string): WidgetDefinition | null {
  return dynamic.get(id) ?? builtins.get(id) ?? null
}

export function listWidgets(): WidgetDefinition[] {
  return [...builtins.values(), ...dynamic.values()]
}
