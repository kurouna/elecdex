import { execFile } from 'node:child_process'
import { mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Puts a fetched llama.cpp archive in place (docs/translate.md §4.1): unpacked with the OS's own
 * `tar` into a fresh temporary folder, everything but llama-server and its libraries removed,
 * llama.cpp's licence written beside it, and only then renamed to its folder, so a half-unpacked
 * folder is never taken for an engine. `tar` runs through `execFile`, never its Sync twin: an
 * 86 MB archive kept main busy for seconds in the PLaMo test app.
 */

export const SERVER_NAME = process.platform === 'win32' ? 'llama-server.exe' : 'llama-server'

/** Windows' own bsdtar opens zip archives too; a Git Bash GNU tar on the PATH would not. */
export function tarPath(platform = process.platform, systemRoot = process.env.SystemRoot): string {
  return platform === 'win32'
    ? path.join(systemRoot ?? 'C:\\Windows', 'System32', 'tar.exe')
    : 'tar'
}

export interface InstallDeps {
  /** Runs a program and resolves when it ends well (async, never Sync). */
  run: (file: string, args: string[]) => Promise<void>
  /** A fresh name for the temporary folder. */
  tempName: () => string
}

export const nodeInstallDeps: InstallDeps = {
  run: (file, args) =>
    new Promise((resolve, reject) => {
      execFile(file, args, { windowsHide: true, timeout: 120_000 }, (error) =>
        error ? reject(error) : resolve(),
      )
    }),
  tempName: () => `engine-tmp-${Math.random().toString(36).slice(2, 10)}`,
}

/**
 * Unpacks `archive` and puts the folder holding llama-server at `dest`. `root` is where the
 * temporary folder is made (translate/), `licence` llama.cpp's LICENSE text.
 */
export async function installEngine(
  archive: string,
  root: string,
  dest: string,
  licence: string,
  deps: InstallDeps = nodeInstallDeps,
): Promise<void> {
  const temp = path.join(root, deps.tempName())
  await rm(temp, { recursive: true, force: true })
  await mkdir(temp, { recursive: true })
  try {
    await deps.run(tarPath(), ['-xf', archive, '-C', temp])
    const found = await findServerDir(temp)
    if (!found) throw new Error('llama-server was not in the archive')
    await prune(found)
    await writeFile(path.join(found, 'LICENSE-llama.cpp'), licence)
    await rm(dest, { recursive: true, force: true })
    await mkdir(path.dirname(dest), { recursive: true })
    await rename(found, dest)
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
}

/** The folder in which llama-server lies, searched down from `dir`. */
export async function findServerDir(dir: string): Promise<string | null> {
  const entries = await readdir(dir, { withFileTypes: true })
  if (entries.some((entry) => entry.isFile() && /^llama-server(\.exe)?$/.test(entry.name)))
    return dir
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const found = await findServerDir(path.join(dir, entry.name))
    if (found) return found
  }
  return null
}

/**
 * Removes the archive's other tools: every program but llama-server, and the `-impl` libraries
 * that belong to them (llama-server's own stays). What is left is the server and the shared
 * libraries it loads.
 */
export async function prune(dir: string): Promise<number> {
  let removed = 0
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue
    const name = entry.name
    if (keeps(name)) continue
    await rm(path.join(dir, name))
    removed++
  }
  return removed
}

export function keeps(name: string): boolean {
  if (name.includes('llama-server')) return true
  if (name.startsWith('LICENSE')) return true
  const program = name.endsWith('.exe') || !name.includes('.')
  const toolLibrary = /-impl\.(dll|so|dylib)$/.test(name)
  return !program && !toolLibrary
}

/** Leftover temporary folders from an interrupted install: removed when the module starts. */
export async function sweepTemps(root: string): Promise<void> {
  let entries: string[]
  try {
    entries = await readdir(root)
  } catch {
    return
  }
  await Promise.all(
    entries
      .filter((name) => name.startsWith('engine-tmp-'))
      .map((name) => rm(path.join(root, name), { recursive: true, force: true })),
  )
}
