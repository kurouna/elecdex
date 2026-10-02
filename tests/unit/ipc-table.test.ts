import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * A module's channels as one table (main/ipc/table.ts): registered together and taken down
 * together, so a channel is named once and none outlives its module. And the pages subscribed to
 * one board, which go with their reload or their end.
 */

const handles = new Map<string, (...args: unknown[]) => unknown>()
// Listeners as ipcMain keeps them: several on one channel, each removed by itself.
const bus = new EventEmitter()

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: (...args: unknown[]) => unknown) => {
      if (handles.has(channel)) throw new Error(`second handler for ${channel}`)
      handles.set(channel, handler)
    },
    removeHandler: (channel: string) => handles.delete(channel),
    on: (channel: string, listener: (...args: unknown[]) => void) => bus.on(channel, listener),
    off: (channel: string, listener: (...args: unknown[]) => void) => bus.off(channel, listener),
  },
}))

const { PageSubscribers, registerTable } = await import('../../src/main/ipc/table.js')

beforeEach(() => {
  handles.clear()
  bus.removeAllListeners()
})

/** A page as the subscribers use it: its two events, `send` and `isDestroyed`. */
function page() {
  const events = new EventEmitter()
  const sent: unknown[][] = []
  let destroyed = false
  const contents = Object.assign(events, {
    sent,
    send: (...args: unknown[]) => sent.push(args),
    isDestroyed: () => destroyed,
    destroy: () => {
      destroyed = true
      events.emit('destroyed')
    },
  })
  return contents as typeof contents & Electron.WebContents
}

const reload = (p: EventEmitter): void => {
  p.emit('did-start-navigation', { isMainFrame: true, isSameDocument: false })
}

describe('a table of channels', () => {
  it('registers every channel, passes its arguments on, and the answer removes them all', async () => {
    const heard: unknown[] = []
    const unregister = registerTable({
      handle: { 'a:get': (_event, n) => (n as number) + 1, 'a:list': () => [] },
      on: { 'a:subscribe': (_event, key) => heard.push(key) },
    })
    expect([...handles.keys()]).toEqual(['a:get', 'a:list'])
    expect(await handles.get('a:get')?.({}, 41)).toBe(42)
    bus.emit('a:subscribe', {}, 'tokyo')
    expect(heard).toEqual(['tokyo'])
    unregister()
    expect(handles.size).toBe(0)
    expect(bus.listenerCount('a:subscribe')).toBe(0)
    // Made again (a test registering IPC twice), nothing is left over to collide with.
    registerTable({ handle: { 'a:get': () => 2 } })()
  })

  it('takes down its own listeners only, never another on the same channel', () => {
    const other: unknown[] = []
    bus.on('a:subscribe', (_event: unknown, key: unknown) => other.push(key))
    const unregister = registerTable({ on: { 'a:subscribe': () => {} } })
    const kept = registerTable({ handle: { 'b:get': () => 1 } })
    unregister()
    bus.emit('a:subscribe', {}, 'still heard')
    expect(other).toEqual(['still heard'])
    expect(bus.listenerCount('a:subscribe')).toBe(1)
    expect(handles.has('b:get')).toBe(true)
    kept()
  })

  it('leaves nothing half registered when a channel is taken already', () => {
    registerTable({ handle: { 'a:taken': () => 1 } })
    expect(() =>
      registerTable({
        handle: { 'b:first': () => 1, 'a:taken': () => 2 },
        on: { 'b:listen': () => {} },
      }),
    ).toThrow('second handler for a:taken')
    expect([...handles.keys()]).toEqual(['a:taken'])
    expect(bus.listenerCount('b:listen')).toBe(0)
  })
})

describe('the pages of one board', () => {
  it('starts the reading with the first page and stops it with the last', () => {
    const heard: boolean[] = []
    const subscribers = new PageSubscribers((anyone) => heard.push(anyone))
    const one = page()
    const two = page()
    subscribers.add(one)
    subscribers.add(two)
    subscribers.drop(one)
    // A page that was not there changes nothing.
    subscribers.drop(one)
    subscribers.drop(two)
    expect(heard).toEqual([true, true, true, false])
    expect(subscribers.size).toBe(0)
  })

  it('lets a page go with its reload or its end, and sends to the pages still there', () => {
    const heard: boolean[] = []
    const subscribers = new PageSubscribers((anyone) => heard.push(anyone))
    const reloaded = page()
    const closed = page()
    subscribers.add(reloaded)
    subscribers.add(closed)
    reload(reloaded)
    expect(subscribers.has(reloaded)).toBe(false)
    subscribers.send('board:update', { n: 1 })
    expect(reloaded.sent).toEqual([])
    expect(closed.sent).toEqual([['board:update', { n: 1 }]])
    closed.destroy()
    expect(subscribers.size).toBe(0)
    expect(heard).toEqual([true, true, true, false])
  })

  it('follows a page once however often it subscribes, and apart from another board', () => {
    const clipboard: boolean[] = []
    const docker: boolean[] = []
    const one = new PageSubscribers((anyone) => clipboard.push(anyone))
    const two = new PageSubscribers((anyone) => docker.push(anyone))
    const shared = page()
    one.add(shared)
    one.add(shared)
    two.add(shared)
    expect(shared.listenerCount('did-start-navigation')).toBe(1)
    one.drop(shared)
    expect(one.size).toBe(0)
    expect(two.has(shared)).toBe(true)
    // A reload drops it from every board it was on.
    one.add(shared)
    reload(shared)
    expect([one.size, two.size]).toEqual([0, 0])
    expect(clipboard.at(-1)).toBe(false)
    expect(docker).toEqual([true, false])
  })
})
