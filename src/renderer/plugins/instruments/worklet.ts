import { OUTPUTS } from './catalog.js'
import { InstrumentHost } from './host.js'
import { makers } from './makers.js'

/**
 * The instruments on the audio thread (docs/plugins.md section 13.8): one processor per pane
 * that plays any of them, fed strikes and releases through its port, writing the outputs the
 * page passes through the soundboard, the cabinet and the room (catalog.ts). Built by Vite as
 * a separate script (`?worker&url`) and loaded with audioWorklet.addModule, from the app's
 * own files, as the page's script-src allows.
 */

// The AudioWorkletGlobalScope, which the DOM library does not describe.
declare const sampleRate: number
declare const currentFrame: number
declare class AudioWorkletProcessor {
  readonly port: MessagePort
}
declare function registerProcessor(name: string, processor: new () => AudioWorkletProcessor): void

type Pair = [Float32Array, Float32Array]

class InstrumentProcessor extends AudioWorkletProcessor {
  private readonly host = new InstrumentHost(sampleRate, makers())
  /** Silenced for good: the processor ends once its instruments are still, and the node can go. */
  private closed = false
  /** The outputs as pairs of channels, kept from block to block rather than made anew. */
  private readonly pairs: Pair[] = Array.from(
    { length: OUTPUTS },
    (): Pair => [new Float32Array(0), new Float32Array(0)],
  )

  constructor() {
    super()
    this.port.onmessage = (event: MessageEvent) => {
      this.host.receive(event.data)
      if ((event.data as { t?: unknown } | null)?.t === 'silence') this.closed = true
    }
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    let frames = 0
    for (let i = 0; i < OUTPUTS; i++) {
      const out = outputs[i]
      const left = out?.[0]
      if (left === undefined) return true
      const pair = this.pairs[i] as Pair
      pair[0] = left
      pair[1] = out?.[1] ?? left
      frames = left.length
    }
    this.host.render(this.pairs, frames, currentFrame)
    const busy = this.host.busy
    // An instrument is made ahead of its first note only in a block with nothing to play.
    if (!busy) this.host.warm()
    return !this.closed || busy
  }
}

registerProcessor('elecdex-instruments', InstrumentProcessor)
