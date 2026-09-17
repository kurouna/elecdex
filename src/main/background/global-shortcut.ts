import { chordToAccelerator, type ShortcutStatus } from '@shared/background'
import { globalShortcut } from 'electron'

/** What registering does; the stub (tests) never takes a key from the machine. */
export interface ShortcutRegistry {
  register(accelerator: string, callback: () => void): boolean
  unregister(accelerator: string): void
  /** Holds every registered shortcut without releasing it (Electron's setSuspended). */
  suspend(on: boolean): void
}

const realRegistry: ShortcutRegistry = {
  register: (accelerator, callback) => globalShortcut.register(accelerator, callback),
  unregister: (accelerator) => globalShortcut.unregister(accelerator),
  suspend: (on) => globalShortcut.setSuspended(on),
}

/** Registers nothing; accelerators in `taken` behave as if another app held them. */
export class StubRegistry implements ShortcutRegistry {
  readonly taken = new Set<string>()
  readonly registered = new Map<string, () => void>()
  suspended = false

  register(accelerator: string, callback: () => void): boolean {
    if (this.taken.has(accelerator)) return false
    this.registered.set(accelerator, callback)
    return true
  }

  unregister(accelerator: string): void {
    this.registered.delete(accelerator)
  }

  suspend(on: boolean): void {
    this.suspended = on
  }

  /** What a key press does: nothing while suspended, as the OS would. */
  press(): void {
    if (this.suspended) return
    for (const callback of this.registered.values()) callback()
  }
}

export interface GlobalToggle {
  /** Registers `chord` when `enabled`, releasing whatever was registered before. */
  apply(chord: string | null, enabled: boolean): ShortcutStatus
  /** Holds the shortcut while the settings record new keys, and hands it back after. */
  suspend(on: boolean): void
  dispose(): void
}

/**
 * The system-wide show/hide shortcut. At most one accelerator is held, and only
 * while the user has turned the option on.
 */
export function createGlobalToggle(
  onPress: () => void,
  registry: ShortcutRegistry = realRegistry,
): GlobalToggle {
  let held: string | null = null
  let suspended = false
  let status: ShortcutStatus = { state: 'off', chord: null }
  const release = (): void => {
    if (held !== null) registry.unregister(held)
    held = null
  }
  return {
    apply: (chord, enabled) => {
      const accelerator = chord === null ? null : chordToAccelerator(chord)
      // Already held: registering again would fail against ourselves.
      if (enabled && accelerator !== null && accelerator === held) return status
      release()
      if (!enabled) status = { state: 'off', chord }
      else if (accelerator === null) status = { state: 'invalid', chord }
      else if (registry.register(accelerator, onPress)) {
        held = accelerator
        status = { state: 'registered', chord }
      } else status = { state: 'taken', chord }
      return status
    },
    suspend: (on) => {
      if (on === suspended) return
      suspended = on
      registry.suspend(on)
    },
    dispose: () => {
      release()
      if (suspended) {
        suspended = false
        registry.suspend(false)
      }
    },
  }
}
