/**
 * Second-order filters for the instruments on the audio thread (the cabinet, the pickup, the
 * amplifier, the drums): the Audio EQ Cookbook's recipes (Bristow-Johnson), run in plain
 * numbers. Pure, like the instruments.
 */

export type BiquadKind = 'lowpass' | 'highpass' | 'bandpass' | 'peaking' | 'lowshelf' | 'highshelf'

export class Biquad {
  private b0 = 1
  private b1 = 0
  private b2 = 0
  private a1 = 0
  private a2 = 0
  private x1 = 0
  private x2 = 0
  private y1 = 0
  private y2 = 0

  constructor(kind: BiquadKind, freq: number, q: number, sampleRate: number, gainDb = 0) {
    this.set(kind, freq, q, sampleRate, gainDb)
  }

  /** Retunes the filter, keeping what it holds. */
  set(kind: BiquadKind, freq: number, q: number, sampleRate: number, gainDb = 0): void {
    const w = (2 * Math.PI * Math.min(freq, sampleRate * 0.49)) / sampleRate
    const cos = Math.cos(w)
    const alpha = Math.sin(w) / (2 * q)
    const a = 10 ** (gainDb / 40)
    let [b0, b1, b2, a0, a1, a2] = [1, 0, 0, 1, 0, 0]
    if (kind === 'lowpass')
      [b0, b1, b2, a0, a1, a2] = [
        (1 - cos) / 2,
        1 - cos,
        (1 - cos) / 2,
        1 + alpha,
        -2 * cos,
        1 - alpha,
      ]
    else if (kind === 'highpass')
      [b0, b1, b2, a0, a1, a2] = [
        (1 + cos) / 2,
        -(1 + cos),
        (1 + cos) / 2,
        1 + alpha,
        -2 * cos,
        1 - alpha,
      ]
    else if (kind === 'bandpass')
      [b0, b1, b2, a0, a1, a2] = [alpha, 0, -alpha, 1 + alpha, -2 * cos, 1 - alpha]
    else if (kind === 'peaking')
      [b0, b1, b2, a0, a1, a2] = [
        1 + alpha * a,
        -2 * cos,
        1 - alpha * a,
        1 + alpha / a,
        -2 * cos,
        1 - alpha / a,
      ]
    else [b0, b1, b2, a0, a1, a2] = shelf(kind === 'lowshelf', a, cos, alpha)
    this.b0 = b0 / a0
    this.b1 = b1 / a0
    this.b2 = b2 / a0
    this.a1 = a1 / a0
    this.a2 = a2 / a0
  }

  /** One sample through. */
  tick(x: number): number {
    const y =
      this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2
    this.x2 = this.x1
    this.x1 = x
    this.y2 = this.y1
    this.y1 = y
    return y
  }

  /** A run of samples through, in place. */
  run(data: Float32Array | Float64Array, frames: number): void {
    for (let i = 0; i < frames; i++) data[i] = this.tick(data[i] as number)
  }

  /** Forgets what it holds. */
  clear(): void {
    this.x1 = 0
    this.x2 = 0
    this.y1 = 0
    this.y2 = 0
  }
}

type Coefficients = [number, number, number, number, number, number]

function shelf(low: boolean, a: number, cos: number, alpha: number): Coefficients {
  const s = 2 * Math.sqrt(a) * alpha
  const sign = low ? 1 : -1
  return [
    a * (a + 1 - sign * (a - 1) * cos + s),
    sign * 2 * a * (a - 1 - sign * (a + 1) * cos),
    a * (a + 1 - sign * (a - 1) * cos - s),
    a + 1 + sign * (a - 1) * cos + s,
    -sign * 2 * (a - 1 + sign * (a + 1) * cos),
    a + 1 + sign * (a - 1) * cos - s,
  ]
}

/** The impulse response of a chain of filters, `length` samples long. */
export function impulseOf(chain: readonly Biquad[], length: number): Float32Array {
  const out = new Float32Array(length)
  out[0] = 1
  for (const filter of chain) filter.run(out, length)
  return out
}
