import { PianoEngine, receive } from './engine.js'

/**
 * The piano's strings on the audio thread (docs/plugins.md section 13.8): one processor per
 * pane that plays the piano, fed strikes and releases through its port, writing two channels
 * that the page passes through the soundboard and the room. Built by Vite as a separate
 * script (`?worker&url`) and loaded with audioWorklet.addModule, from the app's own files, as
 * the page's script-src allows.
 */

// The AudioWorkletGlobalScope, which the DOM library does not describe.
declare const sampleRate: number
declare const currentFrame: number
declare class AudioWorkletProcessor {
  readonly port: MessagePort
}
declare function registerProcessor(name: string, processor: new () => AudioWorkletProcessor): void

class PianoProcessor extends AudioWorkletProcessor {
  private readonly engine = new PianoEngine(sampleRate)
  /** Silenced for good: the processor ends once its strings are still, and the node can go. */
  private closed = false

  constructor() {
    super()
    this.port.onmessage = (event: MessageEvent) => {
      receive(this.engine, event.data)
      if ((event.data as { t?: unknown } | null)?.t === 'silence') this.closed = true
    }
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const out = outputs[0]
    const left = out?.[0]
    if (left !== undefined) this.engine.render(left, out?.[1] ?? left, left.length, currentFrame)
    return !this.closed || this.engine.busy
  }
}

registerProcessor('elecdex-piano', PianoProcessor)
