import { randomUUID } from 'node:crypto'
import type { PtyCreateOptions, PtySessionSummary } from '@shared/api'
import type { IPty } from 'node-pty'
import { spawn } from 'node-pty'
import { APP_VERSION } from '../build-info.js'
import { OscParser } from './osc-parser.js'
import { buildInjection, defaultShell, terminalEnv } from './shell-integration.js'

/**
 * Owns every PTY process.
 *
 * Session lifetime is deliberately decoupled from pane lifetime: a pane can
 * detach and reattach (a moved pane, a window reload, a tab reparented) without
 * the shell noticing. See docs/architecture.md section 5.3.
 *
 * Output is delivered over a MessagePort, one channel per session, rather than
 * the localhost WebSocket the original project used - so there are no ports to
 * allocate, no 5-session cap, and nothing on the machine can read the stream.
 */

/** Scrollback replayed to a pane that attaches to a session already running. */
const REPLAY_LIMIT_BYTES = 256 * 1024

/** How long after the last OSC before we decide shell integration is not working. */
const INTEGRATION_GRACE_MS = 10_000

export interface PtySessionEvents {
  onData(id: string, chunk: Uint8Array): void
  onExit(id: string, code: number, signal: number | undefined): void
  onCwd(id: string, cwd: string): void
  onCommandEnd(id: string, exitCode: number | null, durationMs: number): void
  /** Shell integration never reported anything; the UI should stop waiting on it. */
  onIntegrationUnavailable(id: string): void
}

interface Session {
  id: string
  pty: IPty
  parser: OscParser
  shell: string
  cwd: string | null
  /** True when we injected an integration script for this shell. */
  integrated: boolean
  integrationSeen: boolean
  integrationTimer: NodeJS.Timeout | undefined
  commandStartedAt: number | null
  exited: boolean
  /** Ring of recent output, replayed on attach. */
  replay: Uint8Array[]
  replayBytes: number
  createdAt: number
}

export class PtyManager {
  private readonly sessions = new Map<string, Session>()
  private readonly events: PtySessionEvents

  constructor(events: PtySessionEvents) {
    this.events = events
  }

  create(opts: PtyCreateOptions): PtySessionSummary {
    const baseEnv = terminalEnv(process.env, APP_VERSION)
    const shell = opts.shell ?? defaultShell(baseEnv)
    const injection = buildInjection(shell, baseEnv)
    const env = { ...baseEnv, ...injection.env }

    const id = randomUUID()
    const pty = spawn(shell, [...injection.args, ...(opts.args ?? [])], {
      name: 'xterm-256color',
      cols: opts.cols ?? 80,
      rows: opts.rows ?? 24,
      cwd: opts.cwd ?? env.HOME ?? process.cwd(),
      env,
    })

    const session: Session = {
      id,
      pty,
      parser: new OscParser(),
      shell,
      cwd: opts.cwd ?? null,
      integrated: injection.supported,
      integrationSeen: false,
      integrationTimer: undefined,
      commandStartedAt: null,
      exited: false,
      replay: [],
      replayBytes: 0,
      createdAt: Date.now(),
    }
    this.sessions.set(id, session)

    pty.onData((data) => this.handleData(session, data))
    pty.onExit(({ exitCode, signal }) => {
      session.exited = true
      session.parser.reset()
      if (session.integrationTimer) clearTimeout(session.integrationTimer)
      this.events.onExit(id, exitCode, signal)
      this.sessions.delete(id)
    })

    if (injection.supported) {
      session.integrationTimer = setTimeout(() => {
        if (!session.integrationSeen) this.events.onIntegrationUnavailable(id)
      }, INTEGRATION_GRACE_MS)
      // Do not hold the app open just to report a missing integration.
      session.integrationTimer.unref?.()
    } else {
      // Nothing was injected, so tell the UI straight away rather than making
      // it wait out the grace period for information that will never arrive.
      queueMicrotask(() => this.events.onIntegrationUnavailable(id))
    }

    return this.summarize(session)
  }

  write(id: string, data: string): void {
    const session = this.sessions.get(id)
    if (!session || session.exited) return
    session.pty.write(data)
  }

  resize(id: string, cols: number, rows: number): void {
    const session = this.sessions.get(id)
    if (!session || session.exited) return
    // node-pty throws on a zero or absurd size; clamp rather than crash the app.
    const c = Math.max(1, Math.min(Math.floor(cols), 1000))
    const r = Math.max(1, Math.min(Math.floor(rows), 1000))
    try {
      session.pty.resize(c, r)
    } catch {
      // A PTY that exited between the guard above and here; nothing to do.
    }
  }

  dispose(id: string): void {
    const session = this.sessions.get(id)
    if (!session) return
    if (session.integrationTimer) clearTimeout(session.integrationTimer)
    try {
      session.pty.kill()
    } catch {
      // Already gone.
    }
    this.sessions.delete(id)
  }

  disposeAll(): void {
    for (const id of [...this.sessions.keys()]) this.dispose(id)
  }

  list(): PtySessionSummary[] {
    return [...this.sessions.values()].map((s) => this.summarize(s))
  }

  has(id: string): boolean {
    return this.sessions.has(id)
  }

  /**
   * The state a newly-attached pane needs in order to render correctly.
   *
   * Events are only delivered to ports attached at the time they fire, and the
   * first OSC 7 lands with the shell's very first prompt - before any pane can
   * possibly be attached. Without this, a pane would show the cwd as pending
   * until the user happened to run another command, and a reattaching pane
   * would lose it entirely.
   */
  stateFor(id: string): { cwd: string | null; integrationResolved: boolean } | null {
    const session = this.sessions.get(id)
    if (!session) return null
    return {
      cwd: session.cwd,
      // Either integration has reported, or we know it never will.
      integrationResolved: session.integrationSeen || !session.integrated,
    }
  }

  /** Recent output, for a pane attaching to an already-running session. */
  replayFor(id: string): Uint8Array | null {
    const session = this.sessions.get(id)
    if (!session || session.replay.length === 0) return null
    const total = session.replay.reduce((n, c) => n + c.length, 0)
    const merged = new Uint8Array(total)
    let offset = 0
    for (const chunk of session.replay) {
      merged.set(chunk, offset)
      offset += chunk.length
    }
    return merged
  }

  private summarize(session: Session): PtySessionSummary {
    return {
      id: session.id,
      shell: session.shell,
      cwd: session.cwd,
      shellIntegration: session.integrated,
      createdAt: session.createdAt,
    }
  }

  private handleData(session: Session, data: string): void {
    // node-pty hands us a string; the OSC parser works on bytes so that a
    // sequence split across chunks is handled the same way as split utf-8.
    const { data: clean, events } = session.parser.write(Buffer.from(data, 'utf8'))

    for (const event of events) {
      session.integrationSeen = true

      if (event.cwd !== undefined && event.cwd !== session.cwd) {
        session.cwd = event.cwd
        this.events.onCwd(session.id, event.cwd)
      }
      if (event.commandStart) {
        session.commandStartedAt = Date.now()
      }
      if (event.commandEnd) {
        const started = session.commandStartedAt
        const durationMs = started === null ? 0 : Date.now() - started
        session.commandStartedAt = null
        this.events.onCommandEnd(session.id, event.commandEnd.exitCode, durationMs)
      }
    }

    if (clean.length > 0) {
      this.pushReplay(session, clean)
      this.events.onData(session.id, clean)
    }
  }

  /** Keeps at most REPLAY_LIMIT_BYTES of recent output, dropping oldest first. */
  private pushReplay(session: Session, chunk: Uint8Array): void {
    session.replay.push(chunk)
    session.replayBytes += chunk.length
    while (session.replayBytes > REPLAY_LIMIT_BYTES && session.replay.length > 1) {
      const dropped = session.replay.shift()
      if (dropped) session.replayBytes -= dropped.length
    }
  }
}
