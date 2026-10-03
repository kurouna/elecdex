import type { Tone } from '@shared/chip8/audio'
import { emuAudio } from '../emu/audio.ts'
import type { BuzzerMessage } from './buzzer-worklet.ts'
import buzzerWorklet from './buzzer-worklet.ts?worker&url'

/**
 * The CHIP-8 panes' sound (docs/architecture.md section 5.18).
 *
 * The emulator panes' one AudioContext (widgets/emu/audio.ts) carries it: made only when a
 * pane first has something to play with sound on, asleep once nothing has sounded for a few
 * seconds. Each pane has its own voice on the audio thread (buzzer-worklet) behind its own
 * gain. Nothing is made while interface sounds are off, the pane is muted or the volume is
 * nothing: the e2e runs (sound off) never open a context.
 */

export interface BuzzerOptions {
  /** Interface sounds are on (settings.sound.enabled). */
  enabled: () => boolean
  /** 0 to 1 (settings.chip8.volume). */
  volume: () => number
}

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
    emuAudio.wake()
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
    void emuAudio.get(buzzerWorklet).then((ac) => {
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
    this.#node?.port.postMessage('dispose' satisfies BuzzerMessage)
    this.#node?.disconnect()
    this.#gain?.disconnect()
    this.#node = null
    this.#gain = null
  }
}
