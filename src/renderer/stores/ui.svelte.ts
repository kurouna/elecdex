import type { WeatherLocation } from '@shared/weather-report'

/** A saved layout waiting to be let in, and the shells its arrival would end. */
export interface LayoutSwitchRequest {
  name: string
  shells: number
  answer: (go: boolean) => void
}

/** A pane waiting for the user to pick a place. */
export interface LocationRequest {
  current: WeatherLocation
  choose: (location: WeatherLocation) => void
}

/** The overlays over the workspace, of which one at most is showing - but for `OVER`. */
type Overlay = 'picker' | 'layouts' | 'switch' | 'settings' | 'location' | 'popup'

/** Those the user closes; a layout switch is answered instead. */
const CLOSABLE = ['picker', 'layouts', 'settings', 'location', 'popup'] as const
type Closable = (typeof CLOSABLE)[number]

/**
 * An overlay that opens over another rather than in its place. The weather
 * location picker is a pane's question for itself, and with a popup up, only
 * the widget popped up can have asked it: it opens over that popup, which is
 * there again once it is answered.
 */
const OVER: Partial<Record<Overlay, Closable>> = { location: 'popup' }

/**
 * Transient UI state that belongs to no widget: which overlay is open.
 * Not persisted.
 */
class UiStore {
  panePickerOpen = $state(false)

  /**
   * When a dialog last began to close (performance.now), so one opening just
   * after can power on out of its closing line. Not reactive: read once, as a
   * dialog opens.
   */
  closedAt = Number.NEGATIVE_INFINITY

  /** Notes a close when `open` says a dialog was showing. */
  private closing(open: boolean): void {
    if (open) this.closedAt = performance.now()
  }

  /**
   * Clears the screen for `opening`: every other overlay goes, noting the close
   * when one was showing, and a layout switch still asking is answered no -
   * rather than left on screen behind the new one, and rather than leaving the
   * switch that asked waiting for a promise that would never settle.
   */
  private clearFor(opening: Overlay): void {
    if (opening !== 'switch') this.answerLayoutSwitch(false)
    const others = CLOSABLE.filter((overlay) => overlay !== opening && overlay !== OVER[opening])
    this.closing(others.some((overlay) => this.showing(overlay)))
    for (const overlay of others) this.hide(overlay)
  }

  private showing(overlay: Closable): boolean {
    switch (overlay) {
      case 'picker':
        return this.panePickerOpen
      case 'layouts':
        return this.layoutsOpen
      case 'settings':
        return this.settingsOpen
      case 'location':
        return this.locationRequest !== null
      case 'popup':
        return this.popup !== null
    }
  }

  private hide(overlay: Closable): void {
    switch (overlay) {
      case 'picker':
        this.panePickerOpen = false
        return
      case 'layouts':
        this.layoutsOpen = false
        return
      case 'settings':
        this.settingsOpen = false
        return
      case 'location':
        this.locationRequest = null
        return
      case 'popup':
        this.popup = null
        return
    }
  }

  openPanePicker(): void {
    this.clearFor('picker')
    this.panePickerOpen = true
  }

  closePanePicker(): void {
    this.closing(this.panePickerOpen)
    this.panePickerOpen = false
  }

  /** The saved layouts: keeping the arrangement on screen, and coming back to one. */
  layoutsOpen = $state(false)

  openLayouts(): void {
    this.clearFor('layouts')
    this.layoutsOpen = true
  }

  closeLayouts(): void {
    this.closing(this.layoutsOpen)
    this.layoutsOpen = false
  }

  /**
   * The question asked before a saved layout replaces a workspace with shells in
   * it: applying one ends those shells, as closing their panes would.
   *
   * It is a request rather than a flag so the caller simply awaits an answer,
   * and so a second one cannot be asked over the first.
   */
  layoutSwitch = $state.raw<LayoutSwitchRequest | null>(null)

  /** Asks, and resolves with the answer; every other dialog answers it no (`clearFor`). */
  askLayoutSwitch(question: { name: string; shells: number }): Promise<boolean> {
    // Only one at a time: the one already on screen is the one being answered.
    if (this.layoutSwitch !== null) return Promise.resolve(false)
    this.clearFor('switch')
    return new Promise<boolean>((resolve) => {
      this.layoutSwitch = { ...question, answer: resolve }
    })
  }

  /** Answers the question, if one is being asked. */
  answerLayoutSwitch(go: boolean): void {
    const request = this.layoutSwitch
    if (request === null) return
    this.closing(true)
    this.layoutSwitch = null
    request.answer(go)
  }

  /**
   * Bumped to ask the launcher pane to take keyboard focus in its search box.
   * A counter rather than a flag, so the same request twice still arrives.
   */
  launcherFocus = $state(0)
  /** When it was last asked, so a pane mounting in answer can tell a fresh request from an old one. */
  launcherFocusAt = 0

  focusLauncher(): void {
    this.launcherFocusAt = Date.now()
    this.launcherFocus += 1
  }

  /** Bumped to ask the focused shell to take keyboard focus again, like launcherFocus. */
  shellFocus = $state(0)

  focusShell(): void {
    this.shellFocus += 1
  }

  /**
   * Bumped to ask the focused shell to open its search bar. A counter, like
   * shellFocus - but a terminal remembers the number it has answered, since
   * opening the bar again every time the pane regains focus would be wrong.
   */
  shellFind = $state(0)

  findInShell(): void {
    this.shellFind += 1
  }

  settingsOpen = $state(false)
  /** True while the settings dialog is capturing a new shortcut: app shortcuts stand down. */
  recordingShortcut = $state(false)

  /** The section the settings dialog opens at, when something asks for one. */
  settingsSection = $state<string | null>(null)

  openSettings(section: string | null = null): void {
    this.clearFor('settings')
    this.settingsSection = section
    this.settingsOpen = true
  }

  /** Whether any dialog covers the workspace. */
  get dialogOpen(): boolean {
    return (
      this.panePickerOpen ||
      this.settingsOpen ||
      this.locationRequest !== null ||
      this.layoutsOpen ||
      this.layoutSwitch !== null ||
      this.popup !== null
    )
  }

  /** The weather location picker, opened by a weather pane for itself. */
  locationRequest = $state.raw<LocationRequest | null>(null)

  /**
   * Opens the picker for one pane, and hands that pane the way to take its
   * request back. A pane closed or remounted while its picker is open would
   * otherwise leave the picker over the workspace with nothing behind it: the
   * choice would be handed to a component that is no longer there.
   */
  pickLocation(request: LocationRequest): () => void {
    // Another pane's request takes over the picker showing, which stays open.
    this.clearFor('location')
    this.locationRequest = request
    return () => {
      // Only while it is still this pane's picker: another pane may have taken
      // it over, or the user may have answered it already.
      if (this.locationRequest === request) this.closeLocationPicker()
    }
  }

  closeLocationPicker(): void {
    this.closing(this.locationRequest !== null)
    this.locationRequest = null
  }

  /**
   * The widget popped up over the workspace (layout/popup.ts), outside the
   * layout. A dialog like the others: opening any of them puts it away.
   */
  popup = $state.raw<string | null>(null)

  /** Pops up `widget`, in place of one that is up; the same one stays as it is. */
  openPopup(widget: string): void {
    this.clearFor('popup')
    this.popup = widget
  }

  /** A popup is up with nothing over it: the keys meant for it are its own. */
  get popupOnTop(): boolean {
    return this.popup !== null && this.locationRequest === null
  }

  closePopup(): void {
    this.closing(this.popup !== null)
    this.popup = null
  }

  closeSettings(): void {
    this.closing(this.settingsOpen)
    this.settingsOpen = false
    this.recordingShortcut = false
  }
}

export const ui = new UiStore()
