import { romFromFile } from '@shared/elec16/rom'
import type { Elec16Roms } from './unit-session.svelte.ts'

/**
 * The two ROMs a pane runs (docs/elec16.md section 9): the pocket ROM and the PLAY ROM, each in
 * a chunk of its own the first time a pane needs them, so a unit can be moved between the two
 * in TUNE. Loaded and decoded once for the page, however many panes mount (or a pane moved
 * mounts again); null when either cannot be read.
 */
export interface LoadedRoms {
  images: Elec16Roms
  symbols: Readonly<Record<'pocket' | 'play', Readonly<Record<string, number>>>>
}

let loading: Promise<LoadedRoms | null> | null = null

export function loadRoms(): Promise<LoadedRoms | null> {
  loading ??= Promise.all([import('./rom.json'), import('./play-rom.json')]).then(
    ([pocket, play]) => {
      const images = { pocket: romFromFile(pocket.default), play: romFromFile(play.default) }
      if (images.pocket === null || images.play === null) return null
      return {
        images: { pocket: images.pocket, play: images.play },
        symbols: { pocket: pocket.default.symbols, play: play.default.symbols },
      }
    },
    () => null,
  )
  const now = loading
  // A ROM that could not be had is asked for again by the next pane, not kept as missing.
  void now.then((roms) => {
    if (roms === null && loading === now) loading = null
  })
  return now
}
