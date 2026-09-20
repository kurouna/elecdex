import type { LoginItemState } from '@shared/background'
import { app } from 'electron'
import { darwinLoginBackend } from './darwin.js'
import { linuxLoginBackend } from './linux.js'
import { windowsLoginBackend } from './windows.js'

/**
 * The sign-in entry, one file per platform behind one interface.
 *
 * Each platform keeps it somewhere of its own - a per-user Run-key value, a
 * macOS login service, a freedesktop autostart file - and each of those is the
 * truth, not settings.json: the user can also turn the entry off in Task
 * Manager, in System Settings or in their desktop's startup applications, so
 * the state is read back from the platform every time.
 */
export interface LoginBackend {
  /** False where the entry cannot be written: an unknown platform, or a development run. */
  available: boolean
  state(): LoginItemState
  /** Adds or removes the entry. Adding also turns it back on where the OS can disable it. */
  set(on: boolean, startInBackground: boolean): void
  /**
   * Writes an existing entry again for a changed start option, keeping whether
   * the OS has it turned off. Does nothing where the entry cannot carry
   * arguments (macOS).
   */
  sync(startInBackground: boolean): void
}

/** The entry as it stands where nothing can be written. */
export const NO_LOGIN_ITEM: LoginItemState = {
  available: false,
  registered: false,
  disabledByOs: false,
}

const unavailableBackend: LoginBackend = {
  available: false,
  state: () => NO_LOGIN_ITEM,
  set: () => {},
  sync: () => {},
}

function backendFor(platform: NodeJS.Platform): LoginBackend {
  // A development run would register the Electron binary, with the bundle's
  // path missing; every backend refuses one.
  const packaged = app.isPackaged
  if (platform === 'win32') return windowsLoginBackend(packaged)
  if (platform === 'darwin') return darwinLoginBackend(packaged)
  if (platform === 'linux') return linuxLoginBackend(packaged)
  return unavailableBackend
}

/** The backend for this machine, or the one given (the tests' in-memory stand-in). */
export function createLoginItems(backend?: LoginBackend): LoginBackend {
  return backend ?? backendFor(process.platform)
}
