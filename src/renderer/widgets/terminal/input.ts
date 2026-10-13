import type { IClipboardProvider } from '@xterm/addon-clipboard'

/**
 * The clipboard as OSC 52 may use it: set, never read. A query is answered with nothing - read,
 * it handed whatever was copied (a password) to any program that printed one, which most
 * terminals refuse. A write stays: a yank in vim or tmux lands on the clipboard.
 */
export const CLIPBOARD_WRITE_ONLY: IClipboardProvider = {
  readText: () => '',
  writeText: (selection, text) =>
    selection === 'c' ? navigator.clipboard.writeText(text) : undefined,
}

/**
 * What is typed before a pane reaches its shell: kept, then sent once it has. Before, the keys
 * went to a port not there yet and were lost - the first letters typed into a new pane on a slow
 * machine.
 */
export class HeldInput {
  private held: string[] | null = []

  /** Sends now when the shell is reached, else keeps it. */
  type(data: string, send: (data: string) => void): void {
    if (this.held === null) send(data)
    else this.held.push(data)
  }

  /** The shell is reached: what was kept goes, in order, and the rest goes straight on. */
  release(send: (data: string) => void): void {
    const held = this.held ?? []
    this.held = null
    for (const data of held) send(data)
  }
}

/**
 * Whether a click on a link the shell printed opens it: with Ctrl (⌘ on a Mac), as other
 * terminals do. A plain click is for focus and selection, and a program could print a link and
 * wait for a click meant for something else (found in review).
 */
export const opensLink = (event: Pick<MouseEvent, 'ctrlKey' | 'metaKey'>): boolean =>
  event.ctrlKey || event.metaKey
