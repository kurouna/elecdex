import type { Chip8Program } from '@shared/chip8-library'

/**
 * The CHIP-8 library as the page knows it (docs/architecture.md section 5.18): the
 * programs main lists, asked for once when the first CHIP-8 pane mounts, and the bytes of
 * those loaded since, kept for the session (a few kilobytes each) so a reset or a second
 * pane does not ask again.
 */
class Chip8Library {
  programs = $state<Chip8Program[]>([])
  loaded = $state(false)
  #loading: Promise<void> | null = null
  readonly #roms = new Map<string, Promise<Uint8Array | null>>()

  load(): Promise<void> {
    this.#loading ??= window.elecdex.chip8
      .list()
      .then((programs) => {
        this.programs = programs
      })
      .catch(() => {
        this.programs = []
      })
      .finally(() => {
        this.loaded = true
      })
    return this.#loading
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
