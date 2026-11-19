import { EventEmitter } from 'node:events'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The shells on the way out. node-pty gives each ConPTY session a worker thread that carries its
 * output, and on kill ends that worker a second later, once the output has drained. The app quit
 * before that: the process ended with the workers still being torn down and crashed on its way
 * out (0xC0000409, after the node environment's exit), most times after shells had come and gone
 * with the layouts - Windows then held the dying process for its error report for seconds (found
 * by hand, 2026-11-19; e2e: exit.spec). `disposeAll` answers once every worker has ended, and the
 * quit waits for it (main/index.ts), never longer than QUIT_WAIT_MS. The workers are left to end
 * as node-pty ends them: ended early, a worker not yet connected to left node-pty's socket
 * connecting to a pipe that was gone, an uncaught error in main.
 */

/** A worker thread as node-pty's ConoutConnection holds one. */
class FakeWorker extends EventEmitter {
  threadId = 7
  terminate = vi.fn(async () => 0)
  end(): void {
    this.threadId = -1
    this.emit('exit', 1)
  }
}

let workers: FakeWorker[] = []
let shape: 'conpty' | 'unix' = 'conpty'

vi.mock('node-pty', () => ({
  spawn: () => {
    const worker = new FakeWorker()
    workers.push(worker)
    return {
      ...(shape === 'conpty'
        ? {
            _agent: {
              _innerPid: 4321,
              _getConsoleProcessList: async () => [4321],
              _conoutSocketWorker: { _worker: worker },
            },
          }
        : {}),
      onData: () => ({ dispose() {} }),
      onExit: () => ({ dispose() {} }),
      pause() {},
      resume() {},
      write() {},
      resize() {},
      kill() {},
    }
  },
}))

vi.mock('electron', () => ({ utilityProcess: { fork: vi.fn() } }))

const { PtyManager, QUIT_WAIT_MS } = await import('../../src/main/pty/pty-manager.js')

const noEvents = {
  onData() {},
  onExit() {},
  onCwd() {},
  onCommandEnd() {},
  onIntegrationUnavailable() {},
}

/** Whether a promise has settled, after the microtasks queued so far. */
async function settled(promise: Promise<unknown>): Promise<boolean> {
  let done = false
  void promise.then(() => {
    done = true
  })
  for (let i = 0; i < 5; i += 1) await Promise.resolve()
  return done
}

beforeEach(() => {
  workers = []
  shape = 'conpty'
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('closing every shell as the app quits', () => {
  it('answers once every output worker has ended, leaving them to node-pty to end', async () => {
    const manager = new PtyManager(noEvents)
    manager.create({ shell: 'pwsh.exe' })
    manager.create({ shell: 'pwsh.exe' })
    const ended = manager.disposeAll()
    expect(manager.list()).toEqual([])
    expect(await settled(ended)).toBe(false)
    workers[0]?.end()
    expect(await settled(ended)).toBe(false)
    workers[1]?.end()
    expect(await settled(ended)).toBe(true)
    for (const worker of workers) expect(worker.terminate).not.toHaveBeenCalled()
  })

  it(`waits no longer than ${QUIT_WAIT_MS} ms for a worker that does not end`, async () => {
    const manager = new PtyManager(noEvents)
    manager.create({ shell: 'pwsh.exe' })
    const ended = manager.disposeAll()
    await vi.advanceTimersByTimeAsync(QUIT_WAIT_MS - 1)
    expect(await settled(ended)).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(await settled(ended)).toBe(true)
  })

  it('answers at once with no shell, a worker already ended, or no ConPTY worker at all', async () => {
    expect(await settled(new PtyManager(noEvents).disposeAll())).toBe(true)

    const manager = new PtyManager(noEvents)
    manager.create({ shell: 'pwsh.exe' })
    workers[0]?.end()
    expect(await settled(manager.disposeAll())).toBe(true)

    shape = 'unix'
    const unix = new PtyManager(noEvents)
    unix.create({ shell: '/bin/bash' })
    expect(await settled(unix.disposeAll())).toBe(true)
  })
})
