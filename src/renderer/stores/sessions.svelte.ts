import type { PtySessionSummary } from '@shared/api'

/**
 * The open terminal tabs.
 *
 * There is no cap: the original project pre-allocated four extra WebSocket
 * ports and drove tab switching through a hand-written if-chain, which is why
 * it stopped at five. A session here is just an entry in a list.
 *
 * A tab holds the session id, not the session itself - the PTY lives in main
 * and outlives the tab, so closing a tab can detach without killing the shell.
 */

export interface Tab {
  /** PTY session id, or null while the session is being created. */
  sessionId: string | null
  /** Stable key for keyed iteration, independent of the session id. */
  key: string
  title: string
  cwd: string | null
  /** Foreground process reported by shell integration, when known. */
  process: string | null
  /** Exit code and duration of the last finished command. */
  lastCommand: { exitCode: number | null; durationMs: number } | null
  /** False once we know shell integration is not reporting for this shell. */
  integrationPending: boolean
  shellIntegration: boolean
  /** Set when the shell exited; the tab stays until the user closes it. */
  exited: { code: number; signal: number | undefined } | null
  error: string | null
}

let nextKey = 0
const newKey = () => `tab-${nextKey++}`

class SessionStore {
  tabs = $state<Tab[]>([])
  activeKey = $state<string | null>(null)

  readonly active = $derived(this.tabs.find((t) => t.key === this.activeKey) ?? null)

  /** Creates a tab and its PTY session. Resolves once the session exists. */
  async open(): Promise<Tab> {
    const tab: Tab = {
      sessionId: null,
      key: newKey(),
      title: 'shell',
      cwd: null,
      process: null,
      lastCommand: null,
      integrationPending: true,
      shellIntegration: false,
      exited: null,
      error: null,
    }
    this.tabs.push(tab)
    this.activeKey = tab.key

    try {
      const summary = await window.elecdex.pty.create({})
      this.applySummary(tab.key, summary)
    } catch (cause) {
      const found = this.find(tab.key)
      if (found) found.error = cause instanceof Error ? cause.message : String(cause)
    }

    return tab
  }

  /** Closes a tab and ends its session. */
  async close(key: string): Promise<void> {
    const index = this.tabs.findIndex((t) => t.key === key)
    if (index === -1) return

    const tab = this.tabs[index]
    if (tab === undefined) return

    this.tabs.splice(index, 1)

    if (this.activeKey === key) {
      // Prefer the tab that moved into this slot, else the one before it.
      const next = this.tabs[index] ?? this.tabs[index - 1] ?? null
      this.activeKey = next?.key ?? null
    }

    if (tab.sessionId !== null) await window.elecdex.pty.dispose(tab.sessionId)
  }

  focus(key: string): void {
    if (this.tabs.some((t) => t.key === key)) this.activeKey = key
  }

  focusOffset(delta: number): void {
    if (this.tabs.length === 0) return
    const current = this.tabs.findIndex((t) => t.key === this.activeKey)
    const from = current === -1 ? 0 : current
    const next = (from + delta + this.tabs.length) % this.tabs.length
    const tab = this.tabs[next]
    if (tab) this.activeKey = tab.key
  }

  focusIndex(index: number): void {
    const tab = this.tabs[index]
    if (tab) this.activeKey = tab.key
  }

  find(key: string): Tab | undefined {
    return this.tabs.find((t) => t.key === key)
  }

  private applySummary(key: string, summary: PtySessionSummary): void {
    const tab = this.find(key)
    if (!tab) return
    tab.sessionId = summary.id
    tab.cwd = summary.cwd
    tab.shellIntegration = summary.shellIntegration
    tab.title = basename(summary.shell)
  }
}

/** Last path segment of a shell path, without a .exe suffix. */
export function basename(p: string): string {
  const parts = p.split(/[\\/]/)
  const last = parts[parts.length - 1] ?? p
  return last.replace(/\.exe$/i, '')
}

export const sessions = new SessionStore()
