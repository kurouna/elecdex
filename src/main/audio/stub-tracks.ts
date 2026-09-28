import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * The `tracks` stand-in for the spectrum's sound (ELECDEX_AUDIO_STUB=tracks): the WAV files
 * `ELECDEX_AUDIO_TRACKS` names, one of which main hands to the capture window to play, so a
 * recorded demo's spectrum moves with the music it plays and nothing of the machine's own
 * sound is captured. Nothing plays until a take says which, through
 * `globalThis.__elecdexAudio`; and a track is sent to the speakers only when it says so, so a
 * test that uses this stand-in is never heard.
 */

/** What the capture window is handed: a WAV file's bytes, and whether to play it aloud. */
export interface StubTrack {
  wav: Uint8Array
  heard: boolean
}

export interface AudioHooks {
  /** Plays the track at `index` from its start (null: silence); aloud only when `heard`. */
  play(index: number | null, heard?: boolean): void
  /** The track playing, by its index, or null. */
  playing(): number | null
}

/** A WAV file is at most this large: a few minutes of CD-quality stereo. */
const MAX_BYTES = 64 * 1024 * 1024

/** The files `ELECDEX_AUDIO_TRACKS` names, separated as a PATH is. */
export const trackFiles = (value: string | undefined): string[] =>
  (value ?? '').split(path.delimiter).filter((file) => file.trim() !== '')

/** Whether the bytes begin as a RIFF WAVE file does. */
export function isWav(bytes: Uint8Array): boolean {
  const text = (from: number) => String.fromCharCode(...bytes.subarray(from, from + 4))
  return bytes.length > 44 && text(0) === 'RIFF' && text(8) === 'WAVE'
}

export class StubTracks {
  private index: number | null = null
  private heard = false
  private readonly listeners = new Set<(track: StubTrack | null) => void>()
  private readonly files: readonly string[]
  private readonly read: (file: string) => Uint8Array

  constructor(files: readonly string[], read: (file: string) => Uint8Array = readFileSync) {
    this.files = files
    this.read = read
  }

  /** The hooks a take drives it by, also set on `globalThis.__elecdexAudio`. */
  hooks(): AudioHooks {
    const hooks: AudioHooks = {
      play: (index, heard = false) => this.play(index, heard),
      playing: () => this.index,
    }
    ;(globalThis as { __elecdexAudio?: AudioHooks }).__elecdexAudio = hooks
    return hooks
  }

  play(index: number | null, heard: boolean): void {
    this.index = index !== null && index >= 0 && index < this.files.length ? index : null
    this.heard = heard
    const track = this.current()
    for (const listener of this.listeners) listener(track)
  }

  /** The track to play now, read afresh; null for silence or a file that is not a WAV. */
  current(): StubTrack | null {
    const file = this.index === null ? undefined : this.files[this.index]
    if (file === undefined) return null
    try {
      const wav = this.read(file)
      return wav.length <= MAX_BYTES && isWav(wav) ? { wav, heard: this.heard } : null
    } catch {
      return null
    }
  }

  /** Calls `listener` on every change; returns how to stop. */
  onChange(listener: (track: StubTrack | null) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}
