import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * CODE's compiler client (widgets/elec16/code/compiler.ts): a worker that fails ends the
 * builds waiting on it with the reason, and the next build starts a new worker. Under
 * `npm start` the worker was refused by the CSP and COMPILE waited for ever.
 */

class FakeWorker {
  static made: FakeWorker[] = []
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null
  onmessageerror: (() => void) | null = null
  posted: { kind: string; id?: number }[] = []
  terminated = false
  constructor() {
    FakeWorker.made.push(this)
  }
  postMessage(message: { kind: string; id?: number }): void {
    this.posted.push(message)
  }
  terminate(): void {
    this.terminated = true
  }
  fail(message: string): void {
    this.onerror?.(new ErrorEvent('error', { message }))
  }
  answer(id: number): void {
    this.onmessage?.(new MessageEvent('message', { data: { id, levels: [] } }))
  }
}

vi.mock('../../src/renderer/widgets/elec16/code/make-worker.ts', () => ({
  makeCompileWorker: async () => new FakeWorker(),
}))

const { compileCode, holdCompiler } = await import(
  '../../src/renderer/widgets/elec16/code/compiler.ts'
)

const ROM = new Uint8Array(4)

describe('the CODE compiler', () => {
  beforeEach(() => {
    FakeWorker.made = []
  })

  it('ends a build when its worker fails, and starts a new worker for the next', async () => {
    const release = holdCompiler()
    try {
      const first = compileCode(ROM, 'MAIN.TS', 'x')
      await vi.waitFor(() => expect(FakeWorker.made[0]?.posted.length).toBe(2))
      FakeWorker.made[0]?.fail('refused')
      await expect(first).rejects.toThrow('refused')
      expect(FakeWorker.made[0]?.terminated).toBe(true)

      const second = compileCode(ROM, 'MAIN.TS', 'x')
      await vi.waitFor(() => expect(FakeWorker.made[1]?.posted.length).toBe(2))
      const id = FakeWorker.made[1]?.posted[1]?.id ?? -1
      FakeWorker.made[1]?.answer(id)
      await expect(second).resolves.toEqual([])
    } finally {
      release()
    }
  })

  it('ends a build still waiting when the last CODE view lets the compiler go', async () => {
    const release = holdCompiler()
    const build = compileCode(ROM, 'MAIN.TS', 'x')
    await vi.waitFor(() => expect(FakeWorker.made[0]?.posted.length).toBe(2))
    release()
    // Once left waiting for ever, for a caller that awaits it to hang on.
    await expect(build).rejects.toThrow(/let go/)
    expect(FakeWorker.made[0]?.terminated).toBe(true)
  })

  it('goes on building for one CODE view when another closes', async () => {
    const first = holdCompiler()
    const second = holdCompiler()
    try {
      const build = compileCode(ROM, 'MAIN.TS', 'x')
      await vi.waitFor(() => expect(FakeWorker.made[0]?.posted.length).toBe(2))
      second()
      expect(FakeWorker.made[0]?.terminated).toBe(false)
      FakeWorker.made[0]?.answer(FakeWorker.made[0]?.posted[1]?.id ?? -1)
      await expect(build).resolves.toEqual([])
    } finally {
      first()
    }
  })

  it('ends the worker that was still starting when the compiler was let go', async () => {
    const release = holdCompiler()
    const build = compileCode(ROM, 'MAIN.TS', 'x')
    release()
    await expect(build).rejects.toThrow(/let go/)
    expect(FakeWorker.made.every((w) => w.terminated)).toBe(true)
  })

  it('starts no worker for a build nobody holds the compiler for', async () => {
    // Once a worker started for no one and stayed: no release would ever end it.
    await expect(compileCode(ROM, 'MAIN.TS', 'x')).rejects.toThrow(/not held/)
    expect(FakeWorker.made).toEqual([])
  })

  it('says a failure with no words of its own as the compiler stopping', async () => {
    const release = holdCompiler()
    try {
      const build = compileCode(ROM, 'MAIN.TS', 'x')
      await vi.waitFor(() => expect(FakeWorker.made[0]?.posted.length).toBe(2))
      FakeWorker.made[0]?.fail('')
      await expect(build).rejects.toThrow('the compiler stopped')
    } finally {
      release()
    }
  })
})
