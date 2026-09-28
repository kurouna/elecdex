import type { Played, VoiceNote } from '../voices.ts'
import { roomResponse, soundboardResponse } from './body.js'
import type { PianoMessage } from './engine.js'
import { afterDecay, damperTime, FIRST_UNDAMPED } from './model.js'

/**
 * The page's half of the physical piano (docs/plugins.md section 13.8). The hall loads the
 * worklet into a context once and makes the soundboard's and the room's responses; each pane
 * that plays the piano then gets its own instrument - a processor, the board and the room -
 * into its own gain, so one pane's stop cuts only its own strings.
 *
 * Until the module has loaded, or where it cannot (no AudioWorklet, a refused script), the
 * synthesiser plays the piano's older recipe instead: the page never waits for the strings.
 */

/** The room's share of what the board gives. */
const ROOM_LEVEL = 0.2
/** A note given no length is held this long, as the recipe's piano rang, before its damper. */
const OWN_LENGTH = 1.4
/** Seconds the page waits after a silence before letting the instrument's nodes go. */
const LET_GO_AFTER = 0.5

export class PianoHall {
  private state: 'loading' | 'ready' | 'failed' = 'loading'
  private board: AudioBuffer | null = null
  private room: AudioBuffer | null = null
  private readonly ac: BaseAudioContext

  constructor(ac: BaseAudioContext, module: string) {
    this.ac = ac
    ac.audioWorklet.addModule(module).then(
      () => {
        this.board = stereo(ac, soundboardResponse(ac.sampleRate))
        this.room = stereo(ac, roomResponse(ac.sampleRate))
        this.state = 'ready'
      },
      () => {
        this.state = 'failed'
      },
    )
  }

  get ready(): boolean {
    return this.state === 'ready'
  }

  /** A new instrument playing into `out`, or null while the strings cannot be had. */
  instrument(out: AudioNode): PianoStrings | null {
    if (this.board === null || this.room === null || this.state !== 'ready') return null
    try {
      return new PianoStrings(this.ac, this.board, this.room, out)
    } catch {
      this.state = 'failed'
      return null
    }
  }
}

function stereo(ac: BaseAudioContext, channels: Float32Array[]): AudioBuffer {
  const length = (channels[0] as Float32Array).length
  const buffer = ac.createBuffer(channels.length, length, ac.sampleRate)
  channels.forEach((data, i) => {
    buffer.copyToChannel(data as Float32Array<ArrayBuffer>, i)
  })
  return buffer
}

export class PianoStrings {
  private readonly node: AudioWorkletNode
  private readonly nodes: AudioNode[]
  private next = 1

  constructor(ac: BaseAudioContext, board: AudioBuffer, room: AudioBuffer, out: AudioNode) {
    this.node = new AudioWorkletNode(ac, 'elecdex-piano', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    })
    const body = ac.createConvolver()
    body.normalize = false
    body.buffer = board
    const air = ac.createConvolver()
    air.normalize = false
    air.buffer = room
    const wet = ac.createGain()
    wet.gain.value = ROOM_LEVEL
    this.node.connect(body).connect(out)
    body.connect(air).connect(wet).connect(out)
    this.nodes = [this.node, body, air, wet]
  }

  /** Strikes the note's key; its damper falls at the note's end. */
  play(note: VoiceNote, pan: number): Played {
    const id = this.next++
    const dampered = note.pitch < FIRST_UNDAMPED
    const lift = note.end ?? note.start + OWN_LENGTH
    const ring = note.start + Math.min(40, afterDecay(note.pitch) * 1.2)
    const settle = (at: number) =>
      dampered ? Math.min(ring, at + damperTime(note.pitch) * 1.6) : ring
    this.post({ t: 'strike', id, pitch: note.pitch, level: note.level, pan, at: note.start })
    this.post({ t: 'release', id, at: lift })
    const played: Played = {
      end: settle(lift),
      stop: (at) => {
        this.post({ t: 'stop', id, at })
        played.end = Math.min(played.end, at + 0.06)
      },
      release: (at) => {
        this.post({ t: 'release', id, at })
        played.end = Math.min(played.end, settle(at))
      },
    }
    return played
  }

  /** The sustain pedal, from `at`: every damper up, and the strings nobody struck ring along. */
  pedal(on: boolean, at: number): void {
    this.post({ t: 'pedal', on, at })
  }

  /** Cuts every string, then lets the nodes go: the processor ends once it is quiet. */
  silence(): void {
    this.post({ t: 'silence' })
    setTimeout(() => {
      for (const node of this.nodes) node.disconnect()
    }, LET_GO_AFTER * 1000)
  }

  private post(message: PianoMessage): void {
    this.node.port.postMessage(message)
  }
}
