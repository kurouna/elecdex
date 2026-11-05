import { execFile } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { replaceFile } from '../store/replace-file.js'

/**
 * The llama-server a crashed elecdex left running (docs/translate.md §4.2). Main keeps the pid of
 * the server it runs in translate/llama-server.pid; on the next start it reads that file before
 * anything is spawned, asks the OS once, without blocking, what the process is, and ends it only
 * when it is a llama-server: a pid is reused, and the number alone could name anything.
 */

export const PID_FILE = 'llama-server.pid'

export interface OrphanDeps {
  /** The process's image name, or null when there is none. */
  processName: (pid: number) => Promise<string | null>
  kill: (pid: number) => void
}

/** The pid left in the file, read at once so a server started next is never taken for it. */
export function readLeftPid(root: string): number | null {
  try {
    const pid = Number.parseInt(readFileSync(path.join(root, PID_FILE), 'utf8').trim(), 10)
    return Number.isSafeInteger(pid) && pid > 0 ? pid : null
  } catch {
    return null
  }
}

/** Ends the left server when it is one; true when it did. */
export async function endOrphan(pid: number | null, deps: OrphanDeps): Promise<boolean> {
  if (pid === null) return false
  const name = await deps.processName(pid).catch(() => null)
  if (!name || !/^llama-server(\.exe)?$/i.test(name)) return false
  try {
    deps.kill(pid)
    return true
  } catch {
    return false
  }
}

/** Writes the pid of the running server, or removes the file when none runs. */
export function writePid(root: string, pid: number | null): void {
  const file = path.join(root, PID_FILE)
  try {
    if (pid === null) {
      rmSync(file, { force: true })
      return
    }
    mkdirSync(root, { recursive: true })
    const temp = `${file}.tmp`
    writeFileSync(temp, String(pid))
    replaceFile(temp, file)
  } catch (error) {
    console.error('[elecdex] translate: could not keep the pid file', error)
  }
}

/** What the OS calls the process: `tasklist` on Windows, `ps` elsewhere, run once and async. */
export function processName(pid: number, platform = process.platform): Promise<string | null> {
  const [file, args] =
    platform === 'win32'
      ? ['tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH']]
      : ['ps', ['-p', String(pid), '-o', 'comm=']]
  return new Promise((resolve) => {
    execFile(file, args as string[], { windowsHide: true, timeout: 10_000 }, (error, stdout) => {
      if (error) {
        resolve(null)
        return
      }
      resolve(parseProcessName(stdout, platform))
    })
  })
}

/** The image name from `tasklist /FO CSV /NH` ("llama-server.exe","1234",...) or `ps -o comm=`. */
export function parseProcessName(stdout: string, platform: string): string | null {
  const line = stdout.trim().split(/\r?\n/)[0]?.trim() ?? ''
  if (!line) return null
  if (platform === 'win32') {
    const match = /^"([^"]+)","\d+"/.exec(line)
    return match?.[1] ?? null
  }
  return path.basename(line)
}
