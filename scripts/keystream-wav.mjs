/**
 * A KEYSTREAM track as a WAV file: its band and its whole melody, played by the instruments the
 * plugin's host plays them with (src/renderer/plugins/instruments, through
 * instruments-wav.mjs's render and hearing), from the first bar - no count-in - to the last
 * note's end. Nothing is recorded or sampled: the sound is worked out here, as in the app.
 *
 * What the tours play into the spectrum pane's stand-in (ELECDEX_AUDIO_STUB=tracks), and what
 * can be listened to on its own:
 *
 *   node scripts/keystream-wav.mjs <track id> [out.wav] [--lead=<voice>]
 *
 * The melody is played as the keys would play it, at the plugin's key level; the band at its
 * own. The mix goes through a limiter like the page's (synth.ts: a master at 0.9 into a
 * compressor at -10 dB, 12:1) and is brought to a peak just under full scale.
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { trackChart } from './demo-keystream-kit.mjs'
import { hear, RATE, render, wav } from './instruments-wav.mjs'

/** The plugin's volume setting the tours use, and the key level it plays the melody at. */
const VOLUME = 0.8
const KEY_LEVEL = 0.85

/** The notes of a track for render(): seconds, from the first bar. */
export function trackNotes(id, lead) {
  const chart = trackChart(id, 'normal')
  const notes = []
  for (const cue of chart.band) {
    if (cue.time < 0) continue
    notes.push({
      t: cue.time / 1000,
      pitch: cue.pitch,
      level: cue.level * VOLUME,
      length: cue.length === null ? null : cue.length / 1000,
      voice: cue.voice,
      pan: cue.pan,
    })
  }
  for (const note of chart.notes) {
    notes.push({
      t: note.time / 1000,
      pitch: note.pitch,
      level: KEY_LEVEL * VOLUME,
      length: (note.length * 0.95) / 1000,
      voice: lead,
    })
  }
  return { notes, seconds: chart.duration / 1000 }
}

/** The page's limiter, sample by sample on the louder channel: -10 dB, 12:1, 2 ms / 120 ms. */
function limit([l, r]) {
  const threshold = 10 ** (-10 / 20)
  const attack = 1 - Math.exp(-1 / (0.002 * RATE))
  const release = 1 - Math.exp(-1 / (0.12 * RATE))
  let envelope = 0
  let peak = 0
  for (let i = 0; i < l.length; i++) {
    l[i] *= 0.9
    r[i] *= 0.9
    const level = Math.max(Math.abs(l[i]), Math.abs(r[i]))
    envelope += (level > envelope ? attack : release) * (level - envelope)
    const gain =
      envelope > threshold ? (threshold * (envelope / threshold) ** (1 / 12)) / envelope : 1
    l[i] *= gain
    r[i] *= gain
    peak = Math.max(peak, Math.abs(l[i]), Math.abs(r[i]))
  }
  const scale = peak > 0 ? 0.89 / peak : 1
  for (let i = 0; i < l.length; i++) {
    l[i] *= scale
    r[i] *= scale
  }
  return [l, r]
}

/** The track rendered, as a WAV file's bytes. */
export function trackWav(id, lead) {
  const { notes, seconds } = trackNotes(id, lead)
  const { buses, speed } = render(notes)
  const [l, r] = limit(hear(buses))
  const end = Math.min(l.length, Math.ceil((seconds + 2) * RATE))
  return { bytes: wav([l.subarray(0, end), r.subarray(0, end)]), speed }
}

/** Every file under a folder, for the cache's key. */
function* filesUnder(dir) {
  for (const name of readdirSync(dir)) {
    const file = path.join(dir, name)
    if (statSync(file).isDirectory()) yield* filesUnder(file)
    else yield file
  }
}

/**
 * The track's WAV file, rendered once and kept in the system's temp folder under a key of the
 * plugin's and the instruments' sources: a change to either renders it again.
 */
export function cachedTrackWav(id, lead) {
  const hash = createHash('sha256').update(`${id} ${lead}`)
  for (const dir of ['examples/plugins/keystream', 'src/renderer/plugins', 'scripts']) {
    for (const file of [...filesUnder(path.resolve(dir))].sort()) {
      if (dir === 'scripts' && !/(keystream-wav|instruments-wav)\.mjs$/.test(file)) continue
      hash.update(readFileSync(file))
    }
  }
  const folder = path.join(tmpdir(), 'elecdex-demo-tracks')
  mkdirSync(folder, { recursive: true })
  const file = path.join(folder, `${id}-${lead}-${hash.digest('hex').slice(0, 12)}.wav`)
  if (!existsSync(file)) writeFileSync(file, trackWav(id, lead).bytes)
  return file
}

if (import.meta.filename === path.resolve(process.argv[1] ?? '')) {
  const [id, out] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const lead = process.argv.find((a) => a.startsWith('--lead='))?.split('=')[1] ?? 'lead'
  if (id === undefined)
    throw new Error('usage: keystream-wav.mjs <track id> [out.wav] [--lead=voice]')
  const { bytes, speed } = trackWav(id, lead)
  const file = out ?? `out/${id}.wav`
  writeFileSync(file, bytes)
  console.log(`${file}: ${(bytes.length / RATE / 4).toFixed(1)} s, ${speed.toFixed(1)}x real time`)
}
