import type { Voice } from '@shared/plugin-api'
import { cabinetResponse, ECHO } from '../guitar/cabinet.js'
import { soundboardResponse } from '../piano/body.js'
import type { Played, VoiceNote } from '../voices.ts'
import { BUSES, INSTRUMENTS, OUTPUTS, ROOM_SEND } from './catalog.js'
import type { InstrumentMessage } from './host.js'

/**
 * The page's half of the instruments on the audio thread (docs/plugins.md section 13.8). The
 * hall loads the worklet into a context once and makes what the instruments are heard
 * through - the piano's soundboard, the guitar's cabinet; each pane that plays one then gets its own band: a
 * processor and those, into the pane's gain and its share of the room, so one pane's stop cuts
 * only its own.
 *
 * Until the module has loaded, or where it cannot (no AudioWorklet, a refused script), the
 * synthesiser plays each such voice by a recipe instead: the page never waits for the thread.
 */

/** Seconds the page waits after a silence before letting the band's nodes go. */
const LET_GO_AFTER = 0.5

export class InstrumentHall {
  private state: 'loading' | 'ready' | 'failed' = 'loading'
  private board: AudioBuffer | null = null
  private cabinet: AudioBuffer | null = null
  private readonly ac: BaseAudioContext

  constructor(ac: BaseAudioContext, module: string) {
    this.ac = ac
    ac.audioWorklet.addModule(module).then(
      () => {
        this.board = stereo(ac, soundboardResponse(ac.sampleRate))
        this.cabinet = stereo(ac, cabinetResponse(ac.sampleRate))
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

  /** A new band playing into `out` and `room`, or null while the thread cannot be had. */
  band(out: AudioNode, room: AudioNode): Band | null {
    if (this.board === null || this.cabinet === null || this.state !== 'ready') return null
    try {
      return new Band(this.ac, { board: this.board, cabinet: this.cabinet }, out, room)
    } catch {
      this.state = 'failed'
      return null
    }
  }
}

export function stereo(ac: BaseAudioContext, channels: Float32Array[]): AudioBuffer {
  const length = (channels[0] as Float32Array).length
  const buffer = ac.createBuffer(channels.length, length, ac.sampleRate)
  channels.forEach((data, i) => {
    buffer.copyToChannel(data as Float32Array<ArrayBuffer>, i)
  })
  return buffer
}

export class Band {
  private readonly node: AudioWorkletNode
  private readonly nodes: AudioNode[]
  private next = 1

  constructor(
    ac: BaseAudioContext,
    bodies: { board: AudioBuffer; cabinet: AudioBuffer },
    out: AudioNode,
    room: AudioNode,
  ) {
    this.node = new AudioWorkletNode(ac, 'elecdex-instruments', {
      numberOfInputs: 0,
      numberOfOutputs: OUTPUTS,
      outputChannelCount: Array.from({ length: OUTPUTS }, () => 2),
    })
    // The piano's strings through its soundboard, and the soundboard's share of the room.
    const body = ac.createConvolver()
    body.normalize = false
    body.buffer = bodies.board
    const pianoRoom = ac.createGain()
    pianoRoom.gain.value = ROOM_SEND.piano
    this.node.connect(body, BUSES.piano).connect(out)
    body.connect(pianoRoom).connect(room)
    this.node.connect(out, BUSES.plain)
    this.node.connect(room, BUSES.room)
    this.nodes = [this.node, body, pianoRoom, ...this.guitar(ac, bodies.cabinet, out, room)]
  }

  /** The guitar's amplifier through its cabinet, then its echo, and a share of both to the room. */
  private guitar(
    ac: BaseAudioContext,
    response: AudioBuffer,
    out: AudioNode,
    room: AudioNode,
  ): AudioNode[] {
    const cabinet = ac.createConvolver()
    cabinet.normalize = false
    cabinet.buffer = response
    this.node.connect(cabinet, BUSES.guitar).connect(out)
    const send = ac.createGain()
    send.gain.value = ROOM_SEND.guitar
    cabinet.connect(send).connect(room)
    const nodes: AudioNode[] = [cabinet, send]
    for (const [time, side] of [
      [ECHO.left, -0.7],
      [ECHO.right, 0.7],
    ] as const) {
      const wet = ac.createGain()
      wet.gain.value = ECHO.wet
      const delay = ac.createDelay(1)
      delay.delayTime.value = time
      const darker = ac.createBiquadFilter()
      darker.type = 'lowpass'
      darker.frequency.value = ECHO.cutoff
      const again = ac.createGain()
      again.gain.value = ECHO.feedback
      const place = ac.createStereoPanner()
      place.pan.value = side
      cabinet.connect(wet).connect(delay).connect(darker)
      darker.connect(again).connect(delay)
      darker.connect(place).connect(out)
      place.connect(send)
      nodes.push(wet, delay, darker, again, place)
    }
    return nodes
  }

  /** Strikes the note; it is let go at its end, or after its voice's own length. */
  play(voice: Voice, note: VoiceNote, pan: number): Played {
    const traits = INSTRUMENTS[voice]
    const id = this.next++
    const lift = note.end ?? note.start + (traits?.ownLength ?? 1)
    const ring = note.start + (traits?.ring(note.pitch) ?? 2)
    const settle = (at: number) => Math.min(ring, at + (traits?.settle(note.pitch) ?? 0.5))
    this.post({ t: 'strike', voice, id, pitch: note.pitch, level: note.level, pan, at: note.start })
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

  /** Cuts everything, then lets the nodes go: the processor ends once it is quiet. */
  silence(): void {
    this.post({ t: 'silence' })
    setTimeout(() => {
      for (const node of this.nodes) node.disconnect()
    }, LET_GO_AFTER * 1000)
  }

  private post(message: InstrumentMessage): void {
    this.node.port.postMessage(message)
  }
}
