import { contextTimeFor, midiToHz, type SoundNote } from '@shared/plugin-sound'
import { PLUGIN_LIMITS, TokenBucket } from '@shared/plugins'
import { PianoHall, type PianoStrings } from './piano/strings.ts'
import pianoWorklet from './piano/worklet.ts?worker&url'
import { type Kit, noiseBuffer, type Played, pianoWave, VOICES, type VoiceNote } from './voices.ts'

/**
 * The plugins' synthesiser (docs/plugins.md section 13): what a plugin's ctx.sound plays,
 * one owner per pane, through one AudioContext of its own - apart from the interface sounds
 * (lib/sfx.ts), whose switch does not silence a plugin's music.
 *
 * A note far ahead waits in its owner's queue and becomes nodes a moment before it is heard,
 * so a song scheduled whole costs a handful of nodes at a time, not thousands at once. The
 * queue is looked at on a short timer that runs only while something waits in it; a
 * sequencer needs the audio clock's precision, which the frame loop cannot give. The
 * context sleeps once nothing has played for a while, so a quiet game costs nothing.
 *
 * The piano is the one voice not built of nodes per note: it is a physical model of strings
 * on the audio thread (piano/, section 13.8), one instrument per pane, played through the
 * recipe in voices.ts only until the worklet has loaded, or where it cannot.
 */

const LOOKAHEAD_MS = 250
const PUMP_MS = 50
const MAX_VOICES = 64
const SLEEP_AFTER_MS = 4000
/**
 * Voices an owner may start, in a burst and each second: every one is a small graph built on
 * the page's thread, so a plugin posting notes as fast as it can must not stall the page.
 */
const VOICE_BURST = 192
const VOICES_PER_SECOND = 500

interface Owner {
  gain: GainNode
  queue: SoundNote[]
  budget: TokenBucket
  /** The pane's piano strings, made on its first piano note once the hall is ready. */
  strings: PianoStrings | null
}

interface Sounding {
  owner: string
  played: Played
}

const byTime = (a: SoundNote, b: SoundNote) => (a.at ?? 0) - (b.at ?? 0)

export class Synth {
  private ac: AudioContext | null = null
  private kit: Omit<Kit, 'out'> | null = null
  private master: GainNode | null = null
  private failed = false
  private readonly owners = new Map<string, Owner>()
  private sounding: Sounding[] = []
  private pump: ReturnType<typeof setInterval> | null = null
  private sleep: ReturnType<typeof setTimeout> | null = null
  /**
   * Whether the context was last asked to run rather than to sleep. Its own `state` changes
   * only once a suspend has finished, and a note asked for in between must wake it again.
   */
  private awake = false
  private readonly create: () => AudioContext
  private readonly pianoModule: string | null
  private hall: PianoHall | null = null
  /** Owners whose sustain pedal is down, kept apart from their sound, which may not exist yet. */
  private readonly pedals = new Set<string>()
  /** Piano notes each owner's strings have played, rather than the recipe: for the tests. */
  private readonly strung = new Map<string, number>()

  constructor(
    create: () => AudioContext = () => new AudioContext({ latencyHint: 'interactive' }),
    pianoModule: string | null = pianoWorklet,
  ) {
    this.create = create
    this.pianoModule = pianoModule
  }

  /** Plays an owner's notes: those due soon at once, the rest when due. Returns how many. */
  play(owner: string, notes: readonly SoundNote[]): number {
    const ac = this.context()
    if (ac === null || notes.length === 0) return 0
    const o = this.owner(ac, owner)
    const soon = performance.now() + LOOKAHEAD_MS
    const due: SoundNote[] = []
    let queued = 0
    for (const note of notes) {
      if (note.at === null || note.at <= soon) due.push(note)
      else if (o.queue.length < PLUGIN_LIMITS.notesQueued) {
        o.queue.push(note)
        queued += 1
      }
    }
    o.queue.sort(byTime)
    this.arm()
    return queued + this.soundAll(ac, owner, o, due)
  }

  /**
   * Sounds notes due now: no more than there are voices (the later ones win, as the voices
   * would steal from the earlier), and only within the owner's budget.
   */
  private soundAll(ac: AudioContext, owner: string, o: Owner, notes: readonly SoundNote[]): number {
    let played = 0
    for (const note of notes.slice(-MAX_VOICES)) {
      if (!o.budget.take(performance.now())) break
      this.sound(ac, owner, o, note)
      played += 1
    }
    return played
  }

  /**
   * Starts a note that sounds until it is let go (a key held down, up to the longest a note
   * may be), within the owner's budget. Returns it, to let go of with `release`.
   */
  start(owner: string, note: SoundNote): Played | null {
    const ac = this.context()
    if (ac === null) return null
    const o = this.owner(ac, owner)
    if (!o.budget.take(performance.now())) return null
    return this.sound(ac, owner, o, { ...note, at: null, length: PLUGIN_LIMITS.noteLengthMs })
  }

  /** Lets go of a note from `start`, over its voice's own release. */
  release(played: Played): void {
    if (this.ac !== null) played.release(this.ac.currentTime)
  }

  /** An owner's sustain pedal, as the piano's strings hear it. */
  pedal(owner: string, on: boolean): void {
    if (this.pedals.has(owner) === on) return
    if (on) this.pedals.add(owner)
    else this.pedals.delete(owner)
    const strings = this.owners.get(owner)?.strings
    if (strings && this.ac !== null) strings.pedal(on, this.ac.currentTime)
  }

  /** Silences an owner: what sounds is cut short, what waits is dropped. */
  stop(owner: string): void {
    // As the host's held notes forget the pedal (held.ts), so do the strings.
    this.pedals.delete(owner)
    const o = this.owners.get(owner)
    const ac = this.ac
    if (o === undefined || ac === null) return
    this.owners.delete(owner)
    const at = ac.currentTime
    o.gain.gain.setTargetAtTime(0, at, 0.01)
    for (const s of this.sounding) if (s.owner === owner) s.played.stop(at)
    o.strings?.silence()
    this.sounding = this.sounding.filter((s) => s.owner !== owner)
    setTimeout(() => o.gain.disconnect(), 250)
  }

  /** Piano notes an owner's strings have played (the rest went to the recipe). */
  strungNotes(owner: string): number {
    return this.strung.get(owner) ?? 0
  }

  /** Milliseconds from a note starting to it being heard; 0 before anything has played. */
  latency(): number {
    const ac = this.ac
    if (ac === null) return 0
    return Math.round((ac.baseLatency + (ac.outputLatency || 0)) * 1000)
  }

  private context(): AudioContext | null {
    if (this.failed) return null
    if (this.ac === null) {
      try {
        const ac = this.create()
        const master = ac.createGain()
        master.gain.value = 0.9
        // A limiter: several plugins' notes at once must not clip into a harsh edge.
        const limit = ac.createDynamicsCompressor()
        limit.threshold.value = -10
        limit.knee.value = 6
        limit.ratio.value = 12
        limit.attack.value = 0.002
        limit.release.value = 0.12
        master.connect(limit).connect(ac.destination)
        this.ac = ac
        this.master = master
        this.kit = { ac, noise: noiseBuffer(ac), piano: pianoWave(ac) }
        if (this.pianoModule !== null && ac.audioWorklet !== undefined) {
          this.hall = new PianoHall(ac, this.pianoModule)
        }
      } catch {
        this.failed = true
        return null
      }
    }
    if (!this.awake) {
      this.awake = true
      void this.ac.resume().catch(() => {})
    }
    this.snooze()
    return this.ac
  }

  private owner(ac: AudioContext, id: string): Owner {
    let o = this.owners.get(id)
    if (o === undefined) {
      const gain = ac.createGain()
      gain.connect(this.master as GainNode)
      o = {
        gain,
        queue: [],
        budget: new TokenBucket(VOICE_BURST, VOICES_PER_SECOND * 60, performance.now()),
        strings: null,
      }
      this.owners.set(id, o)
    }
    return o
  }

  private sound(ac: AudioContext, owner: string, o: Owner, note: SoundNote): Played | null {
    const kit = this.kit
    if (kit === null) return null
    // A stamp from before the context slept still says where the output was then: after a
    // sleep it would put a note as far in the future as the context slept.
    const stamp = ac.state === 'running' ? ac.getOutputTimestamp?.() : undefined
    const start = contextTimeFor(note.at, {
      currentTime: ac.currentTime,
      now: performance.now(),
      latency: ac.outputLatency || 0,
      stamp:
        stamp?.contextTime !== undefined && stamp.performanceTime !== undefined
          ? { contextTime: stamp.contextTime, performanceTime: stamp.performanceTime }
          : null,
    })
    this.makeRoom(ac.currentTime)
    const voiced: VoiceNote = {
      freq: midiToHz(note.pitch),
      pitch: note.pitch,
      start,
      end: note.length === null ? null : start + note.length / 1000,
      level: note.level,
    }
    const strings = note.voice === 'piano' ? this.strings(owner, o) : null
    if (strings !== null) this.strung.set(owner, (this.strung.get(owner) ?? 0) + 1)
    const played =
      strings !== null
        ? strings.play(voiced, note.pan)
        : VOICES[note.voice]({ ...kit, out: this.panned(ac, o, note.pan) }, voiced)
    this.sounding.push({ owner, played })
    return played
  }

  private panned(ac: AudioContext, o: Owner, pan: number): AudioNode {
    if (pan === 0) return o.gain
    const panner = ac.createStereoPanner()
    panner.pan.value = pan
    panner.connect(o.gain)
    return panner
  }

  private strings(owner: string, o: Owner): PianoStrings | null {
    if (o.strings === null && this.hall?.ready) {
      o.strings = this.hall.instrument(o.gain)
      if (this.pedals.has(owner) && this.ac !== null) o.strings?.pedal(true, this.ac.currentTime)
    }
    return o.strings
  }

  /** Forgets voices that have ended, and cuts the oldest when too many still sound. */
  private makeRoom(now: number): void {
    this.sounding = this.sounding.filter((s) => s.played.end > now)
    while (this.sounding.length >= MAX_VOICES) this.sounding.shift()?.played.stop(now)
  }

  /** Runs the queues while anything waits in them. */
  private arm(): void {
    if (this.pump !== null || ![...this.owners.values()].some((o) => o.queue.length > 0)) return
    this.pump = setInterval(() => this.drain(), PUMP_MS)
  }

  private drain(): void {
    const ac = this.ac
    if (ac === null) return
    const due = performance.now() + LOOKAHEAD_MS
    let waiting = false
    for (const [id, o] of this.owners) {
      const count = o.queue.findIndex((note) => (note.at ?? 0) > due)
      this.soundAll(ac, id, o, o.queue.splice(0, count === -1 ? o.queue.length : count))
      waiting ||= o.queue.length > 0
    }
    this.snooze()
    if (waiting || this.pump === null) return
    clearInterval(this.pump)
    this.pump = null
  }

  /** Puts the context to sleep once nothing has played, or waited to, for a while. */
  private snooze(): void {
    if (this.sleep !== null) clearTimeout(this.sleep)
    this.sleep = setTimeout(() => {
      this.sleep = null
      const ac = this.ac
      if (ac === null || this.pump !== null) return
      if (this.sounding.some((s) => s.played.end > ac.currentTime)) this.snooze()
      else {
        this.awake = false
        void ac.suspend().catch(() => {})
      }
    }, SLEEP_AFTER_MS)
  }
}
