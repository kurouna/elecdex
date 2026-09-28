// Renders the plugins' instruments on the audio thread (src/renderer/plugins/instruments) to
// WAV files: the same code the worklet runs, heard through what the page passes each through -
// the piano's soundboard, the guitar's cabinet and delay, and the room - so a voice can be
// listened to and tuned without the app. Node runs the TypeScript as it stands.
//
//   node scripts/instruments-wav.mjs [out-dir] [voice | voice:take ...]    (default: out/instruments)
//
// Prints each take's peak and how much faster than real time it rendered.

import { mkdirSync, writeFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { join, resolve } from 'node:path'

// The modules import each other as .js, as the renderer's do (Vite and the tests resolve that
// to the .ts beside it); Node, running the TypeScript as it stands, is told the same.
registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context)
    } catch (error) {
      if (!specifier.startsWith('.') || !specifier.endsWith('.js')) throw error
      return next(`${specifier.slice(0, -3)}.ts`, context)
    }
  },
})
const plugins = '../src/renderer/plugins'
const { roomResponse, soundboardResponse } = await import(`${plugins}/piano/body.ts`)
const { InstrumentHost } = await import(`${plugins}/instruments/host.ts`)
const { MAKERS } = await import(`${plugins}/instruments/makers.ts`)
const { BUSES, OUTPUTS, ROOM_SEND } = await import(`${plugins}/instruments/catalog.ts`)

export const RATE = 48000
const BLOCK = 128

/** A note: when (s), which key, how hard (0-1), and how long it is held (s; null: its own). */
export const n = (t, pitch, level, length, voice) => ({ t, pitch, level, length, voice })
const chord = (t, pitches, level, length, voice) =>
  pitches.map((p) => n(t, p, level, length, voice))

const ODE = [
  [64, 1],
  [64, 1],
  [65, 1],
  [67, 1],
  [67, 1],
  [65, 1],
  [64, 1],
  [62, 1],
  [60, 1],
  [60, 1],
  [62, 1],
  [64, 1],
  [64, 1.5],
  [62, 0.5],
  [62, 2],
  [64, 1],
  [64, 1],
  [65, 1],
  [67, 1],
  [67, 1],
  [65, 1],
  [64, 1],
  [62, 1],
  [60, 1],
  [60, 1],
  [62, 1],
  [64, 1],
  [62, 1.5],
  [60, 0.5],
  [60, 2],
]

/** Ode to Joy, both hands, on one voice. */
function ode(voice) {
  const beat = 0.5
  const notes = []
  let t = 0.2
  for (const [p, beats] of ODE) {
    notes.push(n(t, p, 0.62, beats * beat * 0.92, voice))
    t += beats * beat
  }
  const bars = [
    [48, 55, 64],
    [43, 55, 59],
    [48, 55, 64],
    [43, 55, 62],
    [48, 55, 64],
    [43, 55, 59],
    [48, 55, 64],
    [43, 55, 60],
  ]
  bars.forEach((c, i) => {
    notes.push(...chord(0.2 + i * 4 * beat, c, 0.4, 4 * beat * 0.95, voice))
  })
  notes.push(...chord(0.2 + 8 * 4 * beat, [36, 48, 55, 64], 0.45, 3.5, voice))
  return notes
}

/** The takes, by voice: each a function giving its notes (and pedal changes). */
export const TAKES = {
  piano: {
    scale: () =>
      [60, 62, 64, 65, 67, 69, 71, 72, 71, 69, 67, 65, 64, 62, 60].map((p, i) =>
        n(0.2 + i * 0.45, p, 0.6, 0.4),
      ),
    chords: () => [
      ...chord(0.2, [48, 60, 64, 67], 0.55, 1.5),
      ...chord(1.9, [45, 57, 60, 64], 0.55, 1.5),
      ...chord(3.6, [41, 57, 60, 65], 0.55, 1.5),
      ...chord(5.3, [43, 55, 59, 62, 67], 0.55, 1.5),
      ...chord(7.0, [36, 48, 60, 64, 67, 72], 0.6, 5),
    ],
    dynamics: () => [0.05, 0.2, 0.4, 0.6, 0.8, 1].map((l, i) => n(0.2 + i * 1.6, 60, l, 1.3)),
    bass: () => [
      n(0.2, 21, 0.75, 3),
      n(3.8, 24, 0.75, 3),
      n(7.4, 28, 0.75, 3),
      n(11, 36, 0.75, 3),
      ...chord(14.6, [36, 48], 0.8, 5),
    ],
    treble: () => [
      ...[84, 88, 91, 96, 100, 103, 108].map((p, i) => n(0.2 + i * 0.18, p, 0.6, 0.12)),
      ...Array.from({ length: 16 }, (_, i) => n(2.2 + i * 0.09, i % 2 ? 98 : 96, 0.5, 0.08)),
      n(4.2, 72, 0.6, 0.15),
      n(4.6, 96, 0.6, 0.15),
    ],
    repeat: () => [
      ...Array.from({ length: 8 }, (_, i) => n(0.2 + i * 0.25, 72, 0.3 + i * 0.08, 0.2)),
      // Struck again while still held: the same strings, not a new note.
      ...Array.from({ length: 6 }, (_, i) => n(2.6 + i * 0.3, 60, 0.6, null)),
      n(4.4, 60, 0.6, 2),
    ],
    pedal: () => {
      const arpeggio = (t, length) =>
        [48, 55, 60, 64, 67, 72].map((p, i) => n(t + i * 0.3, p, 0.55, length))
      return [
        // Dry: each damper falls as its key is let go.
        ...arpeggio(0.2, 0.28),
        // The pedal down: every damper up, and the strings nobody struck ring along.
        { t: 4.4, pedal: true },
        ...arpeggio(4.5, null),
        { t: 10, pedal: false },
      ]
    },
    ode: () => ode('piano'),
  },
}

/** Renders notes through the host: the processor's outputs, whole. */
export function render(notes) {
  const host = new InstrumentHost(RATE, MAKERS)
  const end = Math.max(...notes.map((x) => x.t + (x.length ?? 3))) + 3
  const frames = Math.ceil((end * RATE) / BLOCK) * BLOCK
  const buses = Array.from({ length: OUTPUTS }, () => [
    new Float32Array(frames),
    new Float32Array(frames),
  ])
  notes.forEach((x, i) => {
    if (x.pedal !== undefined) {
      host.receive({ t: 'pedal', on: x.pedal, at: x.t })
      return
    }
    host.receive({
      t: 'strike',
      voice: x.voice ?? 'piano',
      id: i + 1,
      pitch: x.pitch,
      level: x.level,
      pan: 0,
      at: x.t,
    })
    const lift = x.length ?? 1.4
    host.receive({ t: 'release', id: i + 1, at: x.t + lift })
  })
  const began = performance.now()
  for (let f = 0; f < frames; f += BLOCK) {
    host.render(
      buses.map(([l, r]) => [l.subarray(f, f + BLOCK), r.subarray(f, f + BLOCK)]),
      BLOCK,
      f,
    )
  }
  const seconds = (performance.now() - began) / 1000
  return { buses, speed: frames / RATE / seconds }
}

/** out = a * b, by FFT. */
export function convolve(a, b) {
  const size = 2 ** Math.ceil(Math.log2(a.length + b.length))
  const ar = new Float64Array(size)
  const ai = new Float64Array(size)
  const br = new Float64Array(size)
  const bi = new Float64Array(size)
  ar.set(a)
  br.set(b)
  fft(ar, ai, false)
  fft(br, bi, false)
  for (let i = 0; i < size; i++) {
    const re = ar[i] * br[i] - ai[i] * bi[i]
    ai[i] = ar[i] * bi[i] + ai[i] * br[i]
    ar[i] = re
  }
  fft(ar, ai, true)
  const out = new Float32Array(a.length)
  for (let i = 0; i < a.length; i++) out[i] = ar[i] / size
  return out
}

function fft(re, im, inverse) {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j], re[i]]
      ;[im[i], im[j]] = [im[j], im[i]]
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const angle = ((inverse ? 2 : -2) * Math.PI) / len
    const wr = Math.cos(angle)
    const wi = Math.sin(angle)
    for (let i = 0; i < n; i += len) {
      let cr = 1
      let ci = 0
      for (let k = 0; k < len / 2; k++) {
        const a = i + k
        const b = a + len / 2
        const tr = re[b] * cr - im[b] * ci
        const ti = re[b] * ci + im[b] * cr
        re[b] = re[a] - tr
        im[b] = im[a] - ti
        re[a] += tr
        im[a] += ti
        const next = cr * wr - ci * wi
        ci = cr * wi + ci * wr
        cr = next
      }
    }
  }
}

const silent = (x) => x.every((v) => v === 0)

/** The outputs as the page hears them: the soundboard, the rest, and the room of it all. */
export function hear(buses) {
  const frames = buses[0][0].length
  const out = [new Float32Array(frames), new Float32Array(frames)]
  const room = [Float32Array.from(buses[BUSES.room][0]), Float32Array.from(buses[BUSES.room][1])]
  const piano = buses[BUSES.piano]
  if (!silent(piano[0])) {
    const board = soundboardResponse(RATE)
    for (let c = 0; c < 2; c++) {
      const heard = convolve(piano[c], board[c])
      for (let i = 0; i < frames; i++) {
        out[c][i] += heard[i]
        room[c][i] += heard[i] * ROOM_SEND.piano
      }
    }
  }
  for (const bus of [BUSES.guitar, BUSES.plain]) {
    for (let c = 0; c < 2; c++) for (let i = 0; i < frames; i++) out[c][i] += buses[bus][c][i]
  }
  const hall = roomResponse(RATE)
  for (let c = 0; c < 2; c++) {
    if (silent(room[c])) continue
    const wet = convolve(room[c], hall[c])
    for (let i = 0; i < frames; i++) out[c][i] += wet[i]
  }
  return out
}

export function wav(channels) {
  const frames = channels[0].length
  const buffer = Buffer.alloc(44 + frames * 4)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + frames * 4, 4)
  buffer.write('WAVEfmt ', 8)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(2, 22)
  buffer.writeUInt32LE(RATE, 24)
  buffer.writeUInt32LE(RATE * 4, 28)
  buffer.writeUInt16LE(4, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(frames * 4, 40)
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < 2; c++) {
      const x = Math.max(-1, Math.min(1, channels[c][i]))
      buffer.writeInt16LE(Math.round(x * 32767), 44 + i * 4 + c * 2)
    }
  }
  return buffer
}

if (import.meta.filename === resolve(process.argv[1] ?? '')) {
  const dir = process.argv[2] ?? 'out/instruments'
  const wanted = process.argv.slice(3)
  mkdirSync(dir, { recursive: true })
  for (const [voice, takes] of Object.entries(TAKES)) {
    for (const [name, take] of Object.entries(takes)) {
      if (wanted.length > 0 && !wanted.includes(voice) && !wanted.includes(`${voice}:${name}`))
        continue
      const { buses, speed } = render(take())
      const [l, r] = hear(buses)
      let peak = 0
      for (let i = 0; i < l.length; i++) peak = Math.max(peak, Math.abs(l[i]), Math.abs(r[i]))
      writeFileSync(join(dir, `${voice}-${name}.wav`), wav([l, r]))
      console.log(
        `${`${voice}:${name}`.padEnd(16)} peak ${peak.toFixed(3)}  ${speed.toFixed(1)}x real time`,
      )
    }
  }
}
