import type { Tone } from '@shared/chip8/audio'
import buzzerWorklet from './buzzer-worklet.ts?worker&url'

/**
 * The CHIP-8 panes' sound (docs/architecture.md section 5.18).
 *
 * One AudioContext for every pane, made only when a pane first has something to play with
 * sound on, and put to sleep once nothing has sounded for a few seconds, so a silent game
 * holds no audio device. Each pane has its own voice on the audio thread (buzzer-worklet)
 * behind its own gain. Nothing is made while interface sounds are off, the pane is muted
 * or the volume is nothing: the e2e runs (sound off) never open a context.
 */

const SLEEP_AFTER_MS = 4000

export interface BuzzerOptions {
  /** Interface sounds are on (settings.sound.enabled). */
  enabled: () => boolean
  /** 0 to 1 (settings.chip8.volume). */
  volume: () => number
}

type Factory = () => AudioContext

class SharedContext {
  #ac: AudioContext | null = null
  #ready: Promise<AudioContext | null> | null = null
  #failed = false
  #sleep: ReturnType<typeof setTimeout> | null = null
  #create: Factory = () => new AudioContext({ latencyHint: 'interactive' })

  /** The context with the worklet loaded; null where the page cannot make one. */
  get(): Promise<AudioContext | null> {
    if (this.#failed) return Promise.resolve(null)
    this.#ready ??= (async () => {
      try {
        const ac = this.#create()
        await ac.audioWorklet.addModule(buzzerWorklet)
        this.#ac = ac
        return ac
      } catch {
        this.#failed = true
        return null
      }
    })()
    return this.#ready
  }

  /** Something is sounding: awake, and sleeping again only after a quiet while. */
  wake(): void {
    const ac = this.#ac
    if (ac === null) return
    if (ac.state === 'suspended') void ac.resume().catch(() => {})
    if (this.#sleep !== null) clearTimeout(this.#sleep)
    this.#sleep = setTimeout(() => {
      this.#sleep = null
      void ac.suspend().catch(() => {})
    }, SLEEP_AFTER_MS)
  }
}

const shared = new SharedContext()

/** One pane's buzzer. */
export class Buzzer {
  readonly #options: BuzzerOptions
  #node: AudioWorkletNode | null = null
  #gain: GainNode | null = null
  #making = false
  #muted = false
  #gone = false
  /** The last tone asked for while the node was still being made. */
  #pending: Tone | null = null

  constructor(options: BuzzerOptions) {
    this.#options = options
  }

  set muted(muted: boolean) {
    this.#muted = muted
    if (muted) this.silence()
  }

  #audible(): boolean {
    return !this.#gone && !this.#muted && this.#options.enabled() && this.#options.volume() > 0
  }

  /** A frame's tone: plays what is left of the sound timer, or nothing. */
  play(tone: Tone): void {
    if (tone.seconds <= 0) {
      // Nothing to start: a voice already made simply runs out on its own.
      return
    }
    if (!this.#audible()) {
      this.silence()
      return
    }
    if (this.#node === null) {
      this.#pending = tone
      this.#make()
      return
    }
    if (this.#gain !== null) this.#gain.gain.value = this.#options.volume()
    shared.wake()
    this.#node.port.postMessage(tone)
  }

  /** Stops what sounds, at once (pause, a hidden pane, a reset). */
  silence(): void {
    this.#pending = null
    this.#node?.port.postMessage(null)
  }

  #make(): void {
    if (this.#making) return
    this.#making = true
    void shared.get().then((ac) => {
      this.#making = false
      if (ac === null || this.#gone) return
      const node = new AudioWorkletNode(ac, 'chip8-buzzer', { outputChannelCount: [1] })
      const gain = ac.createGain()
      gain.gain.value = this.#options.volume()
      node.connect(gain).connect(ac.destination)
      this.#node = node
      this.#gain = gain
      const pending = this.#pending
      this.#pending = null
      if (pending !== null) this.play(pending)
    })
  }

  dispose(): void {
    this.silence()
    this.#gone = true
    this.#node?.disconnect()
    this.#gain?.disconnect()
    this.#node = null
    this.#gain = null
  }
}
