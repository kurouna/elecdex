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

/**
 * Whether a paste asks first: text with a line break, while the setting asks. Each break is an
 * Enter - several commands run at once from a clipboard holding more than was meant.
 */
export const pasteNeedsAsking = (text: string, confirm: boolean): boolean =>
  confirm && CONTROL.test(text)

/**
 * A line break, or another control key a shell may act on as it is pasted (Ctrl+O runs the line
 * in readline): anything below a space but a tab, and DEL.
 */
// biome-ignore lint/suspicious/noControlCharactersInRegex: control characters are what is looked for
const CONTROL = /[\u0000-\u0008\u000a-\u001f\u007f]/

/** Lines the paste question shows. */
const PREVIEW_LINES = 12

/**
 * The question's view of a paste: its first lines, control characters shown as ^X (and bidi
 * marks as <U+XXXX>) so nothing in it is hidden, and how many lines are left out.
 */
export function pastePreview(text: string): { preview: string; more: number } {
  const lines = text.replace(/(\r\n|\r|\n)$/, '').split(/\r\n|\r|\n/)
  const shown = lines.slice(0, PREVIEW_LINES).map((line) =>
    line
      .replace(
        // biome-ignore lint/suspicious/noControlCharactersInRegex: control characters are what is shown
        /[\u0000-\u0008\u000b-\u001f]/g,
        (c) => `^${String.fromCharCode(c.charCodeAt(0) + 64)}`,
      )
      .replace(/\u007f/g, '^?')
      .replace(
        /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g,
        (c) => `<U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}>`,
      ),
  )
  return { preview: shown.join('\n'), more: Math.max(0, lines.length - PREVIEW_LINES) }
}

/** The lines a paste holds, as the question counts them: a last line break makes no line. */
export function pasteLines(text: string): number {
  return text.replace(/(\r\n|\r|\n)$/, '').split(/\r\n|\r|\n/).length
}

/**
 * Bells taken at most once a `gap`: a program ringing in a loop (`yes $'\a'`) would otherwise
 * flash and sound without rest.
 */
export class BellRate {
  private readonly gap: number
  private last = Number.NEGATIVE_INFINITY

  constructor(gap = 500) {
    this.gap = gap
  }

  /** Whether this bell, at `now`, is one to show and sound. */
  ring(now: number): boolean {
    if (now - this.last < this.gap) return false
    this.last = now
    return true
  }
}

/** Whether a search for a regular expression can be made of the text: one half typed cannot. */
export function validPattern(text: string): boolean {
  try {
    new RegExp(text)
    return true
  } catch {
    return false
  }
}
