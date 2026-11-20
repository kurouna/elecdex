import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * A closing shell's console list, asked of a utility process (main/pty/console-list.ts), and the
 * quit: once it begins, no list is asked any more, and one still being asked is ended and waited
 * for (a utility process left running as the app ended crashed it, 2026-11-19).
 */

class FakeChild extends EventEmitter {
  pid = 9000 + forks.length
  sent: unknown[] = []
  killed = false
  postMessage(message: unknown): void {
    this.sent.push(message)
  }
  kill(): boolean {
    this.killed = true
    queueMicrotask(() => this.emit('exit', 0))
    return true
  }
  /** Answers as the worker does: each shell's list. */
  answer(lists: Record<number, number[]>): void {
    this.emit('message', lists)
  }
}

let forks: FakeChild[] = []

vi.mock('electron', () => ({
  utilityProcess: {
    fork: vi.fn(() => {
      const child = new FakeChild()
      forks.push(child)
      return child
    }),
  },
}))

/** A fresh module each time: whether the app is quitting is the module's own state. */
async function fresh() {
  vi.resetModules()
  return import('../../src/main/pty/console-list.js')
}

/** Lets queued microtasks run, as the turn after a close does. */
async function nextTurn(): Promise<void> {
  for (let i = 0; i < 5; i += 1) await Promise.resolve()
}

beforeEach(() => {
  forks = []
})

describe('console lists as shells close', () => {
  it('asks one utility process for every shell closed in the same turn', async () => {
    const { consoleProcessList } = await fresh()
    const first = consoleProcessList(11)
    const second = consoleProcessList(22)
    await nextTurn()
    expect(forks).toHaveLength(1)
    expect(forks[0]?.sent).toEqual([{ pids: [11, 22] }])
    forks[0]?.answer({ 11: [11, 111], 22: [22] })
    expect(await first).toEqual([11, 111])
    expect(await second).toEqual([22])
  })

  it('answers the shell alone once the app is quitting, asking nothing', async () => {
    const { consoleProcessList, listConsolesNoMore } = await fresh()
    expect(listConsolesNoMore()).toBeNull()
    expect(await consoleProcessList(11)).toEqual([11])
    await nextTurn()
    expect(forks).toHaveLength(0)
  })

  it('starts nothing for a shell closed in the same turn the quit begins', async () => {
    // Found in review (2026-11-20): node-pty's kill asks for the list at once, and the ask itself
    // waits for the turn to end, to gather the shells closed together. A quit begun in that same
    // turn found nothing running and answered null - and the utility process was started after
    // it, unwaited and never ended.
    const { consoleProcessList, listConsolesNoMore } = await fresh()
    const list = consoleProcessList(11)
    expect(listConsolesNoMore()).toBeNull()
    await nextTurn()
    expect(forks).toHaveLength(0)
    expect(await list).toEqual([11])
  })

  it('ends a list still being asked as the app quits, and the quit waits for it to go', async () => {
    const { consoleProcessList, listConsolesNoMore } = await fresh()
    const list = consoleProcessList(11)
    await nextTurn()
    expect(forks).toHaveLength(1)
    const gone = listConsolesNoMore()
    expect(gone).not.toBeNull()
    expect(forks[0]?.killed).toBe(true)
    await gone
    // Gone without an answer: the shell alone, as node-pty does when no list comes.
    expect(await list).toEqual([11])
  })
})
