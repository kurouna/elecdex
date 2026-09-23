import { existsSync } from 'node:fs'
import path from 'node:path'

/**
 * How the command the user set for opening a file is started.
 *
 * It is started as a program with its arguments, never as a line for a shell,
 * so nothing in a file name can run. Windows is the exception that has to be
 * handled: the commands people set most (`code`, `cursor`) are `.cmd` files,
 * and Node refuses to start a batch file without a shell (CVE-2024-27980). Such
 * a command goes through `cmd.exe /d /s /c` with every argument quoted - and
 * only when no argument holds a character cmd.exe would still act on inside
 * quotes. A file whose name has one is refused with a message saying to point
 * the command at the program's .exe instead, rather than being passed on.
 */

export type LaunchPlan =
  | { kind: 'spawn'; program: string; args: string[] }
  | { kind: 'cmd'; line: string }
  | { kind: 'refused'; message: string }

/** Characters cmd.exe acts on even inside double quotes, or that end the quotes. */
const CMD_UNSAFE = /["%^&|<>!\r\n]/

/** Finds a bare command on PATH the way Windows does, trying each PATHEXT. */
export function resolveOnPath(
  program: string,
  env: { PATH?: string; PATHEXT?: string },
  exists: (file: string) => boolean = existsSync,
): string {
  if (/[\\/]/.test(program)) return program
  const extensions = (env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean)
  const hasExtension = path.extname(program) !== ''
  for (const folder of (env.PATH ?? '').split(';').filter(Boolean)) {
    if (hasExtension && exists(path.win32.join(folder, program))) {
      return path.win32.join(folder, program)
    }
    for (const extension of extensions) {
      const candidate = path.win32.join(folder, program + extension.toLowerCase())
      if (exists(candidate)) return candidate
    }
  }
  return program
}

export function launchPlan(
  program: string,
  args: readonly string[],
  platform: NodeJS.Platform,
  resolve: (program: string) => string,
): LaunchPlan {
  if (platform !== 'win32') return { kind: 'spawn', program, args: [...args] }
  const resolved = resolve(program)
  if (!/\.(cmd|bat)$/i.test(resolved)) return { kind: 'spawn', program: resolved, args: [...args] }
  const parts = [resolved, ...args]
  if (parts.some((part) => CMD_UNSAFE.test(part))) {
    return {
      kind: 'refused',
      message:
        'The command is a .cmd, and this path has a character cmd.exe would act on. Set the command to the program itself (its .exe).',
    }
  }
  // /s strips the outer quotes and leaves each quoted argument as it is.
  return { kind: 'cmd', line: `"${parts.map((part) => `"${part}"`).join(' ')}"` }
}

/**
 * Files the system's own "open" would run rather than show: programs, scripts,
 * shortcuts and installers. With no command set, the pane opens a file the way
 * a double-click in the file manager would, and in a repository just cloned
 * that could be `setup.bat`; such a file is shown in its folder instead, so a
 * pane that only reads never starts one.
 */
const RUNS_ON: Record<string, readonly string[]> = {
  win32: [
    '.exe',
    '.com',
    '.bat',
    '.cmd',
    '.ps1',
    '.psm1',
    '.vbs',
    '.vbe',
    '.js',
    '.jse',
    '.wsf',
    '.wsh',
    '.msc',
    '.msi',
    '.msp',
    '.scr',
    '.pif',
    '.lnk',
    '.url',
    '.hta',
    '.cpl',
    '.reg',
    '.jar',
    '.appref-ms',
    '.application',
    '.scf',
    '.inf',
    '.settingcontent-ms',
  ],
  darwin: [
    '.app',
    '.command',
    '.tool',
    '.terminal',
    '.workflow',
    '.action',
    '.pkg',
    '.mpkg',
    '.jar',
  ],
  linux: ['.desktop', '.appimage', '.run', '.sh', '.jar', '.deb', '.rpm'],
}

export function runsWhenOpened(file: string, platform: NodeJS.Platform): boolean {
  const extension = path.extname(file).toLowerCase()
  return extension !== '' && (RUNS_ON[platform] ?? RUNS_ON.linux ?? []).includes(extension)
}
