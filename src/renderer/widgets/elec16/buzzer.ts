import { emuAudio } from '../emu/audio.ts'

/**
 * The ELEC-16's buzzer (docs/elec16.md section 5): a square wave at FREQ, for DUR milliseconds
 * from when DUR was written, or for as long as GATE holds it - BASIC's BEEP. A voice of the
 * context's own nodes on the emulator panes' one AudioContext (widgets/emu/audio.ts), behind
 * this pane's gain. A tone with a length is stopped by the audio clock, not by the next frame,
 * so it lasts what it was asked for. Nothing is made while interface sounds are off or the
 * volume is nothing: the e2e runs (sound off) never open a context.
 */

export interface Elec16BuzzerOptions {
  /** Interface sounds are on (settings.sound.enabled). */
  enabled: () => boolean
  /** 0 to 1 (settings.elec16.volume). */
  volume: () => number
}

/** The level of the square wave at full volume: a square is loud. */
const LEVEL = 0.15

export class Elec16Buzzer {
  readonly #options: Elec16BuzzerOptions
  #osc: OscillatorNode | null = null
  #gain: GainNode | null = null
  #making = false
  #gone = false
  /** The tone last started, to start it once however many frames see it. */
  #mark = ''
  #pending: { freq: number; ms: number } | null = null

  constructor(options: Elec16BuzzerOptions) {
    this.#options = options
  }

  #audible(): boolean {
    return !this.#gone && this.#options.enabled() && this.#options.volume() > 0
  }

  /**
   * The buzzer as the machine has it: `freq` Hz for `ms` more milliseconds (Infinity while
   * gated), `mark` telling one tone from the next; freq 0 or ms 0 is silence.
   */
  play(freq: number, ms: number, mark: string): void {
    if (freq <= 0 || ms <= 0) {
      if (this.#mark !== '') this.silence()
      return
    }
    if (mark === this.#mark) return
    if (!this.#audible()) return
    this.#mark = mark
    if (this.#osc === null) {
      this.#pending = { freq, ms }
      this.#make()
      return
    }
    this.#start(freq, ms)
  }

  #start(freq: number, ms: number): void {
    const osc = this.#osc
    const gain = this.#gain
    if (osc === null || gain === null) return
    emuAudio.wake()
    const now = osc.context.currentTime
    osc.frequency.setValueAtTime(Math.min(20_000, Math.max(20, freq)), now)
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(LEVEL * this.#options.volume(), now)
    if (Number.isFinite(ms)) gain.gain.setValueAtTime(0, now + ms / 1000)
  }

  /** Quiet at once: paused, out of sight, reset. */
  silence(): void {
    this.#mark = ''
    this.#pending = null
    const gain = this.#gain
    if (gain === null) return
    gain.gain.cancelScheduledValues(gain.context.currentTime)
    gain.gain.setValueAtTime(0, gain.context.currentTime)
  }

  #make(): void {
    if (this.#making) return
    this.#making = true
    void emuAudio.get().then((ac) => {
      this.#making = false
      if (ac === null || this.#gone) return
      const osc = ac.createOscillator()
      osc.type = 'square'
      const gain = ac.createGain()
      gain.gain.value = 0
      osc.connect(gain).connect(ac.destination)
      osc.start()
      this.#osc = osc
      this.#gain = gain
      const pending = this.#pending
      this.#pending = null
      if (pending !== null) this.#start(pending.freq, pending.ms)
    })
  }

  dispose(): void {
    this.silence()
    this.#gone = true
    this.#osc?.stop()
    this.#osc?.disconnect()
    this.#gain?.disconnect()
    this.#osc = null
    this.#gain = null
  }
}
