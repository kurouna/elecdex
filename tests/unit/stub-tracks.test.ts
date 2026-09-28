import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  type AudioHooks,
  isWav,
  type StubTrack,
  StubTracks,
  trackFiles,
} from '../../src/main/audio/stub-tracks.js'

/** A WAV file's first bytes, and some samples after them. */
const wavBytes = (tag = 0): Uint8Array => {
  const bytes = new Uint8Array(64)
  bytes.set(
    [...'RIFF'].map((c) => c.charCodeAt(0)),
    0,
  )
  bytes.set(
    [...'WAVE'].map((c) => c.charCodeAt(0)),
    8,
  )
  bytes[60] = tag
  return bytes
}

const FILES: Record<string, Uint8Array> = {
  'a.wav': wavBytes(1),
  'b.wav': wavBytes(2),
  'text.wav': new TextEncoder().encode('not a wav file at all, only words in it, long enough'),
}
const read = (file: string): Uint8Array => {
  const bytes = FILES[file]
  if (bytes === undefined) throw new Error(`no ${file}`)
  return bytes
}

describe('the tracks stand-in', () => {
  it('reads its files from ELECDEX_AUDIO_TRACKS, separated as a PATH is', () => {
    expect(trackFiles(['a.wav', 'b.wav'].join(path.delimiter))).toEqual(['a.wav', 'b.wav'])
    expect(trackFiles(undefined)).toEqual([])
    expect(trackFiles(` ${path.delimiter}a.wav`)).toEqual(['a.wav'])
  })

  it('knows a WAV by its header', () => {
    expect(isWav(wavBytes())).toBe(true)
    expect(isWav(FILES['text.wav'] as Uint8Array)).toBe(false)
    expect(isWav(wavBytes().subarray(0, 40))).toBe(false)
  })

  it('plays nothing until told, then the track chosen, silently unless told to be heard', () => {
    const tracks = new StubTracks(['a.wav', 'b.wav'], read)
    const handed: (StubTrack | null)[] = []
    tracks.onChange((track) => handed.push(track))
    expect(tracks.current()).toBeNull()

    tracks.play(0, false)
    expect(handed.at(-1)).toEqual({ wav: FILES['a.wav'], heard: false })
    tracks.play(1, true)
    expect(handed.at(-1)).toEqual({ wav: FILES['b.wav'], heard: true })
    expect(tracks.current()).toEqual({ wav: FILES['b.wav'], heard: true })

    tracks.play(null, true)
    expect(handed.at(-1)).toBeNull()
  })

  it('hands over nothing for a place with no file, a file that is missing or not a WAV', () => {
    const tracks = new StubTracks(['text.wav', 'gone.wav'], read)
    for (const index of [0, 1, 2, -1]) {
      tracks.play(index, true)
      expect(tracks.current()).toBeNull()
    }
  })

  it('stops calling a listener that has gone', () => {
    const tracks = new StubTracks(['a.wav'], read)
    const handed: (StubTrack | null)[] = []
    const stop = tracks.onChange((track) => handed.push(track))
    stop()
    tracks.play(0, false)
    expect(handed).toEqual([])
  })

  it('is driven by a take through globalThis.__elecdexAudio, silent by default', () => {
    const tracks = new StubTracks(['a.wav', 'b.wav'], read)
    tracks.hooks()
    const hooks = (globalThis as { __elecdexAudio?: AudioHooks }).__elecdexAudio
    hooks?.play(1)
    expect(hooks?.playing()).toBe(1)
    expect(tracks.current()?.heard).toBe(false)
    hooks?.play(null)
    expect(hooks?.playing()).toBeNull()
  })
})
