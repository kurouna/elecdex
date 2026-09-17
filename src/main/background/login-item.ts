import {
  type LaunchItem,
  LOGIN_ITEM_NAME,
  type LoginItemState,
  launchItemStale,
  loginArgs,
  ownLaunchItem,
} from '@shared/background'
import { app } from 'electron'

/**
 * The sign-in entry: a per-user Run-key value that Windows starts at sign-in.
 *
 * Windows holds the truth - the user can also turn the entry off in Task
 * Manager's startup apps - so nothing about it is kept in settings.json; the
 * state is read back from the registry each time.
 */
export interface LoginItems {
  state(): LoginItemState
  /** Adds or removes the entry. Adding also approves it again in Task Manager. */
  set(on: boolean, startInBackground: boolean): void
  /**
   * Rewrites an existing entry whose path or arguments are out of date (a moved
   * install, a changed start option), keeping whether Windows has it turned off.
   */
  sync(startInBackground: boolean): void
}

/** What the platform layer does; the stub (tests) keeps it in memory. */
interface RunKey {
  available: boolean
  items(): LaunchItem[]
  write(entry: { on: boolean; args: string[]; enabled: boolean }): void
}

function realRunKey(): RunKey {
  return {
    // A development run would register electron.exe with the bundle's path missing.
    available: process.platform === 'win32' && app.isPackaged,
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

/** An in-memory Run key for the end-to-end tests, which must never write the real one. */
export class StubRunKey implements RunKey {
  available = true
  entry: LaunchItem | null = null

  items(): LaunchItem[] {
    return this.entry ? [this.entry] : []
  }

  write({ on, args, enabled }: { on: boolean; args: string[]; enabled: boolean }): void {
    this.entry = on
      ? { name: LOGIN_ITEM_NAME, path: process.execPath, args, scope: 'user', enabled }
      : null
  }

  /** What Task Manager's switch does. */
  setEnabled(enabled: boolean): void {
    if (this.entry) this.entry = { ...this.entry, enabled }
  }
}

export function createLoginItems(runKey: RunKey = realRunKey()): LoginItems {
  const own = (): LaunchItem | undefined =>
    runKey.available ? ownLaunchItem(runKey.items()) : undefined
  return {
    state: () => {
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
      if (item === undefined || !launchItemStale(item, process.execPath, startInBackground)) return
      runKey.write({ on: true, args: loginArgs(startInBackground), enabled: item.enabled })
    },
  }
}
