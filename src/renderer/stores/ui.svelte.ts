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
    this.panePickerOpen = true
  }

  closePanePicker(): void {
    this.panePickerOpen = false
  }

  settingsOpen = $state(false)
  /** True while the settings dialog is capturing a new shortcut: app shortcuts stand down. */
  recordingShortcut = $state(false)

  openSettings(): void {
    this.panePickerOpen = false
    this.settingsOpen = true
  }

  /** The weather location picker, opened by a weather pane for itself. */
  locationRequest = $state.raw<LocationRequest | null>(null)

  pickLocation(request: LocationRequest): void {
    this.panePickerOpen = false
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
