import type { WeatherLocation } from '@shared/weather-report'

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

  openPanePicker(): void {
    this.settingsOpen = false
    this.locationRequest = null
    this.panePickerOpen = true
  }

  closePanePicker(): void {
    this.panePickerOpen = false
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

  settingsOpen = $state(false)
  /** True while the settings dialog is capturing a new shortcut: app shortcuts stand down. */
  recordingShortcut = $state(false)

  /** The section the settings dialog opens at, when something asks for one. */
  settingsSection = $state<string | null>(null)

  openSettings(section: string | null = null): void {
    this.panePickerOpen = false
    this.locationRequest = null
    this.settingsSection = section
    this.settingsOpen = true
  }

  /** Whether any dialog covers the workspace. */
  get dialogOpen(): boolean {
    return this.panePickerOpen || this.settingsOpen || this.locationRequest !== null
  }

  /** The weather location picker, opened by a weather pane for itself. */
  locationRequest = $state.raw<LocationRequest | null>(null)

  pickLocation(request: LocationRequest): void {
    this.panePickerOpen = false
    this.settingsOpen = false
    this.locationRequest = request
  }

  closeLocationPicker(): void {
    this.locationRequest = null
  }

  closeSettings(): void {
    this.settingsOpen = false
    this.recordingShortcut = false
  }
}

export const ui = new UiStore()
