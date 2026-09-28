// Renders the plugins' physical piano (src/renderer/plugins/piano) to WAV files, the same code
// the audio thread runs, with the soundboard and the room it is heard through - so the voice
// can be listened to and tuned without the app. Node runs the TypeScript as it stands.
//
//   node scripts/piano-wav.mjs [out-dir]        (default: out/piano)
//
// Prints each take's peak and how much faster than real time it rendered.

import { mkdirSync, writeFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { join, resolve } from 'node:path'

// The piano's modules import each other as .js, as the renderer's do (Vite and the tests
// resolve that to the .ts beside it); Node, running the TypeScript as it stands, is told the same.
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
const piano = '../src/renderer/plugins/piano'
const { roomResponse, soundboardResponse } = await import(`${piano}/body.ts`)
const { PianoEngine } = await import(`${piano}/engine.ts`)

const RATE = 48000
const BLOCK = 128
/** The room's share, as the page mixes it. */
export const ROOM_LEVEL = 0.2

const n = (t, pitch, level, length) => ({ t, pitch, level, length })

/** C major triad names to pitches, for the chord takes. */
const chord = (t, pitches, level, length) => pitches.map((p) => n(t, p, level, length))

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

function ode() {
  const beat = 0.5
  const notes = []
  let t = 0.2
  for (const [p, beats] of ODE) {
    notes.push(n(t, p, 0.62, beats * beat * 0.92))
    t += beats * beat
  }
  // The left hand: a chord a bar, low.
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
    notes.push(...chord(0.2 + i * 4 * beat, c, 0.4, 4 * beat * 0.95))
  })
  notes.push(...chord(0.2 + 8 * 4 * beat, [36, 48, 55, 64], 0.45, 3.5))
  return notes
}

export const TAKES = {
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
      // The same with the pedal down: every damper up, and the strings nobody struck ring along.
      { t: 4.4, pedal: true },
      ...arpeggio(4.5, null),
      { t: 10, pedal: false },
    ]
  },
  ode,
}

export function render(notes) {
  const engine = new PianoEngine(RATE)
  const end = Math.max(...notes.map((x) => x.t + (x.length ?? 3))) + 3
  const pedals = notes.filter((x) => x.pedal !== undefined)
  notes = notes.filter((x) => x.pedal === undefined)
  const frames = Math.ceil((end * RATE) / BLOCK) * BLOCK
  const left = new Float32Array(frames)
  const right = new Float32Array(frames)
  for (const x of pedals) engine.pedal(x.pedal, Math.round(x.t * RATE))
  notes.forEach((x, i) => {
    engine.strike(i + 1, x.pitch, x.level, 0, Math.round(x.t * RATE))
    if (x.length !== null) engine.release(i + 1, Math.round((x.t + x.length) * RATE))
  })
  const began = performance.now()
  let maxModes = 0
  for (let f = 0; f < frames; f += BLOCK) {
    engine.render(left.subarray(f, f + BLOCK), right.subarray(f, f + BLOCK), BLOCK, f)
    maxModes = Math.max(maxModes, engine.modes)
  }
  const seconds = (performance.now() - began) / 1000
  return { left, right, speed: frames / RATE / seconds, maxModes }
}

/** out = a * b, by FFT. */
function convolve(a, b) {
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

/** The strings through the soundboard, then the room, as the page's graph does it. */
export function hear(left, right) {
  const [boardL, boardR] = soundboardResponse(RATE)
  const [roomL, roomR] = roomResponse(RATE)
  const l = convolve(left, boardL)
  const r = convolve(right, boardR)
  const wetL = convolve(l, roomL)
  const wetR = convolve(r, roomR)
  for (let i = 0; i < l.length; i++) {
    l[i] += wetL[i] * ROOM_LEVEL
    r[i] += wetR[i] * ROOM_LEVEL
  }
  return [l, r]
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
  const dir = process.argv[2] ?? 'out/piano'
  mkdirSync(dir, { recursive: true })
  for (const [name, take] of Object.entries(TAKES)) {
    const { left, right, speed, maxModes } = render(take())
    const [l, r] = hear(left, right)
    let peak = 0
    for (let i = 0; i < l.length; i++) peak = Math.max(peak, Math.abs(l[i]), Math.abs(r[i]))
    writeFileSync(join(dir, `${name}.wav`), wav([l, r]))
    console.log(
      `${name.padEnd(9)} peak ${peak.toFixed(3)}  ${speed.toFixed(1)}x real time  ${maxModes} modes at most`,
    )
  }
}
