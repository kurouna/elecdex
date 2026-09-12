import path from 'node:path'
import { CH } from '@shared/channels'
import { defaultLayout, fallbackNode } from '@shared/default-layout'
import { normalizeTree } from '@shared/layout-ops'
import { type LayoutTree, LayoutTreeSchema, migrateLayout } from '@shared/schemas/layout'
import { app, ipcMain } from 'electron'
import { JsonStore } from '../store/json-store.js'

/**
 * Layout persistence.
 *
 * The tree is normalised on the way in as well as on the way out: a hand-edited
 * layout.json is a supported way to rearrange the workspace, and it should not
 * be possible to wedge the UI with one.
 */
export function registerLayoutIpc(): { dispose: () => void } {
  const store = new JsonStore<LayoutTree>({
    file: path.join(app.getPath('userData'), 'layout.json'),
    schema: LayoutTreeSchema,
    makeDefault: defaultLayout,
  })

  ipcMain.handle(CH.layout.load, (): LayoutTree => {
    const tree = store.read(migrateLayout)
    return normalizeTree(tree, fallbackNode())
  })

  ipcMain.handle(CH.layout.save, (_event, raw: unknown): LayoutTree => {
    const parsed = LayoutTreeSchema.safeParse(raw)
    if (!parsed.success) {
      // The renderer sent something malformed. Keep what is on disk rather than
      // replacing a good layout with a broken one.
      return normalizeTree(store.read(migrateLayout), fallbackNode())
    }

    const normalized = normalizeTree(parsed.data, fallbackNode())
    store.write(normalized)
    return normalized
  })

  ipcMain.handle(CH.layout.reset, (): LayoutTree => {
    const fresh = defaultLayout()
    store.write(fresh)
    return fresh
  })

  ipcMain.handle(CH.layout.revealFile, () => store.path)

  return {
    dispose: () => {
      ipcMain.removeHandler(CH.layout.load)
      ipcMain.removeHandler(CH.layout.save)
      ipcMain.removeHandler(CH.layout.reset)
      ipcMain.removeHandler(CH.layout.revealFile)
    },
  }
}
