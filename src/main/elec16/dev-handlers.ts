import path from 'node:path'
import type { Elec16DevFiles, Elec16DevOpen, Elec16GameImport } from '@shared/elec16-units'
import { type DevFolders, devKey, readGameFolder, writeBack, writeTemplate } from './devgame.js'

/**
 * GAMES ▸ DEVELOP's channels (docs/elec16-play.md section 11), apart from Electron so a test
 * can drive them: each pane of each page has its own folder, named by the pane id the page
 * passes (checked here, as the unit channels check theirs); every read, write and install
 * carries the opening it was made for, and one of an earlier opening is refused; what goes
 * wrong on disk is told in words, never with a path.
 */

/** What is used of the asking page. */
export interface DevPage {
  readonly id: number
  isDestroyed(): boolean
}

export interface DevDeps {
  folders: DevFolders
  /** main's folder picker for the page: one to open, or one to make a new game in. */
  pick(page: DevPage, create: boolean): Promise<string | undefined>
  /** The new game's files; null when the app has no template. Throws when it cannot be read. */
  template(): Record<string, Uint8Array | string> | null
  /** A built cartridge onto the shelf. */
  install(image: Uint8Array, from: string): Elec16GameImport
  /** The page has a folder open: forget its folders when it goes. */
  opened(page: DevPage): void
  /** The pane's folder changed (the watch). */
  changed(page: DevPage, pane: string): void
}

const isPane = (pane: unknown): pane is string =>
  typeof pane === 'string' && pane.length > 0 && pane.length <= 64

const isGen = (gen: unknown): gen is number => Number.isSafeInteger(gen)

/** The largest build the page may write back: assets.e16.ts and compiled.s. */
const ASSETS_MAX = 1 << 20
const COMPILED_MAX = 8 << 20

const NOT_OPEN = { ok: false as const, problem: 'no folder is open' }

export function devHandlers(deps: DevDeps) {
  const { folders } = deps
  const openFor = (page: DevPage, pane: string, dir: string): Elec16DevOpen => {
    const gen = folders.open(devKey(page.id, pane), dir)
    deps.opened(page)
    return { ok: true, name: path.basename(dir), gen }
  }
  return {
    async open(page: DevPage, pane: unknown): Promise<Elec16DevOpen | null> {
      if (!isPane(pane)) return null
      const dir = await deps.pick(page, false)
      // A page that went while the picker was open keeps nothing.
      if (dir === undefined || page.isDestroyed()) return null
      return openFor(page, pane, dir)
    },

    async create(page: DevPage, pane: unknown): Promise<Elec16DevOpen | null> {
      if (!isPane(pane)) return null
      const dir = await deps.pick(page, true)
      if (dir === undefined || page.isDestroyed()) return null
      let files: Record<string, Uint8Array | string> | null
      try {
        files = deps.template()
      } catch {
        files = null
      }
      if (files === null) return { ok: false, problem: 'the game template is not there' }
      const problem = writeTemplate(dir, files)
      if (problem !== null) return { ok: false, problem }
      return openFor(page, pane, dir)
    },

    state(page: DevPage, pane: unknown): { name: string; gen: number } | null {
      return isPane(pane) ? folders.state(devKey(page.id, pane)) : null
    },

    read(page: DevPage, pane: unknown, gen: unknown): Elec16DevFiles {
      const dir = isPane(pane) && isGen(gen) ? folders.dirOf(devKey(page.id, pane), gen) : null
      return dir === null ? NOT_OPEN : readGameFolder(dir)
    },

    write(page: DevPage, pane: unknown, gen: unknown, assets: unknown, compiled: unknown) {
      const dir = isPane(pane) && isGen(gen) ? folders.dirOf(devKey(page.id, pane), gen) : null
      if (dir === null || typeof assets !== 'string' || typeof compiled !== 'string') return false
      if (assets.length > ASSETS_MAX || compiled.length > COMPILED_MAX) return false
      try {
        writeBack(dir, assets, compiled)
        return true
      } catch {
        return false
      }
    },

    install(page: DevPage, pane: unknown, gen: unknown, image: unknown): Elec16GameImport {
      const dir = isPane(pane) && isGen(gen) ? folders.dirOf(devKey(page.id, pane), gen) : null
      if (dir === null) return NOT_OPEN
      if (!(image instanceof Uint8Array)) return { ok: false, problem: 'not a cartridge' }
      try {
        return deps.install(image, path.basename(dir))
      } catch {
        return { ok: false, problem: 'the game could not be put on the shelf' }
      }
    },

    close(page: DevPage, pane: unknown): void {
      if (isPane(pane)) folders.close(devKey(page.id, pane))
    },

    watch(page: DevPage, pane: unknown, on: unknown): void {
      if (!isPane(pane)) return
      folders.watch(devKey(page.id, pane), on === true, () => {
        if (!page.isDestroyed()) deps.changed(page, pane)
      })
    },
  }
}
