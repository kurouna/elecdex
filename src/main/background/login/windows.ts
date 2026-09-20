import {
  type LaunchItem,
  LOGIN_ITEM_NAME,
  type LoginItemState,
  loginArgs,
  ownLaunchItem,
} from '@shared/background'
import { app } from 'electron'
import type { LoginBackend } from './index.js'

/**
 * Windows: a per-user Run-key value that the shell starts at sign-in.
 *
 * The value name is fixed rather than Electron's default, so the uninstaller
 * (build/installer.nsh) can remove exactly this one. Whether it is turned off in
 * Task Manager's startup apps is Windows' own state and is read back with it.
 */
export interface RunKey {
  available: boolean
  items(): LaunchItem[]
  write(entry: { on: boolean; args: string[]; enabled: boolean }): void
}

export function realRunKey(packaged: boolean): RunKey {
  return {
    available: process.platform === 'win32' && packaged,
    items: () => app.getLoginItemSettings({ path: process.execPath }).launchItems as LaunchItem[],
    write: ({ on, args, enabled }) =>
      app.setLoginItemSettings({
        openAtLogin: on,
        path: process.execPath,
        args,
        enabled,
        name: LOGIN_ITEM_NAME,
      }),
  }
}

export function windowsLoginBackend(
  packaged: boolean,
  runKey = realRunKey(packaged),
): LoginBackend {
  const own = (): LaunchItem | undefined =>
    runKey.available ? ownLaunchItem(runKey.items()) : undefined
  return {
    available: runKey.available,
    state: (): LoginItemState => {
      const item = own()
      return {
        available: runKey.available,
        registered: item !== undefined,
        disabledByOs: item !== undefined && !item.enabled,
      }
    },
    set: (on, startInBackground) => {
      if (!runKey.available) return
      runKey.write({ on, args: loginArgs(startInBackground), enabled: true })
    },
    sync: (startInBackground) => {
      const item = own()
      if (item === undefined) return
      runKey.write({ on: true, args: loginArgs(startInBackground), enabled: item.enabled })
    },
  }
}
