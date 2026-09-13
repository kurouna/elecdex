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

  closeSettings(): void {
    this.settingsOpen = false
    this.recordingShortcut = false
  }
}

export const ui = new UiStore()
