/**
 * elecdex plugin API, version 2 (a version 1 plugin is read as it always was).
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
  /**
   * The keys pressed while one of its panes has the keyboard (ctx.keys). Needs apiVersion 2.
   * Only keys without Ctrl, Alt or the system key, and only while the pane is focused.
   */
  keys?: boolean
  /** Music and sound through elecdex's synthesiser (ctx.sound). Needs apiVersion 2. */
  sound?: boolean
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
  /**
   * With an icon, a button shows only the icon; its text becomes the tooltip and label.
   * `busy` says the work the button starts is under way: its icon turns (refresh) or pulses.
   */
  | {
      t: 'buttons'
      items: readonly {
        action: string
        text: string
        icon?: ButtonIcon
        busy?: boolean
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
  /**
   * A surface the view draws on itself through ctx.surface(id) (apiVersion 2): `height` in
   * CSS pixels (40 to 2000), or the rest of the pane when left out. At most 4 in a pane.
   * id: /^[a-z0-9][a-z0-9-]{0,39}$/.
   */
  | { t: 'canvas'; id: string; height?: number }

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

/*
 * Drawing, keys and sound (apiVersion 2). Times are on the view's clock: performance.now()
 * in the plugin's worker, in milliseconds - the clock animate() is called with.
 */

/** A gradient made by a Canvas2D. */
export interface CanvasGradient2D {
  addColorStop(offset: number, color: string): void
}

/**
 * The 2D drawing context of a canvas block: the parts of the browser's
 * OffscreenCanvasRenderingContext2D a plugin can rely on, written out here so that this file
 * needs no DOM types. It is scaled so that one unit is one CSS pixel.
 */
export interface Canvas2D {
  fillStyle: string | CanvasGradient2D
  strokeStyle: string | CanvasGradient2D
  lineWidth: number
  lineCap: 'butt' | 'round' | 'square'
  lineJoin: 'round' | 'bevel' | 'miter'
  lineDashOffset: number
  globalAlpha: number
  /** 'source-over', 'lighter', 'multiply', 'screen' and the rest of the canvas's modes. */
  globalCompositeOperation: string
  /** A CSS font, e.g. `600 14px ${theme.fonts.mono}`. */
  font: string
  textAlign: 'left' | 'right' | 'center' | 'start' | 'end'
  textBaseline: 'top' | 'hanging' | 'middle' | 'alphabetic' | 'ideographic' | 'bottom'
  /** CSS length, e.g. '0.1em'. */
  letterSpacing: string
  shadowBlur: number
  shadowColor: string
  shadowOffsetX: number
  shadowOffsetY: number
  save(): void
  restore(): void
  translate(x: number, y: number): void
  scale(x: number, y: number): void
  rotate(angle: number): void
  clearRect(x: number, y: number, w: number, h: number): void
  fillRect(x: number, y: number, w: number, h: number): void
  strokeRect(x: number, y: number, w: number, h: number): void
  beginPath(): void
  closePath(): void
  moveTo(x: number, y: number): void
  lineTo(x: number, y: number): void
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void
  bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void
  arc(x: number, y: number, r: number, start: number, end: number, ccw?: boolean): void
  rect(x: number, y: number, w: number, h: number): void
  roundRect(x: number, y: number, w: number, h: number, radii?: number | number[]): void
  fill(rule?: 'nonzero' | 'evenodd'): void
  stroke(): void
  clip(rule?: 'nonzero' | 'evenodd'): void
  setLineDash(segments: number[]): void
  fillText(text: string, x: number, y: number, maxWidth?: number): void
  strokeText(text: string, x: number, y: number, maxWidth?: number): void
  measureText(text: string): {
    width: number
    actualBoundingBoxAscent: number
    actualBoundingBoxDescent: number
  }
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient2D
  createRadialGradient(
    x0: number,
    y0: number,
    r0: number,
    x1: number,
    y1: number,
    r1: number,
  ): CanvasGradient2D
}

/** A canvas block, ready to draw on. */
export interface Surface {
  readonly id: string
  readonly g: Canvas2D
  /** Size in CSS pixels. */
  readonly w: number
  readonly h: number
  /** Device pixels per CSS pixel. */
  readonly dpr: number
}

/** The theme's colours, each a CSS colour a canvas takes as it is. */
export type ThemeColor =
  | 'ground'
  | 'raised'
  | 'text'
  | 'muted'
  | 'inverse'
  | 'accent'
  | 'accentStrong'
  | 'accentDim'
  | 'accentFaint'
  | 'border'
  | 'rule'
  | 'ok'
  | 'warn'
  | 'danger'
  | 'info'

/** How the app looks now: a canvas follows it by redrawing on the 'theme' event. */
export interface Theme {
  /** A light theme wants dark marks on a light ground, and glows that do not add light. */
  readonly mode: 'dark' | 'light'
  /** Motion reduced, by the setting or the system: keep what carries meaning, drop the rest. */
  readonly reducedMotion: boolean
  readonly colors: Readonly<Record<ThemeColor, string>>
  /** CSS font families. The app's own faces are available to a canvas. */
  readonly fonts: { readonly display: string; readonly ui: string; readonly mono: string }
}

/** A key going down or up in a focused pane. Held keys do not repeat. */
export interface KeyPress {
  /** KeyboardEvent.code: the key's place on the keyboard, whatever it prints ('KeyA'). */
  readonly code: string
  readonly down: boolean
  readonly shift: boolean
  /** When it happened, on the view's clock. */
  readonly at: number
}

/** The voices of elecdex's synthesiser. Drums take `pitch` only to tune (tom). */
export type Voice =
  | 'piano'
  | 'epiano'
  | 'lead'
  | 'guitar'
  | 'chip'
  | 'bass'
  | 'pluck'
  | 'pad'
  | 'organ'
  | 'marimba'
  | 'ebass'
  | 'kick'
  | 'snare'
  | 'clap'
  | 'hat'
  | 'openhat'
  | 'crash'
  | 'tom'

export interface Note {
  voice: Voice
  /** MIDI note number: 60 is middle C. 60 when left out. */
  pitch?: number
  /** When it is to be heard, on the view's clock; at once when left out or past. */
  at?: number
  /** Milliseconds before the note is let go; the voice's own when left out. */
  length?: number
  /** 0 to 1; 0.8 when left out. */
  level?: number
  /** -1 (left) to 1 (right). */
  pan?: number
}

/** A note a key plays: with `hold`, it sounds while the key is down (up to 30 s). */
export interface KeyNote extends Note {
  hold?: boolean
}

export interface Keys {
  /** Whether the pane has the keyboard. The 'focus' event says when it changes. */
  readonly focused: boolean
  /** What each key prints on this keyboard, by code: 'KeyQ' is 'A' on AZERTY. */
  readonly labels: Readonly<Record<string, string>>
  /**
   * Notes elecdex plays itself the moment a key goes down, before the key reaches the view,
   * so an instrument answers without a round trip to the worker (needs permissions.sound).
   * `at` is ignored. A note with `hold` is let go when its key comes up; one without rings
   * for its `length`. null plays nothing.
   */
  play(map: Readonly<Record<string, KeyNote>> | null): void
  /**
   * A sustain pedal for held notes: while on, a key coming up leaves its note ringing, and
   * turning it off lets go of every note whose key is up.
   */
  sustain(on: boolean): void
}

export interface Sound {
  /** Schedules notes: at most 4096 in a call, up to ten minutes ahead. */
  play(notes: readonly Note[]): void
  /** Silences this pane: what sounds is let go, and what is still to come is dropped. */
  stop(): void
  /** Milliseconds between a note starting and it being heard, as the output reports it. */
  readonly latency: number
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
  /** The canvas block with this id, once elecdex has made it; null before, and after it went. */
  surface(id: string): Surface | null
  /**
   * Calls fn once per display frame, with the frame's time on the view's clock, while the
   * pane is on screen and the window is not put away. Stop it when nothing moves: an
   * animation that runs on costs a share of a core. Returns a function that stops it.
   */
  animate(fn: (now: number) => void): () => void
  /** The app's look: colours, fonts, light or dark, motion. */
  readonly theme: Theme
  /** Needs permissions.keys. */
  readonly keys: Keys
  /** Needs permissions.sound. */
  readonly sound: Sound
  /**
   * theme: the look changed (or the app's faces arrived): redraw. focus: the pane took or
   * lost the keyboard.
   */
  on(event: 'settings' | 'resize' | 'visibility' | 'theme' | 'focus', fn: () => void): () => void
  /** Clicks in this pane. The service hears them too. */
  on(event: 'action', fn: (action: PluginAction) => void): () => void
  /** A canvas block was made, or changed size (which clears it): draw it again. */
  on(event: 'surface', fn: (surface: Surface) => void): () => void
  /** A key went down or up while the pane had the keyboard (needs permissions.keys). */
  on(event: 'key', fn: (key: KeyPress) => void): () => void
}

export interface ElecdexPlugin<S extends SettingValues = SettingValues, M = unknown> {
  /** 1, or 2 for canvas blocks, keys and sound (an older elecdex then says it is too old). */
  apiVersion: 1 | 2
  /** /^[a-z0-9][a-z0-9-]{0,39}$/; unique among the user's plugins. */
  id: string
  title: string
  description?: string
  permissions?: PluginPermissions
  settings?: readonly PluginSetting[]
  minSize?: { w: number; h: number }
  /**
   * Whether the pane can be brought to the front of the workspace (Ctrl+Shift+Z,
   * or the button beside its close), and how big it is then: 'full' covers most
   * of the window and suits a pane that fills the room it is given - a list, a
   * chart, a page - while 'panel' holds it to a readable size in the middle.
   *
   * Left out, the pane is not brought forward at all and is offered no button,
   * which is right for a readout of a few figures.
   */
  zoom?: 'full' | 'panel'
  /** Whether several panes of the plugin make sense. */
  multiple?: boolean
  /** Runs once for the plugin, before any view. Optional. May return a cleanup function. */
  // biome-ignore lint/suspicious/noConfusingVoidType: a function that returns nothing must fit.
  service?(ctx: ServiceContext<S, M>): void | (() => void)
  /** Runs for each pane. May return a cleanup function. */
  // biome-ignore lint/suspicious/noConfusingVoidType: a function that returns nothing must fit.
  view(ctx: ViewContext<S, M>): void | (() => void)
}
