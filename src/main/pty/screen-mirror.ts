import { SerializeAddon } from '@xterm/addon-serialize'
import { Unicode11Addon } from '@xterm/addon-unicode11'
// A CommonJS package whose named exports Node's ESM loader cannot detect, unlike
// the addons above; main is bundled as ESM, so take the default export.
import headless from '@xterm/headless'

const { Terminal } = headless

/**
 * A headless copy of one session's screen, kept in main.
 *
 * A pane that attaches to a running session - after a reload, or after it was
 * moved into a tab group and remounted - needs to see what the shell has already
 * drawn. Replaying the raw output does not reproduce that: Windows ConPTY redraws
 * with absolute cursor moves sized for the terminal as it was at the time, so the
 * same bytes land on a different screen and come out garbled. Instead, every
 * chunk is also parsed here, and an attaching pane receives a serialised snapshot
 * of the resulting screen and scrollback, which draws correctly on any terminal.
 *
 * This is the approach VS Code takes for terminal reconnection.
 */

/** Matches the renderer's scrollback, so reattaching loses nothing it had. */
export const MIRROR_SCROLLBACK = 10_000

export class ScreenMirror {
  private readonly terminal: InstanceType<typeof Terminal>
  private readonly serializer = new SerializeAddon()
  /** Snapshots waiting on the parser, settled early if the session ends first. */
  private readonly waiting = new Set<() => void>()
  private disposed = false

  constructor(cols: number, rows: number) {
    this.terminal = new Terminal({
      cols,
      rows,
      scrollback: MIRROR_SCROLLBACK,
      allowProposedApi: true,
    })
    this.terminal.loadAddon(this.serializer)
    // Wide-character widths must agree with the renderer's, or a line with CJK
    // text or emoji would wrap at a different column here.
    const unicode = new Unicode11Addon()
    this.terminal.loadAddon(unicode)
    this.terminal.unicode.activeVersion = '11'
  }

  write(chunk: Uint8Array): void {
    if (!this.disposed) this.terminal.write(chunk)
  }

  resize(cols: number, rows: number): void {
    if (!this.disposed) this.terminal.resize(cols, rows)
  }

  /**
   * Resolves with the screen as of every chunk written before this call.
   *
   * xterm parses writes asynchronously, so serialising straight away could miss
   * output that has been received but not yet processed. Chunks written after
   * this call are not included; the caller is responsible for delivering those.
   */
  snapshot(): Promise<string> {
    if (this.disposed) return Promise.resolve('')
    return new Promise((resolve) => {
      const settle = () => {
        if (!this.waiting.delete(settle)) return
        resolve(this.serializer.serialize())
      }
      this.waiting.add(settle)
      this.terminal.write('', settle)
    })
  }

  /** Visible and scrollback lines as plain text, for tests. */
  lines(): string[] {
    const buffer = this.terminal.buffer.active
    const out: string[] = []
    for (let i = 0; i < buffer.length; i++) {
      out.push(buffer.getLine(i)?.translateToString(true) ?? '')
    }
    return out
  }

  dispose(): void {
    if (this.disposed) return
    // A disposed terminal never runs its write callbacks; settle with what was
    // parsed so an attach racing the shell's exit does not hang.
    for (const settle of [...this.waiting]) settle()
    this.disposed = true
    this.terminal.dispose()
  }
}
