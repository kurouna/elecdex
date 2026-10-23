import { EventEmitter } from 'node:events'

/**
 * ipcMain as a main module's IPC tests need it: handlers kept by channel for the test to call,
 * and listeners kept as Electron keeps them (several on one channel, each removed by itself).
 * Every IPC test mocks electron, and each copy of this fake used to differ in whether a second
 * handler on a channel threw; Electron throws, so every module is now held to that.
 *
 * vi.mock factories are hoisted above the test file's imports, so a file takes this through
 * `vi.hoisted` with a dynamic import and hands `ipcMain` to its factory.
 */

export type Handler = (event: unknown, ...args: unknown[]) => unknown

export function fakeIpcMain() {
  const handles = new Map<string, Handler>()
  const bus = new EventEmitter()
  return {
    handles,
    bus,
    ipcMain: {
      handle: (channel: string, handler: Handler) => {
        if (handles.has(channel)) throw new Error(`second handler for ${channel}`)
        handles.set(channel, handler)
      },
      removeHandler: (channel: string) => handles.delete(channel),
      on: (channel: string, listener: (...args: unknown[]) => void) => bus.on(channel, listener),
      off: (channel: string, listener: (...args: unknown[]) => void) => bus.off(channel, listener),
    },
    /** Forgets every handler and listener, as a fresh main would have none. */
    reset: () => {
      handles.clear()
      bus.removeAllListeners()
    },
  }
}
