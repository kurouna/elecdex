import type { LoginItemState } from '@shared/background'
import { app } from 'electron'
import type { LoginBackend } from './index.js'

/**
 * macOS: the app itself as a login service (SMAppService, through Electron's
 * `setLoginItemSettings`).
 *
 * Two things follow from that and shape what elecdex offers on macOS. The entry
 * carries no arguments - `path`, `args`, `name` and `enabled` are Windows only -
 * so there is no way to say "start hidden", which is why `launchHidden` is false
 * in the capabilities. And macOS may hold the entry for approval in System
 * Settings, which `status` reports; that is the same thing to the user as Task
 * Manager's switch on Windows, so it is reported the same way.
 */

/** What the platform is asked; the tests hand in their own. */
export interface LoginService {
  available: boolean
  read(): { openAtLogin: boolean; status: string }
  write(on: boolean): void
}

export function realLoginService(packaged: boolean): LoginService {
  return {
    available: process.platform === 'darwin' && packaged,
    read: () => {
      const settings = app.getLoginItemSettings()
      return { openAtLogin: settings.openAtLogin, status: settings.status }
    },
    write: (on) => app.setLoginItemSettings({ openAtLogin: on }),
  }
}

export function darwinLoginBackend(
  packaged: boolean,
  service: LoginService = realLoginService(packaged),
): LoginBackend {
  return {
    available: service.available,
    state: (): LoginItemState => {
      if (!service.available) {
        return { available: false, registered: false, disabledByOs: false }
      }
      const { openAtLogin, status } = service.read()
      return {
        available: true,
        // 'enabled' is registered and running at login; 'requires-approval' is
        // registered and waiting for the user to allow it in System Settings.
        registered: openAtLogin || status === 'enabled' || status === 'requires-approval',
        disabledByOs: status === 'requires-approval',
      }
    },
    set: (on) => {
      if (service.available) service.write(on)
    },
    // Nothing to write again: the entry is the app, with no arguments of its own.
    sync: () => {},
  }
}
