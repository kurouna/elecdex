import { toasts } from '../stores/toasts.svelte.ts'

/**
 * Says which of the user's files main could not read (another program holding it open), for as
 * long as it cannot: its panes show the default meanwhile - an empty notes pane - which would
 * otherwise pass for the work gone. Main reads the file again by itself; once it has, the notice
 * goes and a short one says so. Returns the way to stop.
 */
export function watchUnreadableFiles(): () => void {
  /** The notice up for each file, by name. */
  const shown = new Map<string, number>()
  let stopped = false

  const follow = (files: string[]): void => {
    if (stopped) return
    for (const file of files) {
      if (shown.has(file)) continue
      shown.set(
        file,
        toasts.show({
          title: `could not read ${file}`,
          body: 'Another program has it open. Nothing in it is lost: its panes show nothing of it, and changes are not saved to it, until elecdex can read it - it tries again by itself.',
          tone: 'danger',
          timeoutMs: 0,
        }),
      )
    }
    for (const [file, id] of shown) {
      if (files.includes(file)) continue
      shown.delete(file)
      toasts.dismiss(id)
      toasts.show({ title: `${file} read again`, tone: 'ok' })
    }
  }

  const off = window.elecdex.system.onUnreadableFiles(follow)
  // A file held open at start was found before this page was there to hear of it.
  void window.elecdex.system.unreadableFiles().then(follow)
  return () => {
    stopped = true
    off()
  }
}
