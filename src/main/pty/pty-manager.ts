import { randomUUID } from 'node:crypto'
import { EventEmitter } from 'node:events'
import type { Worker } from 'node:worker_threads'
import type { PtyCreateOptions, PtySessionSummary } from '@shared/api'
import type { IPty } from 'node-pty'
import { spawn } from 'node-pty'
import { APP_VERSION } from '../build-info.js'
import { listConsoleOutOfProcess, listConsolesNoMore } from './console-list.js'
import { OscParser } from './osc-parser.js'
import { ScreenMirror } from './screen-mirror.js'
import { buildInjection, defaultShell, terminalEnv } from './shell-integration.js'

/**
 * Owns every PTY process.
 *
 * Session lifetime is deliberately decoupled from pane lifetime: a pane can
 * detach and reattach (a moved pane, a window reload, a tab reparented) without
 * the shell noticing. See docs/architecture.md section 5.3.
 *
 * Output is delivered over a MessagePort, one channel per attach, rather than
 * the localhost WebSocket the original project used - so there are no ports to
 * allocate, no 5-session cap, and nothing on the machine can read the stream.
 */

/**
 * The longest the quit waits for the shells' output workers to end (`disposeAll`): node-pty ends
 * each a second after its kill, once the output has drained.
 */
export const QUIT_WAIT_MS = 2000

/**
 * node-pty's worker thread carrying a ConPTY session's output (its ConoutConnection), while it
 * runs; null on other platforms, with winpty, or once it has ended.
 */
function outputWorker(pty: IPty): Worker | null {
  const agent = (pty as unknown as { _agent?: { _conoutSocketWorker?: { _worker?: unknown } } })
    ._agent
  const worker = agent?._conoutSocketWorker?._worker
  return worker instanceof EventEmitter && (worker as Worker).threadId !== -1
    ? (worker as Worker)
    : null
}

/** How long after the last OSC before we decide shell integration is not working. */
export const INTEGRATION_GRACE_MS = 10_000

/**
 * What to try when the shell found will not start: on Windows, Windows PowerShell after a
 * PowerShell 7 that is there and broken (a Store alias left behind by the app's removal).
 */
export function fallbackShells(shell: string, platform: NodeJS.Platform): string[] {
  return platform === 'win32' && /pwsh(\.exe)?$/i.test(shell) ? ['powershell.exe'] : []
}

/** The first of the shells that starts; the last one's failure if none does. */
export function startFirst<T>(shells: readonly string[], start: (shell: string) => T): T {
  let failure: unknown = new Error('no shell to start')
  for (const shell of shells) {
    try {
      return start(shell)
    } catch (error) {
      failure = error
    }
  }
  throw failure
}

/**
 * What main itself may choose of a shell: the page's options, and the program - for the tests'
 * stand-in only; the IPC never fills it.
 */
export interface PtySpawnOptions extends PtyCreateOptions {
  shell?: string
}

export interface PtySessionEvents {
  onData(id: string, chunk: Uint8Array): void
  onExit(id: string, code: number, signal: number | undefined): void
  onCwd(id: string, cwd: string | null): void
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
  /** The shell said it is on a network share, which is not followed: `cwd` is null for that. */
  onShare: boolean
  /** True when we injected an integration script for this shell. */
  integrated: boolean
  integrationSeen: boolean
  integrationTimer: NodeJS.Timeout | undefined
  /** The grace went by with nothing heard: a pane attaching later is told there is no tracking. */
  integrationGaveUp: boolean
  commandStartedAt: number | null
  exited: boolean
  /** Paused while the mirror catches up; see MIRROR_HIGH_WATER. */
  paused: boolean
  /** The screen as the shell has drawn it, snapshotted for an attaching pane. */
  mirror: ScreenMirror
  createdAt: number
}

export class PtyManager {
  private readonly sessions = new Map<string, Session>()
  private readonly events: PtySessionEvents

  constructor(events: PtySessionEvents) {
    this.events = events
  }

  create(opts: PtySpawnOptions): PtySessionSummary {
    const baseEnv = terminalEnv(process.env, APP_VERSION)
    const id = randomUUID()
    const cols = opts.cols ?? 80
    const rows = opts.rows ?? 24
    const start = (shell: string) => {
      const injection = buildInjection(shell, baseEnv)
      const env = { ...baseEnv, ...injection.env }
      const pty = spawn(shell, injection.args, {
        name: 'xterm-256color',
        cols,
        rows,
        cwd: opts.cwd ?? env.HOME ?? process.cwd(),
        env,
      })
      listConsoleOutOfProcess(pty)
      return { shell, injection, pty }
    }
    const chosen = opts.shell ?? defaultShell(baseEnv)
    const { shell, injection, pty } = startFirst(
      [chosen, ...fallbackShells(chosen, process.platform)],
      start,
    )

    const session: Session = {
      id,
      pty,
      parser: new OscParser(),
      shell,
      cwd: opts.cwd ?? null,
      onShare: false,
      integrated: injection.supported,
      integrationSeen: false,
      integrationTimer: undefined,
      integrationGaveUp: false,
      commandStartedAt: null,
      exited: false,
      paused: false,
      mirror: new ScreenMirror(cols, rows),
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
      session.mirror.dispose()
    })

    // A shell with nothing injected is resolved at once (stateFor): a pane attaching is told so.
    if (injection.supported) {
      session.integrationTimer = setTimeout(() => {
        if (session.integrationSeen) return
        // Kept, not only said: a pane attaching after the grace was otherwise never told, and
        // showed "…" for ever (found in review).
        session.integrationGaveUp = true
        this.events.onIntegrationUnavailable(id)
      }, INTEGRATION_GRACE_MS)
      // Do not hold the app open just to report a missing integration.
      session.integrationTimer.unref?.()
    }

    return this.summarize(session)
  }

  write(id: string, data: string): void {
    const session = this.sessions.get(id)
    if (!session || session.exited) return
    session.pty.write(data)
  }

  /** Drops the scrollback main keeps for the session, as the pane's own was (Ctrl+Shift+K). */
  clearScrollback(id: string): void {
    this.sessions.get(id)?.mirror.clear()
  }

  resize(id: string, cols: number, rows: number): void {
    const session = this.sessions.get(id)
    if (!session || session.exited) return
    // node-pty throws on a zero or absurd size; clamp rather than crash the app.
    const c = Math.max(1, Math.min(Math.floor(cols), 1000))
    const r = Math.max(1, Math.min(Math.floor(rows), 1000))
    try {
      session.pty.resize(c, r)
      session.mirror.resize(c, r)
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
    session.mirror.dispose()
  }

  /**
   * Every session, as the app quits; answers once node-pty has ended each one's output worker,
   * or after QUIT_WAIT_MS. The quit waits for it (main/index.ts): ending the process with the
   * workers still being torn down crashed it on its way out (0xC0000409), most times after
   * shells had come and gone with the layouts, and Windows held it seconds for its error report
   * (found by hand, 2026-11-19). The workers are left to node-pty to end: ended early, one not
   * yet connected to left node-pty connecting to a pipe that was gone, an uncaught error.
   */
  disposeAll(): Promise<void> {
    listConsolesNoMore()
    const ended: Array<Promise<unknown>> = []
    for (const [id, session] of [...this.sessions]) {
      const worker = outputWorker(session.pty)
      if (worker !== null) ended.push(new Promise((resolve) => worker.once('exit', resolve)))
      this.dispose(id)
    }
    if (ended.length === 0) return Promise.resolve()
    let timer: NodeJS.Timeout | undefined
    return Promise.race([
      Promise.all(ended),
      new Promise((resolve) => {
        timer = setTimeout(resolve, QUIT_WAIT_MS)
      }),
    ]).then(() => clearTimeout(timer))
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
  stateFor(
    id: string,
  ): { cwd: string | null; onShare: boolean; integrationResolved: boolean } | null {
    const session = this.sessions.get(id)
    if (!session) return null
    return {
      cwd: session.cwd,
      onShare: session.onShare,
      // Either integration has reported, or we know it never will.
      integrationResolved:
        session.integrationSeen || !session.integrated || session.integrationGaveUp,
    }
  }

  /**
   * The session's screen and scrollback, serialised, for a pane attaching to a
   * session already running. Covers every chunk delivered through onData before
   * this call; later chunks are the caller's to forward.
   */
  snapshotFor(id: string): Promise<string> | null {
    const session = this.sessions.get(id)
    return session ? session.mirror.snapshot() : null
  }

  private summarize(session: Session): PtySessionSummary {
    return {
      id: session.id,
      shell: session.shell,
      cwd: session.cwd,
      createdAt: session.createdAt,
    }
  }

  /** A folder the shell reported; null for a network share, which is not followed. */
  private takeCwd(session: Session, cwd: string | null): void {
    session.onShare = cwd === null
    if (cwd === session.cwd) return
    session.cwd = cwd
    this.events.onCwd(session.id, cwd)
  }

  private handleData(session: Session, data: string): void {
    // node-pty hands us a string; the OSC parser works on bytes so that a
    // sequence split across chunks is handled the same way as split utf-8.
    const { data: clean, events } = session.parser.write(Buffer.from(data, 'utf8'))

    for (const event of events) {
      session.integrationSeen = true

      if (event.cwd !== undefined) this.takeCwd(session, event.cwd)
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
      session.mirror.write(clean)
      this.events.onData(session.id, clean)
      if (session.mirror.full) this.pauseUntilDrained(session)
    }
  }

  /**
   * Holds the shell's output back until the mirror has parsed what it has: the
   * shell blocks on a full PTY, as it would on a slow terminal.
   */
  private pauseUntilDrained(session: Session): void {
    if (session.paused) return
    session.paused = true
    session.pty.pause()
    session.mirror.whenDrained(() => {
      session.paused = false
      if (!session.exited && this.sessions.has(session.id)) session.pty.resume()
    })
  }
}
