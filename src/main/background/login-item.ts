import {
  type LaunchItem,
  LOGIN_ITEM_NAME,
  type LoginItemState,
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
   * Writes an existing entry again with the start option's arguments, keeping
   * whether Windows has it turned off. Called when the option changes: the
   * arguments cannot be read back to compare (see LaunchItem).
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
  /** How often the Run key was written: a write on every start or setting would show here. */
  writes = 0

  items(): LaunchItem[] {
    return this.entry ? [this.entry] : []
  }

  write({ on, args, enabled }: { on: boolean; args: string[]; enabled: boolean }): void {
    this.writes += 1
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
      if (item === undefined) return
      runKey.write({ on: true, args: loginArgs(startInBackground), enabled: item.enabled })
    },
  }
}
