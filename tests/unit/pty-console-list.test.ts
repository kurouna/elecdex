import { EventEmitter } from 'node:events'
import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * Ending what runs in a shell when its pane closes, in the packaged app.
 *
 * node-pty's ConPTY kill asks for the console's process list - the shell and everything it
 * started - by `child_process.fork`ing a small agent, then kills every process on it. The
 * packaged app turns the runAsNode fuse off, and Electron then refuses `child_process.fork`:
 * the list was never fetched and every close was an unhandled rejection (seen in the installed
 * app's console while switching layouts). The list is now asked of a utilityProcess.
 */

/** What node-pty's Windows agent does on kill, as far as the console list goes. */
interface FakeAgent {
  _innerPid: number
  _getConsoleProcessList: () => Promise<number[]>
}

const killed: number[] = []

vi.mock('node-pty', () => ({
  spawn: () => {
    const agent: FakeAgent = {
      _innerPid: 4321,
      // As in the packaged app: Electron refuses child_process.fork, inside the promise.
      _getConsoleProcessList: () =>
        new Promise(() => {
          throw new Error(
            'child_process.fork() is not supported when the runAsNode fuse is disabled',
          )
        }),
    }
    return {
      _agent: agent,
      onData: () => ({ dispose() {} }),
      onExit: () => ({ dispose() {} }),
      pause() {},
      resume() {},
      write() {},
      resize() {},
      kill() {
        void agent._getConsoleProcessList().then((list) => killed.push(...list))
      },
    }
  },
}))

/** A utilityProcess that answers a list for each shell it is asked about. */
class FakeChild extends EventEmitter {
  asked: number[] = []
  kill = vi.fn()
  postMessage(message: { pids: number[] }): void {
    this.asked = message.pids
    queueMicrotask(() =>
      this.emit('message', Object.fromEntries(message.pids.map((pid) => [pid, [pid, pid + 1]]))),
    )
  }
}

const forked: FakeChild[] = []

vi.mock('electron', () => ({
  utilityProcess: {
    fork: vi.fn(() => {
      const child = new FakeChild()
      forked.push(child)
      return child
    }),
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

const settle = async () => {
  for (let i = 0; i < 5; i += 1) await new Promise((resolve) => setTimeout(resolve, 0))
}

afterEach(() => {
  killed.length = 0
  forked.length = 0
})

describe('closing a shell', () => {
  it('asks a utilityProcess for its console, and kills everything on it', async () => {
    const rejected: unknown[] = []
    const note = (reason: unknown) => rejected.push(reason)
    process.on('unhandledRejection', note)
    try {
      const manager = new PtyManager(noEvents)
      const { id } = manager.create({ shell: 'pwsh.exe' })
      manager.dispose(id)
      await settle()
      expect(rejected).toEqual([])
      expect(forked).toHaveLength(1)
      expect(forked[0]?.asked).toEqual([4321])
      expect(killed).toEqual([4321, 4322])
    } finally {
      process.off('unhandledRejection', note)
    }
  })

  it('asks once for the shells closed together, as a layout switch closes them', async () => {
    const manager = new PtyManager(noEvents)
    const ids = [1, 2, 3].map(() => manager.create({ shell: 'pwsh.exe' }).id)
    for (const id of ids) manager.dispose(id)
    await settle()
    expect(forked).toHaveLength(1)
    expect(killed).toHaveLength(6)
  })

  it('asks no new process while the app quits, which would hold the quit up', async () => {
    // Every shell is closed on the way out (before-quit): a utilityProcess started then kept the
    // app from quitting, and was left behind (e2e: exit.spec, single-instance.spec).
    const manager = new PtyManager(noEvents)
    manager.create({ shell: 'pwsh.exe' })
    manager.create({ shell: 'pwsh.exe' })
    manager.disposeAll()
    await settle()
    expect(forked).toEqual([])
    // The shells themselves are still killed, as node-pty does when no list comes.
    expect(killed).toEqual([4321, 4321])
  })
})
