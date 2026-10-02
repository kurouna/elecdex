import { EventEmitter } from 'node:events'
import { describe, expect, it, vi } from 'vitest'

/**
 * A module's channels as one table (main/ipc/table.ts): registered together and taken down
 * together, so a channel is named once and none outlives its module. And the pages subscribed to
 * one board, which go with their reload or their end.
 */

const handles = new Map<string, unknown>()
const ons = new Map<string, unknown>()

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: unknown) => {
      if (handles.has(channel)) throw new Error(`second handler for ${channel}`)
      handles.set(channel, handler)
    },
    removeHandler: (channel: string) => handles.delete(channel),
    on: (channel: string, listener: unknown) => ons.set(channel, listener),
    removeAllListeners: (channel: string) => ons.delete(channel),
  },
}))

const { PageSubscribers, registerTable } = await import('../../src/main/ipc/table.js')

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

describe('a table of channels', () => {
  it('registers every channel, and the answer removes them all', () => {
    const unregister = registerTable({
      handle: { 'a:get': () => 1, 'a:list': () => [] },
      on: { 'a:subscribe': () => {} },
    })
    expect([...handles.keys()]).toEqual(['a:get', 'a:list'])
    expect([...ons.keys()]).toEqual(['a:subscribe'])
    unregister()
    expect(handles.size).toBe(0)
    expect(ons.size).toBe(0)
    // Made again (a test registering IPC twice), nothing is left over to collide with.
    registerTable({ handle: { 'a:get': () => 2 } })()
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
    reloaded.emit('did-start-navigation', { isMainFrame: true, isSameDocument: false })
    expect(subscribers.has(reloaded)).toBe(false)
    subscribers.send('board:update', { n: 1 })
    expect(reloaded.sent).toEqual([])
    expect(closed.sent).toEqual([['board:update', { n: 1 }]])
    closed.destroy()
    expect(subscribers.size).toBe(0)
    expect(heard).toEqual([true, true, true, false])
  })
})
