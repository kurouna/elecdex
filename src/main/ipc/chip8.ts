import path from 'node:path'
import { CH } from '@shared/channels'
import type { Chip8ImportResult, Chip8Program, Chip8SlotInfo } from '@shared/chip8-library'
import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { appWindows } from '../app-windows.js'
import { Chip8Catalog, findChip8Dir } from '../chip8/catalog.js'
import { Chip8Saves } from '../chip8/saves.js'
import { Chip8Store } from '../chip8/store.js'

/**
 * The CHIP-8 pane's IPC (docs/architecture.md section 5.18): the library - bundled and
 * imported, with the user's tuning and stars - a program's bytes by id, and its saved
 * machines. Nothing is fetched, and no plugin API reaches it.
 *
 * An import opens main's own picker, so the page never names a path; every change to the
 * library is told to every window, since two panes may show it.
 */

const PICK_EXTENSIONS = ['ch8', 'c8', 'sc8', 'xo8', 'bin']

export function registerChip8Ipc(
  dir = path.join(app.getPath('userData'), 'chip8'),
  catalog = new Chip8Catalog(findChip8Dir()),
): { dispose: () => void } {
  const store = new Chip8Store(catalog, dir)
  const saves = new Chip8Saves(path.join(dir, 'saves'))

  const changed = async (): Promise<void> => {
    const programs = await store.programs()
    for (const win of appWindows()) {
      if (!win.webContents.isDestroyed()) win.webContents.send(CH.chip8.changed, programs)
    }
  }
  /** Runs a change, and tells the windows when it took. */
  const telling = (done: boolean): boolean => {
    if (done) void changed()
    return done
  }

  ipcMain.handle(CH.chip8.list, (): Promise<Chip8Program[]> => store.programs())
  ipcMain.handle(CH.chip8.rom, (_event, id: unknown): Promise<Uint8Array | null> => store.rom(id))
  ipcMain.handle(
    CH.chip8.tune,
    async (_event, id: unknown, tuning: unknown): Promise<boolean> =>
      telling(await store.tune(id, tuning)),
  )
  ipcMain.handle(
    CH.chip8.favourite,
    async (_event, id: unknown, on: unknown): Promise<boolean> =>
      telling(await store.favourite(id, on)),
  )

  ipcMain.handle(CH.chip8.import, async (event): Promise<Chip8ImportResult | null> => {
    const owner = BrowserWindow.fromWebContents(event.sender)
    const options: Electron.OpenDialogOptions = {
      title: 'Import a CHIP-8 program',
      properties: ['openFile'],
      buttonLabel: 'Import',
      filters: [
        { name: 'CHIP-8 programs', extensions: PICK_EXTENSIONS },
        { name: 'All files', extensions: ['*'] },
      ],
    }
    const picked = owner
      ? await dialog.showOpenDialog(owner, options)
      : await dialog.showOpenDialog(options)
    const file = picked.canceled ? undefined : picked.filePaths[0]
    if (file === undefined) return null
    const result = await store.importFile(file)
    if (result.ok && !result.already) void changed()
    return result
  })

  ipcMain.handle(CH.chip8.update, (_event, id: unknown, change: unknown): boolean => {
    const done = store.update(id, change)
    // The machines kept were another machine's: they would come back as it.
    if (done?.machine && typeof id === 'string') saves.forget(id)
    return telling(done !== null)
  })
  ipcMain.handle(CH.chip8.remove, (_event, id: unknown): boolean => {
    const done = store.remove(id)
    if (done && typeof id === 'string') saves.forget(id)
    return telling(done)
  })

  ipcMain.handle(CH.chip8.slots, (_event, id: unknown): Chip8SlotInfo[] => saves.slots(id))
  ipcMain.handle(
    CH.chip8.save,
    async (_event, id: unknown, slot: unknown, bytes: unknown): Promise<Chip8SlotInfo | null> =>
      // A program just removed leaves no folder behind for a pane's last AUTO.
      (await store.has(id)) ? saves.save(id, slot, bytes) : null,
  )
  ipcMain.handle(CH.chip8.load, (_event, id: unknown, slot: unknown): Uint8Array | null =>
    saves.load(id, slot),
  )

  const channels = [
    CH.chip8.list,
    CH.chip8.rom,
    CH.chip8.tune,
    CH.chip8.favourite,
    CH.chip8.import,
    CH.chip8.update,
    CH.chip8.remove,
    CH.chip8.slots,
    CH.chip8.save,
    CH.chip8.load,
  ]
  return {
    dispose: () => {
      for (const channel of channels) ipcMain.removeHandler(channel)
    },
  }
}
