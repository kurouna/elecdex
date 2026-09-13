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
}

export const ui = new UiStore()
