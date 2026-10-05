import type { ApuFrame } from '@shared/elec16/apu'
import { emuAudio } from '../emu/audio.ts'
import type { ApuMessage, ApuReport } from './apu-worklet.ts'
import apuWorklet from './apu-worklet.ts?worker&url'

/**
 * PLAY-320's sound in the page (docs/elec16-play.md section 5): one voice on the emulator
 * panes' AudioContext (widgets/emu/audio.ts), the apu worklet behind this pane's gain, sent
 * the machine's channels once a frame that changed. Made only when a channel is first keyed
 * with sound on and the volume above nothing: the e2e runs (sound off) never open a context.
 * The same settings as the buzzer: interface sounds, and the ELEC-16's volume.
 */

export interface Elec16ApuOptions {
  /** Interface sounds are on (settings.sound.enabled). */
  enabled: () => boolean
  /** 0 to 1 (settings.elec16.volume). */
  volume: () => number
}

export class Elec16Apu {
  readonly #options: Elec16ApuOptions
  #node: AudioWorkletNode | null = null
  #gain: GainNode | null = null
  #making = false
  #gone = false
  #pending: ApuFrame | null = null
  /** Nothing sent since the last 'stop': silencing again (every frame, while muted) sends none. */
  #stopped = true

  constructor(options: Elec16ApuOptions) {
    this.#options = options
  }

  #audible(): boolean {
    return !this.#gone && this.#options.enabled() && this.#options.volume() > 0
  }

  /** The machine's channels now (a frame that changed). */
  play(frame: ApuFrame): void {
    if (!this.#audible()) {
      this.silence()
      return
    }
    if (this.#node === null) {
      // Nothing made until something is keyed: a game with no sound opens no audio device.
      if (!frame.ch.some((c) => c.ons > 0)) return
      this.#pending = frame
      this.#make()
      return
    }
    if (this.#gain !== null) this.#gain.gain.value = this.#options.volume()
    emuAudio.wake()
    this.#stopped = false
    this.#node.port.postMessage(frame satisfies ApuMessage)
  }

  /** Every voice let go at once (pause, a hidden pane, a reset). */
  silence(): void {
    this.#pending = null
    emuAudio.hold(this, false)
    if (this.#stopped || this.#node === null) return
    this.#stopped = true
    this.#node.port.postMessage('stop' satisfies ApuMessage)
  }

  #make(): void {
    if (this.#making) return
    this.#making = true
    void emuAudio.get(apuWorklet).then((ac) => {
      this.#making = false
      if (ac === null || this.#gone) return
      const node = new AudioWorkletNode(ac, 'elec16-apu', { outputChannelCount: [2] })
      // A note held with nothing new sent still sounds: the worklet says while it does.
      node.port.onmessage = (event: MessageEvent<ApuReport>) => {
        if (!this.#gone) emuAudio.hold(this, event.data === true)
      }
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
    if (this.#node !== null) this.#node.port.onmessage = null
    this.#node?.port.postMessage('dispose' satisfies ApuMessage)
    this.#node?.disconnect()
    this.#gain?.disconnect()
    this.#node = null
    this.#gain = null
  }
}
