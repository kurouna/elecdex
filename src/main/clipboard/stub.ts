import {
  type ClipEntry,
  type ClipHistory,
  type ClipRead,
  emptyHistory,
  recordRead,
} from '@shared/clipboard'

/**
 * A stand-in for the system clipboard (ELECDEX_CLIPBOARD_STUB=1, the tests; =demo,
 * the screenshots): a test run never reads what this machine has copied, and
 * never puts anything on its clipboard.
 *
 * The end-to-end tests copy through `globalThis.__elecdexClipboard`, and read
 * back what the pane put on it and how often it was looked at.
 */
export interface StubClipboard {
  read(last: string | null): Promise<ClipRead>
  write(entry: ClipEntry): Promise<void>
  clear(): Promise<void>
}

interface Held {
  text: string
  html: string | null
  rtf: string | null
  private: boolean
}

export interface ClipboardHooks {
  copy(text: string, options?: { html?: string; rtf?: string; private?: boolean }): void
  /** Something the pane does not keep, an image say. */
  copyOther(): void
  current(): { text: string; html: string | null; rtf: string | null } | null
  /** How many times the clipboard has been looked at. */
  reads(): number
}

/** `holding`: the text on the stand-in clipboard to begin with (the screenshots' last copy). */
export function stubClipboard(holding: string | null = null): StubClipboard {
  let held: Held | null =
    holding === null ? null : { text: holding, html: null, rtf: null, private: false }
  let reads = 0
  const hooks: ClipboardHooks = {
    copy: (text, options) => {
      held = {
        text,
        html: options?.html ?? null,
        rtf: options?.rtf ?? null,
        private: options?.private === true,
      }
    },
    copyOther: () => {
      held = null
    },
    current: () => (held === null ? null : { text: held.text, html: held.html, rtf: held.rtf }),
    reads: () => reads,
  }
  ;(globalThis as { __elecdexClipboard?: ClipboardHooks }).__elecdexClipboard = hooks
  return {
    read: async () => {
      reads += 1
      if (held === null) return { kind: 'other' }
      if (held.private) return { kind: 'private' }
      return { kind: 'text', text: held.text, html: held.html, rtf: held.rtf }
    },
    write: async (entry) => {
      held = { text: entry.text, html: entry.html, rtf: entry.rtf, private: false }
    },
    clear: async () => {
      held = null
    },
  }
}

/**
 * Minutes ago, and what was copied - null for a password copied from a password
 * manager, left out and counted: a morning at a desk, made up for the screenshots.
 */
const DEMO_COPIES: readonly [number, string | null, string?][] = [
  [
    212,
    'Quarterly review — agenda\n1. Numbers since June\n2. The move to the new office\n3. Hiring for the spring',
  ],
  [165, 'https://example.com/handbook/expenses#travel'],
  [121, '#3fd2ff'],
  [96, 'D:\\Projects\\atlas\\docs\\release-notes.md'],
  [64, 'npm run build && npx playwright test tests/e2e/desk.spec.ts'],
  [38, '1,284,500'],
  [26, null],
  [
    17,
    'Thanks — I have moved the call to Thursday at 14:00 so Mika can join.',
    '<p>Thanks — I have moved the call to <b>Thursday at 14:00</b> so Mika can join.</p>',
  ],
  [4, 'git log --oneline --since="1 week ago" -- src/'],
]

/** What the screenshots' clipboard holds: the last of their copies. */
export const DEMO_HOLDING = DEMO_COPIES.at(-1)?.[1] ?? null

/** The made-up history the screenshots start with. */
export function demoHistory(now: number): ClipHistory {
  let history = emptyHistory()
  let n = 0
  const makeId = (): string => {
    n += 1
    return `cdemo${n}`
  }
  for (const [minutes, text, html] of DEMO_COPIES) {
    const read: ClipRead =
      text === null ? { kind: 'private' } : { kind: 'text', text, html: html ?? null }
    history = recordRead(history, read, now - minutes * 60_000, makeId)
  }
  return history
}
