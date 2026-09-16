/**
 * elecdex plugin API, version 1.
 *
 * AUTO-GENERATED in the plugins folder as elecdex-plugin.d.ts from the elecdex build that
 * wrote it. Do not edit that copy: it is overwritten whenever it differs from the running
 * build. The full specification is docs/plugins.md in the elecdex repository.
 *
 * A plugin is a .ts or .js file, or a folder with an index.ts, in the plugins folder. Its
 * default export is an ElecdexPlugin. It runs in a Web Worker: there is no DOM, no Node and
 * no network except ctx.fetch, and a value import may only name another file in its folder.
 *
 * This file must hold types only, so that it is a valid declaration file as it stands.
 */

/** A metric source the host can deliver, as named in permissions.metrics. */
export type MetricId =
  | 'cpu.info'
  | 'cpu.load'
  | 'cpu.speed'
  | 'cpu.temperature'
  | 'mem.usage'
  | 'mem.swap'
  | 'proc.list'
  | 'os.info'
  | 'os.uptime'
  | 'power.battery'
  | 'hardware.system'
  | 'net.interface'
  | 'net.throughput'
  | 'net.ping'
  | 'net.connections'
  | 'disk.volumes'
  | 'disk.io'

/** What the plugin may do. Each item is shown to the user, who agrees before the plugin runs. */
export interface PluginPermissions {
  /** Metric sources the service may read. */
  metrics?: readonly MetricId[]
  /** Host names ctx.fetch may reach over https, matched exactly (no wildcards, no IPs). */
  hosts?: readonly string[]
  /** Hosts, also listed in `hosts`, that are fetched with the plugin's own sign-in session. */
  session?: readonly string[]
  /** Keep the service running while no pane of the plugin is open. */
  background?: boolean
  /** Sound and system notifications through ctx.notify. */
  notify?: boolean
}

interface SettingBase {
  /** /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/ */
  key: string
  label: string
  description?: string
}

export type PluginSetting =
  | (SettingBase & { type: 'string'; default: string; placeholder?: string; secret?: boolean })
  | (SettingBase & { type: 'number'; default: number; min?: number; max?: number; step?: number })
  | (SettingBase & { type: 'boolean'; default: boolean })
  | (SettingBase & {
      type: 'select'
      default: string
      /** Fixed choices; the service may replace them with ctx.setOptions. */
      options?: readonly SelectOption[]
    })

export interface SelectOption {
  value: string
  label: string
}

/** A setting's value as the plugin reads it. */
export type SettingValue = string | number | boolean
export type SettingValues = Readonly<Record<string, SettingValue>>

/** How a block is coloured: the theme decides the colour itself. */
export type Tone = 'ok' | 'warn' | 'danger' | 'dim' | 'accent'

export type ChartPoint = readonly [x: number, y: number]

export interface ChartSeries {
  points: readonly ChartPoint[]
  line?: 'solid' | 'dashed' | 'dotted'
  tone?: Tone
  /** Shade the area under the line. */
  fill?: boolean
}

/** What a pane shows: a list of these, drawn by the host from top to bottom. */
export type Block =
  | { t: 'heading'; text: string }
  | { t: 'text'; text: string; tone?: Tone; size?: 'sm' | 'md' | 'lg' }
  | { t: 'big'; value: string; unit?: string; label?: string; tone?: Tone }
  | { t: 'rows'; rows: readonly { label: string; value: string; tone?: Tone }[] }
  /** A meter; value from 0 to 1. With segments it is drawn as that many cells. */
  | { t: 'bar'; value: number; label?: string; text?: string; tone?: Tone; segments?: number }
  /** A row of `count` marks, `done` of them lit. */
  | { t: 'steps'; count: number; done: number; label?: string; tone?: Tone }
  | { t: 'spark'; values: readonly number[]; min?: number; max?: number; label?: string }
  | {
      t: 'chart'
      /** CSS pixels; 40 to 400, 96 by default. */
      height?: number
      /** With time, x values are epoch milliseconds and the axis is labelled with times. */
      x: { min: number; max: number; time?: boolean }
      y: { min: number; max: number; unit?: string }
      series: readonly ChartSeries[]
      /** Straight lines across the chart: a limit (y) or a moment (x). */
      rules?: readonly { x?: number; y?: number; label?: string; tone?: Tone }[]
      labels?: readonly { x: number; y: number; text: string; tone?: Tone }[]
    }
  /**
   * A moment, kept current by the host every second: countdown (mm:ss to it),
   * relative ("2h 13m"), clock (its time of day) or date.
   */
  | {
      t: 'time'
      at: number
      style: 'relative' | 'countdown' | 'clock' | 'date'
      label?: string
      tone?: Tone
      size?: 'md' | 'lg'
    }
  | {
      t: 'table'
      columns: readonly string[]
      rows: readonly (readonly string[])[]
      align?: readonly ('left' | 'right')[]
    }
  /** Clickable when `action` is set: the click is sent with the item's id. */
  | {
      t: 'list'
      items: readonly { id: string; text: string; sub?: string; tone?: Tone }[]
      action?: string
    }
  /** With an icon, a button shows only the icon; its text becomes the tooltip and label. */
  | {
      t: 'buttons'
      items: readonly {
        action: string
        text: string
        icon?: ButtonIcon
        primary?: boolean
        disabled?: boolean
      }[]
    }
  /** An https link, opened in the user's browser. */
  | { t: 'link'; text: string; href: string }
  /** A button that opens the sign-in window for a host in permissions.session. */
  | { t: 'signin'; host: string; text?: string }
  | { t: 'notice'; text: string; tone?: Tone }
  | { t: 'divider' }

/** Icons the host can draw on a button. */
export type ButtonIcon =
  | 'refresh'
  | 'play'
  | 'pause'
  | 'stop'
  | 'skip'
  | 'reset'
  | 'add'
  | 'remove'
  | 'settings'
  | 'open'

/** A click on a list item or a button, from one pane. */
export interface PluginAction {
  action: string
  item?: string
  pane: string
}

export interface PluginResponse {
  status: number
  /** Lower-case names. */
  headers: Readonly<Record<string, string>>
  text(): string
  /** Throws when the body is not JSON. */
  json(): unknown
}

export interface CommonContext<S extends SettingValues> {
  /** The plugin's settings, defaults filled in. */
  readonly settings: S
  /** The app's language, e.g. "ja" or "en". */
  readonly locale: string
  /** Calls fn every ms milliseconds (at least 1000). Returns a function that stops it. */
  every(ms: number, fn: () => void | Promise<void>): () => void
  log(...args: unknown[]): void
}

export interface ServiceContext<S extends SettingValues, M> extends CommonContext<S> {
  /** Hands a model to every view, and to views opened later. */
  publish(model: M): void
  metrics: {
    /** A source named in permissions.metrics: fn gets each new sample's value. */
    on(id: MetricId, fn: (value: unknown) => void): () => void
  }
  /** GET an https URL on a host in permissions.hosts. */
  fetch(url: string, init?: { headers?: Record<string, string> }): Promise<PluginResponse>
  /** Kept by elecdex across restarts; up to 1 MiB of JSON in all. */
  storage: {
    get<T = unknown>(key: string): T | undefined
    set(key: string, value: unknown): void
    delete(key: string): void
  }
  /** Needs permissions.notify. */
  notify(message: { title: string; body?: string; sound?: boolean }): void
  /** Replaces the choices of a select setting. */
  setOptions(key: string, options: readonly SelectOption[]): void
  /**
   * Closes the plugin's sign-in window, if one is open. Call it once a request that needed
   * signing in works again - the 'session' event fires while the window is open, whenever its
   * cookies change - so the user does not have to close the window by hand.
   */
  closeSignIn(): void
  /**
   * The plugin's panes: how many are open, and how many of those are on screen. A service
   * can do work only its panes show (a status line, say) while one is open, and keep doing
   * what must go on regardless.
   */
  readonly views: { readonly open: number; readonly visible: number }
  /**
   * session: the sign-in session may have changed (cookies changed while the sign-in window
   * was open, the window closed, or the user signed out). views: a pane opened, closed, or
   * came on or off screen.
   */
  on(event: 'settings' | 'session' | 'views', fn: () => void): () => void
  on(event: 'action', fn: (action: PluginAction) => void): () => void
}

export interface ViewContext<S extends SettingValues, M> extends CommonContext<S> {
  /** Gets the latest model at once, when there is one, and every model published after. */
  onData(fn: (model: M) => void): () => void
  /** Replaces what the pane shows. */
  render(blocks: readonly Block[]): void
  /** The pane's content size in CSS pixels. */
  readonly size: { readonly w: number; readonly h: number }
  /** Whether the pane is on screen. every() does not run while it is not. */
  readonly visible: boolean
  /** Saved with the pane: survives moves and restarts. Up to 64 KiB of JSON. */
  state: { get<T = unknown>(): T | undefined; set(value: unknown): void }
  subtitle(text: string | null): void
  badge(text: string | null, tone?: Tone): void
  on(event: 'settings' | 'resize' | 'visibility', fn: () => void): () => void
  /** Clicks in this pane. The service hears them too. */
  on(event: 'action', fn: (action: PluginAction) => void): () => void
}

export interface ElecdexPlugin<S extends SettingValues = SettingValues, M = unknown> {
  apiVersion: 1
  /** /^[a-z0-9][a-z0-9-]{0,39}$/; unique among the user's plugins. */
  id: string
  title: string
  description?: string
  permissions?: PluginPermissions
  settings?: readonly PluginSetting[]
  minSize?: { w: number; h: number }
  /** Whether several panes of the plugin make sense. */
  multiple?: boolean
  /** Runs once for the plugin, before any view. Optional. May return a cleanup function. */
  // biome-ignore lint/suspicious/noConfusingVoidType: a function that returns nothing must fit.
  service?(ctx: ServiceContext<S, M>): void | (() => void)
  /** Runs for each pane. May return a cleanup function. */
  // biome-ignore lint/suspicious/noConfusingVoidType: a function that returns nothing must fit.
  view(ctx: ViewContext<S, M>): void | (() => void)
}
