/**
 * "copy" buttons that say "copied" for a moment: which one was pressed, and the
 * timer that forgets it. One per component that has such buttons; `dispose` on
 * unmount, so no timer outlives what it would have updated.
 */
const SHOWN_MS = 1500

export class CopyFlag {
  /** The key of the button last pressed, while it still says so. */
  key = $state<string | null>(null)
  private timer: ReturnType<typeof setTimeout> | undefined

  async copy(key: string, text: string): Promise<void> {
    await this.through(key, async () => {
      await navigator.clipboard.writeText(text)
      return true
    })
  }

  /** A copy made some other way (through main, say): says so only when `write` did. */
  async through(key: string, write: () => Promise<boolean>): Promise<boolean> {
    if (!(await write())) return false
    this.key = key
    clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.key = null
    }, SHOWN_MS)
    return true
  }

  dispose(): void {
    clearTimeout(this.timer)
  }
}
