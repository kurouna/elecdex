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

  openPanePicker(): void {
    this.closing(this.settingsOpen || this.locationRequest !== null || this.layoutsOpen)
    this.settingsOpen = false
    this.locationRequest = null
    this.layoutsOpen = false
    this.panePickerOpen = true
  }

  closePanePicker(): void {
    this.closing(this.panePickerOpen)
    this.panePickerOpen = false
  }

  /** The saved layouts: keeping the arrangement on screen, and coming back to one. */
  layoutsOpen = $state(false)

  openLayouts(): void {
    this.closing(this.panePickerOpen || this.settingsOpen || this.locationRequest !== null)
    this.panePickerOpen = false
    this.settingsOpen = false
    this.locationRequest = null
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

  askLayoutSwitch(question: { name: string; shells: number }): Promise<boolean> {
    // Only one at a time: the one already on screen is the one being answered.
    if (this.layoutSwitch !== null) return Promise.resolve(false)
    this.closing(this.panePickerOpen || this.settingsOpen || this.layoutsOpen)
    this.panePickerOpen = false
    this.settingsOpen = false
    this.layoutsOpen = false
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
    this.closing(this.panePickerOpen || this.locationRequest !== null || this.layoutsOpen)
    this.panePickerOpen = false
    this.locationRequest = null
    this.layoutsOpen = false
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
      this.layoutSwitch !== null
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
    this.closing(this.panePickerOpen || this.settingsOpen || this.layoutsOpen)
    this.panePickerOpen = false
    this.settingsOpen = false
    this.layoutsOpen = false
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

  closeSettings(): void {
    this.closing(this.settingsOpen)
    this.settingsOpen = false
    this.recordingShortcut = false
  }
}

export const ui = new UiStore()
