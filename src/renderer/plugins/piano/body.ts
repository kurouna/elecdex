import { seeded } from './model.js'

/**
 * What the strings' force becomes before it is heard (docs/plugins.md section 13.8): the
 * soundboard, and the room. Both are impulse responses made here from a recipe, never
 * recorded, and played through the page's ConvolverNode.
 *
 * The soundboard is a plate of a few hundred modes, evenly dense (a plate's are), their losses
 * a few percent, radiating the bass poorly and the top less: the strings pass through it
 * whole, which is commuted synthesis - the board's colour, and the knock of the blow, without
 * a board to simulate. Left and right are two boards a little apart, which is the width.
 * The room is early reflections and then a tail of noise that darkens as it dies.
 */

/** The soundboard's response, two channels, each of unit energy. */
export function soundboardResponse(sampleRate: number, seconds = 0.4): Float32Array[] {
  return [0, 1].map((side) => board(sampleRate, seconds, 7717 + side * 131))
}

function board(sampleRate: number, seconds: number, seed: number): Float32Array {
  const random = seeded(seed)
  const length = Math.round(sampleRate * seconds)
  const out = new Float64Array(length)
  const top = Math.min(9000, sampleRate * 0.45)
  let f = 42
  while (f < top) {
    const loss = f < 200 ? 0.045 : 0.045 - 0.022 * Math.min(1, Math.log10(f / 200) / Math.log10(5))
    const decay = Math.PI * f * loss
    // What is heard is the board's acceleration more than its velocity: a surface small
    // against the wavelength radiates rising 6 dB an octave, until about where its bending
    // waves outrun sound. Nothing below its first modes; its mobility falls in the top.
    const radiation =
      ((f / (f + 45)) ** 2 * (f / 1600 / Math.sqrt(1 + (f / 1600) ** 2))) /
      Math.sqrt(1 + (f / 5500) ** 2)
    const amplitude = radiation * gaussian(random)
    const phase = random() * Math.PI * 2
    // A decaying phasor turned sample by sample: no sine per sample.
    const w = (2 * Math.PI * f) / sampleRate
    const r = Math.exp(-decay / sampleRate)
    const cr = r * Math.cos(w)
    const ci = r * Math.sin(w)
    const end = Math.min(length, Math.ceil((sampleRate * 9) / decay))
    let re = amplitude * Math.cos(phase)
    let im = amplitude * Math.sin(phase)
    for (let i = 0; i < end; i++) {
      out[i] = (out[i] as number) + im
      const next = re * cr - im * ci
      im = re * ci + im * cr
      re = next
    }
    f += 16 * (0.4 + 1.2 * random())
  }
  let energy = 0
  for (const x of out) energy += x * x
  const scale = 1 / Math.sqrt(energy)
  const result = new Float32Array(length)
  for (let i = 0; i < length; i++) result[i] = (out[i] as number) * scale
  return result
}

/** A room: a few early reflections, then a tail that darkens as it dies. Two channels. */
export function roomResponse(sampleRate: number, seconds = 1.9, rt60 = 1.6): Float32Array[] {
  return [0, 1].map((side) => {
    const random = seeded(4242 + side * 977)
    const length = Math.round(sampleRate * seconds)
    const out = new Float32Array(length)
    for (let i = 0; i < 9; i++) {
      const at = Math.round(sampleRate * (0.006 + random() * 0.04))
      out[at] = (out[at] as number) + (random() < 0.5 ? -1 : 1) * (0.35 + random() * 0.35)
    }
    const start = Math.round(sampleRate * 0.012)
    let low = 0
    let a = 0
    let level = 0
    const fall = 10 ** (-3 / rt60 / sampleRate)
    for (let i = start; i < length; i++) {
      const t = (i - start) / sampleRate
      if ((i - start) % 64 === 0) {
        // The cut-off falls from about 9 kHz to 1.5 kHz: the air takes the top first.
        const cutoff = 1500 + 7500 * Math.exp(-t / 0.35)
        a = 1 - Math.exp((-2 * Math.PI * cutoff) / sampleRate)
        level = 0.9 * 10 ** ((-3 * t) / rt60)
      } else level *= fall
      low += a * (random() * 2 - 1 - low)
      out[i] = (out[i] as number) + low * Math.min(1, t / 0.02) * level
    }
    let energy = 0
    for (const x of out) energy += x * x
    const scale = 1 / Math.sqrt(energy)
    for (let i = 0; i < length; i++) out[i] = (out[i] as number) * scale
    return out
  })
}

/** A normal deviate (Box-Muller), from the seeded generator. */
function gaussian(random: () => number): number {
  const u = Math.max(1e-12, random())
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random())
}
