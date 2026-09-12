/**
 * Terminal sessions, keyed by the pane that owns them.
 *
 * The session itself lives in the main process and outlives its pane, so this
 * is only a mapping plus whatever the UI needs to render. A pane adopts a
 * session id on mount and records it in its layout state, which is what lets a
 * pane be moved or survive a window reload and pick its shell back up.
 */

export interface SessionInfo {
  sessionId: string | null
  shell: string
  cwd: string | null
  lastCommand: { exitCode: number | null; durationMs: number } | null
  /** True until shell integration either reports or is known not to. */
  integrationPending: boolean
  exited: { code: number; signal: number | undefined } | null
  error: string | null
}

const blank = (): SessionInfo => ({
  sessionId: null,
  shell: 'shell',
  cwd: null,
  lastCommand: null,
  integrationPending: true,
  exited: null,
  error: null,
})

class SessionStore {
  private readonly byPane = $state<Record<string, SessionInfo>>({})

  get(paneId: string): SessionInfo {
    return this.byPane[paneId] ?? blank()
  }

  patch(paneId: string, patch: Partial<SessionInfo>): void {
    this.byPane[paneId] = { ...(this.byPane[paneId] ?? blank()), ...patch }
  }

  /** Drops entries for panes not in `paneIds`. */
  retainOnly(paneIds: ReadonlySet<string>): void {
    for (const paneId of Object.keys(this.byPane)) {
      if (!paneIds.has(paneId)) delete this.byPane[paneId]
    }
  }
}

export const sessions = new SessionStore()

/** Last path segment of a shell path, without a .exe suffix. */
export function shellName(p: string): string {
  const parts = p.split(/[\\/]/)
  const last = parts[parts.length - 1] ?? p
  return last.replace(/\.exe$/i, '')
}
