import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import { type LoginItemState, loginArgs } from '@shared/background'
import { AUTOSTART_FILE, desktopEntry, parseDesktopEntry } from './desktop-entry.js'
import type { LoginBackend } from './index.js'

/**
 * Linux: a freedesktop autostart file, written by elecdex itself.
 *
 * Electron's login item is Windows and macOS only, so there is no API to call
 * here - the desktops read `~/.config/autostart/*.desktop` and every one of them
 * agrees on that. The file is also the user's: their desktop's "startup
 * applications" switch writes `Hidden=true` into it, which is read back as the
 * OS having turned the entry off, exactly as Task Manager's switch is on
 * Windows.
 */

/** The file, behind an interface so the tests never touch a real home folder. */
export interface AutostartFile {
  available: boolean
  path: string
  read(): string | null
  write(text: string): void
  remove(): void
}

/**
 * The command the entry should run.
 *
 * An AppImage is mounted somewhere new on every launch, so `process.execPath`
 * there is a path under /tmp that will not exist next time - the entry would
 * point at nothing. `APPIMAGE` is the file the user actually keeps, which is
 * what a .desktop file has to name. A .deb or a dev run has neither problem.
 */
export function autostartExec(env: Record<string, string | undefined>, execPath: string): string {
  const appImage = env.APPIMAGE ?? ''
  return appImage.startsWith('/') ? appImage : execPath
}

/** `$XDG_CONFIG_HOME/autostart`, or the `~/.config` the spec falls back to. */
export function autostartDir(env: Record<string, string | undefined>, home: string): string {
  const configured = env.XDG_CONFIG_HOME ?? ''
  const base = configured.startsWith('/') ? configured : path.join(home, '.config')
  return path.join(base, 'autostart')
}

export function realAutostartFile(packaged: boolean): AutostartFile {
  const file = path.join(autostartDir(process.env, homedir()), AUTOSTART_FILE)
  return {
    // A development run would point the entry at the Electron binary.
    available: process.platform === 'linux' && packaged,
    path: file,
    read: () => {
      try {
        return readFileSync(file, 'utf8')
      } catch {
        return null
      }
    },
    write: (text) => {
      mkdirSync(path.dirname(file), { recursive: true })
      writeFileSync(file, text, 'utf8')
    },
    remove: () => {
      rmSync(file, { force: true })
    },
  }
}

export function linuxLoginBackend(
  packaged: boolean,
  file: AutostartFile = realAutostartFile(packaged),
  exec: string = autostartExec(process.env, process.execPath),
): LoginBackend {
  const entry = (): { args: string[]; disabled: boolean } | null => {
    if (!file.available) return null
    const text = file.read()
    return text === null ? null : parseDesktopEntry(text)
  }
  return {
    available: file.available,
    state: (): LoginItemState => {
      const current = entry()
      return {
        available: file.available,
        registered: current !== null,
        disabledByOs: current?.disabled === true,
      }
    },
    set: (on, startInBackground) => {
      if (!file.available) return
      if (!on) {
        file.remove()
        return
      }
      // Turning it on turns it back on: a desktop that had switched the entry
      // off should not leave it off when the user asks for it again.
      file.write(desktopEntry({ exec, args: loginArgs(startInBackground), disabled: false }))
    },
    sync: (startInBackground) => {
      const current = entry()
      if (current === null) return
      file.write(
        desktopEntry({ exec, args: loginArgs(startInBackground), disabled: current.disabled }),
      )
    },
  }
}
