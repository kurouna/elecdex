import type { Chip8Program } from '@shared/chip8-library'

/**
 * The CHIP-8 library as the page knows it (docs/architecture.md section 5.18): the
 * programs main lists - bundled and imported, with the user's tuning and stars - asked for
 * once when the first CHIP-8 pane mounts and replaced whole whenever main says the library
 * changed (another pane's import, star or tuning), and the bytes of those loaded since,
 * kept for the session (a few kilobytes each) so a reset or a second pane does not ask
 * again. The list is main's: a change goes there and comes back, never made here first.
 */
class Chip8Library {
  /**
   * Raw, not deep state: the list is only ever replaced whole, and a program's quirks are
   * read by the machine on every instruction - through a proxy that cost a paint 4 ms.
   */
  programs = $state.raw<Chip8Program[]>([])
  loaded = $state(false)
  #loading: Promise<void> | null = null
  readonly #roms = new Map<string, Promise<Uint8Array | null>>()

  load(): Promise<void> {
    this.#loading ??= this.#start()
    return this.#loading
  }

  async #start(): Promise<void> {
    // Listening first, so a change made while the list is on its way is not missed; the
    // page lives as long as the listener, as the library does.
    window.elecdex.chip8.onChange((programs) => this.#take(programs))
    try {
      this.#take(await window.elecdex.chip8.list())
    } catch {
      this.programs = []
    } finally {
      this.loaded = true
    }
  }

  #take(programs: Chip8Program[]): void {
    // A program gone (an imported one removed) takes its bytes with it.
    for (const id of this.#roms.keys()) {
      if (!programs.some((p) => p.id === id)) this.#roms.delete(id)
    }
    this.programs = programs
  }

  find(id: string | null): Chip8Program | null {
    if (id === null) return null
    return this.programs.find((program) => program.id === id) ?? null
  }

  rom(id: string): Promise<Uint8Array | null> {
    let rom = this.#roms.get(id)
    if (rom === undefined) {
      rom = window.elecdex.chip8.rom(id).catch(() => null)
      this.#roms.set(id, rom)
      // A failed read is asked again next time.
      void rom.then((bytes) => {
        if (bytes === null) this.#roms.delete(id)
      })
    }
    return rom
  }
}

export const chip8Library = new Chip8Library()
