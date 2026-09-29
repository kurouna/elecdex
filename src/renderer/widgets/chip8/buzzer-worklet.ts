import { PatternVoice, type Tone } from '@shared/chip8/audio'

/**
 * A CHIP-8 pane's buzzer on the audio thread (docs/architecture.md section 5.18): the
 * pattern voice from shared/chip8/audio.ts, told the tone once a frame through its port.
 * It keeps its place in the pattern between blocks, so the sound never clicks at a frame's
 * edge, and it stops by itself when the time it was given runs out - a page that stops
 * sending (a stall, a pane gone) leaves no note hanging. Built by Vite as its own script
 * (`?worker&url`) and loaded with audioWorklet.addModule, from the app's own files.
 */

// The AudioWorkletGlobalScope, which the DOM library does not describe.
declare const sampleRate: number
declare class AudioWorkletProcessor {
  readonly port: MessagePort
}
declare function registerProcessor(name: string, processor: new () => AudioWorkletProcessor): void

/** What the page posts: a frame's tone, or null to stop at once. */
export type BuzzerMessage = Tone | null

class Chip8Buzzer extends AudioWorkletProcessor {
  readonly #voice = new PatternVoice(sampleRate)

  constructor() {
    super()
    this.port.onmessage = (event: MessageEvent<BuzzerMessage>) => {
      if (event.data === null) this.#voice.stop()
      else this.#voice.set(event.data)
    }
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const channels = outputs[0] ?? []
    const first = channels[0]
    if (first !== undefined) {
      this.#voice.render(first)
      for (let c = 1; c < channels.length; c++) channels[c]?.set(first)
    }
    return true
  }
}

registerProcessor('chip8-buzzer', Chip8Buzzer)
