import { describe, expect, it, vi } from 'vitest'

/**
 * A shell that writes faster than main's screen mirror parses.
 *
 * xterm parses about 10 MB/s on main's event loop and throws once 50 MB wait;
 * thrown inside node-pty's data event, that was an uncaught exception, and the
 * app ended with every shell in it. A PTY on Linux or macOS gives `yes` far
 * more than that. The session's PTY is now paused while the mirror catches up.
 */

interface FakePty {
  paused: boolean
  pauses: number
  resumes: number
  emit(data: string): void
}

const ptys: FakePty[] = []

vi.mock('node-pty', () => ({
  spawn: () => {
    let listener: (data: string) => void = () => {}
    const fake = {
      paused: false,
      pauses: 0,
      resumes: 0,
      emit: (data: string) => listener(data),
      onData: (handler: (data: string) => void) => {
        listener = handler
        return { dispose() {} }
      },
      onExit: () => ({ dispose() {} }),
      pause() {
        fake.paused = true
        fake.pauses += 1
      },
      resume() {
        fake.paused = false
        fake.resumes += 1
      },
      write() {},
      resize() {},
      kill() {},
    }
    ptys.push(fake)
    return fake
  },
}))

const { PtyManager } = await import('../../src/main/pty/pty-manager.js')

const noEvents = {
  onData() {},
  onExit() {},
  onCwd() {},
  onCommandEnd() {},
  onIntegrationUnavailable() {},
}

/** A megabyte of `yes`, in node-pty's 64 kB reads. */
const READ = 'y\r\n'.repeat(21_845)
const READS_PER_TURN = 16

describe('a shell writing faster than the mirror parses', () => {
  it('is paused rather than ending the app, and resumed once the mirror catches up', async () => {
    const manager = new PtyManager(noEvents)
    const { id } = manager.create({ shell: 'fake-shell' })
    const pty = ptys.at(-1)
    if (pty === undefined) throw new Error('no pty')

    // A megabyte per turn of the event loop while the PTY is not paused, as the
    // kernel would hand it over, until 60 MB have gone: past the 50 MB at which
    // xterm throws.
    let sent = 0
    await new Promise<void>((resolve, reject) => {
      const turn = (): void => {
        try {
          for (let i = 0; i < READS_PER_TURN && !pty.paused; i++) {
            pty.emit(READ)
            sent += READ.length
          }
        } catch (error) {
          reject(error)
          return
        }
        if (sent >= 60_000_000) resolve()
        else setImmediate(turn)
      }
      turn()
    })

    // Everything sent is parsed in the end.
    await manager.snapshotFor(id)
    expect(pty.pauses).toBeGreaterThan(0)
    expect(pty.resumes).toBe(pty.pauses)
    expect(pty.paused).toBe(false)
    manager.disposeAll()
  }, 60_000)

  it('is not resumed once it has been ended', async () => {
    const manager = new PtyManager(noEvents)
    const { id } = manager.create({ shell: 'fake-shell' })
    const pty = ptys.at(-1)
    if (pty === undefined) throw new Error('no pty')
    while (!pty.paused) pty.emit(READ)
    const parsed = manager.snapshotFor(id)
    manager.dispose(id)
    await parsed
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(pty.resumes).toBe(0)
  })
})

describe('a shell whose integration never reports', () => {
  it('tells a pane attaching after the grace that there is no tracking', async () => {
    // Found in review: the grace's end was said to the panes attached then and kept nowhere,
    // so a pane attaching later (a move, a reload) showed "…" for ever.
    vi.useFakeTimers()
    try {
      const { INTEGRATION_GRACE_MS } = await import('../../src/main/pty/pty-manager.js')
      const unavailable: string[] = []
      const manager = new PtyManager({
        ...noEvents,
        onIntegrationUnavailable: (id: string) => unavailable.push(id),
      })
      const { id } = manager.create({ shell: '/bin/bash' })
      expect(manager.stateFor(id)?.integrationResolved).toBe(false)
      vi.advanceTimersByTime(INTEGRATION_GRACE_MS)
      expect(unavailable).toEqual([id])
      expect(manager.stateFor(id)?.integrationResolved).toBe(true)
      manager.disposeAll()
    } finally {
      vi.useRealTimers()
    }
  })
})
