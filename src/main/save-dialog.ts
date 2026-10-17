import {
  BrowserWindow,
  dialog,
  type SaveDialogOptions,
  type SaveDialogReturnValue,
  type WebContents,
} from 'electron'

/**
 * The save dialog for what `page` asked to export, owned by the page's window (issue 20).
 *
 * Without an owner the dialog is a window of its own: it can open behind a fullscreen
 * elecdex, out of sight, with the export waiting on it, and the workspace stays usable under
 * it. Every other dialog main opens is owned the same way.
 */
export function showSaveDialogFor(
  page: WebContents,
  options: SaveDialogOptions,
): Promise<SaveDialogReturnValue> {
  const owner = BrowserWindow.fromWebContents(page)
  return owner ? dialog.showSaveDialog(owner, options) : dialog.showSaveDialog(options)
}
