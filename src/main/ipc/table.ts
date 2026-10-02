import { type IpcMainEvent, type IpcMainInvokeEvent, ipcMain, type WebContents } from 'electron'
import { whenPageGoes } from './page-gone.js'

/**
 * A module's channels as one table, registered together and taken down together.
 *
 * Each module used to call `ipcMain.handle` and `ipcMain.on` one by one and list every channel a
 * second time in its `dispose`, where a channel added to the one and forgotten in the other stayed
 * registered after the module went (a second registration of a handle then throws). Here a
 * channel is named once.
 *
 * Arguments arrive as `unknown`: what the page sends is checked by the handler, never trusted
 * by its type.
 */
export interface IpcTable {
  /** Requests the page awaits (`ipcRenderer.invoke`). */
  handle?: Record<string, (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown>
  /** Messages with no answer (`ipcRenderer.send`). */
  on?: Record<string, (event: IpcMainEvent, ...args: unknown[]) => void>
}

/**
 * Registers every channel of `table`; the answer removes them all again - its own listeners
 * only, never another's on the same channel. A channel that cannot be registered (a second
 * handler for it) takes back the ones before it and throws, so nothing is left half there.
 */
export function registerTable(table: IpcTable): () => void {
  const undo: (() => void)[] = []
  const unregister = (): void => {
    for (const step of undo.splice(0).reverse()) step()
  }
  try {
    for (const [channel, handler] of Object.entries(table.handle ?? {})) {
      ipcMain.handle(channel, handler)
      undo.push(() => ipcMain.removeHandler(channel))
    }
    for (const [channel, listener] of Object.entries(table.on ?? {})) {
      ipcMain.on(channel, listener)
      undo.push(() => ipcMain.off(channel, listener))
    }
  } catch (error) {
    unregister()
    throw error
  }
  return unregister
}

/**
 * The pages subscribed to one board (the clipboard, the media session, the engine, the agents):
 * a page joins, leaves, or goes with its reload or its end, and `onChange` hears whether anyone
 * is left - which is what starts and stops the reading behind the board.
 */
export class PageSubscribers {
  readonly #pages = new Set<WebContents>()
  readonly #onChange: (anyone: boolean) => void

  constructor(onChange: (anyone: boolean) => void) {
    this.#onChange = onChange
  }

  /** Adds a page; its reload or its end takes it out again. */
  add(page: WebContents): void {
    whenPageGoes(page, this, () => this.drop(page))
    this.#pages.add(page)
    this.#onChange(true)
  }

  drop(page: WebContents): void {
    if (this.#pages.delete(page)) this.#onChange(this.#pages.size > 0)
  }

  has(page: WebContents): boolean {
    return this.#pages.has(page)
  }

  get size(): number {
    return this.#pages.size
  }

  /** Sends to every page still there. */
  send(channel: string, ...args: unknown[]): void {
    for (const page of this.#pages) if (!page.isDestroyed()) page.send(channel, ...args)
  }
}
