import { type ApuFrame, ApuSynth } from '@shared/elec16/apu'

/**
 * PLAY-320's sixteen channels on the audio thread (docs/elec16-play.md section 5): the synth
 * from shared/elec16/apu.ts, told the machine's sound once a frame that changed through its
 * port. It carries each voice's phase and envelope between blocks, so nothing clicks at a
 * frame's edge. Built by Vite as its own script (`?worker&url`) and loaded with
 * audioWorklet.addModule, from the app's own files.
 */

// The AudioWorkletGlobalScope, which the DOM library does not describe.
declare const sampleRate: number
declare class AudioWorkletProcessor {
  readonly port: MessagePort
}
declare function registerProcessor(name: string, processor: new () => AudioWorkletProcessor): void

/** What the page posts: a frame, 'stop' to let every voice go at once, 'dispose' when the pane goes. */
export type ApuMessage = ApuFrame | 'stop' | 'dispose'

/**
 * What the worklet posts back: whether anything sounds, each time that changes - a held note
 * keeps the shared context awake with no frame sent (widgets/emu/audio.ts).
 */
export type ApuReport = boolean

class Elec16ApuProcessor extends AudioWorkletProcessor {
  readonly #synth = new ApuSynth(sampleRate)
  /** False once the pane has gone: `process` says so, and the audio thread lets it go. */
  #alive = true
  #sounding = false

  constructor() {
    super()
    this.port.onmessage = (event: MessageEvent<ApuMessage>) => {
      if (event.data === 'dispose') this.#alive = false
      else if (event.data === 'stop') this.#synth.reset()
      else this.#synth.set(event.data)
    }
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const [left, right] = outputs[0] ?? []
    if (left !== undefined && right !== undefined) {
      this.#synth.render(left, right)
      clamp(left)
      clamp(right)
    }
    const sounding = this.#synth.sounding
    if (sounding !== this.#sounding) {
      this.#sounding = sounding
      this.port.postMessage(sounding satisfies ApuReport)
    }
    return this.#alive
  }
}

/** Every sample within -1 to 1: sixteen loud channels at once would pass it. */
function clamp(samples: Float32Array): void {
  for (let k = 0; k < samples.length; k++) {
    const v = samples[k] ?? 0
    if (v > 1) samples[k] = 1
    else if (v < -1) samples[k] = -1
  }
}

registerProcessor('elec16-apu', Elec16ApuProcessor)
