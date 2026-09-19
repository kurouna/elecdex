import path from 'node:path'
import { CH } from '@shared/channels'
import { defaultLayout, fallbackNode, upgradeDefaultHeights } from '@shared/default-layout'
import { normalizeTree } from '@shared/layout-ops'
import {
  cleanLayoutName,
  type SavedLayoutsFile,
  SavedLayoutsFileSchema,
  summarize,
  withSavedLayout,
} from '@shared/layouts'
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
    // Read from disk on every load. A page loads its layout once, so this is
    // cheap, and it is what makes a layout.json edited by hand while the app is
    // running take effect on the next reload instead of being masked by a cache.
    store.invalidate()
    const tree = store.read(migrateLayout)
    return normalizeTree({ ...tree, root: upgradeDefaultHeights(tree.root) }, fallbackNode())
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

  /**
   * Saved layouts, in a file of their own so that layout.json keeps meaning
   * exactly what it did: the one live arrangement, editable by hand.
   */
  const saved = new JsonStore<SavedLayoutsFile>({
    file: path.join(app.getPath('userData'), 'layouts.json'),
    schema: SavedLayoutsFileSchema,
    makeDefault: () => ({ version: 1, items: [] }),
  })

  const readSaved = (): SavedLayoutsFile => saved.read()

  ipcMain.handle(CH.layout.savedList, () => summarize(readSaved().items))

  ipcMain.handle(CH.layout.savedSave, (_event, rawName: unknown, rawTree: unknown) => {
    const current = readSaved()
    const name = cleanLayoutName(rawName)
    const parsed = LayoutTreeSchema.safeParse(rawTree)
    // A name that is not one, or a tree the renderer mangled: keep the list as
    // it is rather than saving something that cannot be shown or applied.
    if (name === null || !parsed.success) return summarize(current.items)

    const tree = normalizeTree(parsed.data, fallbackNode())
    const next = withSavedLayout(current.items, { id: newLayoutId(current.items), name, tree })
    if (next === null) return summarize(current.items)
    saved.write({ ...current, items: next })
    return summarize(next)
  })

  ipcMain.handle(CH.layout.savedApply, (_event, rawId: unknown): LayoutTree | null => {
    const entry = readSaved().items.find((item) => item.id === rawId)
    if (entry === undefined) return null
    // Normalised again on the way out: the file may have been edited by hand
    // since it was saved, and a live layout is never taken on trust.
    const tree = normalizeTree(entry.tree, fallbackNode())
    store.write(tree)
    return tree
  })

  ipcMain.handle(CH.layout.savedRemove, (_event, rawId: unknown) => {
    const current = readSaved()
    const items = current.items.filter((item) => item.id !== rawId)
    if (items.length !== current.items.length) saved.write({ ...current, items })
    return summarize(items)
  })

  return {
    dispose: () => {
      ipcMain.removeHandler(CH.layout.load)
      ipcMain.removeHandler(CH.layout.save)
      ipcMain.removeHandler(CH.layout.reset)
      ipcMain.removeHandler(CH.layout.revealFile)
      ipcMain.removeHandler(CH.layout.savedList)
      ipcMain.removeHandler(CH.layout.savedSave)
      ipcMain.removeHandler(CH.layout.savedApply)
      ipcMain.removeHandler(CH.layout.savedRemove)
    },
  }
}

/** A short id no entry in the list already has. */
function newLayoutId(items: readonly { id: string }[]): string {
  const taken = new Set(items.map((item) => item.id))
  for (;;) {
    const id = Math.random().toString(36).slice(2, 10)
    if (id.length >= 4 && !taken.has(id)) return id
  }
}
