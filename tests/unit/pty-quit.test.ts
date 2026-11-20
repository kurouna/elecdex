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
/**
 * Each shell's native exit notice, as node-pty's addon hands it to the agent (_$onProcessExit),
 * and what the agent's own handler was given.
 */
let notices: Array<() => void> = []
let noticed: unknown[] = []
/** Each shell's exit, as node-pty reports a shell that ended by itself. */
let exits: Array<() => void> = []
let shape: 'conpty' | 'unix' = 'conpty'

vi.mock('node-pty', () => ({
  spawn: () => {
    const worker = new FakeWorker()
    workers.push(worker)
    const pty = {
      ...(shape === 'conpty'
        ? {
            _agent: {
              _innerPid: 4321,
              _$onProcessExit(code: unknown) {
                noticed.push(code)
              },
              _getConsoleProcessList: async () => [4321],
              _conoutSocketWorker: {
                _worker: worker,
                // As node-pty's ConoutConnection: the worker ends a second later, once drained.
                dispose: vi.fn(() => {
                  setTimeout(() => worker.end(), 1000)
                }),
              },
            },
          }
        : {}),
      onData: () => ({ dispose() {} }),
      onExit: (listener: (e: { exitCode: number }) => void) => {
        exits.push(() => listener({ exitCode: 0 }))
        return { dispose() {} }
      },
      pause() {},
      resume() {},
      write() {},
      resize() {},
      kill() {},
    }
    // As the addon calls it: looked up on the agent when the shell's process has ended.
    const agent = (pty as { _agent?: { _$onProcessExit(code: number): void } })._agent
    if (agent) notices.push(() => agent._$onProcessExit(0))
    return pty
  },
}))

vi.mock('electron', () => ({ utilityProcess: { fork: vi.fn() } }))

const { PtyManager, QUIT_WAIT_MS } = await import('../../src/main/pty/pty-manager.js')
const { nativeExit } = await import('../../src/main/pty/native-exit.js')

const noEvents = {
  onData() {},
  onExit() {},
  onCwd() {},
  onCommandEnd() {},
  onIntegrationUnavailable() {},
}

/** Whether a promise has settled, after the microtasks queued so far; there must be one to wait for. */
async function settled(promise: Promise<unknown> | null): Promise<boolean> {
  if (promise === null) throw new Error('nothing to wait for')
  let done = false
  void promise.then(() => {
    done = true
  })
  for (let i = 0; i < 5; i += 1) await Promise.resolve()
  return done
}

beforeEach(() => {
  workers = []
  notices = []
  noticed = []
  exits = []
  shape = 'conpty'
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

/** Every shell's native exit notice delivered, as the addon does once each process has ended. */
const noticeAll = (): void => {
  for (const notice of notices) notice()
}

describe('closing every shell as the app quits', () => {
  it('answers once every output worker has ended, leaving them to node-pty to end', async () => {
    const manager = new PtyManager(noEvents)
    manager.create({ shell: 'pwsh.exe' })
    manager.create({ shell: 'pwsh.exe' })
    const ended = manager.disposeAll()
    noticeAll()
    expect(manager.list()).toEqual([])
    expect(await settled(ended)).toBe(false)
    workers[0]?.end()
    expect(await settled(ended)).toBe(false)
    workers[1]?.end()
    expect(await settled(ended)).toBe(true)
    for (const worker of workers) expect(worker.terminate).not.toHaveBeenCalled()
  })

  it('waits too for the worker of a shell closed a moment before the quit', async () => {
    // Found in review: a pane closed, or a layout without shells chosen, just before quitting
    // left no session to find the worker by, and the quit went on with it still being torn down.
    const manager = new PtyManager(noEvents)
    const { id } = manager.create({ shell: 'pwsh.exe' })
    manager.dispose(id)
    const ended = manager.disposeAll()
    noticeAll()
    expect(await settled(ended)).toBe(false)
    workers[0]?.end()
    expect(await settled(ended)).toBe(true)
  })

  it('waits too for the worker of a shell that ended by itself a moment before', async () => {
    const manager = new PtyManager(noEvents)
    manager.create({ shell: 'pwsh.exe' })
    notices[0]?.()
    exits[0]?.()
    expect(manager.list()).toEqual([])
    const ended = manager.disposeAll()
    expect(await settled(ended)).toBe(false)
    workers[0]?.end()
    expect(await settled(ended)).toBe(true)
  })

  it('ends the worker of a shell that ended by itself, so a later quit does not wait', async () => {
    // Found in self-review: node-pty ends a worker only on kill, and a shell that ended by
    // itself (exit typed) is never killed - its worker went on for the app's life, and every
    // quit after waited the whole QUIT_WAIT_MS for it.
    const manager = new PtyManager(noEvents)
    manager.create({ shell: 'pwsh.exe' })
    notices[0]?.()
    exits[0]?.()
    await vi.advanceTimersByTimeAsync(1000)
    expect(workers[0]?.threadId).toBe(-1)
    expect(manager.disposeAll()).toBeNull()
  })

  it(`waits no longer than ${QUIT_WAIT_MS} ms for a worker that does not end`, async () => {
    const manager = new PtyManager(noEvents)
    manager.create({ shell: 'pwsh.exe' })
    const ended = manager.disposeAll()
    await vi.advanceTimersByTimeAsync(QUIT_WAIT_MS - 1)
    expect(await settled(ended)).toBe(false)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await vi.advanceTimersByTimeAsync(1)
    expect(await settled(ended)).toBe(true)
    // Said, so a quit that crashes after it can be told from one that waited out every worker.
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/quitting with 1 output worker still running/),
    )
    warn.mockRestore()
  })

  it('has nothing to wait for with no shell, a shell already gone, or no ConPTY worker at all', async () => {
    // Nothing, not a promise already settled: the quit is then not held at all. Held and asked
    // again, the quit that SIGTERM starts never went on on macOS, which has no workers (found on
    // v0.1.0's tag, 2026-11-19; e2e: exit.spec).
    expect(new PtyManager(noEvents).disposeAll()).toBeNull()

    const manager = new PtyManager(noEvents)
    manager.create({ shell: 'pwsh.exe' })
    workers[0]?.end()
    noticeAll()
    await Promise.resolve()
    expect(manager.disposeAll()).toBeNull()

    shape = 'unix'
    const unix = new PtyManager(noEvents)
    unix.create({ shell: '/bin/bash' })
    expect(unix.disposeAll()).toBeNull()
  })
})

describe("the shells' native exit notices", () => {
  // Found in crash dumps from GitHub's Windows runners (2026-11-20): a shell killed at the quit
  // ended late, and node-pty's addon delivered its exit notice while node was freeing its
  // environment, when JS could no longer run - an uncaught C++ exception, abort, 0xC0000409.
  // About one quit in ten crashed there after layout switches; none in 72 once the quit waited.

  it('waits for every shell to have its exit noticed, even with every worker ended', async () => {
    const manager = new PtyManager(noEvents)
    manager.create({ shell: 'pwsh.exe' })
    manager.create({ shell: 'pwsh.exe' })
    const ended = manager.disposeAll()
    for (const worker of workers) worker.end()
    expect(await settled(ended)).toBe(false)
    notices[0]?.()
    expect(await settled(ended)).toBe(false)
    notices[1]?.()
    expect(await settled(ended)).toBe(true)
  })

  it('waits too for a shell closed a moment before the quit, its worker already ended', async () => {
    // As a layout switch leaves them: closed, not yet ended.
    const manager = new PtyManager(noEvents)
    const { id } = manager.create({ shell: 'pwsh.exe' })
    manager.dispose(id)
    workers[0]?.end()
    const ended = manager.disposeAll()
    expect(await settled(ended)).toBe(false)
    notices[0]?.()
    expect(await settled(ended)).toBe(true)
  })

  it("leaves node-pty's own handling of the notice as it was", () => {
    new PtyManager(noEvents).create({ shell: 'pwsh.exe' })
    notices[0]?.()
    expect(noticed).toEqual([0])
  })

  it(`waits no longer than ${QUIT_WAIT_MS} ms for a notice that never comes, and says so`, async () => {
    const manager = new PtyManager(noEvents)
    manager.create({ shell: 'pwsh.exe' })
    workers[0]?.end()
    const ended = manager.disposeAll()
    await vi.advanceTimersByTimeAsync(QUIT_WAIT_MS - 1)
    expect(await settled(ended)).toBe(false)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await vi.advanceTimersByTimeAsync(1)
    expect(await settled(ended)).toBe(true)
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/1 shell exit notice not delivered/))
    warn.mockRestore()
  })

  it('has no notice to wait for from a pty without a ConPTY agent', () => {
    expect(nativeExit({} as never)).toBeNull()
    expect(nativeExit({ _agent: {} } as never)).toBeNull()
  })
})
