import { binsFromFft, SPECTRUM_FFT_SIZE, SPECTRUM_SMOOTHING } from '@shared/audio'

/**
 * The spectrum of raw 16-bit PCM, computed as Chromium's AnalyserNode does - a
 * Blackman window, magnitudes scaled by 1/N, smoothed over time, in decibels -
 * so the Linux capture (parec) looks the same as the capture page's analyser.
 * Pure apart from its own buffers, and unit-tested.
 */

const N = SPECTRUM_FFT_SIZE
const HALF = N / 2

/** Blackman window, as Chromium's RealtimeAnalyser applies it (alpha 0.16). */
const WINDOW = Float64Array.from({ length: N }, (_, n) => {
  const x = n / N
  return 0.42 - 0.5 * Math.cos(2 * Math.PI * x) + 0.08 * Math.cos(4 * Math.PI * x)
})

export class PcmSpectrum {
  readonly #sampleRate: number
  /** The last N samples, as a ring written at #write. */
  readonly #ring = new Float32Array(N)
  #write = 0
  /** A chunk may end in the middle of a sample: its first byte waits here. */
  #carry: number | null = null
  readonly #smoothed = new Float64Array(HALF)
  readonly #re = new Float64Array(N)
  readonly #im = new Float64Array(N)
  readonly #db = new Float64Array(HALF)

  constructor(sampleRate: number) {
    this.#sampleRate = sampleRate
  }

  /** Takes signed 16-bit little-endian mono samples, in any chunking. */
  push(chunk: Uint8Array): void {
    let i = 0
    if (this.#carry !== null && chunk.length > 0) {
      this.#add(this.#carry | ((chunk[0] as number) << 8))
      this.#carry = null
      i = 1
    }
    for (; i + 1 < chunk.length; i += 2) {
      this.#add((chunk[i] as number) | ((chunk[i + 1] as number) << 8))
    }
    if (i < chunk.length) this.#carry = chunk[i] as number
  }

  /** The current spectrum as the panes' bins; each call is one analyser read. */
  bins(): number[] {
    const re = this.#re
    const im = this.#im
    for (let n = 0; n < N; n++) {
      re[n] = (this.#ring[(this.#write + n) % N] as number) * (WINDOW[n] as number)
      im[n] = 0
    }
    fft(re, im)
    for (let k = 0; k < HALF; k++) {
      const magnitude = Math.hypot(re[k] as number, im[k] as number) / N
      const smoothed =
        SPECTRUM_SMOOTHING * (this.#smoothed[k] as number) + (1 - SPECTRUM_SMOOTHING) * magnitude
      this.#smoothed[k] = smoothed
      this.#db[k] = smoothed > 0 ? 20 * Math.log10(smoothed) : Number.NEGATIVE_INFINITY
    }
    return binsFromFft(this.#db, this.#sampleRate)
  }

  #add(unsigned: number): void {
    const signed = unsigned >= 0x8000 ? unsigned - 0x10000 : unsigned
    this.#ring[this.#write] = signed / 0x8000
    this.#write = (this.#write + 1) % N
  }
}

/** In-place iterative radix-2 FFT; the length must be a power of two. */
function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      swap(re, i, j)
      swap(im, i, j)
    }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const half = size / 2
    const stepRe = Math.cos((-2 * Math.PI) / size)
    const stepIm = Math.sin((-2 * Math.PI) / size)
    for (let start = 0; start < n; start += size) {
      combine(re, im, start, half, stepRe, stepIm)
    }
  }
}

/** One butterfly pass over a block of `2 * half` values. */
function combine(
  re: Float64Array,
  im: Float64Array,
  start: number,
  half: number,
  stepRe: number,
  stepIm: number,
): void {
  let wRe = 1
  let wIm = 0
  for (let k = 0; k < half; k++) {
    const a = start + k
    const b = a + half
    const tRe = (re[b] as number) * wRe - (im[b] as number) * wIm
    const tIm = (re[b] as number) * wIm + (im[b] as number) * wRe
    re[b] = (re[a] as number) - tRe
    im[b] = (im[a] as number) - tIm
    re[a] = (re[a] as number) + tRe
    im[a] = (im[a] as number) + tIm
    const nextRe = wRe * stepRe - wIm * stepIm
    wIm = wRe * stepIm + wIm * stepRe
    wRe = nextRe
  }
}

function swap(values: Float64Array, i: number, j: number): void {
  const t = values[i] as number
  values[i] = values[j] as number
  values[j] = t
}
