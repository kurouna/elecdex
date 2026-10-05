/**
 * The emulator panes' one AudioContext (docs/emu.md).
 *
 * Made only when a pane first has something to play with sound on, and put to sleep once
 * nothing has sounded for a few seconds, so a silent game holds no audio device. A voice that
 * sounds on with nothing new sent (a held note, a gated buzzer) holds it awake until it stops.
 * Each kind of
 * machine brings its own voice as an AudioWorklet module; a module is added the first time it
 * is asked for and never again. A page that cannot make a context (or a module that will not
 * load) gets null, and the machine plays on silent.
 */

const SLEEP_AFTER_MS = 4000

type Factory = () => AudioContext

export class SharedAudio {
  #ac: AudioContext | null = null
  #context: Promise<AudioContext | null> | null = null
  readonly #modules = new Map<string, Promise<boolean>>()
  #sleep: ReturnType<typeof setTimeout> | null = null
  /** When it may sleep, nothing having sounded since (Date.now()'s clock). */
  #quietAt = 0
  /** The voices sounding on by themselves: while any is, it never sleeps. */
  readonly #holders = new Set<object>()
  readonly #create: Factory

  constructor(create: Factory = () => new AudioContext({ latencyHint: 'interactive' })) {
    this.#create = create
  }

  /**
   * The context with `module` (a worklet script's URL) loaded - none for a voice made of the
   * context's own nodes; null where that cannot be.
   */
  async get(module?: string): Promise<AudioContext | null> {
    this.#context ??= Promise.resolve().then(() => {
      try {
        this.#ac = this.#create()
        return this.#ac
      } catch {
        return null
      }
    })
    const ac = await this.#context
    if (ac === null || module === undefined) return ac
    let added = this.#modules.get(module)
    if (added === undefined) {
      added = ac.audioWorklet.addModule(module).then(
        () => true,
        () => false,
      )
      this.#modules.set(module, added)
    }
    return (await added) ? ac : null
  }

  /**
   * Something is sounding, for `ms` more at least: awake, and sleeping again only after a
   * quiet while past it. Called every frame a game sends, so it moves a time and leaves the
   * one timer alone.
   */
  wake(ms = 0): void {
    const ac = this.#ac
    if (ac === null) return
    if (ac.state === 'suspended') void ac.resume().catch(() => {})
    this.#quietAt = Math.max(this.#quietAt, Date.now() + ms + SLEEP_AFTER_MS)
    this.#arm()
  }

  /**
   * `voice` sounds on by itself (true) - a held note, a gated tone - or no longer does: while
   * any voice holds it, the context never sleeps; let go, the quiet while starts then.
   */
  hold(voice: object, sounding: boolean): void {
    if (sounding) {
      if (this.#holders.has(voice)) return
      this.#holders.add(voice)
      this.wake()
    } else if (this.#holders.delete(voice)) {
      this.wake()
    }
  }

  #arm(): void {
    if (this.#sleep !== null) return
    this.#sleep = setTimeout(() => this.#maybeSleep(), Math.max(0, this.#quietAt - Date.now()))
  }

  #maybeSleep(): void {
    this.#sleep = null
    const ac = this.#ac
    // Held: letting go wakes it again, which arms the timer anew.
    if (ac === null || this.#holders.size > 0) return
    if (Date.now() < this.#quietAt) {
      this.#arm()
      return
    }
    void ac.suspend().catch(() => {})
  }
}

/** The page's one context, shared by every emulator pane. */
export const emuAudio = new SharedAudio()
