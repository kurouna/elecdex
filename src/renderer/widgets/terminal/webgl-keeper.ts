import type { ITerminalAddon } from '@xterm/xterm'

/**
 * Keeps a terminal on WebGL while the GPU allows it, and on xterm's DOM renderer
 * when it does not.
 *
 * A crashing video driver takes Chromium's GPU process with it, and every WebGL
 * context in the page is lost. xterm's addon waits three seconds for its context
 * to come back and then rebuilds itself in it; done for a pane behind a tab, that
 * left glyphs drawn before the crash blank once the pane was shown - a prompt and
 * a command's output missing while the line being typed was drawn. Given up
 * instead, the DOM renderer took over with wider cells and nothing fitted the
 * terminal to them, so its right-hand columns ran past the pane.
 *
 * So a lost context is never waited for: the addon is disposed at once, the DOM
 * renderer draws the screen whole at its own cell size, and a fresh addon - a new
 * canvas, context and glyph atlas - is tried a moment later while the pane is on
 * screen. After a few losses the pane stays on the DOM renderer.
 */

/** How long after a loss before WebGL is tried again: the GPU process restarts meanwhile. */
export const WEBGL_RETRY_MS = 2000
/** Losses after which a pane stops trying WebGL. */
export const WEBGL_MAX_LOSSES = 3

export interface WebglKeeperOptions {
  /** Takes the addon; throws where WebGL cannot be had. */
  load(addon: ITerminalAddon): void
  /**
   * The terminal's element. Context events do not bubble, so they are caught on
   * their way down to the canvas.
   */
  element: EventTarget
  /** A new WebGL addon. */
  create(): ITerminalAddon
  /** Whether the pane is on screen, where a new addon may be tried. */
  visible(): boolean
  /** The renderer changed: the cells may have another size, and the screen must be drawn whole. */
  changed(): void
}

export class WebglKeeper {
  private readonly options: WebglKeeperOptions
  private addon: ITerminalAddon | null = null
  private losses = 0
  /** False once WebGL could not be had, or was lost too often. */
  private wanted = true
  private stopped = false
  private retryTimer: ReturnType<typeof setTimeout> | null = null

  constructor(options: WebglKeeperOptions) {
    this.options = options
    options.element.addEventListener('webglcontextlost', this.lost, true)
    this.load()
  }

  /** Whether the terminal is drawn by WebGL now. */
  get active(): boolean {
    return this.addon !== null
  }

  /** Tries WebGL again if it is wanted and the pane is on screen; called whenever the pane is shown or fitted. */
  resume(): void {
    if (this.stopped || !this.wanted || this.addon !== null || this.retryTimer !== null) return
    if (!this.options.visible()) return
    this.load()
    // Set before telling, so a fit that calls resume() again finds the addon in place.
    if (this.addon !== null) this.options.changed()
  }

  dispose(): void {
    this.stopped = true
    if (this.retryTimer !== null) clearTimeout(this.retryTimer)
    this.retryTimer = null
    this.options.element.removeEventListener('webglcontextlost', this.lost, true)
  }

  private load(): void {
    try {
      const addon = this.options.create()
      this.options.load(addon)
      this.addon = addon
    } catch {
      // No usable GPU: the DOM renderer it is, for good.
      this.addon = null
      this.wanted = false
    }
  }

  private readonly lost = (): void => {
    const addon = this.addon
    if (this.stopped || addon === null) return
    this.addon = null
    this.losses += 1
    // After the addon's own listener has seen the event: disposing it inside the
    // dispatch would pull its listener out from under the event.
    queueMicrotask(() => {
      addon.dispose()
      if (!this.stopped) this.options.changed()
    })
    if (this.losses >= WEBGL_MAX_LOSSES) {
      this.wanted = false
      return
    }
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null
      this.resume()
    }, WEBGL_RETRY_MS)
  }
}
