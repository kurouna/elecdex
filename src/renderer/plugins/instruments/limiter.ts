/**
 * A look-ahead peak limiter for one of the instruments' outputs (docs/plugins.md section 13.8):
 * a piano's or an electric piano's hardest blow is a spike of a millisecond or two, well above
 * the rest of the note, and left alone it reached the synthesiser's compressor, which is too
 * slow for it - the spike clipped, or the compressor ducked everything for a tenth of a second.
 *
 * The output is delayed by the look-ahead, so the gain is already down when a spike leaves:
 * the smallest gain any sample in the window needs is held, approached over the look-ahead,
 * and released slowly. Below the ceiling nothing is touched but the delay. Pure, and
 * allocation-free per block.
 */

export class PeakLimiter {
  /** Samples of look-ahead: the delay every output shares, so they stay in time. */
  readonly delay: number
  private readonly ceiling: number
  private readonly lineL: Float32Array
  private readonly lineR: Float32Array
  /** The gain each sample in the window needs, in the same ring. */
  private readonly needs: Float32Array
  private at = 0
  private hold = 1
  private holdFor = 0
  private gain = 1
  private readonly attack: number
  private readonly release: number

  constructor(sampleRate: number, ceiling: number, lookahead = 0.0015, release = 0.08) {
    this.delay = Math.max(1, Math.round(sampleRate * lookahead))
    this.ceiling = ceiling
    this.lineL = new Float32Array(this.delay)
    this.lineR = new Float32Array(this.delay)
    this.needs = new Float32Array(this.delay).fill(1)
    // Down within the look-ahead (five time constants), up over the release.
    this.attack = 1 - Math.exp(-5 / this.delay)
    this.release = 1 - Math.exp(-1 / (sampleRate * release))
  }

  /** Limits `frames` samples in place, each leaving `delay` samples after it came. */
  process(left: Float32Array, right: Float32Array, frames: number): void {
    const n = this.delay
    for (let k = 0; k < frames; k++) {
      const l = left[k] as number
      const r = right[k] as number
      const peak = Math.max(Math.abs(l), Math.abs(r))
      const need = peak > this.ceiling ? this.ceiling / peak : 1
      this.needs[this.at] = need
      if (need <= this.hold) {
        this.hold = need
        this.holdFor = n
      } else if (--this.holdFor <= 0) {
        // The held need has left the window: the smallest still in it.
        this.hold = 1
        for (let i = 0; i < n; i++) this.hold = Math.min(this.hold, this.needs[i] as number)
        this.holdFor = n
      }
      this.gain += (this.hold - this.gain) * (this.hold < this.gain ? this.attack : this.release)
      const outL = this.lineL[this.at] as number
      const outR = this.lineR[this.at] as number
      this.lineL[this.at] = l
      this.lineR[this.at] = r
      this.at = (this.at + 1) % n
      // What the ramp has not quite caught is held to the ceiling itself.
      left[k] = Math.max(-this.ceiling, Math.min(this.ceiling, outL * this.gain))
      right[k] = Math.max(-this.ceiling, Math.min(this.ceiling, outR * this.gain))
    }
  }
}
