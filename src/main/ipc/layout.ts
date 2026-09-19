import path from 'node:path'
import { CH } from '@shared/channels'
import { defaultLayout, fallbackNode, upgradeDefaultHeights } from '@shared/default-layout'
import { normalizeTree } from '@shared/layout-ops'
import {
  cleanLayoutName,
  moveSavedLayout,
  portableTree,
  renameSavedLayout,
  type SavedLayoutsFile,
  SavedLayoutsFileSchema,
  summarize,
  withLiveTree,
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

  /**
   * Saved layouts, in a file of their own so that layout.json keeps meaning
   * exactly what it did: the one live arrangement, editable by hand.
   */
  const saved = new JsonStore<SavedLayoutsFile>({
    file: path.join(app.getPath('userData'), 'layouts.json'),
    schema: SavedLayoutsFileSchema,
    makeDefault: () => ({ version: 1, items: [], active: null }),
  })

  const readSaved = (): SavedLayoutsFile => saved.read()

  /**
   * Puts the live tree into the layout being worked in, so an arrangement
   * followed rather than re-saved by hand. Nothing is written when no layout is
   * active, or when it already holds this tree.
   */
  function writeBack(tree: LayoutTree): void {
    const current = readSaved()
    // Without the volatile state, a new shell does not rewrite the file, and what
    // is written can be carried to another machine.
    const items = withLiveTree(current.items, current.active, portableTree(tree))
    if (items !== null) keep({ ...current, items })
  }

  /** Records which layout the workspace now belongs to; null for none. */
  function setActive(id: string | null): void {
    const current = readSaved()
    if (current.active === id) return
    keep({ ...current, active: id })
  }

  /**
   * Writes layouts.json, and does not take the live layout down with it.
   *
   * The live arrangement is in layout.json and is already written by the time
   * this runs; a saved copy that cannot be written is worth saying loudly and
   * carrying on from, not worth failing the save the user is actually making.
   */
  function keep(next: SavedLayoutsFile): void {
    try {
      saved.write(next)
    } catch (error) {
      console.error('[elecdex] could not write layouts.json', error)
    }
  }

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
    writeBack(normalized)
    return normalized
  })

  ipcMain.handle(CH.layout.reset, (): LayoutTree => {
    const fresh = defaultLayout()
    store.write(fresh)
    // The default arrangement belongs to no saved layout: without this, a reset
    // would be written back over whichever one was being worked in.
    setActive(null)
    return fresh
  })

  ipcMain.handle(CH.layout.revealFile, () => store.path)

  ipcMain.handle(CH.layout.savedList, () => {
    const current = readSaved()
    return summarize(current.items, current.active)
  })

  ipcMain.handle(CH.layout.savedSave, (_event, rawName: unknown, rawTree: unknown) => {
    const current = readSaved()
    const name = cleanLayoutName(rawName)
    const parsed = LayoutTreeSchema.safeParse(rawTree)
    // A name that is not one, or a tree the renderer mangled: keep the list as
    // it is rather than saving something that cannot be shown or applied.
    if (name === null || !parsed.success) return summarize(current.items, current.active)

    const tree = portableTree(normalizeTree(parsed.data, fallbackNode()))
    const next = withSavedLayout(current.items, { id: newLayoutId(current.items), name, tree })
    if (next === null) return summarize(current.items, current.active)
    // Saving the workspace under a name is also entering that layout: what
    // happens to the arrangement next belongs to it.
    const active = next.find((item) => item.name === name)?.id ?? current.active
    saved.write({ ...current, items: next, active })
    return summarize(next, active)
  })

  ipcMain.handle(CH.layout.savedApply, (_event, rawId: unknown): LayoutTree | null => {
    const entry = readSaved().items.find((item) => item.id === rawId)
    if (entry === undefined) return null
    // Normalised again on the way out: the file may have been edited by hand
    // since it was saved, and a live layout is never taken on trust.
    // Migrated as well as normalised: a saved layout outlives the build that
    // wrote it, so it goes through the same door as layout.json does.
    const migrated = migrateLayout(entry.tree)
    if (migrated === null) return null
    const tree = normalizeTree(migrated, fallbackNode())
    store.write(tree)
    setActive(entry.id)
    return tree
  })

  ipcMain.handle(CH.layout.savedFile, () => saved.path)

  ipcMain.handle(CH.layout.savedRename, (_event, rawId: unknown, rawName: unknown) => {
    const current = readSaved()
    const name = cleanLayoutName(rawName)
    const items = name === null ? null : renameSavedLayout(current.items, String(rawId), name)
    // A name that is not one, or that another layout already has: the list is
    // returned unchanged, and the dialog puts the old name back.
    if (items === null) return summarize(current.items, current.active)
    saved.write({ ...current, items })
    return summarize(items, current.active)
  })

  ipcMain.handle(CH.layout.savedMove, (_event, rawId: unknown, rawDelta: unknown) => {
    const current = readSaved()
    const delta = typeof rawDelta === 'number' ? rawDelta : 0
    const items = moveSavedLayout(current.items, String(rawId), delta)
    if (items === null) return summarize(current.items, current.active)
    saved.write({ ...current, items })
    return summarize(items, current.active)
  })

  ipcMain.handle(CH.layout.savedRemove, (_event, rawId: unknown) => {
    const current = readSaved()
    const items = current.items.filter((item) => item.id !== rawId)
    // A workspace whose layout was forgotten belongs to none: it is not written
    // back into the next layout that happens to take that id.
    const active = current.active === rawId ? null : current.active
    if (items.length !== current.items.length) saved.write({ ...current, items, active })
    return summarize(items, active)
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
      ipcMain.removeHandler(CH.layout.savedRename)
      ipcMain.removeHandler(CH.layout.savedMove)
      ipcMain.removeHandler(CH.layout.savedFile)
    },
  }
}

/**
 * A short id no entry in the list already has.
 *
 * Bounded rather than looping until it wins: a dozen entries and eight random
 * characters make a clash vanishingly unlikely, and a loop that cannot end is
 * not worth leaving in main whatever the odds.
 */
function newLayoutId(items: readonly { id: string }[]): string {
  const taken = new Set(items.map((item) => item.id))
  for (let tries = 0; tries < 20; tries += 1) {
    const id = Math.random().toString(36).slice(2, 10).padEnd(4, '0')
    if (!taken.has(id)) return id
  }
  // Every id is four to thirty-two characters of [a-z0-9]; this is one of them
  // and cannot clash, since the list is far shorter than the counter's range.
  for (let n = 0; ; n += 1) {
    const id = `l${n.toString(36).padStart(3, '0')}`
    if (!taken.has(id)) return id
  }
}
