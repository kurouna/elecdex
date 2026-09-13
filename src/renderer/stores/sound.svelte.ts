import { Sfx } from '../lib/sfx.ts'
import { appearance } from './appearance.svelte.ts'

/** The app's interface sounds, following the sound settings live. */
export const sfx = new Sfx({
  enabled: () => appearance.settings.sound.enabled,
  volume: () => appearance.settings.sound.volume,
})
