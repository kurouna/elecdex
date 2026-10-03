/**
 * The emulator panes' one AudioContext (docs/emu.md).
 *
 * Made only when a pane first has something to play with sound on, and put to sleep once
 * nothing has sounded for a few seconds, so a silent game holds no audio device. Each kind of
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

  /** Something is sounding: awake, and sleeping again only after a quiet while. */
  wake(): void {
    const ac = this.#ac
    if (ac === null) return
    if (ac.state === 'suspended') void ac.resume().catch(() => {})
    if (this.#sleep !== null) clearTimeout(this.#sleep)
    this.#sleep = setTimeout(() => {
      this.#sleep = null
      void ac.suspend().catch(() => {})
    }, SLEEP_AFTER_MS)
  }
}

/** The page's one context, shared by every emulator pane. */
export const emuAudio = new SharedAudio()
