import { CH } from '@shared/channels'
import type { Chip8Program } from '@shared/chip8-library'
import { ipcMain } from 'electron'
import { Chip8Catalog, findChip8Dir } from '../chip8/catalog.js'

/**
 * The CHIP-8 pane's IPC (docs/architecture.md section 5.18): the library and a program's
 * bytes by id. Read-only, nothing is fetched, and no plugin API reaches it.
 */
export function registerChip8Ipc(catalog = new Chip8Catalog(findChip8Dir())): {
  dispose: () => void
} {
  ipcMain.handle(CH.chip8.list, (): Promise<Chip8Program[]> => catalog.programs())
  ipcMain.handle(CH.chip8.rom, (_event, id: unknown): Promise<Uint8Array | null> => catalog.rom(id))
  return {
    dispose: () => {
      ipcMain.removeHandler(CH.chip8.list)
      ipcMain.removeHandler(CH.chip8.rom)
    },
  }
}
